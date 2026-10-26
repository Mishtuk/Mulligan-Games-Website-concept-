import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, expand, injectMarkers, isDate, isTime, occurrences, para, text } from '../src/lib/state.js';

const ev = (o) => ({ id: 'abcd1', title: 'Commander night', date: '2026-10-13', start: '', end: '', description: '', recurring: 'none', enabled: true, ...o });

test('cleaning: tags and control characters removed, length capped, paragraphs kept', () => {
  assert.equal(text('  <b>Modern</b>\u0000 night ', 80), 'Modern night');
  assert.equal(text('x'.repeat(50), 10), 'x'.repeat(10));
  assert.equal(text(5, 10), '');
  assert.equal(para('a\r\n\r\n\r\n\r\nb<script>', 100), 'a\n\nb');
  assert.equal(esc(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  assert.deepEqual(['2026-02-28', '2026-02-30', '2026-2-1', 5].map(isDate), [true, false, false, false]);
  assert.deepEqual(['00:00', '23:59', '24:00', '9:00'].map(isTime), [true, true, false, false]);
});

test('recurring expansion: one-off, weekly, monthly, monthly weekday', () => {
  assert.deepEqual(occurrences(ev({ date: '2026-10-13' }), '2026-10-01', '2026-10-31'), ['2026-10-13']);
  assert.deepEqual(occurrences(ev({ date: '2026-10-13' }), '2026-11-01', '2026-11-30'), []);
  assert.deepEqual(occurrences(ev({ date: '2026-10-02', recurring: 'weekly' }), '2026-10-10', '2026-10-31'), ['2026-10-16', '2026-10-23', '2026-10-30']);
  assert.deepEqual(occurrences(ev({ date: '2026-10-02', recurring: 'weekly' }), '2026-09-01', '2026-10-10'), ['2026-10-02', '2026-10-09']); // never before its first date
  assert.deepEqual(occurrences(ev({ date: '2026-10-30', recurring: 'weekly' }), '2026-10-30', '2026-11-13'), ['2026-10-30', '2026-11-06', '2026-11-13']); // across the DST change (Nov 1)
  assert.deepEqual(occurrences(ev({ date: '2026-01-31', recurring: 'monthly' }), '2026-01-01', '2026-04-30'), ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  assert.deepEqual(occurrences(ev({ date: '2026-10-13', recurring: 'monthly_weekday' }), '2026-10-01', '2027-01-31'), ['2026-10-13', '2026-11-10', '2026-12-08', '2027-01-12']); // 2nd Tuesday
  assert.deepEqual(occurrences(ev({ date: '2026-10-29', recurring: 'monthly_weekday' }), '2026-10-01', '2026-12-31'), ['2026-10-29', '2026-11-26', '2026-12-31']); // 5th Thursday -> last Thursday
  assert.deepEqual(occurrences(ev({ date: '2026-12-15', recurring: 'monthly' }), '2026-12-01', '2027-02-28'), ['2026-12-15', '2027-01-15', '2027-02-15']); // across the year end
});

test('expand skips disabled events and sorts', () => {
  const list = expand([ev({ id: 'b', title: 'B', date: '2026-10-20' }), ev({ id: 'a', title: 'A', date: '2026-10-05' }), ev({ id: 'c', title: 'C', enabled: false })], '2026-10-01', '2026-10-31');
  assert.deepEqual(list.map((e) => e.title), ['A', 'B']);
});

test('injectMarkers: fills the data marker, replaces a baked region, leaves unknown ones, escapes the data script', () => {
  const page = '<!--mg:data-->baked<!--/mg:data--><!--mg:other--><!--mg:data-->';
  const out = injectMarkers(page, { events: [ev({ title: '</script>' })] }, '2026-10-19');
  assert.ok(!out.includes('baked') && out.includes('<!--mg:other-->'));
  const blocks = [...out.matchAll(/<script type="application\/json" id="mg-data">(.*?)<\/script>/gs)];
  assert.equal(blocks.length, 2);
  assert.deepEqual(JSON.parse(blocks[0][1]), { today: '2026-10-19' }); // nothing private or unfinished is published
  assert.ok(!blocks[0][1].includes('<'));
});
