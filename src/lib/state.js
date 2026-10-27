// Admin-edited content: cleaning helpers, and the live markers server.js fills into the static pages.
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

// ---------- live markers ----------
/** What visitors may see, as one object. Later tasks add their public sections here (enabled items only, never private data). */
export const publicData = (s, today) => ({ today });
/** <script type="application/json" id="mg-data"> so a script (or the static fallback) can read the same data. */
export const dataScript = (s, today) => `<script type="application/json" id="mg-data">${JSON.stringify(publicData(s, today)).replace(/</g, '\\u003c')}</script>`;

// <!--mg:name--> is replaced by live content. If the static page has baked content, wrap it as
// <!--mg:name-->baked<!--/mg:name--> and the whole region is replaced. Unknown names are left alone.
const MARKER = /<!--mg:([a-z-]+)-->(?:[\s\S]*?<!--\/mg:\1-->)?/g;
/** Fill every marker in a page. today = etDay(). extra = { name: () => markup } from src/lib/render.js: those functions must escape everything they
 *  read from the database (the h tag does), because what they return is inserted as HTML. A throwing part leaves its marker, the static page's default. */
export function injectMarkers(html, state, today, extra = {}) {
  const parts = { ...extra, data: () => dataScript(state, today) };
  return html.replace(MARKER, (m, name) => {
    try { const v = parts[name]?.(); return v === undefined ? m : String(v); } catch (e) { console.error(`marker mg:${name} failed, left as the static default:`, e); return m; }
  });
}
