/* Mulligan Games concept: admin Inventory and Preorders (DESIGN.md 9.5 and 9.6).
 * Stock with +/- and "count now", low and short badges, "reserved for events"; preorders by product with status.
 * Stock page: inventory.html (?f=low|short|sealed..., ?look=14). Preorders: inventory.html#preorders (?f=arrived).
 */
(function () {
  'use strict';
  var MG = window.MG, D = MG.data, R = MG.rules, S = MG.stock, A = MG.act, U = MG.ui, V = MG.views, e = MG.esc, $ = U.$;
  var view = $('#view');
  var params = new URLSearchParams(location.search);
  var ui = { f: params.get('f') || 'all', q: '', game: 'all', look: Number(params.get('look')) || 14, open: {}, counting: {}, refocus: null, poFilter: params.get('f') === 'arrived' ? 'arrived' : 'open', shown: {} };
  if (['all', 'low', 'short', 'sealed', 'accessory', 'miniature', 'paint', 'singles'].indexOf(ui.f) === -1) ui.f = 'all';
  var LOOKS = [7, 14, 30, 60];
  if (LOOKS.indexOf(ui.look) === -1) ui.look = LOOKS.filter(function (n) { return n >= ui.look; })[0] || 60;

  function isPreorders() { return location.hash.indexOf('#preorders') === 0; }

  /* ================= stock ================= */
  function renderStock() {
    var pic = A.stockPicture(ui.look), al = pic.alerts, q = ui.q.toLowerCase();
    var lowN = al.low.length, shortN = al.short.length;
    var list = D.products.filter(function (p) {
      if (ui.game !== 'all' && p.game !== ui.game) return false;
      if (q && p.name.toLowerCase().indexOf(q) === -1) return false;
      var st = S.status(p, pic.map[p.id] && pic.map[p.id].total);
      if (ui.f === 'low') return (st.low || st.out) && (p.low || st.out);
      if (ui.f === 'short') return st.short;
      if (ui.f !== 'all') return p.category === ui.f;
      return true;
    }).sort(function (a, b) { return (a.category + a.name).localeCompare(b.category + b.name); });
    var chip = function (id, label, n) { return '<button type="button" class="chip" data-f="' + id + '"' + (ui.f === id ? ' aria-current="true"' : '') + '><span>' + e(label) + '</span>' + (n != null ? '<span class="chip-n">' + n + '</span>' : '') + '</button>'; };
    var banner = lowN || shortN
      ? '<p class="banner" role="status">' + MG.icon('alert') + '<span>' + (lowN ? lowN + (lowN === 1 ? ' product is low' : ' products are low') : '') + (lowN && shortN ? '. ' : '') +
        (shortN ? shortN + (shortN === 1 ? ' will run short' : ' will run short') + ' for events in the next ' + ui.look + ' days' : '') + '. ' +
        (lowN ? '<a href="#" data-f="low">Show low</a>' : '') + (lowN && shortN ? ' or ' : '') + (shortN ? '<a href="#" data-f="short">show short</a>' : '') + '.</span></p>'
      : '<p class="banner banner-ok" role="status">' + MG.icon('check') + '<span>Nothing is low and nothing will run short in the next ' + ui.look + ' days.</span></p>';
    view.innerHTML = '<div class="page-head"><h1>Inventory</h1><div class="page-tools" style="margin:0">' + V.btn('btn btn-2', 'data-act="receive"', MG.icon('download') + 'Receive stock') + V.btn('btn btn-act', 'data-act="add-product"', MG.icon('plus') + 'Add product') + '</div></div>' +
      banner +
      '<div class="inv-tools"><label class="fld"><span class="vh">Search products</span><input type="search" id="q" placeholder="Search products..." value="' + e(ui.q) + '" autocomplete="off"></label>' +
      '<nav class="chips" aria-label="Filter products">' + chip('all', 'All', D.products.length) + chip('low', 'Low', lowN) + chip('short', 'Short', shortN) + chip('sealed', 'Sealed') + chip('accessory', 'Accessories') + chip('miniature', 'Miniatures') + chip('paint', 'Paint') + chip('singles', 'Singles') + '</nav>' +
      '<div class="inv-selects"><label class="fld"><span>Game</span><select id="game"><option value="all">All games</option>' + D.games.filter(function (g) { return g.shown; }).map(function (g) { return '<option value="' + e(g.id) + '"' + (ui.game === g.id ? ' selected' : '') + '>' + e(g.short) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fld"><span>Reserved for events in the next</span><select id="look">' + LOOKS.map(function (n) { return '<option value="' + n + '"' + (ui.look === n ? ' selected' : '') + '>' + n + ' days</option>'; }).join('') + '</select></label></div></div>' +
      (list.length ? '<div class="prods"><div class="prod-head" aria-hidden="true"><span>Product</span><span>On hand</span><span>Reserved</span><span>Free</span><span>Low at</span><span></span></div>' + list.map(function (p) {
        return V.productRow(p, { reserved: pic.map[p.id], open: !!ui.open[p.id], counting: !!ui.counting[p.id], moves: D.stockMoves.filter(function (m) { return m.product === p.id; }), look: ui.look });
      }).join('') + '</div>' : '<div class="empty lattice empty-p" role="note"><p class="empty-h">No products match.</p><p>Clear the search or the filter.</p></div>');
    if (ui.refocus) {
      var n = ui.refocus.q ? $(ui.refocus.q) : $('[data-id="' + ui.refocus.id + '"] [data-act="' + ui.refocus.act + '"]');
      if (ui.refocus.input) { var inpt = $('[data-id="' + ui.refocus.id + '"] input[name="n"]'); if (inpt) { inpt.focus(); inpt.select(); } }
      else if (n) n.focus();
      ui.refocus = null;
    }
  }

  function productDialog(p) {
    var cats = Object.keys(V.catLabel);
    var d = U.dialog(p ? 'Edit ' + p.name : 'Add a product',
      '<form class="stack" novalidate><label class="fld"><span>Name</span><input name="name" value="' + e(p ? p.name : '') + '" autocomplete="off" aria-describedby="e-name"><em class="err" id="e-name" hidden></em></label>' +
      '<label class="fld"><span>Kind</span><select name="category">' + cats.map(function (c) { return '<option value="' + c + '"' + (p && p.category === c ? ' selected' : '') + '>' + e(V.catLabel[c]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fld"><span>Game <small>(optional)</small></span><select name="game"><option value="">None</option>' + D.games.filter(function (g) { return g.shown; }).map(function (g) { return '<option value="' + e(g.id) + '"' + (p && p.game === g.id ? ' selected' : '') + '>' + e(g.short) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fld"><span>Low-stock number <small>(0 means no alert)</small></span><input name="low" inputmode="numeric" value="' + e(p ? p.low : 0) + '" autocomplete="off" aria-describedby="e-low"><em class="err" id="e-low" hidden></em></label>' +
      (p ? '' : '<label class="fld"><span>On hand now <small>(optional)</small></span><input name="onHand" inputmode="numeric" value="0" autocomplete="off"></label>') +
      '<p class="dlg-acts"><button type="button" class="btn btn-2" data-close>Cancel</button><button type="submit" class="btn btn-act">' + (p ? 'Save product' : 'Add product') + '</button></p></form>');
    d.querySelector('input').focus();
    d.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = ev.target.elements, res = A.saveProduct({ name: f.name.value, category: f.category.value, game: f.game.value, low: f.low.value, onHand: f.onHand ? f.onHand.value : 0 }, p && p.id);
      if (!res.ok) { Object.keys(res.errors || {}).forEach(function (k) { var em = d.querySelector('#e-' + k); if (em) { em.textContent = res.errors[k]; em.hidden = false; f[k].setAttribute('aria-invalid', 'true'); } }); return; }
      d.close(); U.say(res);
    });
  }
  function receiveDialog() {
    var d = U.dialog('Receive stock', '<form class="stack" novalidate><label class="fld"><span>Product</span><select name="product" aria-describedby="e-p"><option value="">Pick a product</option>' +
      D.products.map(function (p) { return '<option value="' + e(p.id) + '">' + e(p.name) + '</option>'; }).join('') + '</select><em class="err" id="e-p" hidden></em></label>' +
      '<label class="fld"><span>How many arrived</span><input name="qty" inputmode="numeric" autocomplete="off" aria-describedby="e-q"><em class="err" id="e-q" hidden></em></label>' +
      '<label class="fld"><span>Note <small>(optional)</small></span><input name="note" autocomplete="off" placeholder="Distributor order"></label>' +
      '<p class="dlg-acts"><button type="button" class="btn btn-2" data-close>Cancel</button><button type="submit" class="btn btn-act">Add to stock</button></p></form>');
    d.querySelector('select').focus();
    d.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = ev.target.elements, pe = d.querySelector('#e-p'), qe = d.querySelector('#e-q'), bad = false;
      pe.hidden = qe.hidden = true;
      if (!f.product.value) { pe.textContent = 'Pick a product.'; pe.hidden = false; bad = true; }
      if (!/^\d+$/.test(f.qty.value.trim()) || Number(f.qty.value) < 1) { qe.textContent = 'Use a whole number, 1 or more.'; qe.hidden = false; bad = true; }
      if (bad) return;
      var res = A.receive(f.product.value, Number(f.qty.value), f.note.value);
      if (!res.ok) { qe.textContent = res.msg; qe.hidden = false; return; }
      d.close(); U.say(res);
    });
  }

  function onStockClick(ev) {
    var t = ev.target.closest ? ev.target : ev.target.parentElement;
    var fb = t.closest('[data-f]');
    if (fb) { ev.preventDefault(); ui.f = fb.getAttribute('data-f'); renderStock(); return; }
    var b = t.closest('[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act'), card = b.closest('.prod'), id = card && card.getAttribute('data-id'), p = id && A.productById(id);
    switch (act) {
      case 'receive': receiveDialog(); break;
      case 'add-product': productDialog(null); break;
      case 'minus': ui.refocus = { id: id, act: 'minus' }; var r1 = A.adjust(id, -1); U.say(r1); if (!r1.ok) renderStock(); break;
      case 'plus': ui.refocus = { id: id, act: 'plus' }; U.say(A.adjust(id, 1)); break;
      case 'count': ui.counting[id] = !ui.counting[id]; ui.refocus = ui.counting[id] ? { id: id, input: true } : { id: id, act: 'count' }; renderStock(); break;
      case 'count-cancel': delete ui.counting[id]; ui.refocus = { id: id, act: 'count' }; renderStock(); break;
      case 'more': ui.open[id] = !ui.open[id]; ui.refocus = { id: id, act: 'more' }; renderStock(); break;
      case 'edit': productDialog(p); break;
      case 'delete':
        U.confirm({ title: 'Delete ' + p.name + '?', body: 'This removes the product, its preorders and its use in events. You can undo it for a few seconds.', ok: 'Delete the product', cancel: 'Keep it', danger: true }).then(function (ok) { if (ok) U.say(A.deleteProduct(id)); });
        break;
    }
  }
  function onStockSubmit(ev) {
    var f = ev.target.closest && ev.target.closest('[data-act="countform"]'); if (!f) return;
    ev.preventDefault();
    var id = f.closest('.prod').getAttribute('data-id'), res = A.count(id, f.elements.n.value);
    if (!res.ok) { var em = f.querySelector('.err'); em.textContent = res.msg; em.hidden = false; f.elements.n.setAttribute('aria-invalid', 'true'); f.elements.n.focus(); return; }
    delete ui.counting[id]; ui.refocus = { id: id, act: 'count' };
    U.say(res);
  }

  /* ================= preorders ================= */
  function dealine(p) {
    var rel = p && p.release && D.releases.filter(function (r) { return r.id === p.release; })[0];
    if (!rel || !rel.preorderEnds) return '';
    var days = Math.round((MG.parseYmd(rel.preorderEnds) - MG.parseYmd(MG.ymd(MG.now()))) / 864e5), end = MG.parseYmd(rel.preorderEnds);
    return 'Preorders end ' + MG.dayShort(end) + ' ' + MG.fmtDate(end) + (days > 0 ? ', ' + days + (days === 1 ? ' day' : ' days') : days === 0 ? ', last day today' : ', closed');
  }
  function renderPreorders() {
    var f = ui.poFilter, all = D.preorders, arrived = all.filter(function (o) { return o.status === 'arrived'; });
    var chip = function (id, label, n) { return '<button type="button" class="chip" data-pf="' + id + '"' + (f === id ? ' aria-current="true"' : '') + '><span>' + e(label) + '</span>' + (n != null ? '<span class="chip-n">' + n + '</span>' : '') + '</button>'; };
    var html = '<div class="page-head"><h1>Preorders</h1>' + V.btn('btn btn-act', 'data-act="new-po"', MG.icon('plus') + 'New preorder') + '</div>' +
      '<nav class="chips" aria-label="Filter preorders">' + chip('open', 'Open', all.filter(function (o) { return o.status === 'waiting' || o.status === 'arrived'; }).length) + chip('arrived', 'Arrived: call these', arrived.length) + chip('all', 'Everything', all.length) + '</nav>';
    if (!all.length) { view.innerHTML = html + '<div class="empty lattice empty-p" role="note"><p class="empty-h">No preorders yet.</p><p>Add one when a customer asks at the counter.</p></div>'; return; }
    if (f === 'arrived') {
      html += arrived.length ? '<ul class="polist">' + arrived.map(function (o) { var p = A.productById(o.product); return V.preorderRow(o, { product: p && p.name, showContact: true, bigCall: true }); }).join('') + '</ul>'
        : '<div class="empty lattice empty-p" role="note"><p class="empty-h">Nobody is waiting for a call.</p><p>Mark a preorder as arrived and it shows here with a call button.</p></div>';
    } else {
      var groups = {}, order = [];
      all.forEach(function (o) {
        if (f === 'open' && o.status !== 'waiting' && o.status !== 'arrived') return;
        if (!groups[o.product]) { groups[o.product] = []; order.push(o.product); }
        groups[o.product].push(o);
      });
      html += order.length ? order.map(function (pid) {
        var p = A.productById(pid), list = groups[pid], t = S.preorderTotals(all.filter(function (o) { return o.product === pid; })), waiting = list.some(function (o) { return o.status === 'waiting'; });
        return '<section class="po-group" data-product="' + e(pid) + '" aria-labelledby="pg-' + e(pid) + '"><header><h3 id="pg-' + e(pid) + '">' + e(p ? p.name : 'Product') + '</h3>' +
          '<p class="po-sub">' + e(t.qty) + ' ordered, ' + e(t.customers) + (t.customers === 1 ? ' customer' : ' customers') + ', $' + e(t.deposits) + ' in deposits' + (dealine(p) ? '. ' + e(dealine(p)) : '') + '.</p>' +
          (waiting ? V.btn('btn btn-2 btn-sm', 'data-act="all-arrived"', 'Mark all waiting as arrived<span class="vh"> for ' + e(p ? p.name : '') + '</span>') : '') + '</header>' +
          '<ul class="polist">' + list.map(function (o) { return V.preorderRow(o, { product: p && p.name, showContact: !!ui.shown[o.id] }); }).join('') + '</ul></section>';
      }).join('') : '<div class="empty lattice empty-p" role="note"><p class="empty-h">Nothing open.</p><p>Everything is picked up or cancelled. Choose "Everything" to see it.</p></div>';
    }
    view.innerHTML = html;
    if (ui.refocus) { var n = ui.refocus.q ? $(ui.refocus.q) : $('[data-id="' + ui.refocus.id + '"] [data-act="' + ui.refocus.act + '"][data-v="' + (ui.refocus.v || '') + '"]') || $('[data-id="' + ui.refocus.id + '"] [data-act="' + ui.refocus.act + '"]'); if (n) n.focus(); ui.refocus = null; }
  }
  function newPreorderDialog() {
    var d = U.dialog('New preorder', '<form class="stack" novalidate><label class="fld"><span>Product</span><select name="product" aria-describedby="e-product"><option value="">Pick a product</option>' +
      D.products.filter(function (p) { return p.category !== 'singles'; }).map(function (p) { return '<option value="' + e(p.id) + '">' + e(p.name) + '</option>'; }).join('') + '<option value="__new">A product that isn’t listed</option></select><em class="err" id="e-product" hidden></em></label>' +
      '<label class="fld" data-newp hidden><span>New product name</span><input name="newProduct" autocomplete="off"></label>' +
      '<label class="fld"><span>Customer</span><input name="customer" autocomplete="off" aria-describedby="e-customer"><em class="err" id="e-customer" hidden></em></label>' +
      '<label class="fld"><span>Phone or email</span><input name="contact" autocomplete="off" aria-describedby="e-contact"><em class="err" id="e-contact" hidden></em></label>' +
      '<div class="fgrid"><label class="fld"><span>How many</span><input name="qty" inputmode="numeric" value="1" autocomplete="off" aria-describedby="e-qty"><em class="err" id="e-qty" hidden></em></label>' +
      '<label class="fld"><span>Deposit ($)</span><input name="deposit" inputmode="numeric" value="0" autocomplete="off" aria-describedby="e-deposit"><em class="err" id="e-deposit" hidden></em></label></div>' +
      '<p class="dlg-acts"><button type="button" class="btn btn-2" data-close>Cancel</button><button type="submit" class="btn btn-act">Add preorder</button></p></form>');
    var form = d.querySelector('form');
    form.elements.product.focus();
    form.elements.product.addEventListener('change', function () { form.querySelector('[data-newp]').hidden = form.elements.product.value !== '__new'; });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = form.elements;
      U.$$('.err', form).forEach(function (n) { n.hidden = true; });
      var res = A.addPreorder({ product: f.product.value, newProduct: f.newProduct.value, customer: f.customer.value, contact: f.contact.value, qty: f.qty.value, deposit: f.deposit.value });
      if (!res.ok) { Object.keys(res.errors || {}).forEach(function (k) { var em = d.querySelector('#e-' + k); if (em) { em.textContent = res.errors[k]; em.hidden = false; } if (f[k]) f[k].setAttribute('aria-invalid', 'true'); }); var first = form.querySelector('[aria-invalid="true"]'); if (first) first.focus(); return; }
      d.close(); ui.poFilter = 'open'; U.say(res);
    });
  }
  function onPoClick(ev) {
    var t = ev.target.closest ? ev.target : ev.target.parentElement;
    var pf = t.closest('[data-pf]'); if (pf) { ui.poFilter = pf.getAttribute('data-pf'); renderPreorders(); return; }
    var b = t.closest('[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act'), li = b.closest('.po'), id = li && li.getAttribute('data-id');
    if (act === 'new-po') newPreorderDialog();
    if (act === 'status') { ui.refocus = { id: id, act: 'status', v: b.getAttribute('data-v') }; U.say(A.setPreorderStatus(id, b.getAttribute('data-v'))); }
    if (act === 'contact') { ui.shown[id] = !ui.shown[id]; ui.refocus = { id: id, act: 'contact' }; renderPreorders(); }
    if (act === 'all-arrived') U.say(A.markAllArrived(b.closest('[data-product]').getAttribute('data-product')));
  }

  /* ================= wiring ================= */
  function render() {
    if (isPreorders()) renderPreorders(); else renderStock();
  }
  function init() {
    MG.shell.init();
    view.addEventListener('click', function (ev) { if (isPreorders()) onPoClick(ev); else onStockClick(ev); });
    view.addEventListener('submit', function (ev) { if (!isPreorders()) onStockSubmit(ev); });
    view.addEventListener('input', function (ev) { if (ev.target.id === 'q') { ui.q = ev.target.value; var pos = ev.target.selectionStart; renderStock(); var q = $('#q'); q.focus(); q.setSelectionRange(pos, pos); } });
    view.addEventListener('change', function (ev) {
      if (ev.target.id === 'game') { ui.game = ev.target.value; renderStock(); $('#game').focus(); }
      if (ev.target.id === 'look') { ui.look = Number(ev.target.value); renderStock(); $('#look').focus(); }
    });
    window.addEventListener('hashchange', function () { window.scrollTo(0, 0); render(); });
    MG.state.subscribe(render);
    render();
  }
  try { init(); } catch (err) {
    view.innerHTML = '<div class="empty" role="alert"><p class="empty-h">Inventory didn’t load.</p><p>Reload the page. Nothing was lost.</p></div>';
    if (window.console) console.error(err);
  }
})();
