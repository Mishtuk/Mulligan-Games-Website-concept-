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
  assert.match(s, /Championship Series \$60, 5K \$100, Redemption \$35 \(\$25 after the 5K\)\. A \$10 online deposit/);
  assert.equal(s.split('deposit').length, 2);
});

test('turnout: the last four past events, newest first, escaped, one TopDeck link', () => {
  const p = structuredClone(proof);
  p.circuit.events.push({ date: '2026-10-11', title: '<script>alert(1)</script>', players: 5 });
  const s = turnout({ now: etNow(new Date('2026-10-27T15:00:00Z')) }, p).toString();
  assert.ok(!s.includes('<script>') && s.includes('&lt;script&gt;'));
  assert.deepEqual([...s.matchAll(/<b>(\d+) players/g)].map((m) => +m[1]), [5, 69, 69, 12]); // Oct 11, Oct 4, Sep 6, Aug 9
  assert.equal(s.split('topdeck.gg').length, 2);
  assert.equal(turnout({ now: etNow(new Date('2026-01-01T15:00:00Z')) }).toString(), '');
});

test('preorder tile without a note or event has no rel-text', () => {
  const ctx = { releases: [{ id: 'x', game: 'magic', name: 'Plain', status: 'out' }, { id: 'y', game: 'magic', name: 'Noted', status: 'out', note: 'Hi' }], series: [], exceptions: [], games: [{ id: 'magic' }], now: etNow(new Date('2026-10-27T15:00:00Z')) };
  const s = releases(ctx).toString();
  assert.equal(s.split('class="rel-text"').length, 2);
});

test('site.js: one function-wide `start` (a second var overwrote the hero start() and the loop never played)', () => {
  const js = readFileSync(new URL('../public/js/site.js', import.meta.url), 'utf8');
  assert.equal(js.match(/\bvar start\b/g).length, 1);
});

test('front page: reviews come from proof.json, hero still on wide and video only on phones', { skip: !built }, () => {
  const h = page();
  assert.match(h, /4\.9 on Google · 81 reviews/);
  for (const q of proof.reviews.items) assert.ok(h.includes(q.text) && h.includes(`${q.name}, ${q.age}`), q.name);
  assert.ok(h.includes('href="https://www.google.com/maps/search/'));
  assert.match(h, /<source media="\(min-width: 900px\)" srcset="\/img\/social\/shop-floor-cases-800\.webp 800w/);
  assert.match(h, /<video id="hero-video"[^>]*><\/video>/, 'no <source> or poster in the HTML');
  assert.ok(!/t-?shirt/i.test(h) && h.includes('Shop Pokemon Japan and Magic cards online on TCGplayer') && h.includes('mg:turnout'));
});
