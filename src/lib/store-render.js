// Server HTML for the store facts that sit in the page frame and the front page (address, phone, parking, links, room photo), filled at
// <!--mg:name--> markers on every request so an admin edit shows without a restart (D11). D20: only the escaping `h` tag builds markup; links go through safeUrl.
import { DAYS, fmtDate, fmtTime, h, hours, icon, mapsUrl } from './render.js';
import proof from '../content/proof.json' with { type: 'json' };
import { safeUrl } from './events.js';

const SOCIAL = [['Facebook', 'facebook'], ['Instagram', 'instagram'], ['TikTok', 'tiktok'], ['X', 'x'], ['TopDeck', 'topdeck']];
const link = (store, k) => safeUrl(store.links?.[k]);
const addr = (s) => s.address;
const tel = (s) => safeUrl(s.phoneHref);
const out = (name) => h`<span class="vh"> (opens ${name})</span>`;

/** The open-now strip's address, Call and Directions. */
export function bar({ store }) {
  const t = tel(store);
  return h`<p class="ob-addr">${addr(store).street}<span class="ob-long">, ${addr(store).city}</span></p>${t ? h`<a class="ob-link" href="${t}">${icon('phone')}<span class="ob-long">${store.phone}</span><span class="ob-short">Call</span></a>` : ''}<a class="ob-link" href="${mapsUrl(store)}" target="_blank" rel="noopener">${icon('pin')}Directions<span class="vh"> (opens Google Maps)</span></a>`;
}
/** The footer's weekly hours as short lines ("Wed–Thu 2 PM to 10 PM", "Mon–Tue closed"): neighbouring days with the same hours share a line. */
export function hoursLines(store) {
  if (!Array.isArray(store.hours)) return [];
  const runs = [];
  for (const d of [1, 2, 3, 4, 5, 6, 0]) {
    const w = store.hours.find((x) => x.day === d), text = !w || w.closed || !w.open || !w.close ? 'closed' : `${fmtTime(w.open)} to ${fmtTime(w.close)}`, last = runs[runs.length - 1];
    if (last && last.text === text) last.days.push(d); else runs.push({ text, days: [d] });
  }
  return runs.map((r) => `${DAYS[r.days[0]].slice(0, 3)}${r.days.length > 1 ? `–${DAYS[r.days[r.days.length - 1]].slice(0, 3)}` : ''} ${r.text}`);
}
/** Footer Visit and Hours columns (the index, round 4 F10). */
export function footAddr({ store }) {
  const a = addr(store), t = tel(store), lines = hoursLines(store);
  return h`<div class="foot-visit"><h2>Visit</h2><p>${a.street}<br>${a.city}, ${a.region} ${a.zip}</p>${t ? h`<p><a href="${t}">${store.phone}</a></p>` : h`<p>${store.phone}</p>`}<p><a href="${mapsUrl(store)}" target="_blank" rel="noopener">Directions<span class="vh"> (opens Google Maps)</span></a></p></div>
<div class="foot-hours"><h2>Hours</h2>${lines.length ? h`<ul>${lines.map((l) => h`<li>${l}</li>`)}</ul>` : h`<p>Call the shop for hours.</p>`}</div>`;
}
/** Social links as list items (footer and "Between events"). */
export function socials({ store }) {
  return SOCIAL.map(([n, k]) => [n, link(store, k)]).filter(([, u]) => u).map(([n, u]) => h`<li><a href="${u}" target="_blank" rel="noopener">${n}<span class="vh"> (opens in a new tab)</span></a></li>`);
}
/** Two cEDH facts: what entry costs (src/content/proof.json; the $10 deposit is said once, here) and the parking note. */
export const entryText = (p = proof) => `Championship Series $${p.cedh.fees.mcs} and 5K $${p.cedh.fees['5k']}: a $${p.cedh.deposit} online deposit holds a spot, the rest is paid at the door. Redemption $${p.cedh.fees.redemption} ($${p.cedh.redemptionAfter5k} if you played the 5K), paid on site.`;
export function cedhLive({ store }) {
  return h`<div><dt>Entry</dt><dd>${entryText()}</dd></div>${store.parking ? h`<div><dt>Parking</dt><dd>${store.parking}</dd></div>` : ''}`;
}
/** "Recent turnout": the last four past circuit events (newest first) and one TopDeck link. */
export function turnout({ now }, p = proof) {
  const rows = p.circuit.events.filter((r) => r.date < now.ymd).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 4), url = safeUrl(p.circuit.url);
  if (!rows.length) return '';
  return h`<div class="turnout"><h4>Recent turnout</h4><ul class="turnout-list">${rows.map((r) => h`<li><span>${fmtDate(r.date)}</span><span>${r.title}</span><b>${r.players} players</b></li>`)}</ul>${url ? h`<a class="turnout-more" href="${url}" target="_blank" rel="noopener">Full standings on TopDeck${out('TopDeck')}</a>` : ''}</div>`;
}
/** /cedh/ turnout: every past circuit event newest first, upcoming ones as "registered so far", one TopDeck link. */
export function turnoutAll({ now }, p = proof) {
  const all = p.circuit.events, past = all.filter((r) => r.date < now.ymd).sort((a, b) => (a.date < b.date ? 1 : -1)), next = all.filter((r) => r.date >= now.ymd).sort((a, b) => (a.date < b.date ? -1 : 1)), url = safeUrl(p.circuit.url);
  const li = (r, w) => h`<li><span>${fmtDate(r.date)}, ${r.date.slice(0, 4)}</span><span>${r.title}</span><b>${r.players} ${w}</b></li>`;
  return h`${next.length ? h`<h3>Coming up</h3><ul class="turnout-list">${next.map((r) => li(r, 'registered so far'))}</ul>` : ''}${past.length ? h`<h3>Past events</h3><ul class="turnout-list">${past.map((r) => li(r, 'players'))}</ul>` : ''}${url ? h`<a class="turnout-more" href="${url}" target="_blank" rel="noopener">Full standings on TopDeck${out('TopDeck')}</a>` : ''}`;
}
/** The whole Visit block: a heading, then three columns (hours, address, good to know) on the band, no card box; the room photo below it when one is chosen. */
export function visit(ctx) {
  const { store } = ctx, a = addr(store), t = tel(store), photo = store.photo;
  return h`<div class="wrap"><div class="sec-head"><h2 id="visit-h">Visit</h2></div>
<div class="visit-in"><div class="visit-hours"><h3>Hours</h3>${hours(ctx)}</div>
<div class="visit-where"><h3>Find us</h3><address>${a.street}<br>${a.city}, ${a.region} ${a.zip}</address>
<p class="visit-acts"><a class="btn btn-2" href="${mapsUrl(store)}" target="_blank" rel="noopener">${icon('pin')}Directions<span class="vh"> (opens Google Maps)</span></a>${t ? h`<a class="btn btn-2" href="${t}">${icon('phone')}${store.phone}</a>` : ''}</p>
<p class="visit-small">${store.parking ? h`<strong>Parking:</strong> ${store.parking} ` : ''}Look for the sign on the roof. The door is right below it.</p></div>
<div class="visit-faq"><h3>Good to know</h3>
<dl class="faq"><dt>New here?</dt><dd><a href="/new-here/">Start here.</a> What to expect and which nights are good for a first visit.</dd>${store.kids ? h`<dt>Can kids come?</dt><dd>${store.kids}</dd>` : ''}${store.freePlay ? h`<dt>Can I just come and play?</dt><dd>${store.freePlay}.</dd>` : ''}<dt>How do preorders work?</dt><dd>Preorders are taken in store. Each preorder has a last day, shown above.</dd></dl></div></div>
${photo ? h`<figure class="photo has-img"><img src="${`/media/photos/${encodeURIComponent(photo)}`}" alt="${store.photoAlt ?? ''}" loading="lazy"></figure>` : ''}</div>`;
}
/** "Between events": a normal section head carrying the Discord line, then the Discord button and the social links in one row. */
export function discord({ store }) {
  const d = link(store, 'discord');
  return h`<div class="sec-head"><h2 id="comm-h">Between events</h2><p class="sec-note">${d ? 'Chat with the regulars, find a pod and hear about new events first on the shop Discord.' : 'Follow the shop to hear about new events first.'}</p></div>
<div class="comm-acts">${d ? h`<a class="btn btn-act" href="${d}" target="_blank" rel="noopener">${icon('chat')}Join the Discord${out('Discord')}</a>` : ''}<ul class="socials">${socials({ store })}</ul></div>`;
}

