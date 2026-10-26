/* Mulligan Games concept: HTML for the public events page (event detail, sign-up form, collapsed weekly card).
 * Every function returns a string built with MG.esc() or, where it edits an MG.eventCard, uses textContent.
 * Tests call these with hostile text to check it comes out as text (tests-ui.js).
 */
(function () {
  'use strict';
  var MG = window.MG, R = MG.rules, e = MG.esc;
  var V = MG.views = MG.views || {};

  function statBox(big, unit, small, icon) {
    return '<p class="ev-stat">' + MG.icon(icon) + '<span class="ev-stat-big">' + e(big) + '</span>' +
      (unit ? '<span class="ev-stat-unit">' + e(unit) + '</span>' : '') + (small ? '<span class="ev-stat-small">' + e(small) + '</span>' : '') + '</p>';
  }
  V.timeLine = function (occ) {
    var s = occ.series, line = MG.fmtTime(occ.start) + (s.end ? ' to ' + MG.fmtTime(MG.fmtEnd(occ)) : '');
    if (s.doors) line = 'Doors ' + MG.fmtTime(s.doors) + ', starts ' + MG.fmtTime(occ.start) + (s.end ? ', until ' + MG.fmtTime(MG.fmtEnd(occ)) : '');
    return line;
  };
  V.when = function (occ) { // "Friday, October 30 at 7 PM"
    return MG.fmtLongDate(MG.parseYmd(occ.date)) + ' at ' + MG.fmtTime(occ.start);
  };
  V.priceLine = function (s) { return s.fee === 0 ? 'Free.' : s.fee == null ? '' : 'Pay $' + s.fee + ' at the store when you arrive.'; };

  /* The card's one action, as in MG.eventCard, but the sign-up opens the dialog instead of going to the detail. */
  V.action = function (occ, st) {
    var s = occ.series, tool = s.tool || {}, ext = '<span class="vh"> (opens ' + e(tool.name || 'another site') + ')</span>' + MG.icon('external', 'ic-ext'), act = '', stat = '';
    switch (st.state) {
      case 'open': case 'few': case 'needs':
        act = '<button type="button" class="btn btn-act" data-signup="' + e(occ.key) + '">Sign up</button>';
        stat = st.state === 'needs' ? statBox(st.taken, 'signed up', 'needs ' + st.min + ' to run', 'users')
          : st.cap ? statBox(st.left, st.left === 1 ? 'seat left' : 'seats left', st.state === 'few' ? 'almost full' : 'of ' + st.cap, st.state === 'few' ? 'alert' : 'seat')
          : statBox(st.taken, 'signed up', '', 'users');
        break;
      case 'waitlist':
        act = '<button type="button" class="btn btn-2" data-signup="' + e(occ.key) + '">Join the waitlist</button>';
        stat = statBox('Full', '', st.waiting ? st.waiting + ' waiting' : 'waitlist open', 'hourglass'); break;
      case 'full': act = '<p class="ev-how">Full. Ask at the counter about open seats.</p>'; stat = statBox('Full', '', '', 'lock'); break;
      case 'closed':
        act = '<p class="ev-how">Sign-ups closed. Walk in if seats are left.</p>';
        stat = st.cap ? statBox(st.left, st.left === 1 ? 'seat left' : 'seats left', 'of ' + st.cap, 'seat') : ''; break;
      case 'walkin': act = '<p class="ev-how">' + MG.icon('door') + 'Just show up. No sign-up needed.</p>'; break;
      case 'counter':
        act = '<p class="ev-how">' + MG.icon('door') + 'Pre-register at the counter.</p><a class="btn btn-2" href="' + e(MG.data.store.phoneHref) + '">' + MG.icon('phone') + 'Call the shop</a>'; break;
      case 'external':
        act = tool.url ? '<a class="btn btn-act" href="' + e(MG.safeUrl(tool.url)) + '" target="_blank" rel="noopener">' + e(tool.cta || 'Sign up on ' + tool.name) + ext + '</a>' : '<p class="ev-how">Sign up on ' + e(tool.name || 'the other site') + '.</p>';
        if (st.count) stat = statBox(st.count, 'registered', 'on ' + tool.name, 'users');
        if (s.inviteOnly) act = '<p class="ev-how">' + MG.icon('lock') + 'Invite only. Seats come from the Championship Series.</p>';
        break;
    }
    return (act || stat) ? '<div class="ev-foot">' + act + stat + '</div>' : '';
  };

  /* ---------- event detail (DESIGN.md section 7) ---------- */
  V.detail = function (occ, now) {
    var s = occ.series, st = MG.seatState(occ, now), tool = s.tool || {}, d = MG.parseYmd(occ.date);
    var tags = '';
    if (st.onNow) tags += '<span class="tag tag-now"><span class="dot" aria-hidden="true"></span>On now</span>';
    if (s.kidsWelcome) tags += '<span class="tag">' + MG.icon('kid') + 'Kids welcome</span>';
    if (s.inviteOnly) tags += '<span class="tag">' + MG.icon('lock') + 'Invite only</span>';
    var rows = '';
    function row(k, v) { if (v) rows += '<div><dt>' + e(k) + '</dt><dd>' + v + '</dd></div>'; }
    row('Prizes', s.prize && e(s.prize));
    row('Bring', s.bring && e(s.bring));
    row('About', s.description && e(s.description));
    row('Kids', s.kidsWelcome && 'Welcome');
    if (s.warhammer) {
      var w = s.warhammer, bits = [];
      if (w.points) bits.push(w.points + ' points');
      if (w.roundMins) bits.push(w.roundMins + ' minute rounds');
      if (w.listDeadline) bits.push('lists due ' + w.listDeadline);
      row('Warhammer', bits.length && e(bits.join(', ')));
    }
    if (tool.name && tool.name !== 'another site') {
      var link = tool.url ? '<a href="' + e(MG.safeUrl(tool.url)) + '" target="_blank" rel="noopener">' + e(tool.name) + '<span class="vh"> (opens ' + e(tool.name) + ')</span>' + MG.icon('external', 'ic-ext') + '</a>' : e(tool.name);
      var code = tool.code ? ' Event code: <strong class="code">' + e(tool.code) + '</strong> <button type="button" class="btn btn-2 btn-sm" data-copy="' + e(tool.code) + '">' + MG.icon('copy') + 'Copy<span class="vh"> the event code</span></button>' : '';
      row('Official tool', link + code);
    }
    var others = MG.occurrences(s, MG.ymd(now), MG.ymd(MG.addDays(now, 120))).filter(function (o) { return o.key !== occ.key && o.endAt > now; }).slice(0, 6);
    if (others.length) row('Other dates', '<ul class="det-dates">' + others.map(function (o) {
      var od = MG.parseYmd(o.date);
      return '<li><a href="events.html#e-' + e(encodeURIComponent(o.key)) + '"' + (o.cancelled ? ' class="struck"' : '') + '>' + e(MG.dayShort(od) + ' ' + MG.fmtDate(od)) +
        (o.series.recurrence.type === 'dates' ? ', ' + e(MG.fmtTime(o.start)) : '') + '</a>' + (o.cancelled ? ' <span class="tag tag-bad">cancelled</span>' : '') + '</li>';
    }).join('') + '</ul>');
    return '<article class="det ev" data-game="' + e(s.game) + '" data-state="' + st.state + '" aria-labelledby="det-title">' +
      '<div class="ev-bar"><h3 class="ev-title" id="det-title">' + e(s.title) + '</h3><p class="ev-cost"><span class="vh">Entry: </span>' + MG.fmtFee(s.fee) + '</p></div>' +
      '<p class="ev-type">' + MG.gameBadge(s.game) + '<span class="ev-fmt">' + e(s.format) + '</span></p>' +
      '<div class="ev-text"><p class="det-day">' + e(MG.fmtLongDate(d)) + '</p><p class="ev-when">' + MG.icon('clock') + '<span>' + e(V.timeLine(occ)) + '</span>' + tags + '</p>' +
        (occ.note && !occ.cancelled ? '<p class="ev-note"><span class="tag tag-upd">' + MG.icon('pencil') + 'Updated</span> ' + e(occ.note) + '</p>' : '') +
        (occ.cancelled ? '<p class="ev-note">' + e(occ.note || 'This date is cancelled.') + '</p>' : '') + '</div>' +
      (occ.cancelled ? '<p class="ev-stamp det-stamp">' + MG.icon('cancel') + 'Cancelled</p>' : V.action(occ, st)) +
      (rows ? '<dl class="det-list">' + rows + '</dl>' : '') +
      '<p class="det-acts"><button type="button" class="btn btn-2" data-ics-one="' + e(occ.key) + '">' + MG.icon('calendar') + 'Add to calendar</button>' +
      '<a class="btn btn-2" href="' + e(MG.data.store.mapsUrl) + '" target="_blank" rel="noopener">' + MG.icon('pin') + 'Directions<span class="vh"> (opens Google Maps)</span></a></p>' +
      '<p class="det-where">445 York Rd, Warminster. ' + e(MG.data.store.parking) + '</p></article>';
  };

  /* ---------- sign-up form (DESIGN.md section 8) ---------- */
  V.signupForm = function (occ, st) {
    var s = occ.series, idLabel = R.playerIdLabel(s.tool), wait = st.state === 'waitlist';
    var price = V.priceLine(s);
    return '<form class="su" novalidate data-key="' + e(occ.key) + '" data-expected="' + (wait ? 'waitlist' : 'in') + '">' +
      '<p class="su-for"><strong>' + e(s.title) + '</strong><br>' + e(V.when(occ)) + '</p>' +
      '<p class="su-err" role="alert" hidden></p>' +
      '<label class="fld"><span>Your name</span><input name="name" type="text" autocomplete="name" required aria-describedby="e-name"><em class="err" id="e-name" hidden></em></label>' +
      '<label class="fld"><span>Email</span><input name="email" type="email" autocomplete="email" aria-describedby="h-contact e-email"><em class="err" id="e-email" hidden></em></label>' +
      '<label class="fld"><span>Phone</span><input name="phone" type="tel" autocomplete="tel" aria-describedby="h-contact e-phone"><em class="err" id="e-phone" hidden></em></label>' +
      '<p class="hint" id="h-contact">One is enough. We only use it about this event.</p>' +
      (idLabel ? '<label class="fld"><span>' + e(idLabel) + ' <small>(optional)</small></span><input name="playerId" type="text" inputmode="numeric" autocomplete="off"></label>' : '') +
      '<div class="hp" aria-hidden="true"><label>Website<input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>' +
      '<p class="su-pay">' + e(price) + (wait ? ' The event is full. Join the waitlist and you move in automatically if a seat opens.' : '') + '</p>' +
      '<button type="submit" class="btn btn-act su-go"><span class="spin" aria-hidden="true" hidden></span><span class="su-go-t">' + (wait ? 'Join the waitlist' : 'Hold my seat') + '</span></button>' +
      '<p class="hint">We delete your contact details 30 days after the event.</p></form>';
  };
  V.signupDone = function (occ, res) {
    var s = occ.series, price = s.fee === 0 ? 'It’s free.' : 'Pay $' + s.fee + ' at the counter.';
    if (res.status === 'in') {
      return '<div class="su-done" role="status" tabindex="-1"><p class="su-big">You’re in.</p><p>' + (occ.series.capacity || MG.capOf(occ) ? 'Seat ' + e(res.seat) + ' of ' + e(MG.capOf(occ)) + ' is yours for ' : 'You’re signed up for ') +
        e(s.title) + ', ' + e(MG.fmtDate(MG.parseYmd(occ.date))) + ' at ' + e(MG.fmtTime(occ.start)) + '. ' + e(price) + '</p>' + V.doneActs(occ) + '</div>';
    }
    return '<div class="su-done" role="status" tabindex="-1"><p class="su-big">' + (res.raced ? 'That seat just went. ' : '') + 'You’re on the waitlist (#' + e(res.position) + ').</p>' +
      '<p>If a seat opens, you move in automatically. Check this page or ask at the counter.</p>' + V.doneActs(occ) + '</div>';
  };
  V.doneActs = function (occ) {
    return '<p class="det-acts"><button type="button" class="btn btn-2" data-ics-one="' + e(occ.key) + '">' + MG.icon('calendar') + 'Add to calendar</button>' +
      '<button type="button" class="btn btn-act" data-close>Done</button></p>';
  };

  /* ---------- a repeating series as one card: "Every Friday, 7 PM to 11 PM" + "Next: Fri Oct 30" ---------- */
  V.weeklyCard = function (s, now, from, to) {
    var occs = MG.occurrences(s, from, to).filter(function (o) { return o.endAt > now; });
    if (!occs.length) return '';
    var first = occs[0], shown = first.cancelled ? (occs.filter(function (o) { return !o.cancelled; })[0] || first) : first;
    var tpl = document.createElement('template');
    tpl.innerHTML = MG.eventCard(shown, now, { href: 'events.html' });
    var when = tpl.content.querySelector('.ev-when'), span = when && when.querySelector('span');
    if (span) span.textContent = 'Every ' + R.DAYS[s.recurrence.day] + ', ' + MG.fmtTime(s.start) + (s.end ? ' to ' + MG.fmtTime(s.end) : '');
    if (when) {
      var d = MG.parseYmd(shown.date), p = document.createElement('p');
      p.className = 'ev-next';
      var t = 'Next: ' + MG.dayShort(d) + ' ' + MG.fmtDate(d) + '.';
      if (first.cancelled && shown !== first) t += ' ' + MG.fmtDate(MG.parseYmd(first.date)) + ' is cancelled.';
      if (shown.cancelled) t = 'Next: ' + MG.dayShort(d) + ' ' + MG.fmtDate(d) + ' is cancelled.';
      p.textContent = t;
      when.insertAdjacentElement('afterend', p);
    }
    return tpl.innerHTML;
  };
})();
