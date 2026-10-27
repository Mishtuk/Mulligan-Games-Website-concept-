// P2.5: stock moves and counts, reservations, low stock, preorder flow and retention, CSV escaping, and hostile input, on an in-memory database; then the admin API over HTTP.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb, putSeries, putException, deleteSeries } from '../src/db.js';
import { cell, csv, status } from '../src/lib/inventory.js';
import * as inv from '../src/lib/inventory.js';

const TODAY = '2026-11-02', NOW = Date.parse('2026-11-02T12:00:00Z');
const XSS = '<script>alert(1)</script>', SQLI = "' OR 1=1 --";
const mk = (db, over = {}) => inv.createProduct(db, { name: 'Draft boosters', category: 'sealed', game: 'magic', sku: '', low: 0, enabled: 1, onHand: 0, ...over }, 'admin', NOW);
const ev = (id, over = {}) => ({ id, title: id, game: 'magic', kind: 'weekly', recurrence: { type: 'none', date: '2026-11-06' }, start: '19:00', signup: 'here', capacity: 24, ...over });
const use = (db, series, rows) => inv.setUse(db, series, inv.cleanUse(db, rows).clean);
const reserve = (db, series, counts = new Map(), look = 14, exceptions = []) => inv.reservations(db, series, exceptions, counts, TODAY, look);

// ---------- count math ----------
test('on hand is the sum of the moves; a sale cannot take it below 0; bad quantities store nothing', () => {
  const db = openDb(':memory:'), p = mk(db);
  assert.equal(inv.move(db, { product: p, qty: 10, reason: 'received', who: 'admin' }, NOW).onHand, 10);
  assert.equal(inv.move(db, { product: p, qty: -3, reason: 'sold' }, NOW).onHand, 7);
  assert.equal(inv.move(db, { product: p, qty: -8, reason: 'prize' }, NOW).error, 'short');
  for (const qty of [0, 1.5, '3', NaN, 1e9]) assert.equal(inv.move(db, { product: p, qty, reason: 'sold' }, NOW).ok, false, String(qty));
  for (const reason of ['bogus', 'constructor', '__proto__', 'toString']) assert.equal(inv.move(db, { product: p, qty: 1, reason }, NOW).error, 'reason', reason);
  assert.equal(inv.move(db, { product: 999, qty: 1, reason: 'sold' }, NOW).error, 'not_found');
  assert.equal(inv.getProduct(db, p).onHand, 7);
  assert.equal(db.prepare('SELECT SUM(qty) n FROM stock_moves WHERE product = ?').get(p).n, 7, 'the cached view equals the sum');
});
test('count now: the shelf count wins and the difference is saved as a "counted" move', () => {
  const db = openDb(':memory:'), p = mk(db, { onHand: 12 });
  assert.equal(inv.getProduct(db, p).onHand, 12, 'the opening count is a move too');
  const r = inv.countTo(db, p, 9, 'admin', NOW);
  assert.equal(r.onHand, 9);
  assert.deepEqual(inv.recentMoves(db, p)[0], { id: r.move, qty: -3, reason: 'counted', series: null, slot: null, who: 'admin', at: NOW, note: '' });
  assert.equal(inv.countTo(db, p, 9, 'admin', NOW).none, true, 'same count: no move');
  assert.equal(inv.countTo(db, p, 14, 'admin', NOW).onHand, 14, 'counting up works too');
  assert.equal(inv.countTo(db, p, 0, 'admin', NOW).onHand, 0);
  for (const n of [-1, 2.5, 'x', '', null]) assert.equal(inv.countTo(db, p, n, 'admin', NOW).error, 'qty', String(n));
  assert.equal(inv.recentMoves(db, p, 2).length, 2, 'only the last N moves are listed');
});
test('product checks: name, kind, game, low number; the opening count is optional', () => {
  const { errors, clean } = inv.cleanProduct({ name: '  ', category: 'x', game: 'nope', low: '-1', onHand: 'a' });
  assert.deepEqual(Object.keys(errors).sort(), ['category', 'game', 'low', 'name', 'onHand']);
  const ok = inv.cleanProduct({ name: 'Sleeves', category: 'accessory', low: '5' });
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.clean.low, 5); assert.equal(ok.clean.onHand, 0); assert.equal(ok.clean.enabled, 1);
  assert.ok(clean.name === '');
});

