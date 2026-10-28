/* Tests for what people see: typed text stays text (HTML injection), the roster screen's behaviour, and a click-through of the
 * real pages in an iframe (needs file access: run Chrome with --allow-file-access-from-files, or serve the folder; otherwise those
 * tests are skipped, not failed). Loaded by tests.html after tests-rules.js. */
(function () {
  'use strict';
  var MG = window.MG, D = MG.data, R = MG.rules, A = MG.act, U = MG.ui, V = MG.views, T = window.T;
  var eq = T.eq, ok = T.ok;
  var box = document.getElementById('sandbox');
  var XSS_IMG = '<img src=x onerror="window.__xss=1">';
  var XSS_SCRIPT = '"><script>window.__xss=2<\/script><b>';
  var SQL = '\' OR 1=1 --';
  function fresh() { MG.state.reset(); MG.now = function () { return new Date(2026, 9, 28, 16, 0); }; box.innerHTML = ''; window.__xss = 0; }
  function inert(html, label) {
    box.innerHTML = html;
    eq(box.querySelectorAll('img[src="x"], script').length, 0, label + ': no injected img or script');
    eq(box.querySelectorAll('[onerror]').length, 0, label + ': no onerror attribute');
    eq(window.__xss, 0, label + ': nothing ran');
  }

  /* ================= typed text stays text ================= */
  T.section('Typed text stays text (HTML and SQL injection)');

  T.test('(the check itself) a raw <img onerror> WOULD be caught by these tests', function () {
    box.innerHTML = '<img src=x>'; eq(box.querySelectorAll('img[src="x"]').length, 1); box.innerHTML = '';
  });
  T.test('a player name like <img onerror> shows as text on the roster, the waitlist and the Today list', function () {
    fresh();
    var r = A.register('fnm-draft@2026-10-30', { name: XSS_IMG, email: 'x@example.com', playerId: XSS_SCRIPT }, { expected: 'waitlist' });
    ok(r.ok, 'signed up'); eq(r.status, 'waitlist');
    var regs = A.regs(A.occByKey('fnm-draft@2026-10-30')), mine = regs.filter(function (x) { return x.name === XSS_IMG; })[0];
    inert(V.waitRow(mine, { showContact: true }), 'waitlist row');
    ok(box.textContent.indexOf(XSS_IMG) !== -1, 'the text itself is visible');
    mine.status = 'in'; mine.checkedIn = true;
    inert(V.regRow(mine, { fee: 20, idLabel: XSS_IMG, showContact: true }), 'roster row');
    inert(V.cancelledRow(mine), 'cancelled row');
  });
  T.test('event titles, notes, prizes, tool names and descriptions are escaped in cards, the detail and the admin list', function () {
    fresh();
    var s = A.seriesById('fnm-draft');
    s.title = XSS_IMG; s.prize = XSS_SCRIPT; s.bring = XSS_IMG; s.description = XSS_SCRIPT; s.format = XSS_IMG;
    s.tool = { name: XSS_IMG, url: 'javascript:alert(1)', code: XSS_SCRIPT };
    D.exceptions.push({ series: 'fnm-draft', date: '2026-10-30', type: 'change', note: XSS_IMG });
    var occ = A.occByKey('fnm-draft@2026-10-30'), now = MG.now();
    inert(MG.eventCard(occ, now, {}), 'event card');
    inert(V.detail(occ, now), 'event detail');
    ok(V.detail(occ, now).indexOf('href="javascript:') === -1, 'no javascript: link in the detail');
    ok(MG.eventCard(occ, now, {}).indexOf('javascript:') === -1, 'no javascript: link on the card');
    inert(V.weeklyCard(s, now, '2026-10-28', '2026-11-30'), 'weekly card');
    inert(V.eventRow(s, { now: now, next: occ, open: true, dates: [occ] }), 'admin list row');
    inert(V.signupForm(occ, MG.seatState(occ, now)), 'sign-up form');
  });
  T.test('product names, preorder customers, contacts and stock notes are escaped', function () {
    fresh();
    var p = D.products[0]; p.name = XSS_IMG;
    D.stockMoves.push({ product: p.id, qty: 1, reason: 'received', note: XSS_SCRIPT, at: '2026-10-28T10:00:00', who: 'x' });
    inert(V.productRow(p, { open: true, counting: true, moves: D.stockMoves, reserved: { total: 1, lines: [{ title: XSS_IMG, date: '2026-10-30', qty: 1, seats: 1 }] }, look: 14 }), 'product row');
    var o = D.preorders[0]; o.customer = XSS_IMG; o.contact = 'javascript:alert(1) / ' + XSS_SCRIPT;
    inert(V.preorderRow(o, { product: XSS_IMG, showContact: true, bigCall: true }), 'preorder row');
    ok(box.innerHTML.indexOf('href="javascript:') === -1, 'no javascript: links');
    inert(V.contactLinks('"><img src=x onerror="window.__xss=1">'), 'contact links');
  });
  T.test('the event form puts typed values in as values, not markup', function () {
    fresh();
    var f = R.formFromTemplate({ fields: window.MG_EXTRA.templates[0].fields }, '2026-11-13');
    f.title = XSS_SCRIPT; f.prize = XSS_IMG; f.description = XSS_IMG; f.toolUrl = XSS_IMG; f.cta = XSS_SCRIPT; f.bring = '</textarea>' + XSS_IMG;
    inert(V.editorForm(f, { tplName: XSS_IMG, editId: XSS_SCRIPT }), 'event form');
    eq(box.querySelector('input[name="title"]').value, XSS_SCRIPT, 'the typed title is still exactly what was typed');
    eq(box.querySelector('textarea[name="description"]').value, XSS_IMG, 'textarea content is text');
  });
  T.test('the results form, toast and dialogs escape their text', function () {
    fresh();
    var occ = A.occByKey('fnm-draft@2026-10-23');
    inert(V.resultsForm(occ, { winner: XSS_IMG, top: [XSS_IMG, XSS_SCRIPT], prizes: XSS_IMG, credit: XSS_SCRIPT, prizeRows: [] }, { names: [XSS_IMG], products: D.products, headcount: XSS_SCRIPT, useLines: [1], takeStock: true, useHint: XSS_IMG }), 'results form');
    U.toast(XSS_IMG);
    eq(document.querySelectorAll('.toast img').length, 0, 'toast has no img'); ok(document.querySelector('.toast').textContent.indexOf(XSS_IMG) !== -1, 'toast shows the text');
    var d = U.dialog(XSS_IMG, '<p>ok</p>'); eq(d.querySelectorAll('img').length, 0, 'dialog title has no img'); d.close();
  });
  T.test('hostile data that comes back from storage is inert too (a restored snapshot with injected text)', function () {
    fresh();
    var snap = JSON.parse(MG.state.snapshot());
    snap.series[0].title = XSS_IMG; snap.registrations[0].name = XSS_SCRIPT; snap.products[0].name = XSS_IMG; snap.preorders[0].customer = XSS_IMG; snap.templates = [{ id: 't', game: 'magic', name: XSS_IMG, yours: true, form: { fee: '1', signup: 'walkin', uses: [] } }];
    MG.state.restore(JSON.stringify(snap));
    var s = D.series[0], occ = MG.occurrences(s, '2026-10-28', '2026-11-30')[0], now = MG.now();
    inert(MG.eventCard(occ, now, {}) + V.detail(occ, now) + V.eventRow(s, { now: now, next: occ }) + V.regRow(D.registrations[0], { fee: 5 }) + V.productRow(D.products[0], {}) + V.preorderRow(D.preorders[0], { product: 'p' }), 'restored data');
    inert(V.templatesFor('magic').map(function (t) { return '<b>' + MG.esc(t.name) + '</b>' + MG.esc(t.summary); }).join(''), 'template names');
  });
  T.test('names typed as SQL are plain text too (nothing here builds SQL; the build uses ? placeholders)', function () {
    fresh();
    var r = A.register('pauper@2026-10-28', { name: SQL, email: 'sql@example.com' });
    ok(r.ok, 'accepted as a name'); eq(r.reg.name, SQL);
    inert(V.regRow(r.reg, { fee: 10 }), 'row');
    ok(box.textContent.indexOf(SQL) !== -1, 'shown as typed');
    eq(D.registrations.length > 0, true);
  });
  T.test('only http(s) links come out of data', function () {
    eq(MG.safeUrl('https://topdeck.gg/x'), 'https://topdeck.gg/x'); eq(MG.safeUrl('javascript:alert(1)'), '#'); eq(MG.safeUrl('data:text/html,x'), '#'); eq(MG.safeUrl(null), '#');
    var f = R.formFromTemplate({ fields: window.MG_EXTRA.templates[0].fields }, '2026-11-13'); f.signup = 'external'; f.toolUrl = 'javascript:alert(1)';
    ok(R.validateSeries(f).toolUrl, 'the editor refuses a javascript: link');
  });

  /* ================= the roster screen ================= */
  T.section('Roster screen: check-in, payment, cancel and auto-promote');
  function mount(key) {
    box.innerHTML = '<section id="r"></section>';
    return V.mountRoster(box.firstChild, { getKey: function () { return key; }, tabs: false });
  }
  function click(el) { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); }
  T.test('tapping the check button checks someone in; tapping again undoes it', function () {
    fresh();
    var c = mount('fnm-draft@2026-10-30'), btn = box.querySelector('.rrow .chk56'), id = btn.closest('[data-reg]').getAttribute('data-reg');
    click(btn); eq(A.regById(id).checkedIn, true);
    eq(box.querySelector('[data-reg="' + id + '"] .chk56').getAttribute('aria-pressed'), 'true');
    ok(box.textContent.indexOf('Checked in 1 of 28') !== -1, 'the counter moved');
    click(box.querySelector('[data-reg="' + id + '"] .chk56')); eq(A.regById(id).checkedIn, false);
    c.destroy();
  });
  T.test('payment buttons set the payment status', function () {
    fresh();
    var c = mount('fnm-draft@2026-10-30'), row = box.querySelector('.rrow'), id = row.getAttribute('data-reg');
    click(row.querySelector('[data-v="door"]')); eq(A.regById(id).payment, 'door');
    click(box.querySelector('[data-reg="' + id + '"] [data-v="comped"]')); eq(A.regById(id).payment, 'comped');
    c.destroy();
  });
  T.test('cancelling someone moves the first waitlisted person into the list, on screen', function () {
    fresh();
    var c = mount('fnm-draft@2026-10-30'), key = { series: 'fnm-draft', date: '2026-10-30', start: '19:00' };
    var first = R.waitlistOf(R.group(D.registrations, key))[0], victim = box.querySelector('.rrow[data-status="in"]').getAttribute('data-reg');
    eq(box.querySelectorAll('.rrow-wait').length, 3, 'three on the waitlist');
    click(box.querySelector('[data-reg="' + victim + '"] [data-act="cancel"]'));
    eq(A.regById(first.id).status, 'in');
    eq(box.querySelectorAll('.rrow-wait').length, 2, 'two left on the waitlist');
    ok(box.querySelector('.rrow[data-reg="' + first.id + '"]:not(.rrow-wait)'), 'the promoted person is now in the signed-up list');
    ok(document.querySelector('.toast').textContent.indexOf('moved in from the waitlist') !== -1, 'the toast says so');
    c.destroy();
  });
  T.test('Undo on the toast puts the cancelled person back and the waitlist as it was', function () {
    fresh();
    var c = mount('fnm-draft@2026-10-30'), victim = box.querySelector('.rrow[data-status="in"]').getAttribute('data-reg');
    click(box.querySelector('[data-reg="' + victim + '"] [data-act="cancel"]'));
    click(document.querySelector('.toast .toast-btn'));
    eq(A.regById(victim).status, 'in'); eq(box.querySelectorAll('.rrow-wait').length, 3);
    c.destroy();
  });
  function submitWalk(bar, name, btn) { bar.elements.name.value = name; bar.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true, submitter: btn || null })); }
  function dlgOf() { return document.querySelector('dialog.dlg[open]'); }
  function closeDlgs() { Array.prototype.forEach.call(document.querySelectorAll('dialog.dlg'), function (d) { try { d.close(); } catch (e) { d.remove(); } }); }
  T.test('a full event offers "Add to waitlist" (the main button) and "Seat anyway (29 of 28)" for a walk-in', function () {
    fresh();
    var c = mount('fnm-draft@2026-10-30'), bar = box.querySelector('.walkbar');
    ok(bar.textContent.indexOf('Add to waitlist') !== -1 && bar.textContent.indexOf('Seat anyway (29 of 28)') !== -1, bar.textContent);
    ok(bar.querySelector('button[value="waitlist"]').classList.contains('btn-act'), 'Add to waitlist is the primary');
    ok(!bar.querySelector('button[value="over"]').classList.contains('btn-act'), 'Seat anyway is not');
    c.destroy();
  });
  T.test('a walk-in bar with room has one Add button whose accessible name is "Add and check in"', function () {
    fresh();
    var c = mount('fnm-draft@2026-10-23'), bar = box.querySelector('.walkbar'), b = bar.querySelector('button[value="auto"]');
    ok(b && b.getAttribute('aria-label') === 'Add and check in' && b.textContent === 'Add and check in', b && b.textContent);
    c.destroy();
  });
  T.async('Seat anyway asks first: Go back leaves nobody added, Seat anyway seats 29 of 28', function () {
    fresh(); closeDlgs();
    var c = mount('fnm-draft@2026-10-30'), bar = box.querySelector('.walkbar');
    submitWalk(bar, 'Walt Z.', bar.querySelector('button[value="over"]'));
    var d = dlgOf(); ok(d, 'a confirm opened'); ok(d.textContent.indexOf('takes seat 29 of 28') !== -1, d.textContent);
    eq(D.registrations.filter(function (r) { return r.name === 'Walt Z.'; }).length, 0, 'nobody added yet');
    d.querySelector('[data-close]:not(.dlg-x)').click();
    return T.wait(30).then(function () {
      eq(D.registrations.filter(function (r) { return r.name === 'Walt Z.'; }).length, 0, 'Go back adds nobody');
      bar = box.querySelector('.walkbar'); submitWalk(bar, 'Walt Z.', bar.querySelector('button[value="over"]'));
      dlgOf().querySelector('[data-ok]').click();
      return T.wait(30);
    }).then(function () {
      var w = D.registrations.filter(function (r) { return r.name === 'Walt Z.'; })[0];
      ok(w && w.status === 'in' && w.checkedIn, 'seated and checked in');
      eq(R.counts(A.regs(A.occByKey('fnm-draft@2026-10-30'))).in, 29);
      c.destroy(); closeDlgs();
    });
  });
  T.test('Enter in the name field of a full event adds to the waitlist, not a seat', function () {
    fresh();
    var c = mount('fnm-draft@2026-10-30'), bar = box.querySelector('.walkbar');
    submitWalk(bar, 'Eve W.', null);
    var w = D.registrations.filter(function (r) { return r.name === 'Eve W.'; })[0];
    ok(w && w.status === 'waitlist', 'waitlisted');
    eq(R.counts(A.regs(A.occByKey('fnm-draft@2026-10-30'))).in, 28);
    c.destroy();
  });
  T.async('a hostile walk-in name shows as text in the Seat anyway confirm', function () {
    fresh(); closeDlgs();
    var c = mount('fnm-draft@2026-10-30'), bar = box.querySelector('.walkbar');
    submitWalk(bar, XSS_IMG, bar.querySelector('button[value="over"]'));
    var d = dlgOf(); ok(d.textContent.indexOf(XSS_IMG) !== -1, 'the text is shown');
    eq(d.querySelectorAll('img[src="x"]').length, 0, 'no injected img'); eq(window.__xss, 0, 'nothing ran');
    d.querySelector('[data-close]:not(.dlg-x)').click(); c.destroy();
    return T.wait(30).then(closeDlgs);
  });
  T.test('R19: before the start "Needs N more" shows; after it "Started with" with Run it, which clears it', function () {
    fresh();
    MG.now = function () { return new Date(2026, 9, 30, 17, 0); };
    var c = mount('chaos-draft-oct30@2026-10-30');
    ok(/Needs 3 more to run/.test(box.textContent), 'before the start'); ok(!/Started with/.test(box.textContent) && !box.querySelector('[data-act="runit"]'), 'no started text yet');
    c.destroy();
    MG.now = function () { return new Date(2026, 9, 30, 18, 50); };
    c = mount('chaos-draft-oct30@2026-10-30');
    ok(/Started with 0 \(min 8\)/.test(box.textContent), box.textContent); ok(!/Needs/.test(box.textContent), 'no "Needs" after the start');
    ok(box.querySelector('[data-act="cancel-date"]'), 'Cancel this date is offered');
    click(box.querySelector('[data-act="runit"]'));
    ok(!/Started with/.test(box.textContent) && !box.querySelector('[data-act="runit"]'), 'cleared for that date');
    c.destroy();
  });
  T.test('R13: the Unpaid segment is an outline with no fill class until a payment is chosen', function () {
    fresh();
    var c = mount('pauper@2026-10-28'), id = box.querySelector('.rrow[data-status="in"]').getAttribute('data-reg'), row = box.querySelector('[data-reg="' + id + '"]');
    var u = row.querySelector('.pay-b[data-v="unpaid"]'); ok(u.getAttribute('aria-pressed') === 'true' && !row.querySelector('.pay-fill'), 'unpaid chosen, nothing filled');
    click(row.querySelector('[data-v="door"]'));
    row = box.querySelector('[data-reg="' + id + '"]'); ok(row.querySelector('.pay-b[data-v="door"]').classList.contains('pay-fill'), 'door filled'); ok(!row.querySelector('.pay-unpaid.pay-fill'), 'unpaid not filled');
    c.destroy();
  });
  T.test('R12: the waitlist chip is a jump link to the waitlist; the check button has a visible "In" label and its accessible name', function () {
    fresh();
    var c = mount('fnm-draft@2026-10-30'), a = box.querySelector('a.rstat-a[href^="#wait-"]');
    ok(a && /on the waitlist/.test(a.textContent), 'chip link'); ok(document.getElementById(a.getAttribute('href').slice(1)), 'its target exists');
    var chk = box.querySelector('.chk56'); ok(chk.getAttribute('aria-label') && chk.querySelector('.chk-s').textContent === 'In', 'In label, name kept');
    c.destroy();
  });
  T.test('a walk-in-only night shows the headcount counter, and the number goes into the results', function () {
    fresh();
    var c = mount('tabletop-wed@2026-10-28');
    ok(box.querySelector('.cnt-n'), 'counter is there'); eq(box.querySelector('.cnt-n').textContent, '0');
    click(box.querySelector('[data-act="cnt-plus"]')); click(box.querySelector('[data-act="cnt-plus"]')); click(box.querySelector('[data-act="cnt-plus"]'));
    eq(box.querySelector('.cnt-n').textContent, '3');
    var host = document.createElement('div'); box.appendChild(host); V.mountResults(host, 'tabletop-wed@2026-10-28', {});
    eq(host.querySelector('input[name="headcount"]').value, '3');
    c.destroy();
  });
  T.test('a night nobody signed up for says so, a cancelled date says so', function () {
    fresh();
    var c = mount('commander-thu@2026-10-29'); ok(box.querySelector('.cnt'), 'walk-in counter'); c.destroy();
    A.cancelDate('pauper', '2026-10-28'); c = mount('pauper@2026-10-28'); ok(box.textContent.indexOf('This date is cancelled') !== -1); c.destroy();
  });

  /* ================= real pages in an iframe ================= */
  T.section('Pages: load, click through, no console errors');
  var BASE = location.href.replace(/[^\/]*$/, '').split('?')[0];
  var SAVE;
  function openPage(path) {
    return new Promise(function (resolve, reject) {
      var f = document.createElement('iframe'), errors = [], settled = false;
      f.style.cssText = 'position:absolute;left:-9999px;width:1280px;height:900px';
      f.addEventListener('load', function () {
        try {
          var w = f.contentWindow; void w.document.body;
          w.addEventListener('error', function (ev) { errors.push(ev.message); });
          var ce = w.console.error; w.console.error = function () { errors.push(Array.prototype.join.call(arguments, ' ')); ce.apply(w.console, arguments); };
          // errors thrown while the page's scripts ran are caught by the pages' own try/catch and logged with console.error,
          // so give them a moment, then report
          setTimeout(function () { if (!settled) { settled = true; resolve({ w: w, d: w.document, errors: errors, frame: f }); } }, 250);
        } catch (err) { reject(new Error('NOACCESS')); }
      });
      document.body.appendChild(f); f.src = BASE + path;
    });
  }
  function pageTest(name, path, fn) {
    T.async(name, function () {
      return openPage(path).then(function (p) {
        return Promise.resolve(fn(p.w, p.d, p)).then(function () {
          eq(p.errors.join(' | '), '', 'console errors'); eq(p.d.querySelectorAll('.empty[role="alert"]').length, 0, 'an error panel is showing'); p.frame.remove();
        }, function (err) { p.frame.remove(); throw err; });
      }, function (err) { if (err && err.message === 'NOACCESS') return T.SKIP; throw err; });
    });
  }
  function frameClick(el) { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); }
  function setVal(w, input, v) { input.value = v; input.dispatchEvent(new w.Event('input', { bubbles: true })); input.dispatchEvent(new w.Event('change', { bubbles: true })); }

  T.async('(set up) remember the demo data in this browser and start the page tests from a clean sample', function () {
    try { SAVE = localStorage.getItem('mg-demo-v1'); localStorage.removeItem('mg-demo-v1'); } catch (err) { /* no storage: pages run on the sample */ }
    return openPage('index.html').then(function (p) { p.frame.remove(); }, function (err) { if (err && err.message === 'NOACCESS') { T.noFrames = true; } else throw err; });
  });
  var N = 'now=2026-10-28T16:00';
  pageTest('events.html loads with cards, chips and no errors', 'events.html?' + N, function (w, d) {
    ok(d.querySelectorAll('.ev, #weekly .day-line').length > 15, 'cards and rows: ' + d.querySelectorAll('.ev, #weekly .day-line').length);
    ok(d.querySelector('#weekly .wk-next'), 'weekly day heads say "next"');
    eq(d.querySelectorAll('.chip').length, 9);
  });
  pageTest('events.html: a game chip filters, a format filters', 'events.html?' + N + '&game=magic', function (w, d) {
    var shown = d.querySelectorAll('.ev, #special .day-line'); ok(shown.length > 5 && d.querySelectorAll('.ev:not([data-game="magic"]):not([data-game="cedh"]), #special .day-line:not([data-game="magic"]):not([data-game="cedh"])').length === 0, 'only Magic and cEDH cards and rows: ' + shown.length);
    setVal(w, d.getElementById('fmt'), 'Draft'); // option exists for Magic
    ok(d.querySelectorAll('.ev, #weekly .day-line').length >= 2 && d.querySelectorAll('.ev, #weekly .day-line').length < 8, 'Draft only: ' + d.querySelectorAll('.ev, #weekly .day-line').length);
  });
  pageTest('events.html: filter with nothing shows the empty state', 'events.html?' + N + '&game=hololive&format=Bloom%20Cup', function (w, d) {
    ok(d.querySelector('#ep-empty .empty'), 'empty state'); ok(d.querySelector('#ep-empty').textContent.indexOf('Show all games') !== -1);
  });
  pageTest('events.html: Friday draft detail opens from the link, shows fee, seats, tool, other dates', 'events.html?' + N + '#e-fnm-draft%402026-10-30', function (w, d) {
    var dlg = d.getElementById('det-dlg'); ok(dlg.open, 'dialog is open'); var t = dlg.textContent;
    ok(t.indexOf('Draft FNM') !== -1 && t.indexOf('$20') !== -1 && t.indexOf('Wizards EventLink') !== -1 && t.indexOf('Prize packs paid by record') !== -1 && t.indexOf('Nothing. Packs are included') !== -1, 'fields');
    ok(dlg.querySelector('.det-dates a'), 'other dates'); ok(dlg.querySelector('[data-signup]').textContent.indexOf('Join the waitlist') !== -1, 'full: waitlist button');
  });
  pageTest('events.html: sign up, get waitlisted #4, see the same on the admin roster', 'events.html?' + N + '#e-fnm-draft%402026-10-30', function (w, d) {
    frameClick(d.querySelector('#det-body [data-signup]'));
    var form = d.querySelector('.su'); ok(form, 'form'); ok(form.textContent.indexOf('Wizards ID (Companion)') !== -1, 'player ID field from the tool');
    form.elements.name.value = 'Testy T.'; form.elements.email.value = 'testy@example.com';
    form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    return T.wait(900).then(function () {
      var done = d.querySelector('.su-done'); ok(done, 'success shown'); ok(/waitlist \(#4\)/.test(done.textContent), done.textContent);
      eq(w.MG.act.regs(w.MG.act.occByKey('fnm-draft@2026-10-30')).filter(function (r) { return r.name === 'Testy T.'; })[0].waitlistPos, 4);
    });
  });
  pageTest('events.html: sign-up errors sit under the field and nothing is saved', 'events.html?' + N + '#e-pauper%402026-10-28', function (w, d) {
    frameClick(d.querySelector('#det-body [data-signup]'));
    var form = d.querySelector('.su'), before = w.MG.data.registrations.length;
    form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    eq(d.getElementById('e-name').hidden, false); ok(d.getElementById('e-name').textContent.indexOf('Enter your name') !== -1);
    eq(d.getElementById('e-email').textContent, 'Add an email or a phone number.');
    eq(form.elements.name.getAttribute('aria-invalid'), 'true'); eq(w.MG.data.registrations.length, before);
  });
  pageTest('events.html: a seat in Pauper says "You\'re in", Add to calendar builds a .ics', 'events.html?' + N + '#e-pauper%402026-10-28', function (w, d) {
    frameClick(d.querySelector('#det-body [data-signup]'));
    var form = d.querySelector('.su'); form.elements.name.value = 'Pat P.'; form.elements.phone.value = '215-555-0123';
    form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    return T.wait(900).then(function () {
      ok(/You.re in\./.test(d.querySelector('.su-done').textContent), d.querySelector('.su-done').textContent);
      ok(/Seat 12 of 28/.test(d.querySelector('.su-done').textContent), 'seat number');
      var cap = null, orig = w.MG.ui.download; w.MG.ui.download = function (n, t) { cap = { n: n, t: t }; };
      frameClick(d.querySelector('.su-done [data-ics-one]'));
      ok(cap && cap.t.indexOf('BEGIN:VCALENDAR') === 0 && cap.t.indexOf('SUMMARY:Pauper Night') !== -1, 'ics'); eq(cap.n, 'mulligan-pauper-2026-10-28.ics');
    });
  });
  pageTest('admin Today: opens on the busy event, shows the sign-up made above, check-in works', 'admin/index.html?now=2026-10-30T19:30', function (w, d) {
    ok(d.getElementById('today-h').textContent.indexOf('Today, Friday Oct 30') === 0, d.getElementById('today-h').textContent);
    eq(d.querySelector('.evb[aria-pressed="true"] .evb-n').textContent, 'Draft FNM');
    ok(d.querySelector('.reminders').textContent.indexOf('low in stock') !== -1 && d.querySelector('.reminders').textContent.indexOf('not reported') !== -1 && d.querySelector('.reminders').textContent.indexOf('preorders arrived') !== -1, d.querySelector('.reminders').textContent);
    ok(d.querySelectorAll('.reminders a.rem').length >= 3 && !d.querySelector('.reminders button, .reminders [style]'), 'reminders are plain text links');
    ok(Array.prototype.some.call(d.querySelectorAll('.rrow-wait .rr-name'), function (n) { return n.textContent === 'Testy T.'; }), 'the waitlisted test sign-up is on the waitlist');
    var btn = d.querySelector('.rrow[data-status="in"] .chk56'); frameClick(btn);
    ok(d.querySelector('.rrow[data-checked]'), 'a row is checked in'); ok(d.querySelector('.toast.on .toast-btn'), 'toast with Undo');
  });
  pageTest('admin chrome (round 8): h1 and h2 in Fraunces, counter numbers stay Archivo condensed, buttons keep the control radius, brick rule on the sidebar', 'admin/index.html?now=2026-10-30T19:30', function (w, d) {
    var h1 = d.getElementById('today-h'); eq(h1.tagName, 'H1'); ok(h1.textContent.indexOf('Today, Friday Oct 30') === 0, 'h1 text unchanged: ' + h1.textContent);
    ok(/Fraunces/.test(w.getComputedStyle(h1).fontFamily), 'h1 Fraunces: ' + w.getComputedStyle(h1).fontFamily);
    var h2 = d.querySelector('.adm h2'); if (h2) ok(/Fraunces/.test(w.getComputedStyle(h2).fontFamily) && w.getComputedStyle(h2).fontWeight === '600', 'h2 Fraunces 600');
    var n = d.querySelector('.cnt-n, .evb-t, .wpos'); ok(n, 'a counter number'); ok(/Archivo/.test(w.getComputedStyle(n).fontFamily) && w.getComputedStyle(n).fontWeight === '900', 'counter numbers stay Archivo 900: ' + w.getComputedStyle(n).fontFamily);
    var b = d.querySelector('.adm .btn'); ok(parseFloat(w.getComputedStyle(b).borderTopLeftRadius) < 20, 'admin buttons are not pills: ' + w.getComputedStyle(b).borderTopLeftRadius);
    var side = d.querySelector('.adm-side'); eq(w.getComputedStyle(side).borderTopWidth, '3px', 'sidebar brick rule');
    ok(d.querySelector('link[rel="preload"][href="../fonts/fraunces.woff2"]'), 'Fraunces preload');
    ok(d.querySelector('.side-name').textContent === 'Shop admin' && w.getComputedStyle(d.querySelector('.side-name')).textTransform === 'none', 'Shop admin, not uppercase');
  });
  pageTest('admin Today: nothing on a closed day says what is next', 'admin/index.html?now=2026-10-26T12:00', function (w, d) {
    ok(d.getElementById('today-empty').textContent.indexOf('Nothing on today') !== -1 && d.getElementById('today-empty').textContent.indexOf('Tabletop and Warhammer') !== -1, d.getElementById('today-empty').textContent);
  });
  pageTest('admin Events: list, expand dates, cancel a date, bring it back', 'admin/events.html?' + N, function (w, d) {
    ok(d.querySelectorAll('.erow').length >= 15, 'rows'); ok(d.querySelector('details.past'), 'already happened');
    var row = d.querySelector('[data-series="pokemon-sat"]'); frameClick(row.querySelector('[data-act="expand"]'));
    var dr = d.querySelector('[data-series="pokemon-sat"] .drow'); ok(dr, 'dates shown'); ok(d.querySelector('[data-series="pokemon-sat"] .drow-off'), 'the sample cancellation shows');
    frameClick(d.querySelector('[data-series="pokemon-sat"] [data-act="restore"]'));
    eq(d.querySelectorAll('[data-series="pokemon-sat"] .drow-off').length, 0, 'brought back');
  });
  pageTest('admin Events: new event from a template, save it, it is in the list and reserves stock', 'admin/events.html?' + N + '#new', function (w, d) {
    frameClick(d.querySelector('[data-pick-game="magic"]'));
    var tpl = Array.prototype.filter.call(d.querySelectorAll('[data-pick-tpl]'), function (b) { return b.textContent.indexOf('Draft night') === 0; })[0]; ok(tpl, 'draft template');
    ok(tpl.textContent.indexOf('$20') !== -1 && tpl.textContent.indexOf('28 seats') !== -1, tpl.textContent);
    frameClick(tpl);
    var form = d.querySelector('.eform'); ok(form, 'form'); eq(form.elements.fee.value, '20'); eq(form.elements.capacity.value, '28');
    ok(d.getElementById('reserve-line').textContent.indexOf('Reserves 84 Draft boosters') !== -1, d.getElementById('reserve-line').textContent);
    ok(d.getElementById('prev').querySelector('.ev'), 'live card'); ok(d.getElementById('sentence').textContent.indexOf('Every') === 0);
    setVal(w, form.elements.title, 'Test Draft'); setVal(w, form.elements.fee, '');
    form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    ok(!d.getElementById('errsum').hidden && d.getElementById('errsum').textContent.indexOf('1 thing needs fixing') !== -1, 'error summary'); ok(!d.getElementById('e-fee').hidden, 'error under the field');
    setVal(w, form.elements.fee, '15');
    form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    return T.wait(100).then(function () {
      ok(w.MG.data.series.some(function (s) { return s.title === 'Test Draft' && s.fee === 15; }), 'saved'); ok(d.querySelector('.erow-title') && Array.prototype.some.call(d.querySelectorAll('.erow-title'), function (n) { return n.textContent === 'Test Draft'; }), 'in the list');
    });
  });
  pageTest('admin Events: roster of a date shows tabs and results', 'admin/events.html?' + N + '#roster/fnm-draft%402026-10-23', function (w, d) {
    ok(d.querySelector('.tabs'), 'tabs'); ok(d.getElementById('results-host').querySelector('form.rf'), 'results form'); eq(d.querySelector('input[name="headcount"]').value, '24');
  });
  pageTest('admin Inventory: low badges, +/-, count, low-stock alert, reserved shown', 'admin/inventory.html?now=2026-10-28T16:00', function (w, d) {
    ok(d.querySelector('.banner').textContent.indexOf('3 products are low') !== -1, d.querySelector('.banner').textContent);
    var p10 = d.querySelector('[data-id="p10"]'); eq(p10.querySelector('.n-hand dd').textContent, '14');
    for (var i = 0; i < 4; i++) frameClick(d.querySelector('[data-id="p10"] [data-act="minus"]'));
    ok(d.querySelector('[data-id="p10"] .tag-warn'), 'Low badge after going to 10'); ok(d.querySelector('.banner').textContent.indexOf('4 products are low') !== -1, 'banner counts it');
    var p3 = d.querySelector('[data-id="p3"]'); ok(p3.querySelector('.tag-bad') && p3.textContent.indexOf('Short') !== -1, 'Short badge for draft boosters'); ok(p3.querySelector('.n-res dd').textContent !== '0', 'reserved number');
    frameClick(d.querySelector('[data-id="p10"] [data-act="count"]')); var cf = d.querySelector('[data-id="p10"] form'); ok(cf, 'count form');
    cf.elements.n.value = '3'; cf.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); eq(d.querySelector('[data-id="p10"] .n-hand dd').textContent, '3');
  });
  pageTest('admin Inventory: reserve for an event from the page of that event, filter by Short', 'admin/inventory.html?' + N + '&f=short&look=30', function (w, d) {
    ok(d.querySelectorAll('.prod').length >= 2, 'short products'); ok(Array.prototype.every.call(d.querySelectorAll('.prod'), function (p) { return p.hasAttribute('data-short'); }), 'all short');
    eq(d.getElementById('look').value, '30');
  });
  pageTest('admin Preorders: add one, mark arrived, see the call list', 'admin/inventory.html?' + N + '#preorders', function (w, d) {
    ok(d.querySelectorAll('.po').length >= 5, 'rows');
    var first = d.querySelector('.po[data-status="waiting"]'), id = first.getAttribute('data-id');
    frameClick(first.querySelector('[data-v="arrived"]'));
    eq(d.querySelector('.po[data-id="' + id + '"]').getAttribute('data-status'), 'arrived');
    frameClick(d.querySelector('[data-pf="arrived"]')); ok(d.querySelectorAll('.po-call a').length >= 3, 'call buttons');
    frameClick(d.querySelector('[data-pf="open"]')); frameClick(d.querySelector('[data-act="new-po"]'));
    var f = d.querySelector('dialog form'); f.elements.product.value = 'p9'; f.elements.customer.value = 'Dee D.'; f.elements.contact.value = '215-555-0155'; f.elements.qty.value = '2'; f.elements.deposit.value = '10';
    f.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    ok(w.MG.data.preorders.some(function (o) { return o.customer === 'Dee D.' && o.status === 'waiting'; }), 'added');
  });
  pageTest('the front page still loads and shows this week', 'index.html?' + N, function (w, d) {
    ok(d.querySelectorAll('.ev, .day-line').length > 10, 'cards and compact rows'); ok(d.querySelectorAll('.daycard').length === 7, 'deck');
  });
  T.async('(clean up) put the demo data back the way it was', function () {
    try { if (SAVE == null) localStorage.removeItem('mg-demo-v1'); else localStorage.setItem('mg-demo-v1', SAVE); } catch (err) { /* ignore */ }
  });
})();
