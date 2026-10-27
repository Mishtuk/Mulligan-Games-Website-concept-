// Event series: recurrence, one-date exceptions, validation, copy text, storage, and the admin API (auth, CSRF, hostile input).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { clean, cleanTemplate, copyText, expand, hasSlot, occurrences, safeUrl, TEMPLATES, validate, validateException, validateTemplate } from '../src/lib/events.js';
import { deleteSeries, getSeries, listExceptions, listSeries, openDb, putException, putSeries, seedSeries } from '../src/db.js';

const S = (o) => ({ id: 't', title: 'Test', game: 'magic', kind: 'weekly', recurrence: { type: 'weekly', day: 5 }, start: '19:00', end: '22:00', fee: 10, signup: 'walkin', ...o });
const dates = (s, a, b, ex) => occurrences(s, a, b, ex).map((o) => o.date);

test('weekly: across the Nov 1 2026 DST change the dates and the time do not move', () => {
  const s = S({ recurrence: { type: 'weekly', day: 0 } });
  assert.deepEqual(dates(s, '2026-10-25', '2026-11-08'), ['2026-10-25', '2026-11-01', '2026-11-08']);
  assert.equal(occurrences(s, '2026-11-01', '2026-11-01')[0].start, '19:00');
});
test('weekly: first and last date bounds', () => {
  const s = S({ recurrence: { type: 'weekly', day: 5, startDate: '2026-10-30', until: '2026-11-13' } });
  assert.deepEqual(dates(s, '2026-01-01', '2027-01-01'), ['2026-10-30', '2026-11-06', '2026-11-13']);
});
test('nth weekday: 2nd, 5th (months without one are skipped) and last', () => {
  assert.deepEqual(dates(S({ recurrence: { type: 'nth', nth: 2, day: 6 } }), '2026-11-01', '2027-01-31'), ['2026-11-14', '2026-12-12', '2027-01-09']);
  assert.deepEqual(dates(S({ recurrence: { type: 'nth', nth: 5, day: 5 } }), '2026-01-01', '2026-12-31'), ['2026-01-30', '2026-05-29', '2026-07-31', '2026-10-30']);
  assert.deepEqual(dates(S({ recurrence: { type: 'nth', nth: -1, day: 5 } }), '2026-01-01', '2026-04-30'), ['2026-01-30', '2026-02-27', '2026-03-27', '2026-04-24']);
  assert.deepEqual(dates(S({ recurrence: { type: 'nth', nth: -1, day: 3 } }), '2026-12-01', '2027-02-28'), ['2026-12-30', '2027-01-27', '2027-02-24']); // year end
});
test('none and dates: per-date start, multi slot day', () => {
  assert.deepEqual(dates(S({ recurrence: { type: 'none', date: '2026-11-07' } }), '2026-11-01', '2026-11-30'), ['2026-11-07']);
  assert.deepEqual(dates(S({ recurrence: { type: 'none', date: '2026-11-07' } }), '2026-12-01', '2026-12-31'), []);
  const s = S({ recurrence: { type: 'dates', dates: [{ date: '2026-11-08', start: '15:00' }, { date: '2026-11-08', start: '17:00' }, { date: '2026-11-06', start: '19:00' }] } });
  assert.deepEqual(expand([s], '2026-11-01', '2026-11-30').map((o) => o.date + ' ' + o.start), ['2026-11-06 19:00', '2026-11-08 15:00', '2026-11-08 17:00']);
});
test('a late end past midnight is kept as typed and reads sensibly', () => {
  assert.match(copyText(S({ end: '00:30' }), '2026-11-06', 'https://x.example'), /starts 7 PM to 12:30 AM/);
});
test('expand skips disabled series and sorts', () => {
  const list = expand([S({ id: 'b', title: 'B', enabled: false }), S({ id: 'c', title: 'C', start: '20:00' }), S({ id: 'a', title: 'A' })], '2026-11-06', '2026-11-06');
  assert.deepEqual(list.map((o) => o.id), ['a', 'c']);
});

