import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/db.js';
import { clean, createAudit } from '../src/audit.js';
import { dataDirProblem, signSession, startupProblem } from '../src/auth.js';
import { HONEYPOT, publicForm } from '../src/forms.js';

const CRLF = String.fromCharCode(13, 10);
const ESC = String.fromCharCode(27);

test('log injection: control characters in user values are flattened, so no forged log lines', () => {
  const evil = `admin${CRLF}2026-01-01 security: login_ok who=admin${ESC}[31m${String.fromCharCode(0)}${String.fromCharCode(0x2028)}x`;
  const out = clean(evil);
  assert.ok(!/[\u0000-\u001f\u007f-\u009f]/.test(out));
  assert.ok(out.startsWith('admin 2026-01-01 security: login_ok'));
  assert.equal(clean('a'.repeat(500), 80).length, 80);
  assert.equal(clean(null), '');
});

test('audit: every field is cleaned before it is stored or printed; newest first; capped', () => {
  const db = openDb(':memory:');
  const printed = [];
  const audit = createAudit({ db, log: (m) => printed.push(m) });
  audit.event('login_fail', `bob${CRLF}FAKE LINE`, `1.2.3.4${CRLF}x`, `wrong${CRLF}password`, 1000);
  assert.equal(printed.length, 1);
  assert.ok(!printed[0].includes(CRLF) && !printed[0].includes(String.fromCharCode(10)));
  const [row] = audit.recent();
  assert.deepEqual([row.type, row.who, row.ip, row.detail], ['login_fail', 'bob FAKE LINE', '1.2.3.4 x', 'wrong password']);
  for (let i = 0; i < 520; i++) audit.event('e', 'w', '', String(i), 2000 + i);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM security_events').get().n, 500);
  assert.equal(audit.recent(50).length, 50);
  assert.equal(audit.recent(1)[0].detail, '519');
});

test('session cookies carry 128 random bits: two sessions for the same login differ', () => {
  const a = signSession('admin', 1e13, 's', 0), b = signSession('admin', 1e13, 's', 0);
  assert.notEqual(a, b);
});

test('web root: DATA_DIR and .env may not be inside dist/', () => {
  assert.match(dataDirProblem('/srv/app/dist', '/srv/app/dist', ''), /inside the web root/);
  assert.match(dataDirProblem('/srv/app/dist/data', '/srv/app/dist', ''), /inside the web root/);
  assert.match(dataDirProblem('/srv/data', '/srv/app/dist', '/srv/app/dist/.env'), /\.env/);
  assert.equal(dataDirProblem('/srv/app/dist-data', '/srv/app/dist', '/srv/app/.env'), null); // sibling with a similar name is fine
  assert.equal(dataDirProblem('/home/data', '/srv/app/dist', '/srv/app/.env'), null);
});

test('production needs a 32+ character SESSION_SECRET', () => {
  assert.match(startupProblem({ SESSION_SECRET: 'short' }, true), /SESSION_SECRET/);
  const P = { PUBLIC_URL: 'https://mg.example' };
  assert.equal(startupProblem({ SESSION_SECRET: 'x'.repeat(32), ...P }, true), null);
  assert.equal(startupProblem({ ...P }, true), null, 'unset: the server makes and keeps its own');
});

test('public forms: foreign origin refused, honeypot stores nothing, JSON gets JSON, a plain form gets a 303 to an allow-listed page only', async () => {
  const seen = [], spam = [];
  const opts = { origins: ['https://mg.test'], pages: { __proto__: null, '/events': '/events/' }, anchor: '#signup', onSpam: (ip) => spam.push(ip),
    handle: async (f) => { seen.push(f); return f.name ? { status: 200, body: { ok: true } } : { status: 400, body: { error: 'name' } }; } };
  const req = (body, headers = {}) => new Request('https://mg.test/api/x', { method: 'POST', body, headers: { 'x-mg-peer': '10.0.0.1', ...headers } });
  const asJson = (o, h) => req(JSON.stringify(o), { 'content-type': 'application/json', ...h });
  assert.equal((await publicForm(asJson({ name: 'Pat' }, { origin: 'https://evil.example' }), opts)).status, 403);
  const hp = await publicForm(asJson({ name: 'Bot', [HONEYPOT]: 'http://spam' }), opts);
  assert.deepEqual([hp.status, await hp.json(), seen.length, spam], [200, { ok: true }, 0, ['10.0.0.1']]);
  const ok = await publicForm(asJson({ name: 'Pat' }, { origin: 'https://mg.test' }), opts);
  assert.deepEqual([ok.status, await ok.json()], [200, { ok: true }]);
  const form = (o) => publicForm(req(new URLSearchParams(o)), opts);
  assert.equal((await form({ name: 'Pat', _page: '/events' })).headers.get('location'), '/events/?sent=1#signup');
  for (const page of ['//evil.example', 'https://evil.example/', '/admin', 'constructor', '__proto__']) assert.equal((await form({ name: '', _page: page })).headers.get('location'), '/events/?error=name#signup', page);
  assert.equal((await publicForm(req('not json', { 'content-type': 'application/json' }), opts)).status, 400); // unreadable body: handled as an empty form
});

test('owner rule (D20): raw-HTML doors in src/ carry only constants (icons, marker comments), never data', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const files = readdirSync(new URL('../src/', import.meta.url), { recursive: true }).filter((f) => /\.(astro|js)$/.test(f));
  for (const f of files) {
    readFileSync(new URL('../src/' + f.split(/[\\/]/).join('/'), import.meta.url), 'utf8').split('\n').forEach((l, i) => {
      const at = `${f}:${i + 1}`;
      if (/outerHTML|insertAdjacentHTML|document\.write|srcdoc/.test(l) && !/^\s*(\/\/|\*)/.test(l)) assert.fail(`${at}: raw HTML sink`);
      if (/\.innerHTML\s*=/.test(l)) assert.match(l, /IC\[n\]|EV\.icons\[n\]/, `${at}: innerHTML only for icon paths`);
      for (const [, v] of l.matchAll(/set:html=(\{[^}]*\}|"[^"]*")/g)) assert.ok(/^"[^"]*"$|^\{`[^`$]*`\}$|^\{ICONS\[name\] \?\? ''\}$/.test(v), `${at}: set:html with a value`);
    });
  }
});
