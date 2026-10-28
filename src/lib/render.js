// Server-side HTML for the public pages, filled into the built pages at <!--mg:name--> markers (D11) from the live database.
// D20: markup is only ever a constant template literal. Every interpolated value is HTML-escaped by the `h` tag (the server twin of Astro's {expr}),
// nested h`...` results pass through, and a link from stored data goes through safeUrl first. Nothing here builds HTML by concatenating data.
import { esc } from './state.js';
import { ICONS } from './icons.js';
import { addDays, dayMin, dow, hmOf, realDay, toMin } from './clock.js';
import { expand, occurrences, safeUrl } from './events.js';
import { endM, seatState, startM } from './seats.js';
import { hoursFor, openStatus } from './store-hours.js';
import { MAX, RETENTION_DAYS, playerIdLabel } from './registrations.js';
import { validClip, FEATURED } from './clips.js';
import clipData from '../content/clips.json' with { type: 'json' };
import { photoFor, photosForDay, photoPos } from './photos.js';

// ---------- the escaping template tag ----------
class Html { constructor(s) { this.s = s; } toString() { return this.s; } }
const part = (v) => (v instanceof Html ? v.s : Array.isArray(v) ? v.map(part).join('') : v === null || v === undefined || v === false ? '' : esc(v));
/** h`<p>${userText}</p>`: the literal parts are markup, every ${value} is escaped (an h`` result or an array of them is kept as markup). */
export const h = (strs, ...vals) => new Html(strs.reduce((a, s, i) => a + s + (i < vals.length ? part(vals[i]) : ''), ''));
/** Already-safe text (JSON-LD made by ldScript, which escapes "<"), passed through h`` unchanged. Never use it on data. */
export const safe = (s) => new Html(s);

// ---------- icons (constant paths, see icons.js) ----------
const P = ICONS;
export const icon = (name, cls = '') => h`<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${new Html(P[name] ?? '')}</svg>`;

// ---------- words ----------
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const parse = (ymd) => new Date(`${ymd}T00:00:00Z`);
export const dayName = (ymd) => DAYS[dow(ymd)];
export const dayShort = (ymd) => DAYS[dow(ymd)].slice(0, 3);
export const monthShort = (ymd) => MONTHS[parse(ymd).getUTCMonth()].slice(0, 3);
export const dayNum = (ymd) => parse(ymd).getUTCDate();
export const fmtDate = (ymd) => `${monthShort(ymd)} ${dayNum(ymd)}`; // Oct 30
export const fmtLong = (ymd) => `${dayName(ymd)}, ${MONTHS[parse(ymd).getUTCMonth()]} ${dayNum(ymd)}`; // Friday, October 30
/** "19:00" -> "7 PM", "18:30" -> "6:30 PM", "24:00" and "00:00" -> "midnight", "12:00" -> "noon". The space before AM/PM does not break. */
export function fmtTime(hm) {
  if (!hm) return '';
  const m = toMin(hm) % 1440, hh = Math.floor(m / 60), mm = m % 60;
  if (m === 0) return 'midnight';
  if (m === 720) return 'noon';
  return `${hh % 12 || 12}${mm ? ':' + String(mm).padStart(2, '0') : ''}\u00a0${hh >= 12 ? 'PM' : 'AM'}`;
}
/** "Free", "$20", or nothing at all when the fee is not known (a stray "?" would look like a mistake). */
export const fmtFee = (f) => (f === 0 ? 'Free' : Number.isInteger(f) ? `$${f}` : '');
const list = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
/** "today" | "tomorrow" | "Wednesday" | "Wed Nov 4" relative to the store's today. */
export function relDay(ymd, today) {
  const diff = Math.round((dayMin(ymd) - dayMin(today)) / 1440);
  return diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : diff > 1 && diff < 7 ? dayName(ymd) : `${dayShort(ymd)} ${fmtDate(ymd)}`;
}
const updatedWords = (u, today) => (!u ? '' : u === today ? 'Updated today.' : u === addDays(today, -1) ? 'Updated yesterday.' : `Updated ${fmtDate(u)}.`);

// ---------- context ----------
/** ctx = { store, series, exceptions, games, releases, now: etNow(), keepNow: 'YYYY-MM-DDTHH:MM' | null (test clock, kept in links), query: URLSearchParams } */
const gameOf = (ctx, id) => ctx.games.find((g) => g.id === id) ?? ctx.games.find((g) => g.id === 'other') ?? { id: 'other', short: 'Other' };
export const inGame = (ctx, o, chip) => !chip || chip === 'all' || o.game === chip || gameOf(ctx, o.game).family === chip;
const keep = (ctx, path, params = {}) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  if (ctx.keepNow) q.set('now', ctx.keepNow);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
};
/** The page of one event date: /events/<id>?date=<slot> (the slot key of D23, the same link copyText() makes). */
export const eventPath = (o) => `/events/${encodeURIComponent(o.seriesId)}?date=${encodeURIComponent(o.slot)}`;
const eventHref = (ctx, o) => (ctx.keepNow ? `${eventPath(o)}&now=${encodeURIComponent(ctx.keepNow)}` : eventPath(o));
const idKey = (o) => `${o.seriesId}-${o.slot}`.replace(/[^A-Za-z0-9-]/g, '');
export const mapsUrl = (store) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.address.street} ${store.address.city} ${store.address.region} ${store.address.zip}`)}`;
const live = (o) => !o.cancelled;
/** Seats taken and people waiting for one occurrence, from ctx.counts (registrations.js countsMap); none when nobody has signed up. */
const regsOf = (ctx, o) => ctx.counts?.get(`${o.seriesId}|${o.slot}`) ?? {};

/** Occurrences between two dates that have not ended yet, earliest first. */
export function upcoming(ctx, from, to) {
  return expand(ctx.series, from, to, ctx.exceptions).filter((o) => endM(o) > ctx.now.m);
}

// ---------- small pieces ----------
const gameBadge = (ctx, id) => { const g = gameOf(ctx, id); return h`<span class="gbadge" data-game="${g.id}">${icon(P[g.id] ? g.id : 'other', 'gi')}<span>${g.short}</span></span>`; };
const statBox = (big, unit, small, ic) => h`<p class="ev-stat">${icon(ic)}<span class="ev-stat-big">${big}</span>${unit ? h`<span class="ev-stat-unit">${unit}</span>` : ''}${small ? h`<span class="ev-stat-small">${small}</span>` : ''}</p>`;
const ext = (name) => h`<span class="vh"> (opens ${name || 'another site'})</span>${icon('external', 'ic-ext')}`;

/** Time line for a card or page: "7 PM to 11 PM", "Doors 11 AM, starts noon", or "Time to be announced". */
export function timeLine(o) {
  if (!o.start) return 'Time to be announced';
  if (o.doors) return `Doors ${fmtTime(o.doors)}, starts ${fmtTime(o.start)}${o.end ? `, until ${fmtTime(o.end)}` : ''}`;
  return `${fmtTime(o.start)}${o.end ? ` to ${fmtTime(o.end)}` : ''}`;
}
/** The words for a changed date: the owner's note, else the server's sentence (D22 6). */
export function changeLine(o) {
  if (o.note) return o.note;
  if (o.moved) return `Moved from ${fmtLong(o.originalDate)}.`;
  if (o.baseStart && o.start && o.start !== o.baseStart) return `Starts at ${fmtTime(o.start)} this week (usually ${fmtTime(o.baseStart)}).`;
  if (o.capacity !== undefined && o.changed) return 'Details changed for this date.';
  return 'Changed for this date.';
}
/** D17 tags after On now: beginner friendly, kids / age rule, play style, invite only (DESIGN.md 15.5). */
function tagRow(o, st) {
  return h`${st.onNow ? h`<span class="tag tag-now"><span class="dot" aria-hidden="true"></span>On now</span>` : ''}${o.beginnerFriendly ? h`<span class="tag">${icon('sprout')}Beginner friendly</span>` : ''}${o.kidsWelcome ? h`<span class="tag">${icon('kid')}Kids welcome</span>` : o.ageNote ? h`<span class="tag">${icon('info')}${o.ageNote}</span>` : ''}${o.playStyle === 'casual' ? h`<span class="tag">${icon('mug')}Casual</span>` : o.playStyle === 'competitive' ? h`<span class="tag">${icon('trophy')}Competitive</span>` : ''}${o.inviteOnly ? h`<span class="tag">${icon('lock')}Invite only</span>` : ''}`;
}
/** The cost pip in a card's name bar; nothing when the fee is not known. */
const costPip = (o) => (fmtFee(o.fee) ? h`<p class="ev-cost"><span class="vh">Entry: </span>${fmtFee(o.fee)}</p>` : '');
const arriveLine = (o, st) => (o.arriveBy && ['here', 'counter'].includes(o.signup) && !o.cancelled && st.state !== 'walkin' && st.state !== 'external'
  ? h`<p class="ev-arrive">${icon('clock')}Arrive by ${fmtTime(o.arriveBy)} to keep your seat.</p>` : '');

