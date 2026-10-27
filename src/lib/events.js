// Event series model (D7, D15, D17): validate, clean, expand to dated occurrences with one-date exceptions, and plain-text post copy (D18).
// Pure functions, no Node-only imports. Dates are "YYYY-MM-DD", times "HH:MM" (24h); all date maths is UTC on the calendar day, so DST never shifts a date.
import { isDate, isTime, para, text } from './state.js';
import { GAME_IDS } from './games.js';

export const KINDS = ['open', 'weekly', 'learn', 'cedh', 'prerelease', 'special'];
export const SIGNUPS = ['walkin', 'here', 'counter', 'external'];
export const PLAY_STYLES = ['casual', 'competitive'];
export const MOVE_DAYS = 60; // a moved date must land within this many days of the original

// ---------- links (D20): the one place a stored link is checked ----------
/** The link as typed (trimmed) when it is http(s)/tel/mailto and has no spaces, quotes or angle brackets; otherwise null. */
export function safeUrl(u) {
  if (typeof u !== 'string') return null;
  const s = u.trim();
  if (!s || s.length > 500 || /[\s<>"'`\\\u0000-\u001f\u007f]/.test(s)) return null;
  try {
    const x = new URL(s);
    if (x.protocol === 'http:' || x.protocol === 'https:') return x.hostname.includes('.') || x.hostname === 'localhost' ? s : null;
    return (x.protocol === 'tel:' || x.protocol === 'mailto:') && x.pathname ? s : null;
  } catch { return null; }
}

// ---------- date maths ----------
const parseDay = (s) => new Date(`${s}T00:00:00Z`);
const fmtDay = (d) => d.toISOString().slice(0, 10);
const addDays = (ymd, n) => { const d = parseDay(ymd); d.setUTCDate(d.getUTCDate() + n); return fmtDay(d); };
const mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
const hm = (m) => { m = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** nth (1-5, or -1 = last) weekday `day` (0 = Sunday) of a month, as YYYY-MM-DD, or null (a 5th that month lacks). */
function nthWeekday(y, m, nth, day) {
  const last = new Date(Date.UTC(y, m + 1, 0));
  const d = nth > 0 ? 1 + ((day - new Date(Date.UTC(y, m, 1)).getUTCDay() + 7) % 7) + (nth - 1) * 7
    : last.getUTCDate() - ((last.getUTCDay() - day + 7) % 7);
  return d > last.getUTCDate() ? null : fmtDay(new Date(Date.UTC(y, m, d)));
}

/** [{date, start}] of one series between two dates, inclusive, before exceptions. A 5th weekday skips months that lack one. */
function rawDates(s, from, to) {
  const r = s.recurrence ?? {}, out = [];
  if (r.type === 'none') return r.date >= from && r.date <= to ? [{ date: r.date, start: s.start ?? null }] : out;
  if (r.type === 'dates') return r.dates.filter((x) => x.date >= from && x.date <= to).map((x) => ({ date: x.date, start: x.start || s.start || null }));
  if (r.startDate && from < r.startDate) from = r.startDate;
  if (r.until && to > r.until) to = r.until;
  if (from > to) return out;
  if (r.type === 'weekly') {
    for (let d = addDays(from, (r.day - parseDay(from).getUTCDay() + 7) % 7); d <= to; d = addDays(d, 7)) out.push({ date: d, start: s.start ?? null });
  } else if (r.type === 'nth') {
    let y = +from.slice(0, 4), m = +from.slice(5, 7) - 1;
    for (; `${y}-${String(m + 1).padStart(2, '0')}` <= to.slice(0, 7); m === 11 ? (y++, m = 0) : m++) {
      const d = nthWeekday(y, m, r.nth, r.day);
      if (d && d >= from && d <= to) out.push({ date: d, start: s.start ?? null });
    }
  }
  return out;
}

/** True when `key` (a slot: YYYY-MM-DD, or YYYY-MM-DDTHH:MM for "On these dates" series) is one of this series' dates. */
export const hasSlot = (s, key) => isSlot(key) && occurrences(s, addDays(key.slice(0, 10), -MOVE_DAYS), addDays(key.slice(0, 10), MOVE_DAYS)).some((o) => o.slot === key);
const isSlot = (k) => typeof k === 'string' && isDate(k.slice(0, 10)) && (k.length === 10 || (k.length === 16 && k[10] === 'T' && isTime(k.slice(11))));

/** Dated occurrences of one series in [from, to] with its one-date exceptions applied (they never change the series).
 *  exceptions: [{series, date (the slot key), type: 'cancel'|'change', start?, capacity?, note?, movedTo?, updated?}] keyed by the slot (the ORIGINAL date, plus T and the start for "On these dates" series).
 *  A moved date appears on its new date (originalDate keeps the old one). */
export function occurrences(s, from, to, exceptions = []) {
  const ex = new Map(exceptions.filter((e) => e.series === s.id).map((e) => [e.date, e])); // keyed by slot (D23)
  return rawDates(s, addDays(from, -MOVE_DAYS), addDays(to, MOVE_DAYS)).map((x) => {
    const slot = s.recurrence?.type === 'dates' ? `${x.date}T${x.start}` : x.date, e = ex.get(slot), start = e?.start || x.start;
    let end = s.end ?? null;
    if (end && e?.start && x.start) end = hm(mins(end) + mins(e.start) - mins(x.start)); // a moved start keeps the length
    const arriveBy = start && Number.isInteger(s.arriveByMins) ? hm(mins(start) - s.arriveByMins) : null;
    return {
      ...s, arriveBy, baseStart: x.start, seriesId: s.id, slot, date: e?.movedTo || x.date, originalDate: x.date, start, end, capacity: e?.capacity ?? s.capacity,
      cancelled: e?.type === 'cancel', moved: !!e?.movedTo, changed: !!e && e.type !== 'cancel', note: e?.note ?? null, updated: e?.updated ?? null,
    };
  }).filter((o) => o.date >= from && o.date <= to);
}

/** Every dated occurrence of the enabled series in [from, to], earliest first. */
export function expand(series = [], from, to, exceptions = []) {
  return series.filter((s) => s.enabled !== false).flatMap((s) => occurrences(s, from, to, exceptions))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.start || '').localeCompare(b.start || '') || a.title.localeCompare(b.title));
}

// ---------- validation ----------
const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const blank = (v) => v === undefined || v === null || v === '';
const INTS = { fee: [0, 9999, 'Use a whole number of dollars, 0 or more.'], capacity: [1, 9999, 'Seats must be a whole number, 1 or more.'],
  minPlayers: [1, 9999, 'Use a whole number, 1 or more.'], points: [1, 99999, 'Use a whole number.'],
  roundMinutes: [1, 600, 'Use a whole number of minutes.'], cutoffHours: [1, 72, 'Use 1 to 72 hours.'] };
const TIMES = ['start', 'end', 'doors'], BOOLS = ['featured', 'enabled', 'waitlist', 'beginnerFriendly', 'kidsWelcome', 'inviteOnly'], ARRIVE_MINS = [0, 5, 10, 15, 30];

/** Per-field errors for a series, {} when it is fine. Looks at the raw input; clean() then builds what is stored. */
export function validate(s) {
  const e = {};
  if (!s || typeof s !== 'object' || Array.isArray(s)) return { form: 'Send the event as an object.' };
  if (!blank(s.id) && !(typeof s.id === 'string' && /^[a-z0-9][a-z0-9-]{0,59}$/.test(s.id))) e.id = 'Use lower-case letters, digits and dashes.';
  if (!text(s.title, 80)) e.title = 'Give the event a name.';
  if (!GAME_IDS.has(s.game)) e.game = 'Pick a game.';
  if (!KINDS.includes(s.kind)) e.kind = 'Pick the kind of event.';
  if (!blank(s.signup) && !SIGNUPS.includes(s.signup)) e.signup = 'Choose how players sign up.';
  if (!blank(s.playStyle) && !PLAY_STYLES.includes(s.playStyle)) e.playStyle = 'Pick casual, competitive or not stated.';
  if (!blank(s.cutoff) && !['start', 'before'].includes(s.cutoff)) e.cutoff = 'Sign-ups close at the start or some hours before.';
  for (const k of TIMES) if (!blank(s[k]) && !isTime(s[k])) e[k] = 'Use a time like 19:00.';
  for (const [k, [lo, hi, msg]] of Object.entries(INTS)) if (!blank(s[k]) && !isInt(s[k], lo, hi)) e[k] = msg;
  for (const k of BOOLS) if (s[k] !== undefined && typeof s[k] !== 'boolean') e[k] = 'Yes or no.';
  if (!e.minPlayers && !e.capacity && s.minPlayers > s.capacity) e.minPlayers = 'The minimum can’t be more than the seats.';
  if (!blank(s.arriveByMins) && !ARRIVE_MINS.includes(s.arriveByMins)) e.arriveByMins = 'Pick a time from the list.';
  else if (['here', 'counter'].includes(s.signup) && !blank(s.arriveByMins) && isTime(s.doors) && isTime(s.start) && mins(s.start) - s.arriveByMins < mins(s.doors)) {
    e.arriveByMins = `That's before the doors open at ${T12(s.doors)}. Pick a shorter time.`; // DESIGN.md 15.2
  }
  if (!blank(s.ageNote) && (typeof s.ageNote !== 'string' || text(s.ageNote, 1000).length > 60)) e.ageNote = 'Keep it to 60 characters. Put more in the description.';
  const tool = s.tool;
  if (!blank(tool) && (typeof tool !== 'object' || Array.isArray(tool))) e.tool = 'Send the tool as name, link and code.';
  else if (tool) {
    if (!blank(tool.url) && !safeUrl(tool.url)) e.toolUrl = 'That link should start with https:// (or http://, tel:, mailto:).';
    if (!blank(tool.name) && typeof tool.name !== 'string') e.tool = 'Tool name must be text.';
  }
  if (s.signup === 'external' && !e.toolUrl && blank(tool?.url)) e.toolUrl = 'Add the link players sign up on.';
  if (!blank(s.externalCount) && !(typeof s.externalCount === 'object' && Object.entries(s.externalCount).every(([d, n]) => isDate(d) && isInt(n, 0, 99999)))) e.externalCount = 'Use date: headcount pairs.';
  const r = s.recurrence;
  if (!r || typeof r !== 'object') e.recurrence = 'Choose when it happens.';
  else if (r.type === 'none') { if (!isDate(r.date)) e.recurrence = 'Pick the date.'; }
  else if (r.type === 'weekly') { if (!isInt(r.day, 0, 6)) e.recurrence = 'Pick the weekday.'; }
  else if (r.type === 'nth') { if (![1, 2, 3, 4, 5, -1].includes(r.nth) || !isInt(r.day, 0, 6)) e.recurrence = 'Pick which weekday of the month.'; }
  else if (r.type === 'dates') {
    if (!Array.isArray(r.dates) || !r.dates.length || r.dates.length > 100) e.recurrence = 'Add between 1 and 100 dates.';
    else if (!r.dates.every((d) => d && isDate(d.date) && isTime(d.start))) e.recurrence = 'Each date needs a day and a start time.';
    else if (new Set(r.dates.map((d) => d.date + d.start)).size < r.dates.length) e.recurrence = 'That date and time is already in the list.';
  } else e.recurrence = 'Choose when it happens.';
  if (!e.recurrence && (r.type === 'weekly' || r.type === 'nth')) {
    for (const k of ['startDate', 'until']) if (!blank(r[k]) && !isDate(r[k])) e.recurrence = 'Pick a real first or last date.';
    if (!e.recurrence && r.startDate && r.until && r.until < r.startDate) e.recurrence = 'The last date is before the first date.';
  }
  return e;
}

/** The series as stored: only known fields, text stripped of tags and capped, links through safeUrl. Run validate() first. */
export function clean(s) {
  const o = { id: s.id, title: text(s.title, 80), game: s.game, format: text(s.format, 60), kind: s.kind, recurrence: cleanRec(s.recurrence) };
  for (const k of TIMES) o[k] = blank(s[k]) ? null : s[k];
  o.fee = blank(s.fee) ? null : s.fee;
  o.signup = blank(s.signup) ? null : s.signup;
  o.playStyle = blank(s.playStyle) ? null : s.playStyle;
  for (const k of ['capacity', 'minPlayers', 'points', 'roundMinutes', 'cutoffHours']) if (!blank(s[k])) o[k] = s[k];
  for (const k of BOOLS) if (s[k] !== undefined) o[k] = s[k];
  if (!blank(s.cutoff)) o.cutoff = s.cutoff;
  o.ageNote = s.kidsWelcome === true ? null : text(s.ageNote, 60) || null;
  o.arriveByMins = ['here', 'counter'].includes(s.signup) && !blank(s.arriveByMins) ? s.arriveByMins : null;
  for (const [k, max] of [['prize', 300], ['bring', 300], ['cedhSeries', 40], ['listDeadline', 80], ['todo', 300], ['source', 300]]) if (!blank(s[k])) o[k] = text(s[k], max);
  if (!blank(s.description)) o.description = para(s.description, 2000);
  const name = text(s.tool?.name, 60), url = blank(s.tool?.url) ? null : safeUrl(s.tool.url), code = text(s.tool?.code, 60);
  if (name || url || code) o.tool = { name, ...(url && { url }), ...(code && { code }) };
  if (s.externalCount) o.externalCount = { ...s.externalCount };
  return o;
}
function cleanRec(r) {
  const o = r.type === 'none' ? { type: 'none', date: r.date } : r.type === 'weekly' ? { type: 'weekly', day: r.day }
    : r.type === 'nth' ? { type: 'nth', nth: r.nth, day: r.day }
      : { type: 'dates', dates: r.dates.map((d) => ({ date: d.date, start: d.start })).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)) };
  if (r.type === 'weekly' || r.type === 'nth') for (const k of ['startDate', 'until']) if (!blank(r[k])) o[k] = r[k];
  return o;
}

