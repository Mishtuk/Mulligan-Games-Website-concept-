// sitemap.xml: the public pages plus one URL for every upcoming event date (D16). Cancelled dates stay listed until they pass (DESIGN.md 15.4).
import { occurrences } from './events.js';
import { addDays } from './clock.js';
import { esc } from './state.js';

export const PAGES = ['/', '/events/', '/new-here/'];
/** baseUrl without a trailing slash; today = store day; days = how far ahead to list dates. */
export function sitemap(series, exceptions, baseUrl, today, days = 365) {
  const urls = PAGES.map((p) => ({ loc: baseUrl + p }));
  for (const s of series.filter((x) => x.enabled !== false)) {
    for (const o of occurrences(s, today, addDays(today, days), exceptions)) {
      urls.push({ loc: `${baseUrl}/events/${encodeURIComponent(o.seriesId)}?date=${encodeURIComponent(o.slot)}`, lastmod: o.updated });
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${esc(u.lastmod)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
}
