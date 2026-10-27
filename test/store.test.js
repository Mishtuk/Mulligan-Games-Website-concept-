// Store facts (P2.3b): validation, storage, the admin API (auth, CSRF, caps), and live public pages without a restart (strip, hours, footer, JSON-LD, .ics, room photo).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { clean, validate } from '../src/lib/store.js';
import { getStore, openDb, putSeries, putStore, seedStore } from '../src/db.js';
import seed from '../src/content/store.json' with { type: 'json' };

const week = (f) => [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, ...f(day) }));
const GOOD = { address: { street: '445 York Rd', city: 'Warminster', region: 'PA', zip: '18974' }, phone: '215-789-3299', email: '', tagline: '', freePlay: 'Free Play All Day', parking: '', kids: '', hours: null, hourOverrides: [],
  links: { facebook: 'https://www.facebook.com/x', discord: '' }, photo: null, photoAlt: '' };

// ---------- pure: validation and cleaning ----------
test('validate: a good body passes, hours may be "not set yet" (null)', () => {
  assert.deepEqual(validate(GOOD), {});
  assert.equal(clean(GOOD, seed).hours, null);
  assert.deepEqual(validate('x'), { form: validate('x').form });
});
test('validate: rejects with a plain message per field', () => {
  const bad = { ...GOOD, address: { street: '', city: '', region: 'Penn', zip: '1897' }, phone: '555', email: 'a b', links: { facebook: 'javascript:alert(1)', discord: 'ftp://x.example/a', x: "https://x.example/'><b>" },
    freePlay: 'x'.repeat(121), photo: '../../etc/passwd' };
  const e = validate(bad);
  for (const k of ['address.street', 'address.city', 'address.region', 'address.zip', 'phone', 'email', 'links.facebook', 'links.discord', 'links.x', 'freePlay', 'photo']) assert.ok(e[k] && !/undefined/.test(e[k]), k);
  assert.match(e.phone, /10-digit/);
  assert.ok(validate({ ...GOOD, photo: 'room.webp' }).photoAlt, 'a picture needs a description');
  assert.deepEqual(validate({ ...GOOD, photo: 'room.webp', photoAlt: 'Tables' }), {});
});
test('validate: hours need all 7 days, times or Closed, and open != close; overnight and midnight closes are fine', () => {
  assert.ok(validate({ ...GOOD, hours: [] }).hours);
  assert.ok(validate({ ...GOOD, hours: week((d) => ({ day: d === 6 ? 5 : d, closed: true })) }).hours, 'duplicate day');
  assert.match(validate({ ...GOOD, hours: week((d) => (d === 3 ? { open: '', close: '' } : { closed: true })) })['hours.3'], /closed/i);
  assert.match(validate({ ...GOOD, hours: week((d) => (d === 3 ? { open: '10:00', close: '10:00' } : { closed: true })) })['hours.3'], /same/);
  assert.ok(validate({ ...GOOD, hours: week(() => ({ open: '25:00', close: '22:00' })) })['hours.0']);
  const ok = week((d) => (d === 1 ? { closed: true } : d === 5 ? { open: '14:00', close: '24:00' } : d === 6 ? { open: '14:00', close: '02:00' } : { open: '14:00', close: '22:00' }));
  assert.deepEqual(validate({ ...GOOD, hours: ok }), {});
  assert.deepEqual(clean({ ...GOOD, hours: [...ok].reverse() }, seed).hours.map((r) => r.day), [0, 1, 2, 3, 4, 5, 6]);
});
test('validate: special days need a date, closed or hours, no duplicates; closed / special hours / note are kept', () => {
  const o = (x) => validate({ ...GOOD, hourOverrides: x });
  assert.ok(o([{ closed: true }])['hourOverrides.0.date']);
  assert.ok(o([{ date: '2026-02-30', closed: true }])['hourOverrides.0.date']);
  assert.ok(o([{ date: '2026-11-26', closed: true }, { date: '2026-11-26', closed: true }])['hourOverrides.1.date']);
  assert.ok(o([{ date: '2026-11-26' }])['hourOverrides.0']);
  assert.ok(o([{ date: '2026-11-26', open: '10:00', close: '10:00' }])['hourOverrides.0']);
  assert.ok(o([{ date: '2026-11-26', closed: true, note: 'x'.repeat(121) }])['hourOverrides.0.note']);
  assert.ok(o(Array.from({ length: 61 }, (_, i) => ({ date: `2027-01-${String(i % 28 + 1).padStart(2, '0')}`, closed: true }))).hourOverrides);
  const c = clean({ ...GOOD, hourOverrides: [{ date: '2026-12-25', closed: true, note: 'Merry <b>Christmas</b>' }, { date: '2026-11-01', open: '10:00', close: '22:00', note: 'cEDH day' }] }, seed).hourOverrides;
  assert.deepEqual(c, [{ date: '2026-11-01', open: '10:00', close: '22:00', note: 'cEDH day' }, { date: '2026-12-25', closed: true, note: 'Merry Christmas' }]);
});
test('clean: phone is formatted, the tel link is built from it, a bad link can never be stored, tags are stripped', () => {
  const c = clean({ ...GOOD, phone: '1 (215) 789-3299', parking: '<script>alert(1)</script>Behind the shop', links: { facebook: 'javascript:alert(1)', x: 'https://x.com/MG' } }, seed);
  assert.equal(c.phone, '(215) 789-3299');
  assert.equal(c.phoneHref, 'tel:+12157893299');
  assert.equal(c.parking, 'alert(1)Behind the shop');
  assert.equal(c.links.facebook, null);
  assert.equal(c.links.x, 'https://x.com/MG');
  assert.equal(c.name, 'Mulligan Games');
});

