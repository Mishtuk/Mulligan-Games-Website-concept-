import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calendar, feedOccurrences, fold, icsEsc } from '../src/lib/ics.js';
import { occurrences } from '../src/lib/events.js';

const store = { name: 'Mulligan Games', address: { street: '445 York Rd', city: 'Warminster', region: 'PA', zip: '18974' } };
const S = (o = {}) => ({ id: 'fnm', title: 'Draft FNM', game: 'magic', kind: 'weekly', recurrence: { type: 'weekly', day: 5 }, start: '19:00', end: '23:00', fee: 20, signup: 'walkin', ...o });
const now = new Date('2026-10-26T12:00:00Z');

test('escaping: commas, semicolons, backslashes and newlines in text; long lines fold at 75 octets', () => {
  assert.equal(icsEsc('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
  const ics = calendar(feedOccurrences([S({ title: 'Evil\r\nEND:VEVENT\r\nSUMMARY:x,y' })], [], '2026-10-30', 1), store, 'https://s.example', { now });
  assert.ok(!/^SUMMARY:x/m.test(ics), 'no injected line');
  assert.ok(ics.includes('SUMMARY:Evil\\nEND:VEVENT\\nSUMMARY:x\\,y'));
  for (const l of ics.split('\r\n')) assert.ok(Buffer.byteLength(l) <= 75, l);
  assert.equal(fold('é'.repeat(60)).split('\r\n').every((l) => Buffer.byteLength(l) <= 75), true);
});
test('a normal date: TZID times, location, uid, details link', () => {
  const ics = calendar(feedOccurrences([S()], [], '2026-10-30', 1), store, 'https://s.example', { now });
  for (const l of ['DTSTART;TZID=America/New_York:20261030T190000', 'DTEND;TZID=America/New_York:20261030T230000', 'STATUS:CONFIRMED', 'UID:fnm-20261030@mulligangames', 'LOCATION:Mulligan Games\\, 445 York Rd\\, Warminster\\, PA 18974', 'URL:https://s.example/events/fnm?date=2026-10-30']) assert.ok(ics.includes(l), l);
  assert.ok(ics.includes('BEGIN:VTIMEZONE') && ics.endsWith('END:VCALENDAR\r\n'));
});
test('exceptions: cancelled date is STATUS:CANCELLED, a changed start moves, a moved date keeps its uid', () => {
  const ex = [{ series: 'fnm', date: '2026-10-30', type: 'cancel', note: 'Halloween' }, { series: 'fnm', date: '2026-11-06', type: 'change', start: '19:30', movedTo: '2026-11-07' }];
  const ics = calendar(feedOccurrences([S()], ex, '2026-10-30', 10), store, 'https://s.example', { now });
  const ev = (d) => ics.split('BEGIN:VEVENT').find((e) => e.includes(`UID:fnm-${d}@`));
  assert.ok(ev('20261030').includes('STATUS:CANCELLED') && ev('20261030').includes('SUMMARY:Cancelled: Draft FNM') && ev('20261030').includes('SEQUENCE:'));
  assert.ok(ev('20261106').includes('DTSTART;TZID=America/New_York:20261107T193000') && ev('20261106').includes('STATUS:CONFIRMED'));
  assert.equal(occurrences(S(), '2026-10-30', '2026-10-30', ex)[0].cancelled, true);
});
test('two prerelease slots on one day are two events', () => {
  const s = S({ id: 'pre', recurrence: { type: 'dates', dates: [{ date: '2026-11-08', start: '15:00' }, { date: '2026-11-08', start: '17:00' }] }, end: null });
  const ics = calendar(feedOccurrences([s], [{ series: 'pre', date: '2026-11-08T15:00', type: 'cancel' }], '2026-11-08', 1), store, 'https://s.example', { now });
  assert.equal(ics.split('BEGIN:VEVENT').length - 1, 2);
  assert.equal((ics.match(/STATUS:CANCELLED/g) || []).length, 1);
  assert.ok(!ics.includes('DTEND'));
});
test('SEQUENCE only goes up: a later file (cancel, then brought back) never has a lower number', () => {
  const seq = (ex, at) => +/SEQUENCE:(\d+)/.exec(calendar(feedOccurrences([S()], ex, '2026-10-30', 1), store, 'https://s.example', { now: new Date(at) }))[1];
  const cancelled = seq([{ series: 'fnm', date: '2026-10-30', type: 'cancel' }], '2026-10-26T12:00:00Z'), back = seq([], '2026-10-26T12:05:00Z');
  assert.ok(back > cancelled);
});
