// Calendar files built by the server from the live database, so admin edits and cancellations are in them (D11).
// One VEVENT per dated occurrence: exceptions applied, a cancelled date is STATUS:CANCELLED, times are America/New_York.
import { occurrences, safeUrl } from './events.js';
import { addDays } from './clock.js';

// RFC 5545 text escaping: backslash, semicolon, comma, newline. Every value from the database goes through this.
export const icsEsc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n|\r/g, '\\n');
/** Fold a content line at 75 octets (continuation lines start with one space), never splitting a UTF-8 character. */
export function fold(line) {
  const out = [];
  let cur = '', bytes = 0, limit = 75;
  for (const ch of line) {
    const n = Buffer.byteLength(ch);
    if (bytes + n > limit) { out.push(cur); cur = ''; bytes = 0; limit = 74; }
    cur += ch; bytes += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

const VTIMEZONE = ['BEGIN:VTIMEZONE', 'TZID:America/New_York',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:-0500', 'TZOFFSETTO:-0400', 'TZNAME:EDT', 'DTSTART:19700308T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:-0400', 'TZOFFSETTO:-0500', 'TZNAME:EST', 'DTSTART:19701101T020000', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU', 'END:STANDARD', 'END:VTIMEZONE'];

const compact = (ymd) => ymd.replaceAll('-', '');
const hms = (t) => `${t.replace(':', '')}00`;
const utcStamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const fee = (f) => (f === 0 ? 'Free entry' : Number.isInteger(f) ? `Entry $${f}` : '');
const SIGN = { walkin: 'Just show up. No sign-up needed.', here: 'Sign up on the event page to hold a seat.', counter: 'Pre-register at the counter.', external: 'Sign up online.' };

/** The page link of one occurrence, the same form copyText() uses. */
export const eventUrl = (baseUrl, o) => `${baseUrl.replace(/\/+$/, '')}/events/${encodeURIComponent(o.seriesId)}?date=${encodeURIComponent(o.slot)}`;

/** Stable per-date id: the original slot, so a moved date updates the same calendar entry. */
const uid = (o) => `${o.seriesId}-${o.slot.replace(/[^0-9T]/g, '')}@mulligangames`;

function vevent(o, store, baseUrl, stamp, seq) {
  const a = store.address, where = `${store.name}, ${a.street}, ${a.city}, ${a.region} ${a.zip}`;
  const lines = ['BEGIN:VEVENT', `UID:${uid(o)}`, `DTSTAMP:${stamp}`];
  if (o.start) {
    lines.push(`DTSTART;TZID=America/New_York:${compact(o.date)}T${hms(o.start)}`);
    if (o.end) lines.push(`DTEND;TZID=America/New_York:${compact(o.end <= o.start ? addDays(o.date, 1) : o.date)}T${hms(o.end)}`); // no end time, no DTEND (shown as a point in time)
  } else {
    lines.push(`DTSTART;VALUE=DATE:${compact(o.date)}`);
  }
  lines.push(`SUMMARY:${icsEsc(o.cancelled ? `Cancelled: ${o.title}` : o.title)}`);
  const desc = [o.cancelled && (o.note || 'This date is cancelled.'), !o.cancelled && o.note && `Changed: ${o.note}`, fee(o.fee), !o.inviteOnly && SIGN[o.signup], o.inviteOnly && 'Invite only.',
    o.prize, o.description].filter(Boolean);
  const link = safeUrl(baseUrl) ? eventUrl(baseUrl, o) : null;
  if (link) desc.push(`Details: ${link}`);
  if (desc.length) lines.push(`DESCRIPTION:${icsEsc(desc.join('\n'))}`);
  lines.push(`LOCATION:${icsEsc(where)}`);
  if (link) lines.push(`URL:${link}`);
  lines.push(`STATUS:${o.cancelled ? 'CANCELLED' : 'CONFIRMED'}`);
  lines.push(`SEQUENCE:${seq}`); // minutes since 1970 when the file is made: it only goes up, so a cancel, a change and a "brought back" each replace the copy before
  lines.push('END:VEVENT');
  return lines;
}

/** A calendar (BEGIN:VCALENDAR ...) for a list of occurrences, CRLF lines. */
export function calendar(occs, store, baseUrl, { name = store.name, now = new Date() } = {}) {
  const stamp = utcStamp(now), seq = Math.floor(+now / 60000);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mulligan Games//Events//EN', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${icsEsc(name)}`, 'X-WR-TIMEZONE:America/New_York',
    ...VTIMEZONE, ...occs.flatMap((o) => vevent(o, store, baseUrl, stamp, seq)), 'END:VCALENDAR'];
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** All enabled occurrences from `from` for `days` days, cancelled ones included (so calendars drop them). game: optional chip id (cEDH is Magic). */
export function feedOccurrences(series, exceptions, from, days, game, families = {}) {
  const to = addDays(from, days);
  return series.filter((s) => s.enabled !== false && (!game || game === 'all' || s.game === game || families[s.game] === game))
    .flatMap((s) => occurrences(s, from, to, exceptions))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.start || '').localeCompare(b.start || '') || a.title.localeCompare(b.title));
}
