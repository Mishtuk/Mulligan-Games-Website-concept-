// The whole website server (`node server.js`): serves the static Astro build in dist/, fills admin-edited content into the HTML at
// <!--mg:*--> markers, answers /api/*, and runs the single admin sign-in. No framework; Node 22+ built-ins only.
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { brotliCompressSync, constants as zc, gzipSync } from 'node:zlib';
import { openDb, getState, backup, seedSeries, seedStore, getStore, putStore, listSeries, getSeries, putSeries, deleteSeries, listExceptions, putException, deleteException } from './src/db.js';
import { clean as cleanSeries, cleanException, cleanTemplate, copyText, hasSlot, newId, occurrences, validate as validateSeries, validateException, validateTemplate, KINDS, SIGNUPS, TEMPLATES } from './src/lib/events.js';
import { GAMES } from './src/lib/games.js';
import { ICONS } from './src/lib/icons.js';
import { clean, createAudit } from './src/audit.js';
import {
  allow, adminRow, checkLogin, clearFailures, clientIp, cookieHeader, dataDirProblem, defaultInUse, locked, readCookie, recordFailure, sameOrigin, seedAdmin, setPassword,
  signSession, startupProblem, verifySession, SESSION_DAYS,
} from './src/auth.js';
import { etDay, injectMarkers } from './src/lib/state.js';
import { clean as cleanStore, validate as validateStore, LINKS } from './src/lib/store.js';
import * as facts_view from './src/lib/store-render.js';
import releases from './src/content/releases.json' with { type: 'json' };
import { etNow, NOW_TEST, realDay } from './src/lib/clock.js';
import * as view from './src/lib/render.js';
import { calendar, feedOccurrences } from './src/lib/ics.js';
import { eventLd, ldScript, shopLd } from './src/lib/jsonld.js';
import { endM, seatState } from './src/lib/seats.js';
import { publicForm } from './src/forms.js';
import * as regs from './src/lib/registrations.js';
import * as inv from './src/lib/inventory.js';
import { sitemap } from './src/lib/sitemap.js';
import { createStats } from './src/stats/index.js';

