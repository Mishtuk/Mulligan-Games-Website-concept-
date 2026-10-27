// Inventory and preorders (P2.5; DECISIONS D7, D8; DESIGN.md 9.5, 9.6). Rules ported from prototype/js/stock.js. SQL: `?` placeholders only.
// On hand = the sum of a product's stock moves. Every change runs in one BEGIN IMMEDIATE transaction (tx from registrations.js).
import { GAME_IDS } from './games.js';
import { occurrences } from './events.js';
import { initials, line, tx } from './registrations.js';

export const CATS = ['sealed', 'singles', 'accessory', 'miniature', 'paint', 'other'];
export const REASONS = { received: 'Received', sold: 'Sold', counted: 'Counted', event: 'Used at an event', prize: 'Prize', adjust: 'Adjusted', pickup: 'Preorder pickup' };
export const LOOKS = [7, 14, 30, 60];
export const PREORDER = ['waiting', 'arrived', 'picked', 'cancelled'];
const FLOW = { waiting: ['arrived', 'cancelled'], arrived: ['waiting', 'picked', 'cancelled'], picked: ['arrived', 'waiting'], cancelled: ['waiting', 'arrived'] };
export const canMove = (from, to) => from === to || (FLOW[from] ?? []).includes(to);
/** Preorder contact details are wiped this many days after the order was picked up or cancelled (proposed owner rule, same N as sign-ups). */
export const PREORDER_RETENTION_DAYS = 30;
const MAX_QTY = 100000;
/** A whole number typed as a number or as digits; anything else (text, negative, decimal, blank) is NaN. */
const num = (v) => (typeof v === 'number' ? v : typeof v === 'string' && /^\d{1,9}$/.test(v.trim()) ? Number(v) : NaN);
const int = (v, lo, hi) => { const n = num(v); return Number.isInteger(n) && n >= lo && n <= hi; };
const blank = (v) => v === undefined || v === null || v === '';

