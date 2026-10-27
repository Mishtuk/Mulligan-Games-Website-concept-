// The event card state machine (DESIGN.md 5.3, "Event card: states"): exactly one state per occurrence, first match wins.
// Registrations do not exist yet (P2.4); pass { taken, waiting } as `regs` once they do. Until then every pre-register event shows all its seats.
import { dayMin, toMin } from './clock.js';

/** Store-clock minutes (see clock.js) of an occurrence's start, or null when no start time is set. */
export const startM = (o) => (o.start ? dayMin(o.date) + toMin(o.start) : null);
/** End: the end time (next day when it is at or before the start), else 4 hours after the start, else the end of the day. */
export function endM(o) {
  const s = startM(o);
  if (s === null) return dayMin(o.date) + 1440;
  if (!o.end) return s + 240;
  const e = dayMin(o.date) + toMin(o.end);
  return e <= s ? e + 1440 : e;
}
/** Sign-ups close at the start, or `cutoffHours` before it when the series says "before". */
export const cutoffM = (o) => (startM(o) ?? dayMin(o.date)) - (o.cutoff === 'before' && o.cutoffHours ? o.cutoffHours * 60 : 0);

/** { state, taken, waiting, cap, left, min, onNow, past, count } for one occurrence at store-clock minute `nowM`. */
export function seatState(o, nowM, regs = {}) {
  const cap = o.capacity || null, min = o.minPlayers || null;
  const out = { state: 'open', taken: regs.taken ?? 0, waiting: regs.waiting ?? 0, cap, left: null, min, count: null };
  out.onNow = !o.cancelled && startM(o) !== null && nowM >= startM(o) && nowM < endM(o);
  out.past = nowM >= endM(o);
  if (o.cancelled) return { ...out, state: 'cancelled' };
  if (o.signup === 'walkin') return { ...out, state: 'walkin' };
  if (o.signup === 'external') return { ...out, state: 'external', count: o.externalCount?.[o.date] ?? null };
  if (o.signup === 'counter') return { ...out, state: 'counter' };
  out.left = cap ? Math.max(0, cap - out.taken) : null;
  if (!o.signup) return { ...out, state: 'walkin' }; // no sign-up mode saved: nothing to promise
  if (nowM >= cutoffM(o)) return { ...out, state: 'closed' };
  if (cap && out.left === 0) return { ...out, state: o.waitlist ? 'waitlist' : 'full' };
  if (min && out.taken < min) return { ...out, state: 'needs' };
  if (cap && out.left <= Math.max(3, Math.ceil(cap * 0.15))) return { ...out, state: 'few' };
  return out;
}

/** schema.org availability for the Event offer (DESIGN.md 15.4). */
export function availability(st) {
  if (st.state === 'full' || st.state === 'waitlist' || (st.state === 'closed' && st.cap && !st.left)) return 'https://schema.org/SoldOut';
  return st.state === 'few' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock';
}
