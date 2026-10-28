// Round 6 (D47): one store photo per event, the photo cards / thumbs / strip caps, and "Clips from the shop".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { photoFor, photosForDay, photoPos } from '../src/lib/photos.js';
import { validClip, TIKTOK_ID, FILE } from '../src/lib/clips.js';
import { hero, week } from '../src/lib/render.js';
import { etNow } from '../src/lib/clock.js';
import clips from '../src/content/clips.json' with { type: 'json' };

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const built = existsSync(new URL('../dist/index.html', import.meta.url));

test('photoFor: by game and format, no repeat while a list lasts, tinted picks tracked apart', () => {
  const used = {};
  assert.equal(photoFor({ game: 'magic' }, used).file, 'event-magic-night');
  assert.equal(photoFor({ game: 'magic' }, used).file, 'event-full-room-2');
  assert.equal(photoFor({ game: 'magic' }, used).file, 'play-room-night');
  assert.equal(photoFor({ game: 'magic' }, used).file, 'event-magic-night', 'a used-up list starts again');
  const t = photoFor({ game: 'onepiece' }, {});
  assert.deepEqual([t.file, t.tint], ['event-full-room-2', true]);
  const u = {};
  photoFor({ game: 'magic' }, u); photoFor({ game: 'magic' }, u); // plain event-full-room-2 is now used
  assert.equal(photoFor({ game: 'onepiece' }, u).file, 'event-full-room-2', 'the tint is not blocked by the plain photo');
  assert.deepEqual([photoFor({ game: 'nope' }, {}).file, photoFor({ game: 'nope' }, {}).tint], ['event-full-room', true]);
  assert.equal(photoFor({ game: 'cedh', featured: true }, {}).file, 'champion-belt');
  assert.equal(photoFor({ game: 'cedh' }, {}).file, 'event-cedh-tables');
  assert.equal(photoFor({ game: 'warhammer', format: 'Painting' }, {}).file, 'painted-marines');
  assert.equal(photoFor({ game: 'other', format: 'D&D' }, {}).file, 'dnd-table');
  assert.equal(photoFor({ game: 'other', format: '<b>' }, {}).file, 'event-full-room');
  assert.equal(photoFor({ game: 'constructor' }, {}).file, 'event-full-room', 'a game id from data cannot reach object properties');
  const day = photosForDay([{ k: 'b', game: 'magic', start: '19:00' }, { k: 'a', game: 'magic', start: '14:00' }], (o) => o.k);
  assert.deepEqual([day.get('a').file, day.get('b').file], ['event-magic-night', 'event-full-room-2'], 'earliest first');
});

test('photo position must look like "50% 60%"', () => {
  assert.equal(photoPos({ pos: '50% 60%' }), '50% 60%');
  for (const bad of ['"><script>', '50%', 'url(x)', undefined]) assert.equal(photoPos({ pos: bad }), '50% 50%');
});

test('every photo in the map exists in both sizes', () => {
  const files = new Set();
  for (const g of ['magic', 'cedh', 'pokemon', 'riftbound', 'warhammer', 'onepiece', 'hololive', 'other', 'x']) for (const f of [{}, { featured: true }, { format: 'Painting' }, { format: 'D&D' }]) {
    const used = {};
    for (let i = 0; i < 4; i++) files.add(photoFor({ game: g, ...f }, used).file);
  }
  assert.ok(files.size >= 14);
  for (const f of files) for (const sfx of ['', '-800']) assert.ok(existsSync(new URL(`../public/img/social/${f}${sfx}.webp`, import.meta.url)), f + sfx);
});

const NOW = etNow(new Date('2026-10-27T15:00:00Z')); // a Tuesday
const series = (id, game, day, extra = {}) => ({ id, title: `T-${id}`, game, kind: 'weekly', recurrence: { type: 'weekly', day }, start: '19:00', end: '22:00', fee: 5, signup: 'walkin', enabled: true, ...extra });
const ctx = (list) => ({ store: { hours: [] }, series: list, exceptions: [], games: ['magic', 'cedh', 'pokemon', 'other'].map((id) => ({ id, short: id })), releases: [], now: NOW, query: new URLSearchParams(), counts: new Map() });

test('week: photo bands on today and the next day only, thumbs after, strip caps, no repeat between the two card days', () => {
  const html = week(ctx([series('a', 'magic', 2), series('b', 'magic', 3), series('c', 'magic', 4), series('d', 'pokemon', 5)])).toString();
  const bands = [...html.matchAll(/<figure class="ev-ph ph"[^>]*><img src="\/img\/social\/([\w-]+)-800\.webp"/g)].map((m) => m[1]);
  assert.deepEqual(bands, ['event-magic-night', 'event-full-room-2'], 'two card days, different pictures');
  assert.equal([...html.matchAll(/class="dl-ph ph"/g)].length, 2, 'later days get thumbs');
  assert.ok(html.includes('class="dl-main"') && html.includes('class="dl-dot"'));
  assert.ok(!html.includes('dc-ph') && !html.includes('dc-pips'), 'round 7: the week strip is text only');
  assert.equal([...html.matchAll(/<span class="dc-cap" aria-hidden="true">/g)].length, 7, 'seven tiles, each with its count');
  assert.ok(/<img [^>]*alt=""[^>]*loading="lazy"/.test(html));
  assert.ok(/class="ev-ph ph"[^>]*><img [^>]*srcset="\/img\/social\/[\w-]+-800\.webp 800w, \/img\/social\/[\w-]+\.webp 1600w"[^>]*width="800" height="600"/.test(html), 'bands: srcset 800/1600 and a size box');
  assert.ok(!/class="dl-ph ph"[^>]*><img [^>]*srcset/.test(html), 'thumbs stay on the 800 file');
});