test('exceptions: cancel, change time (end follows), capacity, note, move; the series is untouched', () => {
  const s = S({ capacity: 28 }), snapshot = JSON.stringify(s);
  const ex = [
    { series: 't', date: '2026-11-06', type: 'cancel', note: 'Holiday' },
    { series: 't', date: '2026-11-13', type: 'change', start: '20:00', capacity: 16, note: 'Late start', updated: '2026-11-10' },
    { series: 't', date: '2026-11-20', type: 'change', movedTo: '2026-11-21' },
    { series: 'other', date: '2026-11-27', type: 'cancel' },
  ];
  const o = occurrences(s, '2026-11-01', '2026-11-30', ex);
  assert.deepEqual(o.map((x) => x.date), ['2026-11-06', '2026-11-13', '2026-11-21', '2026-11-27']);
  assert.equal(o[0].cancelled, true);
  assert.deepEqual([o[1].start, o[1].end, o[1].capacity, o[1].note, o[1].changed], ['20:00', '23:00', 16, 'Late start', true]);
  assert.deepEqual([o[2].moved, o[2].originalDate, o[2].start], [true, '2026-11-20', '19:00']);
  assert.equal(o[3].cancelled, false);
  assert.equal(JSON.stringify(s), snapshot);
  assert.deepEqual(dates(s, '2026-11-20', '2026-11-20', ex), []); // moved away
  assert.deepEqual(dates(s, '2026-11-21', '2026-11-21', ex), ['2026-11-21']); // moved in
});

test('validation rejects with a message under the field', () => {
  assert.deepEqual(validate(S()), {});
  const bad = validate(S({ title: '  <b></b> ', game: 'chess', kind: 'x', start: '7pm', end: '25:00', fee: -1, capacity: 0, minPlayers: 'a', signup: 'fax', ageNote: 'x'.repeat(70), playStyle: 'brutal', arriveByMins: 7,
    recurrence: { type: 'nth', nth: 6, day: 2 } }));
  for (const k of ['title', 'game', 'kind', 'start', 'end', 'fee', 'capacity', 'minPlayers', 'signup', 'ageNote', 'playStyle', 'arriveByMins', 'recurrence']) assert.ok(bad[k], k);
  assert.ok(validate(S({ recurrence: { type: 'dates', dates: [] } })).recurrence);
  assert.ok(validate(S({ recurrence: { type: 'none', date: '2026-02-30' } })).recurrence);
  assert.ok(validate(S({ recurrence: { type: 'weekly', day: 7 } })).recurrence);
  assert.ok(validate(S({ recurrence: { type: 'weekly', day: 1, startDate: '2026-02-01', until: '2026-01-01' } })).recurrence);
  assert.ok(validate(S({ signup: 'external' })).toolUrl);
  assert.ok(validate(S({ signup: 'external', tool: { name: 'T', url: 'javascript:alert(1)' } })).toolUrl);
  assert.ok(validate(S({ capacity: 4, minPlayers: 8 })).minPlayers);
  assert.deepEqual(validate(S({ beginnerFriendly: true, ageNote: '13 and up', playStyle: 'casual', arriveByMins: 15, signup: 'here', fee: null, end: null })), {});
  assert.ok(validate(null).form);
  assert.match(validate(S({ signup: 'here', doors: '18:55', start: '19:00', arriveByMins: 10 })).arriveByMins, /before the doors open at 6:55 PM/);
  assert.deepEqual(validate(S({ signup: 'here', doors: '18:50', start: '19:00', arriveByMins: 10 })), {});
  assert.ok(validateException({ date: '2026-11-06', type: 'change' }).type); // nothing changed
  assert.ok(validateException({ date: '2026-11-06', type: 'change', movedTo: '2027-06-01' }).movedTo);
  assert.deepEqual(validateException({ date: '2026-11-06', type: 'cancel' }), {});
});