// ---------- New here? ----------
/** Table of contents entries; "Free play" only while the store has a free-play line. */
export function nhToc({ store }) {
  const toc = [['first', 'Good first nights'], store.freePlay && ['free', 'Free play'], ['bring', 'What to bring'], ['kids', 'Kids and ages'], ['pay', 'Signing up and paying'],
    ['prerelease', 'Prereleases'], ['proxies', 'Proxies'], ['trade', 'Trade-ins'], ['here', 'Getting here'], ['ask', 'Still have a question?']].filter(Boolean);
  return toc.map(([id, label]) => h`<li><a href="${`#${id}`}">${label}</a></li>`);
}
export const nhFree = ({ store }) => (store.freePlay ? h`<section id="free" aria-labelledby="h-free"><h2 id="h-free"><span class="nh-dia" aria-hidden="true"></span>Free play</h2><p>${store.freePlay}. Bring a deck and find a table.</p></section>` : '');
export const nhKids = ({ store }) => (store.kids ? h`<p>${store.kids}</p>` : '');
export function nhHere({ store }) {
  const a = addr(store);
  return h`<address>${a.street}<br>${a.city}, ${a.region} ${a.zip}</address>${store.parking ? h`<p>${store.parking}</p>` : ''}`;
}
/** The Directions button, from the saved address (so an address edit moves it too). */
export const nhDirections = ({ store }) => h`<p class="visit-acts"><a class="btn btn-2" href="${mapsUrl(store)}" target="_blank" rel="noopener">${icon('pin')}Directions<span class="vh"> (opens Google Maps)</span></a></p>`;
export function nhAsk({ store }) {
  const t = tel(store), d = link(store, 'discord');
  return h`<p>Call ${t ? h`<a href="${t}">${store.phone}</a>` : store.phone}.${d ? h` Or ask in our <a href="${d}" target="_blank" rel="noopener">Discord${out('Discord')}</a>.` : ''}</p>`;
}
