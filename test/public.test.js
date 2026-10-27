// The public pages on the real server: live data without a rebuild (cancel a date, see it on the page, feed and sitemap), and hostile text stays inert.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb, putSeries } from '../src/db.js';

const tmp = mkdtempSync(join(tmpdir(), 'mg-pub-'));
const dist = join(tmp, 'dist'), data = join(tmp, 'data');
const put = (path, body) => { mkdirSync(join(dist, path), { recursive: true }); writeFileSync(join(dist, path, 'index.html'), body); };
const frame = (inner) => `<!doctype html><html><head><!--mg:head--><title>t</title></head><body><!--mg:strip--><p>baked</p><!--/mg:strip-->${inner}</body></html>`;
put('', frame('<main><!--mg:hero--><!--/mg:hero--><!--mg:week--><!--/mg:week--><!--mg:cedh--><!--/mg:cedh--><ul><!--mg:releases--><!--/mg:releases--></ul><!--mg:hours--><!--/mg:hours--></main>'));
put('events', frame('<main><!--mg:events--><!--/mg:events--></main>'));
put('new-here', frame('<main><!--mg:nights--><!--/mg:nights--></main>'));
writeFileSync(join(dist, '404.html'), frame('<main><!--mg:hours--><!--/mg:hours--></main>'));
put('event-page', frame('<main><!--mg:event--><!--/mg:event--></main>'));

const FNM = { id: 'fnm', title: 'Draft FNM', game: 'magic', format: 'Draft', kind: 'weekly', recurrence: { type: 'weekly', day: 5 }, start: '19:00', end: '23:00', fee: 20, signup: 'walkin' };
// Written straight to the database, past clean(), to prove the page escapes by itself (D20).
const EVIL = { id: 'evil', title: '<script>alert(1)</script> "x" \'y\' </script', game: 'other', format: '<img src=x onerror=alert(2)>', kind: 'weekly', recurrence: { type: 'weekly', day: 5 }, start: '20:00', end: null, fee: 5,
  signup: 'external', tool: { name: '<b>T</b>', url: 'javascript:alert(3)', code: '<i>' }, description: '</script><script>alert(4)</script>', prize: '<u>p</u>', ageNote: '<svg onload=alert(5)>', bring: '"><a href=javascript:alert(6)>' };
const PRE = { id: 'pre', title: 'Prerelease', game: 'magic', format: 'Sealed', kind: 'prerelease', recurrence: { type: 'dates', dates: [{ date: '2026-11-08', start: '15:00' }, { date: '2026-11-08', start: '17:00' }] }, end: null, fee: 40, signup: 'walkin' };
const SITE = 'https://mg.example';
let proc, base, origin, cookie = '';
const NOW = '2026-10-26T12:00', DATE = '2026-10-30';

before(async () => {
  const db = openDb(data);
  db.prepare("INSERT INTO kv (key, value) VALUES ('series_seeded', '1')").run();
  putSeries(db, FNM); putSeries(db, EVIL); putSeries(db, PRE);
  db.close();
  proc = spawn(process.execPath, ['server.js'], { cwd: join(import.meta.dirname, '..'), env: { ...process.env, PORT: '0', DATA_DIR: data, DIST_DIR: dist, ALLOW_DEFAULT_ADMIN: '1', NODE_ENV: 'test', PUBLIC_URL: SITE } });
  proc.stderr.on('data', (d) => process.stderr.write(d));
  const port = await new Promise((ok, no) => { proc.stdout.on('data', (d) => { const m = /\(port (\d+),/.exec(String(d)); if (m) ok(+m[1]); }); proc.on('exit', (c) => no(new Error(`server exited ${c}`))); });
  origin = base = `http://localhost:${port}`;
  const r = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ username: 'admin', password: 'admin' }) });
  cookie = r.headers.get('set-cookie').split(';')[0];
});
after(() => { proc?.kill(); try { rmSync(tmp, { recursive: true, force: true }); } catch {} });