/** The card's one action and its stat box (DESIGN.md 5.3 states). `href` = where "Sign up" goes (the date page). */
function actionArea(ctx, o, st, href, page = false) {
  const tool = o.tool ?? {}, toolUrl = safeUrl(tool.url), store = ctx.store;
  let act = '', stat = '';
  switch (st.state) {
    case 'open': case 'few':
      act = h`<a class="btn btn-act" href="${href}">Sign up</a>`;
      stat = st.cap ? statBox(st.left, st.left === 1 ? 'seat left' : 'seats left', st.state === 'few' ? 'almost full' : `of ${st.cap}`, st.state === 'few' ? 'alert' : 'seat') : '';
      break;
    case 'needs':
      act = h`<a class="btn btn-act" href="${href}">Sign up</a>`;
      stat = statBox(st.taken, 'signed up', `needs ${st.min} to run`, 'users');
      break;
    case 'waitlist': act = h`<a class="btn btn-2" href="${href}">Join the waitlist</a>`; stat = statBox('Full', '', st.waiting ? `${st.waiting} waiting` : 'waitlist open', 'hourglass'); break;
    case 'full': act = h`<p class="ev-how">Full. Ask at the counter about open seats.</p>`; stat = statBox('Full', '', '', 'lock'); break;
    case 'closed':
      act = h`<p class="ev-how">${st.cap && !st.left ? 'Sign-ups closed. All seats are taken.' : 'Sign-ups closed. Walk in if seats are left.'}</p>`;
      stat = !st.cap ? '' : st.left ? statBox(st.left, st.left === 1 ? 'seat left' : 'seats left', `of ${st.cap}`, 'seat') : statBox('Full', '', '', 'lock');
      break;
    case 'walkin': act = page ? h`<p class="ev-how">${icon('door')}Walk in. No sign-up needed.</p>` : ''; break; // walk-in is said once per section, not on every card (round 4, F2)
    case 'counter': {
      const tel = safeUrl(store.phoneHref);
      act = h`<p class="ev-how">${icon('door')}Pre-register at the counter.</p>${tel ? h`<a class="btn btn-2" href="${tel}">${icon('phone')}Call the shop</a>` : ''}`;
      break;
    }
    case 'external':
      act = o.inviteOnly ? h`<p class="ev-how">${icon('lock')}Invite only. Seats come from the Championship Series.</p>`
        : toolUrl ? h`<a class="btn btn-act" href="${toolUrl}" target="_blank" rel="noopener">${tool.name ? `Sign up on ${tool.name}` : 'Sign up online'}${ext(tool.name)}</a>`
          : h`<p class="ev-how">Sign up ${tool.name ? `on ${tool.name}` : 'online'}.</p>`;
      if (st.count) stat = statBox(st.count, 'registered', tool.name ? `on ${tool.name}` : '', 'users');
      break;
    default: break;
  }
  return h`${act}${stat}`;
}

// ---------- photos (constant map in photos.js; decorative, so alt is empty and the box is aria-hidden) ----------
// Bands (big) get the 1600 copy on dense screens; thumbs and strip caps (48-150px) stay on -800.
const photoImg = (p, big = false) => h`<img src="/img/social/${p.file}-800.webp"${big ? h` srcset="/img/social/${p.file}-800.webp 800w, /img/social/${p.file}.webp 1600w" sizes="(min-width: 1024px) 30rem, 100vw"` : ''} width="800" height="600" alt="" loading="lazy" decoding="async" style="object-position:${photoPos(p)}">`;
const tintAttr = (p) => (p.tint ? h` data-tint` : '');

// ---------- the event card ----------
/** opts: { photo } a photo band above the title (front page, today and the next day); { compact } hide the description; { every } collapsed weekly card: "7 PM to 10 PM" + a "Next: ..." line only when the next date is cancelled or changed (nextNote). */
export function card(ctx, o, opts = {}) {
  const st = seatState(o, ctx.now.m, regsOf(ctx, o)), href = eventHref(ctx, o), key = (opts.again ? 'tt' : '') + idKey(o), g = gameOf(ctx, o.game);
  const time = opts.every ? `${fmtTime(o.baseStart ?? o.start)}${o.end ? ` to ${fmtTime(o.end)}` : ''}` : timeLine(o); // under its weekday heading a weekly card says just "7 PM to 10 PM"
  let body = '';
  if (o.cancelled) body = h`<p class="ev-note">${o.note || 'This date is cancelled.'} ${updatedWords(o.updated, ctx.now.ymd)}</p>`;
  else {
    if (o.changed || o.moved) body = h`<p class="ev-note"><span class="tag tag-upd">${icon('pencil')}Changed</span> ${changeLine(o)} ${updatedWords(o.updated, ctx.now.ymd)}</p>`;
    body = h`${body}${o.prize ? h`<p class="ev-prize">${o.prize}</p>` : o.description && !opts.compact ? h`<p>${o.description}</p>` : ''}`;
  }
  const foot = o.cancelled ? '' : actionArea(ctx, o, st, href);
  return h`<article class="ev" data-game="${o.game}" data-fgame="${o.game}" data-ffam="${g.family ?? o.game}" data-state="${st.state}"${st.onNow ? ' data-now' : ''} id="c-${key}" aria-labelledby="t-${key}">
${opts.photo ? h`<figure class="ev-ph ph" aria-hidden="true"${tintAttr(opts.photo)}>${photoImg(opts.photo, true)}</figure>` : ''}<div class="ev-bar"><h4 class="ev-title" id="t-${key}"><a href="${href}">${o.title}</a></h4>${costPip(o)}</div>
<p class="ev-type">${gameBadge(ctx, o.game)}${o.format ? h`<span class="ev-fmt">${o.format}</span>` : ''}</p>
<div class="ev-text"><p class="ev-when">${icon('clock')}<span>${time}</span>${tagRow(o, st)}</p>${opts.nextNote ? h`<p class="ev-next">${opts.nextNote}</p>` : ''}${opts.also ? h`<p class="ev-also">${opts.also}</p>` : ''}${arriveLine(o, st)}${body}</div>
${o.cancelled ? h`<p class="ev-stamp">${icon('cancel')}Cancelled</p>` : ''}${foot.s ? h`<div class="ev-foot">${foot}</div>` : ''}
</article>`;
}

/** The cards of one list, in time order. Each card shows its own time, so there are no time labels or groups (round 4, F5). */
const cardList = (ctx, items, { photo, ...cardOpts } = {}) => items.map((x) => (x.o ? card(ctx, x.o, { ...cardOpts, ...x.opts, photo: photo?.(x.o) }) : card(ctx, x, { ...cardOpts, photo: photo?.(x) })));

// ---------- strip, hero ----------
function openText(ctx) {
  const st = openStatus(ctx.store, ctx.now);
  if (!st.known) return { open: false, body: h`<strong>Hours coming soon.</strong> Call the shop for today’s hours.` };
  if (st.open) return { open: true, body: h`<strong>Open now</strong> till ${fmtTime(st.closeHm)}` };
  if (!st.next) return { open: false, body: h`<strong>${st.laterUnknown ? (st.today.closed ? 'Closed today.' : 'Closed now.') : 'Closed'}</strong>` };
  const rel = relDay(st.next.date, ctx.now.ymd), t = fmtTime(st.next.hm);
  if (rel === 'today') return { open: false, body: h`<strong>Closed now.</strong> Opens at ${t}` };
  return { open: false, body: h`<strong>${st.today.closed ? 'Closed today.' : 'Closed now.'}</strong> Opens ${rel} at ${t}` };
}
export function strip(ctx) {
  const s = openText(ctx);
  return h`<p class="ob-status" id="ob-status"${s.open ? h` data-open=""` : ''}><span class="ob-dot" aria-hidden="true"></span><span>${s.body}</span></p>`;
}

/** The hero chip, from the hours only: "Open now · till midnight", "Opens 2 PM today", "Closed today · back Wed 2 PM", "Closed · back tomorrow 2 PM". */
export function chipText(ctx, st) {
  const { now } = ctx;
  if (!st.known) return { open: false, text: 'Hours coming soon' };
  if (st.open) return { open: true, text: `Open now · till ${fmtTime(st.closeHm)}` };
  if (!st.next) return { open: false, text: st.laterUnknown ? (st.today.closed ? 'Closed today' : 'Closed') : 'Closed this week' };
  const rel = relDay(st.next.date, now.ymd), t = fmtTime(st.next.hm);
  if (rel === 'today') return { open: false, text: `Opens ${t} today` };
  const when = rel === 'tomorrow' ? rel : `${dayShort(st.next.date)}${rel.includes(' ') ? ` ${fmtDate(st.next.date)}` : ''}`; // over a week away adds the date
  return { open: false, text: `${st.today.closed ? 'Closed today' : 'Closed'} · back ${when} ${t}` };
}
const groupByStart = (list) => {
  const out = [];
  for (const o of list) { const l = out[out.length - 1]; if (l && l.date === o.date && l.start === o.start) l.items.push(o); else out.push({ date: o.date, start: o.start, items: [o] }); }
  return out;
};
const SUB = 'Welcome to Mulligan Games, Warminster’s friendly game store: a big play room, free play every day we’re open, and card nights all week. Come say hi.';
// Phones: one secondary button to the first featured clip (the hero strip's clips link is hidden under 768px). A plain link; clips.js opens the dialog. Nothing when the clip is gone or invalid.
const fc = clipData.find((c) => c.id === FEATURED[0] && validClip(c));
const CLIP_BTN = fc ? h`<a class="btn btn-clip" href="${fc.url}" ${fc.file ? h`data-file="${fc.file}"` : h`data-tt="${fc.id}"`} data-caption="${fc.caption}" target="_blank" rel="noopener">${icon('play')}Watch a clip<span class="vh"> (TikTok, opens a video)</span></a>` : '';