const ROOT = import.meta.dirname;
const PROD = process.env.NODE_ENV === 'production';
if (!PROD && existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'));
const env = process.env;
const PORT = env.PORT === undefined ? 8080 : Number(env.PORT);
const startup = startupProblem(env, PROD);
if (startup) { console.error(`Refusing to start: ${startup}`); process.exit(1); }
const PUBLIC_URL = (env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const DIST = env.DIST_DIR || join(ROOT, 'dist');
const DATA = env.DATA_DIR || (PROD ? '/home/data' : join(ROOT, '.data'));
/** Production with no SESSION_SECRET set: a random key made on first start and kept in the data folder (never served), so nobody has to type one in. */
function keptSecret(f) {
  try { const s = readFileSync(f, 'utf8').trim(); if (s.length >= 32) return s; } catch {}
  mkdirSync(DATA, { recursive: true });
  const s = randomBytes(32).toString('hex');
  writeFileSync(f, s, { mode: 0o600 });
  return s;
}
const SESSION_SECRET = env.SESSION_SECRET || (PROD ? keptSecret(join(DATA, 'session-secret')) : randomBytes(32).toString('hex')); // dev: new secret each start, so sessions end on restart
const log = (...a) => console.log(new Date().toISOString(), ...a);

// Photos: the built ones in dist/media/photos plus admin uploads in DATA/photos (dist is wiped on every build). Folders are read when
// needed, so new files are picked up without a restart.
// ponytail: one readdir per folder per page view (about 100 names); cache by folder mtime if the folders ever get large.
const PHOTOS = join(DATA, 'photos');
const ls = (d) => { try { return readdirSync(d); } catch { return []; } };
const photoFiles = () => new Set([...ls(join(DIST, 'media', 'photos')), ...ls(PHOTOS)]);
// Uploads are re-encoded with sharp when it loads (it ships with astro, but is not our dependency), otherwise only validated.
const sharp = (await import('sharp').catch(() => null))?.default ?? null;
log(sharp ? 'upload: sharp found, re-encoding pictures to WebP' : 'upload: sharp missing, validate-only');
const pickablePhotos = (set) => [...set].filter((f) => !f.includes('-400.') && !f.includes('-800.') && !f.includes('-full.')).sort();

const dirProblem = dataDirProblem(DATA, DIST, join(ROOT, '.env'));
if (dirProblem) { console.error(`Refusing to start: ${dirProblem}`); process.exit(1); }

const db = openDb(DATA);
seedSeries(db);
seedStore(db);
const audit = createAudit({ db, log });
const stats = createStats({ db, log });

// First run: the admin account.
const first = seedAdmin(db, { allowDefault: env.ALLOW_DEFAULT_ADMIN === '1', password: env.ADMIN_PASSWORD });
if (first) log(first.generated ? `Created the admin account. Username: ${first.username}  Password: ${first.password}  (shown once; change it in Admin > Account)` : `Created the admin account: ${first.username} (${env.ALLOW_DEFAULT_ADMIN === '1' ? 'password admin, testing only' : 'password from ADMIN_PASSWORD'}).`);
if (defaultInUse(db)) log('Warning: the default admin/admin password is in use (ALLOW_DEFAULT_ADMIN=1). Change it before launch.');
const runBackup = () => { try { backup(db, DATA); } catch (e) { log('backup failed', e.message); } };
/** Retention (P2.4a): once a day, wipe contact details of sign-ups whose event was RETENTION_DAYS or more days ago. Counts and statuses stay. */
function runPurge() {
  try {
    const today = etDay();
    if (db.prepare("SELECT value FROM kv WHERE key = 'purged_day'").get()?.value === today) return;
    const n = regs.purgeContacts(db, today), p = inv.purgePreorders(db, Date.now()); // preorder contacts: PREORDER_RETENTION_DAYS after pickup / cancel
    if (p) log(`retention: wiped the contact details of ${p} closed preorders`);
    db.prepare("INSERT INTO kv (key, value) VALUES ('purged_day', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(today);
    if (n) log(`retention: wiped the contact details of ${n} sign-ups`);
  } catch (e) { log('retention purge failed', e.message); }
}
runBackup();
runPurge();
setInterval(() => { runBackup(); runPurge(); }, 3600e3).unref();

// ---------- responses ----------
const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
const bad = (error, status = 400) => json({ error }, status);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.ics': 'text/calendar; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf' };
const TEXT = /^(text\/|application\/(json|xml|manifest)|image\/svg)/;

// Security headers go on EVERY response, errors included. The CSP lists a hash for each inline script (and inline on*= handler) found in the
// page being sent, so Astro's inline scripts run but injected script text would not. Inline styles stay allowed (style-src 'unsafe-inline').
const sha = (t) => `'sha256-${createHash('sha256').update(t).digest('base64')}'`;
const unent = (t) => t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function csp(html = '') {
  const scripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => sha(m[1]));
  const attrs = [...html.matchAll(/\son[a-z]+="([^"]*)"/g)].map((m) => sha(unent(m[1])));
  return ["default-src 'self'", `script-src 'self' ${scripts.join(' ')}`.trim(), `script-src-attr ${attrs.length ? `'unsafe-hashes' ${attrs.join(' ')}` : "'none'"}`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data:", "media-src 'self'", "font-src 'self'", "connect-src 'self'", "object-src 'none'", "base-uri 'self'",
    "form-action 'self'", "frame-ancestors 'self'"].join('; ');
}
function baseHeaders(url, html) {
  const h = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()', 'Content-Security-Policy': csp(html) };
  if (url.protocol === 'https:') h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  return h;
}
function compress(nreq, buf, type, headers) {
  if (!TEXT.test(type) || buf.length < 1024) return buf;
  const ae = String(nreq.headers['accept-encoding'] ?? '');
  headers.Vary = 'Accept-Encoding';
  if (/\bbr\b/.test(ae)) { headers['Content-Encoding'] = 'br'; return brotliCompressSync(buf, { params: { [zc.BROTLI_PARAM_QUALITY]: 5 } }); }
  if (/\bgzip\b/.test(ae)) { headers['Content-Encoding'] = 'gzip'; return gzipSync(buf); }
  return buf;
}
async function send(nreq, nres, url, r) {
  let body = r.body ? Buffer.from(await r.arrayBuffer()) : null;
  const headers = baseHeaders(url, r.tpl); // a page answered here (the sign-up form shown again) hashes its built template, never the filled page (D24 (2))
  r.headers.forEach((v, k) => { if (k !== 'set-cookie') headers[k] = v; });
  const cookies = r.headers.getSetCookie();
  if (cookies.length) headers['Set-Cookie'] = cookies;
  if (body) body = compress(nreq, body, headers['content-type'] ?? '', headers);
  nres.writeHead(r.status, headers);
  nres.end(nreq.method === 'HEAD' ? undefined : body);
}

// ---------- static files ----------
const statSafe = (f) => { try { return statSync(f); } catch { return null; } };
function resolveFile(pathname) {
  let p;
  try { p = decodeURIComponent(pathname); } catch { return null; }
  const root = DIST, file = normalize(join(root, p));
  return file === root || file.startsWith(root + sep) ? file : null;
}
function notFound(nreq, nres, url) {
  const f = join(DIST, '404.html');
  let body = existsSync(f) ? readFileSync(f) : undefined;
  const tpl = body?.toString('utf8');
  if (tpl) { try { body = Buffer.from(injectMarkers(tpl, getState(db), etDay(), liveParts(url))); } catch (e) { log('inject failed, serving the static 404', e.message); } } // opening hours and the open-now strip, like any page
  nres.writeHead(404, { ...baseHeaders(url, tpl), 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }); // hashes the 404 page's own inline scripts
  nres.end(nreq.method === 'HEAD' ? undefined : body);
}
async function serveStatic(nreq, nres, url) {
  const p = url.pathname;
  // Dotfiles and dot-folders (.env, .git, .data ...) are never served; only /.well-known/ is allowed.
  let decoded = p;
  try { decoded = decodeURIComponent(p); } catch { return notFound(nreq, nres, url); }
  if (decoded.split('/').some((seg, i, all) => seg.startsWith('.') && !(seg === '.well-known' && i === 1 && all.length > 2))) return notFound(nreq, nres, url);
  let file = resolveFile(p);
  let st = file && statSafe(file);
  if (st?.isDirectory()) {
    if (!p.endsWith('/')) { nres.writeHead(301, { ...baseHeaders(url), Location: `/${p.replace(/^\/+/, '')}/${url.search}` }); return nres.end(); }
    file = join(file, 'index.html');
    st = statSafe(file);
  }
  const up = !st?.isFile() && /^\/media\/photos\/(photo-\d{8}-[0-9a-f]{6}(-800)?\.webp)$/.exec(decoded); // uploaded pictures live in DATA/photos
  if (up) { const f = join(PHOTOS, up[1]); if (f.startsWith(PHOTOS + sep) && statSafe(f)?.isFile()) { file = f; st = statSafe(f); } }
  if (!st?.isFile()) return notFound(nreq, nres, url);
  const type = TYPES[extname(file)] ?? 'application/octet-stream';
  const headers = { ...baseHeaders(url), 'Content-Type': type };

  if (type.startsWith('text/html')) {
    const isAdmin = p.startsWith('/admin');
    let html = readFileSync(file, 'utf8');
    const tpl = html; // CSP hashes come from the built page, never from what was injected into it
    if (!isAdmin) { try { html = injectMarkers(html, getState(db), etDay(), liveParts(url)); } catch (e) { log('inject failed, serving the static page', e.message); } } // fail open: static HTML is a correct default
    headers['Cache-Control'] = isAdmin ? 'no-store' : 'no-cache';
    if (isAdmin) headers['X-Robots-Tag'] = 'noindex, nofollow';
    Object.assign(headers, baseHeaders(url, tpl)); // CSP hashes for the built page's own inline scripts: injected script text gets none
    const body = compress(nreq, Buffer.from(html), type, headers);
    nres.writeHead(200, headers);
    if (!isAdmin) stats.record(nreq, nres);
    return nres.end(nreq.method === 'HEAD' ? undefined : body);
  }
  headers['Cache-Control'] = p.startsWith('/_astro/') || file.startsWith(PHOTOS + sep) ? 'public, max-age=31536000, immutable' : 'public, max-age=86400';
  headers['Last-Modified'] = st.mtime.toUTCString();
  if (nreq.headers['if-modified-since'] && new Date(nreq.headers['if-modified-since']) >= new Date(st.mtime.toUTCString())) { nres.writeHead(304, headers); return nres.end(); }
  if (TEXT.test(type)) {
    const body = compress(nreq, readFileSync(file), type, headers);
    nres.writeHead(200, headers);
    return nres.end(nreq.method === 'HEAD' ? undefined : body);
  }
  return sendRange(nreq, nres, file, st, headers);
}
/** Video needs byte ranges (iPhone Safari won't play an mp4 without them). */
function sendRange(nreq, nres, file, st, headers) {
  headers['Accept-Ranges'] = 'bytes';
  const range = /^bytes=(\d*)-(\d*)$/.exec(nreq.headers.range ?? '');
  let start = 0, end = st.size - 1, status = 200;
  if (range) {
    start = range[1] ? +range[1] : Math.max(0, st.size - +range[2]);
    end = range[1] && range[2] ? Math.min(+range[2], st.size - 1) : st.size - 1;
    if (start > end || start >= st.size) { nres.writeHead(416, { ...headers, 'Content-Range': `bytes */${st.size}` }); return nres.end(); }
    status = 206;
    headers['Content-Range'] = `bytes ${start}-${end}/${st.size}`;
  }
  headers['Content-Length'] = end - start + 1;
  nres.writeHead(status, headers);
  if (nreq.method === 'HEAD') return nres.end();
  createReadStream(file, { start, end }).on('error', () => nres.destroy()).pipe(nres);
}

// ---------- live public pages (D11, D16): rendered from the database on every request, so admin edits and cancellations show without a rebuild ----------
/** The store facts as saved in admin (hours, address, links ...), read on every request so an edit shows without a restart. */
const facts = () => getStore(db);
const FAMILY = Object.fromEntries(GAMES.map((g) => [g.id, g.family]));
/** The data the renderers read. ?now=YYYY-MM-DDTHH:MM (store time) sets the clock outside production, for screenshots and tests. */
function publicCtx(url) {
  const t = url.searchParams.get('now'), keepNow = !PROD && NOW_TEST.test(t ?? '') && realDay(t.slice(0, 10)) ? t : null;
  return { store: facts(), series: listSeries(db), exceptions: listExceptions(db), counts: regs.countsMap(db), games: GAMES, releases, now: etNow(keepNow ?? new Date()), keepNow, query: url.searchParams, baseUrl: PUBLIC_URL };
}
/** Marker name -> function, for injectMarkers(); the database is read only when a page actually has a marker. */
function liveParts(url, more = {}) {
  let c;
  const ctx = () => (c ??= publicCtx(url));
  const script = (obj) => view.h`<script type="application/ld+json">${view.safe(ldScript(obj))}</script>`;
  return { strip: () => view.strip(ctx()), hero: () => view.hero(ctx()), week: () => view.week(ctx()), cedh: () => view.cedh(ctx()), releases: () => view.releases(ctx()), hours: () => view.hours(ctx()),
    events: () => view.events(ctx()), nights: () => view.nights(ctx()), 'today-hours': () => view.todayHours(ctx()), 'shop-ld': () => script(shopLd(ctx().store, PUBLIC_URL)), origin: () => view.h`${PUBLIC_URL}`,
    bar: () => facts_view.bar(ctx()), 'foot-addr': () => facts_view.footAddr(ctx()), socials: () => facts_view.socials(ctx()), 'cedh-live': () => facts_view.cedhLive(ctx()), turnout: () => facts_view.turnout(ctx()), visit: () => facts_view.visit(ctx()), discord: () => facts_view.discord(ctx()),
    'nh-toc': () => facts_view.nhToc(ctx()), 'nh-free': () => facts_view.nhFree(ctx()), 'free-play': () => facts_view.freePlay(ctx()), 'nh-kids': () => facts_view.nhKids(ctx()), 'nh-here': () => facts_view.nhHere(ctx()), 'nh-ask': () => facts_view.nhAsk(ctx()), 'nh-directions': () => facts_view.nhDirections(ctx()),
    ...Object.fromEntries(Object.entries(more).map(([k, f]) => [k, () => f(ctx())])) };
}
/** tpl = the built page before injectMarkers(): only its inline scripts get CSP hashes. */
function sendHtml(nreq, nres, url, html, tpl, status = 200, extra = null) {
  const headers = { ...baseHeaders(url, tpl), 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', ...extra };
  const body = compress(nreq, Buffer.from(html), 'text/html; charset=utf-8', headers);
  nres.writeHead(status, headers);
  if (status === 200 && !extra) stats.record(nreq, nres); // private pages (extra headers) are not counted: their path holds a secret
  nres.end(nreq.method === 'HEAD' ? undefined : body);
}
function sendText(nreq, nres, url, body, type, extra = {}) {
  const headers = { ...baseHeaders(url), 'Content-Type': type, 'Cache-Control': 'no-cache', ...extra };
  const buf = compress(nreq, Buffer.from(body), type, headers);
  nres.writeHead(200, headers);
  nres.end(nreq.method === 'HEAD' ? undefined : buf);
}
const template = (name) => { try { return readFileSync(join(DIST, name, 'index.html'), 'utf8'); } catch { return null; } };

/** One event date as a page: { status, html, tpl } | { redirect } | null (no template). dateParam null = the series' next date (D16). form = the sign-up form's state after a refused post. */
function eventDoc(url, id, dateParam, timeParam, form = {}) {
  const tpl = template('event-page');
  if (!tpl) return null;
  const ctx = publicCtx(url), s = ctx.series.find((x) => x.id === id && x.enabled !== false), store = ctx.store;
  const page = (status, body, head = view.h`<title>Event not found | ${store.name}</title>`) => {
    let out = injectMarkers(tpl, getState(db), etDay(), { ...liveParts(url), head: () => head, event: () => body });
    if (status !== 200) out = out.replace('</head>', '<meta name="robots" content="noindex"></head>');
    return { status, html: out, tpl };
  };
  if (!s) return page(404, view.eventMissing(ctx, null));
  if (dateParam === null) {
    const next = view.nextDate(ctx, s);
    if (!next) return page(404, view.eventMissing(ctx, s));
    return { redirect: ctx.keepNow ? `${view.eventPath(next)}&now=${encodeURIComponent(ctx.keepNow)}` : view.eventPath(next) };
  }
  const o = view.findOccurrence(ctx, s, dateParam, timeParam);
  if (!o) return page(404, view.eventMissing(ctx, s));
  const st = seatState(o, ctx.now.m, ctx.counts.get(`${o.seriesId}|${o.slot}`)), abs = PUBLIC_URL + view.eventPath(o), ld = eventLd(o, st, store, abs);
  const desc = `${o.title} at ${store.name} in ${store.address.city}, ${store.address.region} on ${view.fmtLong(o.date)}. ${view.timeLine(o)}.`;
  const head = view.h`<title>${`${o.title}, ${view.fmtLong(o.date)}${o.cancelled ? ' (cancelled)' : ''} | ${store.name}`}</title><meta name="description" content="${desc}"><link rel="canonical" href="${abs}"><meta property="og:title" content="${`${o.title}, ${view.fmtLong(o.date)}`}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${abs}">${ld ? view.h`<script type="application/ld+json">${view.safe(ldScript(ld))}</script>` : ''}`;
  return page(200, view.eventPage(ctx, o, form), head);
}
function eventPage(nreq, nres, url, id) {
  const d = eventDoc(url, id, url.searchParams.get('date'), url.searchParams.get('time'));
  if (!d) return notFound(nreq, nres, url);
  if (d.redirect) { nres.writeHead(302, { ...baseHeaders(url), Location: d.redirect }); return nres.end(); }
  return sendHtml(nreq, nres, url, d.html, d.tpl, d.status);
}

// ---------- sign-ups (P2.4a): the public form, the player's private page and the player's own cancel ----------
const ipOf = (nreq) => clientIp({ headers: { get: (k) => (k === 'x-mg-peer' ? nreq.socket.remoteAddress : nreq.headers[k]) } });
const SIGNUP_PAGES = { __proto__: null, '/events/': '/events/' };
const occurrenceOf = (ctx, series, slot) => { const s = ctx.series.find((x) => x.id === series); const o = s && view.findOccurrence(ctx, s, slot, null); return o && o.slot === slot ? o : null; };
const typed = (f) => Object.fromEntries(['name', 'email', 'phone', 'playerId'].map((k) => [k, regs.line(f[k], 200)])); // what the form shows again after a refusal
/** POST /api/signup: behind publicForm() (origin check, honeypot, 303 for a plain form). JSON callers get { ok, status, position, link }. */
async function signupApi(req, url) {
  let tpl;
  const res = await publicForm(req, { origins: origins(url), pages: SIGNUP_PAGES, onSpam: (ip) => audit.event('signup_spam', '', ip, 'honeypot filled, nothing stored'), handle: (f, ip) => {
    const again = (status, error, message, errors = {}) => { // the event page again, form filled in, for a browser without JavaScript
      const d = eventDoc(url, String(f.series ?? ''), String(f.slot ?? ''), null, { values: typed(f), errors, message });
      tpl = d?.tpl;
      return { status: d?.status && d.status !== 200 ? d.status : status, body: { error, message, errors }, html: d?.html };
    };
    if (!allow(`su:${ip}`, 30)) return again(429, 'rate', 'Too many tries. Wait a minute and try again.');
    const ctx = publicCtx(url), o = occurrenceOf(ctx, String(f.series ?? ''), String(f.slot ?? ''));
    if (!o) return again(404, 'not_found', 'We couldn’t find that event date.');
    const r = regs.register(db, o, f, { nowM: ctx.now.m });
    if (r.ok) {
      const q = `?new=1${r.raced ? '&raced=1' : ''}${ctx.keepNow ? `&now=${encodeURIComponent(ctx.keepNow)}` : ''}`;
      return { status: 200, body: { ok: true, status: r.status, position: r.position, taken: r.taken, raced: r.raced, link: `${PUBLIC_URL}/signup/${r.token}` }, location: `/signup/${r.token}${q}` };
    }
    if (r.error === 'invalid') return again(422, 'invalid', 'Check the form and try again.', r.errors);
    if (r.error === 'closed') return again(409, 'closed', `Sign-ups closed at ${view.fmtTime(r.cutoffHm)}. Walk in if seats are left.`);
    if (r.error === 'dup') return again(409, 'dup', `You’re already signed up for this one, as ${r.existing}. Use your private link to check or cancel, or ask at the counter.`);
    if (r.error === 'full') return again(409, 'full', 'This one is full. Ask at the counter about open seats.');
    if (r.error === 'past') return again(409, 'past', 'This date has passed.');
    return again(409, 'nosignup', 'You can’t sign up for this one here. Ask at the counter.');
  } });
  return Object.assign(res, { tpl });
}
/** POST /api/signup/cancel {token}: the player frees their own seat; the next on the waitlist moves in. Only the one registration behind the token is touched. */
function signupCancelApi(req, url, undo = false) { // undo: POST /api/signup/undo-cancel {token}, G6: the player takes their own cancel back (regs.UNDO_MS)
  return publicForm(req, { origins: origins(url), pages: SIGNUP_PAGES, handle: (f, ip) => {
    if (!allow(`tok:${ip}`, 120)) return { status: 429, body: { error: 'rate' } };
    const token = String(f.token ?? ''), reg = regs.byToken(db, token), ctx = publicCtx(url), o = reg && occurrenceOf(ctx, reg.series, reg.slot);
    if (!o || endM(o) <= ctx.now.m) return { status: 404, body: { error: 'not_found' } };
    const r = undo ? regs.undoCancel(db, o, reg.id, { self: true }) : regs.cancel(db, o, reg.id, { self: true });
    return { status: r.ok ? 200 : 409, body: r.ok ? { ok: true } : { error: r.error }, location: `/signup/${token}${ctx.keepNow ? `?now=${encodeURIComponent(ctx.keepNow)}` : ''}` };
  } });
}
/** GET /signup/<token>: the player's own page (D26): seat or waitlist place, Cancel. noindex, no Referer, not counted in the stats. */
function mySignup(nreq, nres, url, token) {
  const tpl = template('event-page');
  if (!tpl) return notFound(nreq, nres, url);
  const ctx = publicCtx(url), priv = { 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store' };
  const page = (status, body, title) => sendHtml(nreq, nres, url, injectMarkers(tpl, getState(db), etDay(), { ...liveParts(url), head: () => view.h`<title>${title} | ${ctx.store.name}</title><meta name="robots" content="noindex">`, event: () => body }), tpl, status, priv);
  const gone = (why) => page(404, view.signupGone(ctx, 'We couldn’t find that sign-up.', why), 'Sign-up not found');
  if (!allow(`tok:${ipOf(nreq)}`, 120)) return page(429, view.signupGone(ctx, 'Too many tries.', 'Wait a minute and try again.'), 'Too many tries');
  const reg = regs.byToken(db, token), o = reg && occurrenceOf(ctx, reg.series, reg.slot);
  if (!reg) return gone('The link may be wrong, or the event is over and your details were deleted.');
  if (!o || endM(o) <= ctx.now.m) return gone('That event is over, so this link has stopped working.');
  const q = url.searchParams;
  return page(200, view.signupPage(ctx, o, { ...reg, token }, { taken: regs.counts(db, reg.series, reg.slot).in, isNew: q.has('new'), raced: q.has('raced'), link: `${PUBLIC_URL}/signup/${token}` }), 'Your sign-up');
}

/** Server-made public routes: the calendar feed, one-date calendar files, sitemap.xml and the event date pages. Returns true when it answered. */
async function publicRoute(nreq, nres, url) {
  const p = url.pathname;
  if (p === '/events.ics') {
    const ctx = publicCtx(url), game = url.searchParams.get('game');
    const occs = feedOccurrences(ctx.series, ctx.exceptions, ctx.now.ymd, 120, GAMES.some((g) => g.id === game) ? game : null, FAMILY);
    sendText(nreq, nres, url, calendar(occs, ctx.store, PUBLIC_URL, { name: `${ctx.store.name} events` }), TYPES['.ics']);
    return true;
  }
  if (p === '/sitemap.xml') { const ctx = publicCtx(url); sendText(nreq, nres, url, sitemap(ctx.series, ctx.exceptions, PUBLIC_URL, ctx.now.ymd), TYPES['.xml']); return true; }
  if (p === '/event-page' || p.startsWith('/event-page/')) { notFound(nreq, nres, url); return true; } // the built template, not a page
  let m = /^\/events\/([a-z0-9][a-z0-9-]{0,59})\.ics$/.exec(p);
  if (m) {
    const ctx = publicCtx(url), s = ctx.series.find((x) => x.id === m[1] && x.enabled !== false);
    if (s && !url.searchParams.has('date')) { // no date: the whole series, the next 120 days
      sendText(nreq, nres, url, calendar(feedOccurrences([s], ctx.exceptions, ctx.now.ymd, 120, null), ctx.store, PUBLIC_URL, { name: s.title }), TYPES['.ics'], { 'Content-Disposition': `attachment; filename="mulligan-${s.id}.ics"` });
      return true;
    }
    const o = s && view.findOccurrence(ctx, s, url.searchParams.get('date'), url.searchParams.get('time'));
    if (!o) { notFound(nreq, nres, url); return true; }
    sendText(nreq, nres, url, calendar([o], ctx.store, PUBLIC_URL, { name: o.title }), TYPES['.ics'], { 'Content-Disposition': `attachment; filename="mulligan-${s.id}-${o.date}.ics"` });
    return true;
  }
  m = /^\/events\/([a-z0-9][a-z0-9-]{0,59})\/?$/.exec(p);
  if (m) { eventPage(nreq, nres, url, m[1]); return true; }
  m = /^\/signup\/([A-Za-z0-9_-]{20,64})\/?$/.exec(p);
  if (m) { mySignup(nreq, nres, url, m[1]); return true; }
  return false;
}

// ---------- sign-in ----------
const origins = (url) => [url.origin, PUBLIC_URL];
const sessionVersion = () => adminRow(db)?.session_v ?? 0;
const secure = (url) => PROD || url.protocol === 'https:';
const sessionCookie = (url) => cookieHeader(signSession(adminRow(db).username, Date.now() + SESSION_DAYS * 86400e3, SESSION_SECRET, sessionVersion()), { secure: secure(url) });
const signedIn = (req, url) => { const row = adminRow(db); return row ? verifySession(readCookie(req.headers.get('cookie'), secure(url)), SESSION_SECRET, { name: row.username, version: row.session_v }) : null; };

const WRONG = 'That username and password do not match. Check them and try again.';
async function login(req, url) {
  if (!sameOrigin(req, ...origins(url))) return bad('origin', 403);
  const b = await req.json().catch(() => null);
  const username = String(b?.username ?? '').trim().toLowerCase().slice(0, 64);
  const ip = clientIp(req);
  // Lockout with backoff, per address and per username+address. Not per username alone: a stranger could lock the real admin out that way.
  const keys = [`ip:${ip}`, `user:${username}|${ip}`];
  if (keys.some((k) => locked(k))) { audit.event('login_blocked', username, ip, 'locked out, try refused'); return json({ error: 'locked', message: 'Too many tries. Wait a few minutes, then try again.' }, 429); }
  if (!(await checkLogin(db, username, String(b?.password ?? '').slice(0, 200)))) { // async scrypt: same cost for unknown names, never blocks other requests
    keys.forEach((k) => recordFailure(k));
    audit.event('login_fail', username, ip, 'wrong username or password');
    if (keys.some((k) => locked(k))) audit.event('lockout', username, ip, 'too many wrong tries, backing off');
    return json({ error: 'wrong', message: WRONG }, 401);
  }
  keys.forEach((k) => clearFailures(k));
  audit.event('login_ok', username, ip);
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(url) });
}

// ---------- API ----------
// Public forms go through publicForm() in src/forms.js (origin check, honeypot, no-JS 303 to an allow-listed page).
async function route(req, url) {
  const p = url.pathname;
  if (p === '/api/login' && req.method === 'POST') return login(req, url);
  if (p === '/api/signup' && req.method === 'POST') return signupApi(req, url);
  if (p === '/api/signup/cancel' && req.method === 'POST') return signupCancelApi(req, url);
  if (p === '/api/signup/undo-cancel' && req.method === 'POST') return signupCancelApi(req, url, true);
  if (p === '/api/logout' && req.method === 'POST') {
    if (!sameOrigin(req, ...origins(url))) return bad('origin', 403);
    const who = signedIn(req, url);
    if (who) { db.prepare('UPDATE admin SET session_v = session_v + 1 WHERE id = 1').run(); audit.event('logout', who, clientIp(req), 'all sessions ended'); } // ends every session, so a copied cookie dies too
    return json({ ok: true }, 200, { 'Set-Cookie': cookieHeader('', { secure: secure(url), maxAge: 0 }) });
  }
  if (p.startsWith('/api/admin/')) {
    const user = signedIn(req, url);
    if (!user) return bad('signed_out', 401);
    if (req.method !== 'GET' && !sameOrigin(req, ...origins(url))) return bad('origin', 403);
    return adminApi(req, url, user);
  }
  return bad('not_found', 404);
}

/** Width and height of a plain WebP, or null when it is not one: bad RIFF size, no VP8 chunk first, or an animation, EXIF or XMP chunk. */
function webpInfo(b) {
  if (b.length < 30 || b.toString('latin1', 0, 4) !== 'RIFF' || b.toString('latin1', 8, 12) !== 'WEBP' || b.readUInt32LE(4) !== b.length - 8) return null;
  for (let o = 12, n; o + 8 <= b.length; o += 8 + n + (n & 1)) { n = b.readUInt32LE(o + 4); if (/^(ANIM|ANMF|EXIF|XMP )$/.test(b.toString('latin1', o, o + 4))) return null; }
  const t = b.toString('latin1', 12, 16);
  if (t === 'VP8 ') return b[23] === 0x9d && b[24] === 1 && b[25] === 0x2a ? { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff } : null;
  if (t === 'VP8L') { const v = b.readUInt32LE(21); return b[20] === 0x2f ? { w: (v & 0x3fff) + 1, h: ((v >>> 14) & 0x3fff) + 1 } : null; }
  return t === 'VP8X' ? { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 } : null;
}
const DATA_IMG = /^data:image\/(?:webp|jpeg|png);base64,([A-Za-z0-9+/]+=*)$/;
/** What the bytes are, by their first bytes (the type the client claims is ignored). Safari cannot make WebP, so JPEG and PNG are accepted too. */
const imageKind = (b) => (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff ? 'jpeg' : b.length > 12 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? 'png'
  : b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP' ? 'webp' : null);
/** A base64 JPEG, PNG or WebP data URL of exactly w x h, as WebP bytes; otherwise the error key. With sharp every picture is decoded and re-encoded to WebP (metadata and hidden data dropped);
 *  without sharp only a plain WebP is kept as it is. */
async function takeImage(v, w, h) {
  const m = typeof v === 'string' ? DATA_IMG.exec(v) : null;
  if (!m) return 'file_type';
  let buf = Buffer.from(m[1], 'base64');
  if (buf.length > 900 * 1024) return 'file_size';
  const kind = imageKind(buf);
  if (!kind) return 'file_type';
  if (!sharp) { const i = kind === 'webp' && buf.length <= 400 * 1024 ? webpInfo(buf) : null; return i && i.w === w && i.h === h ? buf : 'file_type'; }
  if (kind === 'webp' && !webpInfo(buf)) return 'file_type'; // animated, or with EXIF / XMP chunks
  try {
    const lim = { limitInputPixels: w * h }; // a decompression bomb (tiny file, huge picture) is refused from its header, never decoded
    const i = await sharp(buf, lim).metadata();
    if (i.width !== w || i.height !== h) return 'file_type';
    buf = await sharp(buf, lim).webp({ quality: 82 }).toBuffer();
  } catch { return 'file_type'; }
  return buf.length > 400 * 1024 ? 'file_size' : buf;
}
async function uploadPhoto(body, ip, note, photoList) {
  const stop = (error, why, status = 400) => { note('photo_upload_blocked', why); return bad(error, status); };
  if (!allow(`up:${ip}`, 20)) return stop('rate', 'rate', 429);
  const big = await takeImage(body?.big, 1024, 768), small = await takeImage(body?.small, 800, 600);
  for (const x of [big, small]) if (typeof x === 'string') return stop(x, x === 'file_size' ? 'size' : 'type');
  const have = ls(PHOTOS).map((f) => statSafe(join(PHOTOS, f))?.size ?? 0);
  if (have.length >= 600 || have.reduce((a, b) => a + b, 0) + big.length + small.length > 100 * 1024 * 1024) { log('upload: quota reached'); return stop('upload', 'quota'); }
  mkdirSync(PHOTOS, { recursive: true, mode: 0o755 });
  let name;
  for (let i = 0; i < 3 && !name; i++) {
    const n = `photo-${etDay().replaceAll('-', '')}-${randomBytes(3).toString('hex')}.webp`, wrote = [];
    try { for (const [f, b] of [[n.replace('.', '-800.'), small], [n, big]]) { writeFileSync(join(PHOTOS, f), b, { flag: 'wx', mode: 0o644 }); wrote.push(f); } name = n; } // small first, big last
    catch (e) { for (const f of wrote) try { unlinkSync(join(PHOTOS, f)); } catch {} if (e.code !== 'EEXIST') { log('upload: write failed', e.message); break; } }
  }
  if (!name) return bad('upload', 500);
  note('photo_upload', `${name} ${big.length} bytes`);
  return json({ name, photos: photoList() });
}

// ---------- event series (admin) ----------
const invalid = (errors) => json({ error: 'invalid', errors }, 422);
/** GET series | POST series | PUT series/:id | DELETE series/:id | POST series/:id/exceptions | DELETE series/:id/exceptions/:date | GET series/:id/copy?date=
 *  All of it is behind the admin session and (for writes) the origin check in route(); bodies are capped in the HTTP layer. */
function seriesApi(req, url, body, [id, sub, date], ip, note) {
  const m = req.method;
  if (m !== 'GET' && !allow(`ev:${ip}`, 600)) { note('events_blocked', 'rate limit'); return bad('rate', 429); }
  const plain = body && typeof body === 'object' && !Array.isArray(body);
  if (!id) {
    if (m === 'GET') {
      const series = listSeries(db), exceptions = listExceptions(db), today = etDay(), to = new Date(Date.parse(today) + 400 * 864e5).toISOString().slice(0, 10);
      const upcoming = Object.fromEntries(series.map((s) => [s.id, occurrences(s, today, to, exceptions).slice(0, 8).map((o) => ({ date: o.date, slot: o.slot, originalDate: o.originalDate, start: o.start, end: o.end, capacity: o.capacity, cancelled: o.cancelled, moved: o.moved, changed: o.changed, note: o.note }))]));
      return json({ series, exceptions, upcoming, today, games: GAMES, kinds: KINDS, signups: SIGNUPS, icons: ICONS });
    }
    if (m !== 'POST') return bad('not_found', 404);
    if (!plain) return bad('body');
    const errors = validateSeries(body);
    if (Object.keys(errors).length) return invalid(errors);
    const s = cleanSeries({ ...body, id: body.id || newId(body.title, new Set(listSeries(db).map((x) => x.id))) });
    if (getSeries(db, s.id)) return invalid({ id: 'That id is already used.' });
    putSeries(db, s);
    note('series_create', s.id);
    return json({ series: s }, 201);
  }
  const cur = getSeries(db, id);
  if (!cur) return bad('not_found', 404);
  if (!sub) {
    if (m === 'GET') return json({ series: cur, exceptions: listExceptions(db, id) });
    if (m === 'DELETE') {
      if (regs.heldSlots(db, id, publicCtx(url).now.ymd).length) return json({ error: 'signed_up', message: 'People are signed up for upcoming dates of this event. Hide it instead, or cancel their sign-ups first.' }, 409); // G4
      deleteSeries(db, id); note('series_delete', id); return json({ ok: true });
    }
    if (m !== 'PUT') return bad('not_found', 404);
    if (!plain) return bad('body');
    const errors = validateSeries({ ...body, id });
    if (Object.keys(errors).length) return invalid(errors);
    const s = cleanSeries({ ...body, id });
    // G4: an edit that makes a date with sign-ups disappear (weekday, one-off date, slot time or last date changed) would lose those seats: refused, no override.
    const lost = regs.heldSlots(db, id, publicCtx(url).now.ymd).filter((x) => hasSlot(cur, x.slot) && !hasSlot(s, x.slot));
    if (lost.length) return json({ error: 'signed_up', slots: lost, message: `People are signed up for ${lost.map((x) => `${view.fmtDate(x.slot.slice(0, 10))}${x.slot.length > 10 ? ` ${view.fmtTime(x.slot.slice(11))}` : ''} (${x.n})`).join(', ')}, and this change would take those dates away. Keep them: set this event's last date after them and make a new event for the change, or move a single date with Change this date.` }, 409);
    // Stored one-date changes whose slot this edit makes disappear (time or weekday moved): the editor must confirm, then they are removed.
    const orphans = listExceptions(db, id).filter((x) => hasSlot(cur, x.date) && !hasSlot(s, x.date));
    if (orphans.length && body.confirmOrphans !== true) return json({ error: 'orphans', orphans }, 409);
    putSeries(db, s); // save first: a failed save must not have removed the cancellations already
    for (const x of orphans) deleteException(db, id, x.date);
    repromote(url);
    note('series_update', orphans.length ? `${id} (removed ${orphans.length} one-date changes)` : id);
    return json({ series: s });
  }
  if (sub === 'exceptions' && m === 'POST') {
    if (!plain) return bad('body');
    const errors = validateException(body);
    if (!errors.date && !errors.form && !hasSlot(cur, body.date)) errors.date = 'The event does not happen on that date.';
    if (Object.keys(errors).length) return invalid(errors);
    const x = cleanException(id, body, publicCtx(url).now.ymd); // the test clock (?now=) outside production
    putException(db, x);
    regs.setEventDay(db, id, x.date, x.movedTo || x.date.slice(0, 10)); // a moved date: contacts are kept until N days after the day it really happens
    repromote(url);
    note('exception_set', `${id} ${x.date} ${x.type}`);
    return json({ exception: x });
  }
  if (sub === 'exceptions' && m === 'DELETE') {
    if (!deleteException(db, id, date ?? '')) return bad('not_found', 404);
    regs.setEventDay(db, id, date, date.slice(0, 10));
    repromote(url);
    note('exception_clear', `${id} ${date}`);
    return json({ ok: true });
  }
  if (sub === 'copy' && m === 'GET') {
    const d = url.searchParams.get('date') ?? '';
    const t = copyText(cur, d, PUBLIC_URL, listExceptions(db, id));
    return t === null ? bad('not_found', 404) : json({ text: t });
  }
  return bad('not_found', 404);
}

// ---------- store facts (admin): GET store | PUT store. Session + origin check come from route(); the body is capped here as well ----------
const MAX_STORE_BODY = 32 * 1024;
function storeApi(req, url, body, ip, note, photoFiles) {
  const m = req.method;
  if (m === 'GET') return json({ store: facts(), links: LINKS });
  if (m !== 'PUT') return bad('not_found', 404);
  if (!allow(`store:${ip}`, 120)) { note('store_blocked', 'rate limit'); return bad('rate', 429); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || JSON.stringify(body).length > MAX_STORE_BODY) return bad('body');
  const today = publicCtx(url).now.ymd, prev = facts(), errors = validateStore(body, today, prev);
  if (body.photo && !errors.photo && !pickablePhotos(photoFiles()).includes(body.photo)) errors.photo = 'That picture is not available any more. Pick another one.';
  if (Object.keys(errors).length) return invalid(errors);
  const next = cleanStore(body, prev, today);
  putStore(db, next);
  note('store_update', ['hours', 'hourOverrides', 'photo', 'links', 'address', 'phone', 'email', 'parking', 'kids', 'freePlay', 'tagline'].filter((k) => JSON.stringify(prev[k] ?? null) !== JSON.stringify(next[k] ?? null)).join(', ') || 'no change');
  return json({ store: next });
}

// ---------- event templates (admin): the built-ins from events.js plus staff-saved ones in kv key "templates" ----------
const MAX_TEMPLATES = 40;
const savedTemplates = () => JSON.parse(db.prepare("SELECT value FROM kv WHERE key = 'templates'").get()?.value ?? '[]');
const saveTemplates = (list) => db.prepare("INSERT INTO kv (key, value) VALUES ('templates', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(JSON.stringify(list));
/** GET templates | POST templates {name, fields} | DELETE templates/:id (staff-saved ones only). Same session, origin and rate-limit rules as series. */
function templatesApi(req, body, [id], ip, note) {
  const m = req.method;
  if (m !== 'GET' && !allow(`ev:${ip}`, 600)) { note('events_blocked', 'rate limit'); return bad('rate', 429); }
  if (!id && m === 'GET') return json({ builtin: TEMPLATES, yours: savedTemplates() });
  if (!id && m === 'POST') {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return bad('body');
    const errors = validateTemplate(body);
    if (Object.keys(errors).length) return invalid(errors);
    const list = savedTemplates();
    if (list.length >= MAX_TEMPLATES) return invalid({ name: 'You have the most templates allowed. Delete one first.' });
    const t = cleanTemplate(body, 'u-' + randomBytes(4).toString('hex'));
    saveTemplates([t, ...list]);
    note('template_create', t.id);
    return json({ template: t }, 201);
  }
  if (id && m === 'DELETE') {
    const list = savedTemplates();
    if (!list.some((t) => t.id === id)) return bad('not_found', 404);
    saveTemplates(list.filter((t) => t.id !== id));
    note('template_delete', id);
    return json({ ok: true });
  }
  return bad('not_found', 404);
}

// ---------- roster (admin): GET roster/:series/:slot | POST roster/:series/:slot/walkin | POST roster/:series/:slot/:id/<action> ----------
// also POST .../prereg {name, email?, phone?, payment?, anyway?} (G1), .../headcount {delta | n} (G10, walk-in-only events), walkin {anyway} (seat anyway on a name match),
// and .../:id/cancel {undo: true} (G6). actions: checkin {on}, payment {payment}, erase, cancel, noshow {on}, movein, move {dir: -1|1}. Session + origin check come from route(). Every reply is the whole roster again.
function rosterApi(req, url, body, [series, slot, id, action], ip, note) {
  const m = req.method;
  if (m !== 'GET' && !allow(`ro:${ip}`, 1200)) { note('roster_blocked', 'rate limit'); return bad('rate', 429); }
  const o = occurrenceOf(publicCtx(url), series ?? '', slot ?? '');
  if (!o) return bad('not_found', 404);
  const full = (result) => json({ ...(result ? { result } : {}), event: { id: o.seriesId, title: o.title, date: o.date, slot: o.slot, start: o.start, end: o.end, arriveBy: o.arriveBy, capacity: o.capacity ?? null, waitlist: !!o.waitlist, signup: o.signup, cancelled: !!o.cancelled, fee: o.fee ?? null, tool: o.tool?.name ?? null, toolUrl: o.tool?.url ?? null, toolCode: o.tool?.code ?? null, minPlayers: o.minPlayers ?? null, idLabel: regs.playerIdLabel(o.tool) },
    counts: regs.counts(db, o.seriesId, o.slot), headcount: o.signup === 'walkin' ? regs.getHeadcount(db, o.seriesId, o.slot) : null, regs: regs.roster(db, o.seriesId, o.slot) });
  if (m === 'GET' && !id) return full();
  if (m !== 'POST') return bad('not_found', 404);
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const done = (r, what) => { if (!r.ok) return json({ error: r.error ?? 'state', result: r }, 409); note(what, `${o.seriesId} ${o.slot} #${id}`); return full(r); };
  if (id === 'prereg') {
    const r = regs.addPreReg(db, o, { name: b.name, email: b.email, phone: b.phone, payment: b.payment, anyway: b.anyway === true });
    if (r.error === 'invalid') return json({ error: 'invalid', errors: r.errors }, 422);
    if (!r.ok) return json({ error: r.error, result: r }, 409);
    note('roster_prereg', `${o.seriesId} ${o.slot} ${r.status}`);
    return full(r);
  }
  if (id === 'headcount') {
    const r = regs.setHeadcount(db, o, { delta: b.delta, n: b.n });
    if (!r.ok) return json({ error: r.error, result: r }, r.error === 'bad_input' ? 422 : 409);
    note('roster_headcount', `${o.seriesId} ${o.slot} ${r.n}`);
    return full(r);
  }
  if (id === 'walkin') {
    const r = regs.walkIn(db, o, { name: b.name, mode: b.mode, payment: b.payment, anyway: b.anyway === true });
    if (!r.ok && ['name', 'name_long', 'bad_input'].includes(r.error)) return json({ error: 'invalid', errors: { name: r.error === 'name' ? 'Type a name first.' : 'Check the name and options.' } }, 422);
    if (!r.ok) return json({ error: r.error, result: r }, 409);
    note('roster_walkin', `${o.seriesId} ${o.slot} ${r.status}`);
    return full(r);
  }
  const rid = /^\d{1,9}$/.test(id ?? '') ? Number(id) : null;
  if (rid === null) return bad('not_found', 404);
  if (action === 'checkin') return done(regs.checkIn(db, o, rid, b.on !== false), b.on === false ? 'roster_uncheck' : 'roster_checkin');
  if (action === 'payment') return done(regs.setPayment(db, o, rid, b.payment), 'roster_payment');
  if (action === 'cancel') return done(b.undo === true ? regs.undoCancel(db, o, rid) : regs.cancel(db, o, rid), b.undo === true ? 'roster_cancel_undo' : 'roster_cancel');
  if (action === 'noshow') return done(b.on === false ? regs.undoNoShow(db, o, rid) : regs.noShow(db, o, rid), b.on === false ? 'roster_noshow_undo' : 'roster_noshow');
  if (action === 'erase') return done(regs.erase(db, o, rid), 'roster_erase'); // "remove my details" at the counter
  if (action === 'movein') return done(regs.moveIn(db, o, rid), 'roster_movein');
  if (action === 'move') return done(regs.moveWaitlist(db, o, rid, b.dir), 'roster_move');
  return bad('not_found', 404);
}
// ---------- inventory and preorders (admin, P2.5): GET inventory?look= | GET inventory/summary | GET inventory/products.csv | POST products | PUT/DELETE products/:id |
// POST products/:id/moves {qty, reason, note} | POST products/:id/count {n} | GET/PUT use/:series {use} | GET/POST preorders | POST preorders/arrive-all {product} | POST preorders/:id/status {status}.
// Session + origin check come from route(). Customer contact details never leave these admin-only routes.
const MOVE_ERR = { short: 'There isn’t that much on hand.', qty: 'Use a whole number that isn’t 0.', reason: 'Pick a reason.', not_found: 'That product is gone.' };
function inventoryApi(req, url, body, [a1, a2, a3], ip, note, user) {
  const m = req.method, plain = body && typeof body === 'object' && !Array.isArray(body), b = plain ? body : {};
  if (m !== 'GET' && !allow(`inv:${ip}`, 600)) { note('inventory_blocked', 'rate limit'); return bad('rate', 429); }
  const ctx = () => publicCtx(url), id = /^\d{1,9}$/.test(a2 ?? '') ? Number(a2) : null;
  const look = inv.LOOKS.includes(Number(url.searchParams.get('look'))) ? Number(url.searchParams.get('look')) : 14;
  const pic = (withMoves) => { const c = ctx(); return inv.picture(db, { series: c.series, exceptions: c.exceptions, counts: c.counts, today: c.now.ymd, look, withMoves }); };
  if (!a1 && m === 'GET') return json({ ...pic(true), look, games: GAMES, cats: inv.CATS, reasons: inv.REASONS, looks: inv.LOOKS });
  if (a1 === 'summary' && m === 'GET') { const { alerts } = pic(false); return json({ ...alerts, arrived: inv.arrivedCount(db) }); }
  if (a1 === 'products.csv' && m === 'GET') {
    note('inventory_export', 'products csv');
    return new Response(inv.csv(inv.exportRows(db)), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="mulligan-products.csv"', 'Cache-Control': 'no-store' } });
  }
  if (a1 === 'products') {
    if (!a2 && m === 'POST') {
      if (!plain) return bad('body');
      const { errors, clean } = inv.cleanProduct(b);
      if (Object.keys(errors).length) return invalid(errors);
      const pid = inv.createProduct(db, clean, user);
      note('product_create', String(pid));
      return json({ product: inv.getProduct(db, pid) }, 201);
    }
    if (id === null) return bad('not_found', 404);
    if (m === 'PUT') {
      if (!plain) return bad('body');
      const { errors, clean } = inv.cleanProduct(b);
      if (Object.keys(errors).length) return invalid(errors);
      if (!inv.updateProduct(db, id, clean)) return bad('not_found', 404);
      note('product_update', String(id));
      return json({ product: inv.getProduct(db, id) });
    }
    if (m === 'DELETE') {
      const r = inv.deleteProduct(db, id);
      if (!r.ok) return r.error === 'not_found' ? bad('not_found', 404) : json({ error: r.error, message: 'Orders are still waiting or arrived for this product. Pick them up or cancel them first.' }, 409);
      note('product_delete', String(id));
      return json({ ok: true });
    }
    if (m === 'POST' && (a3 === 'moves' || a3 === 'count')) {
      if (!plain) return bad('body');
      const r = a3 === 'count' ? inv.countTo(db, id, b.n, user) : inv.move(db, { product: id, qty: b.qty, reason: b.reason, note: b.note, who: user });
      if (!r.ok) return json({ error: r.error, message: MOVE_ERR[r.error] ? (r.error === 'short' ? `Only ${r.onHand} on hand.` : MOVE_ERR[r.error]) : undefined, onHand: r.onHand }, r.error === 'not_found' ? 404 : 422);
      if (!r.none) note(a3 === 'count' ? 'stock_count' : 'stock_move', `${id} ${a3 === 'count' ? 'counted' : b.reason}`); // reason is checked by then; a count's body reason is never logged
      return json({ ...r, product: inv.getProduct(db, id) });
    }
    return bad('not_found', 404);
  }
  if (a1 === 'use') {
    const s = a2 && getSeries(db, a2);
    if (!s) return bad('not_found', 404);
    if (m === 'GET') return json({ use: inv.listUse(db, s.id), look, products: pic(false).products.map((p) => ({ id: p.id, name: p.name, onHand: p.onHand, reserved: p.reserved, short: p.short })) });
    if (m !== 'PUT' || !plain) return bad('not_found', 404);
    const r = inv.cleanUse(db, b.use);
    if (r.error) return json({ error: 'invalid', message: r.error }, 422);
    inv.setUse(db, s.id, r.clean);
    note('event_use_set', `${s.id} ${r.clean.length} products`);
    return json({ use: inv.listUse(db, s.id) });
  }
  if (a1 === 'preorders') {
    if (!a2 && m === 'GET') return json({ preorders: inv.listPreorders(db), products: inv.listProducts(db).filter((p) => p.category !== 'singles').map((p) => ({ id: p.id, name: p.name })) });
    if (!a2 && m === 'POST') {
      if (!plain) return bad('body');
      const r = inv.cleanPreorder(db, b);
      if (r.errors) return invalid(r.errors);
      const o = inv.createPreorder(db, r.clean);
      note('preorder_create', String(o.id));
      return json({ preorder: o }, 201);
    }
    if (a2 === 'arrive-all' && m === 'POST') { // {product} or {product, undo: [ids]} (the Undo, one transaction)
      const pid = Number.isInteger(b.product) ? b.product : -1;
      if (b.undo !== undefined && !(Array.isArray(b.undo) && b.undo.length <= 500 && b.undo.every(Number.isInteger))) return bad('body');
      const ids = inv.arriveAll(db, pid, b.undo ?? null);
      note(b.undo ? 'preorder_arrive_all_undo' : 'preorder_arrive_all', `${pid} ${ids.length} orders`);
      return json({ ids });
    }
    if (id !== null && a3 === 'status' && m === 'POST') {
      const r = inv.setStatus(db, id, b.status, user);
      if (!r.ok) return json({ error: r.error, message: r.error === 'purged' ? 'Their details were deleted after pickup, so this order can’t be reopened. Make a new preorder.' : undefined }, r.error === 'not_found' ? 404 : 409);
      note('preorder_status', `${id} ${b.status}`);
      return json({ preorder: r.order, stockNote: r.stockNote });
    }
  }
  return bad('not_found', 404);
}
/** After a series or one-date edit changed the seats: people waiting move in while a seat is free (lowering the seats bumps nobody). */
function repromote(url) {
  const ctx = publicCtx(url);
  for (const w of regs.waitingSlots(db)) { const o = occurrenceOf(ctx, w.series, w.slot); if (o) regs.promoteSlot(db, o); }
}

async function adminApi(req, url, user) {
  let segs;
  try { segs = url.pathname.slice('/api/admin/'.length).split('/').map(decodeURIComponent); } catch { return bad('bad_path', 400); } // %3A in a slot key (2026-11-08T15%3A00) must reach the database as ':'
  const [section, a1, a2, a3, a4] = segs;
  const key = `${req.method} ${section}`;
  const body = ['POST', 'PUT'].includes(req.method) ? await req.json().catch(() => null) : null;
  const ip = clientIp(req);
  const note = (what, detail = '') => audit.event(what, user, ip, detail); // who = the signed-in admin

  if (key === 'GET state') return json({ user, defaultPassword: defaultInUse(db), today: etDay() });
  if (key === 'GET stats') return json(stats.summary(url.searchParams.get('range') ?? '30d'));
  const photoList = () => { const all = photoFiles(); return pickablePhotos(all).map((name) => ({ name, thumb: all.has(name.replace('.', '-800.')) ? name.replace('.', '-800.') : name })); };
  if (key === 'GET photos') return json({ photos: photoList() });
  if (key === 'POST photos') return uploadPhoto(body, ip, note, photoList);
  if (key === 'DELETE photos' && /^photo-\d{8}-[0-9a-f]{6}\.webp$/.test(a1 ?? '')) { // only uploads; built photos are never touched
    if (facts().photo === a1 || Object.values(getState(db)).some((v) => Array.isArray(v) && v.some((x) => x?.photo === a1))) return bad('in_use', 409); // the room photo, or any saved item with this photo
    if (!existsSync(join(PHOTOS, a1))) return bad('not_found', 404);
    for (const f of [a1, a1.replace('.', '-800.')]) try { unlinkSync(join(PHOTOS, f)); } catch {}
    note('photo_delete', a1);
    return json({ ok: true, photos: photoList() });
  }
  if (section === 'roster') return rosterApi(req, url, body, [a1, a2, a3, a4], ip, note);
  if (section === 'series') return seriesApi(req, url, body, [a1, a2, a3], ip, note);
  if (section === 'inventory') return inventoryApi(req, url, body, [a1, a2, a3], ip, note, user);
  if (section === 'store') return storeApi(req, url, body, ip, note, photoFiles);
  if (section === 'templates') return templatesApi(req, body, [a1], ip, note);
  if (key === 'GET security') return json({ events: audit.recent(500) });

  if (key === 'POST password') { // change password: prove it's you first
    if (!allow(`pw:${ip}`, 10)) { note('password_change_blocked', 'rate limit'); return bad('rate', 429); }
    if (!(await checkLogin(db, user, body?.current))) { note('password_change_fail', 'current password wrong'); return bad('current'); }
    const r = setPassword(db, body?.password);
    if (r.error) return bad(r.error);
    note('password_change', 'other sessions ended'); // session_v + 1 rotates the session; the cookie below is the new one
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(url) }); // other sessions just ended (new session version); keep this one
  }
  return bad('not_found', 404);
}

// ---------- HTTP ----------
const MAX_BODY = 256 * 1024, MAX_PHOTO_BODY = 2 * 1024 * 1024, MAX_SMALL_BODY = 8 * 1024; // sign-up, roster and inventory bodies are a few short fields
function readBody(nreq, max = MAX_BODY) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    nreq.on('data', (c) => { size += c.length; if (size > max) { reject(Object.assign(new Error('too large'), { status: 413 })); nreq.destroy(); } else chunks.push(c); });
    nreq.on('end', () => resolve(Buffer.concat(chunks)));
    nreq.on('error', reject);
  });
}