// ---------- the database ----------
test('seedStore: copies store.json once, edits stay, hours stay null (owner Q2)', () => {
  const db = openDb(':memory:');
  seedStore(db);
  assert.equal(getStore(db).hours, null);
  assert.equal(getStore(db).address.street, '445 York Rd');
  putStore(db, { ...getStore(db), parking: 'Changed' });
  seedStore(db); // a restart does not put the file back
  assert.equal(getStore(db).parking, 'Changed');
  assert.equal(seed.hours, null);
});

// ---------- over HTTP ----------
const tmp = mkdtempSync(join(tmpdir(), 'mg-store-'));
const dist = join(tmp, 'dist'), data = join(tmp, 'data');
const put = (path, body) => { mkdirSync(join(dist, path), { recursive: true }); writeFileSync(join(dist, path, 'index.html'), body); };
const frame = (inner) => `<!doctype html><html><head><!--mg:head--><title>t</title><meta property="og:image" content="<!--mg:origin-->http://baked.example<!--/mg:origin-->/i.jpg"><!--mg:shop-ld--></head><body><!--mg:strip--><p>baked</p><!--/mg:strip--><div class="openbar"><!--mg:bar--><p>baked bar</p><!--/mg:bar--></div>${inner}<footer><!--mg:foot-addr--><p>baked foot</p><!--/mg:foot-addr--><ul><!--mg:socials--><!--/mg:socials--></ul></footer></body></html>`;
put('', frame('<main><!--mg:hero--><!--/mg:hero--><dl><!--mg:cedh-live--><!--/mg:cedh-live--></dl><section><!--mg:visit--><div>baked visit</div><!--/mg:visit--></section><div><!--mg:discord--><!--/mg:discord--></div></main>'));
put('events', frame('<main><!--mg:events-->PLACEHOLDER<!--/mg:events--></main>'));
put('new-here', frame('<main><ul><!--mg:nh-toc--><!--/mg:nh-toc--></ul><!--mg:nh-free--><!--/mg:nh-free--><!--mg:nh-kids--><!--/mg:nh-kids--><!--mg:nh-here--><!--/mg:nh-here--><!--mg:nh-directions--><a href="old">baked old directions</a><!--/mg:nh-directions--><!--mg:nh-ask--><!--/mg:nh-ask--></main>'));
put('event-page', frame('<main><!--mg:event--><!--/mg:event--></main>'));
mkdirSync(join(dist, 'media', 'photos'), { recursive: true });
writeFileSync(join(dist, 'media', 'photos', 'room-a.webp'), 'x');
writeFileSync(join(dist, 'media', 'photos', 'room-a-800.webp'), 'x'); // a thumbnail: on disk, but not a pickable picture
const SITE = 'https://mg.example', NOW = '2026-10-26T12:00'; // a Monday
let proc, origin, cookie = '';
before(async () => {
  const db = openDb(data);
  db.prepare("INSERT INTO kv (key, value) VALUES ('series_seeded', '1')").run();
  putSeries(db, { id: 'fnm', title: 'Draft FNM', game: 'magic', kind: 'weekly', recurrence: { type: 'weekly', day: 5 }, start: '19:00', end: '23:00', fee: 20, signup: 'walkin' });
  db.close();
  proc = spawn(process.execPath, ['server.js'], { cwd: join(import.meta.dirname, '..'), env: { ...process.env, PORT: '0', DATA_DIR: data, DIST_DIR: dist, ALLOW_DEFAULT_ADMIN: '1', NODE_ENV: 'test', PUBLIC_URL: SITE } });
  proc.stderr.on('data', (d) => process.stderr.write(d));
  const port = await new Promise((ok, no) => { proc.stdout.on('data', (d) => { const m = /\(port (\d+),/.exec(String(d)); if (m) ok(+m[1]); }); proc.on('exit', (c) => no(new Error(`server exited ${c}`))); });
  origin = `http://localhost:${port}`;
  const r = await fetch(`${origin}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ username: 'admin', password: 'admin' }) });
  cookie = r.headers.get('set-cookie').split(';')[0];
});
after(() => { proc?.kill(); try { rmSync(tmp, { recursive: true, force: true }); } catch {} });
const api = (method, path, body, headers = { Origin: origin, Cookie: cookie }) => fetch(`${origin}/api/admin/${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
const text = async (path) => (await fetch(origin + path)).text();
const save = async (patch) => { const cur = (await (await api('GET', 'store')).json()).store; return api('PUT', `store?now=${NOW}`, { ...cur, ...patch }); }; // the test clock (B4: special days before today are dropped on save)
const HOURS = week((d) => (d === 1 ? { closed: true } : d === 5 ? { open: '14:00', close: '02:00' } : { open: '10:00', close: '17:00' }));

test('API: signed-out is refused, writes without the site origin are refused (CSRF), GET needs a session', async () => {
  assert.equal((await api('GET', 'store', null, {})).status, 401);
  assert.equal((await api('PUT', 'store', GOOD, {})).status, 401);
  for (const h of [{ Cookie: cookie }, { Cookie: cookie, Origin: 'http://evil.example' }]) assert.equal((await api('PUT', 'store', GOOD, h)).status, 403);
  const r = await api('GET', 'store');
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.store.hours, null);
  assert.ok(j.links.some(([k]) => k === 'discord'));
});
test('API: bad bodies are refused with per-field errors and nothing is saved; body size is capped', async () => {
  const before = JSON.stringify((await (await api('GET', 'store')).json()).store);
  const r = await api('PUT', 'store', { ...GOOD, phone: '12', links: { facebook: 'javascript:alert(1)' }, hours: week(() => ({ open: '', close: '' })) });
  assert.equal(r.status, 422);
  const { errors } = await r.json();
  assert.ok(errors.phone && errors['links.facebook'] && errors['hours.0']);
  for (const body of [[], 'x', null]) assert.equal((await fetch(`${origin}/api/admin/store`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie }, body: JSON.stringify(body) })).status, 400);
  assert.equal((await api('PUT', 'store', { ...GOOD, parking: 'x'.repeat(40 * 1024) })).status, 400); // over the store body cap
  assert.equal((await api('PUT', 'store', { ...GOOD, parking: 'x'.repeat(300 * 1024) })).status, 413); // over the HTTP cap
  assert.equal(JSON.stringify((await (await api('GET', 'store')).json()).store), before);
  assert.equal((await api('PUT', 'store', { ...GOOD, photo: 'nope.webp', photoAlt: 'x' })).status, 422); // a picture that is not on the site
  assert.equal((await api('PUT', 'store', { ...GOOD, photo: 'room-a-800.webp', photoAlt: 'x' })).status, 422); // only pictures the picker offers
  assert.equal((await api('DELETE', 'store')).status, 404);
});
test('hours not set: the strip says so and nothing claims hours; JSON-LD has no opening hours', async () => {
  const html = await text(`/?now=${NOW}`);
  assert.ok(html.includes('Hours coming soon.') && !html.includes('openingHoursSpecification'));
});
test('editing hours shows on the strip, hero, hours table and JSON-LD at once, with no restart; overnight and midnight closes', async () => {
  const r = await save({ hours: HOURS });
  assert.equal(r.status, 200);
  const TUE = '2026-10-27T12:00', home = await text(`/?now=${TUE}`);
  assert.ok(home.includes('<strong>Open now</strong> till 5 PM'));
  assert.ok(!home.includes('Hours coming soon.') && /"openingHoursSpecification":\[/.test(home) && /"opens":"14:00","closes":"02:00"|"closes":"02:00"/.test(home));
  assert.ok((await text(`/?now=2026-10-26T18:00`)).includes('<strong>Closed today.</strong> Opens tomorrow at 10 AM'), 'Monday is closed all day');
  assert.ok((await text(`/?now=2026-10-31T01:00`)).includes('<strong>Open now</strong> till 2 AM'), 'Friday night runs past midnight into Saturday');
  assert.ok((await text(`/?now=2026-10-31T02:00`)).includes('<strong>Closed now.</strong>'));
  assert.ok(home.includes('<table class="hours"') && home.includes('2 AM'));
  await save({ hours: week((d) => ({ open: '12:00', close: '00:00' })) }); // typed as midnight in the time box
  assert.ok((await text(`/?now=${TUE}`)).includes('<strong>Open now</strong> till midnight'));
  await save({ hours: HOURS });
});
test('holiday and special-hours overrides win over the weekly row and show their note; removing them restores the week', async () => {
  const r = await save({ hours: HOURS, hourOverrides: [{ date: '2026-10-27', closed: true, note: 'Staff day' }, { date: '2026-10-28', open: '12:00', close: '20:00', note: 'Opening late for a release' }] });
  assert.equal(r.status, 200);
  const closed = await text(`/?now=2026-10-27T11:00`);
  assert.ok(closed.includes('<strong>Closed today.</strong>') && closed.includes('Staff day'));
  const special = await text(`/?now=2026-10-28T11:00`);
  assert.ok(special.includes('<strong>Closed now.</strong> Opens at noon') && special.includes('Opening late for a release'));
  assert.ok((await text(`/?now=2026-10-28T13:00`)).includes('<strong>Open now</strong> till 8 PM'));
  await save({ hourOverrides: [] });
  assert.ok((await text(`/?now=2026-10-27T11:00`)).includes('<strong>Open now</strong> till 5 PM'));
});
test('og:image takes the server PUBLIC_URL, not the build-time site', async () => {
  const t = await text('/');
  assert.ok(t.includes(`content="${SITE}/i.jpg"`) && !t.includes('baked.example'));
});
test('F4 + B1: hours not set and a special day: /events/ still renders, the front page never says "Closed this week"', async () => {
  const ov = [{ date: '2026-11-26', closed: true, note: 'Closed for Thanksgiving' }, { date: '2026-11-30', open: '12:00', close: '16:00', note: 'Short day' }];
  assert.equal((await save({ hours: null, hourOverrides: ov })).status, 200);
  const ev = await text('/events/?now=2026-11-25T12:00'); // the seven days ahead include the special days
  assert.ok(ev.includes('class="ep-head"') && !ev.includes('PLACEHOLDER'), '/events/ is rendered, not the loading placeholder');
  const closed = await text('/?now=2026-11-26T12:00');
  assert.ok(closed.includes('<strong>Closed today.</strong>') && closed.includes('id="hero-h">Closed today.</h1>'), 'closed special day');
  assert.ok(!closed.includes('Closed this week') && !closed.includes('<strong>Closed</strong>'));
  const after = await text('/?now=2026-11-30T17:00'); // special hours are over; the next day is unknown, so it says nothing about the week
  assert.ok(after.includes('Closed for the night.') && after.includes('<strong>Closed now.</strong>') && !after.includes('Closed this week'));
  assert.ok((await text('/?now=2026-11-25T12:00')).includes('Hours coming soon.'), 'a day with no special day stays unknown');
  assert.equal((await save({ hours: HOURS, hourOverrides: [] })).status, 200);
});
test('B4: a special day that has passed is dropped on save and not counted toward the 60; only a new past date is an error', async () => {
  const ov = (d, closed = true) => ({ date: d, closed });
  const r = await save({ hours: HOURS, hourOverrides: [ov('2026-10-20'), ov('2026-11-02')] }); // new past date: refused
  assert.equal(r.status, 422);
  assert.ok((await r.json()).errors['hourOverrides.0.date']);
  const old = Array.from({ length: 70 }, (_, i) => ov(new Date(Date.UTC(2020, 0, 1 + i)).toISOString().slice(0, 10)));
  const db = openDb(data); putStore(db, { ...getStore(db), hourOverrides: old }); db.close(); // a long-lived list, stored before the owners cleaned it
  assert.equal((await save({ hourOverrides: [...old, ov('2026-11-02')] })).status, 200, 'old rows neither block the save nor count');
  assert.deepEqual((await (await api('GET', 'store')).json()).store.hourOverrides, [ov('2026-11-02')]);
  assert.equal((await save({ hourOverrides: [] })).status, 200);
});
test('address, phone, links, notes and the room photo show on the page frame, front page, New here?, JSON-LD and .ics without a restart', async () => {
  const r = await save({ address: { street: '9 Test Ln', city: 'Hatboro', region: 'pa', zip: '19040' }, phone: '(267) 555-0100', email: 'shop@example.com', freePlay: 'Free play after 3', parking: 'Park behind the shop', kids: 'Kids are welcome with an adult.',
    links: { facebook: 'https://www.facebook.com/shop', discord: 'https://discord.gg/abc' }, photo: 'room-a.webp', photoAlt: 'Tables set for draft' });
  assert.equal(r.status, 200);
  const home = await text(`/?now=${NOW}`);
  for (const t of ['9 Test Ln, Hatboro', 'href="tel:+12675550100"', '(267) 555-0100', '9 Test Ln, Hatboro, PA 19040', 'href="https://www.facebook.com/shop"', 'Park behind the shop', 'Kids are welcome with an adult.', 'Free play after 3.', 'href="https://discord.gg/abc"']) assert.ok(home.includes(t), t);
  assert.ok(!home.includes('445 York') && !home.includes('baked bar') && !home.includes('baked foot') && !home.includes('baked visit'));
  assert.ok(home.includes('<figure class="photo has-img"><img src="/media/photos/room-a.webp" alt="Tables set for draft"') && !home.includes('no-photo'));
  const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(home)[1]);
  assert.equal(ld.address.streetAddress, '9 Test Ln'); assert.equal(ld.telephone, '(267) 555-0100'); assert.equal(ld.email, 'shop@example.com'); assert.ok(ld.sameAs.includes('https://discord.gg/abc'));
  const nh = await text(`/new-here/?now=${NOW}`);
  assert.ok(nh.includes('Free play after 3. Bring a deck') && nh.includes('Park behind the shop') && nh.includes('9 Test Ln') && nh.includes('href="#free"') && nh.includes('Kids are welcome with an adult.') && nh.includes('(267) 555-0100'));
  assert.ok(nh.includes('9%20Test%20Ln') && !nh.includes('445') && !nh.includes('baked old directions'), 'B3: the New here? Directions button follows the saved address');
  const ics = await text(`/events.ics?now=${NOW}`);
  assert.ok(ics.includes('LOCATION:Mulligan Games\\, 9 Test Ln\\, Hatboro\\, PA 19040'));
  assert.ok((await text('/events/fnm?date=2026-10-30&now=' + NOW)).includes('9 Test Ln, Hatboro, PA 19040'));
  await save({ freePlay: '', photo: null, photoAlt: '', links: { facebook: '' } }); // fields can be cleared: the sections go away
  const after = await text(`/?now=${NOW}`), nh2 = await text(`/new-here/?now=${NOW}`);
  assert.ok(!after.includes('class="photo') && !after.includes('/media/photos/') && !after.includes('Can I just come and play?') && !after.includes('facebook.com'));
  assert.ok(!nh2.includes('id="free"') && !nh2.includes('href="#free"'));
  assert.equal((await api('DELETE', 'photos/room-a.webp')).status, 404); // not an upload, never touched
});
test('hostile input: <script>, \' OR 1=1 -- and javascript: links come back inert; a hostile row written past the validator is escaped on every page and in JSON-LD', async () => {
  const r = await save({ parking: "'; DROP TABLE kv; -- ' OR 1=1 --", kids: '<script>alert(1)</script>Kids ok', tagline: '<img src=x onerror=alert(2)>Shop' });
  assert.equal(r.status, 200);
  const cur = (await (await api('GET', 'store')).json()).store;
  assert.equal(cur.kids, 'alert(1)Kids ok'); assert.equal(cur.tagline, 'Shop'); assert.equal(cur.parking, "'; DROP TABLE kv; -- ' OR 1=1 --");
  assert.equal((await save({ links: { facebook: 'javascript:alert(3)' } })).status, 422);
  assert.equal((await save({ links: { facebook: 'https://x.example/"onmouseover="alert(4)' } })).status, 422);
  let home = await text(`/?now=${NOW}`);
  assert.ok(home.includes("&#39;; DROP TABLE kv; -- &#39; OR 1=1 --") && !home.includes("' OR 1=1"));
  assert.equal((await api('GET', 'series')).status, 200); // the database is still there
  // straight into the database, past clean(): the renderers must escape by themselves (D20)
  const db = openDb(data);
  putStore(db, { ...cur, name: '<b>Shop</b>', address: { street: '<script>alert(5)</script>', city: '"><svg onload=alert(6)>', region: 'PA', zip: '1' }, phone: '<i>1</i>', phoneHref: 'javascript:alert(7)', email: '<u>e</u>',
    parking: '<img src=x onerror=alert(8)>', kids: '</script><script>alert(9)</script>', freePlay: '<a href=javascript:alert(10)>x</a>', links: { facebook: 'javascript:alert(11)', discord: "https://d.example/'onclick='alert(12)", x: 'https://ok.example/x' },
    photo: 'a".webp', photoAlt: '"><svg onload=alert(13)>', hours: HOURS, hourOverrides: [{ date: '2026-10-26', closed: true, note: '<script>alert(14)</script>' }] });
  db.close();
  for (const p of [`/?now=${NOW}`, `/new-here/?now=${NOW}`, '/events/fnm?date=2026-10-30&now=' + NOW]) {
    const res = await fetch(origin + p), html = await res.text();
    assert.ok(res.status < 400, p);
    assert.ok(!/<script>alert|<img src=x|<svg onload|<b>Shop|<i>1<|<u>e<|<a href=javascript|href="javascript:|onclick=|<\/script><script>/i.test(html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')), `inert: ${p}`);
    for (const [, body] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { assert.ok(!body.includes('<'), `ld: ${p}`); JSON.parse(body); }
    for (const [, body] of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) assert.ok(!/alert\(\d+\)/.test(body) || /^\{/.test(body), `script text: ${p}`);
  }
  home = await text(`/?now=${NOW}`);
  assert.ok(!/href="javascript:/.test(home) && home.includes('href="https://ok.example/x"') && !home.includes('d.example'));
  const ics = await text(`/events.ics?now=${NOW}`);
  for (const l of ics.split('\r\n')) assert.ok(!/^(BEGIN|END):/.test(l) || /^(BEGIN|END):(VCALENDAR|VEVENT|VTIMEZONE|DAYLIGHT|STANDARD)$/.test(l), l);
});

// ---------- the admin's live card preview mirrors render.js card() (D25): every class the public card uses must exist in pvCard ----------
test('admin preview card uses every class and data attribute of the public card, for each sign-up kind', async () => {
  const { readFileSync } = await import('node:fs');
  const { card } = await import('../src/lib/render.js');
  const { GAMES } = await import('../src/lib/games.js');
  const src = readFileSync(new URL('../src/pages/admin.astro', import.meta.url), 'utf8'), pv = src.slice(src.indexOf('function pvCard('), src.indexOf('function saveTemplate('));
  assert.ok(pv.length > 500, 'pvCard found');
  const ctx = { games: GAMES, store: seed, now: { ymd: '2026-10-26', m: 0 }, keepNow: null };
  const base = { seriesId: 'x', slot: '2026-11-06', date: '2026-11-06', originalDate: '2026-11-06', title: 'T', game: 'magic', format: 'Draft', fee: 20, start: '19:00', end: '23:00', capacity: 16,
    beginnerFriendly: true, kidsWelcome: true, playStyle: 'casual', arriveBy: '18:45', prize: 'Packs' };
  for (const o of [{ signup: 'here' }, { signup: 'counter' }, { signup: 'walkin' }, { signup: 'external', tool: { name: 'TopDeck', url: 'https://topdeck.gg/e' } }, { signup: 'external' }, { signup: 'external', inviteOnly: true }]) {
    const html = String(card(ctx, { ...base, ...o }));
    for (const [, c] of html.matchAll(/class="([^"]+)"/g)) for (const k of c.split(' ')) assert.ok(pv.includes(`'${k}`) || pv.includes(` ${k}'`) || pv.includes(` ${k} `) || pv.includes(`'ic' + `) && k === 'ic', `${o.signup}: class ${k}`);
    for (const [, a] of html.matchAll(/ (data-[a-z]+)=/g)) assert.ok(pv.includes(a) || pv.includes(`'data-' + k`) && ['data-game', 'data-fgame', 'data-ffam'].includes(a) || a === 'data-state' && pv.includes("'data-state'"), `${o.signup}: ${a}`);
  }
});
test('B6: the admin preview says what the public card says (fixed phrases, and "1 seat left" in the singular)', async () => {
  const { readFileSync } = await import('node:fs');
  const { card } = await import('../src/lib/render.js');
  const { GAMES } = await import('../src/lib/games.js');
  const src = readFileSync(new URL('../src/pages/admin.astro', import.meta.url), 'utf8'), pv = src.slice(src.indexOf('function pvCard('), src.indexOf('function saveTemplate('));
  const ctx = { games: GAMES, store: seed, now: { ymd: '2026-10-26', m: 0 }, keepNow: null };
  const base = { seriesId: 'x', slot: '2026-11-06', date: '2026-11-06', originalDate: '2026-11-06', title: 'T', game: 'magic', format: 'Draft', fee: 20, start: '19:00', end: '23:00', capacity: 16,
    beginnerFriendly: true, kidsWelcome: true, playStyle: 'casual', arriveBy: '18:45' };
  const shown = [{ signup: 'here' }, { signup: 'here', capacity: 1 }, { signup: 'counter' }, { signup: 'walkin' }, { signup: 'external', tool: { name: 'TopDeck', url: 'https://topdeck.gg/e' } }, { signup: 'external' }, { signup: 'external', inviteOnly: true }, { signup: 'walkin', playStyle: 'competitive' }]
    .map((o) => String(card(ctx, { ...base, ...o })).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).join(' ');
  for (const p of ['Just show up. No sign-up needed.', 'Pre-register at the counter.', 'Call the shop', 'Invite only. Seats come from the Championship Series.', 'to keep your seat.', 'Beginner friendly', 'Kids welcome', 'Casual', 'Competitive',
    'Sign up online', 'Sign up on ', ' seats left', ' seat left']) {
    assert.ok(shown.includes(p), `render.js still says "${p}"`);
    assert.ok(pv.includes(p.trim()), `the preview says "${p.trim()}" too`);
  }
  assert.ok(!/ 1 seats left/.test(shown));
});
test('F9: an event that runs past midnight is still "On now" at 00:30', async () => {
  const { hero } = await import('../src/lib/render.js');
  const { GAMES } = await import('../src/lib/games.js');
  const { etNow } = await import('../src/lib/clock.js');
  const s = { id: 'late', title: 'Late Draft', game: 'magic', kind: 'weekly', recurrence: { type: 'weekly', day: 5 }, start: '19:00', end: '01:00', signup: 'walkin' };
  const at = (t) => String(hero({ games: GAMES, store: seed, series: [s], exceptions: [], now: etNow(t), keepNow: null, query: new URLSearchParams() }));
  assert.ok(at('2026-10-31T00:30').includes('On now: Late Draft.'), 'Friday 7 PM to 1 AM, seen at 00:30 Saturday');
  assert.ok(!at('2026-10-31T01:30').includes('On now'), 'over at 1 AM');
});
