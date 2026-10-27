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
      case 'walkin': act = '<p class="ev-how">' + MG.icon('door') + 'Walk in. No sign-up needed.</p>'; break;
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

  /* ---------- event detail (DESIGN.md section 7, round 4 layout) ----------
   * V.detailEl() builds the article with createElement + textContent (owner rule). V.detail() keeps the old string API
   * (tests, previews): it serializes the same article. */
  function mk(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function ic(name, cls) { var s = document.createElement('span'); s.innerHTML = MG.icon(name, cls); return s.firstChild; } // constant SVG, no data
  function withIcon(node, name, cls) { node.insertBefore(ic(name, cls), node.firstChild); return node; }
  function linkOut(href, label, cls) {
    var a = mk('a', cls || null, label); a.href = MG.safeUrl(href); a.target = '_blank'; a.rel = 'noopener';
    return a;
  }
  var PICS = {
    cedh: { src: 'media/video/cedh-monthly-event-poster.webp', w: 720, h: 1280, pos: '50% 70%', alt: 'Players at tables during a Commander night at Mulligan Games' },
    pokemon: { src: 'media/video/sealed-packs-counter-poster.webp', w: 360, h: 640, pos: '50% 50%', alt: 'Sealed Pokemon packs on the counter at Mulligan Games' },
    other: { src: 'img/social/interior-welcome-banner-800.webp', w: 800, h: 600, pos: '50% 40%', alt: 'The Welcome to Mulligan Games banner over the doorway into the play room' }
  };
  PICS.magic = PICS.cedh;
  V.detailPic = function (gameId) {
    var p = PICS[gameId] || PICS.other, fig = mk('figure', 'det-pic'), img = document.createElement('img');
    img.src = p.src; img.alt = p.alt; img.width = p.w; img.height = p.h; img.loading = 'eager'; img.style.objectPosition = p.pos;
    fig.appendChild(img); return fig;
  };
  // "open" / "few seats" / "full" / "cancelled" / "changed" for the Other dates list
  V.dateState = function (o, now) {
    if (o.cancelled) return 'cancelled';
    var st = MG.seatState(o, now);
    if (o.note) return 'changed';
    switch (st.state) {
      case 'few': return 'few seats';
      case 'full': case 'waitlist': return 'full';
      case 'closed': return 'closed';
      default: return 'open';
    }
  };
  function nextOne(occ, now) {
    var from = MG.ymd(now), to = MG.ymd(MG.addDays(now, 120));
    return MG.occurrences(occ.series, from, to).filter(function (o) { return o.key !== occ.key && !o.cancelled && o.endAt > now && o.date > occ.date; })[0] || null;
  }
  function kicker(occ, now) {
    var d = MG.parseYmd(occ.date), rel = MG.relDay(occ.date, now);
    return rel === 'today' ? 'Tonight' : rel === 'tomorrow' ? 'Tomorrow' : MG.dayShort(d) + ', ' + MG.fmtDate(d);
  }
  function stateLine(big, text) { var p = mk('p', 'det-state'); p.appendChild(mk('strong', 'det-big', big)); if (text) p.appendChild(mk('span', null, text)); return p; }
  function actionBox(occ, st) {
    var s = occ.series, tool = s.tool || {}, box = mk('div', 'det-act'), btn;
    function seats() { return stateLine(String(st.left), (st.left === 1 ? 'seat left' : 'seats left') + (st.state === 'few' ? ', almost full' : ' of ' + st.cap)); }
    function signBtn(cls, label) { var b = mk('button', 'btn ' + cls + ' det-go', label); b.type = 'button'; b.setAttribute('data-signup', occ.key); return b; }
    switch (st.state) {
      case 'open': case 'few': case 'needs':
        box.appendChild(st.state === 'needs' ? stateLine(String(st.taken), 'signed up, needs ' + st.min + ' to run')
          : st.cap ? seats() : stateLine(String(st.taken), 'signed up'));
        box.appendChild(signBtn('btn-act', 'Sign up')); break;
      case 'waitlist':
        box.appendChild(stateLine('Full', st.waiting ? st.waiting + ' waiting' : 'waitlist open'));
        box.appendChild(signBtn('btn-2', 'Join the waitlist')); break;
      case 'full': box.appendChild(stateLine('Full', 'Ask at the counter about open seats.')); break;
      case 'closed':
        if (st.cap) box.appendChild(st.left ? stateLine(String(st.left), 'of ' + st.cap + ' seats left') : stateLine('Full'));
        box.appendChild(mk('p', 'det-how', st.cap && !st.left ? 'Sign-ups closed. All seats are taken.' : 'Sign-ups closed. Walk in if seats are left.')); break;
      case 'walkin': box.appendChild(withIcon(mk('p', 'det-how det-walk', 'Walk in. No sign-up needed.'), 'door')); break;
      case 'counter':
        box.appendChild(withIcon(mk('p', 'det-how det-walk', 'Pre-register at the counter.'), 'door'));
        btn = mk('a', 'btn btn-2 det-go', 'Call the shop'); btn.href = MG.data.store.phoneHref; withIcon(btn, 'phone'); box.appendChild(btn); break;
      case 'external':
        if (s.inviteOnly) { box.appendChild(withIcon(mk('p', 'det-how det-walk', 'Invite only. Seats come from the Championship Series.'), 'lock')); break; }
        if (st.count) box.appendChild(stateLine(String(st.count), 'registered on ' + (tool.name || 'the other site')));
        if (tool.url) {
          btn = linkOut(tool.url, tool.cta || 'Sign up on ' + tool.name, 'btn btn-act det-go');
          btn.appendChild(mk('span', 'vh', ' (opens ' + (tool.name || 'another site') + ')')); btn.appendChild(ic('external', 'ic-ext')); box.appendChild(btn);
        } else box.appendChild(mk('p', 'det-how', 'Sign up on ' + (tool.name || 'the other site') + '.'));
        break;
    }
    var price = V.priceLine(s);
    if (price && ['open', 'few', 'needs', 'waitlist', 'closed'].indexOf(st.state) !== -1) box.appendChild(mk('p', 'det-how', price));
    var ics = mk('button', 'btn btn-2 btn-sm det-ics', 'Add this date to my calendar'); ics.type = 'button'; ics.setAttribute('data-ics-one', occ.key); withIcon(ics, 'calendar');
    box.appendChild(ics);
    return box;
  }
  V.detailEl = function (occ, now) {
    var s = occ.series, st = MG.seatState(occ, now), tool = s.tool || {}, over = occ.cancelled || occ.endAt <= now;
    var art = mk('article', 'det ev'); art.setAttribute('data-game', s.game); art.setAttribute('data-state', st.state); art.setAttribute('aria-labelledby', 'det-title');
    var x = mk('button', 'dlg-x'); x.type = 'button'; x.id = 'det-x'; x.setAttribute('data-close', ''); x.setAttribute('aria-label', 'Close'); x.appendChild(ic('x'));
    art.appendChild(x);
    art.appendChild(V.detailPic(s.game));

    /* head */
    var head = mk('div', 'det-head');
    head.appendChild(mk('p', 'det-kicker', kicker(occ, now)));
    var h = mk('h2', 'det-h'); h.id = 'det-title'; h.tabIndex = -1; h.appendChild(mk('span', 'det-name', s.title));
    var price = mk('span', 'det-price'); price.appendChild(mk('span', 'vh', 'Entry: ')); price.appendChild(document.createTextNode(MG.fmtFee(s.fee))); h.appendChild(price);
    head.appendChild(h);
    var gl = mk('p', 'det-gl'), gb = document.createElement('span'); gb.innerHTML = MG.gameBadge(s.game); // constant SVG + the game's name from our own list
    gl.appendChild(gb.firstChild); gl.appendChild(mk('span', 'ev-fmt', s.format)); head.appendChild(gl);
    head.appendChild(withIcon(mk('p', 'det-time', V.timeLine(occ)), 'clock'));
    if (occ.cancelled) {
      var cb = mk('p', 'det-banner det-banner-bad'); cb.appendChild(ic('cancel')); cb.appendChild(mk('strong', null, 'Cancelled. ')); cb.appendChild(document.createTextNode(occ.note || 'This date is cancelled.')); head.appendChild(cb);
    } else if (occ.note) {
      var ub = mk('p', 'det-banner'); ub.appendChild(withIcon(mk('span', 'tag tag-upd', 'Updated'), 'pencil')); ub.appendChild(document.createTextNode(' ' + occ.note)); head.appendChild(ub);
    }
    if (over) {
      var nx = nextOne(occ, now);
      if (nx) head.appendChild(mk('p', 'det-next', 'Next one: ' + MG.dayShort(MG.parseYmd(nx.date)) + ' ' + MG.fmtDate(MG.parseYmd(nx.date))));
    }
    var tags = mk('p', 'det-tags');
    if (st.onNow) { var on = mk('span', 'tag tag-now'), dot = mk('span', 'dot'); dot.setAttribute('aria-hidden', 'true'); on.appendChild(dot); on.appendChild(document.createTextNode('On now')); tags.appendChild(on); }
    if (s.kidsWelcome) tags.appendChild(withIcon(mk('span', 'tag', 'Kids welcome'), 'kid'));
    if (s.inviteOnly) tags.appendChild(withIcon(mk('span', 'tag', 'Invite only'), 'lock'));
    if (tags.firstChild) head.appendChild(tags);
    art.appendChild(head);
    if (!over) art.appendChild(actionBox(occ, st));

    /* about this night */
    var rows = [];
    function row(k, v) { if (v) rows.push([k, v]); }
    row('Prizes', s.prize); row('Bring', s.bring); row('Kids', s.kidsWelcome && 'Welcome');
    if (s.warhammer) {
      var w = s.warhammer, bits = [];
      if (w.points) bits.push(w.points + ' points');
      if (w.roundMins) bits.push(w.roundMins + ' minute rounds');
      if (w.listDeadline) bits.push('lists due ' + w.listDeadline);
      row('Warhammer', bits.join(', '));
    }
    if (tool.name && tool.name !== 'another site') {
      var dd = document.createDocumentFragment();
      var toolEl = function () {
        if (!tool.url) return document.createTextNode(tool.name);
        var a = linkOut(tool.url, tool.name); a.appendChild(mk('span', 'vh', ' (opens ' + tool.name + ')')); a.appendChild(ic('external', 'ic-ext')); return a;
      };
      if (tool.code) {
        dd.appendChild(mk('strong', 'code', tool.code)); dd.appendChild(document.createTextNode(' '));
        var cp = mk('button', 'btn btn-2 btn-sm', 'Copy'); cp.type = 'button'; cp.setAttribute('data-copy', tool.code); withIcon(cp, 'copy'); cp.appendChild(mk('span', 'vh', ' the event code')); dd.appendChild(cp);
        dd.appendChild(document.createTextNode(' on ')); dd.appendChild(toolEl()); row('Event code', dd);
      } else { dd.appendChild(toolEl()); row('Official tool', dd); }
    }
    if (rows.length || s.description) {
      var about = mk('section', 'det-sec'); about.appendChild(mk('h3', null, 'About this night'));
      if (rows.length) {
        var dl = mk('dl', 'det-list');
        rows.forEach(function (r) {
          var g = mk('div'), dd2 = mk('dd'); g.appendChild(mk('dt', null, r[0]));
          if (typeof r[1] === 'string') dd2.textContent = r[1]; else dd2.appendChild(r[1]);
          g.appendChild(dd2); dl.appendChild(g);
        });
        about.appendChild(dl);
      }
      if (s.description) about.appendChild(mk('p', 'det-desc', s.description));
      art.appendChild(about);
    }

    /* other dates */
    var others = MG.occurrences(s, MG.ymd(now), MG.ymd(MG.addDays(now, 120))).filter(function (o) { return o.key !== occ.key && o.date > occ.date && o.endAt > now; }).slice(0, 6);
    if (others.length) {
      var od = mk('section', 'det-sec'); od.appendChild(mk('h3', null, 'Other dates'));
      var ul = mk('ul', 'det-dates');
      others.forEach(function (o) {
        var d3 = MG.parseYmd(o.date), li = mk('li'), a = mk('a', o.cancelled ? 'struck' : null, MG.dayShort(d3) + ' ' + MG.fmtDate(d3));
        a.href = 'events.html#e-' + encodeURIComponent(o.key); li.appendChild(a);
        li.appendChild(mk('span', 'dd-time', MG.fmtTime(o.start)));
        li.appendChild(mk('span', 'dd-state' + (o.cancelled ? ' dd-bad' : ''), V.dateState(o, now)));
        ul.appendChild(li);
      });
      od.appendChild(ul);
      var label = s.recurrence.type === 'weekly' ? 'Add every ' + R.DAYS[s.recurrence.day] + ' to my calendar' : 'Add all these dates to my calendar';
      var sb = mk('button', 'btn btn-2 btn-sm', label); sb.type = 'button'; sb.setAttribute('data-ics-series', s.id); withIcon(sb, 'calendar'); od.appendChild(sb);
      art.appendChild(od);
    }

    /* getting here */
    var A = MG.data.store.address, here = mk('section', 'det-sec'); here.appendChild(mk('h3', null, 'Getting here'));
    here.appendChild(mk('p', 'det-where', A.street + ', ' + A.city + '. ' + (MG.data.store.parking || '')));
    if (s.kind === 'learn') here.appendChild(mk('p', 'det-where', 'New here? Tell the counter and we will get you started.'));
    var acts = mk('p', 'det-acts'), dir = linkOut(MG.data.store.mapsUrl, 'Directions', 'btn btn-2'), call = mk('a', 'btn btn-2', 'Call');
    withIcon(dir, 'pin'); dir.appendChild(mk('span', 'vh', ' (opens Google Maps)'));
    call.href = MG.data.store.phoneHref; withIcon(call, 'phone');
    acts.appendChild(dir); acts.appendChild(call); here.appendChild(acts);
    art.appendChild(here);
    return art;
  };
  V.detail = function (occ, now) { return V.detailEl(occ, now).outerHTML; };

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
    var bits = [g.short, MG.fmtFee(s.fee)]; if (st.state !== 'walkin') bits.push(V.seatWords(st, s)); // walk-in is said once per page (F2)
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

  /* ---------- a repeating series: one card (from 640 px) or one row (phones) ---------- */
  // the next date that is still ahead (the first one, even when cancelled), plus the first one that will actually run
  V.weeklyNext = function (s, now, from, to) {
    var occs = MG.occurrences(s, from, to).filter(function (o) { return o.endAt > now; });
    if (!occs.length) return null;
    var first = occs[0], shown = first.cancelled ? (occs.filter(function (o) { return !o.cancelled; })[0] || first) : first;
    return { first: first, shown: shown };
  };
  // returns the <article> (built from MG.eventCard's escaped markup, then edited with textContent); null when nothing is ahead
  V.weeklyCardEl = function (s, now, from, to) {
    var nx = V.weeklyNext(s, now, from, to); if (!nx) return null;
    var first = nx.first, shown = nx.shown;
    var tpl = document.createElement('template');
    tpl.innerHTML = MG.eventCard(shown, now, { href: 'events.html' });
    var art = tpl.content.firstElementChild, when = art.querySelector('.ev-when');
    // the day heading says "next Nov 4" once; the card repeats it only when that date is cancelled or changed
    if (when && (first.cancelled || shown.cancelled || first.note)) {
      var d = MG.parseYmd(shown.date), p = document.createElement('p');
      p.className = 'ev-next';
      var t = 'Next: ' + MG.dayShort(d) + ' ' + MG.fmtDate(d) + '.';
      if (first.cancelled && shown !== first) t += ' ' + MG.fmtDate(MG.parseYmd(first.date)) + ' is cancelled.';
      if (shown.cancelled) t = 'Next: ' + MG.dayShort(d) + ' ' + MG.fmtDate(d) + ' is cancelled.';
      p.textContent = t;
      when.insertAdjacentElement('afterend', p);
    }
    return art;
  };
  V.weeklyCard = function (s, now, from, to) { var a = V.weeklyCardEl(s, now, from, to); return a ? a.outerHTML : ''; };

  // phone row (F7): game dot, time, linked title, then only the fee and what is unusual
  V.weeklyRow = function (s, now, from, to) {
    var nx = V.weeklyNext(s, now, from, to); if (!nx) return null;
    var o = nx.shown, first = nx.first, st = MG.seatState(o, now), g = MG.game(s.game);
    function mk(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
    var li = mk('li', 'day-line'); li.setAttribute('data-game', g.id); li.setAttribute('data-state', st.state);
    var dot = mk('span', 'dl-dot'); dot.setAttribute('aria-hidden', 'true'); li.appendChild(dot);
    li.appendChild(mk('span', 'dl-time', MG.fmtTime(o.start)));
    var t = mk('span', 'dl-title'), a = mk('a', null, s.title); a.href = 'events.html#e-' + encodeURIComponent(o.key); t.appendChild(a); li.appendChild(t);
    var bits = [MG.fmtFee(s.fee)];
    if (st.state !== 'walkin') bits.push(V.seatWords(st, s));
    if (first.cancelled && o !== first) bits.push(MG.fmtDate(MG.parseYmd(first.date)) + ' cancelled');
    else if (first.note && !first.cancelled) bits.push('changed');
    li.appendChild(mk('span', 'dl-bits', bits.join(' · ')));
    return li;
  };
})();
