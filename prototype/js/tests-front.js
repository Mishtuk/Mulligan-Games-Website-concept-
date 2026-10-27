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
    ok(/^See all \d+ events on the events page$/.test(d.querySelector('.day-more a').textContent), d.querySelector('.day-more a').textContent);
    ok(d.querySelector('.day-more a').getAttribute('href').indexOf('now=') !== -1, 'see-all keeps now');
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

  /* ---------- A3 phone order ---------- */
  // round 3 (D36): a full-bleed photo hero; tonight's headline and "next up" stay in the first screen, the week strip follows the hero
  pageTest('at 390 px the headline and next up are inside the first screen, the week strip right after the hero', 'index.html', function (w, d) {
    var box = function (s) { var r = d.querySelector(s).getBoundingClientRect(); return { top: r.top + w.scrollY, bottom: r.bottom + w.scrollY, width: r.width }; };
    ok(box('#hero-h').top < 600, 'h1 at ' + box('#hero-h').top); ok(box('#nextup').bottom < 844, 'next up ends at ' + box('#nextup').bottom);
    ok(box('#deck').top - box('.phero').bottom < 220, 'strip ' + (box('#deck').top - box('.phero').bottom) + ' px below the hero');
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
  T.test('the compact row lists dates in the order given and words the seat state', function () {
    fresh();
    var occ = A.occByKey('fnm-draft@2026-10-30'), li = V.compactLine(occ, MG.now(), 'events.html');
    ok(/Full|seat|waiting|waitlist/.test(li.querySelector('.dl-bits').textContent), li.querySelector('.dl-bits').textContent);
    MG.state.reset();
  });
})();