const get = (path) => fetch(base + path, { redirect: 'manual' });
const text = async (path) => (await get(path)).text();
const admin = (method, path, body) => fetch(`${base}/api/admin/${path}`, { method, headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie }, body: JSON.stringify(body) });
const page = (id, date) => `/events/${id}?date=${encodeURIComponent(date)}&now=${NOW}`;

test('a date page shows the event, JSON-LD and the date link works', async () => {
  const html = await text(page('fnm', DATE));
  assert.match(html, /<h1 class="ev-title"[^>]*>Draft FNM<\/h1>/);
  assert.ok(html.includes('"eventStatus":"https://schema.org/EventScheduled"') && html.includes('"startDate":"2026-10-30T19:00:00-04:00"'));
  assert.ok(html.includes(`<link rel="canonical" href="${SITE}/events/fnm?date=2026-10-30">`));
  const r = await get(`/events/fnm?now=${NOW}`); // no date: the next date that is not cancelled
  assert.equal(r.status, 302);
  assert.match(r.headers.get('location'), /^\/events\/fnm\?date=2026-10-30/);
  assert.equal((await get(page('fnm', '2026-10-31'))).status, 404); // not a Friday
  assert.equal((await get('/events/nope?date=2026-10-30')).status, 404);
  assert.equal((await get('/event-page/')).status, 404); // the template is not a page
});

test('the 404 page gets the live hours', async () => {
  const res = await get('/no-such-page'), html = await res.text();
  assert.equal(res.status, 404);
  assert.ok(!html.includes('mg:hours') && !html.includes('baked'), 'markers filled');
});
test('bad ids, dates and test clocks give a titled 404, never a 500, a reflection or an off-site redirect; CSP hashes come from the template', async () => {
  for (const d of ['2026-13-45', '2026-13-45T19:00', '2026-02-30', '9999-12-31', '0000-01-01', 'x'.repeat(5000), '<script>alert(7)</script>']) {
    const res = await get(`/events/fnm?date=${encodeURIComponent(d)}`), html = await res.text();
    assert.equal(res.status, 404, d);
    assert.ok(/<title>Event not found \| Mulligan Games<\/title>/.test(html) && html.includes('content="noindex"'), d);
    assert.ok(!html.includes('alert(7)') && !html.includes('xxxxxxxxxx'), d);
    assert.equal((await get(`/events/fnm.ics?date=${encodeURIComponent(d)}`)).status, 404, d);
  }
  for (const p of ['/events//evil.example', '/events/%2F%2Fevil.example', '/events/' + 'a'.repeat(61), '/events/FNM']) {
    const r = await get(p);
    assert.ok(r.status === 404 || !/^\/\/|^https?:/i.test(r.headers.get('location') ?? ''), p);
  }
  assert.equal((await get('/events/fnm?now=2026-99-99T10:00')).status, 302); // a broken test clock is ignored, not a 500
  assert.match((await get('/events/fnm')).headers.get('location'), /^\/events\/fnm\?date=/);
  const csp = (await get(page('fnm', DATE))).headers.get('content-security-policy');
  assert.ok(!/sha256/.test(csp), 'the template has no inline script, so the injected JSON-LD gets no hash');
});