export function hero(ctx) {
  const { now, store } = ctx, st = openStatus(store, now), week = upcoming(ctx, addDays(now.ymd, -1), addDays(now.ymd, 6)); // from yesterday: an event that runs past midnight is still On now
  const on = week.filter((o) => o.date <= now.ymd && live(o) && startM(o) !== null && startM(o) <= now.m);
  const ov = hoursFor(store, now.ymd), chip = chipText(ctx, st);
  const sub = `${SUB}${ov.override && ov.note && ov.note.length <= 60 ? ` ${ov.note}` : ''}`; // a short date-override note (early close) is the only thing added
  // next up diamond: the next start time (or what is on now when nothing else starts tonight)
  const upcomingEvents = week.filter((o) => live(o) && startM(o) !== null && startM(o) > now.m);
  const slot = upcomingEvents.length ? groupByStart(upcomingEvents)[0] : on.length ? { date: now.ymd, start: on[0].start, items: on, on: true } : null;
  let next = '';
  if (slot) {
    const shown = slot.items.slice(0, 2).map((o) => o.title), more = slot.items.length - shown.length, rel = relDay(slot.date, now.ymd);
    next = h`<a class="next" id="nextup" href="#d-${slot.date}"><span class="next-time">${fmtTime(slot.start)}</span><span class="next-in"><span class="next-k">${slot.on ? 'On now' : rel === 'today' ? 'Next up' : `Next up ${rel}`}</span><span class="next-what">${shown.join(', ')}${more ? ` and ${more} more` : ''}</span></span></a>`;
  } else next = h`<a class="next" id="nextup" href="#week"><span class="next-time">Soon</span><span class="next-in"><span class="next-k">Next up</span><span class="next-what">See this week</span></span></a>`;
  return h`<div class="phero-copy"><p class="phero-chip" id="hero-chip" role="status"${chip.open ? h` data-open=""` : ''}><span class="chip-dot" aria-hidden="true"></span><span id="hero-chip-t">${chip.text}</span></p><h1 class="phero-h" id="hero-h">Shuffle up. Everyone’s welcome.</h1><p class="phero-sub" id="hero-sub">${sub}</p><div class="phero-acts">${next}<a class="btn btn-act" href="#week">This week’s events</a>${CLIP_BTN}</div></div>`;
}

/** The seven-day strip at the top of "This week" (round 7): one plain tile per day, with the day, date and event count. */
function deck(ctx, week) {
  const { now, store } = ctx, items = [];
  for (let i = 0; i < 7; i++) {
    const ymd = addDays(now.ymd, i), hrs = hoursFor(store, ymd), evs = week.filter((o) => o.date === ymd && live(o)), closed = hrs.known && hrs.closed && !evs.length;
    const cap = closed ? 'Closed' : `${evs.length} ${evs.length === 1 ? 'event' : 'events'}`;
    items.push(h`<li style="--i:${i}"${i === 0 ? h` data-today=""` : ''}${closed ? h` data-closed=""` : ''}><a class="daycard" style="--i:${i}" href="#d-${ymd}" aria-label="${`${dayName(ymd)} ${fmtDate(ymd)}${i === 0 ? ', today' : ''}, ${cap.toLowerCase()}`}"><span class="dc-dow">${i === 0 ? 'Today' : dayShort(ymd)}</span><span class="dc-num">${dayNum(ymd)}</span><span class="dc-cap" aria-hidden="true">${cap}</span></a></li>`);
  }
  return h`<nav class="wdeck" aria-labelledby="wdeck-k"><p class="wdeck-k vh" id="wdeck-k">The next seven days</p><ol id="deck">${items}</ol></nav>`;
}

// ---------- this week + further out ----------
const chipLink = (ctx, path, g, n, current, countWord, params) => h`<a class="chip" href="${path}" data-chip="${g.id}"${g.id !== 'all' ? h` data-game="${g.id}"` : ''}${current ? h` aria-current="true"` : ''}>${g.id !== 'all' ? icon(P[g.id] ? g.id : 'other', 'gi') : ''}<span>${g.short}</span><span class="chip-n"><span class="vh">, </span>${n}<span class="vh"> ${countWord}</span></span></a>`;
const shownGames = (ctx) => [{ id: 'all', short: 'All games' }, ...ctx.games.filter((g) => g.shown !== false)];
const validChip = (ctx, c) => (c && ctx.games.some((g) => g.id === c) ? c : 'all');

const signupShort = (s) => (s.inviteOnly ? 'Invite only' : s.signup === 'walkin' ? '' : s.signup === 'here' ? 'Sign up here' : s.signup === 'counter' ? 'Pre-register at the counter'
  : s.signup === 'external' ? `Sign up on ${s.tool?.name || 'another site'}` : 'Ask at the counter');
const dayMeta = (ctx, ymd) => {
  const hrs = hoursFor(ctx.store, ymd);
  let t = fmtDate(ymd);
  if (hrs.known) t += hrs.closed ? ', closed' : `, open ${fmtTime(hrs.open)} to ${fmtTime(hrs.close)}`;
  if (hrs.override && hrs.note) t += `. ${hrs.note}`;
  return t;
};

/** Seat words for a one-line event ("6 seats left", "Full, 2 waiting"; walk-in rows leave this out, see dayLine). */
function seatWords(o, st) {
  switch (st.state) {
    case 'open': return st.cap ? `${st.left} ${st.left === 1 ? 'seat' : 'seats'} left` : 'Sign up';
    case 'few': return `${st.left} ${st.left === 1 ? 'seat' : 'seats'} left, almost full`;
    case 'needs': return `${st.taken} signed up, needs ${st.min} to run`;
    case 'waitlist': return st.waiting ? `Full, ${st.waiting} waiting` : 'Full, waitlist open';
    case 'full': return 'Full';
    case 'closed': return 'Sign-ups closed';
    case 'walkin': return 'Walk in';
    case 'counter': return 'Pre-register at the counter';
    case 'cancelled': return 'Cancelled';
    default: return signupShort(o);
  }
}
/** A later day's event on one line: dot (print), photo thumb, time, title (the link), then game, fee and seats. */
function dayLine(ctx, o, bit = '', photo = null) {
  const st = seatState(o, ctx.now.m, regsOf(ctx, o)), g = gameOf(ctx, o.game);
  const main = h`<span class="dl-time">${o.start ? fmtTime(o.start) : 'TBA'}</span><span class="dl-title"><a href="${eventHref(ctx, o)}">${o.title}</a></span><span class="dl-bits">${[g.short, fmtFee(o.fee), st.state === 'walkin' ? '' : seatWords(o, st), bit].filter(Boolean).join(' · ')}</span>`;
  return h`<li class="day-line" data-game="${g.id}" data-fgame="${o.game}" data-ffam="${g.family ?? o.game}" data-state="${st.state}"><span class="dl-dot" aria-hidden="true"></span>${photo ? h`<span class="dl-ph ph" aria-hidden="true"${tintAttr(photo)}>${photoImg(photo)}</span><span class="dl-main">${main}</span>` : main}</li>`;
}

/** Consecutive closed days as one quiet line ("Monday and Tuesday · closed"); an empty span per day keeps its #anchor. days = [{ id, name }]. */
const dayOff = (days) => h`<div class="day-off" data-quiet="">${days.map((d) => h`<span id="${d.id}"></span>`)}<p>${days.length > 2 ? `${days[0].name} to ${days[days.length - 1].name}` : days.map((d) => d.name).join(' and ')} · closed</p></div>`;