/** URL-safe id from a title, unique among `taken`. */
export function newId(title, taken) {
  const base = text(title, 80).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'event';
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

/** Errors for one-date exception input (the series must already be known). */
export function validateException(x) {
  const e = {};
  if (!x || typeof x !== 'object' || Array.isArray(x)) return { form: 'Send the change as an object.' };
  if (!isSlot(x.date)) e.date = 'Pick the date.';
  if (!['cancel', 'change'].includes(x.type)) e.type = 'Cancel it or change it.';
  if (!blank(x.start) && !isTime(x.start)) e.start = 'Use a time like 19:00.';
  if (!blank(x.capacity) && !isInt(x.capacity, 1, 9999)) e.capacity = 'Seats must be a whole number, 1 or more.';
  if (!blank(x.note) && typeof x.note !== 'string') e.note = 'Note must be text.';
  if (!blank(x.movedTo)) {
    if (!isDate(x.movedTo)) e.movedTo = 'Pick a real date.';
    else if (isSlot(x.date) && Math.abs(parseDay(x.movedTo) - parseDay(x.date.slice(0, 10))) > MOVE_DAYS * 864e5) e.movedTo = `Move it by at most ${MOVE_DAYS} days.`;
  }
  if (x.type === 'change' && !Object.keys(e).length && blank(x.start) && blank(x.capacity) && (blank(x.movedTo) || x.movedTo === x.date.slice(0, 10)) && !text(x.note, 200)) e.type = 'Change the time, seats, date or add a note.';
  return e;
}
export function cleanException(seriesId, x, updated) {
  const o = { series: seriesId, date: x.date, type: x.type };
  if (x.type === 'change') {
    if (!blank(x.start)) o.start = x.start;
    if (!blank(x.capacity)) o.capacity = x.capacity;
    if (!blank(x.movedTo) && x.movedTo !== x.date.slice(0, 10)) o.movedTo = x.movedTo;
  }
  const note = text(x.note, 200);
  if (note) o.note = note;
  if (updated) o.updated = updated;
  return o;
}

// ---------- copy text (D18, DESIGN.md 15.3) ----------
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const T12 = (t) => (t === '12:00' ? 'noon' : t === '00:00' ? 'midnight' : `${+t.slice(0, 2) % 12 || 12}${t.slice(3) === '00' ? '' : ':' + t.slice(3)} ${+t.slice(0, 2) < 12 ? 'AM' : 'PM'}`);
const dayWords = (ymd) => { const d = parseDay(ymd); return `${DAYS[d.getUTCDay()]}, ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCDate()}`; };
const SIGNUP_WORDS = { walkin: 'Just show up. No sign-up needed.', here: 'Sign up on our website to hold a seat.', counter: 'Pre-register at the counter.' };

/** Plain-text post for one date (the 15.3 template), ready to paste into Facebook, Discord, Google Business Profile or the Wizards locator.
 *  Never HTML; a missing value leaves its line out. null when the series has no event on that date. exceptions: the stored one-date exceptions. */
export function copyText(s, date, baseUrl, exceptions = []) {
  if (!isSlot(date)) return null; // a bad ?date= is a 404, not a thrown RangeError
  const near = occurrences(s, addDays(date.slice(0, 10), -MOVE_DAYS), addDays(date.slice(0, 10), MOVE_DAYS), exceptions);
  const o = near.find((x) => x.slot === date) || near.find((x) => x.date === date); // the slot key, or a shown (e.g. moved-to) date
  if (!o) return null;
  const key = date;
  date = o.date;
  const link = (d) => safeUrl(baseUrl) && `${baseUrl.replace(/\/+$/, '')}/events/${encodeURIComponent(s.id)}?date=${encodeURIComponent(key)}`;
  const lines = [];
  if (o.cancelled) {
    lines.push(`Cancelled: ${s.title}`, dayWords(date));
    if (o.note) lines.push(o.note);
    const next = occurrences(s, date, addDays(date, 120), exceptions).find((x) => !x.cancelled && (x.date > date || (x.start || '') > (o.start || '')));
    if (next) lines.push(`Next one: ${dayWords(next.date)}${next.start ? `, ${T12(next.start)}` : ''}`);
    if (link(date)) lines.push(`Details: ${link(date)}`);
    return lines.join('\n');
  }
  lines.push(s.title);
  const times = [o.doors && `doors ${T12(o.doors)}`, o.start && `starts ${T12(o.start)}`].filter(Boolean).join(', ');
  lines.push(`${dayWords(date)}${times ? `, ${times}` : ''}${o.start && o.end ? ` to ${T12(o.end)}` : ''}`);
  if (o.changed || o.moved) {
    const e = exceptions.find((x) => x.series === s.id && x.date === o.slot);
    lines.push(`Changed: ${o.note || (e?.start && o.start ? `Starts at ${T12(o.start)} this week${s.start ? ` (usually ${T12(s.start)})` : ''}.`
      : e?.capacity ? `Seats changed to ${e.capacity} for this date.` : `Moved from ${dayWords(o.originalDate)}.`)}`);
  }
  if (Number.isInteger(s.fee)) lines.push(s.fee === 0 ? 'Free entry' : `Entry $${s.fee}`);
  const url = safeUrl(s.tool?.url);
  const signup = s.inviteOnly ? 'Invite only.' : s.signup === 'external' ? `Sign up online${url ? `: ${url}` : ''}` : SIGNUP_WORDS[s.signup];
  if (signup) lines.push(signup);
  if (link(date)) lines.push(`${s.signup === 'here' ? 'Details and sign-up' : 'Details'}: ${link(date)}`);
  return lines.join('\n');
}

// ---------- templates (DESIGN.md 9.3 step 2, 15.2 defaults) ----------
// A template is {id, game, name, fields}; fields is a series body without id and without real dates (the editor fills the first date).
// Built-ins live here; staff-saved ones ("Yours") are stored server side and checked with validateTemplate() / cleanTemplate().
// No template sets arriveByMins (store policy, OWNER-QUESTIONS Q8). Learn to play: beginner friendly + kids welcome. cEDH and RCQ: competitive.
const wk = (day) => ({ type: 'weekly', day });
const nthDay = (nth, day) => ({ type: 'nth', nth, day });
const one = { type: 'none' };
const slots = (...starts) => ({ type: 'dates', dates: starts.map((start) => ({ start })) });
const tpl = (game, id, name, f) => ({ id, game, name, fields: { game, kind: 'weekly', signup: 'walkin', ...f } });
const TOPDECK = 'https://topdeck.gg/mulligangames';
const L2P = { kind: 'learn', fee: 0, kidsWelcome: true, beginnerFriendly: true };
const EL = { name: 'Wizards EventLink' };
export const TEMPLATES = [
  tpl('magic', 't-draft', 'Draft night', { title: 'Draft Night', format: 'Draft', recurrence: wk(5), start: '19:00', end: '23:00', fee: 20, capacity: 28, signup: 'here', waitlist: true, tool: EL, prize: 'Prize packs paid by record.', bring: 'Nothing. Packs are included.' }),
  tpl('magic', 't-commander', 'Commander night', { title: 'Commander Night', format: 'Commander', kind: 'open', recurrence: wk(4), start: '17:00', end: '22:00', fee: 0, playStyle: 'casual', description: 'Casual pods. Tell the counter your power level and we will seat you.' }),
  tpl('magic', 't-pauper', 'Pauper', { title: 'Pauper Night', format: 'Pauper', recurrence: wk(3), start: '19:00', end: '22:00', fee: 10, capacity: 28, signup: 'here', waitlist: true, tool: EL, prize: 'Prizes paid by record.', bring: 'A 60-card Pauper deck.' }),
  tpl('magic', 't-standard', 'Standard Showdown', { title: 'Standard Showdown', format: 'Standard', recurrence: wk(3), start: '19:00', end: '22:00', fee: 10, tool: EL, prize: 'Standard Showdown promo packs.', bring: 'A Standard deck.' }),
  tpl('magic', 't-premodern', 'Pre-Modern', { title: 'Pre-Modern', format: 'Pre-Modern', recurrence: wk(4), start: '19:00', end: '22:00', fee: 10, tool: EL, bring: 'A Pre-Modern deck (sets from Fourth Edition to Scourge).' }),
  tpl('magic', 't-prerelease', 'Prerelease', { title: 'Prerelease', format: 'Prerelease', kind: 'prerelease', recurrence: slots('19:00', '15:00', '17:00'), start: '19:00', fee: 50, signup: 'counter', tool: EL, bring: 'Nothing. Your prerelease kit is included.', featured: true }),
  tpl('magic', 't-rcq', 'RCQ', { title: 'Standard RCQ', format: 'RCQ', kind: 'special', recurrence: one, start: '12:00', doors: '11:00', end: '20:00', fee: 20, capacity: 32, minPlayers: 8, signup: 'here', waitlist: true, playStyle: 'competitive', tool: EL, featured: true, prize: 'Prizing to the winners. 5 rounds Swiss, top 8.' }),
  tpl('magic', 't-magic-l2p', 'Learn to play', { ...L2P, title: 'Learn to Play Magic', format: 'Learn to play', recurrence: wk(3), start: '18:00', end: '20:00', description: 'Staff teach the game with loaner decks.' }),
  tpl('cedh', 't-mcs', 'Championship Series', { title: 'Championship Series', format: 'Championship Series', kind: 'cedh', recurrence: nthDay(1, 0), start: '10:00', end: '20:00', fee: 40, signup: 'external', playStyle: 'competitive', tool: { name: 'TopDeck', url: 'https://topdeck.gg/circuit/mulligans' }, cedhSeries: 'mcs', featured: true, prize: 'A guaranteed dual land every month. Each winner gets an invitational seat.', bring: 'A cEDH deck. Up to 10 proxies, judge-approved, with full rules text.' }),
  tpl('cedh', 't-5k', '5K', { title: '5K cEDH Tournament', format: '5K', kind: 'cedh', recurrence: one, start: '10:00', end: '22:00', fee: 60, signup: 'external', playStyle: 'competitive', tool: { name: 'TopDeck', url: TOPDECK }, cedhSeries: '5k', featured: true }),
  tpl('cedh', 't-redemption', 'Redemption', { title: 'Redemption', format: 'Redemption', kind: 'cedh', recurrence: one, start: '12:00', end: '20:00', fee: 20, signup: 'external', playStyle: 'competitive', tool: { name: 'TopDeck', url: TOPDECK }, cedhSeries: 'redemption' }),
  tpl('cedh', 't-cedh-weekly', 'Weekly', { title: 'cEDH Weekly', format: 'Weekly', recurrence: wk(0), start: '14:00', end: '20:00', fee: 10, playStyle: 'competitive', tool: { name: 'TopDeck', url: TOPDECK }, bring: 'A cEDH deck. Up to 10 proxies, judge-approved.' }),
  tpl('pokemon', 't-pk-league', 'League night', { title: 'Pokemon League Night', format: 'League night', recurrence: wk(6), start: '18:30', end: '21:30', fee: 5, kidsWelcome: true, tool: { name: 'Play! Pokemon' } }),
  tpl('pokemon', 't-pk-cup', 'League Cup', { title: 'Pokemon League Cup', format: 'League Cup', kind: 'special', recurrence: one, start: '12:00', end: '19:00', fee: 15, capacity: 32, signup: 'here', waitlist: true, tool: { name: 'Play! Pokemon' }, bring: 'A 60-card deck.' }),
  tpl('pokemon', 't-pk-challenge', 'League Challenge', { title: 'Pokemon League Challenge', format: 'League Challenge', kind: 'special', recurrence: one, start: '12:00', end: '18:00', fee: 10, capacity: 24, signup: 'here', waitlist: true, tool: { name: 'Play! Pokemon' }, bring: 'A 60-card deck.' }),
  tpl('pokemon', 't-pk-prerelease', 'Prerelease', { title: 'Pokemon Prerelease', format: 'Prerelease', kind: 'prerelease', recurrence: slots('12:00', '15:00'), start: '12:00', fee: 30, signup: 'counter', tool: { name: 'Play! Pokemon' } }),
  tpl('pokemon', 't-pk-l2p', 'Learn to play', { ...L2P, title: 'Learn to Play Pokemon', format: 'Learn to play', recurrence: wk(3), start: '19:00', end: '21:00', description: 'Staff teach the game with loaner decks. Kids welcome.' }),
  tpl('onepiece', 't-op-store', 'Store tournament', { title: 'One Piece', format: 'Store tournament', recurrence: wk(4), start: '19:00', end: '22:00', fee: 5, tool: { name: 'Bandai TCG+' } }),
  tpl('onepiece', 't-op-l2p', 'Learn to play', { ...L2P, title: 'Learn to Play One Piece', format: 'Learn to play', recurrence: one, start: '18:00', end: '20:00' }),
  tpl('riftbound', 't-rb-nexus', 'Nexus Nights', { title: 'Nexus Nights', format: 'Nexus Nights', recurrence: wk(5), start: '19:00', end: '22:00', fee: 5, tool: { name: 'PlayRiftbound' } }),
  tpl('riftbound', 't-rb-skirmish', 'Summoner Skirmish', { title: 'Summoner Skirmish', format: 'Summoner Skirmish', kind: 'special', recurrence: nthDay(2, 6), start: '12:00', doors: '11:00', end: '18:00', fee: 10, signup: 'external', tool: { name: 'PlayRiftbound', url: 'https://tinyurl.com/RBMulliganGames' }, prize: 'Paid by record. Winner gets a playmat and a bye; top 8 and participation promos.' }),
  tpl('riftbound', 't-rb-prerelease', 'Prerelease', { title: 'Riftbound Prerelease', format: 'Prerelease', kind: 'prerelease', recurrence: slots('12:00', '15:00'), start: '12:00', fee: 30, signup: 'counter', tool: { name: 'PlayRiftbound' } }),
  tpl('hololive', 't-hl-weekly', 'Weekly', { title: 'Hololive OCG', format: 'Weekly', recurrence: wk(4), start: '18:30', end: '21:30', fee: 5, tool: { name: 'Other' } }),
  tpl('warhammer', 't-wh-open', 'Open tables', { title: 'Tabletop and Warhammer', format: 'Open tables', kind: 'open', recurrence: wk(3), start: '17:00', end: '22:00', fee: 0, description: 'Bring your army or any tabletop game. Tables are first come, first served.', bring: 'Your army, dice and tape measure.' }),
  tpl('warhammer', 't-wh-40k', '40k event', { title: '40k Tournament', format: '40k', kind: 'special', recurrence: one, start: '10:00', end: '19:00', fee: 25, capacity: 16, minPlayers: 6, signup: 'here', waitlist: true, tool: { name: 'Best Coast Pairings' }, points: 2000, roundMinutes: 150, bring: 'A painted 2000-point army, your list, dice and tape measure.' }),
  tpl('warhammer', 't-wh-killteam', 'Kill Team', { title: 'Kill Team Night', format: 'Kill Team', recurrence: wk(2), start: '18:00', end: '21:00', fee: 5, tool: { name: 'Best Coast Pairings' }, roundMinutes: 75 }),
  tpl('warhammer', 't-wh-paint', 'Painting lesson', { title: 'Painting Lesson', format: 'Painting', kind: 'learn', recurrence: one, start: '14:00', end: '16:00', fee: 10, capacity: 8, signup: 'here', waitlist: true, bring: 'Nothing. Paints and brushes are on the table.' }),
  tpl('other', 't-dnd', 'D&D open play', { title: 'D&D Open Play', format: 'D&D', kind: 'open', recurrence: wk(3), start: '19:00', end: '22:00', fee: 0, description: 'Drop-in tables for new and returning players.' }),
  tpl('other', 't-trade', 'Trade night', { title: 'Trade Night', format: 'Trade night', kind: 'open', recurrence: one, start: '18:00', end: '21:00', fee: 0 }),
  tpl('other', 't-charity', 'Charity event', { title: 'Charity Event', format: 'Charity', kind: 'special', recurrence: one, start: '12:00', end: '20:00', fee: 0, description: 'All welcome. Proceeds and donations go to the cause named on the flyer.' }),
];

/** A series body that is only missing real dates gets a stand-in date, so validate() judges every other field. */
const PLACEHOLDER = '2000-01-03';
function probe(f) {
  const r = f.recurrence;
  let recurrence = r;
  if (r?.type === 'none') recurrence = { type: 'none', date: PLACEHOLDER };
  else if (r?.type === 'dates' && Array.isArray(r.dates)) recurrence = { type: 'dates', dates: r.dates.slice(0, 100).map((d) => ({ date: PLACEHOLDER, start: d?.start })) };
  else if (r?.type === 'weekly' || r?.type === 'nth') recurrence = { type: r.type, day: r.day, nth: r.nth }; // first and last dates are never part of a template
  return { ...f, id: undefined, title: text(f.title, 80) ? f.title : 'Template', recurrence };
}
/** Errors for a staff-saved template {name, fields}; field errors are keyed like validate() so the editor shows them under the field. */
export function validateTemplate(t) {
  if (!t || typeof t !== 'object' || Array.isArray(t)) return { form: 'Send the template as an object.' };
  const f = t.fields;
  if (!f || typeof f !== 'object' || Array.isArray(f)) return { form: 'Send the template fields as an object.' };
  const e = validate(probe(f));
  if (!text(t.name, 60)) e.name = 'Give the template a name.';
  return e;
}
/** The template as stored: only known fields (clean()), no id, no real dates. Run validateTemplate() first. */
export function cleanTemplate(t, id) {
  const s = clean(probe(t.fields)), r = s.recurrence;
  delete s.id;
  s.title = text(t.fields.title, 80);
  s.recurrence = r.type === 'none' ? { type: 'none' } : r.type === 'dates' ? { type: 'dates', dates: r.dates.map((d) => ({ start: d.start })) } : r;
  return { id, game: s.game, name: text(t.name, 60), fields: s };
}
