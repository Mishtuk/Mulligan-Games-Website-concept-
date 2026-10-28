// Round 8 (D60): the new look. Tonight band, lineup, rows card, Play by game, promises, page heads, Fraunces, and escaping on every new render function.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { eventMissing, gameTiles, hero, pgHead, tonight, week } from '../src/lib/render.js';
import { promises } from '../src/lib/store-render.js';
import { etNow } from '../src/lib/clock.js';
import { GAMES } from '../src/lib/games.js';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const built = existsSync(new URL('../dist/index.html', import.meta.url));
const HRS = [{ day: 0, open: '13:00', close: '22:00' }, { day: 1, closed: true }, { day: 2, closed: true }, { day: 3, open: '14:00', close: '22:00' }, { day: 4, open: '14:00', close: '22:00' }, { day: 5, open: '14:00', close: '24:00' }, { day: 6, open: '14:00', close: '24:00' }];
const at = (iso) => etNow(new Date(iso));
const FRI_1850 = '2026-10-30T22:50:00Z', FRI_1100 = '2026-10-30T15:00:00Z', MON = '2026-11-02T15:00:00Z';
const ev = (id, game, extra = {}) => ({ id, title: `T-${id}`, game, kind: 'weekly', recurrence: { type: 'weekly', day: 5 }, start: '19:00', end: '22:00', fee: 5, signup: 'walkin', enabled: true, ...extra });
const special = (id, game, date, extra = {}) => ev(id, game, { kind: 'special', recurrence: { type: 'dates', dates: [{ date, start: '19:00' }] }, signup: 'here', capacity: 16, ...extra });
const ctx = (series, iso, over = {}) => ({ store: { hours: HRS }, series, exceptions: [], games: GAMES, releases: [], now: at(iso), query: new URLSearchParams(), counts: new Map(), ...over });
const BAD = '<img src=x onerror=alert(1)>';

test('Tonight: "Tonight" from 5 PM with at most 4 rows, "Today" before, nothing at all when nothing is on', () => {
  const list = [ev('a', 'magic', { start: '14:00', end: '23:00' }), ev('b', 'pokemon', { start: '17:00' }), ev('c', 'cedh', { start: '18:00' }), ev('d', 'other', { start: '19:00' }), ev('e', 'magic', { start: '20:00' }), ev('f', 'magic', { start: '21:00' })];
  const eve = tonight(ctx(list, FRI_1850)).toString();
  assert.ok(eve.includes('id="tonight"') && eve.includes('>Tonight</h2>'));
  assert.equal([...eve.matchAll(/<li class="tn-row"/g)].length, 4);
  assert.ok(eve.includes('and 2 more today') && eve.includes('class="tag tag-now"'), 'the 2 PM night is on now');
  assert.ok(tonight(ctx(list, FRI_1100)).toString().includes('>Today</h2>'));
  assert.equal(tonight(ctx(list, MON)).toString(), '', 'closed Monday, nothing on: no band, no heading');
  assert.equal(tonight(ctx([], FRI_1850)).toString(), '');
  assert.equal(tonight(ctx([ev('x', 'magic', { start: '08:00', end: '09:00' })], FRI_1850)).toString(), '', 'over for the day');
});

