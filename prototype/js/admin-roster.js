/* Mulligan Games concept: the roster (check-in list) and the results form.
 * Used by admin Today and by the roster page in admin Events. Behaviour only; HTML comes from admin-views.js.
 * Every name and note is escaped by the builders (MG.esc) or set with textContent here.
 */
(function () {
  'use strict';
  var MG = window.MG, D = MG.data, R = MG.rules, S = MG.stock, A = MG.act, U = MG.ui, V = MG.views, e = MG.esc;

  function statChip(icon, text, cls, href) { var inner = MG.icon(icon) + '<span>' + e(text) + '</span>'; return '<li class="rstat' + (cls ? ' ' + cls : '') + '">' + (href ? '<a class="rstat-a" href="' + e(href) + '">' + inner + '</a>' : inner) + '</li>'; }

  /* ---------- the roster ---------- */
  V.mountRoster = function (host, o) {
    var ui = { q: '', tab: 'in', shown: {}, flash: {}, seen: {}, refocus: null };
    var idLabel = null;

    function occ() { return A.occByKey(o.getKey()); }

    function counterHtml(oc) {
      var s = oc.series, n = A.headcountOf(oc), regs = A.regs(oc).filter(function (r) { return r.status === 'in'; }), st = MG.seatState(oc, MG.now());
      var ext = s.signup === 'external' && st.count ? '<p class="hint">' + e(st.count) + ' registered on ' + e((s.tool && s.tool.name) || 'the other site') + '. Count who actually shows up.</p>' : '';
      return '<div class="counter"><h3 id="cnt-h">Players tonight</h3>' + ext +
        '<div class="cnt" role="group" aria-labelledby="cnt-h">' + V.btn('stepper stepper-lg', 'data-act="cnt-minus" aria-label="One fewer player"', MG.icon('minus')) +
        '<output class="cnt-n" aria-live="polite">' + n + '</output>' + V.btn('stepper stepper-lg', 'data-act="cnt-plus" aria-label="One more player"', MG.icon('plus')) + '</div>' +
        '<p class="hint">Tap + as people sit down. The number goes into the results.</p>' +
        '<form class="walkbar walkbar-inline" data-act="walkform"><label class="fld"><span>Add a name <small>(optional, for the results)</small></span><input name="name" autocomplete="off" placeholder="Name"></label>' +
        '<button type="submit" class="btn btn-2" value="auto">Add name</button></form>' +
        (regs.length ? '<ul class="namelist">' + regs.map(function (r) {
          return '<li data-reg="' + e(r.id) + '"><span>' + e(r.name) + '</span>' + V.btn('x-btn', 'data-act="cancel" aria-label="Remove ' + e(r.name) + '"', MG.icon('x')) + '</li>';
        }).join('') + '</ul>' : '') + '</div>';
    }

    function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
    function walkBar(oc, full) {
      var cap = MG.capOf(oc), c = R.counts(A.regs(oc));
      var f = el('form', 'walkbar'); f.setAttribute('data-act', 'walkform');
      var lab = el('label', 'fld walk-fld'), sp = el('span', 'vh', 'Walk-in name'), inp = el('input'); inp.name = 'name'; inp.setAttribute('autocomplete', 'off'); inp.placeholder = 'Walk-in name';
      lab.appendChild(sp); lab.appendChild(inp); f.appendChild(lab);
      function sub(cls, val, text) { var b = el('button', 'btn ' + cls, text); b.type = 'submit'; b.value = val; f.appendChild(b); }
      if (full) { sub('btn-act', 'waitlist', 'Add to waitlist'); sub('btn-2', 'over', 'Seat anyway (' + (c.in + 1) + ' of ' + cap + ')'); }
      else { sub('btn-act', 'auto', ''); var ab = f.lastChild; ab.setAttribute('aria-label', 'Add and check in'); ab.appendChild(el('span', '', 'Add')); ab.appendChild(el('span', 'wb-long', ' and check in')); }
      return f;
    }

    function render() {
      var oc = occ();
      if (!oc) { host.innerHTML = '<div class="empty" role="note"><p class="empty-h">We couldn’t find that event.</p><p>It may have been deleted.</p></div>'; return; }
      var s = oc.series, cap = MG.capOf(oc), regs = A.regs(oc), c = R.counts(regs), fee = s.fee;
      idLabel = R.playerIdLabel(s.tool);
      if (!ui.init) { D.registrations.forEach(function (r) { if (r.promotedAt) ui.seen[r.id] = 1; }); ui.init = true; }
      regs.forEach(function (r) { if (r.promotedAt && !ui.seen[r.id]) { ui.seen[r.id] = 1; ui.flash[r.id] = true; } });
      var rosterMode = s.signup === 'here' || s.signup === 'counter' || regs.length > 0 && s.signup !== 'walkin' && s.signup !== 'external';
      var head = '';
      if (!o.noHeader) {
        var d = MG.parseYmd(oc.date);
        head = '<div class="roster-head"><h2 class="roster-title">' + e(s.title) + '</h2><p class="roster-sub">' + e(MG.fmtLongDate(d) + ', ' + MG.fmtTime(oc.start) + ', ' + MG.fmtFee(s.fee)) + '</p></div>';
      }
      var runKey = 'run:' + oc.key, started = MG.now() >= oc.startAt, ran = !!D.headcounts[runKey];
      var min = R.minToRun(started ? c.checkedIn : c.in, s.minPlayers), lowWarn = !min.ok && !oc.cancelled && !ran;
      var stats = '<ul class="rstats">' + (rosterMode ? statChip('check', 'Checked in ' + c.checkedIn + ' of ' + c.in, '', '#in-' + oc.key) + (fee !== 0 ? statChip('credit', 'Paid ' + c.paid) : '') +
        (cap ? statChip('seat', c.in + ' of ' + cap + ' seats') : '') + (c.waitlist ? statChip('hourglass', c.waitlist + ' on the waitlist', 'rstat-wait', '#wait-' + oc.key) : '') +
        (lowWarn ? statChip('alert', started ? 'Started with ' + min.taken + ' (min ' + min.min + ')' : 'Needs ' + min.short + ' more to run', 'rstat-warn') : '') : statChip('users', 'Players ' + A.headcountOf(oc))) + '</ul>' +
        (rosterMode && lowWarn && started ? '<p class="rtools rstart-acts">' + V.btn('btn btn-2', 'data-act="runit"', 'Run it') + V.btn('btn btn-2', 'data-act="cancel-date"', 'Cancel this date') + '</p>' : '');
      var tool = '';
      if (o.tool && s.tool && s.tool.name && s.tool.name !== 'another site') {
        tool = '<p class="roster-tool">Official tool: ' + (s.tool.url ? '<a href="' + e(MG.safeUrl(s.tool.url)) + '" target="_blank" rel="noopener">' + e(s.tool.name) + MG.icon('external', 'ic-ext') + '<span class="vh"> (opens ' + e(s.tool.name) + ')</span></a>' : e(s.tool.name)) +
          (s.tool.code ? ' Event code <strong class="code">' + e(s.tool.code) + '</strong> ' + V.btn('btn btn-2 btn-sm', 'data-act="copy" data-v="' + e(s.tool.code) + '"', MG.icon('copy') + 'Copy') : '') + '</p>';
      }
      var body = '';
      if (oc.cancelled) body = '<div class="empty" role="note"><p class="empty-h">This date is cancelled.</p><p>' + e(oc.note || '') + '</p></div>';
      else if (!rosterMode) body = counterHtml(oc);
      else {
        var q = ui.q.toLowerCase(), match = function (r) { return !q || r.name.toLowerCase().indexOf(q) !== -1 || String(r.playerId || '').indexOf(q) !== -1; };
        var ins = regs.filter(function (r) { return r.status === 'in' && match(r); }).sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
        var wl = R.waitlistOf(regs).filter(match), off = regs.filter(function (r) { return (r.status === 'cancelled' || r.status === 'noshow') && match(r); });
        var tabs = o.tabs ? '<div class="tabs" role="group" aria-label="Show"><button type="button" class="tab" data-act="tab" data-v="in" aria-pressed="' + (ui.tab === 'in') + '">Signed up ' + c.in + '</button>' +
          '<button type="button" class="tab" data-act="tab" data-v="waitlist" aria-pressed="' + (ui.tab === 'waitlist') + '">Waitlist ' + c.waitlist + '</button>' +
          '<button type="button" class="tab" data-act="tab" data-v="cancelled" aria-pressed="' + (ui.tab === 'cancelled') + '">Cancelled ' + c.cancelled + '</button></div>' : '';
        var showIn = !o.tabs || ui.tab === 'in', showWl = !o.tabs || ui.tab === 'waitlist', showOff = o.tabs && ui.tab === 'cancelled';
        var rows = '';
        if (showIn) rows += ins.length ? '<ul class="rlist" id="in-' + e(oc.key) + '" tabindex="-1">' + ins.map(function (r) {
          return V.regRow(r, { fee: fee, idLabel: idLabel, showContact: ui.shown[r.id], flash: ui.flash[r.id], promoted: ui.flash[r.id] && r.promotedAt });
        }).join('') + '</ul>' : '<p class="hint">' + (q ? 'Nobody by that name.' : 'No sign-ups yet. Share the event link or add a walk-in.') + '</p>';
        if (showWl && (wl.length || o.tabs)) rows += '<h3 class="rl-h" id="wait-' + e(oc.key) + '" tabindex="-1">Waitlist</h3>' + (wl.length ? '<ul class="rlist">' + wl.map(function (r) { return V.waitRow(r, { showContact: ui.shown[r.id] }); }).join('') + '</ul>' : '<p class="hint">Nobody is waiting.</p>');
        if (showOff) rows += off.length ? '<ul class="rlist">' + off.map(V.cancelledRow).join('') + '</ul>' : '<p class="hint">Nobody has cancelled.</p>';
        body = '<div class="rtools"><label class="fld rsearch"><span class="vh">Find a name</span><input type="search" data-act="search" placeholder="Find a name..." value="' + e(ui.q) + '" autocomplete="off"></label>' +
          V.btn('btn btn-2', 'data-act="results"', MG.icon('pencil') + 'Enter results') + '</div>' + tabs + rows;
        body += '<div data-walkslot></div>';
      }
      if (!rosterMode && !oc.cancelled) body += '<p class="rtools rtools-end">' + V.btn('btn btn-2', 'data-act="results"', MG.icon('pencil') + 'Enter results') + '</p>';
      host.innerHTML = head + tool + stats + body;
      var slot = host.querySelector('[data-walkslot]'); if (slot) slot.replaceWith(walkBar(oc, !!cap && c.in >= cap));
      // put focus back where the person was working
      if (ui.refocus) {
        var el = ui.refocus.q === 'search' ? host.querySelector('[data-act="search"]') : host.querySelector('[data-reg="' + ui.refocus.id + '"] [data-act="' + ui.refocus.act + '"]') || (ui.refocus.q && host.querySelector(ui.refocus.q));
        if (el) { el.focus(); if (ui.refocus.q === 'search' && el.setSelectionRange) { var l = el.value.length; el.setSelectionRange(l, l); } }
        ui.refocus = null;
      }
      var flashing = Object.keys(ui.flash);
      if (flashing.length) setTimeout(function () { ui.flash = {}; U.$$('[data-flash]', host).forEach(function (n) { n.removeAttribute('data-flash'); }); }, 1700);
    }

    function runIt() {
      var oc = occ(); if (!oc) return;
      var before = MG.state.snapshot(); D.headcounts['run:' + oc.key] = true; MG.state.save(); MG.state.notify();
      U.toast(oc.series.title + ' will run.', { undo: before });
    }
    function cancelThisDate() {
      var oc = occ(); if (!oc) return;
      var c = R.counts(A.regs(oc)), n = c.in + c.waitlist;
      U.confirm({ title: 'Cancel ' + oc.series.title + ' on ' + MG.fmtDate(MG.parseYmd(oc.date)) + '?', body: n + (n === 1 ? ' person' : ' people') + ' signed up. They won’t be told automatically; their contacts are in the roster.',
        ok: 'Cancel this date', cancel: 'Keep it', danger: true, note: 'Note for the website (optional), for example "Closed for the holiday."' }).then(function (ans) {
        if (ans) U.say(A.cancelDate(oc.series.id, oc.date, ans.note));
      });
    }
    function regIdOf(t) { var li = t.closest('[data-reg]'); return li && li.getAttribute('data-reg'); }
    // the action has already run (and redrawn the list through the state subscription); say what happened
    function run(res) {
      U.say(res);
      if (!res.ok) render(); // keep the screen in step even when nothing changed
    }
    var KEEP = { checkin: 'checkin', pay: 'pay', movein: 'movein', up: 'movein', down: 'movein', contact: 'contact' };

    host.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target : ev.target.parentElement, b = t.closest('[data-act]');
      var jump = t.closest('a.rstat-a');
      if (jump) { // stat chips jump to their lists; the page hash belongs to Today / the events router
        ev.preventDefault();
        var tid = jump.getAttribute('href').slice(1);
        if (o.tabs) { var want = tid.indexOf('wait-') === 0 ? 'waitlist' : 'in'; if (ui.tab !== want) { ui.tab = want; render(); } }
        var tg = document.getElementById(tid); if (tg) { tg.scrollIntoView({ block: 'start' }); tg.focus({ preventScroll: true }); }
        return;
      }
      if (!b || b.tagName === 'FORM' || b.tagName === 'INPUT' || b.tagName === 'SELECT') return;
      var act = b.getAttribute('data-act'), id = regIdOf(b), reg = id && A.regById(id);
      var menu = b.closest('details.menu'); if (menu) menu.open = false;
      ui.refocus = id && KEEP[act] && !menu ? { id: id, act: KEEP[act] } : null;
      switch (act) {
        case 'checkin': run(A.checkIn(id, !reg.checkedIn)); break;
        case 'pay': run(A.setPayment(id, b.getAttribute('data-v'))); break;
        case 'cancel': ui.refocus = null; run(A.cancelReg(id)); break;
        case 'movein': run(A.moveIn(id)); break;
        case 'up': run(A.moveWaitlist(id, -1)); break;
        case 'down': run(A.moveWaitlist(id, 1)); break;
        case 'contact': ui.shown[id] = !ui.shown[id]; render(); break;
        case 'edit': editDialog(reg); break;
        case 'tab': ui.tab = b.getAttribute('data-v'); render(); break;
        case 'runit': runIt(); break;
        case 'cancel-date': cancelThisDate(); break;
        case 'results': if (o.onResults) o.onResults(o.getKey()); break;
        case 'cnt-plus': ui.refocus = { q: '[data-act="cnt-plus"]' }; run(A.headcount(o.getKey(), A.headcountOf(occ()) + 1)); break;
        case 'cnt-minus': ui.refocus = { q: '[data-act="cnt-minus"]' }; run(A.headcount(o.getKey(), A.headcountOf(occ()) - 1)); break;
        case 'copy': U.copy(b.getAttribute('data-v'), function (ok) { U.toast(ok ? 'Event code copied.' : 'Couldn’t copy. Select the code and copy it.'); }); break;
      }
    });
    host.addEventListener('change', function (ev) {
      var sel = ev.target.closest && ev.target.closest('[data-act="paysel"]');
      if (sel) { var id = regIdOf(sel); ui.refocus = { id: id, act: 'paysel' }; run(A.setPayment(id, sel.value)); }
    });
    host.addEventListener('input', function (ev) {
      var inp = ev.target.closest && ev.target.closest('[data-act="search"]');
      if (inp) { ui.q = inp.value; ui.refocus = { q: 'search' }; render(); }
    });
    host.addEventListener('submit', function (ev) {
      var f = ev.target.closest('[data-act="walkform"]'); if (!f) return;
      ev.preventDefault();
      var mode = (ev.submitter && ev.submitter.value) || 'auto', name = f.elements.name.value, oc = occ();
      if (!name.trim()) { U.toast('Type a name first.'); f.elements.name.focus(); return; }
      var cap = oc && MG.capOf(oc), full = !!cap && R.counts(A.regs(oc)).in >= cap;
      if (mode === 'auto' && full) mode = 'waitlist'; // Enter in the name field: the safe choice
      if (mode === 'over') {
        var n = R.counts(A.regs(oc)).in + 1;
        U.confirm({ title: 'Seat anyway?', body: name.trim() + ' takes seat ' + n + ' of ' + cap + '. The event is over its limit.', ok: 'Seat anyway', cancel: 'Go back' }).then(function (yes) {
          if (yes) walk(f, name, 'over'); else { var i = host.querySelector('.walkbar input[name="name"]'); if (i) i.focus(); }
        });
        return;
      }
      walk(f, name, mode);
    });
    function walk(f, name, mode) {
      ui.refocus = { q: '.walkbar input[name="name"]' };
      var res = A.walkIn(o.getKey(), name, mode);
      if (res.ok) { ui.refocus = { q: '.walkbar input[name="name"]' }; }
      else if (res.error === 'full') { U.toast(name.trim() + ': the event is full. Choose waitlist or seat anyway.'); ui.refocus = null; render(); var inp = host.querySelector('.walkbar input[name="name"]'); if (inp) { inp.value = name; } return; }
      else if (res.error === 'dup' && res.existing) { U.toast(res.msg); ui.q = res.existing.name; render(); return; }
      U.say(res);
      if (res.ok) { var ni = host.querySelector('.walkbar input[name="name"]'); if (ni) ni.focus(); }
    }
    document.addEventListener('click', function (ev) { // close other open row menus
      U.$$('details.menu[open]', host).forEach(function (m) { if (!m.contains(ev.target)) m.open = false; });
    });

    function editDialog(reg) {
      if (!reg) return;
      var d = U.dialog('Edit ' + reg.name, '<form class="stack" novalidate><label class="fld"><span>Name</span><input name="name" value="' + e(reg.name) + '" autocomplete="off"><em class="err" id="e-name" hidden></em></label>' +
        '<label class="fld"><span>Email or phone</span><input name="contact" value="' + e(reg.contact) + '" autocomplete="off"></label>' +
        (idLabel ? '<label class="fld"><span>' + e(idLabel) + '</span><input name="playerId" value="' + e(reg.playerId || '') + '" autocomplete="off"></label>' : '') +
        '<p class="dlg-acts"><button type="button" class="btn btn-2" data-close>Cancel</button><button type="submit" class="btn btn-act">Save</button></p></form>');
      d.querySelector('input').focus();
      d.querySelector('form').addEventListener('submit', function (ev) {
        ev.preventDefault();
        var f = ev.target, res = A.editReg(reg.id, { name: f.elements.name.value, contact: f.elements.contact.value, playerId: f.elements.playerId ? f.elements.playerId.value : reg.playerId });
        if (!res.ok) { var em = f.querySelector('#e-name'); em.textContent = res.msg; em.hidden = false; f.elements.name.setAttribute('aria-invalid', 'true'); return; }
        d.close(); U.say(res);
      });
    }

    var unsub = MG.state.subscribe(render);
    render();
    return { render: render, destroy: unsub, setQuery: function (q) { ui.q = q; render(); } };
  };

  /* ---------- results ---------- */
  V.mountResults = function (host, key, o) {
    o = o || {};
    function build() {
      var oc = A.occByKey(key); if (!oc) { host.innerHTML = '<p class="hint">That event is gone.</p>'; return; }
      var rec = A.resultFor(oc), regs = A.regs(oc), uses = D.eventProductUse.filter(function (u) { return u.series === oc.series.id; });
      var hc = rec && rec.headcount != null ? rec.headcount : A.headcountOf(oc);
      var ctx = { names: regs.filter(function (r) { return r.status === 'in'; }).map(function (r) { return r.name; }), products: D.products, headcount: hc, useLines: uses,
        takeStock: rec ? !!rec.takeStock : true, useHint: useHint(oc, uses, hc) };
      host.innerHTML = V.resultsForm(oc, rec, ctx);
      var f = host.querySelector('form');
      f.addEventListener('input', function (ev) { if (ev.target.name === 'headcount') { var h = f.querySelector('#use-hint'); if (h) h.textContent = useHint(oc, uses, Number(ev.target.value) || 0); } });
      f.addEventListener('click', function (ev) {
        var t = ev.target.closest('[data-act]'); if (!t) return;
        var act = t.getAttribute('data-act');
        if (act === 'add-prize') {
          var rows = f.querySelector('#prize-rows'), div = document.createElement('div');
          div.innerHTML = V.prizeRow({}, '<option value="">Pick a product</option>' + D.products.map(function (p) { return '<option value="' + e(p.id) + '">' + e(p.name) + '</option>'; }).join(''));
          rows.appendChild(div.firstChild); rows.querySelector('.prow:last-child select').focus();
        }
        if (act === 'del-prize') t.closest('.prow').remove();
      });
      f.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var el = f.elements, top = [el.winner.value];
        for (var i = 2; i <= 8; i++) top.push(el['top' + i].value);
        var rows = U.$$('.prow', f).map(function (r) { return { product: r.querySelector('select').value, qty: r.querySelector('input').value }; });
        var res = A.saveResults(key, { headcount: el.headcount.value, winner: el.winner.value, top: top.filter(function (x) { return x.trim(); }), prizes: el.prizes.value, prizeRows: rows,
          credit: el.credit.value, reported: el.reported.checked, public: el.public.checked, takeStock: el.takeStock ? el.takeStock.checked : false });
        var em = f.querySelector('#e-headcount');
        if (!res.ok) { if (res.errors && res.errors.headcount) { em.textContent = res.errors.headcount; em.hidden = false; el.headcount.setAttribute('aria-invalid', 'true'); el.headcount.focus(); } else U.toast(res.msg); return; }
        U.say(res);
        if (o.onSaved) o.onSaved(res); else build();
      });
    }
    build();
  };
  function useHint(oc, uses, hc) {
    var list = S.usedAtEvent(D.eventProductUse, oc.series.id, hc);
    if (!list.length) return 'nothing.';
    return list.map(function (x) { var p = A.productById(x.product); return x.qty + ' ' + (p ? p.name : 'product'); }).join(', ') + '.';
  }
  V.openResults = function (key) {
    var oc = A.occByKey(key); if (!oc) return;
    var d = U.dialog('Results: ' + oc.series.title + ', ' + MG.fmtDate(MG.parseYmd(oc.date)), '<div id="rf-host"></div>', { cls: 'dlg-wide' });
    V.mountResults(d.querySelector('#rf-host'), key, { onSaved: function () { d.close(); } });
  };
})();
