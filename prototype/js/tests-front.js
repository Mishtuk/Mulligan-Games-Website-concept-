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

  function openPage(path, width, height) {
    return new Promise(function (resolve, reject) {
      var f = document.createElement('iframe'), errors = [], settled = false;
      f.style.cssText = 'position:absolute;left:-9999px;width:' + (width || 1280) + 'px;height:' + (height || 900) + 'px';
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
  function pageTest(name, path, fn, width, height) {
    T.async(name, function () {
      return openPage(path, width, height).then(function (p) {
        return Promise.resolve(fn(p.w, p.d, p)).then(function () {
          eq(p.errors.join(' | '), '', 'console errors'); p.frame.remove();
        }, function (err) { p.frame.remove(); throw err; });
      }, function (err) { if (err && err.message === 'NOACCESS') return T.SKIP; throw err; });
    });
  }
  function click(el) { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); }
  function fresh() { MG.state.reset(); MG.now = function () { return new Date(2026, 9, 30, 18, 50); }; box.innerHTML = ''; window.__xss = 0; }

  T.section('Public pages: clock, links, sign-up, compact week, Tonight, round 8 front page');

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
  pageTest('front page at 6:50 PM Friday: tonight\'s 7 PM events take sign-ups (in the Tonight band)', 'index.html', function (w, d) {
    var tn = d.getElementById('tonight');
    ok(tn, 'the Tonight band');
    var acts = Array.prototype.map.call(tn.querySelectorAll('.ev .btn'), function (b) { return b.textContent; });
    ok(acts.indexOf('Join the waitlist') !== -1, 'Draft FNM offers the waitlist: ' + acts.join(','));
    ok(tn.textContent.indexOf('Nexus Nights') !== -1, 'Nexus Nights is tonight');
    ok(d.getElementById('d-2026-10-30') && tn.contains(d.getElementById('d-2026-10-30')), 'the old day anchor lands in the band');
  });
  pageTest('front page: the lead day is cards in #tonight, every other day is rows in #days, ids kept, see-all link', 'index.html?now=2026-10-30T19:30', function (w, d) {
    ok(d.querySelectorAll('#tonight .ev').length >= 1, 'today is full cards in the band');
    eq(d.querySelectorAll('#days .ev').length, 0, 'no cards in the week card');
    eq(d.querySelectorAll('#d-2026-10-30 .day-line').length, 0, 'the lead day is not repeated as rows');
    ok(d.querySelectorAll('#d-2026-10-31 .day-line').length >= 1, 'the next day is rows');
    var lines = d.querySelectorAll('#d-2026-11-04 .day-line');
    ok(lines.length >= 3, 'Wednesday is lines');
    var first = lines[0];
    ok(/PM/.test(first.querySelector('.dl-time').textContent), 'time'); ok(first.querySelector('.dl-title a'), 'title is the link');
    ok(/Free|\$\d/.test(first.querySelector('.dl-bits').textContent), 'fee in words');
    eq(d.querySelectorAll('.day-more').length, 0, 'one link to the events page per job: no "See all N events" line (F21)');
    ok(d.querySelector('.week .sec-head .sec-link'), 'the head link stays'); ok(d.querySelector('.later .more'), '"See every date" stays');
    Array.prototype.forEach.call(d.querySelectorAll('.wdeck a'), function (a) { ok(d.querySelector(a.getAttribute('href')), 'week strip target ' + a.getAttribute('href')); });
    eq(d.querySelector('.wdeck li[data-today] a').getAttribute('href'), '#tonight', 'the lead-day tile goes to the band');
  });
  pageTest('round 8 order: Tonight, This week, What we play, cEDH, Clips, New and preorders, Visit; no Between events', 'index.html', function (w, d) {
    var ids = Array.prototype.map.call(d.querySelectorAll('main > section:not(.phero)'), function (s) { return s.id; });
    eq(ids.join(','), 'tonight,week,play,cedh,clips,new,visit', 'section order after the hero');
    eq(d.querySelectorAll('#community, #lately, #comm-h').length, 0, 'Between events and Lately are gone');
    ok(d.querySelector('#new #proof-rate') && d.querySelectorAll('#new #proof li').length === 3, 'reviews live in New and preorders');
    ok(d.querySelector('#visit a[href*="discord.gg"]') && d.querySelectorAll('#visit .socials a').length >= 3, 'Discord and socials in Visit');
    eq(d.getElementById('week-h').textContent, 'This week'); eq(d.getElementById('play-h').textContent, 'What we play');
  });
  pageTest('Tonight band: heading, kicker with the full date, empty state never vanishes (closed Monday gives "Next up: Wednesday")', 'index.html?now=2026-11-02T12:00', function (w, d) {
    eq(d.getElementById('tonight-h').textContent, 'Next up: Wednesday');
    eq(d.getElementById('tonight-k').textContent, 'Wednesday, November 4');
    ok(d.querySelectorAll('#tonight .ev').length >= 1, 'cards for Wednesday');
    ok(d.getElementById('d-2026-11-04') && d.getElementById('tonight').contains(d.getElementById('d-2026-11-04')), 'anchor in the band');
    eq(d.querySelector('#nextup-k').textContent, 'Next up Wed');
  });
  pageTest('Tonight band: Friday evening says Tonight with the date kicker, 3 cards then "Also tonight" rows', 'index.html?now=2026-10-30T18:50', function (w, d) {
    eq(d.getElementById('tonight-h').textContent, 'Tonight'); eq(d.getElementById('tonight-k').textContent, 'Friday, October 30');
    var n = d.querySelectorAll('#tonight .tn-cards .ev').length; ok(n >= 1 && n <= 3, 'cards ' + n);
    var extra = d.querySelectorAll('#tonight .tn-also .day-line').length;
    eq(n + extra, w.MG.allOccurrences('2026-10-30', '2026-10-30').filter(function (o) { return o.endAt > w.MG.now(); }).length, 'cards plus rows list every date today');
    if (extra) eq(d.querySelector('#tonight .tn-also-h').textContent, 'Also tonight');
    eq(d.querySelector('#nextup-k').textContent, 'Tonight');
  });
  pageTest('round 8: every week-card row has at most one .btn-act, a title link, and a thumb; cancelled rows have a stamp and no button', 'index.html', function (w, d) {
    var rows = d.querySelectorAll('#days .day-line'); ok(rows.length >= 8, 'rows ' + rows.length);
    Array.prototype.forEach.call(rows, function (r) {
      ok(r.querySelectorAll('.btn-act').length <= 1, 'one primary per row'); ok(r.querySelectorAll('.dl-act .btn, .dl-act .dl-more, .dl-act .stamp').length === 1, 'exactly one control: ' + r.textContent.slice(0, 40));
      ok(r.querySelector('.dl-main .dl-title a'), 'title link');
    });
    var su = d.querySelector('#days .btn-act'); ok(su && /^events\.html#su-/.test(su.getAttribute('href')), 'Sign up goes to the sign-up form: ' + (su && su.getAttribute('href')));
    var canc = d.querySelector('#days .day-line[data-state="cancelled"]'); ok(canc && canc.querySelector('.stamp') && !canc.querySelector('.btn'), 'cancelled: stamp only');
  });
  pageTest('round 8: chip counts equal the rows each filter shows in the week card, and Tonight is not filtered', 'index.html', function (w, d) {
    var tonightBefore = d.querySelectorAll('#tonight .ev').length;
    ['all', 'magic', 'pokemon'].forEach(function (g) {
      var chipEl = d.querySelector('.chip[data-chip="' + g + '"]'), n = +chipEl.querySelector('.chip-n').textContent.replace(/[^0-9]/g, '');
      click(chipEl);
      eq(d.querySelectorAll('#days .day-line:not([data-state="cancelled"])').length, n, g + ' count ' + n + ' = rows');
    });
    eq(d.querySelectorAll('#tonight .ev').length, tonightBefore, 'Tonight stays whole under a filter');
  });
  pageTest('What we play: six static cards with photo, constant alt, the right link, counts from the week', 'index.html', function (w, d) {
    var cards = d.querySelectorAll('#play .play-card'); eq(cards.length, 6);
    var links = Array.prototype.map.call(cards, function (c) { return c.getAttribute('href'); });
    eq(links.join('|'), 'events.html?game=magic|#cedh|events.html?game=pokemon|events.html?game=warhammer|events.html?game=other|events.html');
    Array.prototype.forEach.call(cards, function (c) {
      var im = c.querySelector('img'); ok(im && /^img\/social\/[a-z-]+-800\.webp$/.test(im.getAttribute('src')) && im.alt.length > 5 && im.loading === 'lazy', 'photo ' + c.textContent);
      ok(/^(\d+ nights? this week ›|Ask at the counter)$/.test(c.querySelector('.play-n').textContent), c.querySelector('.play-n').textContent);
    });
    var mg = d.querySelector('[data-play="magic"] .play-n').textContent, dates = {};
    w.MG.allOccurrences('2026-10-30', '2026-11-05').forEach(function (o) { if (o.endAt > w.MG.now() && !o.cancelled && o.series.game === 'magic') dates[o.date] = 1; });
    eq(mg, Object.keys(dates).length + ' nights this week ›', 'Magic count');
    eq(w.getComputedStyle(d.querySelector('.play-grid')).gridTemplateColumns.split(' ').length, 6, 'one row of six at 1280 (boss trim, D61)');
  }, 1280);
  pageTest('What we play at 390 is one sideways row (D61), no page overflow, with ?now= kept on its links', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var g = d.querySelector('.play-grid'), c = g.querySelectorAll('.play-card'), a = c[0].getBoundingClientRect(), b = c[1].getBoundingClientRect();
    ok(Math.abs(a.top - b.top) < 2 && b.left > a.right, 'side by side'); ok(g.scrollWidth > g.clientWidth, 'the row scrolls sideways'); ok(d.documentElement.scrollWidth <= 390, 'no page overflow');
    ok(/now=2026-10-30T19%3A30/.test(d.querySelector('.play-card').getAttribute('href')), d.querySelector('.play-card').getAttribute('href'));
  }, 390);

  /* ---------- A2 now= kept on every link ---------- */
  pageTest('front page ?now=: every link to a .html page carries it, cards included', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var links = Array.prototype.filter.call(d.querySelectorAll('a[href]'), function (a) { return /\.html(\?|#|$)/.test(a.getAttribute('href')) && !/^https?:/.test(a.getAttribute('href')); });
    ok(links.length >= 8, 'found ' + links.length + ' page links');
    links.forEach(function (a) {
      var q = a.getAttribute('href').split('#')[0].split('?')[1] || '';
      eq(new URLSearchParams(q).get('now'), '2026-10-30T19:30', a.getAttribute('href'));
    });
    var su = d.querySelector('#tonight .ev .btn-act[href*="#su-"], #days .btn-act[href*="#su-"]'); ok(su, 'a sign-up link on a card or row'); ok(/^events\.html\?now=/.test(su.getAttribute('href')), su.getAttribute('href'));
    ok(d.querySelector('#nav-all, .site-nav li:first-child a').textContent === 'All events', 'All events is first in the nav');
  });
  pageTest('front page without ?now=: links stay plain', 'index.html', function (w, d) {
    eq(d.querySelector('.site-nav li:first-child a').getAttribute('href'), 'events.html');
  });

  /* ---------- round 4, package A: one look for the front page ---------- */
  pageTest('walk-in is said once: no card or row on the front page says "Walk in", the section note does', 'index.html', function (w, d) {
    var bad = Array.prototype.filter.call(d.querySelectorAll('#tonight .ev:not([data-state="closed"]), #days .day-line, #later li'), function (n) { return /Walk in/i.test(n.textContent); });
    eq(bad.length, 0, 'cards or rows with "Walk in": ' + bad.map(function (n) { return n.textContent.slice(0, 40); }).join(' | '));
    ok(/Most nights are walk-in\. A Sign up button holds a seat\./.test(d.querySelector('.week-note').textContent), 'the note');
    ok(/Sign up here|Join the waitlist|Sign up/.test(d.querySelector('#tonight').textContent), 'exceptions keep their words');
  });
  pageTest('cEDH ticket: "10 AM · $60" and "80 registered" (no tool name repeated)', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var t = d.querySelector('#cedh-list .tix'); ok(t, 'a ticket');
    eq(t.querySelector('.tix-what p').textContent, '10 AM · $60');
    eq(t.querySelector('.ev-stat-big').textContent + ' ' + t.querySelector('.ev-stat-unit').textContent, '80 registered');
    eq(d.querySelectorAll('#cedh-list .ev-stat-small').length, 0, 'no small "on TopDeck" line');
    ok(!/Preorders in store only/.test(d.getElementById('rel-list').textContent), 'preorder tiles do not repeat the section note');
    eq(d.querySelectorAll('.rel-art').length, 0, 'no tinted icon band on the tiles');
  });
  // #16: the hero plays the silent montage on every width (poster first, <source media> by screen)
  function heroChecks(w, d, label) {
    var v = d.getElementById('hero-video'), src = [].slice.call(v.querySelectorAll('source'));
    ok(v && v.muted && v.loop && v.playsInline, label + ': muted, loop, playsinline'); eq(v.getAttribute('preload'), 'metadata');
    eq(src.map(function (s) { return s.getAttribute('media') || ''; }).join('|'), '(max-width: 700px) and (orientation: portrait)|(max-width: 1100px)|', label + ': <source media> set');
    eq(src.map(function (s) { return s.getAttribute('data-src'); }).join('|'), 'media/video/hero-portrait.mp4|media/video/hero-720.mp4|media/video/hero.mp4', label + ': file names');
    ok(!v.hasAttribute('autoplay') && !v.getAttribute('src'), 'no autoplay attribute, no src on the element');
    eq(d.querySelectorAll('.cap-wide, .cap-narrow').length, 0, 'old two-caption switch is gone');
    eq(d.querySelectorAll('.media-cap, .clips-link, #hero-feat, #hero-clip').length, 0, 'caption, clips link, featured cards and Watch a clip are gone from the hero');
    return v;
  }
  pageTest('at 1280 px the hero has the montage video with the three <source media> files; poster first, then hero.mp4 starts after load', 'index.html', function (w, d) {
    var v = heroChecks(w, d, '1280'), btn = d.getElementById('vid-btn');
    var img = d.querySelector('#hero-media img'); ok(/hero-poster.jpg$/.test(img.currentSrc), 'wide poster ' + img.currentSrc);
    eq(w.getComputedStyle(v).opacity, '0', 'the video is invisible until a frame has painted: the poster shows first');
    return T.wait(1500).then(function () {
      var withSrc = [].filter.call(v.querySelectorAll('source'), function (s) { return s.getAttribute('src'); }).map(function (s) { return s.getAttribute('src'); });
      eq(withSrc.join('|'), 'media/video/hero-portrait.mp4|media/video/hero-720.mp4|media/video/hero.mp4', 'every source gets its src after load; the media queries pick the file');
      ok(/hero.mp4$/.test(v.currentSrc), 'wide file chosen at 1280: ' + v.currentSrc);
      ok(btn.classList.contains('is-ready') && w.getComputedStyle(btn).visibility === 'visible', 'pause pill shown on a wide screen too');
    });
  });
  pageTest('at 390 px the hero has the portrait poster, then the portrait montage starts after load; the pause pill toggles Pause video / Play video', 'index.html', function (w, d) {
    var v = heroChecks(w, d, '390'), btn = d.getElementById('vid-btn');
    var img = d.querySelector('#hero-media img'); ok(/hero-poster-portrait.jpg$/.test(img.currentSrc), 'portrait poster ' + img.currentSrc);
    eq(w.getComputedStyle(v).opacity, '0', 'poster first');
    return T.wait(1500).then(function () {
      ok(/hero-portrait.mp4$/.test(v.currentSrc), 'portrait file chosen: ' + v.currentSrc);
      ok(btn.classList.contains('is-ready') && w.getComputedStyle(btn).visibility === 'visible', 'pause pill shown');
      var lab = d.getElementById('vid-label');
      if (v.paused || v.currentTime === 0) return; // this browser would not autoplay in the test frame: the pill is still checked above
      return T.wait(200).then(function () {
        eq(lab.textContent, 'Pause video'); btn.click(); return T.wait(200);
      }).then(function () { ok(v.paused, 'paused'); eq(lab.textContent, 'Play video'); btn.click(); return T.wait(600); })
        .then(function () { ok(!v.paused, 'playing again'); eq(lab.textContent, 'Pause video'); });
    });
  }, 390);
  // D53: Save-Data / slow links hold the montage. The page is written into an about:blank frame whose navigator.connection is
  // overridden first (document.open keeps the same Window), so wireVideo sees the hint. Skipped where file reads are blocked.
  function heldPage(conn) {
    return new Promise(function (resolve, reject) {
      var x = new XMLHttpRequest();
      try { x.open('GET', BASE + 'index.html', false); x.send(); } catch (err) { reject(new Error('NOACCESS')); return; }
      if (!x.responseText) { reject(new Error('NOACCESS')); return; }
      var f = document.createElement('iframe'), errors = [];
      f.style.cssText = 'position:absolute;left:-9999px;width:390px;height:844px';
      document.body.appendChild(f);
      var w = f.contentWindow;
      try { Object.defineProperty(w.navigator, 'connection', { get: function () { return conn; }, configurable: true }); } catch (err) { f.remove(); reject(new Error('NOACCESS')); return; }
      var ce = w.console.error; w.console.error = function () { errors.push(Array.prototype.join.call(arguments, ' ')); ce.apply(w.console, arguments); };
      w.document.open(); // erases the window listeners, so the load listener goes on after it
      w.addEventListener('load', function () { setTimeout(function () { resolve({ w: w, d: w.document, errors: errors, frame: f }); }, 300); });
      w.document.write(x.responseText.replace('<head>', '<head><base href="' + BASE + '">')); w.document.close();
    });
  }
  [['Save-Data on 4g', { saveData: true, effectiveType: '4g' }], ['3g', { saveData: false, effectiveType: '3g' }]].forEach(function (cse) {
    T.async('D53: ' + cse[0] + ' at 390 keeps the portrait poster, gives no <source> a src, and shows "Play video"', function () {
      return heldPage(cse[1]).then(function (p) {
        var v = p.d.getElementById('hero-video'), btn = p.d.getElementById('vid-btn');
        if (!v || !p.w.MG) { p.frame.remove(); return T.SKIP; } // the written page did not boot here
        return T.wait(900).then(function () {
          eq([].filter.call(v.querySelectorAll('source'), function (s) { return s.getAttribute('src'); }).length, 0, 'no source has a src');
          eq(v.currentSrc, '', 'nothing requested'); ok(v.paused, 'held');
          ok(/hero-poster-portrait.jpg$/.test(p.d.querySelector('#hero-media img').currentSrc), 'portrait poster');
          ok(btn.classList.contains('is-ready'), 'pill shown'); eq(p.d.getElementById('vid-label').textContent, 'Play video');
          eq(p.errors.join(' | '), '', 'console errors'); p.frame.remove();
        }, function (err) { p.frame.remove(); throw err; });
      }, function (err) { if (err && err.message === 'NOACCESS') return T.SKIP; throw err; });
    });
  });
  pageTest('round 8: the strip is the pause pill on the left, then next-up; the last 76 px stay free for the theme button (390 and 1280)', 'index.html', function (w, d) {
    var s = d.querySelector('.phero-strip').getBoundingClientRect(); ok(s.width <= w.innerWidth, 'strip width ' + s.width);
    var fab = d.querySelector('.theme-fab').getBoundingClientRect(), pill = d.getElementById('vid-btn').getBoundingClientRect(), nx = d.getElementById('nextup').getBoundingClientRect();
    ok(pill.right <= nx.left + 1, 'pause left of next-up');
    ok(nx.right <= w.innerWidth - 76 + 1, 'next-up ends ' + nx.right + ' before the 76 px corner at ' + w.innerWidth);
    ok(pill.right <= w.innerWidth - 76, 'pill clear of the corner');
    ok(d.querySelector('.phero-strip').contains(d.getElementById('nextup')), 'next-up is in the strip');
    ok(fab.left >= nx.right || fab.top >= s.bottom || fab.bottom <= s.top, 'the theme button does not cover next-up');
  }, 390);
  pageTest('round 8: at 1280 the strip keeps the corner free and the headline is two lines', 'index.html', function (w, d) {
    var nx = d.getElementById('nextup').getBoundingClientRect(); ok(nx.right <= w.innerWidth - 76 + 1, 'next-up right ' + nx.right);
    var h = d.getElementById('hero-h'), lh = parseFloat(w.getComputedStyle(h).lineHeight); ok(Math.round(h.getBoundingClientRect().height / lh) === 2, 'two lines: ' + h.getBoundingClientRect().height + ' / ' + lh);
    ok(d.getElementById('hero-h').querySelectorAll('span').length === 2, 'two spans');
    var st = d.querySelector('.phero-strip').getBoundingClientRect(); var demo = d.querySelector('.demo-host').getBoundingClientRect().height; ok(st.bottom <= 900 + demo + 2, 'the strip sits at the fold (the concept demo bar adds ' + demo + '): ' + st.bottom);
  }, 1280, 900);
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
  // round 5 part 2 (D39): five-star Google quotes, TopDeck fees, turnout, TCGplayer line
  pageTest('Reviews in New and preorders: the Google rating line and exactly three quotes with name and age', 'index.html?now=2026-10-30T19:30', function (w, d) {
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
  pageTest('bands: brown in light, lighter than the page and edged in dark; no "Theme" word, no labelled pill (F4, F16, D46)', 'index.html?theme=light', function (w, d) {
    var cs = function (s) { return w.getComputedStyle(d.querySelector(s)); };
    try {
      eq(cs('.site-foot').backgroundColor, 'rgb(62, 42, 34)', 'light footer band'); eq(cs('.cedh').backgroundColor, 'rgb(62, 42, 34)', 'light cEDH band');
      d.querySelector('meta[name="color-scheme"]').content = 'dark';
      ok(cs('.site-foot').backgroundColor !== cs('body').backgroundColor, 'dark footer differs from the page');
      eq(cs('.site-foot').backgroundColor, 'rgb(42, 29, 23)', 'dark footer band'); eq(cs('.cedh').backgroundColor, 'rgb(42, 29, 23)', 'dark cEDH band');
      ok(cs('.site-foot').borderTopWidth !== '0px' && cs('.cedh').borderTopWidth !== '0px', 'a hairline edge in dark');
    } finally { try { w.localStorage.removeItem('mg-scheme'); } catch (err) { /* nothing stored */ } }
    ok(!/Theme/.test(d.body.textContent), 'no "Theme" text'); eq(d.querySelectorAll('.scheme, [data-scheme]').length, 0, 'the Light | Dark pill is gone');
  });
  /* D46: the round theme button, bottom-right, on every public page and the admin */
  ['index.html', 'events.html', 'admin/index.html', 'admin/events.html', 'admin/inventory.html'].forEach(function (path) {
    pageTest('theme button on ' + path + ': round 44px, bottom-right; click flips color-scheme, aria-label and mg-scheme; again follows the system', path + '?now=2026-10-30T18:50', function (w, d) {
      var f = d.querySelector('.theme-fab'), meta = d.querySelector('meta[name="color-scheme"]'), sys = w.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', other = sys === 'dark' ? 'light' : 'dark';
      try { w.localStorage.removeItem('mg-scheme'); } catch (err) { /* ok */ }
      meta.content = 'light dark';
      ok(f, 'the button exists'); eq(d.querySelectorAll('.theme-fab').length, 1, 'only one'); eq(f.tagName, 'BUTTON');
      var r = f.getBoundingClientRect(); eq(Math.round(r.width) + 'x' + Math.round(r.height), '44x44'); ok(w.getComputedStyle(f).borderRadius === '50%' || parseFloat(w.getComputedStyle(f).borderRadius) >= 22, 'round');
      ok(d.documentElement.clientWidth - r.right <= 16 && w.innerHeight - r.bottom <= 16, 'bottom-right corner: ' + (d.documentElement.clientWidth - r.right) + ',' + (w.innerHeight - r.bottom));
      eq(f.getAttribute('aria-label'), 'Switch to ' + other + ' mode', 'label names the other mode');
      try {
        f.click();
        eq(meta.content, other, 'color-scheme set'); eq(w.localStorage.getItem('mg-scheme'), other, 'stored as mg-scheme'); eq(f.getAttribute('aria-label'), 'Switch to ' + sys + ' mode');
        f.click();
        eq(meta.content, 'light dark', 'back to the system scheme follows the system'); eq(w.localStorage.getItem('mg-scheme'), null, 'choice forgotten');
      } finally { try { w.localStorage.removeItem('mg-scheme'); } catch (err) { /* ok */ } }
      ok(!d.querySelector('.scheme'), 'no labelled pill');
    });
  });
  pageTest('404.html loads the theme button script (its absolute asset paths only resolve on the site, so no click test here)', '404.html', function (w, d) {
    ok(d.querySelector('script[src$="js/theme-fab.js"]'), 'script tag'); ok(d.querySelector('meta[name="color-scheme"]'), 'color-scheme meta');
  });
  pageTest('theme button on phones (390): above the quick-actions bar and clear of it, toast clear of the button (D33, D46)', 'index.html?now=2026-10-30T18:50', function (w, d) {
    var f = d.querySelector('.theme-fab').getBoundingClientRect(), bar = d.querySelector('.mobile-bar').getBoundingClientRect();
    ok(f.bottom <= bar.top, 'button bottom ' + f.bottom + ' is above bar top ' + bar.top); ok(d.documentElement.clientWidth - f.right <= 16, 'still at the right edge');
    var t = d.querySelector('.toast');
    if (t) { t.classList.add('on'); var tr = t.getBoundingClientRect(); ok(tr.bottom <= f.top || tr.top >= f.bottom, 'toast clear of the button'); }
  }, 390);
  pageTest('theme button on the admin at 390: above the tab bar', 'admin/index.html?now=2026-10-30T18:50', function (w, d) {
    var f = d.querySelector('.theme-fab').getBoundingClientRect(), tabs = d.querySelector('.adm-tabs').getBoundingClientRect();
    ok(f.bottom <= tabs.top, 'button bottom ' + f.bottom + ' is above the tab bar top ' + tabs.top);
  }, 390);
  /* ---------- round 8 boss trims (D61): same content, shorter page ---------- */
  pageTest('D61 week card: the next two days with events are open, later days fold into one line that names them; a strip tile opens the fold; a chip shows every day open', 'index.html?now=2026-10-30T18:50', function (w, d) {
    eq(d.querySelectorAll('#d-2026-10-31 details, #d-2026-11-01 details').length, 0, 'Sat and Sun are open');
    ok(d.querySelectorAll('#d-2026-10-31 .day-line').length >= 1 && d.querySelectorAll('#d-2026-11-01 .day-line').length >= 1, 'their rows show');
    var f = d.querySelector('#d-2026-11-04 details.wk-fold'); ok(f && !f.open, 'Wednesday is folded');
    var n = f.querySelectorAll('.day-line').length, sum = f.querySelector('summary').textContent;
    ok(sum.indexOf(n + ' events') === 0, 'summary count: ' + sum); ok(sum.indexOf(f.querySelector('.dl-title').textContent) !== -1, 'summary names the first event');
    click(d.querySelector('.wdeck a[href="#d-2026-11-04"]')); ok(f.open, 'the strip tile opens the fold');
    click(d.querySelector('.chip[data-chip="magic"]')); eq(d.querySelectorAll('#days details.wk-fold').length, 0, 'a chip filter shows every day open');
  }, 1280);
  pageTest('D61 Visit and cEDH: four questions that open, the turnout list folded on phones', 'index.html?now=2026-10-30T18:50', function (w, d) {
    var q = d.querySelectorAll('.faq-fold details'); eq(q.length, 4); eq(d.querySelectorAll('.faq-fold details[open]').length, 0, 'closed');
    ok(q[0].querySelector('summary').getBoundingClientRect().height >= 44, 'question is a 44 px target');
    eq(d.getElementById('turnout').open, false, 'turnout folded at 390'); eq(d.querySelectorAll('#cedh-turnout li').length, 4, 'its rows are still there');
    eq(w.getComputedStyle(d.querySelector('.cedh-photo')).display, 'none', 'no cEDH photo at 390'); ok(d.documentElement.scrollWidth <= 390, 'no overflow');
  }, 390);
  pageTest('D61 turnout open at 1280', 'index.html?now=2026-10-30T18:50', function (w, d) { eq(d.getElementById('turnout').open, true); }, 1280);
  pageTest('D61 page length budget: front page at 390 under 8,900 px', 'index.html?now=2026-10-30T18:50', function (w, d) { var h = d.documentElement.scrollHeight; ok(h <= 8900, 'height ' + h); }, 390, 844);
  pageTest('D61 page length budget: front page at 1280 under 7,100 px', 'index.html?now=2026-10-30T18:50', function (w, d) { var h = d.documentElement.scrollHeight; ok(h <= 7100, 'height ' + h); }, 1280);
  pageTest('D63 page length budget: events page at 1280 under 3,750 px', 'events.html?now=2026-10-30T18:50', function (w, d) { var h = d.documentElement.scrollHeight; ok(h <= 3750, 'height ' + h); }, 1280);
  pageTest('the footer on the home page leaves out Visit and Hours (the Visit section is right above it, D61); Explore keeps ?now=', 'index.html?now=2026-10-30T19:30', function (w, d) {
    eq(w.getComputedStyle(d.querySelector('.foot-visit')).display, 'none'); eq(w.getComputedStyle(d.querySelector('.foot-hours')).display, 'none');
    var ex = d.querySelector('.foot-explore a'); eq(ex.textContent, 'All events'); ok(/now=2026-10-30T19%3A30/.test(ex.getAttribute('href')), ex.getAttribute('href'));
  }, 1280);
  pageTest('the footer is an index: four columns at 1280 (events page), Explore links keep ?now=', 'events.html?now=2026-10-30T19:30', function (w, d) {
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
  pageTest('round 7: at 360 px seven compact tiles fit, 44 px or more each way, no page overflow, count line inside the tile', 'index.html', function (w, d) {
    var tiles = d.querySelectorAll('.wdeck .daycard'); eq(tiles.length, 7);
    Array.prototype.forEach.call(tiles, function (a) { var r = a.getBoundingClientRect(); ok(r.width >= 44 && r.height >= 44 && r.height <= 64, 'tile ' + r.width + 'x' + r.height); ok(a.querySelector('.dc-cap'), 'count inside tile'); eq(a.querySelectorAll('img').length, 0); });
    var ol = d.querySelector('.wdeck ol'); ok(ol.scrollWidth <= ol.clientWidth + 1, 'no strip scroll');
    ok(d.documentElement.scrollWidth <= w.innerWidth + 1, 'no page overflow: ' + d.documentElement.scrollWidth + ' vs ' + w.innerWidth);
  }, 360);
  pageTest('at 1280 the game chips are one row, and a card has no price circle or stat box unless it needs attention (F1, F6)', 'index.html', function (w, d) {
    var tops = {}; Array.prototype.forEach.call(d.querySelectorAll('.chip'), function (c) { tops[Math.round(c.getBoundingClientRect().top)] = 1; });
    eq(Object.keys(tops).length, 1, 'chip rows: ' + Object.keys(tops).join(','));
    var cost = d.querySelector('#tonight .ev-cost'); if (cost) eq(w.getComputedStyle(cost).borderTopWidth, '0px', 'no circle around the price');
    var open = d.querySelector('#tonight .ev[data-state="open"] .ev-stat'); if (open) { eq(w.getComputedStyle(open).backgroundColor, 'rgba(0, 0, 0, 0)', 'plain stat text'); eq(w.getComputedStyle(open).borderTopColor, 'rgba(0, 0, 0, 0)'); }
    var full = d.querySelector('#tonight .ev[data-state="waitlist"] .ev-stat, #tonight .ev[data-state="full"] .ev-stat'); ok(full, 'a full or waitlist card exists'); if (full) ok(w.getComputedStyle(full).backgroundColor !== 'rgba(0, 0, 0, 0)', 'the box stays when it needs attention');
  }, 1280);

  /* ---------- A3 phone order ---------- */
  // round 3 (D36): a full-bleed photo hero; tonight's headline and "next up" stay in the first screen, the week strip follows the hero
  pageTest('at 390 px the headline, both buttons and next-up are inside the first screen, and Tonight follows the hero directly', 'index.html', function (w, d) {
    var box = function (s) { var r = d.querySelector(s).getBoundingClientRect(); return { top: r.top + w.scrollY, bottom: r.bottom + w.scrollY, width: r.width }; };
    ok(box('#hero-h').top < 600, 'h1 at ' + box('#hero-h').top); ok(box('#nextup').bottom < 844, 'next up ends at ' + box('#nextup').bottom);
    ok(box('#hero-cta').bottom < 844 && box('#hero-visit').bottom < 844, 'both buttons in the first screen');
    ok(Math.abs(box('#tonight').top - box('.phero').bottom) < 2, 'Tonight right after the hero');
    ok(box('#hero-media').width >= d.documentElement.clientWidth - 1, 'the video spans the full width');
    eq(d.querySelector('.phero-strip').contains(d.getElementById('nextup')), true);
  }, 390, 844);
  pageTest('at 1280 px the hero photo spans the full width and the headline is white on the scrim', 'index.html', function (w, d) {
    ok(d.querySelector('#hero-media').getBoundingClientRect().width >= d.documentElement.clientWidth - 1, 'full width');
    eq(w.getComputedStyle(d.querySelector('#hero-h')).color, 'rgb(255, 255, 255)');
  }, 1280);

  /* ---------- D51 round 7: hero headline, status chip, featured TikTok clips ---------- */
  var chipCase = function (now, expect, open) {
    pageTest('hero chip at ' + now + ' reads "' + expect + '"', 'index.html?now=' + now, function (w, d) {
      var c = d.getElementById('hero-chip'); eq(c.textContent.replace(/\s+/g, ' ').trim(), expect);
      eq(c.hasAttribute('data-open'), !!open, 'green dot only when open');
      eq(d.getElementById('hero-h').textContent, 'Shuffle up. Everyone’s welcome.');
    }, 1280);
  };
  chipCase('2026-10-30T18:50', 'Open now · till midnight', true);
  chipCase('2026-10-30T11:00', 'Opens 2 PM today', false);
  chipCase('2026-11-02T12:00', 'Closed today · back Wed 2 PM', false);
  pageTest('the headline is the static welcome line and the sub-line is a short welcome', 'index.html', function (w, d) {
    eq(d.getElementById('hero-h').textContent, 'Shuffle up. Everyone’s welcome.');
    ok(/^Free play every day we’re open/.test(d.getElementById('hero-sub').textContent), d.getElementById('hero-sub').textContent);
    ok(!d.getElementById('hero-date'), 'the date line is gone (the chip covers today)');
    var chip = d.getElementById('hero-chip').getBoundingClientRect(), h = d.getElementById('hero-h').getBoundingClientRect(); ok(chip.bottom <= h.top + 1, 'chip above the headline');
  }, 1280);
  [390, 900, 1280].forEach(function (wd) {
    pageTest('round 8: at ' + wd + ' px the hero has no featured TikTok cards and no clip links or iframe; two buttons, one primary', 'index.html', function (w, d) {
      eq(d.querySelectorAll('.phero iframe, .phero [data-clip-id], .phero a[href*="tiktok"]').length, 0, 'nothing from TikTok in the hero');
      eq(d.querySelectorAll('iframe').length, 0, 'no iframe before a click');
      var cta = d.getElementById('hero-cta'), vis = d.getElementById('hero-visit');
      eq(cta.textContent, 'See this week'); eq(cta.getAttribute('href'), '#week'); eq(vis.textContent, 'Plan a visit'); eq(vis.getAttribute('href'), '#visit');
      ok(cta.getBoundingClientRect().height >= 44 && vis.getBoundingClientRect().height >= 44, 'tap targets');
      if (wd === 390) ok(Math.abs(cta.getBoundingClientRect().top - vis.getBoundingClientRect().top) < 2, 'the two buttons share one row at 390');
    }, wd);
  });
  pageTest('round 8: the Clips section still opens its dialog with exactly one TikTok iframe', 'index.html', function (w, d) {
    var a = d.querySelector('#clips-list .clip-a'); eq(d.querySelectorAll('iframe').length, 0);
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    var dlg = d.querySelector('dialog.dlg-clip'); ok(dlg && dlg.open, 'dialog open'); eq(dlg.querySelectorAll('iframe').length, 1); dlg.close();
  }, 390);

  /* ---------- D52 boss round 7: each fact once, and the phone hero clears the quick-actions bar ---------- */
  pageTest('D52: the home page says open / closed once (hero chip only) and free play once (sub-line only)', 'index.html?now=2026-10-30T18:50', function (w, d) {
    ok(!d.getElementById('ob-status'), 'no status in the bar above the header');
    var ob = d.querySelector('.openbar').textContent; ok(!/open now|closed|till/i.test(ob), 'bar: ' + ob.replace(/s+/g, ' '));
    ok(/445 York Rd/.test(ob) && d.getElementById('ob-call') && d.getElementById('ob-map'), 'address, Call and Directions stay');
    var all = d.body.textContent; eq((all.match(/Open now/g) || []).length, 1, '"Open now" once');
    ok(!/free play/i.test(d.querySelector('.phero-strip').textContent), 'the strip has no free-play line');
    eq((d.querySelector('.phero').textContent.match(/free play/gi) || []).length, 1, 'free play once in the hero');
    ok(d.querySelector('.phero-strip #nextup') && d.getElementById('vid-btn'), 'next-up and Pause are the strip');
  }, 1280);
  pageTest('D52: events.html keeps its open / closed status in the bar', 'events.html?now=2026-10-30T18:50', function (w, d) {
    ok(/Open now/.test(d.getElementById('ob-status').textContent), d.getElementById('ob-status').textContent);
  }, 1280);
  pageTest('D52: at 390 x 844 the whole hero (strip and Pause) ends above the quick-actions bar, and the address shows in one line', 'index.html?now=2026-10-30T18:50', function (w, d) {
    var bar = d.querySelector('.mobile-bar').getBoundingClientRect().top, hero = d.querySelector('.phero').getBoundingClientRect(), p = d.getElementById('vid-btn').getBoundingClientRect();
    ok(hero.bottom <= bar, 'hero bottom ' + hero.bottom + ' vs bar top ' + bar); ok(p.bottom <= bar, 'pause bottom ' + p.bottom);
    var s = d.querySelector('.phero-strip').getBoundingClientRect(); ok(s.height <= 54, 'strip height ' + s.height); ok(s.width <= w.innerWidth, 'strip width ' + s.width);
    var a = d.querySelector('.ob-front .ob-addr').getBoundingClientRect(); ok(a.height > 0 && a.height < 30, 'address one line: ' + a.height);
  }, 390, 844);

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
    var a = d.querySelector('.ev .btn-act[href*="#su-"], #special button[data-signup]'); ok(a, 'card or special-row sign-up'); click(a);
    ok(d.querySelector('dialog[open] form.su'), 'form open');
  });

  /* ---------- A10 Tonight ---------- */
  pageTest('events.html Tonight band: cards plus "Also tonight" rows list today\'s dates in time order, and only those', 'events.html?now=2026-10-30T18:50', function (w, d) {
    var wrap = d.getElementById('today-wrap'); eq(wrap.hidden, false); eq(d.getElementById('today-h').textContent, 'Tonight');
    var want = w.MG.allOccurrences('2026-10-30', '2026-10-30').filter(function (o) { return o.endAt > w.MG.now() && o.series.enabled !== false; })
      .sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : a.series.title.localeCompare(b.series.title); });
    var got = Array.prototype.map.call(wrap.querySelectorAll('.tn-cards .ev-title, .tn-also .dl-title'), function (t) { return t.textContent; });
    eq(got.join('|'), want.map(function (o) { return o.series.title; }).join('|'), 'one card or row per date, in time order');
    eq(wrap.querySelectorAll('.tn-cards .ev').length, Math.min(3, want.length), 'first three are cards');
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
  pageTest('front day header: "Tomorrow" with its weekday and hours, no day-name chip', 'index.html', function (w, d) {
    eq(d.querySelectorAll('#d-2026-10-31 .day-h .tag').length, 0);
    eq(d.querySelector('#d-2026-10-31 .day-name').textContent, 'Tomorrow');
    ok(/^Sat, Oct 31 · 2.PM to midnight/.test(d.querySelector('#d-2026-10-31 .day-meta').textContent), d.querySelector('#d-2026-10-31 .day-meta').textContent);
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
  /* ---------- round 6 (D47): one decorative photo per event ---------- */
  T.test('MG.photoFor: format overrides, no repeat within a day, tint for games without a photo, constant paths', function () {
    var used = {}, m1 = MG.photoFor({ game: 'magic', format: 'Draft' }, used), m2 = MG.photoFor({ game: 'magic', format: 'Pauper' }, used);
    ok(m1.src !== m2.src, 'two Magic events on a day get two pictures'); ok(/img\/social\/[a-z0-9-]+-800\.webp$/.test(m1.src), m1.src);
    eq(MG.photoFor({ game: 'cedh', featured: true }, {}).src.indexOf('champion-belt') > -1, true, 'a featured cEDH event leads with the belt');
    eq(MG.photoFor({ game: 'warhammer', format: 'Painting' }, {}).src.indexOf('painted-marines') > -1, true);
    eq(MG.photoFor({ game: 'other', format: 'D&D' }, {}).src.indexOf('dnd-table') > -1, true);
    eq(MG.photoFor({ game: 'onepiece' }, {}).tint, true, 'One Piece is tinted'); eq(MG.photoFor({ game: 'hololive' }, {}).tint, true);
    eq(MG.photoFor({ game: 'magic' }, {}).tint, false); eq(MG.photoFor({ game: 'nope' }, {}).tint, true, 'unknown game: tinted play room');
    var u2 = {}; MG.photoFor({ game: 'pokemon' }, u2); eq(MG.photoFor({ game: 'pokemon' }, u2).src.indexOf('pokemon-sealed-shelf') > -1, true, 'a used-up list reuses its first photo');
  });
  T.test('MG.eventCard: a photo option adds one decorative band; without it nothing changes; hostile values are escaped', function () {
    fresh();
    var occ = A.occByKey('fnm-draft@2026-10-30'), plain = MG.eventCard(occ, MG.now(), {});
    ok(plain.indexOf('ev-ph') === -1, 'no photo unless asked');
    var tpl = document.createElement('template'); tpl.innerHTML = MG.eventCard(occ, MG.now(), { photo: { src: 'img/social/event-magic-night-800.webp', pos: '50% 60%', tint: false } });
    var fig = tpl.content.querySelectorAll('.ev > .ev-ph'); eq(fig.length, 1); eq(fig[0].getAttribute('aria-hidden'), 'true'); eq(fig[0].querySelector('img').getAttribute('alt'), '');
    eq(tpl.content.querySelector('.ev').firstElementChild, fig[0], 'the band is the first child');
    var h = document.createElement('template'); h.innerHTML = MG.eventCard(occ, MG.now(), { photo: { src: 'x" onerror="window.__xss=1', pos: '"><img src=x onerror="window.__xss=1">', tint: true } }); inert(h.content, 'photo card');
    MG.state.reset();
  });
  pageTest('at 1280 each Tonight card has one decorative photo, rows have thumbs, strip tiles have none', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var cards = d.querySelectorAll('#tonight .ev'); ok(cards.length > 0, 'cards');
    Array.prototype.forEach.call(cards, function (c) {
      eq(c.querySelectorAll(':scope > .ev-ph').length, 1, 'one photo band on ' + c.id);
      var im = c.querySelector('.ev-ph img'); eq(im.getAttribute('alt'), ''); eq(c.querySelector('.ev-ph').getAttribute('aria-hidden'), 'true'); ok(/-800\.webp$/.test(im.getAttribute('src')), im.getAttribute('src'));
    });
    var rows = d.querySelectorAll('#days .day-line'); ok(rows.length > 0, 'rows');
    Array.prototype.forEach.call(rows, function (r) { var ph = r.querySelector(':scope > .dl-ph'); ok(ph, 'row thumb'); eq(ph.getAttribute('aria-hidden'), 'true'); eq(ph.querySelector('img').getAttribute('alt'), ''); ok(ph.getBoundingClientRect().width >= 47, 'thumb 48 px at 1280 (D61): ' + ph.getBoundingClientRect().width); eq(w.getComputedStyle(r.querySelector('.dl-dot')).display, 'none', 'dot replaced'); });
    eq(d.querySelectorAll('.wdeck img, .wdeck .dc-ph').length, 0, 'round 7: no pictures in the week strip at 1280');
    var tl = d.querySelector('.wdeck .daycard').getBoundingClientRect(); ok(tl.height <= 64 && tl.height >= 44, 'tile height ' + tl.height); ok(d.querySelector('.wdeck ol').getBoundingClientRect().width <= 560, 'strip is capped at 1280');
    var rect = d.querySelector('#tonight .ev-ph').getBoundingClientRect(); ok(Math.abs(rect.width / rect.height - 2.4) < 0.1, 'band is 12:5 from 768 px: ' + rect.width / rect.height);
  }, 1280);
  pageTest('boss 6: today and tomorrow cards never repeat a non-tinted photo', 'index.html?now=2026-10-30T18:50', function (w, d) {
    var bands = Array.prototype.map.call(d.querySelectorAll('#tonight .ev-ph:not([data-tint]) img'), function (i) { return i.getAttribute('src'); });
    var seen = {}; bands.forEach(function (s) { ok(!seen[s] || /pokemon-sealed-shelf|champion|painted/.test(s), 'card photo repeats across today and tomorrow: ' + s); seen[s] = 1; });
  }, 1280);
  pageTest('at 390 the Tonight cards have a 3:1 band and the strip tiles show no photo, fit at 390', 'index.html?now=2026-10-30T19:30', function (w, d) {
    var rect = d.querySelector('#tonight .ev-ph').getBoundingClientRect(); ok(Math.abs(rect.width / rect.height - 3) < 0.1, 'band is 3:1: ' + rect.width / rect.height);
    eq(d.querySelectorAll('.wdeck img').length, 0, 'no pictures in the strip at 390');
    var r = d.querySelector('#days .dl-ph').getBoundingClientRect(); ok(Math.abs(r.width - 48) < 1, 'thumb 48 px: ' + r.width);
  }, 390);

  /* ---------- D46: the round theme button never covers the hero's Pause / Play control ---------- */
  pageTest('at 390 px the theme button and the hero Pause control do not overlap', 'index.html', function (w, d) {
    var fab = d.querySelector('.theme-fab'), btn = d.querySelector('#vid-btn');
    ok(fab && btn, 'both exist'); var a = fab.getBoundingClientRect(), b = btn.getBoundingClientRect();
    ok(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom, 'button ' + Math.round(a.left) + ',' + Math.round(a.top) + ' vs pause ' + Math.round(b.left) + '-' + Math.round(b.right) + ',' + Math.round(b.top));
  }, 390);
})();