// ---------- reservations ----------
test('reservation math: fixed, per seat x cap, seats-per-date guess, then sign-ups when there is no cap', () => {
  const db = openDb(':memory:'), draft = mk(db), prize = mk(db, { name: 'Prize packs' });
  const series = [ev('fnm'), ev('open', { capacity: undefined, recurrence: { type: 'none', date: '2026-11-07' } }), ev('pre', { capacity: undefined, recurrence: { type: 'none', date: '2026-11-08' } })];
  use(db, 'fnm', [{ product: draft, perSeat: 3 }, { product: prize, fixed: 10 }]);
  use(db, 'open', [{ product: draft, perSeat: 3 }]);
  use(db, 'pre', [{ product: draft, perSeat: 3, seatsPerDate: 8 }]);
  const lines = reserve(db, series, new Map([['open|2026-11-07', { taken: 5, waiting: 0 }]]));
  const q = (p, s) => lines.find((l) => l.product === p && l.series === s)?.qty;
  assert.equal(q(draft, 'fnm'), 72, '3 x 24 seats');
  assert.equal(q(prize, 'fnm'), 10, 'fixed');
  assert.equal(q(draft, 'open'), 15, 'no cap: 3 x 5 sign-ups so far');
  assert.equal(q(draft, 'pre'), 24, 'no cap, none signed up: 3 x the seats-per-date guess');
  const pic = inv.picture(db, { series, exceptions: [], counts: new Map(), today: TODAY, look: 14 });
  const d = pic.products.find((x) => x.id === draft);
  assert.equal(d.reserved, 72 + 0 + 24, 'the open night has no counts here');
  assert.equal(d.reservations.length, 2);
});
test('reservations: cancelled dates, past dates, dates past the window and hidden events are left out; per-seat with no seats is 0', () => {
  const db = openDb(':memory:'), p = mk(db);
  const series = [ev('a'), ev('far', { recurrence: { type: 'none', date: '2026-12-20' } }), ev('past', { recurrence: { type: 'none', date: '2026-10-30' } }), ev('off', { enabled: false }), ev('zero', { capacity: undefined })];
  for (const s of series) use(db, s.id, [{ product: p, perSeat: 2 }]);
  assert.deepEqual(reserve(db, series).map((l) => l.series), ['a'], 'only the one inside the next 14 days that is shown, has seats');
  assert.deepEqual(reserve(db, series, new Map(), 60).map((l) => l.series).sort(), ['a', 'far']);
  assert.deepEqual(reserve(db, series, new Map(), 14, [{ series: 'a', date: '2026-11-06', type: 'cancel' }]), [], 'a cancelled date reserves nothing');
  assert.equal(reserve(db, series, new Map(), 14, [{ series: 'a', date: '2026-11-06', type: 'change', capacity: 10 }])[0].qty, 20, 'a changed cap is used');
});
test('short means reserved > on hand (equal is fine); free = on hand - reserved; the event use goes when its event does', () => {
  const db = openDb(':memory:'), p = mk(db, { onHand: 72 }), series = [ev('fnm')];
  use(db, 'fnm', [{ product: p, perSeat: 3 }]);
  let d = inv.picture(db, { series, exceptions: [], counts: new Map(), today: TODAY, look: 14 }).products[0];
  assert.deepEqual([d.reserved, d.free, d.short], [72, 0, false]);
  inv.move(db, { product: p, qty: -1, reason: 'sold' }, NOW);
  d = inv.picture(db, { series, exceptions: [], counts: new Map(), today: TODAY, look: 14 }).products[0];
  assert.deepEqual([d.reserved, d.free, d.short], [72, -1, true]);
  putSeries(db, ev('fnm')); deleteSeries(db, 'fnm');
  assert.equal(inv.listUse(db, 'fnm').length, 0, 'deleting the event deletes its stock use');
});
test('event use checks: one of fixed or per seat, whole numbers, known products, no repeats', () => {
  const db = openDb(':memory:'), p = mk(db);
  const bad = (rows) => assert.ok(inv.cleanUse(db, rows).error, JSON.stringify(rows));
  bad([{ product: p }]); bad([{ product: p, fixed: 1, perSeat: 1 }]); bad([{ product: p, fixed: 0 }]); bad([{ product: p, fixed: 1.5 }]); bad([{ product: 99, fixed: 1 }]);
  bad([{ product: p, fixed: 1 }, { product: p, perSeat: 1 }]); bad('x'); bad([{ product: p, perSeat: 2, seatsPerDate: 0 }]);
  assert.deepEqual(inv.cleanUse(db, [{ product: p, perSeat: '3' }]).clean, [{ product: p, fixed: null, perSeat: 3, seatsPerDate: null }]);
});

