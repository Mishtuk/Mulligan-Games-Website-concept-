// Sign-ups, waitlist, check-in, payment, no-shows and contact retention (P2.4a; DESIGN.md 8, 9, 15.7; D3, D5, D6, D7, D17, D23, D26).
// Rules ported from prototype/js/rules.js. A registration belongs to one slot: (series id, slot key) as in D23. SQL: `?` placeholders only.
// Every change runs inside one BEGIN IMMEDIATE transaction, so two requests for the last seat or two cancels never leave the table half-changed.
// `o` below is an occurrence from expand() / occurrences() (seriesId, slot, date, capacity, waitlist, signup, start, cutoff ...).
import { createHash, randomBytes } from 'node:crypto';
import { hmOf } from './clock.js';
import { cutoffM, endM } from './seats.js';

/** N: contact details (email, phone, player ID) are wiped this many days after the event. The privacy page prints it. */
export const RETENTION_DAYS = 30;
export const PAYMENTS = ['unpaid', 'door', 'online', 'comped', 'credit'];
export const PAYMENT_LABEL = { unpaid: 'Not paid', door: 'At the door', online: 'Paid online elsewhere', comped: 'Comped', credit: 'Store credit' };
const REFUNDABLE = ['door', 'online', 'credit'];
/** G6: a cancel can be undone this long (staff toast or the player's page); after that the seat stays free. */
export const UNDO_MS = 5 * 60 * 1000;
export const MAX = { name: 80, email: 120, phone: 30, playerId: 24 };

// ---------- small helpers (no database) ----------
/** One line of plain text. Tags are NOT stripped: the text is kept as typed and escaped wherever it is shown (D20). */
export const line = (v, max = 200) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim() : '').slice(0, max); // \s also folds U+2028 and U+2029
const digits = (s) => String(s ?? '').replace(/\D/g, '');
const lower = (s) => line(s).toLowerCase();
/** "Sam Baker" -> "Sam B." (shown in the double sign-up message, so it never gives away a full name). */
export const shortName = (n) => { const w = line(n).split(' '); return w.length > 1 ? `${w[0]} ${[...w[w.length - 1]][0]}.` : w[0] ?? ''; };
const initials = (n) => line(n).split(' ').filter(Boolean).map((w) => `${[...w][0].toUpperCase()}.`).join(' ');
const hashToken = (t) => createHash('sha256').update(t).digest('hex');
const keyOf = (o) => ({ series: o.seriesId, slot: o.slot, cap: o.capacity || null, day: o.date });

/** DESIGN.md 8 field checks. Returns { clean: {name, email, phone, playerId}, errors: {field: message} }. */
export function validateSignup(f = {}) {
  const c = { name: line(f.name, MAX.name + 1), email: line(f.email, MAX.email + 1), phone: line(f.phone, MAX.phone + 1), playerId: line(f.playerId, MAX.playerId + 1) }, e = {};
  if (!c.name) e.name = 'Enter your name so we can find you at the counter.';
  else if (c.name.length > MAX.name) e.name = 'That name is too long.';
  if (!c.email && !c.phone) e.email = 'Add an email or a phone number.';
  else {
    if (c.email && (c.email.length > MAX.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email))) e.email = 'That email doesn’t look right.';
    if (c.phone && (c.phone.length > MAX.phone || digits(c.phone).length < 7 || digits(c.phone).length > 15)) e.phone = 'That phone number looks short.';
  }
  if (c.playerId && !/^[A-Za-z0-9-]{3,24}$/.test(c.playerId)) e.playerId = 'That ID doesn’t look right. Use letters, numbers and dashes only.';
  return { clean: c, errors: e };
}
/** Label of the optional player ID field from the tool's name; null hides the field (DESIGN.md 8). */
export function playerIdLabel(tool) {
  const n = String(tool?.name ?? '').toLowerCase();
  return n.includes('eventlink') || n.includes('wizards') ? 'Wizards ID (Companion)' : n.includes('play! pokemon') ? 'Play! Pokemon ID' : n.includes('bandai') ? 'Bandai TCG+ ID' : n.includes('konami') ? 'KONAMI ID' : null;
}

