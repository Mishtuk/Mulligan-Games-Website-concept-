// P2.6: results and prizes. Headcount prefill, prize stock moves + reversal + the below-0 refusal, the reminder list, public vs private rendering,
// hostile input, and the admin routes over HTTP (session, same-origin, 404 not 500).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb, putSeries } from '../src/db.js';
import { occurrences } from '../src/lib/events.js';
import * as inv from '../src/lib/inventory.js';
import * as regs from '../src/lib/registrations.js';
import * as res from '../src/lib/results.js';
import { lately } from '../src/lib/render.js';

const NOW = Date.parse('2026-11-07T12:00:00Z'), XSS = '<script>alert(1)</script>', SQLI = "' OR 1=1 --";
const ev = (id, over = {}) => ({ id, title: `Night ${id}`, game: 'magic', kind: 'weekly', recurrence: { type: 'none', date: '2026-11-06' }, start: '19:00', signup: 'here', capacity: 24, tool: { name: 'Wizards EventLink' }, ...over });
const occ = (s) => occurrences(s, '2026-11-01', '2026-11-30', [])[0];
const prod = (db, over = {}) => inv.createProduct(db, { name: 'Prize packs', category: 'sealed', game: 'magic', sku: '', low: 0, enabled: 1, onHand: 5, ...over }, 'admin', NOW);
const mine = (db, p) => db.prepare('SELECT qty, reason, series, slot FROM stock_moves WHERE product = ? ORDER BY id').all(p).map((m) => ({ ...m }));
const body = (over = {}) => ({ winner: 'Sam B.', top: ['Sam B.', 'Alex K.'], headcount: 12, public: false, reported: false, prizes: [], ...over });
const ok = (b) => { const r = res.clean(b); assert.deepEqual(r.errors, {}); return r.clean; };

// ---------- headcount ----------
test('headcount: suggested from check-ins (plus the walk-in tally on walk-in nights), saved value wins, no-shows are read-only', () => {
  const db = openDb(':memory:'), s = ev('a'), o = occ(s);
  regs.walkIn(db, o, { name: 'Pat L' }); regs.walkIn(db, o, { name: 'Lee M' });
  regs.addPreReg(db, o, { name: 'Late Nia', email: 'n@example.com' }); // signed up, never checked in
  const noshow = regs.roster(db, 'a', o.slot).find((r) => r.name === 'Late Nia');
  assert.equal(regs.noShow(db, o, noshow.id).ok, true);
  let g = res.get(db, o);
  assert.deepEqual([g.saved, g.headcount, g.suggested, g.noshows], [false, null, 2, 1]);
  assert.equal(res.save(db, o, ok(body({ headcount: 7 })), 'admin', NOW).ok, true);
  g = res.get(db, o);
  assert.deepEqual([g.saved, g.headcount, g.suggested], [true, 7, 2], 'the staff number is kept; the suggestion is still shown');
  const w = occ(ev('w', { signup: 'walkin' }));
  regs.setHeadcount(db, w, { n: 9 });
  assert.equal(res.get(db, w).suggested, 9);
});

