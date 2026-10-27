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
  pageTest('Every week at 1280: cards say the time without "Every" or "Walk in"; the day heading carries the next date', 'events.html?' + N, function (w, d) {
    var cards = d.querySelectorAll('#weekly .ev'); ok(cards.length > 10, 'cards: ' + cards.length);
    Array.prototype.forEach.call(cards, function (c) {
      ok(!/Every/.test(c.querySelector('.ev-when').textContent), 'no "Every": ' + c.querySelector('.ev-when').textContent);
      ok(!/Walk in/i.test(c.textContent), 'no "Walk in" on ' + c.querySelector('.ev-title').textContent);
    });
    ok(/^next [A-Z][a-z]{2} \d+$/.test(d.querySelector('#weekly .wk-next').textContent), d.querySelector('#weekly .wk-next').textContent);
    ok(d.querySelectorAll('#weekly .ev-next').length < 4, 'a "Next:" line only for cancelled or changed dates: ' + d.querySelectorAll('#weekly .ev-next').length);
  });
  pageTest('Every week at 390: one .day-line row per series, no cards; Tonight still has cards', 'events.html?' + N, function (w, d) {
    ok(d.querySelectorAll('#weekly .day-line').length > 10, 'rows'); eq(d.querySelectorAll('#weekly .ev').length, 0, 'no cards in Every week');
    ok(d.querySelectorAll('#today .ev').length > 0, 'Tonight keeps cards');
    var row = d.querySelector('#weekly .day-line'); ok(row.querySelector('.dl-title a').getAttribute('href').indexOf('#e-') !== -1, 'title links to the next date');
    ok(d.documentElement.scrollWidth <= d.documentElement.clientWidth + 1, 'no sideways scroll');
  }, 390);
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
  pageTest('Special events at 1280: two dates across', 'events.html?' + N, function (w, d) {
    var days = d.querySelectorAll('#special .day'); ok(days.length >= 2);
    eq(Math.round(days[0].getBoundingClientRect().top), Math.round(days[1].getBoundingClientRect().top), 'first two dates share a row');
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
