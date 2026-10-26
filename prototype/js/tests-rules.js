/* Tests for the rules in rules.js, stock.js and actions.js. Loaded by tests.html (see js/tests-lib.js for test/eq/ok). */
(function () {
  'use strict';
  var MG = window.MG, R = MG.rules, S = MG.stock, A = MG.act, D = MG.data, T = window.T;
  var test = T.test, eq = T.eq, ok = T.ok;

  /* ---------- helpers ---------- */
  var KEY = { series: 'x', date: '2026-10-30', start: '19:00' };
  var n = 0;
  function ctx(over) {
    n++;
    return Object.assign({ cap: 2, waitlist: true, now: new Date(2026, 9, 28, 16, 0), cutoffAt: new Date(2026, 9, 30, 19, 0), id: 'r' + n, createdAt: '2026-10-28T16:' + (10 + n) + ':00' }, over || {});
  }
  function form(name, extra) { return Object.assign({ name: name, email: name.toLowerCase().replace(/\W/g, '') + '@example.com' }, extra || {}); }
  function names(list) { return list.map(function (r) { return r.name; }).join(','); }
  function freshWorld() { MG.state.reset(); MG.now = function () { return new Date(2026, 9, 28, 16, 0); }; }

  /* ================= capacity and waitlist ================= */
  T.section('Capacity, waitlist, promotion');

  test('last seat: the cap-th person is in, the next is waitlisted #1', function () {
    var all = [];
    var a = R.signUp(all, KEY, form('Ann'), ctx());
    var b = R.signUp(all, KEY, form('Bob'), ctx());
    var c = R.signUp(all, KEY, form('Cat'), ctx());
    eq(a.status, 'in'); eq(a.seat, 1);
    eq(b.status, 'in'); eq(b.seat, 2);
    eq(c.status, 'waitlist'); eq(c.position, 1);
    eq(R.seatsLeft(2, R.group(all, KEY)), 0);
  });

  test('waitlist numbers go #1, #2, #3 in sign-up order', function () {
    var all = [];
    ['A', 'B', 'C', 'D', 'E'].forEach(function (x) { R.signUp(all, KEY, form('Name' + x), ctx()); });
    var wl = R.waitlistOf(R.group(all, KEY));
    eq(names(wl), 'NameC,NameD,NameE');
    eq(wl.map(function (r) { return r.waitlistPos; }).join(), '1,2,3');
  });

  test('full with the waitlist off refuses the sign-up and stores nothing', function () {
    var all = [];
    R.signUp(all, KEY, form('Ann'), ctx({ waitlist: false }));
    R.signUp(all, KEY, form('Bob'), ctx({ waitlist: false }));
    var r = R.signUp(all, KEY, form('Cat'), ctx({ waitlist: false }));
    eq(r.ok, false); eq(r.error, 'full'); eq(all.length, 2);
  });

  test('no cap means no limit and never a waitlist', function () {
    var all = [];
    for (var i = 0; i < 40; i++) eq(R.signUp(all, KEY, form('P' + i), ctx({ cap: null })).status, 'in');
    eq(R.seatsLeft(null, R.group(all, KEY)), null);
  });

  test('double sign-up: same name, same email and same phone are all refused', function () {
    var all = [];
    R.signUp(all, KEY, { name: 'Sam B.', email: 'sam@example.com', phone: '(215) 555-0142' }, ctx());
    var byName = R.signUp(all, KEY, { name: ' sam   b. ', email: 'other@example.com' }, ctx());
    var byMail = R.signUp(all, KEY, { name: 'Samuel', email: 'SAM@example.com' }, ctx());
    var byPhone = R.signUp(all, KEY, { name: 'Samantha', phone: '215-555-0142' }, ctx());
    [byName, byMail, byPhone].forEach(function (r) { eq(r.ok, false); eq(r.error, 'dup'); });
    ok(byName.message.indexOf('Sam B.') !== -1, 'the message names the existing sign-up');
    eq(all.length, 1);
  });

  test('a cancelled sign-up does not block signing up again', function () {
    var all = [], a = R.signUp(all, KEY, form('Ann'), ctx());
    R.cancelReg(all, KEY, a.reg.id, 2);
    eq(R.signUp(all, KEY, form('Ann'), ctx()).ok, true);
  });

  test('cancel promotes the first person on the waitlist, and the rest move up', function () {
    var all = [], a = R.signUp(all, KEY, form('Ann'), ctx());
    R.signUp(all, KEY, form('Bob'), ctx());
    var c = R.signUp(all, KEY, form('Cat'), ctx()), d = R.signUp(all, KEY, form('Dan'), ctx());
    var r = R.cancelReg(all, KEY, a.reg.id, 2);
    eq(r.ok, true); eq(names(r.promoted), 'Cat');
    eq(c.reg.status, 'in'); eq(d.reg.status, 'waitlist'); eq(d.reg.waitlistPos, 1);
    eq(R.counts(R.group(all, KEY)).in, 2);
  });

  test('two seats free up: two people move in, in order', function () {
    var all = [], a = R.signUp(all, KEY, form('Ann'), ctx({ cap: 4 })), b = R.signUp(all, KEY, form('Bob'), ctx({ cap: 4 }));
    R.signUp(all, KEY, form('Cat'), ctx({ cap: 4 })); R.signUp(all, KEY, form('Dan'), ctx({ cap: 4 }));
    var e = R.signUp(all, KEY, form('Eve'), ctx({ cap: 4 })), f = R.signUp(all, KEY, form('Fay'), ctx({ cap: 4 })), g = R.signUp(all, KEY, form('Gus'), ctx({ cap: 4 }));
    eq(e.position, 1); eq(g.position, 3);
    R.cancelReg(all, KEY, a.reg.id, 4);
    var r2 = R.cancelReg(all, KEY, b.reg.id, 4);
    eq(names(r2.promoted), 'Fay');
    eq(e.reg.status, 'in'); eq(f.reg.status, 'in'); eq(g.reg.status, 'waitlist'); eq(g.reg.waitlistPos, 1);
  });

  test('cancelling someone on the waitlist promotes nobody and renumbers', function () {
    var all = [];
    R.signUp(all, KEY, form('Ann'), ctx()); R.signUp(all, KEY, form('Bob'), ctx());
    var c = R.signUp(all, KEY, form('Cat'), ctx()), d = R.signUp(all, KEY, form('Dan'), ctx());
    var r = R.cancelReg(all, KEY, c.reg.id, 2);
    eq(r.promoted.length, 0); eq(d.reg.waitlistPos, 1); eq(R.counts(R.group(all, KEY)).in, 2);
  });

  test('cancel after check-in frees the seat, clears the check-in and says a refund is due', function () {
    var all = [], a = R.signUp(all, KEY, form('Ann'), ctx());
    R.signUp(all, KEY, form('Bob'), ctx());
    var c = R.signUp(all, KEY, form('Cat'), ctx());
    R.checkIn(a.reg, true); R.setPayment(a.reg, 'door');
    var r = R.cancelReg(all, KEY, a.reg.id, 2);
    eq(a.reg.checkedIn, false); eq(r.refundDue, true); eq(c.reg.status, 'in');
    // comped people are not owed anything
    var all2 = [], p = R.signUp(all2, KEY, form('Pat'), ctx()); R.setPayment(p.reg, 'comped');
    eq(R.cancelReg(all2, KEY, p.reg.id, 2).refundDue, false);
  });

  test('seating someone over the cap stops auto-promotion until the room is under the cap again', function () {
    var all = [], a = R.signUp(all, KEY, form('Ann'), ctx()), b = R.signUp(all, KEY, form('Bob'), ctx());
    var c = R.signUp(all, KEY, form('Cat'), ctx()), d = R.signUp(all, KEY, form('Dan'), ctx());
    var m = R.moveIn(all, KEY, c.reg.id, 2);     // staff override: 3 of 2
    eq(m.over, true);
    var r = R.cancelReg(all, KEY, a.reg.id, 2);  // back to 2 of 2: no seat for Dan
    eq(r.promoted.length, 0); eq(d.reg.status, 'waitlist');
    var r2 = R.cancelReg(all, KEY, b.reg.id, 2); // 1 of 2: Dan gets in
    eq(names(r2.promoted), 'Dan');
  });

  test('a bigger cap (or a cap removed) moves people in off the waitlist', function () {
    var all = [];
    R.signUp(all, KEY, form('Ann'), ctx()); R.signUp(all, KEY, form('Bob'), ctx());
    var c = R.signUp(all, KEY, form('Cat'), ctx()), d = R.signUp(all, KEY, form('Dan'), ctx());
    eq(names(R.afterCapacityChange(all, KEY, 3)), 'Cat');
    eq(d.reg.waitlistPos, 1);
    eq(names(R.afterCapacityChange(all, KEY, null)), 'Dan');
    eq(c.reg.status, 'in');
  });

  test('staff can move people up and down the waitlist', function () {
    var all = [];
    R.signUp(all, KEY, form('Ann'), ctx({ cap: 1 }));
    var b = R.signUp(all, KEY, form('Bob'), ctx({ cap: 1 })), c = R.signUp(all, KEY, form('Cat'), ctx({ cap: 1 })), d = R.signUp(all, KEY, form('Dan'), ctx({ cap: 1 }));
    eq(R.moveWaitlist(all, KEY, d.reg.id, -1).position, 2);
    eq(names(R.waitlistOf(R.group(all, KEY))), 'Bob,Dan,Cat');
    eq(R.moveWaitlist(all, KEY, b.reg.id, -1).ok, false, 'already first');
    eq(R.moveWaitlist(all, KEY, c.reg.id, 1).ok, false, 'already last');
  });

  test('sign-ups close at the start, or N hours before; closed sign-ups store nothing', function () {
    var all = [], s = { cutoffHours: 2 }, start = new Date(2026, 9, 30, 19, 0);
    var occ = { series: s, startAt: start };
    eq(MG.cutoffAt(occ).getHours(), 17);
    eq(MG.cutoffAt({ series: {}, startAt: start }).getHours(), 19);
    var r = R.signUp(all, KEY, form('Late'), ctx({ now: new Date(2026, 9, 30, 19, 0), cutoffAt: start }));
    eq(r.ok, false); eq(r.error, 'closed'); eq(r.message, 'Sign-ups closed at 7 PM. Walk in if seats are left.'); eq(all.length, 0);
    eq(R.signUp(all, KEY, form('Early'), ctx({ now: new Date(2026, 9, 30, 18, 59), cutoffAt: start })).ok, true);
  });

  test('last-seat race: the person was shown an open seat, it went, so they are waitlisted and told', function () {
    var all = [];
    R.signUp(all, KEY, form('Ann'), ctx()); R.signUp(all, KEY, form('Bob'), ctx());
    var r = R.signUp(all, KEY, form('Cat'), ctx({ expected: 'in' }));
    eq(r.status, 'waitlist'); eq(r.raced, true); eq(r.position, 1);
    eq(R.signUp(all, KEY, form('Dan'), ctx({ expected: 'waitlist' })).raced, false);
  });

  test('the honeypot field turns a sign-up into a silent no-op', function () {
    var all = [], r = R.signUp(all, KEY, form('Bot', { website: 'http://spam.example' }), ctx());
    eq(r.bot, true); eq(all.length, 0);
  });

  test('a sign-up needs a name and an email or a phone, and they must look right', function () {
    eq(R.validateSignup({ name: '', email: 'a@b.co' }).name, 'Enter your name so we can find you at the counter.');
    eq(R.validateSignup({ name: 'A' }).email, 'Add an email or a phone number.');
    ok(R.validateSignup({ name: 'A', email: 'nope' }).email, 'bad email');
    ok(R.validateSignup({ name: 'A', phone: '12' }).phone, 'short phone');
    eq(Object.keys(R.validateSignup({ name: 'A', phone: '(215) 555-0100' })).length, 0);
    eq(Object.keys(R.validateSignup({ name: 'A', email: 'a@b.co' })).length, 0);
  });

  test('registrations of two slots on one date stay apart', function () {
    var all = [], k1 = { series: 'x', date: '2026-11-08', start: '15:00' }, k2 = { series: 'x', date: '2026-11-08', start: '17:00' };
    R.signUp(all, k1, form('Ann'), ctx({ cap: 1 }));
    eq(R.signUp(all, k2, form('Bob'), ctx({ cap: 1 })).status, 'in', 'other slot has its own seat');
    eq(R.group(all, k1).length, 1);
  });

  test('walk-ins: checked in and paid at the door; full offers waitlist or seat-anyway; duplicates are caught', function () {
    var all = [];
    R.signUp(all, KEY, form('Ann'), ctx({ cap: 1 }));
    var full = R.addWalkIn(all, KEY, 'Walt', { cap: 1, id: 'w1', createdAt: 'x' });
    eq(full.ok, false); eq(full.full, true); eq(all.length, 1);
    var wl = R.addWalkIn(all, KEY, 'Walt', { cap: 1, mode: 'waitlist', id: 'w1', createdAt: 'x' });
    eq(wl.status, 'waitlist'); eq(wl.position, 1);
    var over = R.addWalkIn(all, KEY, 'Wendy', { cap: 1, mode: 'over', id: 'w2', createdAt: 'x' });
    eq(over.status, 'in'); eq(over.over, true); eq(over.reg.checkedIn, true); eq(over.reg.payment, 'door');
    eq(R.counts(R.group(all, KEY)).in, 2);
    eq(R.addWalkIn(all, KEY, 'ann', { cap: 5, id: 'w3', createdAt: 'x' }).error, 'dup');
    eq(R.addWalkIn(all, KEY, '   ', { cap: 5, id: 'w3', createdAt: 'x' }).error, 'name');
  });

  test('counts: checked in and paid only count people who have a seat', function () {
    var all = [], a = R.signUp(all, KEY, form('Ann'), ctx({ cap: 5 })), b = R.signUp(all, KEY, form('Bob'), ctx({ cap: 5 }));
    R.checkIn(a.reg, true); R.setPayment(a.reg, 'door'); R.setPayment(b.reg, 'comped');
    var w = R.signUp(all, KEY, form('Wait'), ctx({ cap: 2 }));
    eq(R.checkIn(w.reg, true), false, 'waitlisted people cannot be checked in');
    var c = R.counts(R.group(all, KEY));
    eq(c.in, 2); eq(c.waitlist, 1); eq(c.checkedIn, 1); eq(c.paid, 2);
    eq(R.setPayment(a.reg, 'bitcoin'), false);
  });

  T.section('Minimum to run');
  test('below the minimum the event needs players; at the minimum it runs', function () {
    var m = R.minToRun(5, 8);
    eq(m.ok, false); eq(m.short, 3);
    eq(R.minToRun(8, 8).ok, true); eq(R.minToRun(8, 8).short, 0);
    eq(R.minToRun(0, null).ok, true, 'no minimum set');
  });
  test('seatState shows "needs players" below the minimum, "few seats" near the cap and a waitlist when full', function () {
    freshWorld();
    var now = MG.now(), s = A.seriesById('standard-rcq');
    var rcq = MG.occurrences(s, '2026-11-15', '2026-11-15')[0];
    eq(MG.seatState(rcq, now).state, 'needs');
    var sat = MG.occurrences(A.seriesById('sat-draft'), '2026-10-31', '2026-10-31')[0];
    eq(MG.seatState(sat, now).state, 'few');
    var fnm = MG.occurrences(A.seriesById('fnm-draft'), '2026-10-30', '2026-10-30')[0];
    eq(MG.seatState(fnm, now).state, 'waitlist');
    eq(MG.seatState(fnm, new Date(2026, 9, 30, 19, 30)).state, 'closed');
  });

  /* ================= series, recurrence, exceptions ================= */
  T.section('Recurrence and one-date exceptions');

  test('a repeating series honours its first date and last date', function () {
    var s = { id: 't', title: 'T', recurrence: { type: 'weekly', day: 5, startDate: '2026-10-30', until: '2026-11-13' }, start: '19:00', end: '22:00' };
    eq(MG.occurrences(s, '2026-10-01', '2026-12-31').map(function (o) { return o.date; }).join(), '2026-10-30,2026-11-06,2026-11-13');
  });
  test('Nth weekday: 5th Friday skips months without one; last Friday always exists', function () {
    var fifth = { id: 'f', title: 'F', recurrence: { type: 'nth', nth: 5, day: 5 }, start: '19:00' };
    eq(MG.occurrences(fifth, '2026-01-01', '2026-12-31').map(function (o) { return o.date; }).join(), '2026-01-30,2026-05-29,2026-07-31,2026-10-30');
    var last = { id: 'l', title: 'L', recurrence: { type: 'nth', nth: -1, day: 5 }, start: '19:00' };
    eq(MG.occurrences(last, '2026-10-01', '2026-12-31').map(function (o) { return o.date; }).join(), '2026-10-30,2026-11-27,2026-12-25');
  });
  test('start time stays put across the daylight-saving change (Nov 1, 2026)', function () {
    var s = { id: 'd', title: 'D', recurrence: { type: 'weekly', day: 0 }, start: '14:00', end: '20:00' };
    MG.occurrences(s, '2026-10-25', '2026-11-08').forEach(function (o) { eq(o.startAt.getHours(), 14, o.date); eq(o.endAt.getHours(), 20, o.date); });
  });
  test('a late end rolls past midnight', function () {
    var s = { id: 'm', title: 'M', recurrence: { type: 'none', date: '2026-10-30' }, start: '22:00', end: '01:00' };
    var o = MG.occurrences(s, '2026-10-30', '2026-10-30')[0];
    eq(MG.ymd(o.endAt), '2026-10-31');
  });
  test('words: repeat summaries match DESIGN.md', function () {
    freshWorld();
    eq(R.recurrenceSummary(A.seriesById('pauper')), 'Every Wednesday, 7 PM');
    eq(R.recurrenceSummary(A.seriesById('cedh-mcs')), '1st Sunday of the month, 10 AM');
    eq(R.recurrenceSummary(A.seriesById('startrek-prerelease')), '3 dates: Nov 6, 8, 8');
    eq(R.recurrenceSummary(A.seriesById('chaos-draft-oct30')), 'Friday Oct 30, 6 PM');
    eq(R.recurrenceSentence({ recurrence: { type: 'weekly', day: 5, startDate: '2026-10-30' }, start: '19:00' }), 'Every Friday at 7 PM, starting Oct 30.');
    eq(R.recurrenceSentence({ recurrence: { type: 'nth', nth: -1, day: 5, until: '2027-03-26' }, start: '19:00' }), 'The last Friday of every month at 7 PM, until Mar 26.');
  });
  test('cancel one date, change one date, bring it back: the series is untouched', function () {
    freshWorld();
    var s = A.seriesById('pauper'), copy = JSON.stringify(s);
    var r = A.cancelDate('pauper', '2026-11-04', 'Closed for inventory.');
    eq(MG.occurrences(s, '2026-11-04', '2026-11-04')[0].cancelled, true);
    eq(MG.occurrences(s, '2026-10-28', '2026-10-28')[0].cancelled, false, 'other dates stay on');
    A.undo(r.before);
    eq(MG.occurrences(s, '2026-11-04', '2026-11-04')[0].cancelled, false, 'undo');
    A.cancelDate('pauper', '2026-11-04'); A.restoreDate('pauper', '2026-11-04');
    eq(MG.occurrences(s, '2026-11-04', '2026-11-04')[0].cancelled, false, 'bring it back');
    eq(D.exceptions.filter(function (e) { return e.series === 'pauper'; }).length, 0, 'no leftover exception');
    A.changeDate('pauper', '2026-11-04', { start: '19:30', note: 'Starts at 7:30.' });
    var o = MG.occurrences(s, '2026-11-04', '2026-11-04')[0];
    eq(o.start, '19:30'); eq(o.note, 'Starts at 7:30.');
    eq(JSON.stringify(s), copy, 'series unchanged');
  });
  test('a date can have its own seat count; more seats there fills from the waitlist', function () {
    freshWorld();
    var before = R.counts(A.regs(A.occByKey('fnm-draft@2026-10-30')));
    eq(before.in, 28); eq(before.waitlist, 3);
    var r = A.changeDate('fnm-draft', '2026-10-30', { capacity: 30 });
    eq(r.promoted.length, 2);
    var occ = A.occByKey('fnm-draft@2026-10-30'), c = R.counts(A.regs(occ));
    eq(MG.capOf(occ), 30); eq(c.in, 30); eq(c.waitlist, 1);
    eq(MG.capOf(A.occByKey('fnm-draft@2026-11-06')), 28, 'other dates keep 28');
  });
  test('a change that changes nothing leaves no exception', function () {
    var ex = [];
    R.setException(ex, 's', '2026-10-30', { type: 'change', start: null, note: '' }, '2026-10-28');
    eq(ex.length, 0);
  });

  T.section('Event form: checks, build, read back');
  function goodForm() {
    return Object.assign(R.formFromTemplate({ fields: window.MG_EXTRA.templates.filter(function (t) { return t.id === 't-draft'; })[0].fields }, '2026-11-13'), {});
  }
  test('the draft template fills fee, seats, times, tool and stock use', function () {
    var f = goodForm();
    eq(f.fee, '20'); eq(f.capacity, '28'); eq(f.start, '19:00'); eq(f.toolName, 'Wizards EventLink'); eq(f.weekday, '5'); eq(f.uses.length, 2);
    eq(f.uses[0].mode, 'perSeat'); eq(f.uses[0].qty, '3');
  });
  test('validation: name, game, date, start, fee, sign-up mode, link for another site', function () {
    var e = R.validateSeries({ repeat: 'none', signup: '' });
    ['title', 'game', 'date', 'start', 'fee', 'signup'].forEach(function (k) { ok(e[k], 'missing ' + k); });
    var f = goodForm(); f.title = ''; f.fee = '-1'; f.capacity = '0'; f.signup = 'external'; f.toolUrl = 'javascript:alert(1)';
    var e2 = R.validateSeries(f);
    ok(e2.title && e2.fee && e2.capacity && e2.toolUrl, 'four errors');
    var g = goodForm(); g.fee = '0'; eq(Object.keys(R.validateSeries(g)).length, 0, 'free is fine');
    var h = goodForm(); h.minPlayers = '40'; ok(R.validateSeries(h).minPlayers, 'minimum over the seats');
    var u = goodForm(); u.until = '2026-01-01'; ok(R.validateSeries(u).until, 'last date before first');
    var d = { repeat: 'dates', dates: [{ date: '', start: '' }], game: 'magic', title: 'x', fee: '1', signup: 'walkin' }; ok(R.validateSeries(d).dates, 'a dates series needs a date');
  });
  test('form to series and back keeps everything', function () {
    var f = goodForm(); f.until = '2027-01-01'; f.kids = true; f.bring = 'Dice'; f.description = 'Hi';
    var built = R.seriesFromForm(f, 'abc'), s = built.series;
    eq(s.recurrence.type, 'weekly'); eq(s.recurrence.day, 5); eq(s.recurrence.startDate, '2026-11-13'); eq(s.recurrence.until, '2027-01-01');
    eq(s.capacity, 28); eq(s.fee, 20); eq(s.waitlist, true); eq(s.tool.name, 'Wizards EventLink'); eq(s.kidsWelcome, true);
    eq(built.uses.length, 2); eq(built.uses[0].perSeat, 3); eq(built.uses[1].fixed, 10);
    var f2 = R.formFromSeries(s, built.uses), s2 = R.seriesFromForm(f2, 'abc').series;
    eq(JSON.stringify(s2), JSON.stringify(s));
  });
  test('saving a new event from a template makes dates that show up, with stock reserved', function () {
    freshWorld();
    var f = goodForm(), r = A.saveSeries(f);
    eq(r.ok, true); ok(A.seriesById(r.id), 'saved');
    eq(r.first.date, '2026-11-13');
    var lines = A.reservationLines('2026-10-28', '2026-11-30').filter(function (l) { return l.series === r.id; });
    eq(lines[0].qty, 84, '3 boosters x 28 seats');
    A.undo(r.before); eq(A.seriesById(r.id), null, 'undo removes it');
  });
  test('saving with bad data returns the errors and changes nothing', function () {
    freshWorld();
    var n0 = D.series.length, f = goodForm(); f.title = ''; var r = A.saveSeries(f);
    eq(r.ok, false); ok(r.errors.title); eq(D.series.length, n0);
  });
  test('a prerelease from the template has three slots and reserves packs', function () {
    freshWorld();
    var tpl = window.MG_EXTRA.templates.filter(function (t) { return t.id === 't-prerelease'; })[0];
    var f = R.formFromTemplate(tpl, '2026-12-04'); f.dates = [{ date: '2026-12-04', start: '19:00' }, { date: '2026-12-06', start: '15:00' }, { date: '2026-12-06', start: '17:00' }];
    var r = A.saveSeries(f);
    eq(r.ok, true);
    var occs = MG.occurrences(r.series, '2026-12-01', '2026-12-31');
    eq(occs.length, 3); eq(occs[1].key.slice(-5), 'T1500');
    var pic = A.stockPicture(60), p2 = A.productById('p2');
    ok(pic.map.p2.total >= 120, 'reserved 3 x 20 for the new one plus the Star Trek ones');
    ok(S.status(p2, pic.map.p2.total).short, 'short against 30 on hand');
  });

  /* ================= .ics ================= */
  T.section('Calendar file (.ics)');
  test('the .ics has the right shape, line endings, times, escapes and cancelled status', function () {
    freshWorld();
    var s = A.seriesById('fnm-draft'), occs = MG.occurrences(s, '2026-10-30', '2026-11-06');
    var cx = A.occByKey('pokemon-sat@2026-10-31');
    var txt = R.ics(occs.concat([cx]), { now: new Date(Date.UTC(2026, 9, 28, 20, 0, 0)), location: 'Mulligan Games, 445 York Rd, Warminster, PA 18974', url: function (o) { return 'https://example.test/events#' + o.key; } });
    ok(txt.indexOf('BEGIN:VCALENDAR\r\n') === 0, 'starts');
    ok(/END:VCALENDAR\r\n$/.test(txt), 'ends with CRLF');
    ok(txt.indexOf('\n') === txt.indexOf('\r\n') + 1, 'CRLF only');
    ok(txt.indexOf('BEGIN:VTIMEZONE') !== -1 && txt.indexOf('TZID:America/New_York') !== -1, 'timezone');
    eq(txt.split('BEGIN:VEVENT').length - 1, 3); eq(txt.split('END:VEVENT').length - 1, 3);
    ok(txt.indexOf('DTSTART;TZID=America/New_York:20261030T190000') !== -1, 'start');
    ok(txt.indexOf('DTEND;TZID=America/New_York:20261030T230000') !== -1, 'end');
    ok(txt.indexOf('DTSTAMP:20261028T200000Z') !== -1, 'stamp is UTC');
    ok(txt.indexOf('UID:fnm-draft@2026-10-30@mulligangames') !== -1, 'uid');
    ok(txt.indexOf('LOCATION:Mulligan Games\\, 445 York Rd\\, Warminster\\, PA 18974') !== -1, 'commas escaped');
    ok(txt.indexOf('STATUS:CANCELLED') !== -1 && txt.indexOf('SUMMARY:Cancelled: Pokemon League Night') !== -1, 'cancelled date');
    txt.split('\r\n').forEach(function (line) { ok(line.length <= 75, 'line over 75: ' + line.slice(0, 30)); });
    var uids = txt.match(/UID:.*/g); eq(uids.length, new Set(uids).size, 'unique uids');
  });
  test('escaping and folding: semicolons, backslashes, newlines, long and non-ASCII lines', function () {
    eq(R.icsEscape('a;b,c\\d\ne'), 'a\\;b\\,c\\\\d\\ne');
    var long = R.icsFold('DESCRIPTION:' + new Array(200).join('word '));
    long.split('\r\n').forEach(function (l, i) { ok(l.length <= 75, 'folded line ' + i); if (i) eq(l.charAt(0), ' '); });
    var wide = R.icsFold('SUMMARY:' + new Array(60).join('éé'));
    wide.split('\r\n').forEach(function (l) { ok(new TextEncoder().encode(l).length <= 75, 'octets'); });
    eq(R.icsName(A.occByKey('fnm-draft@2026-10-30')), 'mulligan-fnm-draft-2026-10-30.ics'); eq(R.icsName(null), 'mulligan-events.ics');
  });
  test('parseKey reads series, date and slot', function () {
    eq(JSON.stringify(R.parseKey('startrek-prerelease@2026-11-08T1500')), JSON.stringify({ series: 'startrek-prerelease', date: '2026-11-08', start: '15:00' }));
    eq(R.parseKey('nonsense'), null);
  });

  /* ================= stock ================= */
  T.section('Stock, reservations, low-stock');
  function prods() { return [{ id: 'a', name: 'A', onHand: 10, low: 4 }, { id: 'b', name: 'B', onHand: 0, low: 0 }]; }

  test('moves change on-hand and never push it below 0', function () {
    var p = prods(), m = [];
    eq(S.applyMove(p, m, { product: 'a', qty: -3, reason: 'sold' }).ok, true); eq(p[0].onHand, 7);
    var bad = S.applyMove(p, m, { product: 'a', qty: -8, reason: 'sold' }); eq(bad.ok, false); eq(bad.onHand, 7); eq(p[0].onHand, 7); eq(m.length, 1);
    eq(S.applyMove(p, m, { product: 'a', qty: 0, reason: 'sold' }).ok, false, 'zero');
    eq(S.applyMove(p, m, { product: 'a', qty: 1.5, reason: 'sold' }).ok, false, 'fraction');
    eq(S.applyMove(p, m, { product: 'zz', qty: 1, reason: 'sold' }).ok, false, 'unknown');
  });
  test('count now: the shelf wins and the difference is a "counted" move; on-hand equals opening + moves', function () {
    var p = prods(), m = [];
    S.applyMove(p, m, { product: 'a', qty: 6, reason: 'received' });
    S.countTo(p, m, 'a', 12, { at: 'x', who: 'y' });
    eq(p[0].onHand, 12); eq(m[1].reason, 'counted'); eq(m[1].qty, -4);
    eq(S.countTo(p, m, 'a', 12, {}).none, true); eq(m.length, 2, 'no move for no change');
    eq(S.countTo(p, m, 'a', -1, {}).ok, false);
    eq(S.onHandFromMoves(10, m, 'a'), p[0].onHand);
  });
  test('reserved: fixed, per seat x cap, seats-per-date guess, then sign-ups; cancelled dates are skipped', function () {
    var ser = { id: 's', title: 'S' };
    var lines = S.reservations([{ series: 's', product: 'a', perSeat: 3 }], [
      { series: ser, key: 'k1', date: 'd1', cap: 28, taken: 5 }, { series: ser, key: 'k2', date: 'd2', cap: null, taken: 7 }, { series: ser, key: 'k3', date: 'd3', cap: 8, taken: 8, cancelled: true }]);
    eq(lines.length, 2); eq(lines[0].qty, 84); eq(lines[1].qty, 21);
    var fixed = S.reservations([{ series: 's', product: 'a', fixed: 10 }], [{ series: ser, key: 'k', date: 'd', cap: 5, taken: 1 }]);
    eq(fixed[0].qty, 10);
    var guess = S.reservations([{ series: 's', product: 'a', perSeat: 1, seatsPerDate: 20 }], [{ series: ser, key: 'k', date: 'd', cap: null, taken: 3 }]);
    eq(guess[0].qty, 20);
    eq(S.reservations([{ series: 's', product: 'a', perSeat: 3 }], [{ series: ser, key: 'k', date: 'd', cap: null, taken: 0 }]).length, 0, 'nothing to reserve');
    eq(S.reservedByProduct(lines).a.total, 105);
  });
  test('low, short and out follow the numbers exactly', function () {
    var p = { onHand: 4, low: 4 };
    eq(S.status(p, 0).low, true, 'at the threshold is low');
    eq(S.status({ onHand: 5, low: 4 }, 0).low, false);
    eq(S.status({ onHand: 3, low: 0 }, 0).low, false, 'low 0 = no alert');
    eq(S.status({ onHand: 10, low: 4 }, 10).short, false, 'reserved equal to on hand is fine');
    eq(S.status({ onHand: 10, low: 4 }, 11).short, true);
    eq(S.status({ onHand: 10, low: 4 }, 11).free, -1);
    eq(S.status({ onHand: 0, low: 0 }, 0).out, true);
  });
  test('the sample shows 3 low products and the draft boosters short for the next 14 days', function () {
    freshWorld();
    var pic = A.stockPicture(14);
    eq(pic.alerts.low.map(function (p) { return p.id; }).sort().join(), 'p13,p14,p8');
    ok(pic.alerts.short.some(function (p) { return p.id === 'p3'; }), 'draft boosters short');
    ok(!pic.alerts.short.some(function (p) { return p.id === 'p10'; }), 'sleeves are fine');
  });
  test('a +/- changes stock at once; going under the low number raises the alert; undo reverses', function () {
    freshWorld();
    var p = A.productById('p10');       // 14 on hand, low at 10
    eq(S.status(p, 0).low, false);
    var r = null; for (var i = 0; i < 4; i++) r = A.adjust('p10', -1);
    eq(p.onHand, 10); eq(S.status(p, 0).low, true, 'at 10 is low');
    A.undo(r.before); eq(A.productById('p10').onHand, 11);
    eq(A.adjust('p8', -1).ok, false, 'cannot go below 0');
  });
  test('reserving boosters for an event takes free stock to short, and cancelling the date frees it', function () {
    freshWorld();
    var before = A.stockPicture(14).map.p3.total;
    A.cancelDate('fnm-draft', '2026-10-30');
    var after = A.stockPicture(14).map.p3.total;
    eq(before - after, 84);
  });
  test('results take event use and prizes out of stock once, even if saved twice', function () {
    freshWorld();
    var occ = A.occByKey('fnm-draft@2026-10-23'), p3 = A.productById('p3').onHand, p4 = A.productById('p4').onHand;
    // sample already has this date's moves (-18 boosters, -24 prizes); saving replaces them
    var data = { headcount: 24, winner: 'Sam B.', top: ['Riley K.'], prizeRows: [{ product: 'p4', qty: 24 }], reported: true, public: false, takeStock: true };
    A.saveResults('fnm-draft@2026-10-23', data);
    var p3a = A.productById('p3').onHand, p4a = A.productById('p4').onHand;
    eq(p3a, p3 + 18 - 72, '24 players x 3 boosters replaces the earlier 18');
    eq(p4a, p4 + 24 - 24 - 10, 'prize 24 replaces 24, plus 10 fixed prize packs used');
    A.saveResults('fnm-draft@2026-10-23', data);
    eq(A.productById('p3').onHand, p3a, 'second save changes nothing'); eq(A.productById('p4').onHand, p4a);
    eq(A.resultFor(occ).reported, true);
    eq(A.unreportedList().length, 0, 'reported, so the reminder is gone');
  });
  test('an event the shop ran with sign-ups but no results is on the "not reported" list', function () {
    freshWorld();
    var list = A.unreportedList();
    eq(list.length, 1); eq(list[0].key, 'fnm-draft@2026-10-23');
  });
  test('headcount counter and walk-in names', function () {
    freshWorld();
    var r = A.headcount('tabletop-wed@2026-10-28', 12); eq(A.headcountOf(A.occByKey('tabletop-wed@2026-10-28')), 12);
    A.undo(r.before); eq(A.headcountOf(A.occByKey('tabletop-wed@2026-10-28')), 0);
    eq(A.headcount('tabletop-wed@2026-10-28', -4).msg, 'Players tonight: 0.');
  });

  T.section('Preorders');
  test('status flow: waiting to arrived to picked up; cancelled can only reopen to waiting', function () {
    ok(S.canMove('waiting', 'arrived')); ok(S.canMove('arrived', 'picked')); ok(S.canMove('picked', 'arrived'));
    ok(!S.canMove('waiting', 'picked'), 'cannot skip arrived'); ok(!S.canMove('cancelled', 'picked')); ok(S.canMove('cancelled', 'waiting'));
  });
  test('picked up takes the qty off the shelf (when there is enough) and undoing it puts it back', function () {
    var p = [{ id: 'a', name: 'A', onHand: 5 }], m = [], o = { product: 'a', qty: 2, customer: 'Zed', status: 'arrived' };
    eq(S.setPreorderStatus(p, m, o, 'picked', {}).ok, true); eq(p[0].onHand, 3); eq(o.status, 'picked');
    S.setPreorderStatus(p, m, o, 'arrived', {}); eq(p[0].onHand, 5);
    var short = [{ id: 'a', name: 'A', onHand: 1 }], o2 = { product: 'a', qty: 2, customer: 'Zed', status: 'arrived' };
    var r = S.setPreorderStatus(short, [], o2, 'picked', {});
    eq(r.ok, true); ok(r.stockNote, 'tells staff stock was not reduced'); eq(short[0].onHand, 1);
    eq(S.setPreorderStatus(p, m, { product: 'a', qty: 1, status: 'waiting' }, 'picked', {}).ok, false);
  });
  test('totals count waiting and arrived orders: qty, customers, deposits', function () {
    var t = S.preorderTotals([{ customer: 'A', qty: 1, deposit: 50, status: 'waiting' }, { customer: 'a', qty: 2, deposit: 100, status: 'arrived' }, { customer: 'B', qty: 4, deposit: 9, status: 'picked' }, { customer: 'C', qty: 1, deposit: 5, status: 'cancelled' }]);
    eq(t.qty, 3); eq(t.customers, 1); eq(t.deposits, 150);
  });
  test('add a preorder (or a new product), check the form, mark all waiting as arrived', function () {
    freshWorld();
    var bad = A.addPreorder({ product: 'p1', customer: '', contact: '', qty: '0', deposit: '-1' });
    eq(bad.ok, false); ok(bad.errors.customer && bad.errors.contact && bad.errors.qty && bad.errors.deposit);
    var n0 = D.products.length, r = A.addPreorder({ product: '__new', newProduct: 'Gundam starter', customer: 'Kit L.', contact: '215-555-0100', qty: '2', deposit: '20' });
    eq(r.ok, true); eq(D.products.length, n0 + 1); eq(r.order.status, 'waiting');
    var k = A.markAllArrived('p1'); eq(k.ok, true); eq(D.preorders.filter(function (o) { return o.product === 'p1'; }).every(function (o) { return o.status === 'arrived'; }), true);
    eq(A.arrivedPreorders().length, 2 + 2, 'two were arrived already (p5), two more from p1');
    A.undo(k.before); eq(A.arrivedPreorders().length, 2);
  });
  test('products: add with opening count, edit, delete takes its preorders and stock use with it', function () {
    freshWorld();
    var bad = A.saveProduct({ name: ' ', low: 1 }); eq(bad.ok, false);
    var r = A.saveProduct({ name: 'Dice set', category: 'accessory', game: '', low: 3, onHand: 8 }); eq(r.product.onHand, 8); eq(D.stockMoves[D.stockMoves.length - 1].note, 'Opening count');
    eq(A.saveProduct({ name: 'Dice set', low: -1 }).ok, false);
    A.saveProduct({ name: 'Dice sets', low: 5 }, r.product.id); eq(A.productById(r.product.id).name, 'Dice sets');
    A.deleteProduct('p1'); eq(D.preorders.filter(function (o) { return o.product === 'p1'; }).length, 0);
  });
  test('demo reset puts the sample back and undo brings the changes back', function () {
    freshWorld();
    A.adjust('p10', -5); ok(MG.state.isChanged());
    var r = A.resetDemo(); eq(A.productById('p10').onHand, 14); eq(MG.state.isChanged(), false);
    A.undo(r.before); eq(A.productById('p10').onHand, 9);
    freshWorld();
  });
})();
