import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, injectMarkers, isDate, isTime, para, text } from '../src/lib/state.js';

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

test('injectMarkers: fills the data marker, replaces a baked region, leaves unknown ones, escapes the data script', () => {
  const page = '<!--mg:data-->baked<!--/mg:data--><!--mg:other--><!--mg:data-->';
  const out = injectMarkers(page, { events: [ev({ title: '</script>' })] }, '2026-10-19');
  assert.ok(!out.includes('baked') && out.includes('<!--mg:other-->'));
  const blocks = [...out.matchAll(/<script type="application\/json" id="mg-data">(.*?)<\/script>/gs)];
  assert.equal(blocks.length, 2);
  assert.deepEqual(JSON.parse(blocks[0][1]), { today: '2026-10-19' }); // nothing private or unfinished is published
  assert.ok(!blocks[0][1].includes('<'));
});