// ---------- prizes and the ledger ----------
test('prize rows write prize moves; changing or removing a row reverses with adjust moves; below 0 refuses everything', () => {
  const db = openDb(':memory:'), o = occ(ev('a')), p = prod(db), q = prod(db, { name: 'Sleeves', onHand: 1 });
  const save = (prizes) => res.save(db, o, ok(body({ prizes })), 'admin', NOW);
  assert.equal(save([{ product: p, qty: 2 }]).ok, true);
  assert.equal(inv.getProduct(db, p).onHand, 3);
  assert.deepEqual(mine(db, p).slice(1), [{ qty: -2, reason: 'prize', series: 'a', slot: o.slot }]);
  assert.equal(save([{ product: p, qty: 3 }]).ok, true); assert.equal(inv.getProduct(db, p).onHand, 2, 'one more');
  assert.equal(save([{ product: p, qty: 1 }]).ok, true); assert.equal(inv.getProduct(db, p).onHand, 4, 'two put back');
  assert.deepEqual(mine(db, p).slice(-1), [{ qty: 2, reason: 'adjust', series: 'a', slot: o.slot }]);
  assert.equal(save([{ product: p, qty: 1 }]).ok, true); assert.equal(mine(db, p).length, 4, 'no change, no move');
  // refused below 0: nothing changes, not even the other rows or the result
  const before = mine(db, p).length, r = save([{ product: p, qty: 1 }, { product: q, qty: 2 }]);
  assert.deepEqual([r.ok, r.error, r.product, r.onHand], [false, 'short', q, 1]);
  assert.equal(mine(db, p).length, before); assert.equal(inv.getProduct(db, q).onHand, 1);
  assert.deepEqual(res.get(db, o).prizes.map((x) => [x.product, x.qty]), [[p, 1]]);
  // swap one product for another in one save (the return goes first)
  assert.equal(save([{ product: q, qty: 1 }]).ok, true);
  assert.deepEqual([inv.getProduct(db, p).onHand, inv.getProduct(db, q).onHand], [5, 0]);
  assert.equal(save([]).ok, true); assert.equal(inv.getProduct(db, q).onHand, 1, 'removing the row puts it back');
  assert.equal(save([{ product: 999, qty: 1 }]).error, 'not_found');
  // field checks
  for (const bad of [[{ product: p, qty: 0 }], [{ product: p, qty: 1.5 }], [{ product: p, qty: 1 }, { product: p, qty: 1 }], [{ product: 'x', qty: 1 }], 'x', Array(21).fill({ product: p, qty: 1 })]) assert.ok(res.clean(body({ prizes: bad })).errors.prizes, JSON.stringify(bad).slice(0, 40));
});
test('deleting a product also drops its prize rows', () => {
  const db = openDb(':memory:'), o = occ(ev('a')), p = prod(db);
  res.save(db, o, ok(body({ prizes: [{ product: p, qty: 1 }] })), 'admin', NOW);
  assert.equal(inv.deleteProduct(db, p).ok, true);
  assert.deepEqual(res.get(db, o).prizes, []);
});

// ---------- field checks ----------
test('field checks: numbers, name lengths, top list, switches, "Show" needs a winner', () => {
  const e = (b) => Object.keys(res.clean(b).errors).sort();
  assert.deepEqual(e(body()), []);
  assert.deepEqual(e(body({ headcount: -1 })), ['headcount']); assert.deepEqual(e(body({ headcount: 'x' })), ['headcount']); assert.deepEqual(e(body({ headcount: 10000 })), ['headcount']);
  assert.equal(res.clean(body({ headcount: '' })).clean.headcount, null);
  assert.deepEqual(e(body({ winner: 'x'.repeat(61) })), ['winner']);
  assert.deepEqual(e(body({ top: 'Sam' })), ['top']); assert.deepEqual(e(body({ top: Array(9).fill('A') })), ['top']); assert.deepEqual(e(body({ top: ['y'.repeat(61)] })), ['top']);
  assert.deepEqual(res.clean(body({ top: ['A', '  ', '', 'B'] })).clean.top, ['A', 'B'], 'blank places are dropped');
  assert.deepEqual(e(body({ public: 'yes' })), ['public']); assert.deepEqual(e(body({ public: true, winner: '' })), ['winner']);
  assert.deepEqual(e(null), ['form']); assert.deepEqual(e([]), ['form']);
});

// ---------- the reminder list ----------
test('reminders: past dates in the last 14 days with no result, or not reported to their tool; cancelled, older and today are left out', () => {
  const db = openDb(':memory:'), series = [ev('fnm', { recurrence: { type: 'weekly', day: 5 } }), ev('home', { title: 'House night', tool: null, recurrence: { type: 'weekly', day: 5 } }), ev('hidden', { enabled: false, recurrence: { type: 'weekly', day: 5 } })];
  const exceptions = [{ series: 'fnm', date: '2026-10-30', type: 'cancel' }];
  const list = (today = '2026-11-07') => res.pending(db, series, exceptions, today).map((x) => `${x.series} ${x.date} ${x.state}`);
  assert.deepEqual(list(), ['home 2026-11-06 missing', 'fnm 2026-11-06 missing', 'home 2026-10-30 missing'], 'cancelled 10-30 skipped; hidden series skipped');
  assert.deepEqual(list('2026-11-06'), ['home 2026-10-30 missing', 'home 2026-10-23 missing', 'fnm 2026-10-23 missing'], 'today itself is not "past"; the cancelled one stays out');
  const fnm = occurrences(series[0], '2026-11-06', '2026-11-06', exceptions)[0], home = occurrences(series[1], '2026-11-06', '2026-11-06', exceptions)[0];
  res.save(db, fnm, ok(body({ reported: false })), 'a', NOW);
  res.save(db, home, ok(body({ reported: false })), 'a', NOW);
  assert.deepEqual(list(), ['fnm 2026-11-06 unreported', 'home 2026-10-30 missing'], 'a result with no tool never needs the tick');
  res.save(db, fnm, ok(body({ reported: true })), 'a', NOW);
  assert.deepEqual(list(), ['home 2026-10-30 missing']);
  assert.ok(!list('2026-11-30').some((x) => x.includes('2026-11-06') || x.includes('2026-10-30')), 'older than 14 days drops off');
});