test('Tonight: the week card leaves today out, the Today tile and the hero ticket go to the band, and only seat-holding rows have a button', () => {
  const list = [ev('w', 'magic', { signup: 'walkin' }), special('s', 'pokemon', '2026-10-30'), special('full', 'magic', '2026-10-30', { capacity: 1, waitlist: true, start: '20:00' }), ev('later', 'magic', { recurrence: { type: 'weekly', day: 6 } })];
  const c = ctx(list, FRI_1850, { counts: new Map([['full|2026-10-30T19:00', { taken: 1, waiting: 0 }]]) }), html = week(c).toString();
  assert.ok(html.includes('id="tonight"') && !html.includes('id="d-2026-10-30"'));
  assert.ok(/class="daycard" style="--i:0" href="#tonight"/.test(html));
  assert.ok(hero(c).toString().includes('id="nextup" href="#tonight"'));
  const band = html.slice(html.indexOf('id="tonight"'), html.indexOf('id="week"'));
  assert.equal([...band.matchAll(/>Sign up</g)].length, 1, 'open seats: Sign up');
  assert.equal([...band.matchAll(/>Join the waitlist</g)].length, 1, 'full with a waitlist');
  assert.ok(band.includes('#signup'));
  assert.equal([...tonight(ctx([ev('w', 'magic')], FRI_1850)).toString().matchAll(/class="btn/g)].length, 0, 'walk-in rows have no button');
  const rows = html.slice(html.indexOf('id="days"'));
  assert.ok(rows.includes('Sat') || rows.includes('Saturday'), 'Saturday is still a row');
  const noBand = week(ctx(list, MON)).toString();
  assert.ok(!noBand.includes('id="tonight"') && !/href="#tonight"/.test(noBand) && !hero(ctx(list, MON)).toString().includes('#tonight'));
});

test('Tonight, rows, lineup and tiles escape titles and games (D20)', () => {
  const evil = [ev('x', 'magic', { title: BAD }), special('y', 'magic', '2026-11-03', { title: BAD }), ev('z', 'magic', { title: BAD, recurrence: { type: 'weekly', day: 6 } })];
  const c = ctx(evil, FRI_1850);
  for (const html of [tonight(c), week(c), gameTiles({ ...c, games: [{ id: 'magic', short: BAD, shown: true }] })]) assert.ok(!String(html).includes('<img src=x') && String(html).includes('&lt;img src=x'));
  assert.ok(!String(eventMissing(c, null)).includes('<img'));
  assert.ok(!String(pgHead(BAD, BAD, BAD)).includes('<img') && String(pgHead(BAD, BAD, BAD)).includes('&lt;img'));
});

test('lineup: up to 3 cards from the special nights in the next 14 days; none without specials; Further out leaves them out', () => {
  const sp = [special('s1', 'magic', '2026-11-02'), special('s2', 'pokemon', '2026-11-03'), special('s3', 'cedh', '2026-11-04'), special('s4', 'onepiece', '2026-11-09'), special('far', 'magic', '2026-12-01')];
  const html = week(ctx(sp, FRI_1100)).toString(), lineup = html.match(/<div class="lineup">[^]*?<\/ul><\/div>/)[0];
  assert.ok(lineup.includes('<h3>Coming up</h3>'));
  assert.equal([...lineup.matchAll(/<article class="ev"/g)].length, 3);
  assert.equal([...lineup.matchAll(/<figure class="ev-ph ph"/g)].length, 3, 'each card has its photo band');
  assert.ok(!lineup.includes('T-s4') && !lineup.includes('T-far'));
  const later = html.slice(html.indexOf('id="later-h"'));
  assert.ok(!later.includes('T-s1') && !later.includes('T-s2') && !later.includes('T-s3') && later.includes('T-s4') && later.includes('T-far'), 'Further out has the rest');
  const none = week(ctx([ev('w', 'magic')], FRI_1100)).toString();
  assert.ok(!none.includes('Coming up') && !none.includes('class="lineup"'));
});

test('rows card: every day is rows (no cards in #days), the lead is said once, there are no chips', () => {
  const html = week(ctx([ev('w', 'magic', { signup: 'here', capacity: 16, recurrence: { type: 'weekly', day: 6 } }), ev('v', 'pokemon', { recurrence: { type: 'weekly', day: 0 } })], FRI_1100)).toString(), days = html.slice(html.indexOf('id="days"'), html.indexOf('class="duo'));
  assert.ok(!days.includes('class="slots"') && !days.includes('<article') && !html.includes('id="chips"'));
  assert.equal(html.split('Most nights are walk-in').length, 2);
  assert.ok(days.includes('class="day-lines"') && /class="btn btn-2 btn-sm" href="[^"]+#signup">Sign up</.test(days), 'a sign-up row has the small button');
  assert.equal([...days.matchAll(/class="btn/g)].length, 1, 'the walk-in row has none');
});

test('Play by game: one tile per shown game, linking to its events (keeping ?now=) with this week\'s count', () => {
  const c = ctx([ev('a', 'magic'), ev('b', 'cedh'), ev('c', 'pokemon', { cancelled: true })], FRI_1100, { keepNow: '2026-10-30T11:00' });
  const html = gameTiles(c).toString();
  assert.equal([...html.matchAll(/<a class="gtile"/g)].length, GAMES.filter((g) => g.shown !== false).length);
  assert.ok(html.includes('href="/events/?game=magic&amp;now=2026-10-30T11%3A00"') && html.includes('data-game="pokemon"'));
  assert.ok(/gt-n">Magic<\/span><span class="gt-c">2 this week/.test(html), 'cEDH counts under Magic, as the chips do');
  assert.ok(/gt-n">cEDH<\/span><span class="gt-c">1 this week/.test(html) && /gt-n">Hololive<\/span><span class="gt-c">Nothing this week/.test(html));
  assert.ok(!gameTiles({ ...c, games: [{ ...GAMES[0], shown: false }, GAMES[1]] }).toString().includes('game=magic'));
});

test('Why players choose Mulligan: three promises, the third needs store.kids', () => {
  const store = { kids: 'Kids are welcome.' };
  assert.deepEqual(promises({ store }).map((p) => p.icon), ['cards', 'users', 'sprout']);
  assert.ok(promises({ store })[2].text.includes('Kids are welcome.') && promises({ store })[2].href === '/new-here/');
  assert.deepEqual(promises({ store: { kids: '' } }).map((p) => p.icon), ['cards', 'users'], 'no kids line, no third promise');
  assert.equal(promises({ store: {} }).length, 2);
});

test('page heads: events, a missing date and the built tabs each have one h1, inside .pg-head, and no dashed box', { skip: !built }, () => {
  assert.ok(String(pgHead('T', 'L', 'K')).startsWith('<header class="pg-head"><p class="pg-k">K</p><h1>T</h1><p class="pg-lede">L</p>'));
  assert.ok(!String(pgHead('T')).includes('pg-lede') && !String(pgHead('T')).includes('pg-k'), 'no kicker or lede unless given');
  const missing = String(eventMissing(ctx([], FRI_1100), null));
  assert.ok(missing.includes('<header class="pg-head"><h1>We couldn’t find that event date.</h1><p class="pg-lede">It may have moved or finished.</p>') && !missing.includes('lattice'));
  for (const f of ['index.html', 'cedh/index.html', 'new-here/index.html', 'privacy/index.html', '404.html', 'events/index.html']) {
    const html = read(`../dist/${f}`), h1 = [...html.matchAll(/<h1\b/g)].length;
    if (f !== 'events/index.html') assert.equal(h1, 1, f); // the events template is the loading placeholder until the server fills it
    if (f !== 'index.html' && f !== 'events/index.html') assert.ok(/<header class="pg-head"><h1>/.test(html) || /<header class="pg-head">\s*<h1>/.test(html), `${f}: the h1 is in .pg-head`);
  }
  assert.ok(!read('../dist/404.html').includes('lattice'));
});

test('cEDH page: Rules is folded into "Entry, parking and proxies", with the pairs for 1024px', { skip: !built }, () => {
  const html = read('../dist/cedh/index.html');
  assert.ok(html.includes('Entry, parking and proxies') && !html.includes('id="rules-h"') && html.includes('<dt>Proxies</dt>'));
  assert.equal([...html.matchAll(/class="cp-pair/g)].length, 3);
});

test('home page build: the new order, "Find your table" said once, Good to know gone, Join in, games marker with a baked fallback', { skip: !built }, () => {
  const html = read('../dist/index.html'), at2 = (s) => html.indexOf(s);
  const order = ['id="week"', 'id="games"', 'id="new"', 'id="cedh"', 'id="why"', 'id="visit"', 'id="clips"', 'id="community"'].map(at2);
  assert.ok(order.every((n, i) => n > 0 && (!i || n > order[i - 1])), 'week, games, new, cedh, why, visit, clips, join in');
  assert.equal(html.split('Look for the sign on the roof').length, 2);
  assert.ok(html.includes('Find your table') && html.includes('>Join in<') && !html.includes('Good to know') && !html.includes('Between events') && !html.includes('What people say</h3><p'));
  assert.equal([...html.matchAll(/<a class="gtile"/g)].length, GAMES.filter((g) => g.shown !== false).length, 'the baked tiles');
  assert.ok(html.includes('<!--mg:games-->') && html.includes('<!--mg:week-->') && html.includes('<!--mg:discord-->'));
  assert.ok(!html.includes('mg:lately'), 'Lately is part of the week marker now');
});

test('Fraunces: one self-hosted 600 file under 60 KB with its licence, preloaded, font-src stays self, and admin keeps Archivo', () => {
  const f = new URL('../public/fonts/fraunces-600.woff2', import.meta.url);
  assert.ok(existsSync(f) && statSync(f).size <= 60 * 1024);
  for (const l of ['OFL-Fraunces.txt', 'OFL-Archivo.txt']) assert.ok(/SIL OPEN FONT LICENSE/i.test(read(`../public/fonts/${l}`)), l);
  const css = read('../src/styles/global.css');
  assert.ok(css.includes("font-family: 'Fraunces';") && css.includes("url('/fonts/fraunces-600.woff2')") && css.includes('--font-display: \'Fraunces\''));
  assert.ok(/\nh1, h2, h3, h4 \{ font-family: var\(--font-cond\)/.test(css), 'the base heading rule stays Archivo (admin imports this file)');
  assert.ok(!/Fraunces|font-display/.test(read('../src/styles/admin.css')) && !read('../src/pages/admin.astro').includes('Fraunces'));
  assert.ok(read('../src/components/Base.astro').includes('href="/fonts/fraunces-600.woff2" crossorigin'));
  assert.ok(!/fonts\.(googleapis|gstatic)|https?:\/\/[^'")\s]*\.woff/.test(css));
  assert.ok(read('../server.js').includes('"font-src \'self\'"'));
});

test('lineup leaves out today (the Tonight band has it), so a special is not said twice', () => {
  const html = week(ctx([special('today', 'magic', '2026-10-30'), special('sun', 'cedh', '2026-11-01')], FRI_1850)).toString();
  const lineup = html.match(/<div class="lineup">[^]*?<\/ul><\/div>/)[0];
  assert.ok(lineup.includes('T-sun') && !lineup.includes('T-today'));
  assert.ok(html.slice(html.indexOf('id="tonight"'), html.indexOf('id="week"')).includes('T-today'));
});

test('admin: the roster title keeps its round-7 size although --t-2xl shrank', () => {
  assert.ok(/\.roster-title \{ font-size: clamp\(2rem, 1\.4rem \+ 2\.6vw, 3\.25rem\);/.test(read('../src/styles/admin.css')));
});