// ---------- database ----------
function tx(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { try { db.exec('ROLLBACK'); } catch {} throw e; }
}
const inCount = (db, k) => db.prepare("SELECT COUNT(*) n FROM registrations WHERE series = ? AND slot = ? AND status = 'in'").get(k.series, k.slot).n;
const getReg = (db, k, id) => db.prepare('SELECT * FROM registrations WHERE id = ? AND series = ? AND slot = ?').get(Number.isInteger(id) ? id : -1, k.series, k.slot);
const WAIT_ORDER = 'ORDER BY wait_pos IS NULL, wait_pos, created_at, id'; // stored place first, then who signed up first
/** Waitlist places 1..n again, and none for anyone not waiting. Call after every change. */
function renumber(db, k) {
  const up = db.prepare('UPDATE registrations SET wait_pos = ? WHERE id = ?');
  db.prepare(`SELECT id FROM registrations WHERE series = ? AND slot = ? AND status = 'waitlist' ${WAIT_ORDER}`).all(k.series, k.slot).forEach((r, i) => up.run(i + 1, r.id));
  db.prepare("UPDATE registrations SET wait_pos = NULL WHERE series = ? AND slot = ? AND status <> 'waitlist'").run(k.series, k.slot);
}
/** Waitlisted people move in, in order, while there is no cap or a seat is free. Returns the ids that moved. */
function promote(db, k, now) {
  const moved = [], first = db.prepare(`SELECT id FROM registrations WHERE series = ? AND slot = ? AND status = 'waitlist' ${WAIT_ORDER} LIMIT 1`);
  for (;;) {
    const next = first.get(k.series, k.slot);
    if (!next || (k.cap && inCount(db, k) >= k.cap)) break;
    db.prepare("UPDATE registrations SET status = 'in', wait_pos = NULL, promoted_at = ? WHERE id = ?").run(now, next.id);
    moved.push(next.id);
  }
  renumber(db, k);
  return moved;
}
/** G3 (D30): someone holding a seat or a waitlist place under this name AND this email or phone (exact, not a piece of one). Two different
 *  "Chris Smith"s, or a parent signing up two kids with one email, are not duplicates. A row with no contact (walk-in) matches on name alone. */
function dupOf(db, k, name, email = '', phone = '') {
  const nm = name.toLowerCase(), em = email.toLowerCase(), ph = digits(phone), nameOnly = !em && ph.length < 7;
  return db.prepare("SELECT name, email, phone FROM registrations WHERE series = ? AND slot = ? AND status IN ('in', 'waitlist')").all(k.series, k.slot)
    .find((r) => r.name.toLowerCase() === nm && (nameOnly || (em && r.email.toLowerCase() === em) || (ph.length >= 7 && digits(r.phone) === ph)));
}
const view = (r) => r && ({ id: r.id, name: r.name, email: r.email, phone: r.phone, playerId: r.player_id, status: r.status, waitlistPos: r.wait_pos, checkedIn: !!r.checked_in, payment: r.payment, walkIn: !!r.walk_in, createdAt: r.created_at, promotedAt: r.promoted_at });
const fresh = (db, k, id) => view(getReg(db, k, id));

/** { in, waitlist, cancelled, noshow, checkedIn, paid } of one slot. Checked in and paid count only people who have a seat. */
export function counts(db, series, slot) {
  const c = { in: 0, waitlist: 0, cancelled: 0, noshow: 0, checkedIn: 0, paid: 0 };
  for (const r of db.prepare('SELECT status, checked_in, payment FROM registrations WHERE series = ? AND slot = ?').all(series, slot)) {
    if (r.status === 'in') { c.in++; if (r.checked_in) c.checkedIn++; if (r.payment !== 'unpaid') c.paid++; } else c[r.status]++;
  }
  return c;
}
/** Seats taken and people waiting for every slot at once, for the cards: Map "series|slot" -> { taken, waiting }. */
export function countsMap(db) {
  const m = new Map();
  for (const r of db.prepare("SELECT series, slot, status, COUNT(*) n FROM registrations WHERE status IN ('in', 'waitlist') GROUP BY series, slot, status").all()) {
    const x = m.get(`${r.series}|${r.slot}`) ?? m.set(`${r.series}|${r.slot}`, { taken: 0, waiting: 0 }).get(`${r.series}|${r.slot}`);
    if (r.status === 'in') x.taken = r.n; else x.waiting = r.n;
  }
  return m;
}
/** Everyone on one slot for the roster: signed up first, then the waitlist in order, then the rest. */
export function roster(db, series, slot) {
  const rank = { in: 0, waitlist: 1, noshow: 2, cancelled: 3 };
  return db.prepare('SELECT * FROM registrations WHERE series = ? AND slot = ? ORDER BY id').all(series, slot).map(view)
    .sort((a, b) => rank[a.status] - rank[b.status] || (a.waitlistPos ?? 0) - (b.waitlistPos ?? 0) || a.id - b.id);
}

