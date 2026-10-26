/* Mulligan Games concept: admin Events (DESIGN.md 9.3 and 9.4).
 * #            list: Coming up and Already happened
 * #new         template first: game, kind of night, then the filled-in form
 * #edit/<id>   the same form for an existing event
 * #roster/<key> one date: sign-ups, waitlist, cancelled, and results
 */
(function () {
  'use strict';
  var MG = window.MG, D = MG.data, R = MG.rules, S = MG.stock, A = MG.act, U = MG.ui, V = MG.views, e = MG.esc, $ = U.$;
  var view = $('#view'), cleanup = null, listUi = { game: 'all', q: '', open: {} };
  var now = MG.now();

  function go(hash) { location.hash = hash; }
  function destroy() { if (cleanup) { cleanup(); cleanup = null; } window.onbeforeunload = null; }

  /* ================= list ================= */
  function renderList() {
    destroy(); now = MG.now();
    var today = MG.ymd(now), far = MG.ymd(MG.addDays(now, 400));
    var q = listUi.q.toLowerCase();
    var rows = [];
    D.series.forEach(function (s) {
      if (!MG.inGame(s, listUi.game) || (q && s.title.toLowerCase().indexOf(q) === -1)) return;
      var occs = MG.occurrences(s, today, far).filter(function (o) { return o.endAt > now; });
      if (occs.length) rows.push({ s: s, next: occs[0], occs: occs });
    });
    rows.sort(function (a, b) { return a.next.startAt - b.next.startAt || a.s.title.localeCompare(b.s.title); });
    // already happened: dates in the last 45 days that had sign-ups or results
    var past = MG.allOccurrences(MG.ymd(MG.addDays(now, -45)), today).filter(function (o) {
      return o.endAt <= now && !o.cancelled && MG.inGame(o.series, listUi.game) && (!q || o.series.title.toLowerCase().indexOf(q) !== -1) &&
        (R.group(D.registrations, { series: o.series.id, date: o.date, start: o.start }).length || A.resultFor(o));
    }).sort(function (a, b) { return b.startAt - a.startAt; });

    var chips = [{ id: 'all', short: 'All games' }].concat(D.games.filter(function (g) { return g.shown; })).map(function (g) {
      var n = g.id === 'all' ? D.series.length : D.series.filter(function (s) { return MG.inGame(s, g.id); }).length;
      return '<button type="button" class="chip" data-chip="' + g.id + '"' + (g.id !== 'all' ? ' data-game="' + g.id + '"' : '') + (listUi.game === g.id ? ' aria-current="true"' : '') + '>' +
        (g.icon ? MG.icon(g.icon, 'gi') : '') + '<span>' + e(g.short) + '</span><span class="chip-n">' + n + '</span></button>';
    }).join('');

    view.innerHTML = '<div class="page-head"><h1>Events</h1><a class="btn btn-act" href="#new">' + MG.icon('plus') + 'New event</a></div>' +
      '<div class="page-tools"><nav class="chips" aria-label="Show one game">' + chips + '</nav>' +
      '<label class="fld"><span class="vh">Search events</span><input type="search" id="q" placeholder="Search events..." value="' + e(listUi.q) + '" autocomplete="off"></label></div>' +
      '<h2 class="sec-h">Coming up <span class="tag">' + rows.length + '</span></h2>' +
      (rows.length ? '<ul class="elist">' + rows.map(function (r) {
        var open = !!listUi.open[r.s.id];
        return V.eventRow(r.s, { now: now, next: r.next.cancelled ? (r.occs.filter(function (o) { return !o.cancelled; })[0] || r.next) : r.next, open: open, dates: open ? r.occs.slice(0, 8) : [] });
      }).join('') + '</ul>' : '<div class="empty lattice" role="note"><p class="empty-h">No events match.</p><p>Clear the search or pick another game, or make a new event.</p></div>') +
      '<details class="past"' + (past.length ? '' : '') + '><summary>Already happened <span class="tag">' + past.length + '</span></summary>' +
      (past.length ? '<ul class="elist">' + past.map(function (o) {
        var c = R.counts(R.group(D.registrations, { series: o.series.id, date: o.date, start: o.start })), res = A.resultFor(o), d = MG.parseYmd(o.date);
        var tool = o.series.tool && o.series.tool.name && o.series.tool.name !== 'another site' ? o.series.tool.name : null;
        var players = res && res.headcount != null ? res.headcount : c.checkedIn || c.in;
        return '<li class="prow-past" data-key="' + e(o.key) + '"><div><strong>' + e(o.series.title) + '</strong> ' + MG.gameBadge(o.series.game) + '<br><span class="rr-meta">' + e(MG.dayShort(d) + ' ' + MG.fmtDate(d)) + ', ' + e(players) + ' players' +
          (res ? '' : ', no results yet') + '</span> ' + (tool && (!res || !res.reported) ? '<span class="tag tag-warn">' + MG.icon('alert') + 'Not reported to ' + e(tool) + '</span>' : res && res.reported ? '<span class="tag tag-ok">' + MG.icon('check') + 'Reported</span>' : '') + '</div>' +
          V.btn('btn btn-2', 'data-act="roster"', 'Roster and results<span class="vh"> for ' + e(o.series.title) + ', ' + e(MG.fmtDate(d)) + '</span>') + '</li>';
      }).join('') + '</ul>' : '<p class="hint">Nothing in the last 45 days has sign-ups or results.</p>') + '</details>';
  }

  function seriesIdOf(t) { var li = t.closest('[data-series]'); return li && li.getAttribute('data-series'); }
  function onListClick(ev) {
    var t = ev.target.closest ? ev.target : ev.target.parentElement, b = t.closest('[data-act], [data-chip]');
    if (!b || !document.getElementById('view').contains(b)) return;
    if (b.hasAttribute('data-chip')) { listUi.game = b.getAttribute('data-chip'); renderList(); var cur = $('.chip[aria-current="true"]'); if (cur) cur.focus(); return; }
    var act = b.getAttribute('data-act'), sid = seriesIdOf(b), s = sid && A.seriesById(sid), row = b.closest('[data-key]'), key = row && row.getAttribute('data-key');
    if (b.tagName === 'INPUT' && act === 'shown') return;
    switch (act) {
      case 'expand': listUi.open[sid] = !listUi.open[sid]; renderList(); var again = $('[data-series="' + sid + '"] [data-act="expand"]'); if (again) again.focus(); break;
      case 'edit': go('edit/' + encodeURIComponent(sid)); break;
      case 'roster': go('roster/' + encodeURIComponent(key)); break;
      case 'restore': U.say(A.restoreDate(sid, row.getAttribute('data-date'))); break;
      case 'change': changeDialog(s, row.getAttribute('data-date')); break;
      case 'cancel-date': cancelDate(s, row.getAttribute('data-date')); break;
    }
  }
  function onListChange(ev) {
    var sw = ev.target.closest && ev.target.closest('[data-act="shown"]');
    if (sw) U.say(A.setShown(seriesIdOf(sw), sw.checked));
  }

  function changeDialog(s, date) {
    var o = MG.occurrences(s, date, date)[0]; if (!o) return;
    var d = U.dialog('Change this date: ' + s.title + ', ' + MG.fmtDate(MG.parseYmd(date)),
      '<p class="hint">Only this date changes. The rest of the series stays as it is.</p><form class="stack" novalidate>' +
      '<label class="fld"><span>Starts</span><input type="time" name="start" value="' + e(o.start) + '"></label>' +
      '<label class="fld"><span>Seats <small>(empty keeps ' + e(s.capacity || 'no limit') + ')</small></span><input name="capacity" inputmode="numeric" value="' + e(o.exception && o.exception.capacity != null ? o.exception.capacity : '') + '" aria-describedby="e-cap"><em class="err" id="e-cap" hidden></em></label>' +
      '<label class="fld"><span>Note for the website <small>(players see it as "Updated")</small></span><input name="note" value="' + e(o.note || '') + '" placeholder="Starts at 7:30 this week." autocomplete="off"></label>' +
      '<p class="dlg-acts"><button type="button" class="btn btn-2" data-close>Cancel</button><button type="submit" class="btn btn-act">Save this date</button></p></form>');
    d.querySelector('input').focus();
    d.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = ev.target, cap = f.elements.capacity.value.trim();
      if (cap !== '' && (!/^\d+$/.test(cap) || Number(cap) < 1)) { var em = f.querySelector('#e-cap'); em.textContent = 'Use a whole number, 1 or more.'; em.hidden = false; f.elements.capacity.setAttribute('aria-invalid', 'true'); return; }
      d.close(); U.say(A.changeDate(s.id, date, { start: f.elements.start.value, capacity: cap, note: f.elements.note.value }));
    });
  }
  function cancelDate(s, date) {
    var c = R.counts(R.group(D.registrations, { series: s.id, date: date })), n = c.in + c.waitlist;
    if (!n) { U.say(A.cancelDate(s.id, date)); return; }
    U.confirm({ title: 'Cancel ' + s.title + ' on ' + MG.fmtDate(MG.parseYmd(date)) + '?', body: n + (n === 1 ? ' person' : ' people') + ' signed up. They won’t be told automatically; their contacts are in the roster.',
      ok: 'Cancel this date', cancel: 'Keep it', danger: true, note: 'Note for the website (optional), for example "Closed for the holiday."' }).then(function (ans) {
      if (ans) U.say(A.cancelDate(s.id, date, ans.note));
    });
  }

  /* ================= editor ================= */
  var ed = null; // { game, tpl, form, editId }
  function renderNew() {
    destroy(); now = MG.now();
    ed = ed && ed.fresh ? ed : { game: null, form: null, fresh: true };
    var games = D.games.filter(function (g) { return g.shown; });
    var html = '<div class="page-head"><h1>New event</h1><a class="btn btn-2" href="#">Back to events</a></div>' +
      '<h2 class="step-h" id="s1">What game?</h2><ul class="tiles" aria-labelledby="s1">' + games.map(function (g) {
        return '<li><button type="button" class="tile" data-game="' + g.id + '" data-pick-game="' + g.id + '" aria-pressed="' + (ed.game === g.id) + '">' + MG.icon(g.icon) + '<span>' + e(g.short) + '</span></button></li>';
      }).join('') + '</ul>';
    if (ed.game) {
      var tpls = V.templatesFor(ed.game);
      html += '<h2 class="step-h" id="s2">What kind of event?</h2><ul class="tpls" aria-labelledby="s2">' + tpls.map(function (t) {
        return '<li><button type="button" class="tpl" data-pick-tpl="' + e(t.id) + '"><strong>' + e(t.name) + (t.yours ? '<span class="tag tag-upd">Yours</span>' : '') + '</strong><span>' + e(t.summary) + '</span></button></li>';
      }).join('') + '<li><button type="button" class="tpl" data-pick-tpl="__blank"><strong>Start blank</strong><span>Fill in everything yourself.</span></button></li></ul>';
    }
    if (ed.form) html += '<h2 class="step-h" id="s3">The details</h2><div id="editor-host"></div>';
    view.innerHTML = html;
    if (ed.form) mountEditor($('#editor-host'), ed.form, { tplName: ed.tplName });
  }
  function renderEdit(id) {
    destroy(); now = MG.now();
    var s = A.seriesById(id);
    if (!s) { view.innerHTML = '<div class="page-head"><h1>Event not found</h1><a class="btn btn-2" href="#">Back to events</a></div><div class="empty" role="alert"><p class="empty-h">That event is gone.</p><p>It may have been deleted.</p></div>'; return; }
    var f = R.formFromSeries(s, D.eventProductUse.filter(function (u) { return u.series === id; }));
    view.innerHTML = '<div class="page-head"><h1>Edit ' + e(s.title) + '</h1><a class="btn btn-2" href="#">Back to events</a></div><div id="editor-host"></div>';
    mountEditor($('#editor-host'), f, { editId: id });
  }

  function mountEditor(host, f, o) {
    host.innerHTML = '<div class="edit-grid"><div>' + V.editorForm(f, o) + '</div><aside class="edit-prev" aria-label="Preview"><h3>How the card looks</h3><details open><summary>Preview the card</summary><div id="prev" inert></div></details>' +
      (o.editId ? '<p class="hint" style="margin-top:1rem">' + V.btn('btn btn-bad', 'data-act="delete-series"', MG.icon('trash') + 'Delete this event') + '</p>' : '') + '</aside></div>';
    var form = host.querySelector('form'), dirty = false;

    function refresh(opts) {
      var cur = V.readForm(form);
      // keep the weekday in step with the first date until the owner picks one
      if (opts && opts.dateChanged && /^\d{4}-\d\d-\d\d$/.test(cur.date)) { form.elements.weekday.value = String(MG.parseYmd(cur.date).getDay()); cur.weekday = form.elements.weekday.value; }
      V.applyIfs(form, cur);
      if (opts && opts.gameChanged) {
        var fm = form.elements.format; fm.innerHTML = V.formatsFor(cur.game, '').map(function (x) { return '<option>' + e(x) + '</option>'; }).join('');
        cur.format = fm.value;
      }
      var p = V.previewHtml(cur, MG.now());
      $('#prev', host).innerHTML = p.html;
      var draft = p.built.series, sent = R.recurrenceSentence(draft);
      $('#sentence', host).textContent = sent; $('#sentence', host).hidden = !sent;
      var rt = V.reserveText(p.built, p.occ), rl = $('#reserve-line', host);
      rl.hidden = !rt; if (rt) { rl.textContent = rt.text; if (rt.short) rl.setAttribute('data-short', ''); else rl.removeAttribute('data-short'); }
    }
    function showErrors(errors) {
      U.$$('.err', form).forEach(function (n) { n.hidden = true; n.textContent = ''; });
      U.$$('[aria-invalid]', form).forEach(function (n) { n.removeAttribute('aria-invalid'); });
      var keys = Object.keys(errors), sum = $('#errsum', form);
      if (!keys.length) { sum.hidden = true; return; }
      keys.forEach(function (k) {
        var em = $('#e-' + k, form); if (em) { em.textContent = errors[k]; em.hidden = false; }
        var inp = form.elements[k]; if (inp && inp.setAttribute) inp.setAttribute('aria-invalid', 'true');
      });
      sum.innerHTML = '<h2>' + keys.length + (keys.length === 1 ? ' thing needs' : ' things need') + ' fixing</h2><ul>' + keys.map(function (k) {
        return '<li><a href="#f-' + e(k) + '" data-fix="' + e(k) + '">' + e(errors[k]) + '</a></li>';
      }).join('') + '</ul>';
      sum.hidden = false; sum.focus();
    }
    form.addEventListener('input', function (ev) {
      dirty = true; $('#sb-msg', form).textContent = 'You have unsaved changes.';
      window.onbeforeunload = function () { return 'You have unsaved changes.'; };
      refresh({ dateChanged: ev.target.name === 'date', gameChanged: ev.target.name === 'game' });
    });
    form.addEventListener('change', function (ev) { if (ev.target.name === 'repeat' || ev.target.name === 'signup' || ev.target.name === 'game' || ev.target.name === 'cutoffMode') refresh({ gameChanged: ev.target.name === 'game' }); });
    form.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-act], [data-fix]'); if (!b) return;
      var fix = b.getAttribute('data-fix');
      if (fix) { ev.preventDefault(); var tgt = form.elements[fix] || $('#f-' + fix, form); if (tgt) { (tgt.focus ? tgt : tgt.querySelector('input,select,textarea')).focus(); } return; }
      var act = b.getAttribute('data-act');
      if (act === 'add-date') { $('#date-rows', form).insertAdjacentHTML('beforeend', V.dateRow({ date: '', start: form.elements.start.value || '19:00' })); dirty = true; refresh(); }
      if (act === 'del-date') { b.closest('.drw').remove(); dirty = true; refresh(); }
      if (act === 'add-use') { $('#use-rows', form).insertAdjacentHTML('beforeend', V.useRow({ product: '', mode: 'perSeat', qty: '', seats: '' }, D.products)); refresh(); }
      if (act === 'del-use') { b.closest('.urw').remove(); refresh(); }
      if (act === 'leave') leave();
      if (act === 'save-tpl') saveTemplate();
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var cur = V.readForm(form), errors = R.validateSeries(cur);
      showErrors(errors);
      if (Object.keys(errors).length) return;
      var res = A.saveSeries(cur, o.editId);
      if (!res.ok) { showErrors(res.errors || {}); U.toast(res.msg); return; }
      dirty = false; window.onbeforeunload = null;
      var msg = res.msg, href = null;
      if (res.first && res.uses.length) {
        var lines = A.reservationLines(res.first.date, res.first.date).filter(function (l) { return l.series === res.id && l.date === res.first.date; });
        if (lines.length) {
          msg += ' Reserves ' + lines.map(function (l) { var p = A.productById(l.product); return l.qty + ' ' + (p ? p.name : 'product'); }).join(' and ') + ' for ' + MG.fmtDate(MG.parseYmd(res.first.date)) + '.';
          var days = Math.ceil((MG.parseYmd(res.first.date) - MG.parseYmd(MG.ymd(MG.now()))) / 864e5) + 1;
          href = U.href('inventory.html?look=' + Math.max(14, days));
        }
      }
      listUi.open[res.id] = true; ed = null;
      U.say({ ok: true, msg: msg, before: res.before }, { href: href, label: 'See stock' });
      go('');
    });
    function leave() {
      var done = function () { ed = null; go(''); };
      if (!dirty) return done();
      U.confirm({ title: 'Leave without saving?', body: 'Your changes to this event won’t be saved.', ok: 'Leave', cancel: 'Keep editing', danger: true }).then(function (ok) { if (ok) { dirty = false; window.onbeforeunload = null; done(); } });
    }
    function saveTemplate() {
      var cur = V.readForm(form);
      var d = U.dialog('Save as a template', '<form class="stack" novalidate><p class="hint">Next time, pick this game and this template and everything fills in.</p><label class="fld"><span>Template name</span><input name="name" value="' + e(cur.title) + '" autocomplete="off"><em class="err" id="e-tn" hidden></em></label>' +
        '<p class="dlg-acts"><button type="button" class="btn btn-2" data-close>Cancel</button><button type="submit" class="btn btn-act">Save template</button></p></form>');
      d.querySelector('input').select();
      d.querySelector('form').addEventListener('submit', function (ev) {
        ev.preventDefault();
        var res = A.saveTemplate(cur, ev.target.elements.name.value);
        if (!res.ok) { var em = $('#e-tn', d); em.textContent = res.msg; em.hidden = false; return; }
        d.close(); U.say(res);
      });
    }
    host.addEventListener('click', function (ev) {
      var del = ev.target.closest && ev.target.closest('[data-act="delete-series"]'); if (!del) return;
      var s = A.seriesById(o.editId), n = R.counts(D.registrations.filter(function (r) { return r.series === o.editId; })).in;
      U.confirm({ title: 'Delete ' + s.title + '?', body: 'This removes every date of the event' + (n ? ', and the ' + n + ' sign-ups on them' : '') + '. You can undo it for a few seconds.', ok: 'Delete the event', cancel: 'Keep it', danger: true }).then(function (ok) {
        if (ok) { dirty = false; window.onbeforeunload = null; var r = A.deleteSeries(o.editId); go(''); U.say(r); }
      });
    });
    refresh();
  }

  /* ================= roster page ================= */
  function renderRoster(key) {
    destroy(); now = MG.now();
    var occ = A.occByKey(key);
    if (!occ) { view.innerHTML = '<div class="page-head"><h1>Roster</h1><a class="btn btn-2" href="#">Back to events</a></div><div class="empty" role="alert"><p class="empty-h">We couldn’t find that date.</p><p>It may have been deleted or changed.</p></div>'; return; }
    view.innerHTML = '<div class="page-head"><h1>Roster</h1><a class="btn btn-2" href="#">Back to events</a></div><section id="roster" class="roster" aria-label="Roster"></section>' +
      '<section class="fgroup" id="results-sec" aria-labelledby="res-h" style="margin-top:1.5rem"><h2 class="fgroup-h" id="res-h">Results</h2>' +
      (occ.endAt > MG.now() && occ.startAt > MG.now() ? '<p class="hint">Fill this in after the event. Saving it also takes the stock the event used out of Inventory.</p>' : '') + '<div id="results-host"></div></section>';
    var r = V.mountRoster($('#roster'), { getKey: function () { return key; }, tabs: true, tool: true, onResults: function () { $('#results-sec').scrollIntoView({ behavior: 'smooth' }); var i = $('#results-host input'); if (i) i.focus(); } });
    cleanup = r.destroy;
    V.mountResults($('#results-host'), key, {});
  }

  /* ================= router ================= */
  function route() {
    var h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    window.scrollTo(0, 0);
    if (h === 'new') { ed = ed && ed.fresh ? ed : null; renderNew(); }
    else if (h.indexOf('edit/') === 0) renderEdit(h.slice(5));
    else if (h.indexOf('roster/') === 0) renderRoster(h.slice(7));
    else renderList();
    var main = document.getElementById('main'); if (main) main.focus({ preventScroll: true });
  }

  function init() {
    MG.shell.init();
    view.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target : ev.target.parentElement;
      var g = t.closest('[data-pick-game]'), tp = t.closest('[data-pick-tpl]');
      if (g) { ed = { game: g.getAttribute('data-pick-game'), form: null, fresh: true }; renderNew(); var first = $('.tpl'); if (first) first.focus(); return; }
      if (tp) {
        var id = tp.getAttribute('data-pick-tpl'), tpl = V.templatesFor(ed.game).filter(function (x) { return x.id === id; })[0], form;
        if (id === '__blank' || !tpl) form = R.formFromTemplate({ fields: { game: ed.game, format: MG.game(ed.game).formats[0], repeat: 'none', signup: 'walkin', fee: 0, start: '19:00' } }, V.defaultDate({ fields: { repeat: 'none' } }, MG.now()));
        else form = V.formFromTemplate(tpl, MG.now());
        ed = { game: ed.game, form: form, tplName: id === '__blank' ? null : tpl && tpl.name, fresh: true };
        renderNew(); var s3 = $('#s3'); if (s3) { s3.scrollIntoView({ behavior: 'smooth' }); var t1 = $('#editor-host input[name="title"]'); if (t1) t1.focus({ preventScroll: true }); }
        return;
      }
      if (location.hash === '' || location.hash === '#') onListClick(ev);
    });
    view.addEventListener('change', function (ev) { if (location.hash === '' || location.hash === '#') onListChange(ev); });
    view.addEventListener('input', function (ev) { if (ev.target.id === 'q') { listUi.q = ev.target.value; var pos = ev.target.selectionStart; renderList(); var q = $('#q'); q.focus(); q.setSelectionRange(pos, pos); } });
    window.addEventListener('hashchange', route);
    MG.state.subscribe(function () {
      var h = location.hash;
      if (h === '' || h === '#') renderListKeepFocus();
      else if (h.indexOf('#edit/') === 0 || h === '#new') { /* the form keeps its own state */ }
    });
    route();
  }
  function renderListKeepFocus() {
    var a = document.activeElement, id = a && a.closest && a.closest('[data-series]') && a.closest('[data-series]').getAttribute('data-series'), act = a && a.getAttribute && a.getAttribute('data-act');
    renderList();
    if (id && act) { var n = $('[data-series="' + id + '"] [data-act="' + act + '"]'); if (n) n.focus(); }
  }
  try { init(); } catch (err) {
    view.innerHTML = '<div class="empty" role="alert"><p class="empty-h">Events didn’t load.</p><p>Reload the page. Nothing was lost.</p></div>';
    if (window.console) console.error(err);
  }
})();
