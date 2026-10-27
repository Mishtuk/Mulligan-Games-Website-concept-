import { test } from 'node:test';
import assert from 'node:assert/strict';
import { etNow } from '../src/lib/clock.js';
import { hoursFor, openStatus } from '../src/lib/store-hours.js';

const wk = (o = {}) => [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, ...(o[day] ?? { open: '14:00', close: '22:00' }) }));
const store = { hours: wk({ 1: { closed: true }, 5: { open: '14:00', close: '24:00' }, 6: { open: '14:00', close: '02:00' } }),
  hourOverrides: [{ date: '2026-11-01', open: '10:00', close: '22:00', note: 'Opening at 10 AM for cEDH' }, { date: '2026-11-26', closed: true, note: 'Thanksgiving' }] };
const at = (s) => openStatus(store, etNow(s));

test('unknown hours (null): nothing is claimed', () => {
  assert.deepEqual(openStatus({ hours: null }, etNow('2026-10-30T19:30')), { known: false });
  assert.equal(hoursFor({ hours: null }, '2026-10-30').known, false);
});
test('open, closed before opening, closed after closing', () => {
  assert.deepEqual([at('2026-10-28T15:00').open, at('2026-10-28T13:59').open, at('2026-10-28T22:00').open], [true, false, false]);
  assert.equal(at('2026-10-28T13:00').next.hm, '14:00');
});
test('a close at midnight or after midnight keeps the shop open past 00:00', () => {
  assert.equal(at('2026-10-30T23:30').open, true); // Friday closes 24:00
  assert.equal(at('2026-10-31T00:00').open, false);
  assert.equal(at('2026-10-31T23:30').open, true); // Saturday closes 02:00
  const after = at('2026-11-01T01:30'); // Sunday 1:30 AM: still Saturday's night
  assert.equal(after.open, true);
  assert.equal(after.closeHm, '02:00');
  assert.equal(at('2026-11-01T02:00').open, false);
});
test('closed day points at the next open day', () => {
  const s = at('2026-10-26T15:00'); // Monday, closed
  assert.equal(s.open, false);
  assert.equal(s.today.closed, true);
  assert.deepEqual(s.next, { date: '2026-10-27', hm: '14:00', note: null });
});
test('date overrides win: special hours and a holiday closure', () => {
  assert.equal(at('2026-11-01T10:30').open, true);
  assert.equal(hoursFor(store, '2026-11-01').note, 'Opening at 10 AM for cEDH');
  const t = at('2026-11-26T15:00');
  assert.equal(t.open, false);
  assert.equal(t.next.date, '2026-11-27');
  assert.equal(hoursFor(store, '2026-11-26').closed, true);
});

test('D39: with hours set, a day with no row is closed and never shown open', () => {
  const store = { hours: [{ day: 5, open: '14:00', close: '22:00' }] }; // only Friday
  assert.deepEqual([hoursFor(store, '2026-10-29').known, hoursFor(store, '2026-10-29').closed], [true, true]); // Thursday: no row
  const st = openStatus(store, etNow('2026-10-29T15:00'));
  assert.equal(st.open, false);
  assert.equal(st.next.date, '2026-10-30'); // points at Friday, not "unknown"
});
