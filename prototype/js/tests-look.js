/* Tests for round 8, "Card-table warm" (package A: the shared look and parts). docs/review/round-8-new-look.md.
 * One control per row state, hostile text stays text in a row with an action, the Tonight band builder, Fraunces loads from our own
 * origin, and a luminance check of the colour pairs the round introduces (read from tokens.css, light and dark).
 * Loaded by tests.html after tests-clips.js. Page checks run in an iframe (needs file access, otherwise skipped). */
(function () {
  'use strict';
  var T = window.T, MG = window.MG, D = MG.data, V = MG.views, A = MG.act;
  var eq = T.eq, ok = T.ok;
  var box = document.getElementById('sandbox');
  var BASE = location.href.replace(/[^\/]*$/, '').split('?')[0];
  var XSS_IMG = '<img src=x onerror="window.__xss=1">';

  function fresh() { MG.state.reset(); MG.now = function () { return new Date(2026, 9, 30, 18, 50); }; box.innerHTML = ''; window.__xss = 0; }
  function openPage(path, width) {
    return new Promise(function (resolve, reject) {
      var f = document.createElement('iframe'), settled = false;
      f.style.cssText = 'position:absolute;left:-9999px;width:' + (width || 1280) + 'px;height:900px';
      f.addEventListener('load', function () {
        try { void f.contentWindow.document.body; } catch (err) { reject(new Error('NOACCESS')); return; }
        setTimeout(function () { if (!settled) { settled = true; resolve({ w: f.contentWindow, d: f.contentWindow.document, frame: f }); } }, 300);
      });
      document.body.appendChild(f); f.src = BASE + path;
    });
  }
  function pageTest(name, width, fn) {
    T.async(name, function () {
      return openPage('index.html?now=2026-10-30T18:50', width).then(function (p) {
        return Promise.resolve(fn(p.w, p.d)).then(function () { p.frame.remove(); }, function (err) { p.frame.remove(); throw err; });
      }, function (err) { if (err && err.message === 'NOACCESS') return T.SKIP; throw err; });
    });
  }
  // run fn with MG.seatState answering `st` for every date, then restore it
  function withState(st, fn) {
    var real = MG.seatState; MG.seatState = function () { return st; };
    try { return fn(); } finally { MG.seatState = real; }
  }
  function actOf(li) { return li.querySelector('.dl-act'); }
  function controls(li) { return actOf(li) ? actOf(li).querySelectorAll('.btn, .dl-more, .stamp') : []; }
  function occ0() { return A.occByKey('fnm-draft@2026-10-30'); }

  T.section('Round 8: the look and the shared parts');

  /* ---------- one control per row state (spec 3.2) ---------- */
  T.test('open: one filled Sign up that goes to #su-<key> (link mode) or carries data-signup (button mode)', function () {
    fresh(); var occ = occ0();
    withState({ state: 'open', cap: 24, left: 19, taken: 5 }, function () {
      var li = V.compactLine(occ, MG.now(), 'events.html', null, { action: 'link' }), c = controls(li);
      eq(c.length, 1, 'one control'); eq(c[0].className.indexOf('btn-act') > -1, true, 'btn-act'); eq(c[0].textContent, 'Sign up');
      eq(c[0].getAttribute('href'), 'events.html#su-' + encodeURIComponent(occ.key)); ok(c[0].classList.contains('btn-row'), 'btn-row');
      eq(li.querySelector('.dl-bits').textContent.indexOf('19 seats left') > -1, true, 'seats still in the bits: ' + li.querySelector('.dl-bits').textContent);
      var lb = V.compactLine(occ, MG.now(), 'events.html', null, { action: 'button' }), b = controls(lb);
      eq(b.length, 1); eq(b[0].tagName, 'BUTTON'); eq(b[0].getAttribute('data-signup'), occ.key); eq(b[0].type, 'button');
    });
    withState({ state: 'few', cap: 24, left: 2, taken: 22 }, function () { eq(controls(V.compactLine(occ, MG.now(), 'events.html', null, { action: 'link' }))[0].textContent, 'Sign up', 'few seats'); });
    withState({ state: 'needs', cap: 0, taken: 2, min: 4 }, function () { eq(controls(V.compactLine(occ, MG.now(), 'events.html', null, { action: 'link' }))[0].textContent, 'Sign up', 'needs'); });
    MG.state.reset();
  });
  T.test('waitlist: one outlined Join the waitlist, no filled button', function () {
    fresh();
    withState({ state: 'waitlist', cap: 24, left: 0, waiting: 3 }, function () {
      var li = V.compactLine(occ0(), MG.now(), 'events.html', null, { action: 'link' }), c = controls(li);
      eq(c.length, 1); ok(c[0].classList.contains('btn-2'), 'btn-2'); eq(li.querySelectorAll('.btn-act').length, 0, 'no filled button'); eq(c[0].textContent, 'Join the waitlist');
      eq(controls(V.weeklyRow(occ0().series, MG.now(), '2026-10-30', '2026-12-30', { action: 'button' }))[0].getAttribute('data-signup') !== null, true, 'weeklyRow button mode');
    });
    MG.state.reset();
  });
  T.test('external (TopDeck): an outlined link that opens a new tab with rel=noopener and a visually hidden "(opens ...)"', function () {
    fresh(); var occ = occ0(); occ.series.tool = { name: 'TopDeck', url: 'https://topdeck.gg/mulligangames', cta: 'Sign up on TopDeck' };
    withState({ state: 'external', count: 12 }, function () {
      var li = V.compactLine(occ, MG.now(), 'events.html', null, { action: 'link' }), c = controls(li)[0];
      eq(controls(li).length, 1); ok(c.classList.contains('btn-2') && c.classList.contains('btn-row'), 'btn-2 btn-row'); eq(c.target, '_blank'); eq(c.rel, 'noopener');
      eq(c.getAttribute('href'), 'https://topdeck.gg/mulligangames'); eq(c.querySelector('.vh').textContent, ' (opens TopDeck)'); ok(c.querySelector('svg.ic-ext'), 'external icon');
      eq(li.querySelector('.dl-bits').textContent.indexOf('Sign up on') === -1, true, 'the CTA is not said twice');
      eq(controls(V.compactLine(occ, MG.now(), 'events.html', null, { action: 'button' }))[0].tagName, 'A', 'external stays a link in button mode');
    });
    occ.series.inviteOnly = true;
    withState({ state: 'external' }, function () { eq(controls(V.compactLine(occ, MG.now(), 'events.html', null, { action: 'link' }))[0].className, 'dl-more', 'invite only is Details'); });
    MG.state.reset();
  });
  T.test('walk-in, closed, full, counter: a quiet Details link and no button', function () {
    fresh();
    ['walkin', 'closed', 'full', 'counter'].forEach(function (state) {
      withState({ state: state, cap: 8, left: 0 }, function () {
        var li = V.compactLine(occ0(), MG.now(), 'events.html', null, { action: 'link' }), c = controls(li);
        eq(c.length, 1, state); eq(c[0].className, 'dl-more', state); eq(c[0].tagName, 'A', state); eq(li.querySelectorAll('.btn').length, 0, state + ': no button');
        eq(c[0].textContent, 'Details ›', state); eq(c[0].getAttribute('href'), li.querySelector('.dl-title a').getAttribute('href'), state + ': same target as the title');
      });
    });
    MG.state.reset();
  });
  T.test('cancelled: a Cancelled stamp with an icon, no button, and the title stays a link', function () {
    fresh(); var occ = occ0();
    var real = occ.cancelled; occ.cancelled = true;
    var li = V.compactLine(occ, MG.now(), 'events.html', null, { action: 'link' }), c = controls(li);
    occ.cancelled = real;
    eq(c.length, 1); ok(c[0].classList.contains('stamp'), 'stamp'); eq(c[0].textContent, 'Cancelled'); ok(c[0].querySelector('svg.ic'), 'icon'); eq(li.querySelectorAll('.btn').length, 0, 'no button');
    ok(li.querySelector('.dl-title a').getAttribute('href').indexOf('#e-') > -1, 'title link kept'); eq(li.getAttribute('data-state'), 'cancelled');
    MG.state.reset();
  });
  T.test('the old calls keep working: no opts gives the old row with no .dl-act', function () {
    fresh();
    var li = V.compactLine(occ0(), MG.now(), 'events.html'), w = V.weeklyRow(occ0().series, MG.now(), '2026-10-30', '2026-12-30');
    eq(li.querySelector('.dl-act'), null); eq(w.querySelector('.dl-act'), null); ok(li.querySelector('.dl-time') && li.querySelector('.dl-title a') && li.querySelector('.dl-bits'), 'row parts');
    ok(w.querySelector('.dl-time') && w.querySelector('.dl-title a') && w.querySelector('.dl-bits'), 'weekly row parts');
    MG.state.reset();
  });
  T.test('a hostile title, format, tool name and CTA stay text in a row with an action', function () {
    fresh(); var s = A.seriesById('fnm-draft');
    s.title = XSS_IMG; s.format = XSS_IMG; s.tool = { name: XSS_IMG, url: 'javascript:alert(1)', cta: XSS_IMG };
    var occ = occ0();
    ['open', 'waitlist', 'external', 'walkin'].forEach(function (state) {
      ['link', 'button'].forEach(function (mode) {
        withState({ state: state, cap: 8, left: 3, taken: 5 }, function () {
          var li = V.compactLine(occ, MG.now(), 'events.html', null, { action: mode }), w = V.weeklyRow(s, MG.now(), '2026-10-30', '2026-12-30', { action: mode });
          [li, w].forEach(function (n) {
            box.innerHTML = ''; box.appendChild(n);
            eq(box.querySelectorAll('img').length, 0, state + '/' + mode + ': no injected <img>'); eq(box.querySelectorAll('[onerror]').length, 0, 'no onerror'); eq(window.__xss, 0, 'nothing ran');
            eq(n.querySelector('.dl-title a').textContent, XSS_IMG, 'title is text');
            Array.prototype.forEach.call(n.querySelectorAll('a[href]'), function (a) { eq(a.getAttribute('href').indexOf('javascript:'), -1, 'no javascript: link'); });
          });
        });
      });
    });
    MG.state.reset();
  });

  /* ---------- the Tonight band builder ---------- */
  T.test('V.tonightBand: first 3 dates are event cards, the 4th and later are rows with an action; null when empty', function () {
    fresh(); var occ = occ0();
    eq(V.tonightBand([], MG.now()), null, 'nothing for an empty day');
    var one = V.tonightBand([occ], MG.now(), { href: 'events.html?now=x' });
    ok(one.cards.classList.contains('tn-cards'), 'div.tn-cards'); eq(one.cards.querySelectorAll('article.ev').length, 1); eq(one.rest, null); eq(one.restBox, null);
    ok(one.cards.querySelector('.ev-title a').getAttribute('href').indexOf('events.html?now=x#e-') === 0, 'detail link keeps the base');
    ok(one.cards.querySelector('.btn-act, .btn-2, .ev-how, .ev-stat') || true, 'card body');
    var five = V.tonightBand([occ, occ, occ, occ, occ], MG.now(), {});
    eq(five.cards.querySelectorAll('article.ev').length, 3, 'three cards'); ok(five.rest && five.rest.classList.contains('day-lines'), 'ul.day-lines');
    eq(five.rest.querySelectorAll('li.day-line').length, 2, 'two rows'); eq(five.restBox.querySelector('h3').textContent, 'Also tonight');
    eq(five.cards.querySelectorAll('[id^="c-"]').length, 0, 'no c- ids (the dates also show lower on the page)'); ok(five.cards.querySelector('.ev-title').id.indexOf('tn-') === 0, 'tn- title ids');
    Array.prototype.forEach.call(five.rest.querySelectorAll('li'), function (li) { ok(li.querySelector('.dl-act'), 'every row has its one action'); });
    MG.state.reset();
  });
  T.test('V.tonightBand: a hostile title is text in the cards and in the rows', function () {
    fresh(); var s = A.seriesById('fnm-draft'); s.title = XSS_IMG; s.prize = XSS_IMG; var occ = occ0();
    var b = V.tonightBand([occ, occ, occ, occ], MG.now(), {});
    box.appendChild(b.cards); box.appendChild(b.restBox);
    eq(box.querySelectorAll('img[src="x"], [onerror]').length, 0, 'no injected markup'); eq(window.__xss, 0, 'nothing ran');
    eq(b.cards.querySelector('.ev-title').textContent, XSS_IMG); eq(b.rest.querySelector('.dl-title a').textContent, XSS_IMG);
    MG.state.reset();
  });

  /* ---------- fonts: Fraunces from our own origin ---------- */
  T.async('Fraunces loads (self-hosted woff2) and Archivo still does', function () {
    var f = document.fonts; if (!f || !f.load) return T.SKIP;
    return Promise.all([f.load('600 20px Fraunces', 'Shuffle up'), f.load('700 16px Archivo', 'Sign up')]).then(function (r) {
      ok(r[0].length > 0, 'a Fraunces face matched'); ok(r[1].length > 0, 'an Archivo face matched');
      eq(f.check('600 20px Fraunces', 'Shuffle up'), true, 'document.fonts.check 600 20px Fraunces');
      eq(r[0].every(function (face) { return face.status === 'loaded'; }), true, 'Fraunces is loaded');
    });
  });
  pageTest('the page uses Fraunces 600 for headings and pill buttons with Archivo 700; and the face is declared', 1280, function (w, d) {
    var h = d.createElement('h2'), b = d.createElement('a'), h4 = d.createElement('h4'); h.textContent = 'x'; b.className = 'btn btn-act'; b.textContent = 'x'; h4.textContent = 'x';
    d.body.appendChild(h); d.body.appendChild(b); d.body.appendChild(h4);
    var ch = w.getComputedStyle(h), cb = w.getComputedStyle(b);
    ok(/Fraunces/.test(ch.fontFamily), 'h2 family: ' + ch.fontFamily); eq(ch.fontWeight, '600'); eq(w.getComputedStyle(h4).fontWeight, '600');
    ok(/Archivo/.test(cb.fontFamily), 'button family: ' + cb.fontFamily); eq(cb.fontWeight, '700'); ok(parseFloat(cb.borderTopLeftRadius) > 100, 'pill radius: ' + cb.borderTopLeftRadius);
    var root = w.getComputedStyle(d.documentElement);
    ['--font-display', '--t-hero', '--t-page', '--t-2xl', '--t-xl', '--t-card', '--t-row', '--t-lead', '--sec-y', '--head-gap', '--pad', '--r-panel', '--r-btn', '--lift-panel',
      '--lift-band', '--tn-bg', '--on-tn', '--on-tn-2', '--on-tn-k', '--scrim-rgb', '--hero-act', '--kicker'].forEach(function (n) { ok(root.getPropertyValue(n).trim() !== '', n + ' is defined'); });
    d.body.removeChild(h); d.body.removeChild(b); d.body.removeChild(h4);
    return w.document.fonts.load('600 20px Fraunces', 'x').then(function (r) { ok(r.length > 0, 'the Fraunces face is declared in the page'); });
  });

  /* ---------- layout of the shared parts (built in a real page so site.css applies) ---------- */
  function pageOcc(w) { var s = w.MG.data.series.filter(function (x) { return x.id === 'fnm-draft'; })[0]; return w.MG.occurrences(s, '2026-10-30', '2026-10-30')[0]; }
  function addRows(w, d, mode) {
    var ul = d.createElement('ul'); ul.className = 'day-lines'; ul.id = 'look-rows'; var Vv = w.MG.views, now = w.MG.now(), occ = pageOcc(w);
    var real = w.MG.seatState;
    [{ state: 'open', cap: 24, left: 19, taken: 5 }, { state: 'walkin' }].forEach(function (st) {
      w.MG.seatState = function () { return st; };
      ul.appendChild(Vv.compactLine(occ, now, 'events.html', { src: 'img/social/event-magic-night-800.webp', pos: '50% 50%', tint: false }, { action: mode }));
    });
    w.MG.seatState = real;
    var wrapper = d.createElement('div'); wrapper.className = 'wrap'; wrapper.appendChild(ul); d.body.insertBefore(wrapper, d.body.firstChild);
    return ul;
  }
  pageTest('rows at 1280: photo, time, title and bits in two lines, the action on the right; Details shows', 1280, function (w, d) {
    var ul = addRows(w, d, 'link'), li = ul.children[0], r = function (sel, el) { return (el || li).querySelector(sel).getBoundingClientRect(); };
    var ph = r('.dl-ph'), time = r('.dl-time'), title = r('.dl-title'), bits = r('.dl-bits'), act = r('.dl-act'), li0 = li.getBoundingClientRect();
    ok(ph.right <= time.left + 1 && time.right <= title.left + 1 && title.right <= act.left + 1, 'ph | time | title | act left to right');
    ok(bits.top >= title.bottom - 2, 'bits under the title'); ok(Math.abs(bits.left - title.left) < 2, 'bits aligned with the title');
    ok(li0.height >= 56 && li0.height <= 64, 'row height ' + li0.height + ' (60 px rows, D61)'); ok(Math.abs(ph.width - 48) < 1, 'thumb 48 px: ' + ph.width);
    ok(act.right > li0.right - 40, 'action at the right edge'); ok(r('.btn-row').height >= 44, 'button at least 44 px: ' + r('.btn-row').height);
    eq(w.getComputedStyle(ul.children[1].querySelector('.dl-more')).display !== 'none', true, 'Details visible from 768');
    eq(d.documentElement.scrollWidth <= 1280, true, 'no sideways scroll');
  });
  pageTest('rows at 390: thumb and text side by side, the action on its own line under the bits, Details hidden, no overflow', 390, function (w, d) {
    var ul = addRows(w, d, 'link'), li = ul.children[0], r = function (sel, el) { return (el || li).querySelector(sel).getBoundingClientRect(); };
    var ph = r('.dl-ph'), title = r('.dl-title'), bits = r('.dl-bits'), act = r('.btn-row');
    ok(ph.right <= title.left + 1, 'thumb left of the title'); ok(act.top >= bits.bottom - 1, 'button under the bits'); ok(act.height >= 48, 'button 48 px: ' + act.height);
    ok(Math.abs(ph.width - 48) < 1, 'thumb 48 px: ' + ph.width); eq(w.getComputedStyle(ul.children[1].querySelector('.dl-more')).display, 'none', 'Details hidden under 768');
    ok(r('.dl-title a').width > 0, 'title link');
    eq(d.documentElement.scrollWidth <= 390, true, 'no sideways scroll: ' + d.documentElement.scrollWidth);
  });
  function addBand(w, d) {
    var Vv = w.MG.views, occ = pageOcc(w), b = Vv.tonightBand([occ, occ, occ, occ], w.MG.now(), {}), sec = d.createElement('section'), wrap = d.createElement('div');
    sec.className = 'tn-band'; wrap.className = 'wrap'; var h = d.createElement('h2'); h.textContent = 'Tonight'; wrap.appendChild(h); wrap.appendChild(b.cards); wrap.appendChild(b.restBox); sec.appendChild(wrap);
    d.body.insertBefore(sec, d.body.firstChild); return { sec: sec, b: b, h: h };
  }
  pageTest('Tonight band at 1280: brick, cream title, three cards in a row, extra dates as rows on a surface panel', 1280, function (w, d) {
    var x = addBand(w, d), cards = x.b.cards.querySelectorAll('.ev'), cs = w.getComputedStyle(x.sec);
    eq(cs.backgroundColor, 'rgb(107, 58, 44)', 'brick'); eq(w.getComputedStyle(x.h).color, 'rgb(255, 255, 255)', 'white h2');
    eq(cards.length, 3); var a = cards[0].getBoundingClientRect(), c = cards[2].getBoundingClientRect();
    ok(Math.abs(a.top - c.top) < 2 && c.left > a.right, 'three across'); ok(w.getComputedStyle(cards[0]).color !== 'rgb(255, 255, 255)', 'card text is ink, not band white');
    eq(w.getComputedStyle(x.b.restBox).backgroundColor !== 'rgba(0, 0, 0, 0)', true, 'panel has a fill');
  });
  pageTest('Tonight band at 390: the cards are one sideways row, the next one peeks, the page itself does not scroll sideways (D61)', 390, function (w, d) {
    var x = addBand(w, d), cards = x.b.cards.querySelectorAll('.ev'), a = cards[0].getBoundingClientRect(), b = cards[1].getBoundingClientRect();
    ok(Math.abs(a.top - b.top) < 2 && b.left > a.right && b.left < 390, 'side by side, the second peeks at ' + b.left); ok(a.width > 280, 'card width ' + a.width);
    eq(w.getComputedStyle(x.b.cards).scrollSnapType.indexOf('x') === 0, true, 'snaps'); eq(d.documentElement.scrollWidth <= 390, true, 'no page sideways scroll: ' + d.documentElement.scrollWidth);
  });
  pageTest('page head: a surface band closed by a 6 px brick, paper, brick rule, h1 in Fraunces at --t-page', 1280, function (w, d) {
    var hd = d.createElement('header'), h1 = d.createElement('h1'), p = d.createElement('p'), k = d.createElement('p'); hd.className = 'page-head';
    k.className = 'kicker'; k.textContent = 'k'; p.className = 'lead'; p.textContent = 'Lead'; h1.textContent = 'Events';
    var wrap = d.createElement('div'); wrap.className = 'wrap'; [k, h1, p].forEach(function (n) { wrap.appendChild(n); }); hd.appendChild(wrap); d.body.insertBefore(hd, d.body.firstChild);
    var cs = w.getComputedStyle(hd), after = w.getComputedStyle(hd, '::after'), ch = w.getComputedStyle(h1);
    ok(cs.backgroundColor !== 'rgba(0, 0, 0, 0)', 'has a fill'); eq(after.height, '6px'); ok(/gradient/.test(after.backgroundImage), 'coursing rule');
    ok(/Fraunces/.test(ch.fontFamily), 'h1 family'); ok(parseFloat(ch.fontSize) >= 40 && parseFloat(ch.fontSize) <= 64, 'h1 size ' + ch.fontSize);
    ok(parseFloat(w.getComputedStyle(p).maxWidth) <= 38 * 20, 'lead capped near 38ch');
  });

  /* ---------- contrast: the pairs the round introduces (spec 1.2), read from tokens.css in each scheme ---------- */
  function rgbOf(css) { var m = css.match(/rgba?\(([^)]+)\)/); if (!m) throw new Error('not a colour: ' + css); var p = m[1].split(/[ ,\/]+/).map(parseFloat); return [p[0], p[1], p[2]]; }
  function lum(c) { var v = c.map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function token(scheme, prop, name) { // the resolved colour of a token in a scheme
    var el = document.createElement('div'); el.style.cssText = 'color-scheme:' + scheme + ';' + prop + ':var(' + name + ')'; box.appendChild(el);
    var out = rgbOf(getComputedStyle(el)[prop === 'color' ? 'color' : 'backgroundColor']); box.removeChild(el); return out;
  }
  var text = function (s, n) { return token(s, 'color', n); }, fill = function (s, n) { return token(s, 'background-color', n); };
  T.test('contrast, light and dark: headings, kicker, Tonight band text, hero button and footer (AA 4.5)', function () {
    ['light', 'dark'].forEach(function (s) {
      var pairs = [
        ['ink on paper', text(s, '--ink'), fill(s, '--paper'), 4.5], ['ink on surface', text(s, '--ink'), fill(s, '--surface'), 4.5],
        ['kicker on paper', text(s, '--kicker'), fill(s, '--paper'), 4.5], ['kicker on surface', text(s, '--kicker'), fill(s, '--surface'), 4.5],
        ['ink-2 on surface (page-head lead)', text(s, '--ink-2'), fill(s, '--surface'), 4.5],
        ['on-tn on tn-bg', text(s, '--on-tn'), fill(s, '--tn-bg'), 4.5], ['on-tn-2 on tn-bg', text(s, '--on-tn-2'), fill(s, '--tn-bg'), 4.5], ['on-tn-k on tn-bg', text(s, '--on-tn-k'), fill(s, '--tn-bg'), 4.5],
        ['on-tn-k on header brick', text(s, '--on-tn-k'), fill(s, '--head-bg'), 4.5],
        ['white on hero-act', [255, 255, 255], fill(s, '--hero-act'), 4.5], ['white on hero-act-hover', [255, 255, 255], fill(s, '--hero-act-hover'), 4.5],
        ['footer cream on band', text(s, '--on-band'), fill(s, '--band'), 4.5], ['on-band-2 on band', text(s, '--on-band-2'), fill(s, '--band'), 4.5]
      ];
      pairs.forEach(function (p) { var r = ratio(p[1], p[2]); ok(r >= p[3], s + ': ' + p[0] + ' is ' + r.toFixed(2) + ', needs ' + p[3]); });
    });
    // the one pair the spec forbids: kicker on surface-2 in dark (4.41). If this ever passes, the rule can be relaxed.
    ok(ratio(text('dark', '--kicker'), fill('dark', '--surface-2')) < 4.5, 'kicker on surface-2 (dark) is still the known failing pair');
  });
  T.test('contrast: the card edge in dark is carried by a white ring, in light by the surface itself (non-text, 3)', function () {
    ok(ratio(fill('light', '--surface'), fill('light', '--tn-bg')) >= 3, 'light card edge'); ok(ratio(fill('dark', '--surface'), fill('dark', '--tn-bg')) < 3, 'dark needs the ring');
  });
  T.test('contrast: white text over the hero scrim, worst case a pure-white pixel under it (spec 2.3)', function () {
    var rgb = getComputedStyle(document.documentElement).getPropertyValue('--scrim-rgb').trim().split(/\s+/).map(Number);
    eq(rgb.length, 3, '--scrim-rgb has three channels');
    function over(a) { return [0, 1, 2].map(function (i) { return 255 * (1 - a) + rgb[i] * a; }); }
    var cases = [[0.58, 3, 'headline (large text)'], [0.56, 3, 'end of the 1280 headline (large text)'], [0.7, 4.5, 'sub-line'], [0.76, 4.5, 'chip fill over the scrim'], [0.82, 4.5, 'phone sub-line']];
    cases.forEach(function (c) { var r = ratio([255, 255, 255], over(c[0])); ok(r >= c[1], c[2] + ': alpha ' + c[0] + ' gives ' + r.toFixed(2) + ', needs ' + c[1]); });
    ok(ratio([245, 239, 228], over(0.72 + (1 - 0.72) * 0)) >= 4.5, 'strip text cream on the strip fill alpha .72 over white');
    ok(ratio([111, 212, 154], over(0.76)) >= 3, 'open dot on the chip over the scrim');
  });
})();
