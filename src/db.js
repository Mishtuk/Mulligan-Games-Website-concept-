// One SQLite file (node:sqlite, no dependency) in DATA_DIR.
// Admin-edited site content is one JSON document under kv key "state"; the rest are small tables. registrations: src/lib/registrations.js owns the rules.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import seed from './content/series.json' with { type: 'json' };
import storeSeed from './content/store.json' with { type: 'json' };

export function openDb(dir) {
  if (dir !== ':memory:') mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(dir === ':memory:' ? ':memory:' : join(dir, 'mg.db'));
  db.exec('PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');
  db.exec(`CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY CHECK (id = 1), username TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL,
      default_pw INTEGER NOT NULL DEFAULT 0, session_v INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS stats_daily (day TEXT NOT NULL, metric TEXT NOT NULL, item TEXT NOT NULL DEFAULT '', n INTEGER NOT NULL,
      PRIMARY KEY (day, metric, item)) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS security_events (id INTEGER PRIMARY KEY, at INTEGER NOT NULL, type TEXT NOT NULL, who TEXT NOT NULL DEFAULT '',
      ip TEXT NOT NULL DEFAULT '', detail TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS series (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS exceptions (series TEXT NOT NULL, date TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (series, date));
    CREATE TABLE IF NOT EXISTS registrations (id INTEGER PRIMARY KEY, series TEXT NOT NULL, slot TEXT NOT NULL, event_day TEXT NOT NULL, name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', player_id TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('in', 'waitlist', 'cancelled', 'noshow')), wait_pos INTEGER, checked_in INTEGER NOT NULL DEFAULT 0,
      payment TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment IN ('unpaid', 'door', 'online', 'comped', 'credit')), walk_in INTEGER NOT NULL DEFAULT 0,
      token_hash TEXT UNIQUE, created_at INTEGER NOT NULL, promoted_at INTEGER, purged INTEGER NOT NULL DEFAULT 0, undo TEXT);
    CREATE INDEX IF NOT EXISTS registrations_slot ON registrations (series, slot);
    CREATE TABLE IF NOT EXISTS headcount (series TEXT NOT NULL, slot TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (series, slot)) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL CHECK (category IN ('sealed', 'singles', 'accessory', 'miniature', 'paint', 'other')),
      game TEXT NOT NULL DEFAULT '', sku TEXT NOT NULL DEFAULT '', low INTEGER NOT NULL DEFAULT 0, enabled INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS stock_moves (id INTEGER PRIMARY KEY, product INTEGER NOT NULL, qty INTEGER NOT NULL,
      reason TEXT NOT NULL CHECK (reason IN ('received', 'sold', 'counted', 'event', 'prize', 'adjust', 'pickup')), series TEXT, slot TEXT, who TEXT NOT NULL DEFAULT '', at INTEGER NOT NULL, note TEXT NOT NULL DEFAULT '');
    CREATE INDEX IF NOT EXISTS stock_moves_product ON stock_moves (product);
    CREATE TABLE IF NOT EXISTS event_use (series TEXT NOT NULL, product INTEGER NOT NULL, fixed INTEGER, per_seat INTEGER, seats_per_date INTEGER, PRIMARY KEY (series, product)) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS preorders (id INTEGER PRIMARY KEY, product INTEGER NOT NULL, customer TEXT NOT NULL, contact TEXT NOT NULL DEFAULT '', qty INTEGER NOT NULL, deposit INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK (status IN ('waiting', 'arrived', 'picked', 'cancelled')), created_at INTEGER NOT NULL, closed_at INTEGER, pickup_move INTEGER NOT NULL DEFAULT 0, purged INTEGER NOT NULL DEFAULT 0);`);
  if (!db.prepare('PRAGMA table_info(registrations)').all().some((c) => c.name === 'undo')) db.exec('ALTER TABLE registrations ADD COLUMN undo TEXT'); // P2.4b: databases made before cancel Undo
  return db;
}

export const getState = (db) => JSON.parse(db.prepare("SELECT value FROM kv WHERE key = 'state'").get()?.value ?? '{}');
export const setState = (db, state) => db.prepare("INSERT INTO kv (key, value) VALUES ('state', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(JSON.stringify(state));

// ---------- event series and one-date exceptions (src/lib/events.js owns the shape; each row is one JSON document) ----------
/** First run only: copy src/content/series.json in unchanged. A kv flag stops it coming back after staff delete everything. */
export function seedSeries(db) {
  if (db.prepare("SELECT 1 FROM kv WHERE key = 'series_seeded'").get()) return;
  for (const s of seed) putSeries(db, s);
  db.prepare("INSERT INTO kv (key, value) VALUES ('series_seeded', '1')").run();
}
export const listSeries = (db) => db.prepare('SELECT data FROM series ORDER BY rowid').all().map((r) => JSON.parse(r.data));
export const getSeries = (db, id) => { const r = db.prepare('SELECT data FROM series WHERE id = ?').get(id); return r && JSON.parse(r.data); };
export const putSeries = (db, s) => db.prepare('INSERT INTO series (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data').run(s.id, JSON.stringify(s));
export function deleteSeries(db, id) {
  db.prepare('DELETE FROM exceptions WHERE series = ?').run(id);
  db.prepare('DELETE FROM event_use WHERE series = ?').run(id);
  return db.prepare('DELETE FROM series WHERE id = ?').run(id).changes > 0;
}
export const listExceptions = (db, series) => (series === undefined ? db.prepare('SELECT data FROM exceptions ORDER BY series, date').all()
  : db.prepare('SELECT data FROM exceptions WHERE series = ? ORDER BY date').all(series)).map((r) => JSON.parse(r.data));
export const putException = (db, x) => db.prepare('INSERT INTO exceptions (series, date, data) VALUES (?, ?, ?) ON CONFLICT(series, date) DO UPDATE SET data = excluded.data').run(x.series, x.date, JSON.stringify(x));
export const deleteException = (db, series, date) => db.prepare('DELETE FROM exceptions WHERE series = ? AND date = ?').run(series, date).changes > 0;

// ---------- store facts (kv key "store"; src/lib/store.js owns the shape). Seeded once from store.json, then edited in admin; read per request, so edits are live. ----------
export function seedStore(db) {
  if (!db.prepare("SELECT 1 FROM kv WHERE key = 'store'").get()) putStore(db, storeSeed);
}
export const getStore = (db) => JSON.parse(db.prepare("SELECT value FROM kv WHERE key = 'store'").get()?.value ?? JSON.stringify(storeSeed));
export const putStore = (db, facts) => db.prepare("INSERT INTO kv (key, value) VALUES ('store', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(JSON.stringify(facts));

/** Daily copy to DATA_DIR/backup/mg-YYYY-MM-DD.db, keeping the newest 7. Safe while the app runs. */
export function backup(db, dir, now = new Date()) {
  const folder = join(dir, 'backup');
  mkdirSync(folder, { recursive: true });
  const name = `mg-${now.toISOString().slice(0, 10)}.db`;
  const files = readdirSync(folder).filter((f) => /^mg-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort();
  if (!files.includes(name)) { db.exec(`VACUUM INTO '${join(folder, name).replace(/'/g, "''")}'`); files.push(name); }
  for (const f of files.slice(0, -7)) rmSync(join(folder, f), { force: true });
}