test('week: a hostile title or game never reaches the photo markup', () => {
  const html = week(ctx([series('e', '"><script>x</script>', 2, { title: '<script>alert(1)</script>' })])).toString();
  assert.ok(!html.includes('<script>') && /data-tint/.test(html));
});

test('clips: strict validation of platform, id, host and poster', () => {
  assert.equal(clips.length, 9);
  assert.ok(clips.every(validClip));
  const ok = clips[0];
  for (const bad of [{ ...ok, id: '12345' }, { ...ok, id: '1234567890123456x' }, { ...ok, url: 'http://www.tiktok.com/x' }, { ...ok, url: 'https://evil.example/@a/video/1' }, { ...ok, url: 'https://www.tiktok.com.evil.example/x' },
    { ...ok, poster: 'https://evil.example/p.webp' }, { ...ok, poster: '../x.webp' }, { ...ok, platform: 'facebook' }, { ...ok, url: 'javascript:alert(1)' }, null]) assert.equal(validClip(bad), false, JSON.stringify(bad));
  assert.equal(validClip({ ...clips.find((c) => c.platform === 'instagram'), id: 'a"b' }), false);
  assert.equal(clips.find((c) => c.id === 'DTHcsxqjNDL').credit, 'by @perky_grn_fairy');
  for (const c of clips) assert.ok(existsSync(new URL(`../public/${c.poster}`, import.meta.url)), c.poster);
});

test('client script: same id pattern, iframe only after showModal, official host, removed on close, no innerHTML', () => {
  const js = read('../public/js/clips.js');
  assert.ok(js.includes(`/${TIKTOK_ID.source}/`), 'the client repeats the build-time id pattern');
  assert.ok(js.includes("'https://www.tiktok.com/player/v1/'") && js.includes('strict-origin-when-cross-origin') && js.includes('f.title'));
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(/.test(js));
  assert.ok(js.indexOf('d.showModal()') < js.indexOf("createElement('iframe')"), 'the iframe is made after showModal');
  assert.ok(js.includes('f.remove()') && js.includes("addEventListener('close'"));
  const sb = js.match(/f\.setAttribute\('sandbox', '([^']*)'\)/);
  assert.ok(sb && js.indexOf(sb[0]) < js.indexOf('f.src = src'), 'the player iframe is sandboxed before it gets its src');
  assert.deepEqual(sb[1].split(' ').sort(), ['allow-popups', 'allow-popups-to-escape-sandbox', 'allow-presentation', 'allow-same-origin', 'allow-scripts'], 'no top navigation, forms, modals or downloads');
  assert.equal((js.match(/createElement\('iframe'\)/g) ?? []).length, 1);
});

