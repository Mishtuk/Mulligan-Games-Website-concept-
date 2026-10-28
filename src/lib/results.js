// Results and prizes (P2.6; DESIGN.md 9.4; D23 slot keys, D41 stock ledger). One result per event date (series id + slot key).
// Prizes given are rows of product + qty that write `prize` stock moves in the SAME transaction as the result (a change writes the difference:
// more = another prize move, fewer = an `adjust` move that puts it back). A move that would take stock below 0 refuses the whole save.
// Store credit is a free-text note only (OWNER-QUESTIONS Q4/Q6 are open): no ledger. SQL: `?` placeholders only.
import { addMove } from './inventory.js';
import { counts, getHeadcount, line, tx } from './registrations.js';
import { occurrences } from './events.js';
import { addDays } from './clock.js';

export const MAX_TOP = 8, MAX_NAME = 60, MAX_PRIZES = 20;
/** Reminders look back this many days. */
export const LOOKBACK = 14;
const num = (v) => (typeof v === 'number' ? v : typeof v === 'string' && /^\d{1,9}$/.test(v.trim()) ? Number(v) : NaN);
const blank = (v) => v === undefined || v === null || v === '';
const flag = (v) => v === undefined || typeof v === 'boolean';

/** { errors, clean } for a results form. Names are kept as typed (tags and all) and escaped wherever they are shown (D20). */
export function clean(b) {
  const e = {}, c = {};
  if (!b || typeof b !== 'object' || Array.isArray(b)) return { errors: { form: 'Send the results as an object.' }, clean: c };
  c.headcount = blank(b.headcount) ? null : num(b.headcount);
  if (c.headcount !== null && !(Number.isInteger(c.headcount) && c.headcount >= 0 && c.headcount <= 9999)) e.headcount = 'Use a whole number, 0 or more.';
  c.winner = line(b.winner, MAX_NAME + 1);
  if (c.winner.length > MAX_NAME) e.winner = `Keep the winner to ${MAX_NAME} characters.`;
  if (blank(b.top)) c.top = [];
  else if (!Array.isArray(b.top) || b.top.length > MAX_TOP * 2) e.top = `List at most ${MAX_TOP} names.`;
  else {
    c.top = b.top.map((x) => line(x, MAX_NAME + 1)).filter(Boolean);
    if (c.top.length > MAX_TOP) e.top = `List at most ${MAX_TOP} names.`;
    else if (c.top.some((x) => x.length > MAX_NAME)) e.top = `Keep each name to ${MAX_NAME} characters.`;
  }
  c.notes = line(b.notes, 500);
  c.creditNote = line(b.creditNote, 200);
  for (const k of ['reported', 'public']) if (!flag(b[k])) e[k] = 'Use true or false.';
  c.reported = b.reported === true; c.public = b.public === true;
  if (c.public && !c.winner) e.winner = 'Add a winner before showing the results on the website.';
  c.prizes = [];
  if (blank(b.prizes)) { /* none */ } else if (!Array.isArray(b.prizes) || b.prizes.length > MAX_PRIZES) e.prizes = `Use at most ${MAX_PRIZES} prizes.`;
  else {
    const seen = new Set();
    for (const r of b.prizes) {
      const product = num(r?.product), qty = num(r?.qty);
      if (!Number.isInteger(product) || !Number.isInteger(qty) || qty < 1 || qty > 9999) { e.prizes = 'Each prize needs a product and a whole number, 1 or more.'; break; }
      if (seen.has(product)) { e.prizes = 'A product is listed twice. Use one row and add up the quantity.'; break; }
      seen.add(product); c.prizes.push({ product, qty });
    }
  }
  return { errors: e, clean: c };
}

const row = (db, series, slot) => db.prepare('SELECT * FROM results WHERE series = ? AND slot = ?').get(series, slot);
const prizesOf = (db, series, slot) => db.prepare('SELECT r.product, r.qty, p.name FROM result_prizes r LEFT JOIN products p ON p.id = r.product WHERE r.series = ? AND r.slot = ? ORDER BY r.product').all(series, slot).map((r) => ({ product: r.product, qty: r.qty, name: r.name ?? '' }));
/** Players to pre-fill: everyone checked in plus the walk-in tally of walk-in-only nights. */
export const suggestedHeadcount = (db, o) => counts(db, o.seriesId, o.slot).checkedIn + getHeadcount(db, o.seriesId, o.slot);