test('cancelling a date from admin shows on its page, the list, the feed and the sitemap without a rebuild', async () => {
  const before = await text(page('fnm', DATE));
  assert.ok(!before.includes('Cancelled.'));
  const r = await admin('POST', `series/fnm/exceptions?now=${NOW}`, { date: DATE, type: 'cancel', note: 'No draft on Halloween weekend.' });
  assert.equal(r.status, 200);
  const html = await text(page('fnm', DATE));
  assert.ok(html.includes('<strong>Cancelled.</strong>') && html.includes('No draft on Halloween weekend.') && html.includes('Updated today.'));
  assert.ok(html.includes('"eventStatus":"https://schema.org/EventCancelled"'));
  assert.ok(html.includes('Next one: Friday, November 6'));
  const other = await text(page('fnm', '2026-11-06')); // "Other dates" strikes the cancelled one; attributes are markup, not escaped text
  assert.ok(other.includes('class="struck"') && !/<[^>]*=&quot;/.test(other));
  const list = await text(`/events/?now=${NOW}`);
  assert.ok(list.includes('data-state="cancelled"') || list.includes('is cancelled.') || list.includes('Cancelled'));
  const front = await text(`/?now=2026-10-30T12:00`);
  assert.ok(front.includes('data-state="cancelled"') && front.includes('No draft on Halloween weekend.'));
  const feed = await get(`/events.ics?now=${NOW}`);
  assert.match(feed.headers.get('content-type'), /text\/calendar/);
  const ics = await feed.text();
  const ev = ics.split('BEGIN:VEVENT').find((e) => e.includes('UID:fnm-20261030@'));
  assert.ok(ev, 'cancelled date still in the feed');
  assert.ok(ev.includes('STATUS:CANCELLED'));
  const one = await get(`/events/fnm.ics?date=${DATE}`);
  assert.match(one.headers.get('content-disposition'), /mulligan-fnm-2026-10-30\.ics/);
  assert.ok((await one.text()).includes('STATUS:CANCELLED'));
  const map = await text(`/sitemap.xml?now=${NOW}`);
  assert.ok(map.includes('<loc>' + SITE + '/</loc>') && map.includes(`/events/fnm?date=${DATE}</loc>`) && map.includes('/events/fnm?date=2026-11-06</loc>') && map.includes('/new-here/'));
  assert.equal((await admin('DELETE', `series/fnm/exceptions/${DATE}`)).status, 200); // bring it back
  assert.ok(!(await text(page('fnm', DATE))).includes('<strong>Cancelled.</strong>'));
});

test('F1: a timed slot can be cancelled and brought back (the key arrives URL-encoded: 15%3A00)', async () => {
  const slot = '2026-11-08T15:00', key = encodeURIComponent(slot);
  assert.equal((await admin('POST', 'series/pre/exceptions', { date: slot, type: 'cancel' })).status, 200);
  assert.ok((await text(page('pre', slot))).includes('<strong>Cancelled.</strong>'));
  assert.equal((await admin('DELETE', `series/pre/exceptions/${key}`)).status, 200, 'bring it back');
  assert.ok(!(await text(page('pre', slot))).includes('<strong>Cancelled.</strong>'));
  assert.equal((await admin('DELETE', `series/pre/exceptions/${key}`)).status, 404, 'nothing left to clear');
  assert.equal((await admin('DELETE', 'series/pre/exceptions/%E0%A4%A')).status, 400, 'malformed %-escape is a 400, not a crash');
});

test('F3: editing a series so a saved cancellation no longer matches asks first; a yes removes it', async () => {
  const slot = '2026-11-08T17:00', cur = (await (await admin('GET', 'series/pre')).json()).series;
  assert.equal((await admin('POST', 'series/pre/exceptions', { date: slot, type: 'cancel' })).status, 200);
  const moved = { ...cur, recurrence: { type: 'dates', dates: [{ date: '2026-11-08', start: '15:00' }, { date: '2026-11-08', start: '17:30' }] } };
  const r = await admin('PUT', 'series/pre', moved);
  assert.equal(r.status, 409);
  const j = await r.json();
  assert.equal(j.error, 'orphans');
  assert.deepEqual(j.orphans.map((x) => x.date), [slot]);
  assert.equal((await (await admin('GET', 'series/pre')).json()).series.recurrence.dates[1].start, '17:00', 'nothing was saved');
  assert.equal((await admin('PUT', 'series/pre', { ...moved, confirmOrphans: true })).status, 200);
  assert.deepEqual((await (await admin('GET', 'series/pre')).json()).exceptions, [], 'orphans removed');
  assert.equal((await admin('PUT', 'series/pre', { ...moved, title: 'Prerelease!' })).status, 200, 'no orphans: no question');
  assert.equal((await admin('PUT', 'series/pre', { ...moved, recurrence: { type: 'dates', dates: [{ date: '2026-11-08', start: '15:00' }, { date: '2026-11-08', start: '15:00' }] } })).status, 422, 'duplicate slot');
  assert.equal((await admin('PUT', 'series/pre', cur)).status, 200);
});