function laterRows(ctx, chip) {
  const from = addDays(ctx.now.ymd, 7), to = addDays(ctx.now.ymd, 35), seen = new Map(), rows = [];
  for (const o of upcoming(ctx, from, to)) {
    if (!live(o) || ['weekly', 'open', 'learn'].includes(o.kind) || !inGame(ctx, o, chip)) continue;
    if (seen.has(o.seriesId)) { seen.get(o.seriesId).more++; continue; }
    const x = { o, more: 0 }; seen.set(o.seriesId, x); rows.push(x);
  }
  return rows.slice(0, 4);
}
function laterItem(ctx, x) {
  const o = x.o, g = gameOf(ctx, o.game);
  return h`<li data-fgame="${o.game}" data-ffam="${g.family ?? o.game}"><p class="later-date" aria-hidden="true">${dayShort(o.date)}<b>${dayNum(o.date)}</b>${monthShort(o.date)}</p><p class="later-what"><a href="${eventHref(ctx, o)}">${o.title}</a><span class="vh">, ${fmtLong(o.date)}</span>${x.more ? h` <span class="tag">and ${x.more} more ${x.more === 1 ? 'date' : 'dates'}</span>` : ''}</p><p class="later-meta">${gameBadge(ctx, o.game)}<span>${o.start ? fmtTime(o.start) : 'Time to be announced'}</span>${fmtFee(o.fee) ? h`<span>${fmtFee(o.fee)}</span>` : ''}${signupShort(o) ? h`<span>${signupShort(o)}</span>` : ''}</p></li>`;
}

/** Game chips + this week's days + Further out. The game comes from ?game= (chips are plain links; site.js filters in place). */
export function week(ctx) {
  const { now } = ctx, chip = validChip(ctx, ctx.query.get('game'));
  const all = upcoming(ctx, now.ymd, addDays(now.ymd, 6)), liveAll = all.filter(live);
  const chips = shownGames(ctx).map((g) => chipLink(ctx, `${keep(ctx, '', { game: g.id === 'all' ? '' : g.id })}#week`, g, liveAll.filter((o) => inGame(ctx, o, g.id)).length, chip === g.id, 'this week'));
  // One photo per event, picked on the unfiltered week so a chip filter does not reshuffle them. Today and the next day with events (the photo-card
  // days) share one "used" map so they do not repeat a picture; each one-line day starts fresh.
  const photos = new Map(), cardUsed = {};
  let nextCard = false;
  for (let i = 0; i < 7; i++) {
    const ymd = addDays(now.ymd, i), dayAll = all.filter((o) => o.date === ymd), card = i === 0 || (!nextCard && dayAll.length > 0);
    if (i > 0 && card) nextCard = true;
    photos.set(ymd, photosForDay(dayAll, idKey, card ? cardUsed : {}));
  }
  const days = [];
  let shownAny = false, nextSeen = false, run = [];
  const flush = () => { if (run.length) days.push(dayOff(run)); run = []; };
  const ranToday = expand(ctx.series, now.ymd, now.ymd, ctx.exceptions).some(live); // something ran or runs today (even if it is over)
  for (let i = 0; i < 7; i++) {
    const ymd = addDays(now.ymd, i), hrs = hoursFor(ctx.store, ymd), dayAll = all.filter((o) => o.date === ymd), evs = dayAll.filter((o) => inGame(ctx, o, chip));
    const head = h`<h3 class="day-h" id="dh-${ymd}"><span class="day-dia" aria-hidden="true"><span>${dayNum(ymd)}</span></span><span class="day-name">${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayName(ymd)}</span>${i === 0 ? h`<span class="tag tag-today">${dayName(ymd)}</span>` : i === 1 ? h`<span class="tag">${dayName(ymd)}</span>` : ''}<span class="day-meta">${dayMeta(ctx, ymd)}</span></h3>`;
    if (hrs.known && hrs.closed && !dayAll.length) {
      if (chip === 'all') run.push({ id: `d-${ymd}`, name: dayName(ymd) });
      continue;
    }
    flush();
    if (!evs.length) {
      if (chip === 'all') days.push(h`<section class="day" data-quiet="" id="d-${ymd}" aria-labelledby="dh-${ymd}">${head}<p class="day-skip">${i === 0 && ranToday ? 'Nothing else scheduled today. ' : 'No scheduled events. '}Free play all day.</p></section>`);
      continue;
    }
    shownAny = true;
    if (i > 0 && nextSeen) { // round 3: after today and the next day with events, each day is one line per event
      days.push(h`<section class="day" id="d-${ymd}" aria-labelledby="dh-${ymd}">${head}<ul class="day-lines">${evs.map((o) => dayLine(ctx, o, '', photos.get(ymd).get(idKey(o))))}</ul></section>`);
      continue;
    }
    if (i > 0) nextSeen = true;
    days.push(h`<section class="day" id="d-${ymd}" aria-labelledby="dh-${ymd}"${i === 0 ? h` data-today=""` : ''}>${head}<div class="slots">${cardList(ctx, evs, { compact: true, photo: (o) => photos.get(ymd).get(idKey(o)) })}</div></section>`);
  }
  flush();
  const n = liveAll.filter((o) => inGame(ctx, o, chip)).length, g = chip === 'all' ? null : gameOf(ctx, chip);
  const empty = !shownAny && chip !== 'all' ? emptyPanel(ctx, chip, g) : '';
  const rows = laterRows(ctx, chip);
  return h`<p class="sec-note week-note">Most nights are walk-in. Cards with a Sign up button hold seats.</p>${deck(ctx, all)}<nav class="chips" id="chips" aria-label="Show one game">${chips}</nav>
<p class="vh" id="filter-status" role="status" aria-live="polite">${g ? `Showing ${g.short}: ` : 'Showing all games: '}${n} ${n === 1 ? 'event' : 'events'} this week.</p>
<div class="days" id="days">${empty}${days}</div>
<div class="empty lattice" id="filter-empty" role="note" hidden><p class="empty-h">Nothing for this game this week.</p><p>Try another game, or look at every date.</p><a class="btn btn-2" href="${keep(ctx, '', {})}#week" data-chip="all">Show all games</a></div>
<aside class="later" aria-labelledby="later-h"><h3 id="later-h">Further out</h3><ul class="later-list" id="later">${rows.length ? rows.map((x) => laterItem(ctx, x)) : h`<li><p class="later-what">Nothing big on the calendar yet.</p></li>`}</ul><a class="more" href="${keep(ctx, '/events/', {})}">See every date${icon('chevron')}</a></aside>`;
}
function emptyPanel(ctx, chip, g) {
  const future = upcoming(ctx, addDays(ctx.now.ymd, 7), addDays(ctx.now.ymd, 70)).find((o) => live(o) && inGame(ctx, o, chip));
  return h`<div class="empty lattice" role="note"><p class="empty-h">No ${g.short} events this week.</p>${future ? h`<p>The next one is ${future.title} on ${fmtLong(future.date)}${future.start ? ` at ${fmtTime(future.start)}` : ''}.</p>` : h`<p>Nothing is scheduled yet. Ask at the counter.</p>`}<a class="btn btn-2" href="${keep(ctx, '', {})}#week" data-chip="all">Show all games</a></div>`;
}

// ---------- cEDH strip and releases ----------
export function cedh(ctx, { days = 60, n = 3 } = {}) { // the front page shows 3, /cedh/ the next 4 in 6 months
  const links = ctx.store.links ?? {}, circuit = safeUrl(links.topdeckCircuit) ?? safeUrl(links.topdeck);
  const rows = upcoming(ctx, ctx.now.ymd, addDays(ctx.now.ymd, days)).filter((o) => live(o) && o.game === 'cedh' && o.cedhSeries).slice(0, n);
  if (!rows.length) return h`<p class="cedh-last">No cEDH dates are on the calendar yet.${circuit ? h` Watch <a href="${circuit}" target="_blank" rel="noopener">TopDeck<span class="vh"> (opens TopDeck)</span></a>.` : ''}</p>`;
  return h`<ol class="cedh-list">${rows.map((o) => {
    const st = seatState(o, ctx.now.m, regsOf(ctx, o)), tool = o.tool ?? {}, url = safeUrl(tool.url);
    const act = o.inviteOnly ? h`<p class="ev-how">${icon('lock')}Invite only. Seats come from the Championship Series.</p>`
      : url ? h`<a class="btn btn-act" href="${url}" target="_blank" rel="noopener">${tool.name ? `Sign up on ${tool.name}` : 'Sign up online'}${ext(tool.name)}</a>` : h`<a class="btn btn-2" href="${eventHref(ctx, o)}">Event details</a>`;
    return h`<li class="tix"><p class="tix-date" aria-hidden="true">${dayShort(o.date)}<b>${dayNum(o.date)}</b>${monthShort(o.date)}</p><div class="tix-what"><h4><a href="${eventHref(ctx, o)}">${o.title}</a></h4><p>${[o.start && fmtTime(o.start), o.fee > 0 && fmtFee(o.fee)].filter(Boolean).join(' · ')}</p></div><div class="tix-acts">${act}${st.count ? statBox(st.count, 'registered', '', 'users') : ''}</div></li>`; // the date block says the day, the button names the tool
  })}</ol>`;
}

