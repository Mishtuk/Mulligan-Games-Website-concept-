// schema.org JSON-LD (adapted from the VFW site): the store as a HobbyShop and one Event per event date (D16, DESIGN.md 15.4).
// Pure functions that return plain objects; ldScript() turns one into the text of a <script type="application/ld+json"> with "<" escaped (D20).
import { addDays, dayMin, toMin } from './clock.js';
import { availability } from './seats.js';
import { safeUrl } from './events.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const abs = (site, path) => `${String(site).replace(/\/$/, '')}${path}`;

/** JSON text safe inside a script element: "<" (so "</script>" and "<!--" cannot appear) and the two JS line separators are escaped. */
export const ldScript = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, (c) => (c === '\u2028' ? '\\u2028' : '\\u2029'));

const OFFSET = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'longOffset' });
const offsetAt = (utcMs) => { const o = OFFSET.formatToParts(new Date(utcMs)).find((p) => p.type === 'timeZoneName').value.replace('GMT', '').replace('−', '-'); return o.length > 3 ? o : `${o}:00`; };
/** "-04:00" or "-05:00" for a store wall-clock time. Tries both offsets and keeps the one that maps back to the same wall time, so the hour either side of a changeover is right too. */
export function etOffset(ymd, hm = '12:00') {
  const wall = dayMin(ymd) * 60000 + toMin(hm) * 60000;
  for (const off of ['-04:00', '-05:00']) {
    const sign = off[0] === '-' ? -1 : 1, ms = wall - sign * (+off.slice(1, 3) * 60 + +off.slice(4)) * 60000;
    if (offsetAt(ms) === off) return off;
  }
  return '-05:00'; // the skipped hour in spring: treat as standard time
}
/** "2026-10-30T19:00:00-04:00" for a store wall-clock date and time; the bare date when there is no time. */
export const stamp = (ymd, hm) => (hm ? `${ymd}T${hm}:00${etOffset(ymd, hm)}` : ymd);

const address = (store) => ({ '@type': 'PostalAddress', streetAddress: store.address.street, addressLocality: store.address.city, addressRegion: store.address.region, postalCode: store.address.zip, addressCountry: 'US' });
const place = (store) => ({ '@type': 'Place', name: store.name, address: address(store) });

/** The store: HobbyShop with phone, address, opening hours (only when the hours are confirmed) and sameAs (only the links the store has). */
export function shopLd(store, site) {
  const o = { '@context': 'https://schema.org', '@type': 'HobbyShop', name: store.name, url: abs(site, '/'), telephone: store.phone, address: address(store) };
  if (store.tagline) o.description = store.tagline;
  if (store.email) o.email = store.email;
  if (Array.isArray(store.hours)) {
    o.openingHoursSpecification = store.hours.filter((h) => h.open && !h.closed).map((h) => {
      const close = h.close === '24:00' || h.close === '00:00' ? '23:59' : h.close; // "24:00" is not a valid time; 23:59 is Google's end of day
      return { '@type': 'OpeningHoursSpecification', dayOfWeek: DAYS[h.day], opens: h.open, closes: close };
    });
  }
  const links = ['facebook', 'topdeck', 'discord', 'wizards', 'instagram', 'tiktok', 'x', 'patreon'].map((k) => safeUrl(store.links?.[k])).filter(Boolean);
  if (links.length) o.sameAs = links;
  return o;
}

const firstSentence = (s = '') => (/^.*?[.!?](?=\s|$)/.exec(String(s).trim()) || [String(s).trim()])[0];

/** The Event for one occurrence (an item from occurrences()), or null on an invite-only date (Google: events must be open to the public).
 *  st = seatState() of the date; url = its page. EventCancelled keeps every other property; EventRescheduled adds previousStartDate. */
export function eventLd(o, st, store, url) {
  if (o.inviteOnly) return null;
  const seriesStart = o.baseStart ?? null; // the start before any one-date change
  const out = {
    '@context': 'https://schema.org', '@type': 'Event', name: o.title,
    startDate: stamp(o.date, o.start), eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', location: place(store),
    organizer: { '@type': 'Organization', name: store.name }, url,
  };
  if (o.start && o.end) out.endDate = stamp(o.end <= o.start ? addDays(o.date, 1) : o.date, o.end);
  const text = firstSentence(o.description) || firstSentence(o.prize);
  if (text) out.description = text;
  if (Number.isInteger(o.fee)) out.offers = { '@type': 'Offer', price: o.fee, priceCurrency: 'USD', availability: availability(st), url };
  if (o.cancelled) out.eventStatus = 'https://schema.org/EventCancelled';
  else if (o.moved || (o.changed && o.start && seriesStart && o.start !== seriesStart)) {
    out.eventStatus = 'https://schema.org/EventRescheduled';
    out.previousStartDate = stamp(o.originalDate, seriesStart ?? o.start);
  }
  return out;
}
