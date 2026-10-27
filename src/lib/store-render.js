// Server HTML for the store facts that sit in the page frame and the front page (address, phone, parking, links, room photo), filled at
// <!--mg:name--> markers on every request so an admin edit shows without a restart (D11). D20: only the escaping `h` tag builds markup; links go through safeUrl.
import { h, hours, icon, mapsUrl } from './render.js';
import { safeUrl } from './events.js';

const SOCIAL = [['Facebook', 'facebook'], ['Instagram', 'instagram'], ['TikTok', 'tiktok'], ['X', 'x'], ['TopDeck', 'topdeck']];
const link = (store, k) => safeUrl(store.links?.[k]);
const addr = (s) => s.address;
const tel = (s) => safeUrl(s.phoneHref);
const out = (name) => h`<span class="vh"> (opens ${name})</span>`;

/** The open-now strip's address, Call and Directions. */
export function bar({ store }) {
  const t = tel(store);
  return h`<p class="ob-addr">${addr(store).street}, ${addr(store).city}</p>${t ? h`<a class="ob-link" href="${t}">${icon('phone')}<span class="ob-long">${store.phone}</span><span class="ob-short">Call</span></a>` : ''}<a class="ob-link" href="${mapsUrl(store)}" target="_blank" rel="noopener">${icon('pin')}Directions<span class="vh"> (opens Google Maps)</span></a>`;
}
/** Footer name, address and phone. */
export function footAddr({ store }) {
  const a = addr(store), t = tel(store);
  return h`<p class="foot-name">${store.name}</p><p>${a.street}, ${a.city}, ${a.region} ${a.zip}<br>${t ? h`<a href="${t}">${store.phone}</a>` : store.phone}</p>`;
}
/** Social links as list items (footer and "Between events"). */
export function socials({ store }) {
  return SOCIAL.map(([n, k]) => [n, link(store, k)]).filter(([, u]) => u).map(([n, u]) => h`<li><a href="${u}" target="_blank" rel="noopener">${n}<span class="vh"> (opens in a new tab)</span></a></li>`);
}
/** Two cEDH facts that come from store facts: the standings link and the parking note. */
export function cedhLive({ store }) {
  const circuit = link(store, 'topdeckCircuit') ?? link(store, 'topdeck');
  return h`${circuit ? h`<div><dt>Standings</dt><dd><a href="${circuit}" target="_blank" rel="noopener">Circuit points on TopDeck${out('TopDeck')}</a></dd></div>` : ''}${store.parking ? h`<div><dt>Parking</dt><dd>${store.parking}</dd></div>` : ''}`;
}
/** The whole Visit block: hours table, address, parking, good to know, and the room photo when one is chosen. */
export function visit(ctx) {
  const { store } = ctx, a = addr(store), t = tel(store), photo = store.photo;
  return h`<div class="wrap visit-in${photo ? '' : ' no-photo'}"><div class="visit-hours"><h2 id="visit-h">Visit</h2>${hours(ctx)}</div>
<div class="visit-where"><h3>Find us</h3><address>${a.street}<br>${a.city}, ${a.region} ${a.zip}</address>
<p class="visit-acts"><a class="btn btn-2" href="${mapsUrl(store)}" target="_blank" rel="noopener">${icon('pin')}Directions<span class="vh"> (opens Google Maps)</span></a>${t ? h`<a class="btn btn-2" href="${t}">${icon('phone')}${store.phone}</a>` : ''}</p>
${store.parking ? h`<p><strong>Parking:</strong> ${store.parking}</p>` : ''}<h3>Good to know</h3>
<dl class="faq"><dt>New here?</dt><dd><a href="/new-here/">Start here.</a> What to expect and which nights are good for a first visit.</dd>${store.kids ? h`<dt>Can kids come?</dt><dd>${store.kids}</dd>` : ''}${store.freePlay ? h`<dt>Can I just come and play?</dt><dd>${store.freePlay}.</dd>` : ''}<dt>How do preorders work?</dt><dd>Preorders are taken in store. Each preorder has a last day, shown above.</dd></dl></div>
${photo ? h`<figure class="photo has-img"><img src="${`/media/photos/${encodeURIComponent(photo)}`}" alt="${store.photoAlt ?? ''}" loading="lazy"></figure>` : ''}</div>`;
}
/** "Between events": the Discord invite (or the follow line) and the social links. */
export function discord({ store }) {
  const d = link(store, 'discord');
  return h`<h2 id="comm-h">Between events</h2>${d ? h`<p>Chat with the regulars, find a pod and hear about new events first on the shop Discord.</p><p><a class="btn btn-act" href="${d}" target="_blank" rel="noopener">${icon('chat')}Join the Discord${out('Discord')}</a></p>` : h`<p>Follow the shop to hear about new events first.</p>`}<ul class="socials">${socials({ store })}</ul>`;
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