/** The /cedh/ results archive: every public cEDH result (series of game cedh), newest first, 24 to a page (?page=). Names escaped by h; notes, prizes and credit never come here. */
export function cedhResults(ctx) {
  const rows = (ctx.results?.recent(100000) ?? []).filter((r) => r.day <= ctx.now.ymd).map((r) => ({ r, s: ctx.series.find((x) => x.id === r.series && x.enabled !== false) })).filter((x) => x.s?.game === 'cedh');
  if (!rows.length) return h`<p>No results are posted yet.</p>`;
  const per = 24, pages = Math.ceil(rows.length / per), pg = Math.min(pages, Math.max(1, Number.parseInt(ctx.query?.get('page'), 10) || 1));
  const nav = pages > 1 ? h`<nav class="chips" aria-label="Results pages">${Array.from({ length: pages }, (_, i) => h`<a class="chip" href="${keep(ctx, '/cedh/', { page: i ? String(i + 1) : '' })}#results"${i + 1 === pg ? h` aria-current="true"` : ''}>Page ${i + 1}</a>`)}</nav>` : '';
  return h`<ul class="lately-list">${rows.slice((pg - 1) * per, pg * per).map(({ r, s }) => h`<li><a href="${eventHref(ctx, { seriesId: r.series, slot: r.slot })}"><span class="lt-d">${fmtDate(r.day)}</span> <span class="lt-t">${s.title}</span></a><span class="lt-w">${resultWords(r)}${playersWords(r) ? h`<span class="lt-n"> · ${playersWords(r)}</span>` : ''}</span></li>`)}</ul>${nav}`;
}

export function releases(ctx) {
  const items = (ctx.releases ?? []).map((r) => {
    const g = gameOf(ctx, r.game), label = r.status === 'preorder' ? 'Preorder' : r.status === 'out' ? 'Out now' : 'Coming soon';
    let text = r.note ? h`<p>${r.note}</p>` : '', stat = '';
    const s = r.event && ctx.series.find((x) => x.id === r.event && x.enabled !== false);
    if (s) {
      const occ = occurrences(s, ctx.now.ymd, addDays(ctx.now.ymd, 60), ctx.exceptions).filter(live);
      if (occ.length) text = h`${text}<p><a href="${eventHref(ctx, occ[0])}">${s.title}</a>: ${list(occ.slice(0, 3).map((o) => `${dayShort(o.date)} ${fmtDate(o.date)}${o.start ? ` at ${fmtTime(o.start)}` : ''}`))}.${fmtFee(s.fee) ? ` ${fmtFee(s.fee)}.` : ''}</p>`;
    }
    if (r.status === 'preorder' && r.preorderEnds) {
      const days = Math.round((dayMin(r.preorderEnds) - dayMin(ctx.now.ymd)) / 1440), endTxt = `preorders end ${dayShort(r.preorderEnds)} ${fmtDate(r.preorderEnds)}`;
      stat = days < 0 ? h`<p class="ev-stat">${icon('lock')}<span class="ev-stat-unit">Preorders closed</span></p>`
        : days === 0 ? h`<p class="ev-stat">${icon('hourglass')}<span class="ev-stat-unit">Last day today</span><span class="ev-stat-small">${endTxt}</span></p>`
          : statBox(days, days === 1 ? 'day left' : 'days left', endTxt, 'hourglass');
    } else if (r.status === 'out') stat = h`<p class="ev-stat">${icon('check')}<span class="ev-stat-unit">On the shelf</span></p>`;
    const soon = r.status === 'preorder' && r.preorderEnds && dayMin(r.preorderEnds) - dayMin(ctx.now.ymd) <= 3 * 1440; // the countdown box shows only on the last 3 days
    return h`<li class="rel" data-game="${g.id}" data-status="${r.status}"${soon ? h` data-soon=""` : ''}><h3 class="rel-name">${r.name}</h3><p class="ev-type">${gameBadge(ctx, g.id)}<span class="ev-fmt">${label}</span></p>${text ? h`<div class="rel-text">${text}</div>` : ''}${stat.s ? h`<div class="rel-foot">${stat}</div>` : ''}</li>`;
  });
  return h`${items}`;
}

// ---------- hours ----------
export function hours(ctx) {
  const { store, now } = ctx;
  if (!Array.isArray(store.hours)) return h`<p>We’re confirming our opening hours. Call <a href="${safeUrl(store.phoneHref)}">${store.phone}</a> for today’s hours.</p>`;
  const todayDow = dow(now.ymd), why = [], rows = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const w = store.hours.find((x) => x.day === d) ?? { closed: true }, closed = !!w.closed || !w.open;
    const off = (d - todayDow + 7) % 7, ymd = addDays(now.ymd, off), ov = hoursFor(store, ymd);
    // round 4, F15: the cell shows the changed hours and a date tag; the reason is one plain line under the table
    if (ov.override) why.push(`${dayShort(ymd)} ${fmtDate(ymd)}${ov.note ? `: ${ov.note}` : ov.closed ? ' is closed.' : ' has different hours.'}`); // the owner's note verbatim (no re-casing of names like "cEDH")
    const shown = ov.override ? ov.closed : closed;
    return h`<tr${d === todayDow ? h` data-today=""` : ''}${shown ? h` data-closed=""` : ''}><th scope="row"><span class="hrs-d">${DAYS[d]}${d === todayDow ? h`<span class="tag">Today</span>` : ''}</span></th><td>${ov.override ? (ov.closed ? 'Closed' : `${fmtTime(ov.open)} to ${fmtTime(ov.close)}`) : closed ? 'Closed' : `${fmtTime(w.open)} to ${fmtTime(w.close)}`}${ov.override ? h`<span class="tag tag-upd">${fmtDate(ymd)}</span>` : ''}</td></tr>`;
  });
  return h`<table class="hours"><caption class="vh">Opening hours</caption><thead class="vh"><tr><th scope="col">Day</th><th scope="col">Hours</th></tr></thead><tbody id="hours-body">${rows}</tbody></table>${why.length ? h`<p class="note">${why.join(' ')}</p>` : ''}${store.hoursConfirmed === false ? h`<p class="note">Hours from public listings. The owners will confirm them before launch.</p>` : ''}`;
}
export function todayHours(ctx) {
  const hrs = hoursFor(ctx.store, ctx.now.ymd);
  return !hrs.known ? '' : hrs.closed ? h`<p>The shop is closed today.${hrs.note ? ` ${hrs.note}` : ''}</p>` : h`<p>Today we’re open ${fmtTime(hrs.open)} to ${fmtTime(hrs.close)}.${hrs.note ? ` ${hrs.note}` : ''}</p>`;
}

// ---------- New here? ----------
export function nights(ctx) {
  const rows = [], seen = new Set();
  for (const o of upcoming(ctx, ctx.now.ymd, addDays(ctx.now.ymd, 14))) {
    if (!live(o) || !o.beginnerFriendly || seen.has(o.seriesId)) continue;
    seen.add(o.seriesId); rows.push({ o, more: 0 });
  }
  const tel = safeUrl(ctx.store.phoneHref);
  return rows.length ? h`<ul class="later-list nh-list">${rows.map((x) => laterItem(ctx, x))}</ul>`
    : h`<p>No beginner nights in the next two weeks. Call the shop at ${tel ? h`<a href="${tel}">${ctx.store.phone}</a>` : ctx.store.phone} to ask what’s on.</p>`;
}

// ---------- the events page ----------
const formatsFor = (ctx, chip) => [...new Set(ctx.series.filter((s) => s.enabled !== false && s.format && inGame(ctx, s, chip)).map((s) => s.format))].sort((a, b) => a.localeCompare(b));

