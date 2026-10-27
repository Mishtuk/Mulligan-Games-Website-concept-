// Store facts (D7, P2.3b): validate and clean what the admin Store view saves. Pure, no Node imports.
// Shape = src/content/store.json (the first-run seed). Errors are { 'dotted.field': 'plain words' }.
// hours: null (not set yet, nothing is claimed publicly) or 7 rows { day: 0-6 (0 = Sunday), closed: true } | { day, open: 'HH:MM', close: 'HH:MM' | '24:00' };
// a close at or before the open runs past midnight. hourOverrides: [{ date, closed: true | open + close, note }] wins over the weekly row.
import { isDate, isTime, text } from './state.js';
import { safeUrl } from './events.js';

export const LINKS = [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['x', 'X'], ['discord', 'Discord invite'], ['topdeck', 'TopDeck page'], ['topdeckCircuit', 'TopDeck circuit page'], ['wizards', 'Wizards store locator'], ['patreon', 'Patreon']];
export const MAX_OVERRIDES = 60;
const PHOTO = /^[A-Za-z0-9][A-Za-z0-9._-]{0,78}\.(webp|jpg|jpeg|png)$/;
const EMAIL = /^[^\s@<>"'`\\]+@[^\s@<>"'`\\]+\.[^\s@<>"'`\\]+$/;
const isClose = (t) => isTime(t) || t === '24:00';
const obj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const digits = (s) => { const d = String(s ?? '').replace(/\D/g, ''); return d.length === 11 && d[0] === '1' ? d.slice(1) : d; };
const one = (v, max) => text(v, max) || null;

/** Plain words per field. A body that is not an object gets { form }. today (store day) and prev (the saved facts) are optional: days before today are dropped on save,
 *  so they do not count toward the cap, and only a NEW past date is an error (a mistyped year). */
export function validate(b, today = '', prev = {}) {
  const e = {};
  if (!obj(b)) return { form: 'Something was wrong with what was sent. Reload and try again.' };
  const a = obj(b.address) ? b.address : {};
  if (!text(a.street, 80)) e['address.street'] = 'Enter the street address.';
  if (!text(a.city, 60)) e['address.city'] = 'Enter the town.';
  if (!/^[A-Za-z]{2}$/.test(text(a.region, 10))) e['address.region'] = 'Use the two-letter state, like PA.';
  if (!/^\d{5}(-\d{4})?$/.test(text(a.zip, 10))) e['address.zip'] = 'Use the 5-digit ZIP code, like 18974.';
  if (digits(b.phone).length !== 10) e.phone = 'Enter a 10-digit phone number, like (215) 789-3299.';
  if (b.email && (typeof b.email !== 'string' || b.email.length > 120 || !EMAIL.test(b.email.trim()))) e.email = 'That does not look like an email address.';
  for (const [k, max, label] of [['tagline', 160, 'tagline'], ['freePlay', 120, 'free-play line'], ['parking', 300, 'parking note'], ['kids', 300, 'age note']]) {
    if (b[k] != null && typeof b[k] !== 'string') e[k] = `The ${label} must be text.`;
    else if ((b[k] ?? '').length > max) e[k] = `Keep the ${label} under ${max} characters.`;
  }
  const links = obj(b.links) ? b.links : {};
  for (const [k] of LINKS) {
    const v = links[k];
    if (v == null || v === '') continue;
    if (typeof v !== 'string' || !/^https?:\/\//i.test(v.trim()) || !safeUrl(v)) e[`links.${k}`] = 'Use the full web address, starting with https://';
  }
  if (b.hours != null) {
    if (!Array.isArray(b.hours) || b.hours.length !== 7) e.hours = 'Give all seven days, or leave the hours not set yet.';
    else {
      const seen = new Set();
      b.hours.forEach((r, i) => {
        const d = obj(r) ? r.day : null;
        if (!Number.isInteger(d) || d < 0 || d > 6 || seen.has(d)) return (e.hours = 'Give each weekday once.');
        seen.add(d);
        if (r.closed) return;
        if (!isTime(r.open) || !isClose(r.close)) e[`hours.${d}`] = 'Enter when it opens and closes, or mark the day closed.';
        else if (r.open === r.close) e[`hours.${d}`] = 'Opening and closing time are the same. Mark the day closed instead.';
      });
    }
  }
  if (b.hourOverrides != null) {
    if (!Array.isArray(b.hourOverrides) || b.hourOverrides.filter((o) => !(o?.date < today)).length > MAX_OVERRIDES) e.hourOverrides = `At most ${MAX_OVERRIDES} special days.`;
    else {
      const seen = new Set();
      b.hourOverrides.forEach((o, i) => {
        if (!obj(o) || !isDate(o.date)) return (e[`hourOverrides.${i}.date`] = 'Pick the date.');
        if (seen.has(o.date)) e[`hourOverrides.${i}.date`] = 'That date is already in the list.';
        else if (o.date < today && !(prev.hourOverrides ?? []).some((x) => x.date === o.date)) e[`hourOverrides.${i}.date`] = 'That date has passed.';
        seen.add(o.date);
        if (!o.closed && (!isTime(o.open) || !isClose(o.close))) e[`hourOverrides.${i}`] = 'Mark it closed, or enter when it opens and closes.';
        else if (!o.closed && o.open === o.close) e[`hourOverrides.${i}`] = 'Opening and closing time are the same. Mark it closed instead.';
        if (o.note != null && (typeof o.note !== 'string' || o.note.length > 120)) e[`hourOverrides.${i}.note`] = 'Keep the note under 120 characters.';
      });
    }
  }
  if (b.photo) {
    if (typeof b.photo !== 'string' || !PHOTO.test(b.photo)) e.photo = 'Pick a picture from the list.';
    else if (!text(b.photoAlt, 160)) e.photoAlt = 'Describe the picture in a few words, for people who cannot see it.';
  }
  if (b.photoAlt != null && typeof b.photoAlt !== 'string') e.photoAlt = 'The picture description must be text.';
  return e;
}

/** The stored facts for a valid body; `prev` keeps what the admin cannot edit (the shop name). Special days before `today` are dropped. */
export function clean(b, prev = {}, today = '') {
  const d = digits(b.phone), a = b.address;
  return {
    name: prev.name || 'Mulligan Games', tagline: one(b.tagline, 160),
    address: { street: text(a.street, 80), city: text(a.city, 60), region: text(a.region, 2).toUpperCase(), zip: text(a.zip, 10) },
    phone: `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`, phoneHref: `tel:+1${d}`, email: b.email ? b.email.trim() : null,
    freePlay: one(b.freePlay, 120), parking: one(b.parking, 300), kids: one(b.kids, 300),
    hours: Array.isArray(b.hours) ? [...b.hours].sort((x, y) => x.day - y.day).map((r) => (r.closed ? { day: r.day, closed: true } : { day: r.day, open: r.open, close: r.close })) : null,
    hourOverrides: (b.hourOverrides ?? []).filter((o) => o.date >= today).sort((x, y) => x.date.localeCompare(y.date)).map((o) => ({ date: o.date, ...(o.closed ? { closed: true } : { open: o.open, close: o.close }), ...(text(o.note, 120) && { note: text(o.note, 120) }) })),
    links: Object.fromEntries(LINKS.map(([k]) => [k, safeUrl(b.links?.[k]) ?? null])),
    photo: b.photo || null, photoAlt: b.photo ? text(b.photoAlt, 160) : null,
  };
}