test('hostile titles, links and notes stay inert on every public page and file', async () => {
  const pages = [page('evil', DATE), `/?now=${NOW}`, `/events/?now=${NOW}`, `/events/?now=${NOW}&format=${encodeURIComponent(EVIL.format)}`, `/new-here/?now=${NOW}`];
  for (const p of pages) {
    const res = await get(p), html = await res.text();
    assert.ok(res.status < 400, p);
    assert.ok(!/<script>alert|<img src=x|<svg onload|<b>T<|<u>p<|<a href=javascript|href="javascript:/i.test(html), `inert: ${p}`);
    // every inline script is one we made: the theme line, the JSON-LD, the JSON data
    const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    for (const s of scripts) assert.ok(!/alert\(\d\)/.test(s) || /^\{/.test(s), `script text: ${p}`);
    assert.ok(!/script-src[^;]*unsafe-inline/.test(res.headers.get('content-security-policy')));
  }
  const html = await text(page('evil', DATE));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1];
  assert.ok(!ld.includes('<') && JSON.parse(ld).name === EVIL.title);
  assert.ok(!html.includes('javascript:alert(3)')); // external link with an unsafe URL: no link at all
  const ics = await text(`/events.ics?now=${NOW}`);
  for (const l of ics.split('\r\n')) assert.ok(!/^(BEGIN|END):/.test(l) || /^(BEGIN|END):(VCALENDAR|VEVENT|VTIMEZONE|DAYLIGHT|STANDARD)$/.test(l), l);
});

test('hours are not claimed while unknown: strip says so and no hours table or JSON-LD hours', async () => {
  const html = await text(`/?now=${NOW}`);
  assert.ok(html.includes('Hours coming soon.') && !html.includes('<table class="hours"') && !html.includes('openingHoursSpecification'));
});

test('no TODO reaches a built public page or the New here? source', () => {
  const strip = (s) => s.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const src = strip(readFileSync(join(import.meta.dirname, '..', 'src', 'pages', 'new-here.astro'), 'utf8').split('---').slice(2).join('---'));
  assert.ok(!/TODO/.test(src));
  for (const f of ['index.html', 'events/index.html', 'new-here/index.html']) {
    const p = join(import.meta.dirname, '..', 'dist', f);
    if (existsSync(p)) assert.ok(!/TODO/.test(readFileSync(p, 'utf8')), f);
  }
});

test('editing the store hours in admin changes the open-now strip without a restart', async () => {
  const cur = (await (await fetch(`${base}/api/admin/store`, { headers: { Cookie: cookie } })).json()).store;
  const hours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: '10:00', close: '22:00' }));
  assert.equal((await admin('PUT', 'store', { ...cur, hours })).status, 200);
  assert.ok((await text(`/?now=${NOW}`)).includes('<strong>Open now</strong> till 10 PM'));
  assert.equal((await admin('PUT', 'store', { ...cur, hours: null })).status, 200);
  assert.ok((await text(`/?now=${NOW}`)).includes('Hours coming soon.'));
});

test('round 3: week strip sits in This week, events page has Print and Subscribe, no "?" fee', async () => {
  const home = await text(`/?now=${NOW}`), ev = await text(`/events/?now=${NOW}`);
  assert.ok(/<\/ol><\/nav><nav class="chips"/.test(home), 'the seven-day strip opens This week, right above the game chips');
  assert.ok(ev.includes('id="print-btn"') && ev.includes(`webcal://${new URL(SITE).host}/events.ics`));
  assert.ok(!/class="ev-cost">(?:<span[^>]*>[^<]*<\/span>)?\?/.test(home + ev));
});