// ---------- pure rules ----------
/** Low: on hand at or under the product's low number (0 = no alert). Short: reserved is more than on hand. Out: nothing on hand. */
export const status = (onHand, low, reserved = 0) => ({ out: onHand <= 0, lowNow: low > 0 && onHand <= low, short: reserved > onHand, reserved, free: onHand - reserved });
/** What one event date takes: a fixed qty, or per seat x seats (the date's cap, else the "seats per date" guess, else the sign-ups so far). */
export const useQty = (u, cap, taken) => (u.fixed != null ? u.fixed : (u.perSeat ?? 0) * (cap || u.seatsPerDate || taken || 0));
/** CSV-injection safe cell: a text starting with = + - @ (or tab / CR) gets a leading ', then quoted when it holds , " or a line break. */
export function cell(v) {
  if (typeof v === 'number') return String(v);
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export const csv = (rows) => rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';

// ---------- field checks ----------
/** { errors, clean } for a product form. `onHand` (the opening count) only matters on create. */
export function cleanProduct(b) {
  const e = {}, name = line(b?.name, 100), low = blank(b?.low) ? 0 : num(b.low);
  if (!name) e.name = 'Give the product a name.';
  if (!CATS.includes(b?.category)) e.category = 'Pick what kind it is.';
  if (!blank(b?.game) && !GAME_IDS.has(b.game)) e.game = 'Pick a game from the list.';
  if (!int(low, 0, MAX_QTY)) e.low = 'Use a whole number, 0 or more.';
  if (!blank(b?.onHand) && !int(b.onHand, 0, MAX_QTY)) e.onHand = 'Use a whole number, 0 or more.';
  return { errors: e, clean: { name, category: b?.category, game: blank(b?.game) ? '' : b.game, sku: line(b?.sku, 40), low, enabled: b?.enabled === false ? 0 : 1, onHand: blank(b?.onHand) ? 0 : num(b.onHand) } };
}
const validContact = (c) => (c.includes('@') ? /^[^@\s<>"']+@[^@\s<>"']+\.[^@\s<>"']+$/.test(c) : /^[0-9 ()+.-]{7,30}$/.test(c) && c.replace(/\D/g, '').length >= 7 && c.replace(/\D/g, '').length <= 15);

// ---------- products and stock moves ----------
const SQL_ON_HAND = 'COALESCE((SELECT SUM(m.qty) FROM stock_moves m WHERE m.product = p.id), 0)';
const pview = (r) => r && ({ id: r.id, name: r.name, category: r.category, game: r.game, sku: r.sku, low: r.low, enabled: !!r.enabled, onHand: r.on_hand });
export const getProduct = (db, id) => pview(db.prepare(`SELECT p.*, ${SQL_ON_HAND} AS on_hand FROM products p WHERE p.id = ?`).get(Number.isInteger(id) ? id : -1));
export const listProducts = (db) => db.prepare(`SELECT p.*, ${SQL_ON_HAND} AS on_hand FROM products p ORDER BY p.category, p.name COLLATE NOCASE, p.id`).all().map(pview);
export const recentMoves = (db, id, n = 10) => db.prepare('SELECT id, qty, reason, series, slot, who, at, note FROM stock_moves WHERE product = ? ORDER BY id DESC LIMIT ?').all(id, n).map((m) => ({ ...m }));

/** Inside a transaction. Refuses a move that would take on hand below 0. */
function addMove(db, { product, qty, reason, who = '', note = '', series = null, slot = null }, now = Date.now()) {
  const p = getProduct(db, product);
  if (!p) return { ok: false, error: 'not_found' };
  if (!Object.hasOwn(REASONS, reason)) return { ok: false, error: 'reason' }; // not `in`: 'constructor' would pass and hit the CHECK (500)
  if (!Number.isInteger(qty) || qty === 0 || Math.abs(qty) > MAX_QTY) return { ok: false, error: 'qty' };
  if (p.onHand + qty < 0) return { ok: false, error: 'short', onHand: p.onHand };
  const r = db.prepare('INSERT INTO stock_moves (product, qty, reason, series, slot, who, at, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(product, qty, reason, series, slot, line(who, 64), now, line(note, 200));
  return { ok: true, move: Number(r.lastInsertRowid), onHand: p.onHand + qty };
}
export const move = (db, m, now) => tx(db, () => addMove(db, m, now));
/** "Count now": the shelf count wins; the difference is saved as a "counted" move. */
export const countTo = (db, product, n, who, now) => tx(db, () => {
  const p = getProduct(db, product);
  if (!p) return { ok: false, error: 'not_found' };
  if (!int(n, 0, MAX_QTY)) return { ok: false, error: 'qty' };
  const diff = num(n) - p.onHand;
  return diff === 0 ? { ok: true, none: true, onHand: p.onHand } : addMove(db, { product, qty: diff, reason: 'counted', who }, now);
});
export const createProduct = (db, c, who, now) => tx(db, () => {
  const id = Number(db.prepare('INSERT INTO products (name, category, game, sku, low, enabled) VALUES (?, ?, ?, ?, ?, ?)').run(c.name, c.category, c.game, c.sku, c.low, c.enabled).lastInsertRowid);
  if (c.onHand > 0) addMove(db, { product: id, qty: c.onHand, reason: 'counted', who, note: 'Opening count' }, now);
  return id;
});
export const updateProduct = (db, id, c) => db.prepare('UPDATE products SET name = ?, category = ?, game = ?, sku = ?, low = ?, enabled = ? WHERE id = ?').run(c.name, c.category, c.game, c.sku, c.low, c.enabled, id).changes > 0;
/** Refused while an order is still waiting or arrived. Otherwise the product, its moves, its event use and its closed preorders go. */
export const deleteProduct = (db, id) => tx(db, () => {
  if (!getProduct(db, id)) return { ok: false, error: 'not_found' };
  if (db.prepare("SELECT 1 FROM preorders WHERE product = ? AND status IN ('waiting', 'arrived')").get(id)) return { ok: false, error: 'has_preorders' };
  for (const t of ['stock_moves', 'event_use', 'preorders']) db.prepare(`DELETE FROM ${t} WHERE product = ?`).run(id); // fixed table names, no input
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return { ok: true };
});

// ---------- what events will use ----------
export const listUse = (db, series) => db.prepare('SELECT product, fixed, per_seat, seats_per_date FROM event_use WHERE series = ? ORDER BY product').all(series).map((r) => ({ product: r.product, fixed: r.fixed, perSeat: r.per_seat, seatsPerDate: r.seats_per_date }));
/** Rows: { product, fixed | perSeat, seatsPerDate? }. Returns { error } or { clean }. */
export function cleanUse(db, rows) {
  if (!Array.isArray(rows) || rows.length > 20) return { error: 'Use at most 20 products per event.' };
  const seen = new Set(), clean = [];
  for (const r of rows) {
    const id = num(r?.product);
    if (!Number.isInteger(id) || !getProduct(db, id)) return { error: 'One of the products is gone. Reload and try again.' };
    if (seen.has(id)) return { error: 'A product is listed twice.' };
    seen.add(id);
    const fixed = blank(r.fixed) ? null : num(r.fixed), perSeat = blank(r.perSeat) ? null : num(r.perSeat), spd = blank(r.seatsPerDate) ? null : num(r.seatsPerDate);
    if ((fixed === null) === (perSeat === null)) return { error: 'Each product needs a fixed number or a number per seat.' };
    for (const n of [fixed, perSeat]) if (n !== null && !int(n, 1, 9999)) return { error: 'Use a whole number, 1 or more.' };
    if (spd !== null && !int(spd, 1, 999)) return { error: 'Seats per date: a whole number, 1 or more.' };
    clean.push({ product: id, fixed, perSeat, seatsPerDate: spd });
  }
  return { clean };
}
export const setUse = (db, series, rows) => tx(db, () => {
  db.prepare('DELETE FROM event_use WHERE series = ?').run(series);
  const ins = db.prepare('INSERT INTO event_use (series, product, fixed, per_seat, seats_per_date) VALUES (?, ?, ?, ?, ?)');
  for (const r of rows) ins.run(series, r.product, r.fixed, r.perSeat, r.seatsPerDate);
});

const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
/** Every upcoming date (today up to `look` days ahead, cancelled ones skipped) that uses stock: [{ product, series, title, slot, date, qty, fixed }].
 *  counts = registrations countsMap(db), for the sign-ups of events with no seat limit. */
export function reservations(db, series, exceptions, counts, today, look) {
  const uses = db.prepare('SELECT series, product, fixed, per_seat, seats_per_date FROM event_use').all(), lines = [];
  for (const s of series) {
    const mine = uses.filter((u) => u.series === s.id).map((u) => ({ product: u.product, fixed: u.fixed, perSeat: u.per_seat, seatsPerDate: u.seats_per_date }));
    if (!mine.length || s.enabled === false) continue;
    for (const o of occurrences(s, today, addDays(today, look), exceptions)) {
      if (o.cancelled) continue;
      const taken = counts.get(`${s.id}|${o.slot}`)?.taken ?? 0;
      for (const u of mine) { const qty = useQty(u, o.capacity, taken); if (qty > 0) lines.push({ product: u.product, series: s.id, title: s.title, slot: o.slot, date: o.date, qty, fixed: u.fixed != null }); }
    }
  }
  return lines;
}
/** The Inventory screen's data: every product with on hand, reserved, free and its flags, plus the alert counts (shown products only). */
export function picture(db, { series, exceptions, counts, today, look, withMoves = true }) {
  const by = new Map();
  for (const l of reservations(db, series, exceptions, counts, today, look)) (by.get(l.product) ?? by.set(l.product, []).get(l.product)).push(l);
  const products = listProducts(db).map((p) => {
    const res = by.get(p.id) ?? [], st = status(p.onHand, p.low, res.reduce((n, l) => n + l.qty, 0));
    return { ...p, ...st, reservations: res, ...(withMoves && { moves: recentMoves(db, p.id) }) };
  });
  const on = products.filter((p) => p.enabled);
  return { products, alerts: { low: on.filter((p) => p.lowNow).length, short: on.filter((p) => p.short).length } };
}
export const exportRows = (db) => [['name', 'category', 'game', 'sku', 'on_hand', 'low_at', 'shown'], ...listProducts(db).map((p) => [p.name, p.category, p.game, p.sku, p.onHand, p.low, p.enabled ? 'yes' : 'no'])];

// ---------- preorders ----------
const oview = (r) => r && ({ id: r.id, product: r.product, productName: r.product_name ?? '', customer: r.customer, contact: r.contact, qty: r.qty, deposit: r.deposit, status: r.status, createdAt: r.created_at, closedAt: r.closed_at, purged: !!r.purged });
const OSEL = 'SELECT o.*, p.name AS product_name FROM preorders o JOIN products p ON p.id = o.product';
export const listPreorders = (db) => db.prepare(`${OSEL} ORDER BY o.created_at DESC, o.id DESC`).all().map(oview);
export const arrivedCount = (db) => db.prepare("SELECT COUNT(*) n FROM preorders WHERE status = 'arrived'").get().n;
/** { clean } or { errors }. product: an id, or 'new' with newProduct = the name of a product that isn't listed yet. */
export function cleanPreorder(db, b) {
  const e = {}, customer = line(b?.customer, 80), contact = line(b?.contact, 120), qty = num(b?.qty), deposit = blank(b?.deposit) ? 0 : num(b.deposit);
  const product = b?.product === 'new' ? 'new' : num(b?.product), newProduct = line(b?.newProduct, 100);
  if (product === 'new') { if (!newProduct) e.newProduct = 'Type the product name.'; } else if (!Number.isInteger(product) || !getProduct(db, product)) e.product = 'Pick a product.';
  if (!customer) e.customer = 'Enter the customer’s name.';
  if (!contact) e.contact = 'Add a phone number or an email so you can reach them.';
  else if (!validContact(contact)) e.contact = 'That doesn’t look like a phone number or an email.';
  if (!int(qty, 1, 999)) e.qty = 'Use a whole number, 1 or more.';
  if (!int(deposit, 0, 99999)) e.deposit = 'Use whole dollars, 0 or more.';
  return Object.keys(e).length ? { errors: e } : { clean: { product, newProduct, customer, contact, qty, deposit } };
}
export const createPreorder = (db, c, now = Date.now()) => tx(db, () => {
  const product = c.product === 'new' ? Number(db.prepare("INSERT INTO products (name, category, game, sku, low, enabled) VALUES (?, 'other', '', '', 0, 1)").run(c.newProduct).lastInsertRowid) : c.product;
  const id = Number(db.prepare('INSERT INTO preorders (product, customer, contact, qty, deposit, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(product, c.customer, c.contact, c.qty, c.deposit, 'waiting', now).lastInsertRowid);
  return oview(db.prepare(`${OSEL} WHERE o.id = ?`).get(id));
});
/** Picked up takes the qty off the shelf (a "pickup" move) when there is enough; going back puts it back. { ok, order, stockNote }. */
export const setStatus = (db, id, to, who, now = Date.now()) => tx(db, () => {
  const o = db.prepare('SELECT * FROM preorders WHERE id = ?').get(Number.isInteger(id) ? id : -1);
  if (!o) return { ok: false, error: 'not_found' };
  if (!PREORDER.includes(to) || !canMove(o.status, to)) return { ok: false, error: 'flow', from: o.status };
  if (o.status !== to && o.purged) return { ok: false, error: 'purged' }; // the contact is gone: a closed order stays closed
  let note = null, pm = o.pickup_move;
  if (o.status !== to && to === 'picked') {
    const r = addMove(db, { product: o.product, qty: -o.qty, reason: 'pickup', who, note: `Preorder #${o.id}` }, now);
    pm = r.ok ? 1 : 0;
    if (!r.ok) note = `Stock was not reduced: only ${r.onHand ?? 0} on hand.`;
  } else if (o.status === 'picked' && to !== 'picked' && pm) {
    addMove(db, { product: o.product, qty: o.qty, reason: 'adjust', who, note: `Pickup undone, preorder #${o.id}` }, now);
    pm = 0;
  }
  const closed = to === 'picked' || to === 'cancelled';
  db.prepare('UPDATE preorders SET status = ?, pickup_move = ?, closed_at = ? WHERE id = ?').run(to, pm, o.status === to ? o.closed_at : closed ? now : null, o.id);
  return { ok: true, stockNote: note, order: oview(db.prepare(`${OSEL} WHERE o.id = ?`).get(o.id)) };
});
/** "Mark all waiting as arrived" for one product, in one transaction. Returns the ids that changed.
 *  undo = those ids: the ones of this product still 'arrived' go back to waiting, also in one transaction. */
export const arriveAll = (db, product, undo = null) => tx(db, () => {
  const [from, to] = undo ? ['arrived', 'waiting'] : ['waiting', 'arrived'], want = undo && new Set(undo);
  const ids = db.prepare('SELECT id FROM preorders WHERE product = ? AND status = ?').all(Number.isInteger(product) ? product : -1, from).map((r) => r.id).filter((id) => !want || want.has(id));
  const up = db.prepare('UPDATE preorders SET status = ? WHERE id = ?');
  for (const id of ids) up.run(to, id);
  return ids;
});
/** Retention: the contact of an order picked up or cancelled PREORDER_RETENTION_DAYS or more days ago is wiped and the name is cut to initials ("S. B.", as sign-ups). Deposits and counts stay. Safe to run again. */
export function purgePreorders(db, nowMs, days = PREORDER_RETENTION_DAYS) {
  const rows = db.prepare("SELECT id, customer FROM preorders WHERE purged = 0 AND status IN ('picked', 'cancelled') AND closed_at IS NOT NULL AND closed_at <= ?").all(nowMs - days * 864e5);
  const up = db.prepare("UPDATE preorders SET customer = ?, contact = '', purged = 1 WHERE id = ?");
  return tx(db, () => { for (const r of rows) up.run(initials(r.customer) || '-', r.id); return rows.length; });
}
