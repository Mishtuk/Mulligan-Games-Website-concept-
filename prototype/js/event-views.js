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
  V.priceLine = function (s) { return !s.fee ? '' : 'Pay $' + s.fee + ' at the counter when you arrive.'; }; // free events: no line (R17)

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
        act = '<p class="ev-how">' + (st.cap && !st.left ? 'Sign-ups closed. All seats are taken.' : 'Sign-ups closed. Walk in if seats are left.') + '</p>';
        stat = !st.cap ? '' : st.left ? statBox(st.left, st.left === 1 ? 'seat left' : 'seats left', 'of ' + st.cap, 'seat') : statBox('Full', '', '', 'lock'); break;
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
      '<a class="btn btn-2" href="' + e(MG.safeUrl(MG.data.store.mapsUrl)) + '" target="_blank" rel="noopener">' + MG.icon('pin') + 'Directions<span class="vh"> (opens Google Maps)</span></a></p>' +
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
  /* the mock personal link (D26): a real one comes from the server in the build */
  V.sampleLink = function (occ) {
    var h = 0, k = String(occ.key); for (var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
    return 'https://mishtuk.github.io/Mulligan-Games-Website-concept-/my/' + h.toString(36) + 'k7Q2x9';
  };
  // returns a div.su-done element; built with createElement + textContent (owner rule, D35)
  V.signupDone = function (occ, res, extra) {
    var s = occ.series, price = V.priceLine(s), link = V.sampleLink(occ), mailed = extra && extra.email;
    function mk(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
    var box = mk('div', 'su-done'); box.setAttribute('role', 'status'); box.tabIndex = -1;
    if (res.status === 'in') {
      box.appendChild(mk('p', 'su-big', 'You’re in.'));
      box.appendChild(mk('p', null, (s.capacity || MG.capOf(occ) ? 'Seat ' + res.seat + ' of ' + MG.capOf(occ) + ' is yours for ' : 'You’re signed up for ') +
        s.title + ', ' + MG.fmtDate(MG.parseYmd(occ.date)) + ' at ' + MG.fmtTime(occ.start) + '.'));
      if (price) box.appendChild(mk('p', null, price));
    } else {
      box.appendChild(mk('p', 'su-big', (res.raced ? 'That seat just went. ' : '') + 'You’re on the waitlist (#' + res.position + ').'));
      box.appendChild(mk('p', null, 'If a seat opens, you move in automatically' + (mailed ? ' and we email you' : '') + '. Use the link below to check your place or cancel.'));
    }
    var keep = mk('div', 'su-link'), p1 = mk('p'), row = mk('p', 'su-link-row'), inp = mk('input'), cp = mk('button', 'btn btn-2');
    p1.appendChild(mk('strong', null, 'Keep this link to cancel or check your place:')); keep.appendChild(p1);
    inp.type = 'text'; inp.readOnly = true; inp.value = link; inp.setAttribute('aria-label', 'Your personal link (a sample in this concept)');
    cp.type = 'button'; cp.setAttribute('data-copy-link', link); cp.insertAdjacentHTML('afterbegin', MG.icon('copy')); // constant SVG
    cp.appendChild(document.createTextNode('Copy')); cp.appendChild(mk('span', 'vh', ' the link'));
    row.appendChild(inp); row.appendChild(cp); keep.appendChild(row);
    if (mailed) keep.appendChild(mk('p', null, 'We emailed it too.'));
    box.appendChild(keep); box.appendChild(V.doneActs(occ));
    return box;
  };
  V.doneActs = function (occ) { // returns a p.det-acts element
    var p = document.createElement('p'), ics = document.createElement('button'), done = document.createElement('button');
    p.className = 'det-acts';
    ics.type = 'button'; ics.className = 'btn btn-2'; ics.setAttribute('data-ics-one', occ.key); ics.insertAdjacentHTML('afterbegin', MG.icon('calendar')); ics.appendChild(document.createTextNode('Add to calendar'));
    done.type = 'button'; done.className = 'btn btn-act'; done.setAttribute('data-close', ''); done.textContent = 'Done';
    p.appendChild(ics); p.appendChild(done); return p;
  };


  /* ---------- one line per event, for the later days of the front page week (R5) ---------- */
  V.seatWords = function (st, s) {
    switch (st.state) {
      case 'open': return st.cap ? st.left + (st.left === 1 ? ' seat left' : ' seats left') : 'Sign up';
      case 'few': return st.left + (st.left === 1 ? ' seat left' : ' seats left') + ', almost full';
      case 'needs': return st.taken + ' signed up, needs ' + st.min + ' to run';
      case 'waitlist': return st.waiting ? 'Full, ' + st.waiting + ' waiting' : 'Full, waitlist open';
      case 'full': return 'Full';
      case 'closed': return 'Sign-ups closed';
      case 'walkin': return 'Walk in';
      case 'counter': return 'Pre-register at the counter';
      case 'cancelled': return 'Cancelled';
      default: return s.inviteOnly ? 'Invite only' : (s.tool && s.tool.cta) || 'Sign up on ' + ((s.tool && s.tool.name) || 'another site');
    }
  };
  // returns an <li>; everything is built with createElement + textContent (owner rule)
  V.compactLine = function (occ, now, base) {
    var s = occ.series, st = MG.seatState(occ, now), g = MG.game(s.game);
    function mk(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
    var li = mk('li', 'day-line'); li.setAttribute('data-game', g.id); li.setAttribute('data-state', st.state);
    var dot = mk('span', 'dl-dot'); dot.setAttribute('aria-hidden', 'true'); li.appendChild(dot);
    li.appendChild(mk('span', 'dl-time', MG.fmtTime(occ.start)));
    var t = mk('span', 'dl-title'), a = mk('a', null, s.title); a.href = (base || 'events.html') + '#e-' + encodeURIComponent(occ.key); t.appendChild(a); li.appendChild(t);
    var bits = [g.short, MG.fmtFee(s.fee), V.seatWords(st, s)];
    li.appendChild(mk('span', 'dl-bits', bits.join(' · ')));
    return li;
  };

  /* ---------- the Tonight block at the top of the events page (R16): every date for one day, in time order ---------- */
  // occs: occurrences of one day. Returns a div.slots (or null when empty). Card ids are dropped because the same
  // dates also appear in the lists below.
  V.todayBlock = function (occs, now, opts) {
    opts = opts || {};
    if (!occs.length) return null;
    var list = occs.slice().sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : a.series.title.localeCompare(b.series.title); });
    var groups = [], last;
    list.forEach(function (o) { if (last && last.start === o.start) last.items.push(o); else { last = { start: o.start, items: [o] }; groups.push(last); } });
    var wrap = document.createElement('div'); wrap.className = 'slots';
    groups.forEach(function (gr) {
      var slot = document.createElement('div'); slot.className = 'slot'; if (gr.items.length > 1) slot.setAttribute('data-multi', '');
      var p = document.createElement('p'); p.className = 'slot-t'; var tm = document.createElement('time'); tm.textContent = MG.fmtTime(gr.start); p.appendChild(tm);
      if (gr.items.length > 1) { var n = document.createElement('span'); n.className = 'slot-n'; n.textContent = gr.items.length + ' events start at ' + MG.fmtTime(gr.start); p.appendChild(n); }
      slot.appendChild(p);
      var cards = document.createElement('div'); cards.className = 'slot-cards';
      gr.items.forEach(function (o) {
        var tpl = document.createElement('template'); tpl.innerHTML = MG.eventCard(o, now, { href: opts.href || 'events.html' });
        var art = tpl.content.firstElementChild, title = art.querySelector('.ev-title');
        art.removeAttribute('id'); if (title) { title.id = 'tt-' + o.key; art.setAttribute('aria-labelledby', title.id); }
        cards.appendChild(art);
      });
      slot.appendChild(cards); wrap.appendChild(slot);
    });
    return wrap;
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