export function events(ctx) {
  const { now } = ctx, chip = validChip(ctx, ctx.query.get('game'));
  let format = ctx.query.get('format') ?? '';
  const formats = formatsFor(ctx, chip);
  if (!formats.includes(format)) format = '';
  const passes = (s) => s.enabled !== false && inGame(ctx, s, chip) && (!format || s.format === format);
  const horizon = addDays(now.ymd, 60), pool = ctx.series.filter((s) => s.enabled !== false);
  const chips = shownGames(ctx).map((g) => chipLink(ctx, keep(ctx, '/events/', { game: g.id === 'all' ? '' : g.id }), g,
    pool.filter((s) => inGame(ctx, s, g.id) && occurrences(s, now.ymd, horizon, ctx.exceptions).some((o) => endM(o) > now.m)).length, chip === g.id, 'events'));
  // Tonight (or Today): every date on today's calendar day in time order, specials and weekly nights together; the cards repeat below, so their ids are different
  const tonight = upcoming(ctx, now.ymd, now.ymd).filter((o) => passes(o)).sort((a, b) => (a.start || '').localeCompare(b.start || '') || a.title.localeCompare(b.title));
  // special events: one card per series (its next date), grouped by day; repeating nights are collapsed below. While Tonight shows, today's dates are left out of here (round 4, F12)
  const walkNote = h`<p class="sec-note">Most nights are walk-in. Cards with a Sign up button hold seats.</p>`;
  const specials = [];
  for (const s of ctx.series.filter((x) => passes(x) && x.recurrence?.type !== 'weekly')) {
    const occs = occurrences(s, now.ymd, horizon, ctx.exceptions).filter((o) => endM(o) > now.m && !(tonight.length && o.date === now.ymd)).sort((a, b) => a.date.localeCompare(b.date) || (a.start || '').localeCompare(b.start || ''));
    if (!occs.length) continue;
    const rest = occs.slice(1).filter(live);
    let also = '';
    if (rest.length && s.recurrence?.type === 'dates') also = `Also ${list(rest.map((o) => `${dayShort(o.date)} ${fmtDate(o.date)}${o.start ? `, ${fmtTime(o.start)}` : ''}`))}.`;
    else if (rest.length && s.recurrence?.type === 'nth') also = 'Repeats every month.';
    specials.push({ o: occs[0], opts: { also } });
  }
  specials.sort((a, b) => a.o.date.localeCompare(b.o.date) || (a.o.start || '').localeCompare(b.o.start || '') || a.o.title.localeCompare(b.o.title));
  const dates = [...new Set(specials.map((x) => x.o.date))];
  const specialHtml = dates.map((ymd) => h`<section class="day" id="d-${ymd}" aria-labelledby="dh-${ymd}"><h3 class="day-h" id="dh-${ymd}"><span class="day-name">${dayShort(ymd)} ${fmtDate(ymd)}</span>${ymd === now.ymd ? h`<span class="tag tag-today">Today</span>` : ''}</h3><div class="slots">${cardList(ctx, specials.filter((x) => x.o.date === ymd))}</div></section>`);
  // every week: one card per repeating series, by weekday
  const todayDow = dow(now.ymd);
  let weeklyCount = 0;
  const weekly = [];
  let off = [];
  const flushOff = () => { if (off.length) weekly.push(dayOff(off)); off = []; };
  for (const d of [1, 2, 3, 4, 5, 6, 0]) {
    const items = ctx.series.filter((s) => passes(s) && s.recurrence?.type === 'weekly' && s.recurrence.day === d)
      .sort((a, b) => (a.start || '99').localeCompare(b.start || '99') || a.title.localeCompare(b.title)).map((s) => {
        const occs = occurrences(s, now.ymd, addDays(now.ymd, 70), ctx.exceptions).filter((o) => endM(o) > now.m);
        if (!occs.length) return null;
        const first = occs[0], shown = first.cancelled ? (occs.find(live) ?? first) : first;
        // the day heading says the next date once; a card or row repeats it only when that date is cancelled or changed
        let nextNote = '';
        if (first.cancelled && shown !== first) nextNote = `Next: ${dayShort(shown.date)} ${fmtDate(shown.date)}. ${fmtDate(first.date)} is cancelled.`;
        if (shown.cancelled) nextNote = `Next: ${dayShort(shown.date)} ${fmtDate(shown.date)} is cancelled.`;
        if (!nextNote && (first.changed || first.moved)) nextNote = `Next: ${dayShort(shown.date)} ${fmtDate(shown.date)}.`;
        const bit = shown.cancelled ? `${fmtDate(shown.date)} cancelled` : first.cancelled ? `${fmtDate(first.date)} cancelled` : first.changed || first.moved ? 'changed' : '';
        weeklyCount++;
        return { shown, nextNote, bit };
      }).filter(Boolean);
    const wk = hoursFor({ hours: ctx.store.hours }, addDays(now.ymd, (d - todayDow + 7) % 7)), closedDay = wk.known && wk.closed; // the weekly row, not one date's override
    if (!items.length) {
      if (closedDay && chip === 'all' && !format) off.push({ id: `wk-${d}`, name: DAYS[d] });
      else flushOff();
      continue;
    }
    flushOff();
    const next = items.map((x) => x.shown.date).sort()[0];
    // phones get one line per series (dayLine), from 640px the cards; both are in the markup and the stylesheet shows one
    weekly.push(h`<section class="wk" aria-labelledby="wk-${d}"><h3 class="wk-name" id="wk-${d}">${DAYS[d]}${d === todayDow ? h` <span class="tag tag-today">Today</span>` : h` <span class="wk-next">next ${fmtDate(next)}</span>`}</h3><div class="wk-cards">${items.map((x) => card(ctx, x.shown, { every: true, nextNote: x.nextNote }))}</div><ul class="day-lines wk-rows">${items.map((x) => dayLine(ctx, x.shown, x.bit))}</ul></section>`);
  }
  flushOff();
  const tonightHtml = tonight.length ? h`<section class="ep-sec" id="today-wrap" aria-labelledby="today-h"><h2 id="today-h">${now.m - dayMin(now.ymd) >= 17 * 60 ? 'Tonight' : 'Today'}</h2>${walkNote}<div id="today"><div class="slots">${cardList(ctx, tonight, { again: true })}</div></div></section>` : '';
  const total = specials.length + weeklyCount;
  const g = chip === 'all' ? null : gameOf(ctx, chip);
  let empty = '';
  if (!total) {
    const future = expand(ctx.series.filter(passes), addDays(horizon, 1), addDays(now.ymd, 400), ctx.exceptions).find(live);
    empty = h`<div class="empty empty-photo" role="note"><img src="/img/social/staff-corgi-interior.webp" width="512" height="640" alt="A Mulligan Games staff member holding a corgi in the play room" loading="lazy"><div class="empty-in"><p class="empty-h">No ${[g?.short, format].filter(Boolean).join(' ') || ''} events right now.</p>${future ? h`<p>The next one is ${future.title} on ${fmtLong(future.date)}${future.start ? ` at ${fmtTime(future.start)}` : ''}.</p>` : h`<p>Nothing is scheduled yet. Ask at the counter.</p>`}${ctx.store.freePlay ? h`<p>${ctx.store.freePlay}.</p>` : ''}<a class="btn btn-2" href="${keep(ctx, '/events/', {})}" data-chip="all">Show all games</a></div></div>`;
  }
  const calHref = chip === 'all' ? '/events.ics' : `/events.ics?game=${chip}`, subHref = ctx.baseUrl ? ctx.baseUrl.replace(/^https?:/, 'webcal:') + calHref : '';
  return h`<div class="ep-head"><h1>Events</h1><p class="ep-lede">Every game night at the shop. Pick a game, check the seats, pay at the store.</p></div>
<nav class="chips" id="chips" aria-label="Show one game">${chips}</nav>
<form class="ep-format" action="/events/" method="get">${chip !== 'all' ? h`<input type="hidden" name="game" value="${chip}">` : ''}${ctx.keepNow ? h`<input type="hidden" name="now" value="${ctx.keepNow}">` : ''}<label for="fmt">Format</label><select id="fmt" name="format"><option value="">All formats</option>${formats.map((f) => h`<option${f === format ? ' selected' : ''}>${f}</option>`)}</select><button class="btn btn-2 btn-sm" type="submit">Show</button><span class="ep-tools"><details class="cal-menu" id="cal-menu"><summary class="btn btn-2 btn-sm">${icon('calendar')}Add to my calendar</summary><div class="cal-pop"><a class="btn btn-2" href="${calHref}">${g ? `${g.short} events` : 'All events'}<span class="vh"> (saves a calendar file)</span></a>${subHref ? h`<a class="btn btn-2" href="${subHref}">Subscribe<span class="vh"> (opens your calendar app and keeps it up to date)</span></a>` : ''}</div></details><button type="button" class="btn btn-2 btn-sm no-print ep-print" id="print-btn">Print the schedule</button></span></form>
<p class="vh" id="filter-status" role="status" aria-live="polite">${g ? `Showing ${g.short}` : 'Showing all games'}${format ? `, ${format}` : ''}: ${total} ${total === 1 ? 'event' : 'events'}.</p>
${empty}${tonightHtml}${specialHtml.length ? h`<section class="ep-sec" aria-labelledby="special-h"><h2 id="special-h">Special events and tournaments</h2><div id="special">${specialHtml}</div></section>` : ''}${weeklyCount ? h`<section class="ep-sec" aria-labelledby="weekly-h"><h2 id="weekly-h">Every week</h2>${walkNote}<div>${weekly}</div></section>` : ''}
<p class="print-only">${ctx.store.name} · ${ctx.store.address.street}, ${ctx.store.address.city} ${ctx.store.address.region} · ${ctx.store.phone}</p>`;
}

// ---------- one event date (D16, DESIGN.md 15.4) ----------
/** Find the occurrence for ?date= (a slot key, or a plain date, or a date plus &time=HHMM). null when the series has no such date. */
export function findOccurrence(ctx, s, dateParam, timeParam) {
  if (!/^\d{4}-\d\d-\d\d(T\d\d:\d\d)?$/.test(dateParam ?? '') || !realDay(dateParam.slice(0, 10))) return null;
  const day = dateParam.slice(0, 10), key = dateParam.length === 10 && /^\d{4}$/.test(timeParam ?? '') ? `${dateParam}T${timeParam.slice(0, 2)}:${timeParam.slice(2)}` : dateParam;
  const near = occurrences(s, addDays(day, -61), addDays(day, 61), ctx.exceptions);
  return near.find((o) => o.slot === key) ?? near.find((o) => o.date === day) ?? null;
}
export const nextDate = (ctx, s) => occurrences(s, ctx.now.ymd, addDays(ctx.now.ymd, 400), ctx.exceptions).find((o) => live(o) && endM(o) > ctx.now.m) ?? null;

