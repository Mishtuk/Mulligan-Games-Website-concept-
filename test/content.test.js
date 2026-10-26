import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { expand, isDate, isTime } from '../src/lib/state.js';

const load = (f) => JSON.parse(readFileSync(new URL(`../src/content/${f}.json`, import.meta.url), 'utf8'));
const store = load('store'), games = load('games'), series = load('series'), releases = load('releases');
const gameIds = new Set(games.map((g) => g.id));
const SIGNUP = ['walkin', 'here', 'counter', 'external', null];
const KINDS = ['open', 'weekly', 'learn', 'cedh', 'prerelease', 'special'];
const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;
const timeOrNull = (t) => t === null || t === undefined || isTime(t);

test('store: facts are right and hours are unconfirmed', () => {
  assert.equal(store.address.street, '445 York Rd'); // never 455
  assert.equal(store.phone, '(215) 789-3299');
  assert.match(store.closedNote, /Monday & Tuesday/);
  assert.match(store.parking, /RISE/);
  for (const k of ['facebook', 'instagram', 'tiktok', 'x']) assert.match(store.links[k], /^https:\/\//);
  assert.equal(store.hours, null); // TODO Q2: owner must confirm
  assert.match(store.hoursTodo, /Q2/);
  assert.equal(store.hoursFallbackUnconfirmed.length, 7);
  assert.match(store.hoursFallbackSource, /UNCONFIRMED/);
  assert.ok(nonEmpty(store.source));
});

test('series: required fields, ids, games, times, fees, sign-up', () => {
  assert.ok(series.length >= 20);
  assert.equal(new Set(series.map((s) => s.id)).size, series.length, 'unique ids');
  for (const s of series) {
    const w = `series ${s.id}`;
    assert.ok(nonEmpty(s.title) && nonEmpty(s.format), w);
    assert.ok(gameIds.has(s.game), `${w}: unknown game ${s.game}`);
    assert.ok(KINDS.includes(s.kind), `${w}: kind ${s.kind}`);
    assert.ok(nonEmpty(s.source), `${w}: every entry needs a source`);
    assert.ok(timeOrNull(s.start) && timeOrNull(s.end) && timeOrNull(s.doors), `${w}: bad time`);
    assert.ok(s.fee === null || (Number.isInteger(s.fee) && s.fee >= 0), `${w}: fee`);
    assert.ok(SIGNUP.includes(s.signup), `${w}: signup`);
    for (const k of ['capacity', 'minPlayers']) assert.ok(s[k] === undefined || (Number.isInteger(s[k]) && s[k] > 0), `${w}: ${k}`);
    if (s.tool) assert.ok(nonEmpty(s.tool.name) && (s.tool.url === undefined || /^https:\/\//.test(s.tool.url)), `${w}: tool`);
    // a missing fact must carry a todo
    if (s.fee === null || s.end === null || s.signup === null || s.start === null) assert.ok(nonEmpty(s.todo), `${w}: null needs a todo`);
    if (s.signup === 'external') assert.ok(s.tool?.url, `${w}: external sign-up needs a tool link`);
  }
});

test('series: recurrence fields are valid', () => {
  for (const { id, recurrence: r } of series) {
    const w = `series ${id}`;
    if (r.type === 'none') assert.ok(isDate(r.date), w);
    else if (r.type === 'weekly') assert.ok(Number.isInteger(r.day) && r.day >= 0 && r.day <= 6, w);
    else if (r.type === 'nth') assert.ok([1, 2, 3, 4, 5, -1].includes(r.nth) && r.day >= 0 && r.day <= 6, w);
    else if (r.type === 'dates') {
      assert.ok(r.dates.length > 0, w);
      for (const d of r.dates) assert.ok(isDate(d.date) && isTime(d.start), `${w}: ${JSON.stringify(d)}`);
    } else assert.fail(`${w}: recurrence type ${r.type}`);
  }
});

// Adapt the seed recurrence to state.js's flat model (date + recurring) so the real expander is exercised.
function toEvents() {
  const first = (day, nth) => { // nth `day`-weekday of Jan 2026 (Jan 1 2026 is a Thursday)
    const d = 1 + ((day - 4 + 7) % 7) + (nth - 1) * 7;
    return `2026-01-${String(d).padStart(2, '0')}`;
  };
  return series.flatMap((s) => {
    const r = s.recurrence, base = { id: s.id, title: s.title, start: s.start || '' };
    if (r.type === 'none') return [{ ...base, date: r.date, recurring: 'none' }];
    if (r.type === 'weekly') return [{ ...base, date: first(r.day, 1), recurring: 'weekly' }];
    if (r.type === 'nth') return [{ ...base, date: first(r.day, r.nth), recurring: 'monthly_weekday' }];
    return r.dates.map((d) => ({ ...base, date: d.date, start: d.start, recurring: 'none' }));
  });
}

test('series expand to the real November 2026 dates', () => {
  const nov = expand(toEvents(), '2026-11-01', '2026-11-30');
  const on = (id) => nov.filter((o) => o.id === id).map((o) => o.date + (o.start ? ' ' + o.start : ''));
  assert.deepEqual(on('pauper'), ['2026-11-04 19:00', '2026-11-11 19:00', '2026-11-18 19:00', '2026-11-25 19:00']);
  assert.deepEqual(on('cedh-mcs'), ['2026-11-01 10:00']); // 1st Sunday
  assert.deepEqual(on('rb-skirmish'), ['2026-11-14 12:00']); // 2nd Saturday
  assert.deepEqual(on('standard-rcq'), ['2026-11-15 12:00', '2026-11-22 12:00']);
  assert.deepEqual(on('startrek-prerelease'), ['2026-11-06 19:00', '2026-11-08 15:00', '2026-11-08 17:00']);
  assert.deepEqual(on('cedh-5k-nov7'), ['2026-11-07']);
  assert.deepEqual(on('chaos-draft-oct30'), []); // October only
  assert.deepEqual(on('cedh-weekly'), ['2026-11-01 14:00', '2026-11-08 14:00', '2026-11-15 14:00', '2026-11-22 14:00', '2026-11-29 14:00']);
  assert.equal(expand(toEvents(), '2026-10-30', '2026-10-30').some((o) => o.id === 'chaos-draft-oct30'), true);
});

// Owner rule (no injection): any scheme-prefixed string anywhere in the seed must be https:// or tel:+digits.
test('seed: every link is https (or tel:), never javascript:/data:', () => {
  const walk = (v, at) => {
    if (typeof v === 'string') {
      if (/^[a-z][a-z0-9+.-]*:\S/i.test(v)) assert.match(v, /^(https:\/\/[^\s"'<>]+|tel:\+\d+)$/, at);
    } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${at}.${k}`);
  };
  for (const [n, d] of Object.entries({ store, games, series, releases })) walk(d, n);
});

test('releases: preorders have a game, end date and source', () => {
  assert.ok(releases.length >= 2);
  const ids = new Set(series.map((s) => s.id));
  for (const r of releases) {
    assert.ok(gameIds.has(r.game) && nonEmpty(r.name) && nonEmpty(r.source), r.id);
    if (r.status === 'preorder') assert.ok(isDate(r.preorderEnds), r.id);
    if (r.event) assert.ok(ids.has(r.event), `${r.id}: unknown event ${r.event}`);
  }
  assert.ok(releases.every((r) => r.preorderEnds === '2026-11-01'));
});