// ---------- the public sign-up ----------
/** Sign-up order (prototype R.signUp): honeypot, can sign up at all, cutoff, field checks, double sign-up, full. `form.expected` is the state the
 *  player was shown ('in' | 'waitlist'): shown 'in' but stored 'waitlist' sets `raced`. nowM = store-clock minutes (ctx.now.m). */
export function register(db, o, form, { nowM, now = Date.now() } = {}) {
  if (line(form.website)) return { ok: true, bot: true }; // honeypot: nothing stored
  if (o.signup !== 'here' || o.cancelled || o.inviteOnly) return { ok: false, error: 'nosignup' };
  if (nowM >= endM(o)) return { ok: false, error: 'past' };
  if (nowM >= cutoffM(o)) return { ok: false, error: 'closed', cutoffHm: hmOf(cutoffM(o)) };
  const { clean, errors } = validateSignup(form);
  if (Object.keys(errors).length) return { ok: false, error: 'invalid', errors };
  const k = keyOf(o);
  return tx(db, () => {
    const dup = dupOf(db, k, clean.name, clean.email, clean.phone); // validateSignup guarantees an email or a 7+ digit phone, so never name alone
    if (dup) return { ok: false, error: 'dup', existing: shortName(dup.name) };
    const full = !!k.cap && inCount(db, k) >= k.cap;
    if (full && !o.waitlist) return { ok: false, error: 'full' };
    const status = full ? 'waitlist' : 'in', token = randomBytes(24).toString('base64url'); // 192 bits
    const id = Number(db.prepare('INSERT INTO registrations (series, slot, event_day, name, email, phone, player_id, status, token_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(k.series, k.slot, k.day, clean.name, clean.email, clean.phone, clean.playerId, status, hashToken(token), now).lastInsertRowid);
    renumber(db, k);
    const reg = getReg(db, k, id);
    return { ok: true, id, token, status, position: reg.wait_pos, taken: inCount(db, k), raced: form.expected === 'in' && status === 'waitlist' };
  });
}

/** The registration behind a personal link, or null. Only the SHA-256 of the 192-bit token is stored and looked up. */
export function byToken(db, token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const r = db.prepare('SELECT * FROM registrations WHERE token_hash = ?').get(hashToken(token));
  const u = r?.status === 'cancelled' && r.undo ? JSON.parse(r.undo) : null; // undoable: the player's own Undo button (G6) shows for UNDO_MS, for their own cancel only
  return r ? { ...view(r), series: r.series, slot: r.slot, undoable: !!u?.self && Date.now() - u.at <= UNDO_MS } : null;
}

// ---------- changes (player or staff). Each returns { ok, ... } and changes nothing when ok is false ----------
/** Cancel (player's own link, or staff removal). An 'in' seat goes to the next waitlisted person. refundDue: they had paid something real. */
export function cancel(db, o, id, { now = Date.now(), self = false } = {}) { // self: the player cancelled on their own page
  const k = keyOf(o);
  return tx(db, () => {
    const r = getReg(db, k, id);
    if (!r || !['in', 'waitlist'].includes(r.status)) return { ok: false, error: 'state' };
    // what Undo needs (G6): where they were and when; who moved in since is read from promoted_at
    db.prepare("UPDATE registrations SET status = 'cancelled', checked_in = 0, wait_pos = NULL, promoted_at = NULL, undo = ? WHERE id = ?")
      .run(JSON.stringify({ from: r.status, pos: r.wait_pos, checked: r.checked_in, at: now, self }), r.id);
    const promoted = r.status === 'in' ? promote(db, k, now) : (renumber(db, k), []);
    return { ok: true, promoted, refundDue: r.status === 'in' && REFUNDABLE.includes(r.payment) };
  });
}
/** No-show (15.7): only a seated person who is not checked in. Frees the seat and promotes. */
export function noShow(db, o, id, { now = Date.now() } = {}) {
  const k = keyOf(o);
  return tx(db, () => {
    const r = getReg(db, k, id);
    if (!r || r.status !== 'in' || r.checked_in) return { ok: false, error: 'state' };
    db.prepare("UPDATE registrations SET status = 'noshow', promoted_at = NULL WHERE id = ?").run(r.id);
    return { ok: true, promoted: promote(db, k, now) };
  });
}
/** Undo a no-show. A free seat: they are back in. Full: the latest promoted person who has not checked in goes back to waitlist #1;
 *  if that person is already checked in, both keep their seats ("29 of 28"). */
export function undoNoShow(db, o, id) {
  const k = keyOf(o);
  return tx(db, () => {
    const r = getReg(db, k, id);
    if (!r || r.status !== 'noshow') return { ok: false, error: 'state' };
    let bumped = null;
    if (k.cap && inCount(db, k) >= k.cap) {
      bumped = db.prepare("SELECT id FROM registrations WHERE series = ? AND slot = ? AND status = 'in' AND checked_in = 0 AND promoted_at IS NOT NULL ORDER BY promoted_at DESC, id DESC LIMIT 1").get(k.series, k.slot)?.id ?? null;
      if (bumped) db.prepare("UPDATE registrations SET status = 'waitlist', wait_pos = 0, promoted_at = NULL WHERE id = ?").run(bumped); // 0 sorts before #1
    }
    db.prepare("UPDATE registrations SET status = 'in' WHERE id = ?").run(r.id);
    renumber(db, k);
    return { ok: true, bumped, over: !!k.cap && inCount(db, k) > k.cap };
  });
}
/** Undo a cancel (staff or the player's own) within UNDO_MS. A waitlisted person gets their old place back. A seated one gets the seat back;
 *  when that makes the event full, the LAST person auto-promoted since the cancel who has not checked in goes back to waitlist #1 (as No-show
 *  undo, so nobody behind them in line keeps a seat they lose). Nobody like that (checked in, walk-in took the seat): "29 of 28".
 *  Ends with promote(), so a seat freed meanwhile never sits empty while someone waits. */
export function undoCancel(db, o, id, { now = Date.now(), self = false } = {}) { // self: the player's link, which can't take back a staff removal (D31 (2))
  const k = keyOf(o);
  return tx(db, () => {
    const r = getReg(db, k, id), u = r?.status === 'cancelled' && r.undo ? JSON.parse(r.undo) : null;
    if (!u || (self && !u.self)) return { ok: false, error: 'state' };
    if (now - u.at > UNDO_MS) return { ok: false, error: 'expired' };
    if (dupOf(db, k, r.name, r.email, r.phone)) return { ok: false, error: 'dup' }; // they signed up again meanwhile
    let bumped = null;
    if (u.from === 'in' && k.cap && inCount(db, k) >= k.cap) {
      bumped = db.prepare("SELECT id FROM registrations WHERE series = ? AND slot = ? AND status = 'in' AND checked_in = 0 AND promoted_at >= ? ORDER BY promoted_at DESC, id DESC LIMIT 1").get(k.series, k.slot, u.at)?.id ?? null;
      if (bumped) db.prepare("UPDATE registrations SET status = 'waitlist', wait_pos = 0, promoted_at = NULL WHERE id = ?").run(bumped); // 0 sorts before #1
    }
    if (u.from === 'in') db.prepare("UPDATE registrations SET status = 'in', checked_in = ?, wait_pos = NULL, undo = NULL WHERE id = ?").run(u.checked ? 1 : 0, r.id);
    else db.prepare("UPDATE registrations SET status = 'waitlist', wait_pos = ?, undo = NULL WHERE id = ?").run((u.pos ?? 1) - 0.5, r.id); // just ahead of whoever has that place now
    const promoted = promote(db, k, now);
    return { ok: true, bumped, promoted, status: getReg(db, k, r.id).status, over: !!k.cap && inCount(db, k) > k.cap };
  });
}
export function checkIn(db, o, id, on = true) {
  const r = getReg(db, keyOf(o), id);
  if (!r || r.status !== 'in') return { ok: false, error: 'state' };
  db.prepare('UPDATE registrations SET checked_in = ? WHERE id = ?').run(on ? 1 : 0, r.id);
  return { ok: true };
}
export function setPayment(db, o, id, payment) {
  const r = getReg(db, keyOf(o), id);
  if (!PAYMENTS.includes(payment) || !r || r.status === 'cancelled') return { ok: false, error: 'state' };
  db.prepare('UPDATE registrations SET payment = ? WHERE id = ?').run(payment, r.id);
  return { ok: true };
}
/** Staff: seat a waitlisted person now, even when full (over: true -> "29 of 28"). Nobody else is promoted until in < cap again. */
export function moveIn(db, o, id) {
  const k = keyOf(o);
  return tx(db, () => {
    const r = getReg(db, k, id);
    if (!r || r.status !== 'waitlist') return { ok: false, error: 'state' };
    db.prepare("UPDATE registrations SET status = 'in', wait_pos = NULL, promoted_at = NULL WHERE id = ?").run(r.id);
    renumber(db, k);
    return { ok: true, over: !!k.cap && inCount(db, k) > k.cap };
  });
}
/** Staff: nudge a waitlisted person up (dir -1) or down (+1). Refused at either end. */
export function moveWaitlist(db, o, id, dir) {
  const k = keyOf(o);
  return tx(db, () => {
    const wl = db.prepare(`SELECT id FROM registrations WHERE series = ? AND slot = ? AND status = 'waitlist' ${WAIT_ORDER}`).all(k.series, k.slot).map((r) => r.id);
    const i = wl.indexOf(id), j = i + (dir === 1 ? 1 : dir === -1 ? -1 : NaN);
    if (i < 0 || !(j >= 0 && j < wl.length)) return { ok: false, error: 'state' };
    [wl[i], wl[j]] = [wl[j], wl[i]];
    const up = db.prepare('UPDATE registrations SET wait_pos = ? WHERE id = ?');
    wl.forEach((x, n) => up.run(n + 1, x));
    return { ok: true, position: j + 1 };
  });
}
/** G1: staff put a name on a `counter` (or `here`) event ahead of time: not checked in, payment as given (often paid in advance), contact optional.
 *  Same capacity / waitlist rules as a sign-up (no cutoff: staff). Same-name duplicates are refused unless `anyway`. */
export function addPreReg(db, o, { name, email, phone, payment = 'unpaid', anyway = false }, { now = Date.now() } = {}) {
  if (!['counter', 'here'].includes(o.signup) || o.cancelled) return { ok: false, error: 'nosignup' };
  const c = { name: line(name, MAX.name + 1), email: line(email, MAX.email + 1), phone: line(phone, MAX.phone + 1) }, errors = {};
  if (!c.name) errors.name = 'Type a name first.'; else if (c.name.length > MAX.name) errors.name = 'That name is too long.';
  if (c.email && (c.email.length > MAX.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email))) errors.email = 'That email doesn’t look right.';
  if (c.phone && (c.phone.length > MAX.phone || digits(c.phone).length < 7 || digits(c.phone).length > 15)) errors.phone = 'That phone number looks short.';
  if (!PAYMENTS.includes(payment)) errors.payment = 'Pick a payment option.';
  if (Object.keys(errors).length) return { ok: false, error: 'invalid', errors };
  const k = keyOf(o);
  return tx(db, () => {
    if (!anyway && db.prepare("SELECT 1 FROM registrations WHERE series = ? AND slot = ? AND status IN ('in', 'waitlist') AND lower(name) = ?").get(k.series, k.slot, c.name.toLowerCase())) return { ok: false, error: 'dup' };
    const full = !!k.cap && inCount(db, k) >= k.cap;
    if (full && !o.waitlist) return { ok: false, error: 'full' };
    const status = full ? 'waitlist' : 'in';
    const id = Number(db.prepare('INSERT INTO registrations (series, slot, event_day, name, email, phone, status, payment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(k.series, k.slot, k.day, c.name, c.email, c.phone, status, full ? 'unpaid' : payment, now).lastInsertRowid);
    renumber(db, k);
    return { ok: true, id, status, position: getReg(db, k, id).wait_pos };
  });
}

/** G10: walk-in-only nights keep one number per slot (D23 key); P2.6 results read and edit it. */
export const getHeadcount = (db, series, slot) => db.prepare('SELECT n FROM headcount WHERE series = ? AND slot = ?').get(series, slot)?.n ?? 0;
export const MAX_HEADCOUNT = 9999;
/** { delta } adds (never below 0, never above MAX_HEADCOUNT); { n } sets it. Returns { ok, n }. */
export function setHeadcount(db, o, { delta, n } = {}) {
  if (o.signup !== 'walkin' || o.cancelled) return { ok: false, error: 'nosignup' };
  const isInt = (x) => Number.isInteger(x) && Math.abs(x) <= MAX_HEADCOUNT;
  if (!(n === undefined ? isInt(delta) : isInt(n) && n >= 0)) return { ok: false, error: 'bad_input' };
  return tx(db, () => {
    const next = Math.min(MAX_HEADCOUNT, Math.max(0, n === undefined ? getHeadcount(db, o.seriesId, o.slot) + delta : n));
    db.prepare('INSERT INTO headcount (series, slot, n) VALUES (?, ?, ?) ON CONFLICT(series, slot) DO UPDATE SET n = excluded.n').run(o.seriesId, o.slot, next);
    return { ok: true, n: next };
  });
}

/** Counter walk-in. mode 'auto' refuses when full (so the screen can offer both buttons), 'waitlist' queues them unpaid, 'over' seats them
 *  anyway. A seated walk-in is checked in and paid with `payment` (default at the door). Duplicate = same name. */
export function walkIn(db, o, { name, mode = 'auto', payment = 'door', anyway = false }, { now = Date.now() } = {}) {
  const nm = line(name, MAX.name + 1);
  if (!nm) return { ok: false, error: 'name' };
  if (nm.length > MAX.name) return { ok: false, error: 'name_long' };
  if (!['auto', 'waitlist', 'over'].includes(mode) || !PAYMENTS.includes(payment)) return { ok: false, error: 'bad_input' };
  const k = keyOf(o);
  return tx(db, () => {
    if (!anyway && db.prepare("SELECT 1 FROM registrations WHERE series = ? AND slot = ? AND status IN ('in', 'waitlist') AND lower(name) = ?").get(k.series, k.slot, nm.toLowerCase())) return { ok: false, error: 'dup' }; // anyway: two real people with one name
    const full = !!k.cap && inCount(db, k) >= k.cap;
    if (full && mode === 'auto') return { ok: false, error: 'full', full: true };
    const wait = full && mode === 'waitlist';
    const id = Number(db.prepare('INSERT INTO registrations (series, slot, event_day, name, status, checked_in, payment, walk_in, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)')
      .run(k.series, k.slot, k.day, nm, wait ? 'waitlist' : 'in', wait ? 0 : 1, wait ? 'unpaid' : payment, now).lastInsertRowid);
    renumber(db, k);
    return { ok: true, id, status: wait ? 'waitlist' : 'in', position: getReg(db, k, id).wait_pos, over: !wait && full };
  });
}
/** After the seats of a date change (bigger cap, cap removed): fill free seats from the waitlist. Lowering the cap bumps nobody. */
export const promoteSlot = (db, o, { now = Date.now() } = {}) => tx(db, () => promote(db, keyOf(o), now));
/** Slots with a waiting list, for promoteSlot() after a series or date is edited. */
export const waitingSlots = (db) => db.prepare("SELECT DISTINCT series, slot FROM registrations WHERE status = 'waitlist'").all();
/** Upcoming slots of one series that still hold a seat or a waitlist place, [{ slot, n }]: a series edit or delete must not drop them (G4). */
export const heldSlots = (db, series, today) => db.prepare("SELECT slot, COUNT(*) n FROM registrations WHERE series = ? AND status IN ('in', 'waitlist') AND event_day >= ? GROUP BY slot ORDER BY slot").all(series, today);
/** A date was moved: keep the retention clock on the day it really happens. */
export const setEventDay = (db, series, slot, day) => db.prepare('UPDATE registrations SET event_day = ? WHERE series = ? AND slot = ?').run(day, series, slot);

// ---------- retention ----------
/** "Please remove my details" at the counter: wipe one person's contact details and link now (name shrinks to initials); the seat and counts stay. */
export function erase(db, o, id) {
  const r = getReg(db, keyOf(o), id);
  if (!r) return { ok: false, error: 'state' };
  db.prepare("UPDATE registrations SET name = ?, email = '', phone = '', player_id = '', token_hash = NULL, purged = 1 WHERE id = ?").run(initials(r.name) || '-', r.id);
  return { ok: true };
}
/** Wipe email, phone, player ID and the personal link of every registration whose event was `days` or more days ago; the name shrinks to initials.
 *  Rows, statuses, payment and counts stay. Safe to run again. Returns how many rows it wiped. */
export function purgeContacts(db, today, days = RETENTION_DAYS) {
  const t = Date.parse(`${today}T00:00:00Z`) - days * 864e5, limit = new Date(t).toISOString().slice(0, 10);
  const rows = db.prepare('SELECT id, name FROM registrations WHERE purged = 0 AND event_day <= ?').all(limit);
  const up = db.prepare("UPDATE registrations SET name = ?, email = '', phone = '', player_id = '', token_hash = NULL, purged = 1 WHERE id = ?");
  return tx(db, () => { for (const r of rows) up.run(initials(r.name) || '-', r.id); return rows.length; });
}
