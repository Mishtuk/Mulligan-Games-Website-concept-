import { test } from 'node:test';
import assert from 'node:assert/strict';
import { etOffset, eventLd, ldScript, shopLd, stamp } from '../src/lib/jsonld.js';
import { occurrences } from '../src/lib/events.js';
import { seatState } from '../src/lib/seats.js';
import { etNow } from '../src/lib/clock.js';

const store = { name: 'Mulligan Games', phone: '(215) 789-3299', address: { street: '445 York Rd', city: 'Warminster', region: 'PA', zip: '18974' }, hours: null,
  links: { facebook: 'https://facebook.com/x', topdeck: 'https://topdeck.gg/m', discord: null, wizards: 'javascript:alert(1)' } };
const S = (o = {}) => ({ id: 'fnm', title: 'Draft FNM', game: 'magic', kind: 'weekly', recurrence: { type: 'weekly', day: 5 }, start: '19:00', end: '23:00', fee: 20, signup: 'here', capacity: 28, ...o });
const ld = (s, date, ex = [], now = '2026-10-26T12:00') => { const o = occurrences(s, date, date, ex)[0]; return eventLd(o, seatState(o, etNow(now).m), store, `https://s.example/events/${s.id}?date=${date}`); };

test('offset is right across daylight saving, including the changeover days', () => {
  assert.equal(stamp('2026-10-30', '19:00'), '2026-10-30T19:00:00-04:00');
  assert.equal(stamp('2026-11-06', '19:00'), '2026-11-06T19:00:00-05:00');
  assert.equal(etOffset('2026-11-01', '00:30'), '-04:00'); // before the 2 AM fall back
  assert.equal(etOffset('2026-11-01', '03:00'), '-05:00');
  assert.equal(etOffset('2027-03-14', '03:00'), '-04:00');
  assert.equal(etOffset('2027-03-14', '01:00'), '-05:00');
});
test('Event: name, start/end, place with full address, offers, status', () => {
  const e = ld(S(), '2026-10-30');
  assert.equal(e['@type'], 'Event');
  assert.equal(e.name, 'Draft FNM');
  assert.equal(e.startDate, '2026-10-30T19:00:00-04:00');
  assert.equal(e.endDate, '2026-10-30T23:00:00-04:00');
  assert.equal(e.eventStatus, 'https://schema.org/EventScheduled');
  assert.deepEqual(e.location.address, { '@type': 'PostalAddress', streetAddress: '445 York Rd', addressLocality: 'Warminster', addressRegion: 'PA', postalCode: '18974', addressCountry: 'US' });
  assert.deepEqual([e.offers.price, e.offers.priceCurrency, e.offers.availability], [20, 'USD', 'https://schema.org/InStock']);
  assert.equal(ld(S({ end: '01:00' }), '2026-10-30').endDate, '2026-10-31T01:00:00-04:00');
  assert.equal(ld(S({ fee: 0 }), '2026-10-30').offers.price, 0);
  assert.equal(ld(S({ fee: null }), '2026-10-30').offers, undefined);
});
test('availability from seats; invite-only has no Event', () => {
  assert.equal(ld(S({ capacity: 3 }), '2026-10-30').offers.availability, 'https://schema.org/LimitedAvailability');
  assert.equal(ld(S({ capacity: 40 }), '2026-10-30').offers.availability, 'https://schema.org/InStock');
  assert.equal(ld(S({ inviteOnly: true }), '2026-10-30'), null);
});
test('cancelled and moved dates: EventCancelled, EventRescheduled + previousStartDate', () => {
  const c = ld(S(), '2026-10-30', [{ series: 'fnm', date: '2026-10-30', type: 'cancel' }]);
  assert.equal(c.eventStatus, 'https://schema.org/EventCancelled');
  assert.equal(c.name, 'Draft FNM'); // other properties kept
  const m = ld(S(), '2026-11-07', [{ series: 'fnm', date: '2026-11-06', type: 'change', movedTo: '2026-11-07', start: '20:00' }]);
  assert.equal(m.eventStatus, 'https://schema.org/EventRescheduled');
  assert.equal(m.previousStartDate, '2026-11-06T19:00:00-05:00');
  const t = ld(S(), '2026-11-13', [{ series: 'fnm', date: '2026-11-13', type: 'change', start: '19:30' }]);
  assert.equal(t.eventStatus, 'https://schema.org/EventRescheduled');
  assert.equal(t.startDate, '2026-11-13T19:30:00-05:00');
});
test('script text escapes "<": a hostile title cannot close the script', () => {
  const e = ld(S({ title: '</script><script>alert(1)</script> <!--' }), '2026-10-30');
  const t = ldScript(e);
  assert.ok(!t.includes('<'));
  assert.equal(JSON.parse(t).name, '</script><script>alert(1)</script> <!--');
});
test('HobbyShop: sameAs only has links that exist and are safe; hours only when confirmed', () => {
  const s = shopLd(store, 'https://s.example');
  assert.equal(s['@type'], 'HobbyShop');
  assert.deepEqual(s.sameAs, ['https://facebook.com/x', 'https://topdeck.gg/m']);
  assert.equal(s.openingHoursSpecification, undefined);
  const h = shopLd({ ...store, hours: [{ day: 5, open: '14:00', close: '24:00' }, { day: 1, closed: true }] }, 'https://s.example');
  assert.deepEqual(h.openingHoursSpecification, [{ '@type': 'OpeningHoursSpecification', dayOfWeek: 'Friday', opens: '14:00', closes: '23:59' }]);
  assert.equal(shopLd({ ...store, links: {} }, 'https://s.example').sameAs, undefined);
});