// ---------- low stock ----------
test('low-stock trigger: at or under the number; 0 means no alert; hidden products are not counted', () => {
  assert.equal(status(5, 5).lowNow, true); assert.equal(status(6, 5).lowNow, false); assert.equal(status(0, 0).lowNow, false, 'no alert set');
  assert.equal(status(0, 3).out, true);
  const db = openDb(':memory:'), a = mk(db, { name: 'A', low: 5, onHand: 5 }), b = mk(db, { name: 'B', low: 5, onHand: 6 }), c = mk(db, { name: 'C', low: 5, onHand: 1, enabled: 0 });
  const args = { series: [], exceptions: [], counts: new Map(), today: TODAY, look: 14 };
  assert.equal(inv.picture(db, args).alerts.low, 1);
  inv.move(db, { product: b, qty: -1, reason: 'sold' }, NOW);
  assert.equal(inv.picture(db, args).alerts.low, 2, 'a sale crosses the line');
  inv.move(db, { product: a, qty: 1, reason: 'received' }, NOW);
  assert.equal(inv.picture(db, args).alerts.low, 1, 'receiving stock clears it');
  assert.ok(c);
});

// ---------- preorders ----------
const order = (db, product, over = {}) => inv.createPreorder(db, inv.cleanPreorder(db, { product, customer: 'Sam Baker', contact: '215-789-3299', qty: 2, deposit: 20, ...over }).clean, NOW);
test('preorder status flow: waiting > arrived > picked up (takes stock off) or cancelled; skipping a step is refused; undo puts stock back', () => {
  const db = openDb(':memory:'), p = mk(db, { onHand: 5 }), o = order(db, p);
  assert.equal(o.status, 'waiting');
  assert.equal(inv.setStatus(db, o.id, 'picked', 'admin', NOW).error, 'flow', 'waiting cannot go straight to picked up');
  assert.equal(inv.setStatus(db, o.id, 'nonsense', 'admin', NOW).error, 'flow');
  assert.equal(inv.arrivedCount(db), 0);
  assert.equal(inv.setStatus(db, o.id, 'arrived', 'admin', NOW).order.status, 'arrived');
  assert.equal(inv.arrivedCount(db), 1);
  const r = inv.setStatus(db, o.id, 'picked', 'admin', NOW);
  assert.deepEqual([r.order.status, r.stockNote, inv.getProduct(db, p).onHand, r.order.closedAt], ['picked', null, 3, NOW]);
  assert.equal(inv.recentMoves(db, p)[0].reason, 'pickup');
  assert.equal(inv.setStatus(db, o.id, 'picked', 'admin', NOW).order.status, 'picked', 'same status again: no second move');
  assert.equal(inv.getProduct(db, p).onHand, 3);
  const back = inv.setStatus(db, o.id, 'arrived', 'admin', NOW);
  assert.deepEqual([back.order.status, inv.getProduct(db, p).onHand, back.order.closedAt], ['arrived', 5, null], 'going back puts the stock back and reopens it');
  assert.equal(inv.setStatus(db, o.id, 'cancelled', 'admin', NOW).order.status, 'cancelled');
  assert.equal(inv.setStatus(db, o.id, 'picked', 'admin', NOW).error, 'flow');
  assert.equal(inv.setStatus(db, o.id, 'waiting', 'admin', NOW).order.status, 'waiting');
  assert.equal(inv.setStatus(db, 999, 'arrived', 'admin', NOW).error, 'not_found');
});
test('picked up with too little on the shelf still closes the order and says stock was not reduced; undoing it adds nothing', () => {
  const db = openDb(':memory:'), p = mk(db, { onHand: 1 }), o = order(db, p, { qty: 3 });
  inv.setStatus(db, o.id, 'arrived', 'admin', NOW);
  const r = inv.setStatus(db, o.id, 'picked', 'admin', NOW);
  assert.deepEqual([r.order.status, r.stockNote, inv.getProduct(db, p).onHand], ['picked', 'Stock was not reduced: only 1 on hand.', 1]);
  inv.setStatus(db, o.id, 'arrived', 'admin', NOW);
  assert.equal(inv.getProduct(db, p).onHand, 1);
});
test('"mark all waiting as arrived" changes only that product\'s waiting orders', () => {
  const db = openDb(':memory:'), a = mk(db), b = mk(db, { name: 'B' });
  const [o1, o2, o3] = [order(db, a), order(db, a), order(db, b)];
  inv.setStatus(db, o2.id, 'cancelled', 'admin', NOW);
  assert.deepEqual(inv.arriveAll(db, a), [o1.id]);
  assert.deepEqual(inv.listPreorders(db).map((o) => [o.id, o.status]).sort(), [[o1.id, 'arrived'], [o2.id, 'cancelled'], [o3.id, 'waiting']]);
  assert.deepEqual(inv.arriveAll(db, a), [], 'again: nothing left');
  assert.deepEqual(inv.arriveAll(db, a, [o1.id, o2.id, o3.id]), [o1.id], "undo: only this product's arrived orders from the list go back");
  assert.equal(inv.listPreorders(db).find((o) => o.id === o1.id).status, 'waiting');
});
test('preorder checks: product, name, a phone or an email, whole quantity and dollars; "a product that is not listed" makes one', () => {
  const db = openDb(':memory:'), p = mk(db), f = (o) => inv.cleanPreorder(db, { product: p, customer: 'Al', contact: 'al@x.com', qty: 1, ...o });
  assert.deepEqual(Object.keys(inv.cleanPreorder(db, {}).errors).sort(), ['contact', 'customer', 'product', 'qty']);
  for (const c of ['12345', '<b>x</b>', 'a@b', 'call me', XSS]) assert.ok(f({ contact: c }).errors.contact, c);
  for (const c of ['(215) 789-3299', '+1 215 789 3299', 'al@x.com']) assert.ok(!f({ contact: c }).errors, c);
  assert.ok(f({ qty: 0 }).errors.qty && f({ qty: 1.5 }).errors.qty && f({ deposit: -5 }).errors.deposit && f({ deposit: '1.5' }).errors.deposit);
  const n = inv.cleanPreorder(db, { product: 'new', newProduct: 'Mystery box', customer: 'Al', contact: 'al@x.com', qty: 1 });
  const o = inv.createPreorder(db, n.clean, NOW);
  assert.equal(inv.getProduct(db, o.product).name, 'Mystery box');
  assert.ok(inv.cleanPreorder(db, { product: 'new', newProduct: ' ', customer: 'Al', contact: 'al@x.com', qty: 1 }).errors.newProduct);
});
test('retention: the contact of a picked up or cancelled order is wiped N days after it closed, the name shrinks, open orders keep theirs, and a wiped order stays closed', () => {
  const db = openDb(':memory:'), p = mk(db, { onHand: 9 }), day = 864e5, N = inv.PREORDER_RETENTION_DAYS;
  const [done, gone, open] = [order(db, p), order(db, p, { customer: 'Riley Moss' }), order(db, p)];
  inv.setStatus(db, done.id, 'arrived', 'a', NOW); inv.setStatus(db, done.id, 'picked', 'a', NOW);
  inv.setStatus(db, gone.id, 'cancelled', 'a', NOW + day);
  assert.equal(inv.purgePreorders(db, NOW + (N - 1) * day), 0, 'one day early: nothing');
  assert.equal(inv.purgePreorders(db, NOW + N * day), 1, 'the picked up one');
  assert.equal(inv.purgePreorders(db, NOW + (N + 1) * day), 1, 'the cancelled one a day later');
  assert.equal(inv.purgePreorders(db, NOW + 99 * day), 0, 'safe to run again');
  const by = Object.fromEntries(inv.listPreorders(db).map((o) => [o.id, o]));
  assert.deepEqual([by[done.id].customer, by[done.id].contact, by[done.id].purged, by[done.id].deposit, by[done.id].qty], ['S. B.', '', true, 20, 2]);
  assert.deepEqual([by[gone.id].customer, by[gone.id].contact], ['R. M.', '']);
  assert.deepEqual([by[open.id].customer, by[open.id].contact], ['Sam Baker', '215-789-3299']);
  assert.equal(inv.setStatus(db, done.id, 'arrived', 'a', NOW).error, 'purged');
});
test('a product with open preorders cannot be deleted; otherwise its moves, use and closed orders go with it', () => {
  const db = openDb(':memory:'), p = mk(db, { onHand: 4 }), o = order(db, p);
  use(db, 'x', [{ product: p, fixed: 2 }]);
  assert.equal(inv.deleteProduct(db, p).error, 'has_preorders');
  inv.setStatus(db, o.id, 'cancelled', 'a', NOW);
  assert.equal(inv.deleteProduct(db, p).ok, true);
  for (const t of ['products', 'stock_moves', 'event_use', 'preorders']) assert.equal(db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n, 0, t);
});

