/* Mulligan Games concept: shared helpers for every prototype page.
 *
 * window.MG: dates, recurrence, seat state, store hours, formatting, icons and the event card.
 * The rules here are the ones DESIGN.md specifies ("Event card states", "Open-now strip");
 * the Phase 2 build ports them to server code (src/lib/events.js, store-hours.js).
 * No dependencies. Reads window.MG_SAMPLE (data/sample.js), which must load first.
 */
(function () {
  'use strict';
  var D = window.MG_SAMPLE;
  var MG = { data: D };

  /* ---------- small utils ---------- */
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  MG.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  MG.ymd = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  MG.parseYmd = function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  MG.addDays = function (d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; };
  MG.at = function (ymd, hm) { // local Date for a date + "HH:MM" ("24:00" = next midnight)
    var d = MG.parseYmd(ymd), p = hm.split(':');
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), +p[0], +p[1]);
  };
  function mins(hm) { var p = hm.split(':'); return +p[0] * 60 + +p[1]; }

  /* ---------- the clock (demo-aware) ---------- */
  MG.now = function () {
    var q = new URLSearchParams(location.search).get('now');
    if (q && /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(q)) return new Date(q);
    var real = new Date(), w = D.window;
    if (w && (MG.ymd(real) < w.from || MG.ymd(real) > w.to)) return new Date(D.demoNow);
    return real;
  };
  MG.isDemoClock = function () { return MG.ymd(MG.now()) !== MG.ymd(new Date()); };

  /* ---------- formatting ---------- */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  MG.dayName = function (d) { return DAYS[d.getDay()]; };
  MG.dayShort = function (d) { return DAYS[d.getDay()].slice(0, 3); };
  MG.monthShort = function (d) { return MONTHS[d.getMonth()].slice(0, 3); };
  MG.fmtDate = function (d) { return MG.monthShort(d) + ' ' + d.getDate(); };            // Oct 30
  MG.fmtLongDate = function (d) { return MG.dayName(d) + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate(); }; // Friday, October 30
  // "19:00" -> "7 PM", "18:30" -> "6:30 PM", "24:00" -> "midnight", "12:00" -> "noon"
  MG.fmtTime = function (hm, opts) {
    var m = mins(hm) % 1440, h = Math.floor(m / 60), mm = m % 60;
    if (m === 0) return opts && opts.short ? '12 AM' : 'midnight';
    if (m === 720 && !(opts && opts.short)) return 'noon';
    var ap = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12;
    return h12 + (mm ? ':' + pad(mm) : '') + ' ' + ap; // no break between 7 and PM
  };
  MG.fmtFee = function (fee) { return fee === 0 ? 'Free' : fee == null ? '?' : '$' + fee; };
  MG.list = function (arr) { // ["a","b","c"] -> "a, b and c"
    if (arr.length < 2) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  };

  /* ---------- games ---------- */
  MG.game = function (id) {
    for (var i = 0; i < D.games.length; i++) if (D.games[i].id === id) return D.games[i];
    return D.games[D.games.length - 1];
  };
  MG.inGame = function (series, chip) { // the Magic chip also shows cEDH (family)
    if (!chip || chip === 'all') return true;
    var g = MG.game(series.game);
    return series.game === chip || g.family === chip;
  };

  /* ---------- recurrence ---------- */
  function nthWeekday(year, month, nth, day) { // nth 1..5 or -1 (last); returns Date or null
    if (nth > 0) {
      var first = new Date(year, month, 1), off = (day - first.getDay() + 7) % 7;
      var d = new Date(year, month, 1 + off + (nth - 1) * 7);
      return d.getMonth() === month ? d : null;
    }
    var last = new Date(year, month + 1, 0), back = (last.getDay() - day + 7) % 7;
    return new Date(year, month, last.getDate() - back);
  }
  // Dates (and per-date start) of one series between two YMD strings, inclusive.
  function rawDates(s, from, to) {
    var r = s.recurrence, out = [];
    if (r.type === 'none') { if (r.date >= from && r.date <= to) out.push({ date: r.date, start: s.start }); return out; }
    if (r.type === 'dates') { r.dates.forEach(function (x) { if (x.date >= from && x.date <= to) out.push({ date: x.date, start: x.start || s.start }); }); return out; }
    var d = MG.parseYmd(from), end = MG.parseYmd(to);
    if (r.type === 'weekly') {
      d = MG.addDays(d, (r.day - d.getDay() + 7) % 7);
      for (; d <= end; d = MG.addDays(d, 7)) out.push({ date: MG.ymd(d), start: s.start });
      return out;
    }
    if (r.type === 'nth') {
      for (var y = d.getFullYear(), m = d.getMonth(); new Date(y, m, 1) <= end; m++) {
        var hit = nthWeekday(y, m, r.nth, r.day);
        if (hit) { var k = MG.ymd(hit); if (k >= from && k <= to) out.push({ date: k, start: s.start }); }
      }
      return out;
    }
    return out;
  }
  function exceptionFor(seriesId, date) {
    for (var i = 0; i < D.exceptions.length; i++) {
      var e = D.exceptions[i];
      if (e.series === seriesId && e.date === date) return e;
    }
    return null;
  }
  // One dated occurrence, with exceptions applied. key is stable: <series>@<date>[T<start>]
  MG.occurrences = function (s, from, to) {
    return rawDates(s, from, to).map(function (x) {
      var ex = exceptionFor(s.id, x.date), start = (ex && ex.start) || x.start;
      var multi = s.recurrence.type === 'dates' && s.recurrence.dates.filter(function (y) { return y.date === x.date; }).length > 1;
      var startAt = MG.at(x.date, start), endAt;
      if (s.end) { endAt = MG.at(x.date, s.end); if (endAt <= startAt) endAt = MG.addDays(endAt, 1); }
      else endAt = new Date(startAt.getTime() + 4 * 3600e3);
      if (ex && ex.start && s.end) endAt = new Date(endAt.getTime() + (mins(ex.start) - mins(x.start)) * 60e3);
      return {
        series: s, date: x.date, start: start, startAt: startAt, endAt: endAt,
        key: s.id + '@' + x.date + (multi ? 'T' + start.replace(':', '') : ''),
        cancelled: !!(ex && ex.type === 'cancel'),
        note: ex ? ex.note : null, updated: ex ? ex.updated : null, exception: ex
      };
    });
  };
  MG.allOccurrences = function (from, to) {
    var all = [];
    D.series.forEach(function (s) { if (s.enabled !== false) all = all.concat(MG.occurrences(s, from, to)); });
    return all.sort(function (a, b) { return a.startAt - b.startAt || a.series.title.localeCompare(b.series.title); });
  };
  // Next occurrence of a series on or after a date (for "Every Friday 7 PM, next Oct 30" and empty states)
  MG.nextOf = function (s, fromYmd) {
    var to = MG.ymd(MG.addDays(MG.parseYmd(fromYmd), 70));
    var occ = MG.occurrences(s, fromYmd, to).filter(function (o) { return !o.cancelled; });
    return occ[0] || null;
  };

  /* ---------- registrations and seat state ---------- */
  MG.regsFor = function (occ) {
    return D.registrations.filter(function (r) {
      return r.series === occ.series.id && r.date === occ.date && (!r.start || r.start === occ.start);
    });
  };
  /* The card state machine. DESIGN.md "Event card: states" is the spec; keep them in sync.
   * Returns { state, taken, waiting, cap, left, min, onNow, past } */
  MG.seatState = function (occ, now) {
    var s = occ.series, out = { state: 'open', taken: 0, waiting: 0, cap: s.capacity || null, left: null, min: s.minPlayers || null };
    out.onNow = !occ.cancelled && now >= occ.startAt && now < occ.endAt;
    out.past = now >= occ.endAt;
    if (occ.cancelled) { out.state = 'cancelled'; return out; }
    if (s.signup === 'walkin') { out.state = 'walkin'; return out; }
    if (s.signup === 'external') { out.state = 'external'; out.count = s.externalCount ? s.externalCount[occ.date] : null; return out; }
    if (s.signup === 'counter') { out.state = 'counter'; return out; }
    var regs = MG.regsFor(occ);
    out.taken = regs.filter(function (r) { return r.status === 'in'; }).length;
    out.waiting = regs.filter(function (r) { return r.status === 'waitlist'; }).length;
    out.left = out.cap ? Math.max(0, out.cap - out.taken) : null;
    if (now >= occ.startAt) { out.state = 'closed'; return out; }               // cutoff "start"
    if (out.cap && out.left === 0) { out.state = s.waitlist ? 'waitlist' : 'full'; return out; }
    if (out.min && out.taken < out.min) { out.state = 'needs'; return out; }
    if (out.cap && out.left <= Math.max(3, Math.ceil(out.cap * 0.15))) { out.state = 'few'; return out; }
    out.state = 'open';
    return out;
  };

  /* ---------- store hours and open-now ---------- */
  MG.hoursFor = function (ymd) {
    var st = D.store;
    for (var i = 0; i < st.hourOverrides.length; i++) if (st.hourOverrides[i].date === ymd) {
      var o = st.hourOverrides[i];
      return { closed: !!o.closed, open: o.open, close: o.close, note: o.note, override: true };
    }
    var w = st.hours[MG.parseYmd(ymd).getDay()];
    return { closed: !!w.closed, open: w.open, close: w.close };
  };
  function span(ymd) { // [openAt, closeAt] or null; a close at or before the open runs past midnight
    var h = MG.hoursFor(ymd);
    if (h.closed) return null;
    var a = MG.at(ymd, h.open), b = MG.at(ymd, h.close);
    if (b <= a) b = MG.addDays(b, 1);
    return [a, b, h];
  }
  /* { open, closeAt, closeHm, next: { date, openAt, hm, day }, today: hours, label } */
  MG.openStatus = function (now) {
    var today = MG.ymd(now), yest = MG.ymd(MG.addDays(now, -1));
    var y = span(yest), t = span(today);
    if (y && now >= y[0] && now < y[1]) return { open: true, closeAt: y[1], closeHm: y[2].close, today: y[2] };
    if (t && now >= t[0] && now < t[1]) return { open: true, closeAt: t[1], closeHm: t[2].close, today: t[2] };
    var res = { open: false, today: MG.hoursFor(today) };
    for (var i = 0; i < 8; i++) {
      var dy = MG.ymd(MG.addDays(now, i)), sp = span(dy);
      if (sp && sp[0] > now) { res.next = { date: dy, openAt: sp[0], hm: sp[2].open, note: sp[2].note }; break; }
    }
    return res;
  };
  MG.relDay = function (ymd, now) { // "today", "tomorrow", "Wednesday", "Wed Nov 4"
    var diff = Math.round((MG.parseYmd(ymd) - MG.parseYmd(MG.ymd(now))) / 864e5), d = MG.parseYmd(ymd);
    if (diff === 0) return 'today';
    if (diff === 1) return 'tomorrow';
    if (diff < 7) return MG.dayName(d);
    return MG.dayShort(d) + ' ' + MG.fmtDate(d);
  };

  /* ---------- icons (inline SVG strings, 24px grid, currentColor) ---------- */
  var P = {
    // games: simple generic shapes, no publisher marks
    magic: '<path d="M12 2.8 21 9.3l-3.4 10.6H6.4L3 9.3z"/><path d="M12 7.5 16.4 10.7 14.7 16H9.3l-1.7-5.3z"/>',
    cedh: '<path d="M3.5 18.5h17M4.5 18.5 3 7.5l5 4.2L12 4.5l4 7.2 5-4.2-1.5 11"/>',
    pokemon: '<path d="M13.5 2.5 5.5 13.5h6l-1 8 8-11h-6z"/>',
    onepiece: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M7 11h10M4 15a8 6 0 0 0 16 0"/>',
    riftbound: '<path d="M12 2.5 20 12l-8 9.5L4 12z"/><path d="M13.5 6 10 12h4l-3.5 6"/>',
    hololive: '<rect x="8.5" y="2.5" width="7" height="11" rx="3.5"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5M8.5 21.5h7"/>',
    warhammer: '<path d="M12 2.5 20 5.5v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6z"/><path d="M12 7v9M8.5 10.5h7"/>',
    other: '<path d="M12 2.5 20.5 7.3v9.4L12 21.5l-8.5-4.8V7.3z"/><path d="M12 6.5 17 15H7z"/>',
    // ui
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    seat: '<path d="M7 11V5.5A1.5 1.5 0 0 1 8.5 4h7A1.5 1.5 0 0 1 17 5.5V11M5 11h14v4H5zM7 15v5M17 15v5"/>',
    alert: '<path d="M12 3.5 22 20.5H2z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    hourglass: '<path d="M6.5 3h11M6.5 21h11M7.5 3c0 5 9 5 9 9s-9 4-9 9M16.5 3c0 5-9 5-9 9s9 4 9 9"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    cancel: '<circle cx="12" cy="12" r="9"/><path d="m8.5 8.5 7 7M15.5 8.5l-7 7"/>',
    door: '<path d="M5 21h14M7 21V4h10v17"/><path d="M13.5 12.5v.01"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    phone: '<path d="M5 3.5h3.5l1.5 4.5-2.3 1.5a11 11 0 0 0 6.8 6.8l1.5-2.3 4.5 1.5V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2z"/>',
    pin: '<path d="M12 21.5s-7-6.2-7-11.5a7 7 0 0 1 14 0c0 5.3-7 11.5-7 11.5z"/><circle cx="12" cy="10" r="2.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    kid: '<circle cx="12" cy="6" r="3"/><path d="M7 21v-5.5L5 11.5l3.5-1.5h7l3.5 1.5-2 4V21M10 21v-4h4v4"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>'
  };
  MG.icon = function (name, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (P[name] || '') + '</svg>';
  };
  MG.gameBadge = function (gameId) {
    var g = MG.game(gameId);
    return '<span class="gbadge" data-game="' + g.id + '">' + MG.icon(g.icon, 'gi') + '<span>' + MG.esc(g.short) + '</span></span>';
  };

  /* ---------- the event card (DESIGN.md "Event card") ----------
   * opts.href: base for detail links (default "events.html")
   * opts.compact: hide the description line (front page)
   */
  MG.eventCard = function (occ, now, opts) {
    opts = opts || {};
    var s = occ.series, st = MG.seatState(occ, now), e = MG.esc, base = opts.href || 'events.html';
    var href = base + '#e-' + encodeURIComponent(occ.key), tool = s.tool || {};
    var timeLine = MG.fmtTime(occ.start) + (s.end ? ' to ' + MG.fmtTime(MG.fmtEnd(occ)) : '');
    if (s.doors) timeLine = 'Doors ' + MG.fmtTime(s.doors) + ', starts ' + MG.fmtTime(occ.start);

    var tags = '';
    if (st.onNow) tags += '<span class="tag tag-now"><span class="dot" aria-hidden="true"></span>On now</span>';
    if (s.kidsWelcome) tags += '<span class="tag">' + MG.icon('kid') + 'Kids welcome</span>';
    if (s.inviteOnly) tags += '<span class="tag">' + MG.icon('lock') + 'Invite only</span>';

    var text = '';
    if (occ.note && !occ.cancelled) text += '<p class="ev-note"><span class="tag tag-upd">' + MG.icon('pencil') + 'Updated</span> ' + e(occ.note) + '</p>';
    if (occ.cancelled) text += '<p class="ev-note">' + e(occ.note || 'This date is cancelled.') + '</p>';
    else if (s.prize) text += '<p class="ev-prize">' + e(s.prize) + '</p>';
    else if (s.description && !opts.compact) text += '<p>' + e(s.description) + '</p>';

    // action + stat box per state
    var act = '', stat = '';
    var ext = '<span class="vh"> (opens ' + e(tool.name || 'another site') + ')</span>' + MG.icon('external', 'ic-ext');
    switch (st.state) {
      case 'open':
        act = '<a class="btn btn-act" href="' + href + '">Sign up</a>';
        stat = statBox(st.left, st.left === 1 ? 'seat left' : 'seats left', 'of ' + st.cap, 'seat'); break;
      case 'few':
        act = '<a class="btn btn-act" href="' + href + '">Sign up</a>';
        stat = statBox(st.left, st.left === 1 ? 'seat left' : 'seats left', 'almost full', 'alert'); break;
      case 'needs':
        act = '<a class="btn btn-act" href="' + href + '">Sign up</a>';
        stat = statBox(st.taken, 'signed up', 'needs ' + st.min + ' to run', 'users'); break;
      case 'waitlist':
        act = '<a class="btn btn-2" href="' + href + '">Join the waitlist</a>';
        stat = statBox('Full', '', st.waiting ? st.waiting + ' waiting' : 'waitlist open', 'hourglass'); break;
      case 'full':
        act = '<p class="ev-how">Full. Ask at the counter about open seats.</p>';
        stat = statBox('Full', '', '', 'lock'); break;
      case 'closed':
        act = '<p class="ev-how">Sign-ups closed. Walk in if seats are left.</p>';
        stat = statBox(st.left, st.left === 1 ? 'seat left' : 'seats left', 'of ' + st.cap, 'seat'); break;
      case 'walkin':
        act = '<p class="ev-how">' + MG.icon('door') + 'Just show up. No sign-up needed.</p>'; break;
      case 'counter':
        act = '<p class="ev-how">' + MG.icon('door') + 'Pre-register at the counter.</p>' +
          '<a class="btn btn-2" href="' + e(D.store.phoneHref) + '">' + MG.icon('phone') + 'Call the shop</a>'; break;
      case 'external':
        act = tool.url ? '<a class="btn btn-act" href="' + e(tool.url) + '" target="_blank" rel="noopener">' + e(tool.cta || 'Sign up on ' + tool.name) + ext + '</a>'
          : '<p class="ev-how">Sign up on ' + e(tool.name) + '.</p>';
        if (st.count) stat = statBox(st.count, 'registered', 'on ' + tool.name, 'users'); break;
      case 'cancelled':
        act = ''; break;
    }

    return '' +
      '<article class="ev" data-game="' + e(s.game) + '" data-state="' + st.state + '"' + (st.onNow ? ' data-now' : '') +
        ' id="c-' + e(occ.key) + '" aria-labelledby="t-' + e(occ.key) + '">' +
        '<div class="ev-bar">' +
          '<h4 class="ev-title" id="t-' + e(occ.key) + '"><a href="' + href + '">' + e(s.title) + '</a></h4>' +
          '<p class="ev-cost"><span class="vh">Entry: </span>' + MG.fmtFee(s.fee) + '</p>' +
        '</div>' +
        '<p class="ev-type">' + MG.gameBadge(s.game) + '<span class="ev-fmt">' + e(s.format) + '</span></p>' +
        '<div class="ev-text">' +
          '<p class="ev-when">' + MG.icon('clock') + '<span>' + e(timeLine) + '</span>' + tags + '</p>' + text +
        '</div>' +
        (occ.cancelled ? '<p class="ev-stamp">' + MG.icon('cancel') + 'Cancelled</p>' : '') +
        (act || stat ? '<div class="ev-foot">' + act + stat + '</div>' : '') +
      '</article>';
  };
  MG.fmtEnd = function (occ) { return occ.series.end === '24:00' ? '24:00' : occ.series.end && occ.exception && occ.exception.start
    ? shift(occ.series.end, mins(occ.exception.start) - mins(occ.series.start)) : occ.series.end; };
  function shift(hm, d) { var m = (mins(hm) + d + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function statBox(big, unit, small, icon) {
    return '<p class="ev-stat">' + MG.icon(icon) +
      '<span class="ev-stat-big">' + MG.esc(big) + '</span>' +
      (unit ? '<span class="ev-stat-unit">' + MG.esc(unit) + '</span>' : '') +
      (small ? '<span class="ev-stat-small">' + MG.esc(small) + '</span>' : '') + '</p>';
  }

  /* ---------- theme (two-state toggle, system default; see DESIGN.md "Light and dark") ---------- */
  MG.scheme = {
    stored: function () { try { return localStorage.getItem('mg-scheme'); } catch (e) { return null; } },
    system: function () { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; },
    current: function () { return MG.scheme.stored() || MG.scheme.system(); },
    toggle: function () {
      var target = MG.scheme.current() === 'dark' ? 'light' : 'dark', meta = document.querySelector('meta[name="color-scheme"]');
      try { if (target === MG.scheme.system()) localStorage.removeItem('mg-scheme'); else localStorage.setItem('mg-scheme', target); } catch (e) { /* not persisted */ }
      meta.content = target === MG.scheme.system() ? 'light dark' : target;
      document.documentElement.dataset.scheme = target;
      return target;
    }
  };

  window.MG = MG;
})();