// ---------- public vs private ----------
test('public side: only "Show" results with a winner; last four, newest first; notes, credit and prizes never leave admin; names escaped', () => {
  const db = openDb(':memory:'), ids = ['a', 'b', 'c', 'd', 'e'];
  const series = ids.map((id, i) => ev(id, { recurrence: { type: 'none', date: `2026-11-0${i + 1}` } }));
  series.forEach((s, i) => res.save(db, occ(s), ok(body({ winner: i === 0 ? XSS : `Winner ${s.id}`, top: i === 1 ? [] : ['Winner ' + s.id, i === 0 ? SQLI : 'Second'], headcount: i === 2 ? 1 : 10 + i, public: i !== 3, notes: 'SECRET NOTE', creditNote: 'SECRET CREDIT' })), 'a', NOW));
  const ctx = { series, now: { ymd: '2026-11-07' }, keepNow: null, results: { recent: () => res.publicRecent(db), one: (s, sl) => res.publicOne(db, s, sl) } };
  const html = String(lately(ctx));
  assert.ok(html.includes('Lately at the shop'));
  assert.equal((html.match(/<li>/g) || []).length, 4, 'at most four');
  assert.ok(html.indexOf('Winner e') < html.indexOf('Winner c') && html.indexOf('Winner c') < html.indexOf('Winner b'), 'newest first');
  assert.ok(!html.includes('Winner d'), 'a result without the Show tick stays private');
  assert.ok(html.includes('1 player') && html.includes('14 players'));
  assert.ok(!html.includes('SECRET') && !html.includes('<script>'), 'escaped, no private fields');
  const first = String(lately({ ...ctx, series: series.slice(0, 1), results: { recent: () => res.publicRecent(db).filter((r) => r.series === 'a') } }));
  assert.ok(first.includes('&lt;script&gt;alert(1)&lt;/script&gt;') && first.includes('&#39; OR 1=1 --'));
  assert.equal(String(lately({ ...ctx, results: { recent: () => [] } })), '', 'nothing to show: no heading');
  assert.equal(String(lately({ ...ctx, now: { ymd: '2026-11-01' } })).includes('Winner e'), false, 'never a future date');
  assert.equal(String(lately({ ...ctx, series: series.map((s) => ({ ...s, enabled: false })) })), '', 'a hidden event shows nothing');
  assert.equal(res.publicOne(db, 'd', occ(series[3]).slot), undefined, 'the event page asks the same filter');
});

// ---------- the admin screen builds its DOM with textContent ----------
test('the results screen uses DOM calls only (no HTML-string APIs) and its reminder opens a list', () => {
  const src = readFileSync(new URL('../src/pages/admin.astro', import.meta.url), 'utf8'), at = src.indexOf('// ----- Results and prizes (P2.6'), part = src.slice(at, src.indexOf('// ----- Today:'));
  assert.ok(at > 0 && part.length > 1000);
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|set:html/.test(part));
  assert.ok(src.includes('Enter results') && src.includes('Show these results on the website') && src.includes('Reported to ${tool}'));
});