/** D17: "Arrive by 6:50 PM or your seat goes to the next person on the waitlist." */
const arriveText = (o) => `Arrive by ${fmtTime(o.arriveBy)} or your seat ${o.waitlist ? 'goes to the next person on the waitlist' : 'may go to a walk-in'}.`;
const feeLine = (o) => (o.fee === 0 ? 'Free.' : Number.isInteger(o.fee) ? `Pay $${o.fee} at the store when you arrive.` : '');

/** The sign-up form (DESIGN.md 8). Works with no JavaScript. form = { values, errors, message } after a refused post. */
function signupForm(ctx, o, st, form) {
  const v = form.values ?? {}, e = form.errors ?? {}, wait = st.state === 'waitlist', idLabel = playerIdLabel(o.tool);
  const fld = (name, label, type, auto, hint = '', more = {}) => h`<label class="fld" for="su-${name}"><span>${label}</span><input id="su-${name}" name="${name}" type="${type}" value="${v[name] ?? ''}" autocomplete="${auto}" maxlength="${MAX[name]}"${more.required ? ' required' : ''}${more.inputmode ? h` inputmode="${more.inputmode}"` : ''}${e[name] ? h` aria-invalid="true" aria-describedby="su-${name}-err"` : ''}>${hint ? h`<small>${hint}</small>` : ''}${e[name] ? h`<em class="err" id="su-${name}-err">${e[name]}</em>` : ''}</label>`;
  return h`<form class="su" id="signup" method="post" action="${ctx.keepNow ? `/api/signup?now=${encodeURIComponent(ctx.keepNow)}` : '/api/signup'}">
<h2 class="su-h">${wait ? 'Join the waitlist' : 'Hold your seat'}</h2>
${wait ? h`<p class="hint">The event is full. Join the waitlist and you move in automatically if a seat opens.</p>` : ''}
${fld('name', 'Your name', 'text', 'name', '', { required: true })}${fld('email', 'Email', 'email', 'email')}${fld('phone', 'Phone', 'tel', 'tel', 'One is enough. We only use it about this event.')}${idLabel ? fld('playerId', `${idLabel} (optional)`, 'text', 'off', '', { inputmode: 'numeric' }) : ''}
<div class="hp" aria-hidden="true"><label>Leave this empty<input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>
<input type="hidden" name="series" value="${o.seriesId}"><input type="hidden" name="slot" value="${o.slot}"><input type="hidden" name="expected" value="${wait ? 'waitlist' : 'in'}"><input type="hidden" name="_page" value="/events/">
${feeLine(o) ? h`<p class="hint">${feeLine(o)}</p>` : ''}<button class="btn btn-act" type="submit">${wait ? 'Join the waitlist' : 'Hold my seat'}</button>
<p class="hint">We delete your contact details ${RETENTION_DAYS} days after the event. <a href="/privacy/">Privacy</a></p>
</form>`;
}

export function eventPage(ctx, o, form = {}) {
  const st = seatState(o, ctx.now.m, regsOf(ctx, o)), store = ctx.store, key = idKey(o), g = gameOf(ctx, o.game), href = eventHref(ctx, o);
  const s = ctx.series.find((x) => x.id === o.seriesId);
  const others = occurrences(s, ctx.now.ymd, addDays(ctx.now.ymd, 180), ctx.exceptions).filter((x) => x.slot !== o.slot && endM(x) > ctx.now.m).slice(0, 6);
  const next = !o.cancelled && !st.past ? null : nextDate(ctx, s);
  const tool = o.tool ?? {}, toolUrl = safeUrl(tool.url);
  const updated = updatedWords(o.updated, ctx.now.ymd);
  let banner = '';
  if (o.cancelled) {
    banner = h`<div class="pg-banner pg-bad" role="note">${icon('cancel')}<div><p><strong>Cancelled.</strong> No ${o.title} on ${fmtLong(o.date)}.</p>${o.note ? h`<p>${o.note}</p>` : ''}${updated ? h`<p class="pg-upd">${updated}</p>` : ''}${nextDate(ctx, s) ? h`<p><a href="${eventHref(ctx, nextDate(ctx, s))}">Next one: ${fmtLong(nextDate(ctx, s).date)}</a></p>` : ''}</div></div>`;
  } else if (o.changed || o.moved) {
    banner = h`<div class="pg-banner pg-warn" role="note">${icon('pencil')}<div><p><strong>Changed for this date.</strong> ${changeLine(o)}</p>${updated ? h`<p class="pg-upd">${updated}</p>` : ''}</div></div>`;
  }
  if (st.past) banner = h`${banner}<div class="pg-banner pg-past" role="note">${icon('clock')}<div><p><strong>This date has passed.</strong></p>${next ? h`<p><a href="${eventHref(ctx, next)}">Next one: ${fmtLong(next.date)}</a></p>` : ''}</div></div>`;
  const row = (k, v) => (v && v.toString() ? h`<div><dt>${k}</dt><dd>${v}</dd></div>` : '');
  const wh = [o.points && `${o.points} points`, o.roundMinutes && `${o.roundMinutes} minute rounds`, o.listDeadline && `lists due ${o.listDeadline}`].filter(Boolean);
  const toolLink = toolUrl ? h`<a href="${toolUrl}" target="_blank" rel="noopener">${tool.name || 'Link'}${ext(tool.name)}</a>` : tool.name;
  const facts = h`${row('Prizes', o.prize)}${row('Bring', o.bring)}${row('Ages', o.kidsWelcome ? 'All ages. Kids welcome.' : o.ageNote)}${row('Play style', o.playStyle === 'casual' ? 'Casual' : o.playStyle === 'competitive' ? 'Competitive' : '')}${row('Warhammer', wh.join(', '))}${tool.name || toolUrl || tool.code ? row(tool.code ? 'Event code' : 'Official tool', h`${tool.code ? h`<strong class="code">${tool.code}</strong>` : ''}${tool.code && toolLink ? ' on ' : ''}${toolLink}`) : ''}`;
  const about = facts.s || o.description ? h`<section aria-labelledby="ab-${key}"><h2 id="ab-${key}">About this night</h2>${facts.s ? h`<dl class="det-list">${facts}</dl>` : ''}${o.description ? h`<p class="dp-desc">${o.description}</p>` : ''}</section>` : '';
  const weekly = s.recurrence?.type === 'weekly';
  const otherDates = others.length ? h`<section aria-labelledby="od-${key}"><h2 id="od-${key}">Other dates</h2><ul class="dp-dates">${others.map((x) => { const xs = seatState(x, ctx.now.m, regsOf(ctx, x)); return h`<li><a href="${eventHref(ctx, x)}"${x.cancelled ? h` class="struck"` : ''}>${dayShort(x.date)} ${fmtDate(x.date)}</a><span>${x.start ? fmtTime(x.start) : ''}</span><span class="dp-seat">${x.cancelled ? h`<span class="tag tag-bad">cancelled</span>` : h`${seatWords(x, xs)}${x.changed || x.moved ? h` <span class="tag tag-upd">changed</span>` : ''}`}</span></li>`; })}</ul><p class="det-acts"><a class="btn btn-2" href="${`/events/${encodeURIComponent(o.seriesId)}.ics`}">${icon('calendar')}${weekly ? `Add every ${dayName(o.date)} to my calendar` : 'Add all dates to my calendar'}</a></p></section>` : '';
  const tel = safeUrl(store.phoneHref);
  const where = h`<section aria-labelledby="gh-${key}"><h2 id="gh-${key}">Getting here</h2><p class="det-where">${store.address.street}, ${store.address.city}, ${store.address.region} ${store.address.zip}.${store.parking ? ` ${store.parking}` : ''}</p>${o.beginnerFriendly ? h`<p class="det-where">First time at Mulligan? <a href="/new-here/">Read New here?</a></p>` : ''}<p class="det-acts dp-two"><a class="btn btn-2" href="${mapsUrl(store)}" target="_blank" rel="noopener">${icon('pin')}Directions<span class="vh"> (opens Google Maps)</span></a>${tel ? h`<a class="btn btn-2" href="${tel}">${icon('phone')}Call</a>` : ''}</p>${others.length ? '' : h`<p class="det-acts"><a class="btn btn-2" href="${`/events/${encodeURIComponent(o.seriesId)}.ics?date=${encodeURIComponent(o.slot)}`}">${icon('calendar')}Add to my calendar</a></p>`}</section>`;
  const same = upcoming(ctx, o.date, o.date).filter((x) => live(x) && x.seriesId !== o.seriesId).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  const alsoOn = same.length ? h`<section class="dp-also" aria-labelledby="ao-${key}"><h2 id="ao-${key}">Also on ${dayName(o.date)}</h2><ul class="day-lines">${same.map((x) => dayLine(ctx, x))}</ul></section>` : '';
  const pic = photoFor(o), rel = relDay(o.date, ctx.now.ymd);
  const kicker = `${fmtLong(o.date)}${rel === 'today' ? (o.start && toMin(o.start) >= 17 * 60 ? ' · Tonight' : ' · Today') : rel === 'tomorrow' ? ' · Tomorrow' : ''}`;
  const foot = o.cancelled || st.past ? '' : actionArea(ctx, o, st, `${href}#signup`, true);
  const formOpen = o.signup === 'here' && !o.inviteOnly && !o.cancelled && !st.past && ['open', 'few', 'needs', 'waitlist'].includes(st.state);
  const signupNote = h`${form.message ? h`<p class="su-msg" role="alert">${form.message}</p>` : ''}${formOpen ? signupForm(ctx, o, st, form) : ''}`;
  const arrive = !o.cancelled && !st.past && o.arriveBy && ['here', 'counter'].includes(o.signup) ? h`<p class="ev-arrive">${icon('clock')}${arriveText(o)}</p>` : '';
  return h`<div class="wrap dp-wrap"><p class="dp-back"><a href="${keep(ctx, '/events/', {})}">${icon('chevron', 'ic-back')}All events</a></p>
<article class="dp" aria-labelledby="t-${key}">
<div class="dp-top">
<figure class="dp-pic" data-game="${o.game}"><img src="/img/social/${pic.file}.webp" srcset="/img/social/${pic.file}-800.webp 800w, /img/social/${pic.file}.webp 1600w" sizes="(min-width: 1024px) 58vw, 100vw" width="1600" height="1200" alt="${pic.alt}" fetchpriority="high" style="object-position:${photoPos(pic)}"></figure>
<div class="dp-head ev" data-game="${o.game}" data-state="${st.state}"><p class="dp-kick"><time datetime="${o.date}">${kicker}</time></p><div class="dp-name"><h1 class="ev-title" id="t-${key}">${o.title}</h1>${costPip(o)}</div>
<p class="ev-type">${gameBadge(ctx, o.game)}${o.format ? h`<span class="ev-fmt">${o.format}</span>` : ''}</p>
<p class="ev-when">${icon('clock')}<span>${timeLine(o)}</span></p>${banner}<p class="dp-tags">${tagRow(o, st)}</p>
${foot.s || arrive.s || signupNote.s ? h`<div class="dp-ticket"><div class="ev-foot">${foot}</div>${arrive}${signupNote}</div>` : ''}</div>
</div>
<div class="dp-low${about.s ? '' : ' dp-solo'}">${about}<div class="dp-side">${otherDates}${where}</div></div>
${resultBlock(ctx, o)}${alsoOn}
</article></div>`;
}