/** What the results panel shows for one date: the saved result (or blanks), the suggested headcount and the read-only no-show count. */
export function get(db, o) {
  const r = row(db, o.seriesId, o.slot), c = counts(db, o.seriesId, o.slot);
  return { saved: !!r, headcount: r?.headcount ?? null, suggested: suggestedHeadcount(db, o), noshows: c.noshow, winner: r?.winner ?? '', top: r ? JSON.parse(r.top_names) : [], notes: r?.notes ?? '', creditNote: r?.credit_note ?? '',
    reported: !!r?.reported, public: !!r?.is_public, prizes: prizesOf(db, o.seriesId, o.slot), toolName: o.tool?.name ?? null };
}

/** Saves a cleaned result and its prize moves in one transaction. { ok: true } or { ok: false, error: 'short' | 'not_found' | 'qty', product, onHand }.
 *  Returned prizes (fewer or removed) go first, so swapping one product for another never trips the below-0 rule for no reason. */
export function save(db, o, c, who, now = Date.now()) {
  try {
    return tx(db, () => {
      const have = new Map(prizesOf(db, o.seriesId, o.slot).map((p) => [p.product, p.qty])), want = new Map(c.prizes.map((p) => [p.product, p.qty]));
      const deltas = [...new Set([...have.keys(), ...want.keys()])].map((product) => [product, (want.get(product) ?? 0) - (have.get(product) ?? 0)]).filter(([, d]) => d !== 0).sort((a, b) => a[1] - b[1]);
      for (const [product, d] of deltas) {
        const r = addMove(db, d > 0 ? { product, qty: -d, reason: 'prize', who, note: `Prize at ${o.title} ${o.date}`, series: o.seriesId, slot: o.slot }
          : { product, qty: -d, reason: 'adjust', who, note: `Prize changed at ${o.title} ${o.date}`, series: o.seriesId, slot: o.slot }, now);
        if (!r.ok) throw Object.assign(new Error('refused'), { refusal: { ok: false, error: r.error, product, onHand: r.onHand } });
      }
      db.prepare('DELETE FROM result_prizes WHERE series = ? AND slot = ?').run(o.seriesId, o.slot);
      const ins = db.prepare('INSERT INTO result_prizes (series, slot, product, qty) VALUES (?, ?, ?, ?)');
      for (const p of c.prizes) ins.run(o.seriesId, o.slot, p.product, p.qty);
      db.prepare(`INSERT INTO results (series, slot, day, headcount, winner, top_names, notes, credit_note, reported, is_public, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(series, slot) DO UPDATE SET day = excluded.day, headcount = excluded.headcount, winner = excluded.winner, top_names = excluded.top_names, notes = excluded.notes,
        credit_note = excluded.credit_note, reported = excluded.reported, is_public = excluded.is_public, updated_at = excluded.updated_at`)
        .run(o.seriesId, o.slot, o.date, c.headcount, c.winner, JSON.stringify(c.top), c.notes, c.creditNote, c.reported ? 1 : 0, c.public ? 1 : 0, now);
      return { ok: true };
    });
  } catch (e) { if (e.refusal) return e.refusal; throw e; }
}

/** The reminder list: past dates (yesterday back LOOKBACK days, cancelled ones skipped) with no result yet ('missing'), or a result not ticked as
 *  reported to the event's official tool ('unreported'; only events that name a tool). Newest first. */
export function pending(db, series, exceptions, today) {
  const done = new Map(db.prepare('SELECT series, slot, reported FROM results').all().map((r) => [`${r.series}|${r.slot}`, !!r.reported])), out = [];
  for (const s of series) {
    if (s.enabled === false) continue;
    for (const o of occurrences(s, addDays(today, -LOOKBACK), addDays(today, -1), exceptions)) {
      if (o.cancelled) continue;
      const rep = done.get(`${o.seriesId}|${o.slot}`);
      const state = rep === undefined ? 'missing' : !rep && o.tool?.name ? 'unreported' : null;
      if (state) out.push({ series: o.seriesId, title: o.title, slot: o.slot, date: o.date, state, tool: o.tool?.name ?? null });
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

// ---------- public side: only results staff ticked "Show" on, with a winner ----------
const pview = (r) => ({ series: r.series, slot: r.slot, day: r.day, headcount: r.headcount, winner: r.winner, top: JSON.parse(r.top_names) });
/** Newest first. Notes, credit note, prizes and the reported tick never leave the admin side. */
export const publicRecent = (db, n = 40) => db.prepare("SELECT series, slot, day, headcount, winner, top_names FROM results WHERE is_public = 1 AND winner <> '' ORDER BY day DESC, updated_at DESC LIMIT ?").all(n).map(pview);
export const publicOne = (db, series, slot) => { const r = db.prepare("SELECT series, slot, day, headcount, winner, top_names FROM results WHERE series = ? AND slot = ? AND is_public = 1 AND winner <> ''").get(series, slot); return r && pview(r); };
