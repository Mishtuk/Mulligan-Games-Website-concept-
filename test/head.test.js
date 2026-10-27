// Built pages (run after `npm run build`): the shared head and the light/dark button (D45) is on every public page; og:image is absolute.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const PAGES = ['', 'events', 'new-here', 'privacy', 'event-page'];
const html = (p) => readFileSync(new URL(`../dist/${p}${p ? '/' : ''}index.html`, import.meta.url), 'utf8');

test('every public page has the theme switch, site.js, absolute og:image and the icon / manifest tags', { skip: !existsSync(new URL('../dist/index.html', import.meta.url)) }, () => {
  for (const p of PAGES) {
    const h = html(p);
    assert.ok(h.includes('class="theme-fab"') && h.includes('aria-label="Switch to dark mode"') && !h.includes('data-scheme='), `${p}: the round light/dark button, not the old pill`);
    assert.ok(h.includes('<script src="/js/site.js"'), `${p}: site.js`);
    assert.match(h, /property="og:image" content="(<!--mg:origin-->)?https?:\/\/[^"]+\/img\/og\/mulligan-games-og\.jpg"/, `${p}: absolute og:image`);
    for (const t of ['og:type', 'og:site_name', 'og:image:width', 'og:image:height', 'og:image:alt', 'twitter:card', 'theme-color', 'rel="apple-touch-icon"', 'rel="manifest"']) assert.ok(h.includes(t), `${p}: ${t}`);
  }
  assert.ok(html('events').includes('rel="canonical"') && html('').includes('property="og:url"'));
});
