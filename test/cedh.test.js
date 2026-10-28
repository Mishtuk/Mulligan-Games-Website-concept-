// /cedh/ (P2.7): built page, live next events, entry/points copy, turnout, public results archive (escaped, cEDH only), sitemap and nav.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb, putSeries } from '../src/db.js';
import { turnoutAll } from '../src/lib/store-render.js';
import { etNow } from '../src/lib/clock.js';
import { PAGES } from '../src/lib/sitemap.js';

const root = join(import.meta.dirname, '..'), dist = join(root, 'dist');
const tmp = mkdtempSync(join(tmpdir(), 'mg-cedh-')), data = join(tmp, 'data');
const MCS = { id: 'mcs-t', title: 'Championship Series', game: 'cedh', format: 'Championship Series', kind: 'cedh', cedhSeries: 'mcs', recurrence: { type: 'dates', dates: [{ date: '2026-11-01', start: '10:00' }] }, end: null, fee: 60,
  signup: 'external', tool: { name: 'TopDeck', url: 'https://topdeck.gg/event/x' } };
const OLD = { ...MCS, id: 'old-t', title: '<b>Old cEDH</b>', recurrence: { type: 'dates', dates: [{ date: '2026-10-04', start: '10:00' }] } };
const MAG = { id: 'mag-t', title: 'Magic night', game: 'magic', format: 'Draft', kind: 'weekly', recurrence: { type: 'dates', dates: [{ date: '2026-10-04', start: '19:00' }] }, end: null, fee: 20, signup: 'walkin' };
let proc, base;
const get = async (p) => (await fetch(base + p)).text();

before(async () => {
  assert.ok(existsSync(join(dist, 'cedh', 'index.html')), 'run npm run build first');
  const db = openDb(data);
  db.prepare("INSERT INTO kv (key, value) VALUES ('series_seeded', '1')").run();
  for (const s of [MCS, OLD, MAG]) putSeries(db, s);
  const ins = db.prepare('INSERT INTO results (series, slot, day, headcount, winner, top_names, notes, credit_note, reported, is_public, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1)');
  ins.run('old-t', '2026-10-04 10:00', '2026-10-04', 69, '<script>alert(1)</script>', JSON.stringify(["x' OR 1=1 --"]), 'SECRET-NOTE', 'SECRET-CREDIT', 1);
  ins.run('mag-t', '2026-10-04 19:00', '2026-10-04', 8, 'Magic Winner', '[]', '', '', 1); // not cEDH
  ins.run('old-t', '2026-09-06 10:00', '2026-09-06', 5, 'Hidden Winner', '[]', '', '', 0); // not public
  db.close();
  proc = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: '0', DATA_DIR: data, ALLOW_DEFAULT_ADMIN: '1', NODE_ENV: 'test', PUBLIC_URL: 'https://mg.example' } });
  proc.stderr.on('data', (d) => process.stderr.write(d));
  const port = await new Promise((ok, no) => { proc.stdout.on('data', (d) => { const m = /\(port (\d+),/.exec(String(d)); if (m) ok(+m[1]); }); proc.on('exit', (c) => no(new Error(`server exited ${c}`))); });
  base = `http://localhost:${port}`;
});
after(async () => { const gone = new Promise((ok) => proc.on('exit', ok)); proc.kill(); await gone; rmSync(tmp, { recursive: true, force: true, maxRetries: 5 }); });

test('/cedh/ is served with its own title, canonical and entry text', async () => {
  const r = await fetch(`${base}/cedh/?now=2026-10-27T12:00`), t = await r.text();
  assert.equal(r.status, 200);
  assert.match(t, /<title>cEDH at Mulligan Games/);
  assert.ok(t.includes('<link rel="canonical" href="https://mg.example/cedh/"'));
  assert.ok(t.includes('Championship Series $60 and 5K $100: a $10 online deposit holds a spot, the rest is paid at the door. Redemption $35 ($25 if you played the 5K), paid on site.'));
  assert.ok(t.includes('Full rules on TopDeck') && t.includes('<td>200</td>') && t.includes('Up to 10'));
});

test('next events come from the data: cEDH series only, linked to their date page, with fee and TopDeck link', async () => {
  const t = await get('/cedh/?now=2026-10-27T12:00'), next = t.slice(t.indexOf('id="next-h"'), t.indexOf('id="entry-h"'));
  assert.ok(next.includes('href="/events/mcs-t?date=2026-11-01') && next.includes('$60') && next.includes('Sign up on TopDeck') && next.includes('https://topdeck.gg/event/x'));
  assert.ok(!next.includes('Magic night') && !next.includes('Old cEDH') && next.includes('href="/events/?game=cedh"'));
});

test('results archive: public cEDH results only, names escaped, notes never shown', async () => {
  const t = await get('/cedh/?now=2026-10-27T12:00'), res = t.slice(t.indexOf('id="results-h"'));
  assert.ok(res.includes('&lt;script&gt;alert(1)&lt;/script&gt;') && !res.includes('<script>alert(1)') && res.includes('&lt;b&gt;Old cEDH&lt;/b&gt;'));
  assert.ok(res.includes('OR 1=1') && res.includes('69 players'));
  assert.ok(!res.includes('Magic Winner') && !res.includes('Hidden Winner') && !res.includes('SECRET'));
});

test('turnout lists all 20 circuit events: past newest first, upcoming as registered so far', () => {
  const s = turnoutAll({ now: etNow(new Date('2026-10-27T15:00:00Z')) }).toString();
  assert.equal((s.match(/<li>/g) ?? []).length, 20);
  assert.ok(s.indexOf('Oct 4') < s.indexOf('Dec 7') && s.includes('80 registered so far') && s.includes('Full standings on TopDeck'));
  assert.ok(s.indexOf('Coming up') < s.indexOf('Past events'));
});

test('sitemap lists /cedh/ and the nav and front page point at it', async () => {
  assert.ok(PAGES.includes('/cedh/'));
  assert.ok((await get('/sitemap.xml')).includes('<loc>https://mg.example/cedh/</loc>'));
  const page = await get('/cedh/'), home = await get('/');
  assert.ok(/<a href="\/cedh\/" aria-current="page">cEDH<\/a>/.test(page));
  assert.ok(/<a href="\/cedh\/">cEDH<\/a>/.test(home) && home.includes('More about cEDH at Mulligan'));
});
