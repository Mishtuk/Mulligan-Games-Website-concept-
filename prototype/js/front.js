/* Mulligan Games concept: front page.
 * Renders the live parts of index.html from MG_SAMPLE via MG (js/mg.js). In the real build the server renders
 * the same markup (D11); this script then only enhances the game chips.
 */
(function () {
  'use strict';
  var MG = window.MG, D = MG.data, U = MG.ui, e = MG.esc;
  var $ = function (s) { return document.querySelector(s); };
  // owner rule: data goes in with createElement + textContent; icons are constant markup from MG.icon()
  function mk(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function icon(parent, name, cls) { parent.insertAdjacentHTML('beforeend', MG.icon(name, cls)); return parent; }
  function badge(gameId) { var g = MG.game(gameId), b = mk('span', 'gbadge'); b.setAttribute('data-game', g.id); icon(b, g.icon, 'gi'); b.appendChild(mk('span', null, g.short)); return b; }
  function statBox(ic, big, unit, small) { // the seat / countdown / registered box
    var p = mk('p', 'ev-stat'); icon(p, ic);
    if (big != null) p.appendChild(mk('span', 'ev-stat-big', big));
    p.appendChild(mk('span', 'ev-stat-unit', unit));
    if (small) p.appendChild(mk('span', 'ev-stat-small', small));
    return p;
  }
  var now = MG.now(), today = MG.ymd(now);
  var weekEnd = MG.ymd(MG.addDays(now, 6));
  var params = new URLSearchParams(location.search);
  var chip = params.get('game') || 'all';
  if (chip !== 'all' && !D.games.some(function (g) { return g.id === chip; })) chip = 'all';

  // occurrences this week that still matter (not finished)
  var week = MG.allOccurrences(today, weekEnd).filter(function (o) { return o.endAt > now; });
  var live = function (o) { return !o.cancelled; };

  function href(extra) { // keep ?now= so the demo clock survives filtering
    var p = new URLSearchParams(location.search);
    Object.keys(extra).forEach(function (k) { if (extra[k] == null) p.delete(k); else p.set(k, extra[k]); });
    var q = p.toString();
    return (q ? '?' + q : location.pathname.split('/').pop() || 'index.html');
  }
  function timeWord(d) { return d.getHours() >= 17 ? 'Tonight' : 'Today'; }

  // keep ?now= on links to other pages (same logic as U.href in js/ui.js)
  function keepNow(path) {
    var n = params.get('now');
    if (!n) return path;
    var hash = '', i = path.indexOf('#');
    if (i !== -1) { hash = path.slice(i); path = path.slice(0, i); }
    return path + (path.indexOf('?') === -1 ? '?' : '&') + 'now=' + encodeURIComponent(n) + hash;
  }
  function keepNowLinks() { // static links to *.html (nav, "All events", footer)
    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
      var h = a.getAttribute('href');
      if (!h || h.charAt(0) === '#' || /^[a-z][a-z0-9+.-]*:/i.test(h) || h.indexOf('//') === 0) return;
      if (!/\.html(#.*)?$/.test(h)) return;
      a.setAttribute('href', keepNow(h));
    });
  }

  /* ---------- hero video (DESIGN 6.1): poster first; the loop starts after load unless motion or data is limited ---------- */
  function wireVideo() {
    var v = $('#hero-video'), btn = $('#vid-btn'), box = $('#hero-media');
    if (!v || !btn || !v.play) return;
    // Round 5: the portrait loop is for phones. From 900px the landscape still shows and the video is never loaded.
    var narrow = matchMedia('(max-width: 899px)');
    function addSources() {
      if (v.querySelector('source')) return;
      v.poster = 'media/video/cedh-players-tables-loop-poster.webp';
      [['cedh-players-tables-loop.mp4', 'video/mp4'], ['cedh-players-tables-loop.webm', 'video/webm']].forEach(function (s) {
        var el = document.createElement('source'); el.src = 'media/video/' + s[0]; el.type = s[1]; v.appendChild(el);
      });
      v.load();
    }
    var rm = matchMedia('(prefers-reduced-motion: reduce)'), c = navigator.connection || {}, pref = null;
    var hold = rm.matches || c.saveData || /^(slow-2g|2g|3g)$/.test(c.effectiveType || '');
    try { pref = sessionStorage.getItem('mg-video'); } catch (err) { /* not stored */ }
    function label(playing) {
      $('#vid-label').textContent = playing ? 'Pause video' : 'Play video';
      if (playing) btn.removeAttribute('data-paused'); else btn.setAttribute('data-paused', '');
    }
    function start() { if (!narrow.matches) return; addSources(); v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () { label(false); }); }
    // Reveal the video only once a real frame has been painted. Until then (and if it never plays: blocked autoplay,
    // headless capture, a decode error) the poster <img> and the box's poster background stay in view.
    function reveal() { box.classList.add('is-on'); }
    function onFrame() {
      if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(reveal);
      else v.addEventListener('timeupdate', function t() { if (v.currentTime > 0) { v.removeEventListener('timeupdate', t); reveal(); } });
    }
    v.addEventListener('playing', function () { label(true); onFrame(); });
    ['error', 'emptied', 'abort'].forEach(function (n) { v.addEventListener(n, function () { box.classList.remove('is-on'); label(false); }); });
    v.addEventListener('pause', function () { label(false); });
    btn.addEventListener('click', function () {
      var go = v.paused;
      try { sessionStorage.setItem('mg-video', go ? 'play' : 'pause'); } catch (err) { /* not stored */ }
      if (go) start(); else v.pause();
    });
    try { rm.addEventListener('change', function (ev) { if (ev.matches) v.pause(); }); } catch (err) { /* old browsers */ }
    try { narrow.addEventListener('change', function (ev) { if (!ev.matches) v.pause(); }); } catch (err) { /* old browsers */ }
    if (!narrow.matches) return; // wide: no video, no pause control (the button stays hidden)
    btn.classList.add('is-ready'); label(false);
    if ((hold && pref !== 'play') || pref === 'pause') return;
    var later = function () { setTimeout(start, 300); };
    if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
  }

  /* ---------- 1. open-now strip ---------- */
  function statusText(st) {
    if (st.open) return { open: true, html: '<strong>Open now</strong> till ' + MG.fmtTime(st.closeHm) };
    if (!st.next) return { open: false, html: '<strong>Closed</strong>' };
    var rel = MG.relDay(st.next.date, now), t = MG.fmtTime(st.next.hm);
    if (rel === 'today') return { open: false, html: '<strong>Closed now.</strong> Opens at ' + t };
    var lead = st.today.closed ? 'Closed today.' : 'Closed now.';
    return { open: false, html: '<strong>' + lead + '</strong> Opens ' + rel + ' at ' + t };
  }
  function renderOpenbar(st) {
    var s = statusText(st), el = $('#ob-status');
    el.innerHTML = '<span class="ob-dot" aria-hidden="true"></span><span>' + s.html + '</span>';
    if (s.open) el.setAttribute('data-open', ''); else el.removeAttribute('data-open');
  }

  /* ---------- 2. hero ---------- */
  function headline(st) {
    if (st.open) return st.closeHm === '24:00' ? 'Open till midnight tonight.' : 'Open till ' + MG.fmtTime(st.closeHm) + ' tonight.';
    if (!st.next) return 'Closed this week.';
    var rel = MG.relDay(st.next.date, now), t = MG.fmtTime(st.next.hm);
    if (rel === 'today') return 'Open today from ' + t + '.';
    if (!st.today.closed) return 'Closed for the night. Back ' + rel + ' at ' + t + '.';
    return 'Closed today. Back ' + rel + ' at ' + t + '.';
  }
  function groupByStart(list) {
    var out = [];
    list.forEach(function (o) {
      var last = out[out.length - 1];
      if (last && last.date === o.date && last.start === o.start) last.items.push(o);
      else out.push({ date: o.date, start: o.start, items: [o] });
    });
    return out;
  }
  function sub() {
    var todays = week.filter(function (o) { return o.date === today && live(o); });
    var on = todays.filter(function (o) { return o.startAt <= now; });
    var later = todays.filter(function (o) { return o.startAt > now; });
    var parts = [];
    if (on.length) parts.push('On now: ' + MG.list(on.map(function (o) { return o.series.title; })) + '.');
    if (later.length) {
      var g = groupByStart(later).slice(0, 3).map(function (s) {
        return MG.list(s.items.map(function (o) { return o.series.title; })) + ' at ' + MG.fmtTime(s.start);
      });
      parts.push(timeWord(now) + ': ' + g.join('; ') + '.');
    }
    if (!parts.length) {
      var next = week.filter(function (o) { return o.date > today && live(o); })[0];
      if (next) {
        var same = week.filter(function (o) { return o.date === next.date && live(o); });
        var names = same.slice(0, 3).map(function (o) { return o.series.title; });
        var more = same.length - names.length;
        parts.push('Next up ' + MG.relDay(next.date, now) + ': ' + names.join(', ') + (more ? ' and ' + more + ' more' : '') + '.');
      }
    }
    var ov = MG.hoursFor(today);
    if (ov.override && ov.note) parts.push(ov.note);
    return parts.join(' ');
  }
  function renderHero(st) {
    $('#hero-date').textContent = MG.fmtLongDate(now);
    $('#hero-h').textContent = headline(st);
    $('#hero-sub').textContent = sub();
    // next up: the next start time (or what's on now if nothing else starts tonight)
    var upcoming = week.filter(function (o) { return live(o) && o.startAt > now; });
    var onNow = week.filter(function (o) { return live(o) && o.startAt <= now; });
    var slot = upcoming.length ? groupByStart(upcoming)[0] : onNow.length ? { date: today, start: onNow[0].start, items: onNow, on: true } : null;
    if (!slot) return;
    var titles = slot.items.map(function (o) { return o.series.title; });
    var shown = titles.slice(0, 2), more = titles.length - shown.length;
    var rel = MG.relDay(slot.date, now);
    $('#nextup-k').textContent = slot.on ? 'On now' : rel === 'today' ? 'Next up' : 'Next up ' + rel;
    $('#nextup-time').textContent = MG.fmtTime(slot.start);
    $('#nextup-what').textContent = shown.join(', ') + (more ? ' and ' + more + ' more' : '');
    $('#nextup').setAttribute('href', '#d-' + slot.date);
  }
  // one photo per live event of a day, picked once so cards, rows and the strip agree (and a chip filter doesn't reshuffle them)
  // Today and the next day with events (the photo-card days) share one 'used' map, so Saturday's Draft does not repeat
  // Friday's Magic picture just above it; the one-line days each start fresh (small thumbs).
  var phCache = {}, cardUsed = {}, cardDays = null;
  function isCardDay(ymd) {
    if (!cardDays) {
      cardDays = [MG.ymd(now)];
      for (var i = 1; i < 7; i++) { var y = MG.ymd(MG.addDays(now, i)); if (week.some(function (o) { return o.date === y; })) { cardDays.push(y); break; } }
    }
    return cardDays.indexOf(ymd) !== -1;
  }
  function dayPh(ymd) {
    if (!phCache[ymd]) {
      var card = isCardDay(ymd);
      if (card && ymd !== cardDays[0] && !phCache[cardDays[0]]) dayPh(cardDays[0]); // today always picks first
      phCache[ymd] = MG.photosForDay(week.filter(function (o) { return o.date === ymd; }), card ? cardUsed : null);
    }
    return phCache[ymd];
  }
  // the strip shows each day's main-event photo, but not the same picture on two tiles while that game's list lasts
  function stripPh(main, ymd, used) {
    var p = dayPh(ymd)[main.key], name = p.src.replace(/^img\/social\/|-800\.webp$/g, '') + (p.tint ? ':tint' : ''); // same keys as MG.photoFor
    if (!used[name]) { used[name] = true; return p; }
    return MG.photoFor(main.series, used);
  }
  // the day's main event for the strip: featured, then sign-up here / external, then the earliest start
  function mainEvent(evs) {
    var best = null, bs = -1;
    evs.forEach(function (o) {
      var sc = (o.series.featured ? 4 : 0) + (o.series.signup === 'here' || o.series.signup === 'external' ? 2 : 0);
      if (!best || sc > bs || (sc === bs && o.start < best.start)) { best = o; bs = sc; }
    });
    return best;
  }
  function renderDeck() {
    var html = '', stripUsed = {};
    for (var i = 0; i < 7; i++) {
      var d = MG.addDays(now, i), ymd = MG.ymd(d), h = MG.hoursFor(ymd);
      var evs = week.filter(function (o) { return o.date === ymd && live(o); });
      var closed = h.closed && !evs.length;
      var cap = closed ? 'Closed' : evs.length + (evs.length === 1 ? ' event' : ' events');
      var main = mainEvent(evs), mp = main ? stripPh(main, ymd, stripUsed) : null;
      var pips = evs.slice(0, 8).map(function (o) { return '<i data-game="' + e(o.series.game) + '"></i>'; }).join('');
      html += '<li style="--i:' + i + '"' + (i === 0 ? ' data-today' : '') + (closed ? ' data-closed' : '') + '>' +
        '<a class="daycard" style="--i:' + i + '" href="#d-' + ymd + '" aria-label="' + e(MG.dayName(d) + ' ' + MG.fmtDate(d) + (i === 0 ? ', today' : '') + ', ' + cap.toLowerCase()) + '">' +
          (main ? '<span class="dc-ph ph" aria-hidden="true" data-game="' + e(main.series.game) + '"' + (mp.tint ? ' data-tint' : '') + '>' + MG.photoImg(mp) + '</span>' : '') +
          '<span class="dc-dow">' + (i === 0 ? 'Today' : MG.dayShort(d)) + '</span>' +
          '<span class="dc-num">' + d.getDate() + '</span>' +
          '<span class="dc-pips" aria-hidden="true">' + pips + '</span>' +
        '</a><span class="dc-cap" aria-hidden="true">' + cap + '</span></li>';
    }
    $('#deck').innerHTML = html;
  }

  /* ---------- 3. this week ---------- */
  function renderChips() {
    var visible = week.filter(live);
    var items = [{ id: 'all', short: 'All games' }].concat(D.games.filter(function (g) { return g.shown; }));
    $('#chips').innerHTML = items.map(function (g) {
      var n = visible.filter(function (o) { return MG.inGame(o.series, g.id); }).length;
      return '<a class="chip" href="' + e(href({ game: g.id === 'all' ? null : g.id })) + '#week" data-chip="' + g.id + '"' +
        (g.id !== 'all' ? ' data-game="' + g.id + '"' : '') + (chip === g.id ? ' aria-current="true"' : '') + '>' +
        (g.icon ? MG.icon(g.icon, 'gi') : '') + '<span>' + e(g.short) + '</span><span class="chip-n"><span class="vh">, </span>' + n +
        '<span class="vh"> this week</span></span></a>';
    }).join('');
  }
  function dayMeta(ymd, d) {
    var h = MG.hoursFor(ymd);
    var t = MG.fmtDate(d) + (h.closed ? ', closed' : ', open ' + MG.fmtTime(h.open) + ' to ' + MG.fmtTime(h.close));
    if (h.override && h.note) t += '. ' + h.note;
    return t;
  }
  function renderDays() {
    var html = '', shownAny = false, nextSeen = false, run = [], frag = document.createDocumentFragment();
    function flush() { if (!html) return; var t = document.createElement('template'); t.innerHTML = html; frag.appendChild(t.content); html = ''; }
    // F9: consecutive closed days are one quiet line ("Monday and Tuesday · closed"); an empty span per day keeps each #d-YYYY-MM-DD anchor
    function endRun() {
      if (!run.length) return;
      flush();
      var box = mk('div', 'day-off'), names = run.map(function (r) { return MG.dayName(r.d); });
      run.forEach(function (r) { var sp = mk('span'); sp.id = 'd-' + r.ymd; box.appendChild(sp); });
      box.appendChild(mk('p', null, (names.length > 2 ? names[0] + ' to ' + names[names.length - 1] : names.join(' and ')) + ' · closed'));
      frag.appendChild(box); run = [];
    }
    for (var i = 0; i < 7; i++) {
      var d = MG.addDays(now, i), ymd = MG.ymd(d), h = MG.hoursFor(ymd);
      var all = week.filter(function (o) { return o.date === ymd; });
      var evs = all.filter(function (o) { return MG.inGame(o.series, chip); });
      var head = '<h3 class="day-h" id="dh-' + ymd + '"><span class="day-dia" aria-hidden="true"><span>' + d.getDate() + '</span></span>' +
        '<span class="day-name">' + (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : MG.dayName(d)) + '</span>' +
        '<span class="day-meta">' + e((i < 2 ? MG.dayName(d) + ', ' : '') + dayMeta(ymd, d)) + '</span></h3>';
      if (h.closed && !all.length) {
        if (chip === 'all') run.push({ d: d, ymd: ymd });
        continue;
      }
      endRun();
      if (!evs.length) {
        if (chip === 'all') html += '<section class="day" id="d-' + ymd + '" aria-labelledby="dh-' + ymd + '">' + head +
          '<p class="day-skip">' + (i === 0 && all.length === 0 && MG.allOccurrences(today, today).some(live) ? 'Nothing else scheduled today. ' : 'No scheduled events. ') + 'Free play all day.</p></section>';
        continue;
      }
      shownAny = true;
      if (i > 0 && nextSeen) {
        // R5: later days are one line per event
        flush();
        // built with createElement (owner rule): the hours note comes from data
        var secEl = document.createElement('section'), hEl = document.createElement('h3'), dia = document.createElement('span'), num = document.createElement('span');
        secEl.className = 'day'; secEl.id = 'd-' + ymd; secEl.setAttribute('aria-labelledby', 'dh-' + ymd);
        hEl.className = 'day-h'; hEl.id = 'dh-' + ymd; dia.className = 'day-dia'; dia.setAttribute('aria-hidden', 'true'); num.textContent = d.getDate(); dia.appendChild(num); hEl.appendChild(dia);
        [['day-name', MG.dayName(d)], ['day-meta', dayMeta(ymd, d)]].forEach(function (x) { var sp = document.createElement('span'); sp.className = x[0]; sp.textContent = x[1]; hEl.appendChild(sp); });
        secEl.appendChild(hEl);
        var ul = document.createElement('ul'); ul.className = 'day-lines';
        evs.forEach(function (o) { ul.appendChild(MG.views.compactLine(o, now, keepNow('events.html'), dayPh(ymd)[o.key])); });
        secEl.appendChild(ul); frag.appendChild(secEl);
        continue;
      }
      if (i > 0) nextSeen = true;
      var slots = groupByStart(evs).map(function (s) {
        var multi = s.items.length > 1;
        return '<div class="slot"' + (multi ? ' data-multi' : '') + '>' +
          '<p class="slot-t"><time datetime="' + s.date + 'T' + s.start + '">' + MG.fmtTime(s.start) + '</time>' +
          (multi ? '<span class="slot-n">' + s.items.length + ' events start at ' + MG.fmtTime(s.start) + '</span>' : '') + '</p>' +
          '<div class="slot-cards"' + (s.items.length === 1 ? ' data-one' : '') + '>' + s.items.map(function (o) { return MG.eventCard(o, now, { compact: true, href: keepNow('events.html'), photo: dayPh(ymd)[o.key] }); }).join('') + '</div></div>';
      }).join('');
      html += '<section class="day" id="d-' + ymd + '" aria-labelledby="dh-' + ymd + '"' + (i === 0 ? ' data-today' : '') + '>' + head +
        '<div class="slots">' + slots + '</div></section>';
    }
    endRun();
    if (!shownAny && chip !== 'all') html = emptyState() + html;
    flush();
    var host = $('#days'); host.textContent = ''; host.appendChild(frag);
    var n = week.filter(function (o) { return live(o) && MG.inGame(o.series, chip); }).length;
    var g = chip === 'all' ? null : MG.game(chip);
    $('#filter-status').textContent = (g ? 'Showing ' + g.short + ': ' : 'Showing all games: ') + n + (n === 1 ? ' event' : ' events') + ' this week.';
  }
  function emptyState() {
    var g = MG.game(chip);
    var future = MG.allOccurrences(MG.ymd(MG.addDays(now, 7)), MG.ymd(MG.addDays(now, 70)))
      .filter(function (o) { return live(o) && MG.inGame(o.series, chip); })[0];
    return '<div class="empty lattice" role="note"><p class="empty-h">No ' + e(g.short) + ' events this week.</p>' +
      (future ? '<p>The next one is ' + e(future.series.title) + ' on ' + e(MG.dayName(MG.parseYmd(future.date)) + ', ' + MG.fmtDate(MG.parseYmd(future.date))) +
        ' at ' + MG.fmtTime(future.start) + '.</p>' : '<p>Nothing is scheduled yet. Ask at the counter or watch the Discord.</p>') +
      '<a class="btn btn-2" href="' + e(href({ game: null })) + '#week" data-chip="all">Show all games</a></div>';
  }
  function signupShort(s) {
    return s.inviteOnly ? 'Invite only' : s.signup === 'walkin' ? '' : s.signup === 'here' ? 'Sign up here' : s.signup === 'counter' ? 'Pre-register at the counter'
      : (s.tool && s.tool.cta) || 'Sign up on ' + ((s.tool && s.tool.name) || 'another site');
  }
  function renderLater() {
    var from = MG.ymd(MG.addDays(now, 7)), to = MG.ymd(MG.addDays(now, 35));
    // one row per series (first date), "and N more dates" for short series like prereleases and RCQs
    var seen = {}, list = [];
    MG.allOccurrences(from, to).forEach(function (o) {
      if (!live(o) || o.series.kind === 'weekly' || o.series.kind === 'open' || o.series.kind === 'learn' || !MG.inGame(o.series, chip)) return;
      if (seen[o.series.id]) { seen[o.series.id].more++; return; }
      seen[o.series.id] = { o: o, more: 0 }; list.push(seen[o.series.id]);
    });
    list = list.slice(0, 4); // round 3: the front page shows four; the events page has the rest
    var host = $('#later'); host.textContent = '';
    if (!list.length) { var none = mk('li'); none.appendChild(mk('p', 'later-what', 'Nothing big on the calendar yet.')); host.appendChild(none); return; }
    list.forEach(function (x) {
      var o = x.o, d = MG.parseYmd(o.date), li = mk('li');
      var dt = mk('p', 'later-date'); dt.setAttribute('aria-hidden', 'true');
      dt.appendChild(document.createTextNode(MG.dayShort(d))); dt.appendChild(mk('b', null, d.getDate())); dt.appendChild(document.createTextNode(MG.monthShort(d)));
      var what = mk('p', 'later-what'), a = mk('a', null, o.series.title);
      a.href = keepNow('events.html') + '#e-' + encodeURIComponent(o.key);
      what.appendChild(a); what.appendChild(mk('span', 'vh', ', ' + MG.fmtLongDate(d)));
      if (x.more) { what.appendChild(document.createTextNode(' ')); what.appendChild(mk('span', 'tag', 'and ' + x.more + ' more ' + (x.more === 1 ? 'date' : 'dates'))); }
      var meta = mk('p', 'later-meta'); meta.appendChild(badge(o.series.game));
      meta.appendChild(mk('span', null, MG.fmtTime(o.start))); meta.appendChild(mk('span', null, MG.fmtFee(o.series.fee)));
      var how = signupShort(o.series); if (how) meta.appendChild(mk('span', null, how));
      li.appendChild(dt); li.appendChild(what); li.appendChild(meta); host.appendChild(li);
    });
  }

  /* ---------- 4. cEDH ---------- */
  function renderCedh() {
    var list = MG.allOccurrences(today, MG.ymd(MG.addDays(now, 60))).filter(function (o) {
      return live(o) && o.series.game === 'cedh' && o.series.cedhSeries && o.endAt > now;
    }).slice(0, 3);
    var host = $('#cedh-list'); host.textContent = '';
    list.forEach(function (o) {
      var s = o.series, d = MG.parseYmd(o.date), st = MG.seatState(o, now), tool = s.tool || {}, li = mk('li', 'tix');
      var dt = mk('p', 'tix-date'); dt.setAttribute('aria-hidden', 'true');
      dt.appendChild(document.createTextNode(MG.dayShort(d))); dt.appendChild(mk('b', null, d.getDate())); dt.appendChild(document.createTextNode(MG.monthShort(d)));
      var what = mk('div', 'tix-what');
      what.appendChild(mk('h4', null, s.title));
      what.appendChild(mk('p', null, MG.fmtTime(o.start) + (s.fee ? ' · ' + MG.fmtFee(s.fee) : ''))); // the date block above says the day (F2)
      var acts = mk('div', 'tix-acts');
      if (s.inviteOnly) { var how = mk('p', 'ev-how'); icon(how, 'lock'); how.appendChild(document.createTextNode('Invite only. Seats come from the Championship Series.')); acts.appendChild(how); }
      else {
        var a = mk('a', 'btn btn-act', tool.cta || 'Sign up on ' + tool.name);
        a.href = MG.safeUrl(tool.url); a.target = '_blank'; a.rel = 'noopener';
        a.appendChild(mk('span', 'vh', ' (opens ' + tool.name + ')')); icon(a, 'external', 'ic-ext'); acts.appendChild(a);
      }
      if (st.count) acts.appendChild(statBox('users', st.count, 'registered')); // the button already names the tool (F2)
      li.appendChild(dt); li.appendChild(what); li.appendChild(acts); host.appendChild(li);
    });
    var last = D.results.filter(function (r) { return r.series === 'cedh-mcs' && r.public && r.date < today; })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0];
    var lastEl = $('#cedh-last'); lastEl.textContent = '';
    if (last) {
      lastEl.appendChild(document.createTextNode('Last Championship Series, ' + MG.fmtDate(MG.parseYmd(last.date)) + ': '));
      lastEl.appendChild(mk('strong', null, last.headcount + ' players.')); lastEl.appendChild(document.createTextNode(' ' + (last.prizes || '')));
    }
    // fees come from the data (TopDeck, Nov 2026); the $10 online deposit is said once, here
    var fee = function (k) { var s = D.series.filter(function (x) { return x.cedhSeries === k; })[0]; return s ? MG.fmtFee(s.fee) : ''; };
    $('#cedh-fees').textContent = 'Championship Series ' + fee('mcs') + ', 5K ' + fee('5k') + ', Redemption ' + fee('redemption') + ' ($25 after the 5K). A $10 online deposit holds a spot; the rest is paid at the door.';
    var tl = $('#cedh-turnout'); tl.textContent = '';
    D.circuit.events.filter(function (r) { return r.date < today; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 4).forEach(function (r) {
      var li = mk('li'); li.appendChild(mk('span', 'turnout-d', MG.fmtDate(MG.parseYmd(r.date)))); li.appendChild(mk('span', 'turnout-t', r.title)); li.appendChild(mk('b', null, r.players + ' players')); tl.appendChild(li);
    });
  }

  /* ---------- 5. new and preorders ---------- */
  function renderReleases() {
    var host = $('#rel-list'); host.textContent = '';
    D.releases.forEach(function (r) {
      var g = MG.game(r.game), label = r.status === 'preorder' ? 'Preorder' : r.status === 'out' ? 'Out now' : 'Coming soon';
      var li = mk('li', 'rel'); li.setAttribute('data-game', g.id); li.setAttribute('data-status', r.status);
      li.appendChild(mk('h3', 'rel-name', r.name));
      var ty = mk('p', 'ev-type'); ty.appendChild(badge(g.id)); ty.appendChild(mk('span', 'ev-fmt', label)); li.appendChild(ty);
      var text = mk('div', 'rel-text'); if (r.note) text.appendChild(mk('p', null, r.note));
      if (r.event) {
        var s = D.series.filter(function (x) { return x.id === r.event; })[0];
        var occ = s && MG.occurrences(s, today, MG.ymd(MG.addDays(now, 60))).filter(live);
        if (occ && occ.length) {
          var when = occ.map(function (o) { var d = MG.parseYmd(o.date); return MG.dayShort(d) + ' ' + MG.fmtDate(d) + ' at ' + MG.fmtTime(o.start); });
          var p = mk('p'), a = mk('a', null, s.title); a.href = keepNow('events.html') + '#e-' + encodeURIComponent(occ[0].key);
          p.appendChild(a); p.appendChild(document.createTextNode(': ' + MG.list(when.slice(0, 3)) + '. ' + MG.fmtFee(s.fee) + '.')); text.appendChild(p);
        }
      }
      if (text.firstChild) li.appendChild(text); // no note and no event: no empty body, the footer sits under the name
      var stat = null;
      if (r.status === 'preorder' && r.preorderEnds) {
        var days = Math.round((MG.parseYmd(r.preorderEnds) - MG.parseYmd(today)) / 864e5), end = MG.parseYmd(r.preorderEnds);
        var endTxt = 'preorders end ' + MG.dayShort(end) + ' ' + MG.fmtDate(end);
        stat = days < 0 ? statBox('lock', null, 'Preorders closed')
          : days === 0 ? statBox('hourglass', null, 'Last day today', endTxt)
          : statBox('hourglass', days, days === 1 ? 'day left' : 'days left', endTxt);
        if (days >= 0 && days <= 3) li.setAttribute('data-soon', ''); // the box only shows on the last three days (A3 rule)
      } else if (r.status === 'out') stat = statBox('check', null, 'On the shelf');
      if (stat) { var foot = mk('div', 'rel-foot'); foot.appendChild(stat); li.appendChild(foot); }
      host.appendChild(li);
    });
  }

  /* ---------- 6. visit ---------- */
  function renderHours() {
    var order = [1, 2, 3, 4, 5, 6, 0], todayDow = now.getDay(), names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var body = $('#hours-body'), why = [];
    body.textContent = '';
    order.forEach(function (dow) {
      var w = D.store.hours[dow], tr = mk('tr'), th = mk('th'), td = mk('td'), day = mk('span', 'hrs-d', names[dow]);
      th.scope = 'row'; if (dow === todayDow) { tr.setAttribute('data-today', ''); day.appendChild(mk('span', 'tag', 'Today')); }
      th.appendChild(day);
      // a date override in the next 7 days on this weekday: the cell shows the changed hours, the reason goes under the table (F15)
      var off = (dow - todayDow + 7) % 7, ymd = MG.ymd(MG.addDays(now, off)), h = MG.hoursFor(ymd), closed = h.override ? h.closed : w.closed;
      if (closed) tr.setAttribute('data-closed', '');
      td.appendChild(document.createTextNode(h.override ? (h.closed ? 'Closed' : MG.fmtTime(h.open) + ' to ' + MG.fmtTime(h.close)) : w.closed ? 'Closed' : MG.fmtTime(w.open) + ' to ' + MG.fmtTime(w.close)));
      if (h.override) {
        td.appendChild(mk('span', 'tag tag-upd', MG.fmtDate(MG.parseYmd(ymd))));
        var n = h.note ? h.note.charAt(0).toLowerCase() + h.note.slice(1) : (h.closed ? 'closed.' : 'has different hours.');
        why.push(MG.dayShort(MG.parseYmd(ymd)) + ' ' + MG.fmtDate(MG.parseYmd(ymd)) + ' ' + n);
      }
      tr.appendChild(th); tr.appendChild(td); body.appendChild(tr);
    });
    $('#hours-why').textContent = why.join(' ');
    $('#hours-note').textContent = D.store.hoursConfirmed ? '' : 'Hours from public listings. The owners will confirm them before launch.';
  }
  function renderCommunity() {
    // built with createElement (owner rule): reviews and results are data
    var rv = D.store.reviews, rate = $('#proof-rate'), pl = $('#proof'); rate.textContent = ''; pl.textContent = '';
    var ra = mk('a', null, rv.rating + ' on ' + rv.source + ' · ' + rv.count + ' reviews'); ra.href = MG.safeUrl(rv.url); ra.target = '_blank'; ra.rel = 'noopener';
    ra.appendChild(mk('span', 'vh', ' (opens Google Maps)')); rate.appendChild(ra);
    rv.items.forEach(function (q) { var li = mk('li'); li.appendChild(mk('q', null, q.text)); li.appendChild(mk('small', null, q.name + ', ' + q.age)); pl.appendChild(li); });
    var ll = $('#lately'); ll.textContent = '';
    D.results.filter(function (r) { return r.public; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 4).forEach(function (r) {
      var s = D.series.filter(function (x) { return x.id === r.series; })[0], title = r.title || (s && s.title) || 'Event';
      var bits = [];
      if (r.headcount) bits.push(r.headcount + ' players.');
      if (r.prizes) bits.push(r.prizes);
      var li = mk('li'); li.appendChild(mk('strong', null, title)); li.appendChild(document.createTextNode(', ' + MG.fmtDate(MG.parseYmd(r.date)))); li.appendChild(mk('small', null, bits.join(' '))); ll.appendChild(li);
    });
    // TCGplayer: one quiet line under the preorders
    var tg = D.store.tcgplayer, tl = $('#tcg-line'); tl.textContent = '';
    var ta = mk('a', null, tg.line); ta.href = MG.safeUrl(tg.url); ta.target = '_blank'; ta.rel = 'noopener'; ta.appendChild(mk('span', 'vh', ' (opens TCGplayer)'));
    tl.appendChild(ta); if (tg.positive) tl.appendChild(document.createTextNode(' · ' + tg.positive));
  }

  /* ---------- chips: enhance links into in-place filters ---------- */
  function wireChips() {
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('[data-chip]');
      if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
      ev.preventDefault();
      chip = a.getAttribute('data-chip');
      history.replaceState(null, '', href({ game: chip === 'all' ? null : chip }) + '#week');
      renderChips(); renderDays(); renderLater();
      var cur = document.querySelector('.chip[aria-current="true"]');
      if (cur) { cur.focus(); cur.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    });
  }

  function init() {
    var st = MG.openStatus(now);
    U.demoBar($('#demo'), { note: 'Some seat counts, one cancellation and one change are made up.', owners: { href: keepNow('admin/index.html'), label: 'Owners: open the counter screen' } });
    U.mobileBar();
    renderOpenbar(st); renderHero(st); renderDeck();
    renderChips(); renderDays(); renderLater();
    renderCedh(); renderReleases(); renderHours(); renderCommunity(); wireChips(); keepNowLinks();
  }
  try { MG.scheme.wire(); wireVideo(); } catch (err) { if (window.console) console.error(err); }
  try { init(); } catch (err) {
    // error state: say what failed and what to do (DESIGN.md "Loading, empty, error")
    var days = document.getElementById('days');
    if (days) days.innerHTML = '<div class="empty" role="alert"><p class="empty-h">The schedule didn’t load.</p>' +
      '<p>Reload the page. If it still fails, call the shop at ' + e(D && D.store ? D.store.phone : '(215) 789-3299') + ' for tonight’s events.</p></div>';
    if (window.console) console.error(err);
  }
})();