// ---------- over HTTP ----------
const tmp = mkdtempSync(join(tmpdir(), 'mg-res-')), dist = join(tmp, 'dist'), data = join(tmp, 'data');
const NOWQ = 'now=2026-11-07T12:00';
let proc, origin, cookie = '', boosters;
before(async () => {
  mkdirSync(join(dist, 'admin'), { recursive: true }); mkdirSync(join(dist, 'event-page'), { recursive: true });
  writeFileSync(join(dist, 'index.html'), '<main>home<!--mg:lately--><!--/mg:lately--></main>'); writeFileSync(join(dist, 'admin', 'index.html'), '<p>admin</p>');
  writeFileSync(join(dist, 'event-page', 'index.html'), '<html><head><!--mg:head--></head><body><main><!--mg:event--></main></body></html>');
  const db = openDb(data);
  db.prepare("INSERT INTO kv (key, value) VALUES ('series_seeded', '1')").run();
  putSeries(db, ev('fnm', { title: 'Friday Night Magic', recurrence: { type: 'weekly', day: 5 } }));
  boosters = prod(db, { name: 'Draft boosters', onHand: 5 });
  db.close();
  proc = spawn(process.execPath, ['server.js'], { cwd: join(import.meta.dirname, '..'), env: { ...process.env, PORT: '0', DATA_DIR: data, DIST_DIR: dist, ALLOW_DEFAULT_ADMIN: '1', NODE_ENV: 'test' } });
  proc.stderr.on('data', (d) => process.stderr.write(d));
  const port = await new Promise((okk, no) => { proc.stdout.on('data', (d) => { const m = /\(port (\d+),/.exec(String(d)); if (m) okk(+m[1]); }); proc.on('exit', (c) => no(new Error(`server exited ${c}`))); });
  origin = `http://localhost:${port}`;
  const r = await fetch(`${origin}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ username: 'admin', password: 'admin' }) });
  cookie = r.headers.get('set-cookie').split(';')[0];
});
after(() => { proc?.kill(); try { rmSync(tmp, { recursive: true, force: true }); } catch {} });
const call = (method, path, b, headers = { Origin: origin, Cookie: cookie }) => fetch(`${origin}/api/admin/${path}${path.includes('?') ? '&' : '?'}${NOWQ}`, { method, headers: { ...(b ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: b ? JSON.stringify(b) : undefined });
const j = async (method, path, b) => { const r = await call(method, path, b); return { status: r.status, ...(await r.json()) }; };
const R = 'roster/fnm/2026-11-06/results', onHand = async () => (await j('GET', 'inventory')).products.find((p) => p.id === boosters).onHand;
const page = async (path) => (await fetch(`${origin}${path}${path.includes('?') ? '&' : '?'}${NOWQ}`)).text();

test('HTTP: signed out is 401, a write without the site origin is 403', async () => {
  assert.equal((await call('GET', R, null, {})).status, 401);
  assert.equal((await call('GET', 'results/pending', null, {})).status, 401);
  assert.equal((await call('PUT', R, body(), { Cookie: cookie })).status, 403);
  assert.equal((await call('PUT', R, body(), { Cookie: cookie, Origin: 'http://evil.example' })).status, 403);
  assert.equal((await call('PUT', R, body(), {})).status, 401);
});
test('HTTP: unknown series or slot is 404, a future or malformed one is refused, bodies are checked (never 500)', async () => {
  assert.equal((await call('GET', 'roster/nope/2026-11-06/results')).status, 404);
  assert.equal((await call('PUT', 'roster/fnm/2026-11-05/results', body())).status, 404, 'not a Friday');
  assert.equal((await call('GET', `roster/${encodeURIComponent(SQLI)}/2026-11-06/results`)).status, 404);
  assert.equal((await call('PUT', 'roster/fnm/2026-11-13/results', body())).status, 422, 'a date that has not happened');
  for (const b of [null, [], 'x', { top: 'x' }, { headcount: -3 }, { public: true }, { prizes: [{ product: 'a', qty: 1 }] }, { reported: 1 }]) {
    const r = await call('PUT', R, b); assert.equal(r.status, 422, JSON.stringify(b)); await r.json();
  }
  const huge = await call('PUT', R, { notes: 'x'.repeat(9000) }); assert.equal(huge.status, 413, 'the 8 KB roster body cap answers, not a crash');
});
test('HTTP: pre-fill, save, prize moves and their reversal, the below-0 refusal, and the reminder list', async () => {
  assert.deepEqual((await j('GET', 'results/pending')).pending.map((x) => `${x.date} ${x.state}`), ['2026-11-06 missing', '2026-10-30 missing']);
  assert.equal((await call('POST', `${R.replace('/results', '')}/walkin`, { name: 'Sam B' })).status, 200);
  const g = await j('GET', R);
  assert.deepEqual([g.results.saved, g.results.suggested, g.results.toolName], [false, 1, 'Wizards EventLink']);
  assert.ok(g.products.some((p) => p.id === boosters && p.onHand === 5));
  const put = (prizes, over = {}) => j('PUT', R, body({ prizes, ...over }));
  let r = await put([{ product: boosters, qty: 2 }], { headcount: 12 });
  assert.equal(r.status, 200); assert.equal(r.results.headcount, 12); assert.equal(await onHand(), 3);
  assert.equal((await put([{ product: boosters, qty: 1 }])).status, 200); assert.equal(await onHand(), 4, 'edit puts one back');
  r = await put([{ product: boosters, qty: 9 }]);
  assert.equal(r.status, 422); assert.equal(r.error, 'short'); assert.match(r.message, /Only 4 of Draft boosters on hand/);
  assert.equal(await onHand(), 4, 'refused: no move'); assert.deepEqual((await j('GET', R)).results.prizes.map((x) => x.qty), [1], 'refused: result not changed either');
  assert.equal((await put([{ product: 999, qty: 1 }])).status, 404);
  assert.equal((await put([])).status, 200); assert.equal(await onHand(), 5, 'removing the row reverses it');
  // reminders: reported unticked -> "unreported"; ticking clears it; the other Friday is still missing
  assert.deepEqual((await j('GET', 'results/pending')).pending.map((x) => `${x.date} ${x.state}`), ['2026-11-06 unreported', '2026-10-30 missing']);
  assert.equal((await put([], { reported: true })).status, 200);
  assert.deepEqual((await j('GET', 'results/pending')).pending.map((x) => `${x.date} ${x.state}`), ['2026-10-30 missing']);
});
test('HTTP: public pages show a result only after staff tick Show; notes and credit stay private', async () => {
  const put = (over) => j('PUT', R, body({ notes: 'SECRET NOTE', creditNote: 'SECRET CREDIT', reported: true, ...over }));
  await put({ public: false });
  for (const p of ['/', '/events/fnm?date=2026-11-06']) { const t = await page(p); assert.ok(!t.includes('Sam B.') && !t.includes('Lately at the shop') && !/>Results</.test(t), p); }
  assert.equal((await put({ public: true })).status, 200);
  const home = await page('/'), ev6 = await page('/events/fnm?date=2026-11-06');
  assert.ok(home.includes('Lately at the shop') && home.includes('Friday Night Magic') && home.includes('Won by <strong>Sam B.</strong>') && home.includes('12 players'), home);
  assert.ok(ev6.includes('>Results<') && ev6.includes('Won by <strong>Sam B.</strong>') && ev6.includes('Alex K.'), 'the date page shows it too');
  for (const t of [home, ev6, JSON.stringify(await (await fetch(`${origin}/api/signup`)).text().catch(() => ''))]) assert.ok(!t.includes('SECRET'), 'notes and credit are admin-only');
  assert.ok(!(await page('/events/fnm?date=2026-10-30')).includes('Won by'), 'another date has no result');
});
test('HTTP: hostile text comes back as the same JSON string and is escaped in the HTML', async () => {
  const r = await j('PUT', R, body({ winner: XSS, top: [SQLI, XSS], notes: XSS, creditNote: SQLI, public: true }));
  assert.equal(r.status, 200); assert.equal(r.results.winner, XSS); assert.deepEqual(r.results.top, [SQLI, XSS]); assert.equal(r.results.creditNote, SQLI);
  for (const p of ['/', '/events/fnm?date=2026-11-06']) {
    const t = await page(p);
    assert.ok(!t.includes('<script>alert(1)</script>'), p);
    assert.ok(t.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), p);
  }
  assert.ok((await page('/')).includes('&#39; OR 1=1 --'));
  assert.equal((await j('GET', R)).results.winner, XSS, 'stored as text, not run');
  assert.equal((await j('GET', 'inventory')).products.length, 1, 'no SQL ran');
});
test('HTTP: a cancelled date takes no results', async () => {
  const x = await call('POST', 'series/fnm/exceptions', { date: '2026-10-30', type: 'cancel' });
  assert.equal(x.status, 200); await x.json();
  assert.equal((await call('PUT', 'roster/fnm/2026-10-30/results', body())).status, 409);
  assert.deepEqual((await j('GET', 'results/pending')).pending.map((p) => p.date), ['2026-11-06'], 'and it is off the reminder list (the last test left 11-06 unreported)');
});