const server = createServer(async (nreq, nres) => {
  let url;
  try {
    const proto = String(nreq.headers['x-forwarded-proto'] ?? 'http').split(',')[0].trim() === 'https' ? 'https' : 'http'; // the host's proxy ends TLS
    url = new URL(nreq.url, `${proto}://${nreq.headers.host ?? 'localhost'}`);
  } catch { nres.writeHead(400, baseHeaders(new URL('http://localhost'))).end(); return; }
  try {
    if (!url.pathname.startsWith('/api/')) {
      if (!['GET', 'HEAD'].includes(nreq.method)) { nres.writeHead(405, baseHeaders(url)).end(); return; }
      if (await publicRoute(nreq, nres, url)) return;
      return await serveStatic(nreq, nres, url);
    }
    const headers = new Headers();
    for (const [k, v] of Object.entries(nreq.headers)) for (const x of [v].flat()) headers.append(k, x);
    headers.set('x-mg-peer', nreq.socket.remoteAddress ?? ''); // overwrites any copy the client sent; see clientIp()
    // Only a signed-in admin posting a picture may send up to 2 MB; everyone else gets 256 KB, checked before anything is buffered.
    const max = nreq.method === 'POST' && url.pathname === '/api/admin/photos' && signedIn({ headers: { get: (k) => nreq.headers[k] } }, url) ? MAX_PHOTO_BODY : /^\/api\/(signup|admin\/(roster|inventory)\/)/.test(url.pathname) ? MAX_SMALL_BODY : MAX_BODY;
    if (Number(nreq.headers['content-length']) > max) throw Object.assign(new Error('too large'), { status: 413 });
    const body = ['GET', 'HEAD'].includes(nreq.method) ? undefined : await readBody(nreq, max);
    await send(nreq, nres, url, await route(new Request(url, { method: nreq.method, headers, body }), url));
  } catch (e) {
    if (e.status !== 413) log('error', clean(nreq.method, 10), clean(url.pathname.replace(/^\/signup\/[^/]+/, '/signup/<link>'), 200), clean(e.stack ?? e, 2000));
    if (!nres.headersSent) { nres.writeHead(e.status ?? 500, { ...baseHeaders(url), 'Content-Type': 'application/json' }); nres.end(JSON.stringify({ error: e.status === 413 ? 'too_large' : 'server' })); }
  }
});

server.headersTimeout = 10e3; // slow-connection guards
server.requestTimeout = 30e3;
server.listen(PORT, () => log(`Mulligan Games site on ${PUBLIC_URL} (port ${server.address().port}, data in ${DATA}${PROD ? '' : ', development'})`));
// Never die silently: a bad request is answered with 400, uncaught errors are logged and the process exits (the host restarts it),
// unhandled rejections are logged and the server keeps running.
server.on('clientError', (err, socket) => {
  log('clientError', clean(err.code ?? err.message, 100));
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
  else socket.destroy();
});
process.on('uncaughtException', (e) => { log('uncaughtException, exiting', clean(e?.stack ?? e, 2000)); process.exit(1); });
process.on('unhandledRejection', (e) => log('unhandledRejection', clean(e?.stack ?? e, 2000)));
let stopping = false;
const stop = (sig) => {
  if (stopping) return;
  stopping = true;
  log(`${sig} received, shutting down`);
  server.close(() => { try { db.close(); } catch {} log('stopped'); process.exit(0); });
  server.closeIdleConnections?.();
  setTimeout(() => process.exit(0), 5000).unref();
};
process.on('SIGTERM', () => stop('SIGTERM'));
process.on('SIGINT', () => stop('SIGINT'));
