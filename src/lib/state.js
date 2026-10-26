// Admin-edited content: cleaning helpers, recurring-date expansion, and the live markers server.js fills into the static pages.
// Plain JS with no Node-only imports, so the SAME functions run in Astro (build time) and in server.js (live data).
// Dates are "YYYY-MM-DD" strings, times "HH:MM" (24h). "Today" is always America/New_York (the store is in Warminster, PA).

export const TZ = 'America/New_York';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/** Today's date in Eastern time. */
export const etDay = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now);

// ---------- cleaning and validation ----------
const TAG = /<[^>]*>/g;
/** One line of plain text: tags and control characters removed, trimmed, cut to max. */
export const text = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(TAG, '').replace(/\s+/g, ' ').trim() : '').slice(0, max);
/** Plain text that keeps line breaks (paragraphs separated by a blank line). */
export const para = (v, max) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').replace(TAG, '').replace(/\n{3,}/g, '\n\n').trim() : '').slice(0, max);

const parseDay = (s) => new Date(`${s}T00:00:00Z`);
const fmtDay = (d) => d.toISOString().slice(0, 10);
export const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(+parseDay(s)) && fmtDay(parseDay(s)) === s;
export const isTime = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

// ---------- recurring events ----------
const addDays = (ymd, n) => { const d = parseDay(ymd); d.setUTCDate(d.getUTCDate() + n); return fmtDay(d); };
const daysIn = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

/** Dates (YYYY-MM-DD) an event happens on within [from, to]. One-off: its date. Weekly: every 7 days. Monthly: the same date each
 *  month (a 31st lands on the last day of shorter months). monthly_weekday: the same Nth weekday (a 5th lands on the last one). */
export function occurrences(e, from, to) {
  const out = [];
  const start = e.date;
  if (e.recurring === 'weekly') {
    let d = start;
    if (from > d) d = addDays(d, Math.ceil((parseDay(from) - parseDay(d)) / 864e5 / 7) * 7);
    for (; d <= to; d = addDays(d, 7)) out.push(d);
    return out;
  }
  if (e.recurring === 'monthly' || e.recurring === 'monthly_weekday') {
    const s = parseDay(start);
    const dom = s.getUTCDate(), dow = s.getUTCDay(), nth = Math.ceil(dom / 7);
    let y = +from.slice(0, 4), m = +from.slice(5, 7) - 1;
    for (; `${y}-${String(m + 1).padStart(2, '0')}` <= to.slice(0, 7); m === 11 ? (y++, m = 0) : m++) {
      let day;
      if (e.recurring === 'monthly') day = Math.min(dom, daysIn(y, m));
      else {
        const first = (dow - new Date(Date.UTC(y, m, 1)).getUTCDay() + 7) % 7 + 1; // first such weekday of the month
        day = first + (nth - 1) * 7;
        if (day > daysIn(y, m)) day -= 7;
      }
      const d = fmtDay(new Date(Date.UTC(y, m, day)));
      if (d >= start && d >= from && d <= to) out.push(d);
    }
    return out;
  }
  return start >= from && start <= to ? [start] : [];
}

/** Every dated occurrence of the enabled events in [from, to], earliest first. */
export function expand(events = [], from, to) {
  return events.filter((e) => e.enabled !== false)
    .flatMap((e) => occurrences(e, from, to).map((date) => ({ ...e, date, eventId: e.id })))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.start || '').localeCompare(b.start || '') || a.title.localeCompare(b.title));
}

// ---------- live markers ----------
/** What visitors may see, as one object. Later tasks add their public sections here (enabled items only, never private data). */
export const publicData = (s, today) => ({ today });
/** <script type="application/json" id="mg-data"> so a script (or the static fallback) can read the same data. */
export const dataScript = (s, today) => `<script type="application/json" id="mg-data">${JSON.stringify(publicData(s, today)).replace(/</g, '\\u003c')}</script>`;

// <!--mg:name--> is replaced by live content. If the static page has baked content, wrap it as
// <!--mg:name-->baked<!--/mg:name--> and the whole region is replaced. Unknown names are left alone.
const MARKER = /<!--mg:([a-z-]+)-->(?:[\s\S]*?<!--\/mg:\1-->)?/g;
/** Fill every marker in a page. today = etDay(). */
export function injectMarkers(html, state, today) {
  const parts = {
    data: () => dataScript(state, today),
  };
  return html.replace(MARKER, (m, name) => parts[name]?.() ?? m);
}