test('safeUrl allows https/http/tel/mailto only', () => {
  for (const u of ['https://topdeck.gg/x', 'http://a.example/', 'tel:+12157893299', 'mailto:a@b.example']) assert.equal(safeUrl(u), u);
  for (const u of ['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'data:text/html,<b>', 'ftp://a.example', 'https://a b.example', 'https://x.example/"onmouseover=1', '//evil.example', 'https://intranet', 5, null]) assert.equal(safeUrl(u), null, String(u));
});

test('clean: tags stripped, javascript: link dropped, unknown fields gone', () => {
  const c = clean(S({ title: '<script>alert(1)</script>Pauper', description: 'a<img src=x onerror=1>b', evil: 'x', tool: { name: 'T<b>', url: 'javascript:alert(1)' } }));
  assert.equal(c.title, 'alert(1)Pauper');
  assert.equal(c.description, 'ab');
  assert.equal(c.evil, undefined);
  assert.deepEqual(c.tool, { name: 'T' });
});

test('copyText: the 15.3 template, examples from the seed, missing values left out', () => {
  const seed = JSON.parse(readFileSync(new URL('../src/content/series.json', import.meta.url), 'utf8'));
  const by = (id) => seed.find((x) => x.id === id), site = 'https://site.example';
  assert.equal(copyText(by('fnm-draft'), '2026-10-30', site), 'Draft FNM\nFriday, October 30, starts 7 PM\nEntry $20\nJust show up. No sign-up needed.\nDetails: https://site.example/events/fnm-draft?date=2026-10-30');
  assert.equal(copyText(by('rb-skirmish'), '2026-11-14', site), 'Riftbound Second Saturday Summoner Skirmish\nSaturday, November 14, doors 11 AM, starts noon\nEntry $10\nSign up online: https://tinyurl.com/RBMulliganGames\nDetails: https://site.example/events/rb-skirmish?date=2026-11-14');
  assert.ok(!copyText(by('tabletop-wed'), '2026-10-28', site).includes('Entry')); // null fee
  const base = 'https://mulligan.example/';
  assert.equal(copyText(S({ fee: 0, signup: 'here' }), '2026-11-06', base), 'Test\nFriday, November 6, starts 7 PM to 10 PM\nFree entry\nSign up on our website to hold a seat.\nDetails and sign-up: https://mulligan.example/events/t?date=2026-11-06');
  const loose = copyText(S({ fee: null, end: null, signup: null, start: null }), '2026-11-06', base);
  assert.equal(loose, 'Test\nFriday, November 6\nDetails: https://mulligan.example/events/t?date=2026-11-06');
  assert.match(copyText(S({ end: '00:30' }), '2026-11-06', base), /starts 7 PM to 12:30 AM/);
  assert.match(copyText(S({ signup: 'counter' }), '2026-11-06', base), /Pre-register at the counter\./);
  assert.match(copyText(S({ inviteOnly: true }), '2026-11-06', base), /Invite only\./);
  const ex = [{ series: 't', date: '2026-11-06', type: 'cancel', note: 'Sick day' }, { series: 't', date: '2026-11-13', type: 'change', start: '19:30' },
    { series: 't', date: '2026-11-20', type: 'change', capacity: 20 }, { series: 't', date: '2026-11-27', type: 'change', movedTo: '2026-11-28', note: 'Day after' }];
  assert.equal(copyText(S(), '2026-11-06', base, ex), 'Cancelled: Test\nFriday, November 6\nSick day\nNext one: Friday, November 13, 7:30 PM\nDetails: https://mulligan.example/events/t?date=2026-11-06');
  assert.match(copyText(S(), '2026-11-13', base, ex), /^Test\nFriday, November 13, starts 7:30 PM to 10:30 PM\nChanged: Starts at 7:30 PM this week \(usually 7 PM\)\.\nEntry \$10/);
  assert.match(copyText(S(), '2026-11-20', base, ex), /\nChanged: Seats changed to 20 for this date\.\n/);
  assert.match(copyText(S(), '2026-11-28', base, ex), /\nChanged: Day after\n/);
  assert.equal(copyText(S(), '2026-11-07', base), null);
  for (const d of ['', 'garbage', '2026-02-30', undefined]) assert.equal(copyText(S(), d, base), null, String(d)); // bad ?date= is a 404, not a throw
  assert.ok(!copyText(S(), '2026-11-06', 'javascript:alert(1)').includes('Details'));
  assert.ok(!/UPDATED|confirmed|Arrive|Beginner/.test(copyText(S({ beginnerFriendly: true, arriveByMins: 10, signup: 'here' }), '2026-11-06', base)));
});

test('arriveByMins gives each date an arrive-by time that follows a changed start; ageNote', () => {
  const s = S({ signup: 'here', arriveByMins: 10 });
  assert.equal(occurrences(s, '2026-11-06', '2026-11-06')[0].arriveBy, '18:50');
  assert.equal(occurrences(s, '2026-11-13', '2026-11-13', [{ series: 't', date: '2026-11-13', type: 'change', start: '20:00' }])[0].arriveBy, '19:50');
  assert.equal(occurrences(S(), '2026-11-06', '2026-11-06')[0].arriveBy, null);
  assert.equal(clean(S({ signup: 'walkin', arriveByMins: 10 })).arriveByMins, null);
  assert.equal(clean(s).arriveByMins, 10);
  assert.ok(validate(S({ arriveByMins: 7 })).arriveByMins);
  assert.ok(validate(S({ ageNote: 'x'.repeat(61) })).ageNote);
  assert.deepEqual(validate(S({ ageNote: '13 and up' })), {});
  assert.equal(clean(S({ ageNote: ' 13  and up ' })).ageNote, '13 and up');
  assert.equal(clean(S({ ageNote: '13 and up', kidsWelcome: true })).ageNote, null);
});

test('storage: seed once, round trip, hostile text stays data, deleting a series removes its exceptions', () => {
  const db = openDb(':memory:');
  seedSeries(db);
  const n = listSeries(db).length;
  assert.ok(n >= 20);
  const evil = S({ id: "x'; DROP TABLE series; --", title: "' OR 1=1 --" });
  putSeries(db, evil);
  putException(db, { series: evil.id, date: '2026-11-06', type: 'cancel', note: "' OR 1=1 --" });
  assert.equal(getSeries(db, evil.id).title, "' OR 1=1 --");
  assert.equal(listExceptions(db, evil.id).length, 1);
  assert.equal(deleteSeries(db, evil.id), true);
  assert.equal(listExceptions(db).length, 0);
  for (const s of listSeries(db)) deleteSeries(db, s.id);
  seedSeries(db); // flagged: not seeded again
  assert.equal(listSeries(db).length, 0);
});

// ---------- admin API over HTTP ----------
const tmp = mkdtempSync(join(tmpdir(), 'mg-ev-'));
const dist = join(tmp, 'dist');
mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, 'index.html'), '<main></main>');
let proc, origin, cookie = '';
before(async () => {
  proc = spawn(process.execPath, ['server.js'], { cwd: join(import.meta.dirname, '..'), env: { ...process.env, PORT: '0', DATA_DIR: join(tmp, 'data'), DIST_DIR: dist, ALLOW_DEFAULT_ADMIN: '1', NODE_ENV: 'test' } });
  proc.stderr.on('data', (d) => process.stderr.write(d));
  const port = await new Promise((ok, no) => { proc.stdout.on('data', (d) => { const m = /\(port (\d+),/.exec(String(d)); if (m) ok(+m[1]); }); proc.on('exit', (c) => no(new Error(`server exited ${c}`))); });
  origin = `http://localhost:${port}`;
  const r = await fetch(`${origin}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ username: 'admin', password: 'admin' }) });
  cookie = r.headers.get('set-cookie').split(';')[0];
});
after(() => proc?.kill());
const api = (method, path, body, headers = { Origin: origin, Cookie: cookie }) => fetch(`${origin}/api/admin/${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
const NEW = { title: 'API Night', game: 'magic', kind: 'weekly', recurrence: { type: 'weekly', day: 2 }, start: '19:00', end: null, fee: 5, beginnerFriendly: true, signup: 'counter', arriveByMins: 15 };

test('API: signed-out is refused; writes without the site origin are refused (CSRF)', async () => {
  for (const [m, p] of [['GET', 'series'], ['POST', 'series'], ['PUT', 'series/pauper'], ['DELETE', 'series/pauper'], ['POST', 'series/pauper/exceptions'], ['GET', 'series/pauper/copy?date=2026-11-04']])
    assert.equal((await api(m, p, m === 'GET' || m === 'DELETE' ? null : NEW, {})).status, 401, `${m} ${p}`);
  for (const h of [{ Cookie: cookie }, { Cookie: cookie, Origin: 'http://evil.example' }]) {
    assert.equal((await api('POST', 'series', NEW, h)).status, 403);
    assert.equal((await api('PUT', 'series/pauper', NEW, h)).status, 403);
    assert.equal((await api('DELETE', 'series/pauper', null, h)).status, 403);
    assert.equal((await api('POST', 'series/pauper/exceptions', { date: '2026-11-04', type: 'cancel' }, h)).status, 403);
  }
  assert.ok((await (await api('GET', 'series')).json()).series.length >= 20); // seeded
});

test('API: create, update, exception, copy text, delete', async () => {
  const c = await api('POST', 'series', NEW);
  assert.equal(c.status, 201);
  const { series } = await c.json();
  assert.equal(series.id, 'api-night');
  assert.equal(series.arriveByMins, 15);
  const u = await api('PUT', 'series/api-night', { ...NEW, fee: 0, ageNote: '8 and up' });
  assert.equal((await u.json()).series.fee, 0);
  assert.equal((await api('POST', 'series/api-night/exceptions', { date: '2026-11-04', type: 'cancel' })).status, 422); // a Wednesday, not an event day
  const ex = await api('POST', 'series/api-night/exceptions', { date: '2026-11-03', type: 'change', start: '20:00', note: 'Late start' });
  assert.equal(ex.status, 200);
  const t = await (await api('GET', 'series/api-night/copy?date=2026-11-03')).json();
  assert.match(t.text, /^API Night\nTuesday, November 3, starts 8 PM\nChanged: Late start\nFree entry\nPre-register at the counter\.\n/);
  assert.match(t.text, /\nDetails: http:\/\/localhost:\d+\/events\/api-night\?date=2026-11-03$/);
  assert.equal((await api('GET', 'series/api-night/copy?date=2026-11-04')).status, 404);
  assert.equal((await api('GET', 'series/api-night/copy?date=nope')).status, 404);
  assert.equal((await api('DELETE', 'series/api-night/exceptions/2026-11-03')).status, 200);
  assert.equal((await api('DELETE', 'series/api-night/exceptions/2026-11-03')).status, 404);
  assert.equal((await api('DELETE', 'series/api-night')).status, 200);
  assert.equal((await api('GET', 'series/api-night')).status, 404);
});

test('API: bad input gets field errors, nothing is stored', async () => {
  const r = await api('POST', 'series', { ...NEW, title: '', game: 'chess', fee: -3, start: 'noon' });
  assert.equal(r.status, 422);
  const { errors } = await r.json();
  assert.ok(errors.title && errors.game && errors.fee && errors.start);
  assert.equal((await api('POST', 'series', [1])).status, 400);
  assert.equal((await api('POST', 'series', { ...NEW, signup: 'external' })).status, 422);
});

test('API: hostile input is stored and returned as inert text', async () => {
  const hostile = { ...NEW, title: "<script>alert(1)</script>' OR 1=1 --", format: '<img src=x onerror=alert(1)>', description: "<script>x</script>'; DROP TABLE series; --",
    signup: 'external', tool: { name: '<b>TopDeck</b>', url: 'javascript:alert(1)' } };
  assert.ok((await (await api('POST', 'series', hostile)).json()).errors.toolUrl); // javascript: link refused
  const ok = await api('POST', 'series', { ...hostile, tool: { name: '<b>TopDeck</b>', url: 'https://topdeck.gg/x?a=1&b=2' } });
  assert.equal(ok.status, 201);
  const { series } = await ok.json();
  assert.ok(!/[<>]/.test(JSON.stringify([series.title, series.format, series.description, series.tool.name])));
  assert.ok(series.title.includes("' OR 1=1 --"));
  assert.ok(series.description.includes('DROP TABLE'));
  const list = await (await api('GET', 'series')).json();
  assert.ok(list.series.length >= 21); // table still there
  await api('POST', `series/${series.id}/exceptions`, { date: '2026-11-03', type: 'cancel', note: "<script>alert(1)</script>' OR 1=1 --" });
  const got = await (await api('GET', `series/${series.id}`)).json();
  assert.ok(!/[<>]/.test(got.exceptions[0].note));
  const copy = (await (await api('GET', `series/${series.id}/copy?date=2026-11-03`)).json()).text;
  assert.ok(!/[<>]/.test(copy));
  assert.equal((await api('DELETE', `series/${series.id}`)).status, 200);
  assert.equal((await api('GET', "series/x'%20OR%201=1")).status, 404);
});

// ---------- templates ----------
test('templates: every built-in is valid and follows the 15.2 defaults; saving strips dates and tags', () => {
  assert.ok(TEMPLATES.length >= 25);
  for (const t of TEMPLATES) {
    assert.deepEqual(validateTemplate({ name: t.name, fields: t.fields }), {}, t.id);
    assert.equal(t.fields.game, t.game);
    assert.equal(t.fields.arriveByMins, undefined, t.id); // store policy is open (Q8)
    if (t.name === 'Learn to play') assert.deepEqual([t.fields.beginnerFriendly, t.fields.kidsWelcome], [true, true], t.id);
    if (t.game === 'cedh' || t.id === 't-rcq') assert.equal(t.fields.playStyle, 'competitive', t.id);
  }
  assert.equal(TEMPLATES.find((t) => t.id === 't-commander').fields.playStyle, 'casual');
  const c = cleanTemplate({ name: ' <b>My</b> night ', fields: { ...S({ title: 'X<i>y</i>' }), recurrence: { type: 'weekly', day: 2, startDate: '2026-11-03', until: '2026-12-01' }, evil: 1 } }, 'u-1');
  assert.equal(c.name, 'My night');
  assert.equal(c.fields.title, 'Xy');
  assert.deepEqual(c.fields.recurrence, { type: 'weekly', day: 2 });
  assert.equal(c.fields.evil, undefined);
  assert.equal(c.fields.id, undefined);
  assert.deepEqual(cleanTemplate({ name: 'p', fields: S({ recurrence: { type: 'dates', dates: [{ date: '', start: '19:00' }] } }) }, 'u-2').fields.recurrence, { type: 'dates', dates: [{ start: '19:00' }] });
  assert.deepEqual(cleanTemplate({ name: 'o', fields: S({ recurrence: { type: 'none', date: '' } }) }, 'u-3').fields.recurrence, { type: 'none' });
});
test('templates: validation errors sit under the same field names as a series', () => {
  assert.ok(validateTemplate(null).form && validateTemplate({ name: 'x' }).form && validateTemplate({ name: 'x', fields: [] }).form);
  assert.ok(validateTemplate({ name: '  <b></b> ', fields: S() }).name);
  const e = validateTemplate({ name: 'x', fields: S({ game: 'chess', fee: -1, signup: 'external', recurrence: { type: 'weekly', day: 9 } }) });
  assert.ok(e.game && e.fee && e.toolUrl && e.recurrence);
  assert.deepEqual(validateTemplate({ name: 'x', fields: S({ title: '', recurrence: { type: 'none' } }) }), {}); // no title or date needed in a template
});

const TPL = { name: 'My Friday', fields: { title: 'Friday Night', game: 'magic', kind: 'weekly', recurrence: { type: 'weekly', day: 5 }, start: '19:00', fee: 5, signup: 'walkin', playStyle: 'casual' } };
test('API templates: signed-out refused, CSRF refused, create / list / delete', async () => {
  for (const [m, p] of [['GET', 'templates'], ['POST', 'templates'], ['DELETE', 'templates/u-x']]) assert.equal((await api(m, p, m === 'POST' ? TPL : null, {})).status, 401, `${m} ${p}`);
  for (const h of [{ Cookie: cookie }, { Cookie: cookie, Origin: 'http://evil.example' }]) {
    assert.equal((await api('POST', 'templates', TPL, h)).status, 403);
    assert.equal((await api('DELETE', 'templates/u-x', null, h)).status, 403);
  }
  const list0 = await (await api('GET', 'templates')).json();
  assert.ok(list0.builtin.length >= 25 && Array.isArray(list0.yours));
  const c = await api('POST', 'templates', TPL);
  assert.equal(c.status, 201);
  const { template } = await c.json();
  assert.match(template.id, /^u-[0-9a-f]{8}$/);
  assert.equal(template.fields.playStyle, 'casual');
  assert.equal((await (await api('GET', 'templates')).json()).yours[0].id, template.id);
  assert.equal((await api('DELETE', `templates/${template.id}`)).status, 200);
  assert.equal((await api('DELETE', `templates/${template.id}`)).status, 404);
  assert.equal((await api('DELETE', 'templates/u-x%27%20OR%201=1')).status, 404);
  assert.equal((await api('POST', 'templates', [1])).status, 400);
  const bad = await api('POST', 'templates', { name: '', fields: { ...TPL.fields, fee: -5 } });
  assert.equal(bad.status, 422);
  const { errors } = await bad.json();
  assert.ok(errors.name && errors.fee);
});
test('API templates: hostile input comes back inert', async () => {
  const evil = { name: "<script>alert(1)</script>' OR 1=1 --", fields: { ...TPL.fields, title: '<img src=x onerror=alert(1)>', description: "'; DROP TABLE kv; --<script>x</script>", tool: { name: '<b>T</b>', url: 'javascript:alert(1)' } } };
  assert.ok((await (await api('POST', 'templates', evil)).json()).errors.toolUrl); // javascript: link refused
  const r = await api('POST', 'templates', { ...evil, fields: { ...evil.fields, tool: { name: '<b>T</b>', url: 'https://topdeck.gg/x?a=1&b=2' } } });
  assert.equal(r.status, 201);
  const { template } = await r.json();
  assert.ok(!/[<>]/.test(JSON.stringify(template)), JSON.stringify(template));
  assert.ok(template.name.includes("' OR 1=1 --") && template.fields.description.includes('DROP TABLE'));
  assert.equal(template.fields.tool.url, 'https://topdeck.gg/x?a=1&b=2');
  assert.ok((await (await api('GET', 'templates')).json()).yours.some((t) => t.id === template.id)); // storage still fine
  await api('DELETE', `templates/${template.id}`);
});
test('API series list: next dates per series, with exceptions applied', async () => {
  const j = await (await api('GET', 'series')).json();
  assert.match(j.today, /^\d{4}-\d\d-\d\d$/);
  const any = j.series.find((s) => s.recurrence.type === 'weekly');
  assert.ok(j.upcoming[any.id].length > 0 && j.upcoming[any.id].length <= 8);
  assert.ok(j.upcoming[any.id].every((o) => o.date >= j.today && 'originalDate' in o && 'cancelled' in o));
});

test('slots (D23): two slots on one day have their own cancel, change and post text', () => {
  const s = S({ id: 'pre', title: 'Prerelease', start: null, end: null, recurrence: { type: 'dates', dates: [{ date: '2026-11-08', start: '15:00' }, { date: '2026-11-08', start: '17:00' }] } });
  const ex = [{ series: 'pre', date: '2026-11-08T15:00', type: 'cancel' }];
  const o = occurrences(s, '2026-11-08', '2026-11-08', ex);
  assert.deepEqual(o.map((x) => [x.slot, x.start, x.cancelled]), [['2026-11-08T15:00', '15:00', true], ['2026-11-08T17:00', '17:00', false]]);
  assert.match(copyText(s, '2026-11-08T15:00', 'https://x.example', ex), /^Cancelled: Prerelease\nSunday, November 8\nNext one: Sunday, November 8, 5 PM\nDetails: https:\/\/x\.example\/events\/pre\?date=2026-11-08T15%3A00$/);
  const t = copyText(s, '2026-11-08T17:00', 'https://x.example', ex);
  assert.match(t, /^Prerelease\nSunday, November 8, starts 5 PM\n/);
  assert.match(t, /date=2026-11-08T17%3A00$/);
  assert.equal(copyText(s, '2026-11-08T18:00', 'https://x.example'), null);
  assert.deepEqual(validateException({ date: '2026-11-08T17:00', type: 'change', start: '18:00' }), {});
  assert.ok(validateException({ date: '2026-11-08T25:00', type: 'cancel' }).date);
  assert.ok(validateException({ date: '2026-11-08T17:00', type: 'change', movedTo: '2027-06-01' }).movedTo);
  assert.equal(hasSlot(s, '2026-11-08T17:00'), true);
  assert.equal(hasSlot(s, '2026-11-08'), false);
  assert.equal(hasSlot(S(), '2026-11-06'), true);
});