/** Winner and the other names exactly as staff typed them (escaped by h); the winner is not listed twice. */
const resultWords = (r) => {
  const rest = (r.top ?? []).filter((n) => n.toLowerCase() !== r.winner.toLowerCase());
  return h`Won by <strong>${r.winner}</strong>${rest.length ? h`, with ${rest.join(', ')} in the top ${(r.top ?? []).length}` : ''}`;
};
const playersWords = (r) => (Number.isInteger(r.headcount) && r.headcount > 0 ? `${r.headcount} ${r.headcount === 1 ? 'player' : 'players'}` : '');
/** "Lately at the shop" (P2.6): the last four results staff ticked Show on, newest first. Notes, prizes and credit never come here. '' when there are none. */
export function lately(ctx) {
  const rows = (ctx.results?.recent() ?? []).filter((r) => r.day <= ctx.now.ymd).map((r) => ({ r, s: ctx.series.find((x) => x.id === r.series && x.enabled !== false) })).filter((x) => x.s).slice(0, 4);
  if (!rows.length) return '';
  return h`<div class="lately"><h3>Lately at the shop</h3><ul class="lately-list">${rows.map(({ r, s }) => h`<li><a href="${eventHref(ctx, { seriesId: r.series, slot: r.slot })}"><span class="lt-d">${fmtDate(r.day)}</span> <span class="lt-t">${s.title}</span></a><span class="lt-w">${resultWords(r)}${playersWords(r) ? h`<span class="lt-n"> · ${playersWords(r)}</span>` : ''}</span></li>`)}</ul></div>`;
}
/** The result on that date's own page, when staff ticked Show. */
const resultBlock = (ctx, o) => {
  const r = o.cancelled ? null : ctx.results?.one(o.seriesId, o.slot);
  return r && r.day <= ctx.now.ymd ? h`<section class="dp-result" aria-labelledby="rs-${idKey(o)}"><h2 id="rs-${idKey(o)}">Results</h2><p>${resultWords(r)}.${playersWords(r) ? ` ${playersWords(r)} played.` : ''}</p></section>` : '';
};

/** Page not found for a series or date. */
export function eventMissing(ctx, s) {
  const n = s ? nextDate(ctx, s) : null;
  return h`<div class="wrap dp-wrap"><div class="empty lattice" role="note"><h1 class="empty-h">We couldn’t find that event date.</h1>${n ? h`<p><a href="${eventHref(ctx, n)}">Next one: ${fmtLong(n.date)}</a></p>` : ''}<a class="btn btn-2" href="${keep(ctx, '/events/', {})}">See all events</a></div></div>`;
}

// ---------- a player's own sign-up page, reached by the private link (D26) ----------
/** reg = registrations.byToken(); taken = seats taken now. flags: { isNew (just signed up: show the keep-this-link box), raced, link (full URL) }. */
export function signupPage(ctx, o, reg, { taken = 0, isNew = false, raced = false, link = '' } = {}) {
  const when = `${o.title}, ${fmtLong(o.date)}${o.start ? ` at ${fmtTime(o.start)}` : ''}`, cap = o.capacity, active = ['in', 'waitlist'].includes(reg.status);
  const banner = reg.status === 'in' ? h`<strong>You\u2019re in.</strong> ${cap ? `${taken} of ${cap} seats are taken for ` : 'Your seat is held for '}${when}. ${feeLine(o)}`
    : reg.status === 'waitlist' ? h`${raced ? 'That seat just went. ' : ''}<strong>You\u2019re on the waitlist (#${reg.waitlistPos})${raced ? ' instead' : ''}.</strong> If a seat opens, you move in automatically. Check this page or ask at the counter.`
      : reg.status === 'cancelled' ? h`<strong>Your sign-up is cancelled.</strong> Your seat went to the next person.`
        : h`<strong>You were marked as not arrived,</strong> so your seat was released. Ask at the counter.`;
  return h`<div class="wrap dp-wrap"><p class="dp-back"><a href="${eventHref(ctx, o)}">${icon('chevron', 'ic-back')}${o.title}</a></p>
<article class="su-page" aria-labelledby="su-t"><h1 id="su-t">Your sign-up</h1>
<div class="pg-banner ${reg.status === 'in' ? '' : reg.status === 'waitlist' ? 'pg-warn' : 'pg-bad'}" role="status">${icon(reg.status === 'in' ? 'check' : reg.status === 'waitlist' ? 'hourglass' : 'cancel')}<div><p>${banner}</p></div></div>
<p>${reg.name}</p>
${reg.status === 'in' && o.arriveBy ? h`<p class="ev-arrive">${icon('clock')}${arriveText(o)}</p>` : ''}
${isNew ? h`<div class="su-keep"><p><strong>Keep this link.</strong> It is the only way to cancel or check your place online. We can\u2019t email it. Anyone who has it can cancel your sign-up.</p><p class="su-link"><a href="${link}">${link}</a></p></div>` : ''}
${active ? h`<p class="det-acts"><a class="btn btn-2" href="${`/events/${encodeURIComponent(o.seriesId)}.ics?date=${encodeURIComponent(o.slot)}`}">${icon('calendar')}Add to calendar</a></p>` : ''}
${active ? h`<form method="post" action="/api/signup/cancel"><input type="hidden" name="token" value="${reg.token}"><p class="hint">${reg.status === 'in' ? 'Cancelling frees your seat for the next person.' : 'Leaving frees your place for the next person.'} You can sign up again if there is room.</p><button class="btn btn-bad" type="submit">${reg.status === 'in' ? 'Cancel my seat' : 'Leave the waitlist'}</button></form>` : ''}
${reg.status === 'cancelled' && reg.undoable ? h`<form method="post" action="/api/signup/undo-cancel"><input type="hidden" name="token" value="${reg.token}"><p class="hint">Tapped Cancel by mistake? You can take it back for a few minutes, if your place is still free.</p><button class="btn btn-act" type="submit">Undo, keep my place</button></form>` : ''}
<p class="hint">We delete your contact details ${RETENTION_DAYS} days after the event. <a href="/privacy/">Privacy</a></p></article></div>`;
}
/** A plain message page (a sign-up link that is wrong or finished). */
export function signupGone(ctx, title, body) {
  return h`<div class="wrap dp-wrap"><div class="empty lattice" role="note"><h1 class="empty-h">${title}</h1><p>${body}</p><a class="btn btn-2" href="${keep(ctx, '/events/', {})}">See all events</a></div></div>`;
}
