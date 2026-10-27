// Starts the real server on a free port with a temp DATA_DIR and a tiny fake dist/, then talks to it over HTTP.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..');
const tmp = mkdtempSync(join(tmpdir(), 'mg-srv-'));
const dist = join(tmp, 'dist');
mkdirSync(join(dist, 'admin'), { recursive: true });
mkdirSync(join(dist, 'media', 'photos'), { recursive: true });
for (const f of ['pic.webp', 'pic-800.webp', 'pic-full.webp']) writeFileSync(join(dist, 'media', 'photos', f), 'x');
writeFileSync(join(dist, 'index.html'), '<main><!--mg:data-->baked<!--/mg:data--><!--mg:later--></main>');
writeFileSync(join(dist, 'admin', 'index.html'), '<p>admin page</p>');
let proc, base, origin;
const ADMIN = { username: 'admin', password: 'admin' };

before(async () => {
  proc = spawn(process.execPath, ['server.js'], { cwd: join(import.meta.dirname, '..'),
    env: { ...process.env, PORT: '0', DATA_DIR: join(tmp, 'data'), DIST_DIR: dist, ALLOW_DEFAULT_ADMIN: '1', NODE_ENV: 'test' } });
  proc.stderr.on('data', (d) => process.stderr.write(d));
  const port = await new Promise((ok, no) => {
    proc.stdout.on('data', (d) => { const m = /\(port (\d+),/.exec(String(d)); if (m) ok(+m[1]); });
    proc.on('exit', (c) => no(new Error(`server exited ${c}`)));
  });
  origin = `http://localhost:${port}`;
  base = origin;
});
after(() => { proc?.kill(); });

const call = (method, path, body, headers = {}) => fetch(base + path, { method, redirect: 'manual', headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
let cookie = '';
const admin = (method, path, body) => call(method, `/api/admin/${path}`, body, { Origin: origin, Cookie: cookie });

test('static pages: markers filled, admin page noindex, unknown path 404', async () => {
  const home = await (await call('GET', '/')).text();
  assert.ok(!home.includes('baked') && home.includes('id="mg-data"') && home.includes('<!--mg:later-->'));
  const a = await call('GET', '/admin/');
  assert.equal(a.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal((await call('GET', '/nope')).status, 404);
  assert.equal((await call('GET', '/../server.js')).status, 404);
});

test('sign in: refused without a session, wrong password, or a foreign origin', async () => {
  assert.equal((await call('GET', '/api/admin/state')).status, 401);
  assert.equal((await call('POST', '/api/login', ADMIN)).status, 403); // no Origin
  assert.equal((await call('POST', '/api/login', ADMIN, { Origin: 'http://evil.example' })).status, 403);
  assert.equal((await call('POST', '/api/login', { ...ADMIN, password: 'wrong' }, { Origin: origin })).status, 401);
  const ok = await call('POST', '/api/login', ADMIN, { Origin: origin });
  assert.equal(ok.status, 200);
  const set = ok.headers.get('set-cookie');
  assert.ok(set.includes('HttpOnly') && set.includes('SameSite=Strict'));
  cookie = set.split(';')[0];
  const st = await (await admin('GET', 'state')).json();
  assert.equal(st.defaultPassword, true);
});

test('CSRF: a signed-in POST without the site origin is refused', async () => {
  assert.equal((await call('POST', '/api/admin/password', { current: 'admin', password: 'csrf-password-1' }, { Cookie: cookie })).status, 403);
  assert.equal((await call('POST', '/api/admin/password', { current: 'admin', password: 'csrf-password-1' }, { Cookie: cookie, Origin: 'http://evil.example' })).status, 403);
  assert.equal((await call('DELETE', '/api/admin/photos/photo-20260101-abcdef.webp', null, { Cookie: cookie })).status, 403);
});

test('stats counts a visit (not the signed-in admin)', async () => {
  await call('GET', '/', null, { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36', Referer: 'https://www.facebook.com/' });
  const s = await (await admin('GET', 'stats?range=7d')).json();
  assert.equal(s.views, 1);
  assert.equal(s.visitors, 1);
  assert.deepEqual(s.referrers, [{ host: 'facebook.com', n: 1 }]);
  assert.equal(s.series.length, 7);
  assert.deepEqual(s.prev, { visitors: 0, views: 0 }); // the 7 days before
  await call('GET', '/', null, { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36', Cookie: cookie });
  assert.equal((await (await admin('GET', 'stats?range=7d')).json()).views, 1, 'signed-in admin not counted');
});

test('change password: needs the current one, then the old password stops working', async () => {
  assert.equal((await admin('POST', 'password', { current: 'wrong', password: 'a-better-password' })).status, 400);
  assert.equal((await (await admin('POST', 'password', { current: 'admin', password: 'admin' })).json()).error, 'too_short');
  const r = await admin('POST', 'password', { current: 'admin', password: 'a-better-password' });
  assert.equal(r.status, 200);
  const fresh = r.headers.get('set-cookie').split(';')[0];
  assert.equal((await call('GET', '/api/admin/state', null, { Cookie: cookie })).status, 401); // old session ended
  assert.equal((await call('GET', '/api/admin/state', null, { Cookie: fresh })).status, 200);
  assert.equal((await call('POST', '/api/login', ADMIN, { Origin: origin })).status, 401);
});

test('M4 security headers on pages, the admin page and error replies; CSP hashes inline scripts', async () => {
  writeFileSync(join(dist, 'inline.html'), '<script>var a=1</script><button onclick="print()">x</button><script type="module" src="/x.js"></script>');
  const check = (r) => { for (const h of ['content-security-policy', 'permissions-policy', 'x-content-type-options', 'x-frame-options', 'referrer-policy']) assert.ok(r.headers.get(h), h); };
  const page = await call('GET', '/inline.html');
  check(page);
  const csp = page.headers.get('content-security-policy');
  assert.ok(csp.includes("object-src 'none'") && csp.includes("frame-ancestors 'self'"));
  assert.ok(csp.includes("'sha256-") && csp.includes("'unsafe-hashes'"));
  assert.ok(/script-src 'self' 'sha256-/.test(csp), 'inline script blocks must be hashed into script-src');
  assert.ok(!/script-src[^;]*'unsafe-inline'/.test(csp));
  const dir = (n) => (csp.split('; ').find((d) => d.startsWith(n + ' ')) ?? '').split(' ').slice(1);
  assert.deepEqual(dir('frame-src'), ['https://www.tiktok.com'], 'the TikTok player is the only frame source (D47)');
  assert.ok(![...dir('script-src'), ...dir('img-src'), ...dir('connect-src'), ...dir('media-src')].some((v) => /^https?:|\*/.test(v)), 'nothing third-party can load scripts, images or media');
  check(await call('GET', '/admin/'));
  check(await call('GET', '/nope'));
  check(await call('GET', '/api/nothing'));
  check(await call('POST', '/', null)); // 405
  check(await call('POST', '/api/login', ADMIN, { Origin: 'http://evil.example' }));
});

test('L2 directory redirect stays on this site', async () => {
  const r = await call('GET', '/.//admin');
  assert.ok(!(r.headers.get('location') ?? '').startsWith('//'));
});

test('M3 production refuses to start with ALLOW_DEFAULT_ADMIN=1', async () => {
  const code = await new Promise((ok) => spawn(process.execPath, ['server.js'], { cwd: REPO, env: { ...process.env, NODE_ENV: 'production', SESSION_SECRET: 'x', ALLOW_DEFAULT_ADMIN: '1', DATA_DIR: join(tmp, 'prod'), PORT: '0' } }).on('exit', ok));
  assert.equal(code, 1);
});

test('production with no SESSION_SECRET makes one, keeps it in the data folder and reuses it', async () => {
  const dir = join(tmp, 'prod-secret');
  const start = () => new Promise((ok, fail) => {
    const c = spawn(process.execPath, ['server.js'], { cwd: REPO, env: { ...process.env, NODE_ENV: 'production', SESSION_SECRET: '', ALLOW_DEFAULT_ADMIN: '', ADMIN_PASSWORD: '', DATA_DIR: dir, PORT: '0', PUBLIC_URL: 'https://mg.example' } });
    let out = '';
    c.stdout.on('data', (d) => { out += d; if (/site on/.test(out)) { c.kill(); ok(); } });
    c.on('exit', (code) => fail(new Error(`exited ${code}: ${out}`)));
  });
  await start();
  const key = readFileSync(join(dir, 'session-secret'), 'utf8');
  assert.match(key, /^[0-9a-f]{64}$/);
  await start();
  assert.equal(readFileSync(join(dir, 'session-secret'), 'utf8'), key, 'same key after a restart');
});

test('F6: production without PUBLIC_URL refuses to start and says why', async () => {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync(process.execPath, ['server.js'], { cwd: REPO, encoding: 'utf8', timeout: 15000, env: { ...process.env, NODE_ENV: 'production', SESSION_SECRET: '', ALLOW_DEFAULT_ADMIN: '', ADMIN_PASSWORD: '', PUBLIC_URL: '', DATA_DIR: join(tmp, 'prod-nourl'), PORT: '0' } });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Refusing to start: PUBLIC_URL must be set/);
});

test('L1 sign out ends the session even for a copied cookie', async () => {
  const login = await call('POST', '/api/login', { username: 'admin', password: 'a-better-password' }, { Origin: origin });
  const c = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await call('GET', '/api/admin/state', null, { Cookie: c })).status, 200);
  await call('POST', '/api/logout', null, { Origin: origin, Cookie: c });
  assert.equal((await call('GET', '/api/admin/state', null, { Cookie: c })).status, 401);
});

test('dotfiles are never served, even if present in dist/', async () => {
  writeFileSync(join(dist, '.env'), 'SECRET=1');
  mkdirSync(join(dist, '.git'), { recursive: true });
  writeFileSync(join(dist, '.git', 'config'), 'x');
  for (const p of ['/.env', '/.git/config', '/%2eenv', '/.data/mg.db', '/a/.env']) assert.equal((await call('GET', p)).status, 404, p);
});

test('refuses to start when DATA_DIR is inside the web root', async () => {
  const code = await new Promise((ok) => spawn(process.execPath, ['server.js'], { cwd: REPO, env: { ...process.env, DIST_DIR: dist, DATA_DIR: join(dist, 'data'), PORT: '0', NODE_ENV: 'test' } }).on('exit', ok));
  assert.equal(code, 1);
});

test('security log: sign-in failure, sign-in and password change are recorded; passwords never are', async () => {
  const bad = await call('POST', '/api/login', { username: 'ad' + String.fromCharCode(13, 10) + 'min', password: 'secret-wrong-pass' }, { Origin: origin, 'X-Forwarded-For': '9.9.9.9' });
  assert.equal(bad.status, 401);
  const login = await call('POST', '/api/login', { username: 'admin', password: 'a-better-password' }, { Origin: origin });
  const c = login.headers.get('set-cookie').split(';')[0];
  const as = (m, p, b) => call(m, `/api/admin/${p}`, b, { Origin: origin, Cookie: c });
  const events = (await (await as('GET', 'security')).json()).events;
  const types = events.map((e) => e.type);
  for (const t of ['login_fail', 'login_ok', 'password_change']) assert.ok(types.includes(t), t);
  const fail = events.find((e) => e.type === 'login_fail');
  assert.equal(fail.who, 'ad min'); // CR/LF flattened
  assert.ok(!JSON.stringify(events).includes('secret-wrong-pass') && !JSON.stringify(events).includes('a-better-password'));
  assert.notEqual(fail.ip, '9.9.9.9'); // X-Forwarded-For is ignored without TRUST_PROXY
  await call('POST', '/api/logout', null, { Origin: origin, Cookie: c });
});

test('picture upload: bad files, oversize bodies and strangers are refused and nothing is stored', async () => {
  const sharp = (await import('sharp')).default;
  const c = (await call('POST', '/api/login', { username: 'admin', password: 'a-better-password' }, { Origin: origin })).headers.get('set-cookie').split(';')[0];
  const post = (b, h = {}) => call('POST', '/api/admin/photos', b, { Origin: origin, Cookie: c, ...h });
  const url = (buf) => 'data:image/webp;base64,' + buf.toString('base64');
  const img = (w, h) => sharp({ create: { width: w, height: h, channels: 3, background: '#887766' } }).webp().toBuffer();
  const [big, small] = [await img(1024, 768), await img(800, 600)];
  const bomb = await sharp({ create: { width: 6000, height: 6000, channels: 3, background: '#fff' } }).png({ compressionLevel: 9 }).toBuffer(); // tiny file, 36 megapixels
  const skewed = Buffer.from(big); skewed.writeUInt32LE(skewed.length, 4); // RIFF size field is wrong
  const dir = join(tmp, 'data', 'photos');
  const empty = () => assert.deepEqual(existsSync(dir) ? readdirSync(dir) : [], []);
  for (const [what, b, code] of [['bad size field', { big: url(skewed), small: url(small) }, 400], ['wrong dimensions', { big: url(small), small: url(small) }, 400],
    ['1 MB of nothing', { big: url(Buffer.alloc(1000 * 1024)), small: url(small) }, 400], ['text claiming to be a jpeg', { big: 'data:image/jpeg;base64,' + Buffer.from('<script>alert(1)</script>').toString('base64'), small: url(small) }, 400], ['not a data url', { big: 'x', small: 'y' }, 400],
    ['decompression bomb (PNG)', { big: 'data:image/png;base64,' + bomb.toString('base64'), small: url(small) }, 400]]) {
    const r = await post(b);
    assert.equal(r.status, code, what);
    assert.ok(['file_type', 'file_size'].includes((await r.json()).error), what);
  }
  const huge = await post({ big: 'A'.repeat(2.5 * 1024 * 1024), small: '' }).then((r) => r.status, () => 413); // the server may also just drop the connection
  assert.equal(huge, 413);
  empty();
  assert.equal((await call('POST', '/api/admin/photos', { big: url(big), small: url(small) }, { Origin: origin })).status, 401); // no session
  assert.equal((await call('POST', '/api/admin/photos', { big: url(big), small: url(small) }, { Origin: 'http://evil.example', Cookie: c })).status, 403);
  assert.equal(await call('POST', '/api/admin/photos', { big: 'A'.repeat(300 * 1024) }, { Origin: origin }).then((r) => r.status, () => 413), 413); // 256 KB cap without a session
  empty();
});

test('picture upload: round trip, served from DATA with nosniff, traversal 404, delete refused while a saved item uses it', async () => {
  const sharp = (await import('sharp')).default;
  const c = (await call('POST', '/api/login', { username: 'admin', password: 'a-better-password' }, { Origin: origin })).headers.get('set-cookie').split(';')[0];
  const as = (m, p, b) => call(m, p, b, { Origin: origin, Cookie: c });
  const img = (w, h) => sharp({ create: { width: w, height: h, channels: 3, background: '#887766' } }).webp().toBuffer().then((b) => 'data:image/webp;base64,' + b.toString('base64'));
  const r = await as('POST', '/api/admin/photos', { big: await img(1024, 768), small: await img(800, 600) });
  assert.equal(r.status, 200);
  const { name, photos } = await r.json();
  assert.match(name, /^photo-\d{8}-[0-9a-f]{6}\.webp$/);
  assert.ok(photos.some((p) => p.name === name && p.thumb === name.replace('.', '-800.')));
  assert.equal(readdirSync(join(tmp, 'data', 'photos')).length, 2);
  for (const f of [name, name.replace('.', '-800.')]) {
    const g = await call('GET', `/media/photos/${f}`);
    assert.equal(g.status, 200);
    assert.equal(g.headers.get('content-type'), 'image/webp');
    assert.equal(g.headers.get('x-content-type-options'), 'nosniff');
    assert.match(g.headers.get('cache-control'), /immutable/);
  }
  const { openDb, setState } = await import('../src/db.js'); // no admin view saves items yet: put one in the database directly
  const db = openDb(join(tmp, 'data'));
  setState(db, { events: [{ id: 'e1', title: 'Prerelease', photo: name }] });
  assert.equal((await as('DELETE', `/api/admin/photos/${name}`)).status, 409); // still used
  setState(db, {});
  db.close();
  assert.equal((await as('DELETE', '/api/admin/photos/pic.webp')).status, 404); // built photos are not deletable
  assert.equal((await as('DELETE', `/api/admin/photos/${name}`)).status, 200);
  assert.equal(readdirSync(join(tmp, 'data', 'photos')).length, 0);
  for (const bad of ['/media/photos/..%2f..%2fapp.db', '/media/photos/.x.webp', '/media/photos/photo-20260101-zzzzzz.webp', '/media/photos/photo-20260101-abcdef.webp']) assert.equal((await call('GET', bad)).status, 404, bad);
});

test('B2: a JPEG or PNG picture (what Safari makes) is accepted and stored as WebP; its claimed type is ignored', async () => {
  const sharp = (await import('sharp')).default;
  const c = (await call('POST', '/api/login', { username: 'admin', password: 'a-better-password' }, { Origin: origin })).headers.get('set-cookie').split(';')[0];
  const mk = (fmt, w, h) => sharp({ create: { width: w, height: h, channels: 3, background: '#887766' } })[fmt]().toBuffer();
  for (const [fmt, claim] of [['jpeg', 'jpeg'], ['png', 'png'], ['jpeg', 'webp']]) {
    const url = (b) => `data:image/${claim};base64,${b.toString('base64')}`;
    const r = await call('POST', '/api/admin/photos', { big: url(await mk(fmt, 1024, 768)), small: url(await mk(fmt, 800, 600)) }, { Origin: origin, Cookie: c });
    assert.equal(r.status, 200, fmt + ' as ' + claim);
    const { name } = await r.json();
    const g = await call('GET', `/media/photos/${name}`);
    assert.equal(g.headers.get('content-type'), 'image/webp');
    assert.equal(Buffer.from(await g.arrayBuffer()).toString('latin1', 8, 12), 'WEBP', 're-encoded');
    assert.equal((await call('DELETE', `/api/admin/photos/${name}`, null, { Origin: origin, Cookie: c })).status, 200);
  }
});

test('malformed and aborted requests do not take the server down', async () => {
  const { connect } = await import('node:net');
  const port = new URL(origin).port;
  const CRLF = String.fromCharCode(13, 10);
  const raw = (data, end = true) => new Promise((ok) => {
    const s = connect(+port, '127.0.0.1', () => { s.write(data); if (end) s.end(); });
    let got = '';
    s.on('data', (d) => (got += d));
    s.on('close', () => ok(got));
    s.on('error', () => ok(got));
  });
  assert.match(await raw('GARBAGE NOT HTTP' + CRLF + CRLF), /^HTTP\/1\.1 400/);
  assert.match(await raw('GET /' + String.fromCharCode(0) + ' HTTP/1.1' + CRLF + 'Host: x' + CRLF + CRLF), /400|404/);
  await raw(`POST /api/login HTTP/1.1${CRLF}Host: x${CRLF}Content-Length: 500${CRLF}Content-Type: application/json${CRLF}${CRLF}{"name":`); // body cut short, socket closed
  const s = connect(+port, '127.0.0.1'); s.on('error', () => {}); s.write('GET / HTTP/1.1' + CRLF); s.destroy(); // aborted mid-headers
  assert.equal((await call('GET', '/')).status, 200);
  assert.equal(proc.exitCode, null);
});

test('photo picker lists real files once, without their size variants', async () => {
  const c = (await call('POST', '/api/login', { username: 'admin', password: 'a-better-password' }, { Origin: origin })).headers.get('set-cookie').split(';')[0];
  const photos = (await (await call('GET', '/api/admin/photos', null, { Cookie: c })).json()).photos;
  assert.deepEqual(photos, [{ name: 'pic.webp', thumb: 'pic-800.webp' }]);
});

test('login lockout: 5 wrong tries lock the account', async () => {
  let last;
  for (let i = 0; i < 6; i++) last = await call('POST', '/api/login', { username: 'admin', password: `nope${i}` }, { Origin: origin });
  assert.equal(last.status, 429);
});
