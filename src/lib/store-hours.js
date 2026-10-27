// Open now / hours for a date, from store facts (src/content/store.json shape). Pure, no Node imports.
// store.hours = null means the owners have not confirmed hours (Q2): every function then answers { known: false } and callers say nothing about hours.
// store.hours = [{ day: 0-6 (0 = Sunday), open: 'HH:MM', close: 'HH:MM' | '24:00' } | { day, closed: true }]; a close at or before the open runs past midnight.
// store.hourOverrides = [{ date, closed?: true, open?, close?, note? }] (holidays, special hours); the override wins over the weekly row.
import { addDays, dayMin, dow, toMin } from './clock.js';

/** The hours of one date: { known, closed, open, close, note, override }. */
export function hoursFor(store, ymd) {
  const o = (store?.hourOverrides ?? []).find((x) => x.date === ymd);
  if (o) return { known: true, closed: !!o.closed || !o.open || !o.close, open: o.open ?? null, close: o.close ?? null, note: o.note ?? null, override: true };
  if (!Array.isArray(store?.hours)) return { known: false };
  const w = store.hours.find((x) => x.day === dow(ymd));
  if (!w) return { known: false };
  return { known: true, closed: !!w.closed || !w.open || !w.close, open: w.open ?? null, close: w.close ?? null, note: null, override: false };
}

// [open, close] in store-clock minutes, or null when closed; a close at or before the open is the next day.
function span(store, ymd) {
  const h = hoursFor(store, ymd);
  if (!h.known || h.closed) return null;
  const a = dayMin(ymd) + toMin(h.open);
  let b = dayMin(ymd) + toMin(h.close);
  if (b <= a) b += 1440;
  return { a, b, h };
}

/** Open right now? now = etNow(). Returns { known: false } with no hours, else
 *  { known, open, closeHm, next: { date, hm, note } | null, today } where closeHm is the close of the span we are in. */
export function openStatus(store, now) {
  const todayH = hoursFor(store, now.ymd);
  if (!todayH.known) return { known: false };
  for (const d of [-1, 0]) { // last night's span can still be running past midnight
    const s = span(store, addDays(now.ymd, d));
    if (s && now.m >= s.a && now.m < s.b) return { known: true, open: true, closeHm: s.h.close, today: todayH };
  }
  for (let i = 0; i < 8; i++) {
    const ymd = addDays(now.ymd, i), s = span(store, ymd);
    if (!hoursFor(store, ymd).known) return { known: true, open: false, today: todayH, next: null, laterUnknown: true }; // hours not set for that day: say nothing about later
    if (s && s.a > now.m) return { known: true, open: false, today: todayH, next: { date: ymd, hm: s.h.open, note: s.h.note } };
  }
  return { known: true, open: false, today: todayH, next: null };
}
