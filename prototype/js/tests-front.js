/* Tests for the public pages (round 2, package A): the default demo clock, ?now= kept on every link, one-step sign-up,
 * the compact week, the Tonight block, the confirmation copy, and that hostile text in the new rows stays text.
 * Loaded by tests.html after tests-shared.js. Page checks run in an iframe (needs file access, otherwise skipped). */
(function () {
  'use strict';
  var T = window.T, MG = window.MG, D = MG.data, V = MG.views, A = MG.act;
  var eq = T.eq, ok = T.ok;
  var box = document.getElementById('sandbox');
  var BASE = location.href.replace(/[^\/]*$/, '').split('?')[0];
  var XSS_IMG = '<img src=x onerror="window.__xss=1">';

  function openPage(path, width) {
    return new Promise(function (resolve, reject) {
      var f = document.createElement('iframe'), errors = [], settled = false;
      f.style.cssText = 'position:absolute;left:-9999px;width:' + (width || 1280) + 'px;height:900px';
      f.addEventListener('load', function () {
        try {
          var w = f.contentWindow; void w.document.body;
          var ce = w.console.error; w.console.error = function () { errors.push(Array.prototype.join.call(arguments, ' ')); ce.apply(w.console, arguments); };
          setTimeout(function () { if (!settled) { settled = true; resolve({ w: w, d: w.document, errors: errors, frame: f }); } }, 300);
        } catch (err) { reject(new Error('NOACCESS')); }
      });
      document.body.appendChild(f); f.src = BASE + path;
    });
  }
  function pageTest(name, path, fn, width) {
    T.async(name, function () {
      return openPage(path, width).then(function (p) {
        return Promise.resolve(fn(p.w, p.d, p)).then(function () {
          eq(p.errors.join(' | '), '', 'console errors'); p.frame.remove();
        }, function (err) { p.frame.remove(); throw err; });
      }, function (err) { if (err && err.message === 'NOACCESS') return T.SKIP; throw err; });
    });
  }
  function click(el) { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); }
  function fresh() { MG.state.reset(); MG.now = function () { return new Date(2026, 9, 30, 18, 50); }; box.innerHTML = ''; window.__xss = 0; }

  T.section('Public pages: clock, links, sign-up, compact week, Tonight');

  /* ---------- A1 the default clock ---------- */
  pageTest('no ?now= opens on Friday Oct 30, 6:50 PM; ?now=real uses the real day (or the demo day outside the sample window)', 'events.html', function (w) {
    var n = w.MG.now();
    eq(w.MG.ymd(n), '2026-10-30'); eq(n.getHours() * 60 + n.getMinutes(), 18 * 60 + 50);
    return openPage('events.html?now=real').then(function (p) {
      var real = new Date(), win = D.window, inWin = MG.ymd(real) >= win.from && MG.ymd(real) <= win.to;
      eq(p.w.MG.ymd(p.w.MG.now()), inWin ? MG.ymd(real) : '2026-10-30');
      p.frame.remove();
    });
  });
  T.test('"Friday 6:50 PM" is one of the demo moments and the default', function () {
    ok(D.demoMoments.some(function (m) { return m.label === 'Friday 6:50 PM' && m.now === '2026-10-30T18:50'; }), 'moment listed');
    eq(D.demoNow, '2026-10-30T18:50');
  });

  /* ---------- A1 + A8 the front page ---------- */
  pageTest('front page at 6:50 PM Friday: tonight\'s 7 PM events take sign-ups', 'index.html', function (w, d) {
    var today = d.getElementById('d-2026-10-30');
    ok(today, 'today\'s day');
    var acts = Array.prototype.map.call(today.querySelectorAll('.ev .btn'), function (b) { return b.textContent; });
    ok(acts.indexOf('Join the waitlist') !== -1, 'Draft FNM offers the waitlist: ' + acts.join(','));
    ok(today.textContent.indexOf('Nexus Nights') !== -1, 'Nexus Nights is tonight');
  });
  pageTest('front page: today and the next day are cards, later days are one line per event, ids kept, see-all link', 'index.html?now=2026-10-30T19:30', function (w, d) {
    ok(d.querySelectorAll('#d-2026-10-30 .ev').length >= 1, 'today is full cards');
    ok(d.querySelectorAll('#d-2026-10-31 .ev').length >= 1, 'the next day is full cards');
    var lines = d.querySelectorAll('#d-2026-11-04 .day-line');
    ok(lines.length >= 3, 'Wednesday is lines');
    eq(d.querySelectorAll('#d-2026-11-04 .ev').length, 0, 'no cards on a compact day');
    var first = lines[0];
    ok(/PM/.test(first.querySelector('.dl-time').textContent), 'time'); ok(first.querySelector('.dl-title a'), 'title is the link');
    ok(/Free|\$\d/.test(first.querySelector('.dl-bits').textContent), 'fee in words');
    eq(d.querySelectorAll('.day-more').length, 0, 'one link to the events page per job: no "See all N events" line (F21)');
    ok(d.querySelector('.week .sec-head .more'), 'the head link stays'); ok(d.querySelector('.later .more'), '"See every date" stays');
    Array.prototype.forEach.call(d.querySelectorAll('.wdeck a'), function (a) { ok(d.querySelector(a.getAttribute('href')), 'week strip target ' + a.getAttribute('href')); });
  });

  /* ---------- A2 now= kept on every link ---------- */
  pageTest('front page ?now=: every link to a .html page carries it, cards included', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var links = Array.prototype.filter.call(d.querySelectorAll('a[href]'), function (a) { return /\.html(\?|#|$)/.test(a.getAttribute('href')) && !/^https?:/.test(a.getAttribute('href')); });
    ok(links.length >= 8, 'found ' + links.length + ' page links');
    links.forEach(function (a) {
      var q = a.getAttribute('href').split('#')[0].split('?')[1] || '';
      eq(new URLSearchParams(q).get('now'), '2026-10-30T19:30', a.getAttribute('href'));
    });
    var su = d.querySelector('.ev .btn-act[href*="#su-"]'); ok(su, 'a sign-up link on a card'); ok(/^events\.html\?now=/.test(su.getAttribute('href')), su.getAttribute('href'));
    ok(d.querySelector('#nav-all, .site-nav li:first-child a').textContent === 'All events', 'All events is first in the nav');
  });
  pageTest('front page without ?now=: links stay plain', 'index.html', function (w, d) {
    eq(d.querySelector('.site-nav li:first-child a').getAttribute('href'), 'events.html');
  });

  /* ---------- round 4, package A: one look for the front page ---------- */
  pageTest('walk-in is said once: no card or row on the front page says "Walk in", the section note does', 'index.html', function (w, d) {
    var bad = Array.prototype.filter.call(d.querySelectorAll('#days .ev:not([data-state="closed"]), #days .day-line, #later li'), function (n) { return /Walk in/i.test(n.textContent); });
    eq(bad.length, 0, 'cards or rows with "Walk in": ' + bad.map(function (n) { return n.textContent.slice(0, 40); }).join(' | '));
    ok(/Most nights are walk-in\. Cards with a Sign up button hold seats\./.test(d.querySelector('.week-note').textContent), 'the note');
    ok(/Sign up here|Join the waitlist|Sign up/.test(d.querySelector('#d-2026-10-30').textContent), 'exceptions keep their words');
  });
  pageTest('cEDH ticket: "10 AM · $60" and "80 registered" (no tool name repeated)', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var t = d.querySelector('#cedh-list .tix'); ok(t, 'a ticket');
    eq(t.querySelector('.tix-what p').textContent, '10 AM · $60');
    eq(t.querySelector('.ev-stat-big').textContent + ' ' + t.querySelector('.ev-stat-unit').textContent, '80 registered');
    eq(d.querySelectorAll('#cedh-list .ev-stat-small').length, 0, 'no small "on TopDeck" line');
    ok(!/Preorders in store only/.test(d.getElementById('rel-list').textContent), 'preorder tiles do not repeat the section note');
    eq(d.querySelectorAll('.rel-art').length, 0, 'no tinted icon band on the tiles');
  });
  // round 5: the wide hero is the landscape still; the portrait video is phone-only
  pageTest('at 1280 px the hero uses the shop-floor still, the video has no source and is not started, no pause control', 'index.html', function (w, d) {
    var img = d.querySelector('#hero-media img'); ok(/shop-floor-cases/.test(img.currentSrc), 'hero image is ' + img.currentSrc);
    var v = d.getElementById('hero-video'); eq(v.querySelectorAll('source').length, 0, 'no <source>'); ok(!v.getAttribute('src') && !v.getAttribute('poster'), 'no src or poster'); ok(v.paused, 'not playing'); eq(v.currentSrc, '', 'nothing loaded');
    eq(w.getComputedStyle(d.getElementById('vid-btn')).display, 'none', 'pause control hidden');
    ok(/shop floor at 445 York Rd/.test(d.querySelector('.cap-wide').textContent) && w.getComputedStyle(d.querySelector('.cap-wide')).display !== 'none' && w.getComputedStyle(d.querySelector('.cap-narrow')).display === 'none', 'wide caption');
  });
  pageTest('at 390 px the hero keeps the portrait poster and the video loop, with the pause control', 'index.html', function (w, d) {
    var img = d.querySelector('#hero-media img'); ok(/cedh-players-tables-loop-poster/.test(img.currentSrc), 'poster ' + img.currentSrc);
    var v = d.getElementById('hero-video');
    return T.wait(700).then(function () {
      eq(v.querySelectorAll('source').length, 2, 'video sources added');
      ok(d.getElementById('vid-btn').classList.contains('is-ready'), 'pause control ready');
    });
  }, 390);
  pageTest('tiles without a note have no empty body, and the footers line up on a shared row', 'index.html', function (w, d) {
    w.MG.data.releases.filter(function (r) { return r.id === 'delta-reign'; })[0].note = '';
    var s2 = d.createElement('script'); s2.src = BASE + 'js/front.js'; // render again with the note gone
    return new Promise(function (res) { s2.onload = res; s2.onerror = res; d.body.appendChild(s2); }).then(function () { return T.wait(100); }).then(function () {
      var tiles = [].slice.call(d.querySelectorAll('#rel-list .rel')); ok(tiles.length > 1, 'tiles');
      tiles.forEach(function (t) { var b = t.querySelector('.rel-text'); ok(!b || b.textContent.trim() !== '', 'no empty body in ' + t.querySelector('.rel-name').textContent); });
      var dr = d.querySelector('#rel-list .rel[data-game="pokemon"]'); ok(dr && !dr.querySelector('.rel-text'), 'the Delta Reign tile has no body');
      var offs = tiles.filter(function (t) { return t.querySelector('.rel-foot'); }).map(function (t) { return Math.round(t.getBoundingClientRect().bottom - t.querySelector('.rel-foot').getBoundingClientRect().bottom); });
      ok(offs.length > 1 && offs.every(function (x) { return x === offs[0]; }), 'footers sit the same distance from the tile bottom: ' + offs.join(','));
    });
  });
  pageTest('Inside the shop shows at most four lazy photos with alt text and sizes', 'index.html', function (w, d) {
    var im = [].slice.call(d.querySelectorAll('.shots img')); ok(im.length <= 4 && im.length > 0, im.length + ' photos');
    im.forEach(function (i) { ok(i.alt.length > 15 && i.loading === 'lazy' && i.width > 0 && i.getAttribute('height'), 'alt/lazy/size ' + i.src); });
  });
  // round 5 part 2 (D39): five-star Google quotes, TopDeck fees, turnout, TCGplayer line
  pageTest('Between events: the Google rating line and exactly three quotes with name and age', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var r = d.querySelector('#proof-rate a'); ok(r.textContent.indexOf('4.9 on Google · 81 reviews') === 0, 'rating line: ' + r.textContent); ok(r.href.indexOf('https://www.google.com/maps') === 0, 'maps link');
    var q = d.querySelectorAll('#proof li'); eq(q.length, 3, 'three quotes');
    [].forEach.call(q, function (li) { ok(li.querySelector('q').textContent.length > 20, 'a quote'); var sm = li.querySelector('small').textContent; ok(/^[A-Z][a-z]+ [A-Z][.], .*ago$/.test(sm), 'first name + initial, age: ' + sm); });
    eq(d.querySelectorAll('#proof q').length, 3, 'quotes are q elements');
  });
  pageTest('hostile review text and turnout titles stay text', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var X = w.MG.data; X.store.reviews.items[0].text = XSS_IMG; X.store.reviews.items[0].name = XSS_IMG; X.circuit.events.forEach(function (r) { r.title = XSS_IMG; });
    var s2 = d.createElement('script'); s2.src = BASE + 'js/front.js';
    return new Promise(function (res) { s2.onload = res; s2.onerror = res; d.body.appendChild(s2); }).then(function () { return T.wait(100); }).then(function () {
      eq(w.__xss || 0, 0, 'nothing ran'); eq(d.querySelectorAll('img[src="x"], [onerror]').length, 0, 'no injected markup');
      eq(d.querySelector('#proof li q').textContent, XSS_IMG, 'quote is text'); eq(d.querySelector('#cedh-turnout .turnout-t').textContent, XSS_IMG, 'turnout title is text');
    });
  });
  pageTest('cEDH fees come from the verified TopDeck numbers: MCS $60, 5K $100, Redemption $35, deposit said once', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var fee = function (k) { return w.MG.data.series.filter(function (x) { return x.cedhSeries === k; })[0].fee; };
    eq(fee('mcs'), 60); eq(fee('5k'), 100); eq(fee('redemption'), 35);
    var t = d.getElementById('cedh-fees').textContent; ok(t.indexOf('Championship Series $60, 5K $100, Redemption $35 ($25 after the 5K)') === 0, t);
    eq(d.getElementById('cedh').textContent.split('$10 online deposit').length - 1, 1, 'the deposit appears once');
  });
  pageTest('Recent turnout: the last four past events, newest first, plus one TopDeck standings link', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var li = d.querySelectorAll('#cedh-turnout li'); eq(li.length, 4, 'four rows');
    eq(li[0].textContent.split(' ').join('').length > 0 ? li[0].textContent : '', 'Oct 4Championship Series69 players');
    ok(/69 players/.test(d.getElementById('cedh-last').textContent), 'last Championship Series line agrees with the list');
    var a = d.querySelector('.turnout-more'); ok(a.textContent.indexOf('Full standings on TopDeck') === 0 && a.href.indexOf('topdeck.gg') > 0, 'standings link');
  });
  pageTest('one quiet TCGplayer line under the preorders', 'index.html', function (w, d) {
    var a = d.querySelector('#tcg-line a'); ok(a.textContent.indexOf('Shop Pokemon Japan and Magic cards online on TCGplayer') === 0 && a.href.indexOf('tcgplayer.com/sellers/Mulligan-Gaming-LLC/0062555a') > 0, 'link');
  });
  pageTest('closed Monday and Tuesday are one quiet line with both anchors (F9)', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var off = d.querySelectorAll('#days .day-off'); eq(off.length, 1, 'one .day-off');
    eq(off[0].querySelector('p').textContent, 'Monday and Tuesday · closed');
    ok(off[0].querySelector('#d-2026-11-02') && off[0].querySelector('#d-2026-11-03'), 'both d- anchors');
    eq(d.querySelectorAll('#days .day-closed').length, 0, 'no per-day closed rows');
    ok(d.querySelector('.wdeck a[href="#d-2026-11-02"]') && d.querySelector('#d-2026-11-02'), 'the week strip still has its target');
  });
  pageTest('hours: the changed hours get a tag, the reason is one line under the table (F15)', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var sun = d.querySelector('#hours-body tr:last-child td'); eq(sun.firstChild.textContent, '10 AM to 10 PM'); eq(sun.querySelector('.tag-upd').textContent, 'Nov 1');
    eq(d.querySelector('#hours-why').textContent, 'Sun Nov 1 opens at 10 AM for the cEDH Championship Series.');
    ok(!d.querySelector('.hours').contains(d.getElementById('hours-why')), 'the reason is outside the table'); eq(d.querySelectorAll('.hours-note').length, 0, 'no bold note in a cell');
  });
  pageTest('bands: brown in light, lighter than the page and edged in dark; no "Theme" word (F4, F16)', 'index.html', function (w, d) {
    var cs = function (s) { return w.getComputedStyle(d.querySelector(s)); };
    try {
      d.querySelector('[data-scheme="light"]').click();
      eq(cs('.site-foot').backgroundColor, 'rgb(62, 42, 34)', 'light footer band'); eq(cs('.cedh').backgroundColor, 'rgb(62, 42, 34)', 'light cEDH band');
      d.querySelector('[data-scheme="dark"]').click();
      ok(cs('.site-foot').backgroundColor !== cs('body').backgroundColor, 'dark footer differs from the page');
      eq(cs('.site-foot').backgroundColor, 'rgb(42, 29, 23)', 'dark footer band'); eq(cs('.cedh').backgroundColor, 'rgb(42, 29, 23)', 'dark cEDH band');
      ok(cs('.site-foot').borderTopWidth !== '0px' && cs('.cedh').borderTopWidth !== '0px', 'a hairline edge in dark');
    } finally { try { w.localStorage.removeItem('mg-scheme'); } catch (err) { /* nothing stored */ } }
    ok(!/Theme/.test(d.body.textContent), 'no "Theme" text'); eq(d.querySelectorAll('.scheme button').length, 2, 'Light and Dark buttons stay');
    eq(d.querySelector('.scheme').textContent.replace(/\s+/g, ' ').trim(), 'Light Dark');
  });
  pageTest('the footer is an index: four columns at 1280, Explore links keep ?now=', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var cols = ['.foot-brand', '.foot-visit', '.foot-hours', '.foot-explore'].map(function (s) { return d.querySelector(s).getBoundingClientRect().left; });
    ok(cols[0] < cols[1] && cols[1] < cols[2] && cols[2] < cols[3], 'side by side: ' + cols.join(','));
    var all = d.querySelector('.foot-explore a'); eq(all.textContent, 'All events'); ok(/now=2026-10-30T19%3A30/.test(all.getAttribute('href')), all.getAttribute('href'));
    eq(Array.prototype.map.call(d.querySelectorAll('.foot-hours li'), function (l) { return l.textContent; }).join('|'), 'Wed–Thu 2–10 PM|Fri–Sat 2 PM–midnight|Sun 1–10 PM|Mon–Tue closed');
  }, 1280);
  pageTest('at 390 px the week strip is seven fitted tiles without sideways scroll, and the hero strip clears the bottom bar (F17, F18)', 'index.html', function (w, d) {
    var tiles = d.querySelectorAll('.wdeck .daycard'); eq(tiles.length, 7);
    Array.prototype.forEach.call(tiles, function (a) { ok(a.getBoundingClientRect().width >= 40, 'tile ' + a.getBoundingClientRect().width); });
    var ol = d.querySelector('.wdeck ol'); ok(ol.scrollWidth <= ol.clientWidth + 1, 'the strip does not scroll sideways');
    var bottom = d.querySelector('.phero-strip').getBoundingClientRect().bottom + w.scrollY; ok(bottom <= w.innerHeight - 56, 'hero strip bottom ' + bottom + ' clears the 56 px bar at ' + w.innerHeight);
  }, 390);
  pageTest('at 1280 the game chips are one row, and a card has no price circle or stat box unless it needs attention (F1, F6)', 'index.html', function (w, d) {
    var tops = {}; Array.prototype.forEach.call(d.querySelectorAll('.chip'), function (c) { tops[Math.round(c.getBoundingClientRect().top)] = 1; });
    eq(Object.keys(tops).length, 1, 'chip rows: ' + Object.keys(tops).join(','));
    var cost = d.querySelector('#days .ev-cost'); if (cost) eq(w.getComputedStyle(cost).borderTopWidth, '0px', 'no circle around the price');
    var open = d.querySelector('#days .ev[data-state="open"] .ev-stat'); if (open) { eq(w.getComputedStyle(open).backgroundColor, 'rgba(0, 0, 0, 0)', 'plain stat text'); eq(w.getComputedStyle(open).borderTopColor, 'rgba(0, 0, 0, 0)'); }
    var full = d.querySelector('#days .ev[data-state="waitlist"] .ev-stat, #days .ev[data-state="full"] .ev-stat'); ok(full, 'a full or waitlist card exists'); if (full) ok(w.getComputedStyle(full).backgroundColor !== 'rgba(0, 0, 0, 0)', 'the box stays when it needs attention');
    eq(w.getComputedStyle(d.querySelector('.slot-t')).display, 'none', 'the repeated time label is hidden');
  }, 1280);

  /* ---------- A3 phone order ---------- */
  // round 3 (D36): a full-bleed photo hero; tonight's headline and "next up" stay in the first screen, the week strip follows the hero
  pageTest('at 390 px the headline and next up are inside the first screen, the week strip right after the hero', 'index.html', function (w, d) {
    var box = function (s) { var r = d.querySelector(s).getBoundingClientRect(); return { top: r.top + w.scrollY, bottom: r.bottom + w.scrollY, width: r.width }; };
    ok(box('#hero-h').top < 600, 'h1 at ' + box('#hero-h').top); ok(box('#nextup').bottom < 844, 'next up ends at ' + box('#nextup').bottom);
    ok(box('#deck').top - box('.phero').bottom < 260, 'strip ' + (box('#deck').top - box('.phero').bottom) + ' px below the hero');
    ok(box('#hero-media').width >= d.documentElement.clientWidth - 1, 'the photo spans the full width');
  }, 390);
  pageTest('at 1280 px the hero photo spans the full width and the headline is white on the scrim', 'index.html', function (w, d) {
    ok(d.querySelector('#hero-media').getBoundingClientRect().width >= d.documentElement.clientWidth - 1, 'full width');
    eq(w.getComputedStyle(d.querySelector('#hero-h')).color, 'rgb(255, 255, 255)');
  }, 1280);

  /* ---------- A9 sign-up in one step ---------- */
  pageTest('events.html#su-<key> opens the sign-up form with no detail dialog behind it', 'events.html?now=2026-10-28T16:00#su-pauper%402026-10-28', function (w, d) {
    var form = d.querySelector('dialog[open] form.su'); ok(form, 'form is open'); eq(form.getAttribute('data-key'), 'pauper@2026-10-28');
    eq(d.getElementById('det-dlg').open, false, 'the detail dialog is not open');
    eq(d.querySelectorAll('dialog[open]').length, 1, 'one dialog');
  });
  pageTest('detail dialog: Sign up replaces the body with the form, Back to details returns', 'events.html?now=2026-10-28T16:00#e-pauper%402026-10-28', function (w, d) {
    ok(d.querySelector('#det-body .det'), 'detail shown');
    click(d.querySelector('#det-body [data-signup]'));
    ok(d.querySelector('#det-body form.su'), 'form in the same dialog'); eq(d.querySelectorAll('dialog[open]').length, 1, 'not stacked');
    var back = d.querySelector('#det-body [data-back]'); ok(back && back.textContent === 'Back to details');
    click(back); ok(d.querySelector('#det-body .det') && !d.querySelector('#det-body form.su'), 'back to the detail');
  });
  pageTest('a card\'s Sign up on the events page opens the form (no navigation)', 'events.html?now=2026-10-28T16:00', function (w, d) {
    var a = d.querySelector('.ev .btn-act[href*="#su-"]'); ok(a, 'card sign-up link'); click(a);
    ok(d.querySelector('dialog[open] form.su'), 'form open');
  });

  /* ---------- A10 Tonight ---------- */
  pageTest('events.html Tonight block lists today\'s dates in time order, and only those', 'events.html?now=2026-10-30T18:50', function (w, d) {
    var wrap = d.getElementById('today-wrap'); eq(wrap.hidden, false); eq(d.getElementById('today-h').textContent, 'Tonight');
    var want = w.MG.allOccurrences('2026-10-30', '2026-10-30').filter(function (o) { return o.endAt > w.MG.now() && o.series.enabled !== false; });
    var got = Array.prototype.map.call(wrap.querySelectorAll('.ev-title'), function (t) { return t.textContent; });
    eq(got.length, want.length, 'one card per date: ' + got.join(', '));
    want.forEach(function (o) { ok(got.indexOf(o.series.title) !== -1, o.series.title + ' is in the block'); });
    var times = Array.prototype.map.call(wrap.querySelectorAll('.slot-t time'), function (t) { return t.textContent; });
    var order = want.map(function (o) { return o.start; }).sort().filter(function (v, i, a) { return a.indexOf(v) === i; }).map(function (hm) { return w.MG.fmtTime(hm); });
    eq(times.join('|'), order.join('|'), 'time order');
    eq(wrap.querySelectorAll('[id^="c-"]').length, 0, 'no duplicate card ids');
  });
  pageTest('events.html: Tonight is hidden on a day with nothing', 'events.html?now=2026-10-26T12:00', function (w, d) {
    eq(d.getElementById('today-wrap').hidden, true);
  });
  pageTest('events.html: Tonight respects the game filter', 'events.html?now=2026-10-30T18:50&game=pokemon', function (w, d) {
    Array.prototype.forEach.call(d.querySelectorAll('#today .ev'), function (c) { eq(c.getAttribute('data-game'), 'pokemon'); });
  });

  /* ---------- R17 confirmation copy ---------- */
  T.test('confirmation: one payment phrase, the personal link, and "We emailed it too." only with an email', function () {
    fresh();
    var occ = A.occByKey('fnm-draft@2026-10-30'), res = { ok: true, status: 'in', seat: 5 };
    var aEl = V.signupDone(occ, res, { email: 'x@example.com' }), a = aEl.textContent, b = V.signupDone(occ, res, { email: '' }).textContent;
    ok(a.indexOf('Pay $20 at the counter when you arrive.') !== -1, 'payment phrase');
    ok(a.indexOf('Keep this link to cancel or check your place:') !== -1, 'link line'); ok(aEl.querySelector('input[readonly]') && aEl.querySelector('[data-copy-link]'), 'read-only link and Copy');
    ok(a.indexOf('We emailed it too.') !== -1, 'emailed'); ok(b.indexOf('We emailed it too.') === -1, 'not emailed without an email');
    var form = V.signupForm(occ, MG.seatState(occ, MG.now()));
    ok(form.indexOf('Pay $20 at the counter when you arrive.') !== -1, 'same phrase in the form');
    var w = V.signupDone(occ, { ok: true, status: 'waitlist', position: 4 }, {}).textContent;
    ok(w.indexOf('this page') === -1 && w.indexOf('link below') !== -1, 'waitlist points at the link');
    var free = A.occByKey('pokemon-learn@2026-11-04') || A.occByKey('learn-pokemon@2026-11-04');
    if (free) ok(V.signupDone(free, { ok: true, status: 'in', seat: 1 }, {}).textContent.indexOf('Pay $') === -1, 'free event: no payment line');
  });

  /* ---------- R26 title, R23 chip ---------- */
  pageTest('opening an event sets the tab title and closing restores it', 'events.html?now=2026-10-28T16:00#e-pauper%402026-10-28', function (w, d) {
    ok(/^Pauper Night, Wed Oct 28, 7 PM · Mulligan Games$/.test(d.title.replace(/ /g, ' ')), d.title);
    click(d.getElementById('det-x'));
    return T.wait(100).then(function () { eq(d.title, 'Events and sign-ups, Mulligan Games, Warminster PA'); });
  });
  pageTest('front day header: no day-name chip when the heading already says Today or Tomorrow', 'index.html', function (w, d) {
    eq(d.querySelectorAll('#d-2026-10-30 .day-h .tag, #d-2026-10-31 .day-h .tag').length, 0);
    ok(/^Friday, /.test(d.querySelector('#d-2026-10-30 .day-meta').textContent), 'weekday is still said');
  });

  /* ---------- owner rule: hostile text in the new rows ---------- */
  function inert(node, label) {
    box.innerHTML = ''; box.appendChild(node);
    eq(box.querySelectorAll('img[src="x"], script').length, 0, label + ': no injected img or script');
    eq(box.querySelectorAll('[onerror]').length, 0, label + ': no onerror attribute');
    eq(window.__xss, 0, label + ': nothing ran');
  }
  T.test('a hostile title in a compact week row shows as text', function () {
    fresh();
    var s = A.seriesById('fnm-draft'); s.title = XSS_IMG; s.format = XSS_IMG; s.tool = { name: XSS_IMG, url: 'javascript:alert(1)', cta: XSS_IMG };
    var occ = A.occByKey('fnm-draft@2026-10-30'), li = V.compactLine(occ, MG.now(), 'events.html?now=x');
    inert(li, 'compact row'); eq(li.querySelector('.dl-title a').textContent, XSS_IMG);
    ok(li.querySelector('a').getAttribute('href').indexOf('javascript:') === -1, 'no javascript: link');
    MG.state.reset();
  });
  T.test('a hostile title in the Tonight block shows as text', function () {
    fresh();
    var s = A.seriesById('fnm-draft'); s.title = XSS_IMG; s.prize = XSS_IMG;
    var occ = A.occByKey('fnm-draft@2026-10-30'), blk = V.todayBlock([occ], MG.now(), { href: 'events.html' });
    ok(blk, 'a block'); inert(blk, 'Tonight block'); eq(blk.querySelector('.ev-title').textContent, XSS_IMG);
    eq(V.todayBlock([], MG.now()), null, 'nothing for an empty day');
    MG.state.reset();
  });
  T.test('a hostile title in the sign-up confirmation shows as text (D35)', function () {
    fresh();
    var s = A.seriesById('fnm-draft'); s.title = XSS_IMG;
    var occ = A.occByKey('fnm-draft@2026-10-30');
    var a = V.signupDone(occ, { ok: true, status: 'in', seat: 5 }, { email: 'x@example.com' }); inert(a, 'confirmation');
    ok(a.textContent.indexOf(XSS_IMG) !== -1, 'title kept as text');
    inert(V.signupDone(occ, { ok: true, status: 'waitlist', position: 2 }, {}), 'waitlist confirmation');
    MG.state.reset();
  });
  pageTest('phone bar (D33): icons, Events marked on the events page, links keep ?now=', 'events.html?now=2026-10-30T19:30', function (w, d) {
    var links = d.querySelectorAll('.mobile-bar a');
    eq(links.length, 4, 'four links'); eq(d.querySelectorAll('.mobile-bar a svg.ic').length, 4, 'an icon on each');
    eq(links[0].getAttribute('aria-current'), 'page', 'Events is the current page');
    ok(/now=2026-10-30T19%3A30/.test(links[1].getAttribute('href')), 'Hours keeps ?now=: ' + links[1].getAttribute('href'));
  });
  pageTest('hostile text in a cEDH ticket, a preorder tile, the hours reason and a compact row is text (owner rule)', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var X = w.MG.data;
    X.series.forEach(function (x) { x.title = XSS_IMG; });
    X.releases[0].name = XSS_IMG; X.releases[0].note = XSS_IMG; X.store.hourOverrides[0].note = XSS_IMG;
    var s2 = d.createElement('script'); s2.src = BASE + 'js/front.js'; // runs the renderers again against the changed data
    return new Promise(function (res) { s2.onload = res; s2.onerror = res; d.body.appendChild(s2); }).then(function () { return T.wait(100); }).then(function () {
      eq(w.__xss || 0, 0, 'nothing ran'); eq(d.querySelectorAll('img[src="x"], [onerror]').length, 0, 'no injected markup');
      eq(d.querySelector('#cedh-list .tix h4').textContent, XSS_IMG, 'the cEDH title is text'); eq(d.querySelector('#rel-list .rel-name').textContent, XSS_IMG, 'the tile name is text');
      ok(d.querySelector('#hours-why').textContent.indexOf('<img') !== -1, 'the hours reason is text');
      eq(d.querySelector('#d-2026-11-04 .dl-title a').textContent, XSS_IMG, 'the compact row title is text');
    });
  });
  T.test('the compact row lists dates in the order given and words the seat state', function () {
    fresh();
    var occ = A.occByKey('fnm-draft@2026-10-30'), li = V.compactLine(occ, MG.now(), 'events.html');
    ok(/Full|seat|waiting|waitlist/.test(li.querySelector('.dl-bits').textContent), li.querySelector('.dl-bits').textContent);
    MG.state.reset();
  });
})();