test('own clips: file regex, files exist, cards carry data-file and no player id, client makes a video not an iframe', { skip: !built }, () => {
  for (const bad of ['/media/clips/../x.mp4', '../media/clips/a.mp4', 'http://evil.example/media/clips/a.mp4', '/media/clips/a.mp4?x=1', '/media/clips/A.mp4', '/media/clips/a.webm', '//evil.example/a.mp4']) assert.equal(FILE.test(bad), false, bad);
  assert.equal(validClip({ ...clips[0], file: '/media/clips/a.mp4?x=1' }), false);
  const own = clips.filter((c) => c.file);
  assert.equal(own.length, 3);
  for (const c of own) { assert.ok(validClip(c)); assert.ok(existsSync(new URL(`../public${c.file}`, import.meta.url)), c.file); }
  const html = read('../dist/index.html');
  const cards = [...html.matchAll(/<a class="clip-a"[^>]*data-file="(\/media\/clips\/[a-z0-9-]+\.mp4)"[^>]*>[\s\S]*?<\/a>/g)];
  assert.equal(cards.length, 3);
  for (const [card] of cards) {
    assert.ok(!/data-tt=/.test(card) && /class="clip-badge">[\s\S]*?Video<\/span>/.test(card) && /from (?:TikTok|Instagram)/.test(card));
    assert.ok(!/(?:src|href|poster)="https?:\/\/(?!www\.(?:tiktok|instagram)\.com\/)/.test(card), 'no third-party URL beyond the credit link');
    assert.ok(/<img src="\/media\/clips\/[a-z0-9-]+-poster\.webp"/.test(card));
  }
  assert.equal([...html.matchAll(/data-tt="/g)].length, 5, 'the other TikTok cards are unchanged');
  const js = read('../public/js/clips.js');
  assert.ok(js.includes(`/${FILE.source}/`),'the client repeats the file pattern');
  const vid = js.slice(js.indexOf('if (file) {'), js.indexOf('var f = document.createElement'));
  assert.ok(vid.includes("createElement('video')") && !vid.includes("createElement('iframe')") && vid.includes('saveData') && vid.includes('prefers-reduced-motion'));
  assert.ok(js.indexOf('d.showModal()') < js.indexOf("createElement('video')"));
});

test('front page build: clips as plain links, nothing third-party before a click, heading This week, welcome hero', { skip: !built }, () => {
  const html = read('../dist/index.html');
  assert.ok(html.includes('<h2 id="week-h">This week</h2>') && html.includes('Clips from the shop') && !html.includes('Inside the shop'));
  assert.equal([...html.matchAll(/<a class="clip-a" href="https:\/\/www\.(?:tiktok|instagram)\.com\/[^"]*" target="_blank" rel="noopener"/g)].length, 9);
  assert.ok(!/<iframe|<dialog/.test(html), 'no iframe or dialog until a click');
  assert.ok(!/<(?:script|img|link|iframe|source)\b[^>]*(?:src|href)="https?:\/\//.test(html), 'no third-party resource tags');
  assert.ok(html.includes('Videos load from TikTok only when you press play'));
  assert.ok(html.includes('id="hero-h">Shuffle up. Everyone’s welcome.</h1>') && html.includes('Welcome to Mulligan Games, Warminster’s friendly game store: a big play room, free play every day we’re open, and card nights all week. Come say hi.'));
  assert.equal(html.split('free play every day').length, 2, 'free play is said once');
  const feat = html.match(/<section class="feat"[^]*?<\/section>/)[0];
  assert.deepEqual([...feat.matchAll(/data-file="(\/media\/clips\/[a-z-]+\.mp4)"/g)].map((m) => m[1]), ['/media/clips/cedh-full-room.mp4', '/media/clips/cedh-february.mp4'], 'two featured clips in their own row');
  assert.ok(html.indexOf('class="feat"') > html.indexOf('</section>', html.indexOf('class="phero"')) && html.indexOf('class="feat"') < html.indexOf('id="week"'), 'the row sits between the hero and This week, not over the video');
  assert.ok(!html.match(/<div class="openbar ob-front">[^]*?<header/)[0].includes('ob-status'), 'home top bar: no open / closed text');
});

test('welcome hero: fixed copy, hours status in the chip (open / later today / closed / unknown)', () => {
  const HRS = [{ day: 0, open: '13:00', close: '22:00' }, { day: 1, closed: true }, { day: 2, closed: true }, { day: 3, open: '14:00', close: '22:00' }, { day: 4, open: '14:00', close: '22:00' }, { day: 5, open: '14:00', close: '24:00' }, { day: 6, open: '14:00', close: '24:00' }];
  const at = (iso, hours = HRS) => hero({ ...ctx([]), store: { hours }, now: etNow(new Date(iso)) }).toString();
  const chip = (s) => s.match(/id="hero-chip-t">([^<]*)</)[1].replace(/ /g, ' '); // fmtTime uses a no-break space
  const open = at('2026-10-29T20:00:00Z'); // Thu 4 PM ET
  assert.ok(open.includes('id="hero-h">Shuffle up. Everyone’s welcome.</h1>') && !open.includes('hero-date'));
  assert.ok(open.includes('<p class="phero-sub" id="hero-sub">Welcome to Mulligan Games, Warminster’s friendly game store: a big play room, free play every day we’re open, and card nights all week. Come say hi.</p>'));
  assert.ok(open.includes('class="phero-chip" id="hero-chip" role="status" data-open=""'));
  assert.equal(chip(open), 'Open now · till 10 PM');
  assert.equal(chip(at('2026-10-31T01:00:00Z')), 'Open now · till midnight'); // Fri 9 PM
  assert.equal(chip(at('2026-10-29T15:00:00Z')), 'Opens 2 PM today'); // Thu 11 AM
  assert.equal(chip(at('2026-10-27T15:00:00Z')), 'Closed today · back tomorrow 2 PM'); // Tue
  assert.equal(chip(at('2026-10-30T03:00:00Z')), 'Closed · back tomorrow 2 PM'); // Thu 11 PM
  assert.equal(chip(at('2026-10-26T15:00:00Z')), 'Closed today · back Wed 2 PM'); // Mon
  assert.equal(chip(at('2026-10-29T20:00:00Z', [])), 'Closed this week', 'D39: hours set but no rows = closed');
  assert.equal(chip(at('2026-10-29T20:00:00Z', null)), 'Hours coming soon', 'unknown hours');
  assert.ok(open.includes('class="btn btn-clip"') && open.includes('data-file="/media/clips/cedh-full-room.mp4"'), 'phones: the Watch a clip button');
});
