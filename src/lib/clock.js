// Store time (America/New_York) as plain wall-clock numbers, so DST never shifts a comparison.
// "m" = minutes since 1970-01-01 00:00 of the wall clock: dayMin(date) + minutes into the day.
import { isDate, TZ } from './state.js';

export const toMin = (hm) => +hm.slice(0, 2) * 60 + +hm.slice(3);
export const dayMin = (ymd) => Date.parse(`${ymd}T00:00:00Z`) / 60000;
export const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
export const dow = (ymd) => new Date(`${ymd}T00:00:00Z`).getUTCDay();
export const hmOf = (m) => { m = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

const FMT = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
/** The store's clock at an instant (or at a "YYYY-MM-DDTHH:MM" test string): { ymd, hm, m }. */
export function etNow(at = new Date()) {
  if (typeof at === 'string') { const [ymd, hm] = at.split('T'); return { ymd, hm, m: dayMin(ymd) + toMin(hm) }; }
  const p = Object.fromEntries(FMT.formatToParts(at).map((x) => [x.type, x.value]));
  const ymd = `${p.year}-${p.month}-${p.day}`, hm = `${p.hour}:${p.minute}`;
  return { ymd, hm, m: dayMin(ymd) + toMin(hm) };
}
export const NOW_TEST = /^\d{4}-\d\d-\d\dT([01]\d|2[0-3]):[0-5]\d$/;
/** isDate() limited to years 2000-2999, so date maths a URL starts never throws (2026-13-45) or leaves 4-digit years (9999-12-31 + 61 days). */
export const realDay = (ymd) => isDate(ymd) && ymd >= '2000' && ymd < '3000';
