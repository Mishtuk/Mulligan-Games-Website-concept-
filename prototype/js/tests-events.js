/* Tests for the events page (round 4, package B): the rebuilt detail dialog, U.dialog bare, the weekly list
 * (no "Every" / "Walk in" on cards, phone rows, merged closed days), Special events without today's dates,
 * and that hostile text in the new renderers stays text. Registered like tests-front.js; page checks run in iframes. */
(function () {
  'use strict';
  var T = window.T, MG = window.MG, D = MG.data, V = MG.views, A = MG.act, U = MG.ui;
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
  var N = 'now=2026-10-30T18:50';

  T.section('Events page: detail dialog, weekly list, Special events');

  /* ---------- the detail dialog ---------- */
  pageTest('detail dialog: no "Event details" title, one heading, focus on it, picture with alt, one action box, series calendar button', 'events.html?' + N + '#e-fnm-draft%402026-10-30', function (w, d) {
    var dlg = d.getElementById('det-dlg'); ok(dlg.open, 'open');
    ok(dlg.textContent.indexOf('Event details') === -1, 'no "Event details" text');
    eq(dlg.getAttribute('aria-labelledby'), 'det-title');
    eq(dlg.querySelectorAll('h2').length, 1, 'one h2');
    eq(d.activeElement && d.activeElement.id, 'det-title', 'focus on the heading');
    var img = dlg.querySelector('.det-pic img'); ok(img && img.getAttribute('alt').length > 10, 'picture with alt');
    var act = dlg.querySelector('.det-act'); ok(act && act.querySelector('[data-signup]'), 'action box holds the sign-up button');
    eq(dlg.querySelectorAll('.det-act').length, 1, 'one action box');
    ok(dlg.querySelector('#det-x').getAttribute('aria-label') === 'Close', 'close X');
    var items = dlg.querySelectorAll('.det-dates li'); ok(items.length >= 1 && items.length <= 6, 'other dates: ' + items.length);
    Array.prototype.forEach.call(items, function (li) { ok(/open|few seats|full|cancelled|changed|closed/.test(li.querySelector('.dd-state').textContent), li.textContent); });
    ok(dlg.querySelector('[data-ics-series="fnm-draft"]').textContent.indexOf('Add every Friday') === 0, 'series ics button');
    ok(dlg.querySelector('[data-ics-one]'), 'one-date ics button');
    ok(dlg.textContent.indexOf('Also on') === -1, 'no "Also on" in the dialog');
  });
  pageTest('detail dialog: the X closes it and the sign-up form swaps in with its own heading and Back', 'events.html?' + N + '#e-fnm-draft%402026-10-30', function (w, d) {
    click(d.querySelector('#det-body [data-signup]'));
    ok(d.querySelector('#det-body form.su'), 'form'); eq(d.querySelectorAll('#det-body h2').length, 1, 'one heading in form mode');
    ok(d.querySelector('#det-x'), 'X still there');
    click(d.querySelector('[data-back]')); ok(d.querySelector('#det-body .det-act'), 'back to details');
    click(d.getElementById('det-x')); eq(d.getElementById('det-dlg').open, false, 'closed');
  });
  pageTest('detail dialog: a cancelled date has no action box and says "Next one:"', 'events.html?' + N + '#e-pokemon-sat%402026-10-31', function (w, d) {
    var dlg = d.getElementById('det-dlg'); ok(dlg.open, 'open');
    eq(dlg.querySelectorAll('.det-act').length, 0, 'no action box');
    ok(dlg.textContent.indexOf('Next one:') !== -1, 'Next one');
    ok(dlg.querySelector('.det-banner-bad'), 'cancelled banner');
  });
  pageTest('detail dialog at 390 px: the action box sits inside the first 844 px of the dialog', 'events.html?' + N + '#e-fnm-draft%402026-10-30', function (w, d) {
    var dlg = d.getElementById('det-dlg'), r = dlg.querySelector('.det-act').getBoundingClientRect(), top = dlg.getBoundingClientRect().top;
    ok(r.bottom - top < 844, 'action box ends ' + Math.round(r.bottom - top) + ' px into the dialog');
    ok(d.documentElement.scrollWidth <= d.documentElement.clientWidth + 1, 'no sideways scroll');
  }, 390);
  T.test('V.detail keeps working as a string; U.dialog with bare has no title bar, the labelledby and the focus it was given', function () {
    var s = V.detail(A.occByKey('fnm-draft@2026-10-30'), MG.now()); ok(typeof s === 'string' && s.indexOf('id="det-title"') !== -1, 'string with the heading');
    var dlg = U.dialog('ignored', V.detailEl(A.occByKey('fnm-draft@2026-10-30'), MG.now()), { cls: 'dlg-det', bare: true, labelledby: 'det-title', focus: '#det-title' });
    try {
      eq(dlg.querySelector('.dlg-top'), null, 'no title bar'); eq(dlg.getAttribute('aria-labelledby'), 'det-title');
      eq(document.activeElement.id, 'det-title', 'focus'); ok(dlg.textContent.indexOf('ignored') === -1, 'title text not shown');
    } finally { dlg.close(); }
    var old = U.dialog('Plain', '<p>x</p>'); try { ok(old.querySelector('.dlg-top') && old.querySelector('.dlg-h').textContent === 'Plain', 'ordinary dialog unchanged'); } finally { old.close(); }
  });

  /* ---------- the weekly list ---------- */
  pageTest('Every week at 1280 (round 8): rows in one .wk-card, no cards, one action per row, no "Every" or "Walk in"; the day head carries the next date', 'events.html?' + N, function (w, d) {
    var card = d.querySelector('#weekly.wk-card'); ok(card, 'one week card');
    eq(d.querySelectorAll('#weekly .ev').length, 0, 'no cards in Every week');
    var rows = d.querySelectorAll('#weekly .day-line'); ok(rows.length > 10, 'rows: ' + rows.length);
    Array.prototype.forEach.call(rows, function (r) {
      var t = r.querySelector('.dl-title a').textContent;
      ok(!/Every/.test(r.querySelector('.dl-bits').textContent), 'no "Every": ' + t);
      ok(!/Walk in/i.test(r.textContent), 'no "Walk in" on ' + t);
      ok(r.querySelector('.dl-title a').getAttribute('href').indexOf('#e-') !== -1, 'title links to the next date: ' + t);
      ok(r.querySelectorAll('.btn-act').length <= 1 && r.querySelectorAll('.dl-act button, .dl-act a.btn, .dl-act .dl-more, .dl-act .stamp').length === 1, 'one action on ' + t);
    });
    var sign = d.querySelector('#weekly .dl-act button[data-signup]'); ok(sign, 'Sign up is a button that opens the form');
    ok(/^next [A-Z][a-z]{2} \d+$/.test(d.querySelector('#weekly .wk-next').textContent), d.querySelector('#weekly .wk-next').textContent);
    ok(d.querySelector('#weekly-wrap .sec-note').textContent.indexOf('A Sign up button holds a seat') !== -1, 'the one note');
    var h = d.querySelector('#weekly .day-h'), l = h.getBoundingClientRect(), r0 = d.querySelector('#weekly .day-line').getBoundingClientRect();
    ok(r0.left > l.right - 1, 'at 1280 the day head is a left column, rows to its right');
    ok(d.documentElement.scrollWidth <= d.documentElement.clientWidth + 1, 'no sideways scroll');
  });
  pageTest('Every week at 390: the same rows, no cards, the day head sits above its rows; Tonight keeps cards', 'events.html?' + N, function (w, d) {
    ok(d.querySelectorAll('#weekly .day-line').length > 10, 'rows'); eq(d.querySelectorAll('#weekly .ev').length, 0, 'no cards in Every week');
    ok(d.querySelectorAll('#today .ev').length > 0, 'Tonight keeps cards');
    var row = d.querySelector('#weekly .day-line'); ok(row.querySelector('.dl-title a').getAttribute('href').indexOf('#e-') !== -1, 'title links to the next date');
    ok(d.querySelector('#weekly .day-h').getBoundingClientRect().bottom <= d.querySelector('#weekly .day-line').getBoundingClientRect().top + 1, 'head above rows');
    ok(d.documentElement.scrollWidth <= d.documentElement.clientWidth + 1, 'no sideways scroll');
  }, 390);
  pageTest('Every week: the title link opens the detail dialog and Sign up opens the form', 'events.html?' + N, function (w, d) {
    click(d.querySelector('#weekly .dl-title a')); ok(d.getElementById('det-dlg').open, 'detail opens from a row title');
    click(d.getElementById('det-x')); eq(d.getElementById('det-dlg').open, false, 'X closes it');
    var sign = d.querySelector('#weekly .dl-act button[data-signup]'); click(sign);
    ok(d.querySelector('dialog[open] form.su'), 'the form opens');
  });

  /* ---------- the page head and the Tonight band (round 8, 4.1 and 4.2) ---------- */
  pageTest('events page head: header.page-head holds the h1, the lead, the chips, the format select and the calendar tools', 'events.html?' + N, function (w, d) {
    var head = d.querySelector('header.page-head'); ok(head, 'page head');
    eq(head.querySelector('h1').textContent, 'Events'); ok(head.querySelector('.lead').textContent.indexOf('Every game night at the shop') === 0, 'lead');
    ok(head.querySelector('#chips') && head.querySelector('#fmt') && head.querySelector('#cal-menu'), 'filter bar is inside the head');
    var cs = w.getComputedStyle(head.querySelector('h1')); ok(/Fraunces/.test(cs.fontFamily), 'h1 in Fraunces: ' + cs.fontFamily);
    eq(w.getComputedStyle(head, '::after').height, '6px', 'coursing rule');
    eq(head.getBoundingClientRect().width, d.documentElement.clientWidth, 'full width');
    ok(d.querySelector('link[rel="preload"][href="fonts/fraunces.woff2"]'), 'Fraunces preload');
  });
  pageTest('events Tonight: a full-bleed brick band under the head with its ids, kicker date and cards', 'events.html?' + N, function (w, d) {
    var band = d.getElementById('today-wrap'); ok(band && band.matches('section.tn-band') && !band.hidden, 'band');
    eq(d.getElementById('today-h').textContent, 'Tonight'); eq(d.getElementById('today-k').textContent, 'Friday, October 30');
    eq(band.getBoundingClientRect().width, d.documentElement.clientWidth, 'edge to edge');
    ok(band.getBoundingClientRect().top >= d.querySelector('header.page-head').getBoundingClientRect().bottom - 1, 'under the head');
    var n = d.querySelectorAll('#today .tn-cards .ev').length; ok(n >= 1 && n <= 3, 'up to 3 cards: ' + n);
    ok(d.querySelector('#today .tn-cards .ev-title a'), 'card titles are links');
  });
  pageTest('events Tonight before 5 PM is called Today', 'events.html?now=2026-10-30T12:00', function (w, d) {
    eq(d.getElementById('today-h').textContent, 'Today');
  });
  pageTest('Closed Monday and Tuesday are one .day-off row with both anchors', 'events.html?' + N, function (w, d) {
    var off = d.querySelectorAll('#weekly .day-off'); eq(off.length, 1, 'one row');
    ok(off[0].querySelector('#wk-1') && off[0].querySelector('#wk-2'), 'both anchors');
    eq(off[0].textContent, 'Monday and Tuesday · closed');
  });

  /* ---------- Special events ---------- */
  pageTest('Friday 6:50 PM: nothing dated Oct 30 is listed in Special events; the dates there have no diamonds', 'events.html?' + N, function (w, d) {
    eq(d.querySelectorAll('#special [id="d-2026-10-30"]').length, 0, 'no Oct 30 in Special');
    ok(d.querySelectorAll('#special .day').length >= 2, 'other dates remain');
    eq(d.querySelectorAll('#special .day-dia').length, 0, 'no diamonds');
  });
  pageTest('Special events at 1280: rows in one week card (D63), one action each, extra dates and counts in the bits', 'events.html?' + N, function (w, d) {
    var days = d.querySelectorAll('#special .day'); ok(days.length >= 2); ok(d.getElementById('special').classList.contains('wk-card'), 'week card');
    eq(d.querySelectorAll('#special .ev').length, 0, 'no cards'); var rows = d.querySelectorAll('#special .day-line'); ok(rows.length >= 5, 'rows ' + rows.length);
    Array.prototype.forEach.call(rows, function (r) { ok(r.querySelectorAll('.btn').length <= 1, 'one action: ' + r.textContent); ok(r.getBoundingClientRect().height <= 72, 'row height ' + r.getBoundingClientRect().height); });
    ok(/registered/.test(d.getElementById('special').textContent), 'TopDeck counts kept'); ok(/Also |Repeats: /.test(d.getElementById('special').textContent), 'other dates kept'); ok(/Invite only/.test(d.getElementById('special').textContent), 'invite only kept');
    var cdh = d.querySelector('#special .day-line[data-game="cedh"] a.btn'); ok(cdh && cdh.rel === 'noopener' && cdh.target === '_blank', 'TopDeck link opens a new tab');
    var cs = w.getComputedStyle(days[0].querySelector('.day-name')); ok(cs.textTransform === 'none' && cs.fontWeight === '700', 'date head is a sentence-case kicker');
  });

  /* ---------- hostile text ---------- */
  T.test('a hostile title is text in the detail, the weekly row and the weekly card', function () {
    MG.state.reset(); MG.now = function () { return new Date(2026, 9, 30, 18, 50); }; window.__xss = 0; box.textContent = '';
    var s = A.seriesById('fnm-draft'); s.title = XSS_IMG; s.description = XSS_IMG; s.prize = XSS_IMG;
    s.tool = { name: XSS_IMG, url: 'javascript:alert(1)', code: XSS_IMG };
    var now = MG.now(), occ = A.occByKey('fnm-draft@2026-10-30');
    box.appendChild(V.detailEl(occ, now)); box.appendChild(V.weeklyRow(s, now, '2026-10-30', '2026-12-30')); box.appendChild(V.weeklyCardEl(s, now, '2026-10-30', '2026-12-30'));
    eq(window.__xss, 0, 'no script ran'); eq(box.querySelectorAll('img[src="x"]').length, 0, 'no injected image');
    ok(box.querySelector('.det-name').textContent === XSS_IMG, 'detail title shows as text');
    ok(box.querySelector('.dl-title a').textContent === XSS_IMG, 'row title shows as text');
    ok(!box.querySelector('a[href^="javascript:"]'), 'no javascript: link');
    box.textContent = ''; MG.state.reset();
  });
})();