// ---------- CSV ----------
test('CSV: cells starting with = + - @ get a leading quote; commas, quotes and line breaks are quoted; numbers stay numbers', () => {
  for (const x of ['=1+1', '+1', '-2', '@SUM(A1)', '=HYPERLINK("http://evil","x")', '\t=1', '\r=1']) assert.ok(cell(x).replace(/^"/, '').startsWith("'"), x);
  assert.equal(cell('=1+1'), "'=1+1");
  assert.equal(cell('a,b'), '"a,b"'); assert.equal(cell('say "hi"'), '"say ""hi"""'); assert.equal(cell('two\nlines'), '"two\nlines"');
  assert.equal(cell("=A1,B1"), `"'=A1,B1"`);
  assert.equal(cell(42), '42'); assert.equal(cell(0), '0'); assert.equal(cell(null), ''); assert.equal(cell('plain'), 'plain');
  assert.equal(csv([['a', 1], ['=b', 'c,d']]), "a,1\r\n'=b,\"c,d\"\r\n");
  const db = openDb(':memory:');
  mk(db, { name: '=cmd|\'/c calc\'!A1', sku: '@x', onHand: 3 });
  const [head, row] = inv.exportRows(db);
  assert.deepEqual(head, ['name', 'category', 'game', 'sku', 'on_hand', 'low_at', 'shown']);
  assert.equal(csv([row]).startsWith("'=cmd"), true);
  assert.ok(csv([row]).includes(",'@x,3,"));
});

// ---------- hostile input ----------
test('hostile text is stored as typed, never run as SQL, and every table survives', () => {
  const db = openDb(':memory:');
  for (const s of [XSS, SQLI, "x'); DROP TABLE products; --"]) {
    const p = mk(db, { name: s, sku: s });
    assert.equal(inv.getProduct(db, p).name, s);
    inv.move(db, { product: p, qty: 1, reason: 'received', note: s, who: s }, NOW);
    assert.equal(inv.recentMoves(db, p)[0].note, s);
    const o = inv.createPreorder(db, { product: p, customer: s, contact: '215-789-3299', qty: 1, deposit: 0, newProduct: '' }, NOW);
    assert.equal(o.customer, s);
  }
  assert.equal(inv.listProducts(db).length, 3);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM preorders').get().n, 3);
  assert.equal(inv.setStatus(db, `1 OR 1=1`, 'arrived', 'a', NOW).error, 'not_found', 'an id that is not a number finds nothing');
  assert.deepEqual(inv.arriveAll(db, SQLI), []);
  assert.equal(inv.countTo(db, 1, SQLI, 'a', NOW).error, 'qty');
});
test('the inventory screens build every product, customer and contact with DOM calls and textContent (security.test.js guards innerHTML)', () => {
  const src = readFileSync(new URL('../src/pages/admin.astro', import.meta.url), 'utf8');
  assert.ok(!/set:html|insertAdjacentHTML|document\.write|outerHTML/.test(src.slice(src.indexOf('// ---------- inventory'))), 'the inventory screens use none of the HTML-string APIs');
});

// ---------- over HTTP ----------
const tmp = mkdtempSync(join(tmpdir(), 'mg-inv-')), dist = join(tmp, 'dist'), data = join(tmp, 'data');
let proc, origin, cookie = '';
before(async () => {
  mkdirSync(join(dist, 'admin'), { recursive: true });
  writeFileSync(join(dist, 'index.html'), '<main>home</main>'); writeFileSync(join(dist, 'admin', 'index.html'), '<p>admin</p>');
  const db = openDb(data);
  db.prepare("INSERT INTO kv (key, value) VALUES ('series_seeded', '1')").run();
  putSeries(db, ev('fnm', { recurrence: { type: 'weekly', day: 5 } }));
  db.close();
  proc = spawn(process.execPath, ['server.js'], { cwd: join(import.meta.dirname, '..'), env: { ...process.env, PORT: '0', DATA_DIR: data, DIST_DIR: dist, ALLOW_DEFAULT_ADMIN: '1', NODE_ENV: 'test' } });
  proc.stderr.on('data', (d) => process.stderr.write(d));
  const port = await new Promise((ok, no) => { proc.stdout.on('data', (d) => { const m = /\(port (\d+),/.exec(String(d)); if (m) ok(+m[1]); }); proc.on('exit', (c) => no(new Error(`server exited ${c}`))); });
  origin = `http://localhost:${port}`;
  const r = await fetch(`${origin}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ username: 'admin', password: 'admin' }) });
  cookie = r.headers.get('set-cookie').split(';')[0];
});
after(() => { proc?.kill(); try { rmSync(tmp, { recursive: true, force: true }); } catch {} });
const api = (method, path, body, headers = { Origin: origin, Cookie: cookie }) => fetch(`${origin}/api/admin/inventory/${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
const j = async (method, path, body) => { const r = await api(method, path, body); return { status: r.status, ...(await r.json()) }; };

test('HTTP: signed out is 401, a write without the site origin is 403', async () => {
  assert.equal((await api('GET', '', null, {})).status, 401);
  assert.equal((await api('GET', 'products.csv', null, {})).status, 401);
  assert.equal((await api('GET', 'preorders', null, {})).status, 401);
  assert.equal((await api('POST', 'products', { name: 'x', category: 'sealed' }, { Cookie: cookie })).status, 403);
  assert.equal((await api('POST', 'preorders', {}, { Cookie: cookie, Origin: 'http://evil.example' })).status, 403);
  assert.equal((await api('POST', 'products/1/moves', { qty: 1, reason: 'received' }, { Cookie: cookie })).status, 403);
});
test('HTTP: products, moves, counts, event use and the alert summary', async () => {
  const bad = await j('POST', 'products', { name: '', category: 'nope', low: -1 });
  assert.equal(bad.status, 422); assert.ok(bad.errors.name && bad.errors.category && bad.errors.low);
  const a = await j('POST', 'products', { name: 'Draft boosters', category: 'sealed', game: 'magic', low: 20, onHand: 10 });
  assert.equal(a.status, 201); assert.equal(a.product.onHand, 10);
  const id = a.product.id;
  assert.equal((await j('POST', `products/${id}/moves`, { qty: -4, reason: 'sold' })).product.onHand, 6);
  const over = await j('POST', `products/${id}/moves`, { qty: -40, reason: 'prize' });
  assert.equal(over.status, 422); assert.equal(over.message, 'Only 6 on hand.');
  assert.equal((await j('POST', `products/${id}/moves`, { qty: 5, reason: 'x' })).status, 422);
  assert.equal((await j('POST', `products/${id}/count`, { n: 8 })).product.onHand, 8);
  assert.equal((await j('POST', `products/${id}/count`, { n: 'abc' })).status, 422);
  assert.equal((await j('POST', 'products/99/count', { n: 1 })).status, 404);
  // event use: FNM is every Friday with 24 seats; 3 per seat = 72 against 8 on hand
  const put = await j('PUT', 'use/fnm', { use: [{ product: id, perSeat: 3 }] });
  assert.equal(put.status, 200); assert.equal(put.use.length, 1);
  assert.equal((await j('PUT', 'use/fnm', { use: [{ product: id }] })).status, 422);
  assert.equal((await j('PUT', 'use/nope', { use: [] })).status, 404);
  const inUse = await j('GET', 'use/fnm');
  assert.deepEqual(inUse.use, [{ product: id, fixed: null, perSeat: 3, seatsPerDate: null }]);
  const row = inUse.products.find((p) => p.id === id);
  assert.ok(row.reserved >= 72 && row.short === true, 'two Fridays or one, 72 or more reserved against 8: short');
  const all = await j('GET', '?look=7');
  assert.equal(all.look, 7); assert.ok(all.products[0].moves.length >= 3 && all.cats.includes('paint') && all.games.length > 3);
  assert.equal((await j('GET', '?look=999')).look, 14, 'a look-ahead that is not on the list falls back to 14');
  const sum = await j('GET', 'summary');
  assert.deepEqual([sum.low, sum.arrived], [1, 0]); assert.ok(sum.short >= 1);
  const edit = await j('PUT', `products/${id}`, { name: 'Draft boosters', category: 'sealed', game: 'magic', low: 0 });
  assert.equal(edit.product.low, 0);
  assert.equal((await j('GET', 'summary')).low, 0, 'low 0 = no alert');
});
test('HTTP: preorders, the arrived list, retention and that the contact stays admin-only', async () => {
  const p = (await j('POST', 'products', { name: 'Elite Trainer Box', category: 'sealed', onHand: 3 })).product;
  assert.equal((await j('POST', 'preorders', { product: p.id, customer: '', contact: 'x', qty: 0 })).status, 422);
  const o = (await j('POST', 'preorders', { product: p.id, customer: 'Casey T.', contact: '215-555-0142', qty: 1, deposit: 20 })).preorder;
  assert.equal(o.status, 'waiting');
  assert.equal((await j('POST', `preorders/${o.id}/status`, { status: 'picked' })).status, 409);
  const ids = (await j('POST', 'preorders/arrive-all', { product: p.id })).ids;
  assert.deepEqual((await j('POST', 'preorders/arrive-all', { product: p.id, undo: ids })).ids, ids, 'undo in one call');
  assert.equal((await j('POST', 'preorders/arrive-all', { product: p.id, undo: 'x' })).status, 400);
  assert.equal((await j('POST', 'preorders/arrive-all', { product: p.id })).ids.length, 1);
  assert.equal((await j('POST', `products/${p.id}/moves`, { qty: 1, reason: 'constructor' })).status, 422, 'not a 500');
  assert.equal((await j('GET', 'summary')).arrived, 1);
  const list = await j('GET', 'preorders');
  assert.deepEqual(list.preorders.filter((x) => x.status === 'arrived').map((x) => [x.customer, x.contact, x.productName]), [['Casey T.', '215-555-0142', 'Elite Trainer Box']]);
  const picked = await j('POST', `preorders/${o.id}/status`, { status: 'picked' });
  assert.equal(picked.preorder.status, 'picked'); assert.equal(picked.stockNote, null);
  assert.equal((await j('GET', `?look=14`)).products.find((x) => x.id === p.id).onHand, 2);
  assert.equal((await j('DELETE', `products/${p.id}`)).status, 200, 'closed orders do not block deleting');
  for (const path of ['/', '/admin/', '/events/', '/api/admin/inventory/preorders']) { // nothing public shows it
    const t = await (await fetch(origin + path)).text();
    assert.ok(!t.includes('215-555-0142') && !t.includes('Casey'), path);
  }
});
test('HTTP: hostile text comes back as the same JSON string, nothing is run, and the CSV is injection safe', async () => {
  const p = (await j('POST', 'products', { name: XSS, category: 'other', sku: SQLI, onHand: 1 })).product;
  const q = (await j('POST', 'products', { name: '=HYPERLINK("http://evil.example","x")', category: 'other', sku: '@x' })).product;
  assert.equal(p.name, XSS); assert.equal(p.sku, SQLI);
  const o = await j('POST', 'preorders', { product: p.id, customer: SQLI, contact: '215-555-0100', qty: 1 });
  assert.equal(o.preorder.customer, SQLI);
  assert.equal((await j('POST', 'preorders', { product: p.id, customer: 'A', contact: XSS, qty: 1 })).status, 422, 'a script in the contact is refused');
  assert.equal((await j('POST', `products/${p.id}/moves`, { qty: 1, reason: 'received', note: XSS })).status, 200);
  assert.equal((await j('POST', `products/${SQLI}/moves`, { qty: 1, reason: 'received' })).status, 404);
  assert.equal((await j('POST', `preorders/${encodeURIComponent('1 OR 1=1')}/status`, { status: 'arrived' })).status, 404);
  const all = await j('GET', '');
  assert.ok(all.products.some((x) => x.name === XSS && x.moves[0].note === XSS) && all.products.length >= 2);
  const r = await api('GET', 'products.csv');
  assert.equal(r.headers.get('content-type'), 'text/csv; charset=utf-8');
  assert.ok(r.headers.get('content-disposition').includes('attachment'));
  const t = await r.text();
  assert.ok(t.startsWith('name,category,game,sku,on_hand,low_at,shown\r\n'));
  assert.ok(t.includes(`"'=HYPERLINK(""http://evil.example"",""x"")"`) && t.includes(",'@x,"), t);
  assert.ok(!/^[=+\-@]/m.test(t.split('\r\n').slice(1).join('\n')), 'no line starts with a formula character');
  assert.ok(q.id);
});
