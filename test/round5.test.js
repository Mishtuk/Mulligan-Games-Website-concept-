// Round 5 port (D39/D40): reviews, cEDH fees, turnout, hero media switch, note-less preorder tiles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { cedhLive, turnout } from '../src/lib/store-render.js';
import { releases } from '../src/lib/render.js';
import { etNow } from '../src/lib/clock.js';
import proof from '../src/content/proof.json' with { type: 'json' };

const built = existsSync(new URL('../dist/index.html', import.meta.url));
const page = () => readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');

test('cEDH entry: $60 / $100 / $35, the $10 deposit said once', () => {
  const s = cedhLive({ store: {} }).toString();
  assert.match(s, /Championship Series \$60 and 5K \$100: a \$10 online deposit holds a spot, the rest is paid at the door\. Redemption \$35 \(\$25 if you played the 5K\), paid on site\./);
  assert.equal(s.split('deposit').length, 2);
});

test('turnout: the last four past events, newest first, escaped, one TopDeck link', () => {
  const p = structuredClone(proof);
  p.circuit.events.push({ date: '2026-10-11', title: '<script>alert(1)</script>', players: 5 });
  const s = turnout({ now: etNow(new Date('2026-10-27T15:00:00Z')) }, p).toString();
  assert.ok(!s.includes('<script>') && s.includes('&lt;script&gt;'));
  assert.deepEqual([...s.matchAll(/<b>(\d+) players/g)].map((m) => +m[1]), [5, 69, 69, 12]); // Oct 11, Oct 4, Sep 6, Aug 9
  assert.equal(s.split('topdeck.gg').length, 2);
  assert.equal(turnout({ now: etNow(new Date('2025-01-01T15:00:00Z')) }).toString(), '');
});

test('preorder tile without a note or event has no rel-text', () => {
  const ctx = { releases: [{ id: 'x', game: 'magic', name: 'Plain', status: 'out' }, { id: 'y', game: 'magic', name: 'Noted', status: 'out', note: 'Hi' }], series: [], exceptions: [], games: [{ id: 'magic' }], now: etNow(new Date('2026-10-27T15:00:00Z')) };
  const s = releases(ctx).toString();
  assert.equal(s.split('class="rel-text"').length, 2);
});

test('site.js: hero video poster swap and hold rules live in the file (no inline script, CSP D24); no innerHTML', () => {
  const js = readFileSync(new URL('../public/js/site.js', import.meta.url), 'utf8');
  assert.ok(js.includes("getAttribute('data-src')") && js.includes('prefers-reduced-motion') && js.includes('saveData') && js.includes('2g|3g'));
  assert.ok(!/innerHTML/.test(js.replace(/\/\*[^]*?\*\//, '')));
});

test('front page: reviews come from proof.json, hero video with phone sources and posters', { skip: !built }, () => {
  const h = page();
  assert.match(h, /4\.9 on Google from 81 reviews/);
  assert.equal(h.split('4.9 on Google').length, 2, 'the rating is said once');
  for (const q of proof.reviews.items) assert.ok(h.includes(q.text) && h.includes(`${q.name}, ${q.age}`), q.name);
  assert.ok(h.includes('href="https://www.google.com/maps/search/'));
  // no autoplay, src or poster in the HTML: a held screen (reduced motion, Save-Data, 2g/3g) or no JS fetches no video; site.js arms the sources
  assert.match(h, /<video id="hero-video" muted loop playsinline preload="none" tabindex="-1">/);
  const vid = h.match(/<video id="hero-video"[^]*?<\/video>/)[0];
  assert.ok(!/autoplay|poster=|\ssrc=/.test(vid), 'no autoplay / poster / src in the markup');
  assert.ok(vid.indexOf('media="(max-width: 700px) and (orientation: portrait)" data-src="/media/video/hero-portrait.mp4"') < vid.indexOf('media="(max-width: 700px)" data-src="/media/video/hero-720.mp4"') && vid.includes('<source data-src="/media/video/hero.mp4"'));
  assert.ok(h.includes('rel="preload" as="image" href="/media/video/hero-poster-portrait.jpg"') && !h.includes('cedh-players-tables-loop') && !h.includes('<picture'));
  assert.ok(!/t-?shirt/i.test(h) && h.includes('Shop Pokemon Japan and Magic cards online on TCGplayer') && h.includes('mg:turnout'));
});

test('site.js: the Copy button copies with navigator.clipboard, says Copied for 2 s, and is only shown when clipboard exists', () => {
  const js = readFileSync(new URL('../public/js/site.js', import.meta.url), 'utf8');
  assert.ok(js.includes('navigator.clipboard.writeText(cc.getAttribute(\'data-copy\'))') && js.includes("textContent = 'Copied'") && js.includes('2000') && js.includes('cc.hidden = false'));
});
