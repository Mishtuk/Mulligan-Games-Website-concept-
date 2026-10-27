/* Mulligan Games concept: the events page (events.html).
 * Game chips + format filter, special events by date, repeating nights collapsed, event detail dialog,
 * sign-up dialog (name, email or phone, optional player ID, pay at the store), and "Add to calendar" (.ics built here).
 * In the real build the server renders the same markup (D11); this script then only enhances.
 */
(function () {
  'use strict';
  var MG = window.MG, D = MG.data, R = MG.rules, U = MG.ui, V = MG.views, e = MG.esc, $ = U.$;
  var now = MG.now(), today = MG.ymd(now);
  var params = new URLSearchParams(location.search);
  var game = params.get('game') || 'all', format = params.get('format') || '';
  if (game !== 'all' && !D.games.some(function (g) { return g.id === game; })) game = 'all';

  var SPECIAL_DAYS = 60;
  var attempts = []; // sign-up tries in the last minute (rate limit demo)

  function matchesFormat(s) { return !format || String(s.format).toLowerCase().indexOf(format.toLowerCase()) !== -1; }
  function passes(s) { return s.enabled !== false && MG.inGame(s, game) && matchesFormat(s); }
  function isWeekly(s) { return s.recurrence.type === 'weekly'; }
  function url(extra) {
    var p = new URLSearchParams(location.search);
    Object.keys(extra).forEach(function (k) { if (extra[k] == null || extra[k] === '') p.delete(k); else p.set(k, extra[k]); });
    var q = p.toString(); return (q ? '?' + q : 'events.html');
  }

  /* ---------- the strip, as on the front page ---------- */
  function openbar() {
    var st = MG.openStatus(now), el = $('#ob-status'), html;
    if (st.open) html = '<strong>Open now</strong> till ' + e(MG.fmtTime(st.closeHm));
    else if (!st.next) html = '<strong>Closed</strong>';
    else {
      var rel = MG.relDay(st.next.date, now), t = MG.fmtTime(st.next.hm);
      html = rel === 'today' ? '<strong>Closed now.</strong> Opens at ' + e(t) : '<strong>' + (st.today.closed ? 'Closed today.' : 'Closed now.') + '</strong> Opens ' + e(rel) + ' at ' + e(t);
    }
    el.innerHTML = '<span class="ob-dot" aria-hidden="true"></span><span>' + html + '</span>';
    if (st.open) el.setAttribute('data-open', ''); else el.removeAttribute('data-open');
  }

  /* ---------- filters ---------- */
  function renderChips() {
    var series = D.series.filter(function (s) { return s.enabled !== false; });
    var items = [{ id: 'all', short: 'All games' }].concat(D.games.filter(function (g) { return g.shown; }));
    $('#chips').innerHTML = items.map(function (g) {
      var n = series.filter(function (s) { return MG.inGame(s, g.id) && MG.occurrences(s, today, MG.ymd(MG.addDays(now, SPECIAL_DAYS))).some(function (o) { return o.endAt > now; }); }).length;
      return '<a class="chip" href="' + e(url({ game: g.id === 'all' ? null : g.id, format: null })) + '" data-chip="' + g.id + '"' + (g.id !== 'all' ? ' data-game="' + g.id + '"' : '') +
        (game === g.id ? ' aria-current="true"' : '') + '>' + (g.icon ? MG.icon(g.icon, 'gi') : '') + '<span>' + e(g.short) + '</span><span class="chip-n"><span class="vh">, </span>' + n + '<span class="vh"> events</span></span></a>';
    }).join('');
  }
  function renderFormats() {
    var list = [];
    D.games.forEach(function (g) { if (game === 'all' || g.id === game || g.family === game) g.formats.forEach(function (f) { if (list.indexOf(f) === -1) list.push(f); }); });
    var sel = $('#fmt');
    if (format && list.indexOf(format) === -1) format = '';
    sel.innerHTML = '<option value="">All formats</option>' + list.map(function (f) { return '<option' + (f === format ? ' selected' : '') + '>' + e(f) + '</option>'; }).join('');
  }
  function calLabels() {
    $('#cal-game').textContent = game === 'all' ? 'All events' : MG.game(game).short + ' events';
  }

  /* ---------- the two lists ---------- */
  function slotHtml(items, now) {
    var out = [], last;
    items.forEach(function (o) { if (last && last.start === o.start) last.items.push(o); else { last = { start: o.start, items: [o] }; out.push(last); } });
    return out.map(function (s) {
      var multi = s.items.length > 1;
      return '<div class="slot"' + (multi ? ' data-multi' : '') + '><p class="slot-t"><time>' + e(MG.fmtTime(s.start)) + '</time>' +
        (multi ? '<span class="slot-n">' + s.items.length + ' events start at ' + e(MG.fmtTime(s.start)) + '</span>' : '') + '</p><div class="slot-cards">' +
        s.items.map(function (x) { return x.html; }).join('') + '</div></div>';
    }).join('');
  }
  function alsoNote(s, occs) {
    var rest = occs.slice(1).filter(function (o) { return !o.cancelled; });
    if (!rest.length) return '';
    if (s.recurrence.type === 'dates') {
      var bits = rest.map(function (o) { var d = MG.parseYmd(o.date); return MG.dayShort(d) + ' ' + MG.fmtDate(d) + ', ' + MG.fmtTime(o.start); });
      return 'Also ' + MG.list(bits) + '.';
    }
    if (s.recurrence.type === 'nth') return 'Repeats: ' + R.recurrenceSummary(s).replace(/, .*$/, '') + '.';
    return '';
  }
  function renderSpecial() {
    var to = MG.ymd(MG.addDays(now, SPECIAL_DAYS)), byDate = {}, dates = [], count = 0;
    D.series.filter(function (s) { return passes(s) && !isWeekly(s); }).forEach(function (s) {
      var occs = MG.occurrences(s, today, to).filter(function (o) { return o.endAt > now; });
      if (!occs.length) return;
      var o = occs[0], tpl = document.createElement('template');
      tpl.innerHTML = MG.eventCard(o, now, { href: 'events.html' });
      var note = alsoNote(s, occs);
      if (note) { var p = document.createElement('p'); p.className = 'ev-also'; p.textContent = note; var when = tpl.content.querySelector('.ev-when'); if (when) when.insertAdjacentElement('afterend', p); }
      (byDate[o.date] = byDate[o.date] || []).push({ start: o.start, html: tpl.innerHTML, title: s.title });
      if (dates.indexOf(o.date) === -1) dates.push(o.date);
      count++;
    });
    dates.sort();
    $('#special').innerHTML = dates.map(function (ymd) {
      var d = MG.parseYmd(ymd), items = byDate[ymd].sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : a.title.localeCompare(b.title); });
      return '<section class="day" id="d-' + ymd + '" aria-labelledby="dh-' + ymd + '"><h3 class="day-h" id="dh-' + ymd + '"><span class="day-dia" aria-hidden="true"><span>' + d.getDate() + '</span></span>' +
        '<span class="day-name">' + e(MG.dayShort(d) + ' ' + MG.fmtDate(d)) + '</span>' + (MG.relDay(ymd, now) === 'today' ? '<span class="tag tag-today">Today</span>' : '') + '</h3>' +
        '<div class="slots">' + slotHtml(items, now) + '</div></section>';
    }).join('');
    $('#special-wrap').hidden = !count;
    return count;
  }
  function renderWeekly() {
    var to = MG.ymd(MG.addDays(now, 70)), html = '', count = 0, todayDow = now.getDay();
    [1, 2, 3, 4, 5, 6, 0].forEach(function (dow) {
      var list = D.series.filter(function (s) { return passes(s) && isWeekly(s) && s.recurrence.day === dow; })
        .sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : a.title.localeCompare(b.title); });
      var cards = list.map(function (s) { return V.weeklyCard(s, now, today, to); }).filter(Boolean);
      var closed = D.store.hours[dow].closed;
      var name = R.DAYS[dow];
      if (!cards.length && (closed ? game !== 'all' || format : true)) return;
      count += cards.length;
      html += '<section class="wk' + (closed && !cards.length ? ' wk-closed' : '') + '" aria-labelledby="wk-' + dow + '"><h3 class="wk-name" id="wk-' + dow + '">' + e(name) +
        (dow === todayDow ? ' <span class="tag tag-today">Today</span>' : '') + '</h3>' +
        (cards.length ? '<div class="wk-cards">' + cards.join('') + '</div>' : '<p class="day-skip">The shop is closed.</p>') + '</section>';
    });
    $('#weekly').innerHTML = html;
    $('#weekly-wrap').hidden = !count;
    return count;
  }
  /* R16: everything on today's date first, specials and weekly nights together, in time order */
  function renderToday() {
    var occs = MG.allOccurrences(today, today).filter(function (o) { return passes(o.series) && o.endAt > now; });
    var host = $('#today'), wrap = $('#today-wrap');
    host.textContent = '';
    var block = V.todayBlock(occs, now, { href: 'events.html' });
    wrap.hidden = !block;
    if (!block) return;
    $('#today-h').textContent = now.getHours() >= 17 ? 'Tonight' : 'Today';
    host.appendChild(block);
  }
  function renderEmpty(total) {
    var host = $('#ep-empty');
    if (total) { host.innerHTML = ''; host.hidden = true; return; }
    host.hidden = false;
    var g = game === 'all' ? null : MG.game(game), label = (g ? g.short + ' ' : '') + (format ? format + ' ' : '');
    var future = MG.allOccurrences(MG.ymd(MG.addDays(now, SPECIAL_DAYS + 1)), MG.ymd(MG.addDays(now, 400))).filter(function (o) { return !o.cancelled && passes(o.series); })[0];
    // a shop photo beside the words: the room is open for free play even when nothing is scheduled
    host.innerHTML = '<div class="empty empty-photo" role="note"><img src="img/social/staff-corgi-interior-800.webp" width="512" height="640" alt="A Mulligan Games staff member holding a corgi in the play room" loading="lazy">' +
      '<div class="empty-in"><p class="empty-h">No ' + e(label.trim() || 'events') + ' events right now.</p>' +
      (future ? '<p>The next one is ' + e(future.series.title) + ' on ' + e(MG.dayName(MG.parseYmd(future.date)) + ', ' + MG.fmtDate(MG.parseYmd(future.date))) + ' at ' + e(MG.fmtTime(future.start)) + '.</p>'
        : '<p>Nothing is scheduled yet. Ask at the counter or watch the Discord.</p>') +
      '<p>Free play is on all day, every day we’re open.</p>' +
      '<a class="btn btn-2" href="' + e(url({ game: null, format: null })) + '" data-chip="all">Show all games</a></div></div>';
  }
  function render() {
    renderChips(); renderFormats(); calLabels();
    var total = renderSpecial() + renderWeekly();
    renderToday();
    renderEmpty(total);
    U.announce((game === 'all' ? 'Showing all games' : 'Showing ' + MG.game(game).short) + (format ? ', ' + format : '') + ': ' + total + (total === 1 ? ' event.' : ' events.'));
    var open = $('#det-dlg[open]');
    if (open) fillDetail(); // seat counts may have changed
  }

  /* ---------- event detail dialog ---------- */
  var detKey = null, detMode = 'detail', baseTitle = document.title;
  function fillDetail() {
    if (detMode !== 'detail') return; // the sign-up form or its confirmation is showing: leave it alone
    var occ = detKey && window.MG.act.occByKey(detKey), body = $('#det-body');
    if (!occ) { body.innerHTML = '<div class="empty" role="note"><p class="empty-h">We couldn’t find that event.</p><p>It may have been changed. Pick another from the list.</p></div>'; return; }
    body.innerHTML = V.detail(occ, now);
  }
  function openDetail(key, push) {
    var dlg = $('#det-dlg');
    detKey = key; detMode = 'detail';
    fillDetail();
    var occ = MG.act.occByKey(key);
    if (occ) document.title = occ.series.title + ', ' + MG.dayShort(MG.parseYmd(occ.date)) + ' ' + MG.fmtDate(MG.parseYmd(occ.date)) + ', ' + MG.fmtTime(occ.start) + ' · Mulligan Games';
    if (!dlg.open) dlg.showModal();
    if (push) history.replaceState(null, '', location.pathname + location.search + '#e-' + encodeURIComponent(key));
    $('#det-x').focus();
  }
  function closeDetail() { document.title = baseTitle; history.replaceState(null, '', location.pathname + location.search); detKey = null; detMode = 'detail'; }
  function fromHash() {
    var m = /^#e-(.+)$/.exec(location.hash), su = /^#su-(.+)$/.exec(location.hash);
    if (su) { try { openSignup(decodeURIComponent(su[1]), false); } catch (err) { /* bad hash: ignore */ } }
    else if (m) { try { openDetail(decodeURIComponent(m[1]), false); } catch (err) { /* bad hash: ignore */ } }
    else if ($('#det-dlg').open) { $('#det-dlg').close(); }
  }

  /* ---------- calendar files ---------- */
  function icsFor(occs, calName) {
    var s = D.store.address;
    return R.ics(occs, {
      now: new Date(), calName: calName, location: 'Mulligan Games, ' + s.street + ', ' + s.city + ', ' + s.region + ' ' + s.zip,
      url: function (o) { return location.href.split('#')[0].split('?')[0] + '#e-' + encodeURIComponent(o.key); }
    });
  }
  function downloadOne(key) {
    var occ = MG.act.occByKey(key); if (!occ) return;
    U.download(R.icsName(occ), icsFor([occ], occ.series.title), 'text/calendar');
    U.toast('Calendar file saved: ' + R.icsName(occ));
  }
  function downloadAll() {
    var occs = MG.allOccurrences(today, MG.ymd(MG.addDays(now, 90))).filter(function (o) { return passes(o.series) && o.endAt > now; });
    var name = game === 'all' ? 'mulligan-events.ics' : 'mulligan-' + game + '-events.ics';
    U.download(name, icsFor(occs, game === 'all' ? 'Mulligan Games events' : 'Mulligan Games ' + MG.game(game).short + ' events'), 'text/calendar');
    U.toast(occs.length + ' events saved to ' + name + '.');
  }

  /* ---------- sign-up dialog ---------- */
  // inDetail: the form replaces the detail dialog's body (Back to details returns); otherwise it opens by itself (#su-<key> or a card button)
  function openSignup(key, inDetail) {
    var occ = MG.act.occByKey(key); if (!occ) return;
    var st = MG.seatState(occ, MG.now());
    if (['open', 'few', 'needs', 'waitlist'].indexOf(st.state) === -1) { U.toast('Sign-ups are closed for this one.'); return; }
    var title = st.state === 'waitlist' ? 'Join the waitlist' : 'Sign up', dlg, form;
    if (inDetail) {
      dlg = $('#det-dlg'); detMode = 'form';
      dlg.querySelector('.dlg-h').textContent = title;
      var body = $('#det-body'); body.textContent = '';
      var back = document.createElement('button'); back.type = 'button'; back.className = 'btn btn-2'; back.setAttribute('data-back', ''); back.textContent = 'Back to details';
      var p = document.createElement('p'); p.className = 'su-back'; p.appendChild(back); body.appendChild(p);
      var tpl = document.createElement('template'); tpl.innerHTML = V.signupForm(occ, st); body.appendChild(tpl.content);
    } else {
      if ($('#det-dlg').open) $('#det-dlg').close();
      dlg = U.dialog(title, V.signupForm(occ, st), { cls: 'dlg-su', onClose: function () { if (/^#su-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); } });
    }
    form = dlg.querySelector('form');
    form.querySelector('input[name="name"]').focus();
    form.addEventListener('submit', function (ev) { ev.preventDefault(); submitSignup(dlg, form, occ); });
  }
  function fieldErr(form, name, msg) {
    var inp = form.querySelector('[name="' + name + '"]'), em = form.querySelector('#e-' + name);
    if (!inp || !em) return;
    em.textContent = msg || ''; em.hidden = !msg;
    if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
  }
  function submitSignup(dlg, form, occ) {
    var data = {}; ['name', 'email', 'phone', 'playerId', 'website'].forEach(function (k) { var i = form.elements[k]; data[k] = i ? i.value : ''; });
    ['name', 'email', 'phone'].forEach(function (k) { fieldErr(form, k, ''); });
    var banner = form.querySelector('.su-err'); banner.hidden = true;
    var t = Date.now(); attempts = attempts.filter(function (x) { return t - x < 60000; });
    if (attempts.length >= 6) { banner.textContent = 'Too many tries. Wait a minute and try again.'; banner.hidden = false; return; }
    attempts.push(t);
    var errs = R.validateSignup(data);
    if (Object.keys(errs).length) {
      Object.keys(errs).forEach(function (k) { fieldErr(form, k, errs[k]); });
      var first = form.querySelector('[aria-invalid="true"]'); if (first) first.focus();
      return;
    }
    if (navigator.onLine === false) { banner.textContent = 'Couldn’t reach the shop’s site. Your seat isn’t held yet. Try again.'; banner.hidden = false; return; }
    var btn = form.querySelector('.su-go'); btn.disabled = true; btn.querySelector('.spin').hidden = false;
    btn.querySelector('.su-go-t').textContent = form.dataset.expected === 'waitlist' ? 'Adding you...' : 'Holding your seat...';
    setTimeout(function () {
      var res = MG.act.register(form.dataset.key, data, { expected: form.dataset.expected });
      btn.disabled = false; btn.querySelector('.spin').hidden = true;
      btn.querySelector('.su-go-t').textContent = form.dataset.expected === 'waitlist' ? 'Join the waitlist' : 'Hold my seat';
      if (res.bot) { res = { ok: true, status: 'in', seat: 1, position: 1 }; }
      if (!res.ok) {
        if (res.errors) { Object.keys(res.errors).forEach(function (k) { fieldErr(form, k, res.errors[k]); }); var f = form.querySelector('[aria-invalid="true"]'); if (f) f.focus(); return; }
        banner.textContent = res.message || res.msg || 'That didn’t work. Try again.'; banner.hidden = false; banner.focus && banner.setAttribute('tabindex', '-1'); banner.focus(); return;
      }
      var occNow = MG.act.occByKey(form.dataset.key) || occ;
      dlg.querySelector('.dlg-h').textContent = res.status === 'in' ? 'You’re in' : 'You’re on the waitlist';
      if (dlg.id === 'det-dlg') detMode = 'done';
      var bd = dlg.querySelector('.dlg-body'); bd.textContent = ''; bd.appendChild(V.signupDone(occNow, res, { email: data.email }));
      var done = dlg.querySelector('.su-done'); if (done) done.focus();
    }, 450);
  }

  /* ---------- wiring ---------- */
  function wire() {
    document.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target : ev.target.parentElement;
      var chip = t.closest('[data-chip]');
      if (chip && !ev.metaKey && !ev.ctrlKey && !ev.shiftKey) {
        ev.preventDefault(); game = chip.getAttribute('data-chip'); format = '';
        history.replaceState(null, '', url({ game: game === 'all' ? null : game, format: null })); render();
        var cur = document.querySelector('.chip[aria-current="true"]'); if (cur) cur.focus();
        return;
      }
      var su = t.closest('[data-signup]'); if (su) { openSignup(su.getAttribute('data-signup'), !!t.closest('#det-dlg')); return; }
      if (t.closest('[data-back]')) { detMode = 'detail'; fillDetail(); $('#det-x').focus(); return; }
      var cl = t.closest('[data-copy-link]');
      if (cl) { U.copy(cl.getAttribute('data-copy-link'), function (ok) { U.toast(ok ? 'Link copied.' : 'Couldn’t copy. Select the link and copy it.'); }); return; }
      var suLink = t.closest('a[href*="#su-"]');
      if (suLink && /^events.html/.test(suLink.getAttribute('href'))) { ev.preventDefault(); openSignup(decodeURIComponent(suLink.getAttribute('href').split('#su-')[1]), false); return; }
      var ics = t.closest('[data-ics-one]'); if (ics) { downloadOne(ics.getAttribute('data-ics-one')); return; }
      var cp = t.closest('[data-copy]');
      if (cp) { U.copy(cp.getAttribute('data-copy'), function (ok) { U.toast(ok ? 'Event code copied.' : 'Couldn’t copy. Select the code and copy it.'); }); return; }
      if (t.closest('#cal-all')) { downloadAll(); $('#cal-menu').open = false; return; }
      var cardLink = t.closest('.ev-title a, .ev .btn[href^="events.html"]');
      if (cardLink && /#e-/.test(cardLink.getAttribute('href'))) { ev.preventDefault(); openDetail(decodeURIComponent(cardLink.getAttribute('href').split('#e-')[1]), true); }
      var dateLink = t.closest('.det-dates a');
      if (dateLink) { ev.preventDefault(); openDetail(decodeURIComponent(dateLink.getAttribute('href').split('#e-')[1]), true); }
    });
    $('#fmt').addEventListener('change', function () { format = this.value; history.replaceState(null, '', url({ format: format || null })); render(); });
    var dlg = $('#det-dlg');
    dlg.addEventListener('click', function (ev) { if (ev.target === dlg || ev.target.closest('#det-x') || ev.target.closest('[data-close]')) { document.title = baseTitle; dlg.close(); } });
    dlg.addEventListener('close', closeDetail);
    window.addEventListener('hashchange', fromHash);
    MG.scheme.wire();
    MG.state.subscribe(function () { now = MG.now(); render(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && $('#cal-menu').open) $('#cal-menu').open = false; });
  }

  function init() {
    U.demoBar($('#demo'), { note: 'Sign up for a night, then open the admin Today screen to find your name. Your clicks are saved in this browser only.',
      owners: { href: U.href('admin/index.html'), label: 'Owners: open the counter screen' } });
    U.mobileBar();
    Array.prototype.forEach.call(document.querySelectorAll('.site-head a[href], .site-foot a[href]'), function (a) { var h = a.getAttribute('href'); if (/^[\w\/-]+\.html(#.*)?$/.test(h)) a.setAttribute('href', U.href(h)); }); // keep ?now= like the front page
    var pb = $('#print-btn'); if (pb) pb.addEventListener('click', function () { window.print(); });
    $('#loading').remove();
    openbar(); render(); wire(); fromHash();
    // the admin link keeps the demo clock
    var adm = $('#adm-link'); if (adm) adm.href = U.href('admin/index.html');
  }
  try { init(); } catch (err) {
    var host = document.getElementById('special');
    if (host) host.innerHTML = '<div class="empty" role="alert"><p class="empty-h">The schedule didn’t load.</p><p>Reload the page. If it still fails, call the shop at ' + e(D.store.phone) + ' for tonight’s events.</p></div>';
    if (window.console) console.error(err);
  }
})();
