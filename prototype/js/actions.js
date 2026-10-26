/* Mulligan Games concept: the things staff and players do, as one function each.
 *
 * Each action changes MG_SAMPLE through the rules in rules.js and stock.js, saves, tells the pages to redraw and
 * returns { ok, msg, before, ... }. "before" is a snapshot: MG.act.undo(before) puts everything back, which is how
 * every toast gets its Undo button. msg is plain text (the screen shows it with textContent).
 * Load after rules.js, stock.js and state.js.
 */
(function () {
  'use strict';
  var MG = window.MG, D = MG.data, R = MG.rules, S = MG.stock, ST = MG.state;
  var A = MG.act = {};

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function stamp(d) { d = d || MG.now(); return MG.ymd(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  A.stamp = stamp;
  function begin() { return ST.snapshot(); }
  function done(before, msg, extra) {
    ST.save(); ST.notify();
    var out = { ok: true, msg: msg, before: before };
    if (extra) Object.keys(extra).forEach(function (k) { out[k] = extra[k]; });
    return out;
  }
  function fail(msg, extra) { var o = { ok: false, msg: msg }; if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); return o; }
  A.undo = function (before) { ST.restore(before); };

  /* ---------- finding things ---------- */
  A.seriesById = function (id) { return D.series.filter(function (s) { return s.id === id; })[0] || null; };
  A.occByKey = function (key) {
    var k = R.parseKey(key), s = k && A.seriesById(k.series);
    if (!s) return null;
    return MG.occurrences(s, k.date, k.date).filter(function (o) { return !k.start || o.start === k.start; })[0] || null;
  };
  A.keyOf = function (occ) { return { series: occ.series.id, date: occ.date, start: occ.start }; };
  A.regs = function (occ) { return R.group(D.registrations, A.keyOf(occ)); };
  A.regById = function (id) { return D.registrations.filter(function (r) { return r.id === id; })[0] || null; };
  function occOfReg(reg) {
    var s = A.seriesById(reg.series);
    return s && MG.occurrences(s, reg.date, reg.date).filter(function (o) { return !reg.start || o.start === reg.start; })[0];
  }

  /* ---------- sign-ups (public form and admin) ---------- */
  A.register = function (occKey, form, opts) {
    opts = opts || {};
    var occ = A.occByKey(occKey);
    if (!occ) return fail('That event is gone.');
    if (occ.cancelled) return fail('This date is cancelled.');
    var now = MG.now(), before = begin();
    var res = R.signUp(D.registrations, A.keyOf(occ), form, {
      cap: MG.capOf(occ), waitlist: !!occ.series.waitlist, now: now, cutoffAt: MG.cutoffAt(occ),
      id: ST.nextId('r'), createdAt: stamp(now), expected: opts.expected
    });
    if (!res.ok) return res.bot ? { ok: true, bot: true } : Object.assign({ ok: false }, res);
    return done(before, res.status === 'in' ? 'Signed up.' : 'On the waitlist.', res);
  };

  A.cancelReg = function (regId) {
    var reg = A.regById(regId), occ = reg && occOfReg(reg);
    if (!reg || !occ) return fail('That sign-up is gone.');
    var before = begin(), res = R.cancelReg(D.registrations, A.keyOf(occ), regId, MG.capOf(occ));
    if (!res.ok) return fail('Already cancelled.');
    var msg = reg.name + ' cancelled.';
    if (res.promoted.length) msg += ' ' + MG.list(res.promoted.map(function (p) { return p.name; })) + ' moved in from the waitlist.';
    if (res.refundDue) msg += ' They paid (' + R.PAYMENT_LABEL[reg.payment].toLowerCase() + '): give it back.';
    return done(before, msg, { promoted: res.promoted, refundDue: res.refundDue });
  };

  A.checkIn = function (regId, on) {
    var reg = A.regById(regId); if (!reg) return fail('That sign-up is gone.');
    var before = begin();
    if (!R.checkIn(reg, on)) return fail(reg.name + ' isn’t in a seat yet.');
    return done(before, reg.name + (on ? ' checked in.' : ' not checked in.'));
  };
  A.setPayment = function (regId, p) {
    var reg = A.regById(regId); if (!reg) return fail('That sign-up is gone.');
    var before = begin();
    if (!R.setPayment(reg, p)) return fail('Couldn’t change that.');
    return done(before, reg.name + ': ' + R.PAYMENT_LABEL[p].toLowerCase() + '.');
  };
  A.editReg = function (regId, patch) {
    var reg = A.regById(regId); if (!reg) return fail('That sign-up is gone.');
    var name = String(patch.name || '').replace(/\s+/g, ' ').trim();
    if (!name) return fail('Enter a name.');
    var before = begin();
    reg.name = name; reg.contact = String(patch.contact || '').trim(); reg.playerId = String(patch.playerId || '').trim() || null;
    return done(before, 'Saved ' + name + '.');
  };
  A.walkIn = function (occKey, name, mode) {
    var occ = A.occByKey(occKey); if (!occ) return fail('That event is gone.');
    var before = begin(), fee = occ.series.fee;
    var res = R.addWalkIn(D.registrations, A.keyOf(occ), name, {
      cap: MG.capOf(occ), mode: mode || 'auto', id: ST.nextId('r'), createdAt: stamp(), payment: 'door'
    });
    if (!res.ok) return fail(res.message || 'Couldn’t add that name.', res);
    var c = R.counts(A.regs(occ)), cap = MG.capOf(occ);
    var msg = res.status === 'waitlist' ? res.reg.name + ' is on the waitlist (#' + res.position + ').' :
      res.reg.name + ' added and checked in.' + (res.over ? ' ' + c.in + ' of ' + cap + '.' : '');
    return done(before, msg, res);
  };
  A.moveIn = function (regId) {
    var reg = A.regById(regId), occ = reg && occOfReg(reg); if (!occ) return fail('That sign-up is gone.');
    var before = begin(), res = R.moveIn(D.registrations, A.keyOf(occ), regId, MG.capOf(occ));
    if (!res.ok) return fail('Not on the waitlist.');
    return done(before, reg.name + ' moved in' + (res.over ? ' (over the seat limit).' : '.'), res);
  };
  A.moveWaitlist = function (regId, dir) {
    var reg = A.regById(regId), occ = reg && occOfReg(reg); if (!occ) return fail('That sign-up is gone.');
    var before = begin(), res = R.moveWaitlist(D.registrations, A.keyOf(occ), regId, dir);
    if (!res.ok) return fail('Can’t move ' + reg.name + ' that way.');
    return done(before, reg.name + ' is #' + res.position + ' on the waitlist.');
  };
  // walk-in-only events: the big headcount counter
  A.headcount = function (occKey, n) {
    n = Math.max(0, Math.floor(Number(n) || 0));
    var before = begin(); D.headcounts[occKey] = n;
    return done(before, 'Players tonight: ' + n + '.');
  };
  A.headcountOf = function (occ) {
    var n = D.headcounts[occ.key];
    return n != null ? n : R.counts(A.regs(occ)).checkedIn;
  };

  /* ---------- events: one date ---------- */
  A.cancelDate = function (seriesId, date, note) {
    var s = A.seriesById(seriesId); if (!s) return fail('That event is gone.');
    var before = begin(), occ = MG.occurrences(s, date, date)[0];
    R.setException(D.exceptions, seriesId, date, { type: 'cancel', note: String(note || '').trim() || null }, MG.ymd(MG.now()));
    return done(before, s.title + ' on ' + MG.fmtDate(MG.parseYmd(date)) + ' is cancelled.', { occ: occ });
  };
  A.restoreDate = function (seriesId, date) {
    var s = A.seriesById(seriesId); if (!s) return fail('That event is gone.');
    var before = begin(), ex = R.findException(D.exceptions, seriesId, date);
    if (ex && ex.type === 'cancel') { delete ex.type; delete ex.note; if (ex.start == null && ex.capacity == null) R.clearException(D.exceptions, seriesId, date); else ex.type = 'change'; }
    return done(before, s.title + ' on ' + MG.fmtDate(MG.parseYmd(date)) + ' is back on.');
  };
  // patch: { start, capacity, note } for that date only
  A.changeDate = function (seriesId, date, patch) {
    var s = A.seriesById(seriesId); if (!s) return fail('That event is gone.');
    var before = begin(), prevOcc = MG.occurrences(s, date, date)[0];
    var p = { type: 'change', start: patch.start && patch.start !== s.start ? patch.start : null,
      capacity: patch.capacity !== '' && patch.capacity != null && Number(patch.capacity) !== s.capacity ? Number(patch.capacity) : null,
      note: String(patch.note || '').trim() || null };
    var ex = R.findException(D.exceptions, seriesId, date);
    if (ex && ex.type === 'cancel') p.type = 'cancel';
    R.setException(D.exceptions, seriesId, date, p, MG.ymd(MG.now()));
    var occ = MG.occurrences(s, date, date)[0], promoted = [];
    if (occ && !occ.cancelled) promoted = R.afterCapacityChange(D.registrations, A.keyOf(occ), MG.capOf(occ));
    return done(before, 'Changed ' + s.title + ' on ' + MG.fmtDate(MG.parseYmd(date)) + '.' + (promoted.length ? ' ' + MG.list(promoted.map(function (x) { return x.name; })) + ' moved in from the waitlist.' : ''), { promoted: promoted });
  };

  /* ---------- events: the series ---------- */
  function slug(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'event'; }
  A.saveSeries = function (form, editId) {
    var errors = R.validateSeries(form);
    if (Object.keys(errors).length) return fail('Fix the highlighted fields.', { errors: errors });
    var before = begin(), id = editId || (slug(form.title) + '-' + ST.nextId('')), built = R.seriesFromForm(form, id), s = built.series, old = editId && A.seriesById(editId), promoted = [];
    if (old) {
      if (old.templateOf) s.templateOf = old.templateOf;
      D.series[D.series.indexOf(old)] = s;
    } else D.series.push(s);
    D.eventProductUse = D.eventProductUse.filter(function (u) { return u.series !== id; }).concat(built.uses);
    // more seats: let people in off the waitlist for every upcoming date
    if (old) {
      var from = MG.ymd(MG.now());
      MG.occurrences(s, from, MG.ymd(MG.addDays(MG.now(), 120))).forEach(function (o) {
        if (!o.cancelled) promoted = promoted.concat(R.afterCapacityChange(D.registrations, A.keyOf(o), MG.capOf(o)));
      });
    }
    var first = MG.occurrences(s, MG.ymd(MG.now()), MG.ymd(MG.addDays(MG.now(), 400)))[0];
    return done(before, 'Saved ' + s.title + '.' + (promoted.length ? ' ' + promoted.length + ' moved in from the waitlist.' : ''), { series: s, id: id, first: first, uses: built.uses });
  };
  A.deleteSeries = function (id) {
    var s = A.seriesById(id); if (!s) return fail('That event is gone.');
    var before = begin();
    D.series = D.series.filter(function (x) { return x.id !== id; });
    D.exceptions = D.exceptions.filter(function (x) { return x.series !== id; });
    D.eventProductUse = D.eventProductUse.filter(function (x) { return x.series !== id; });
    D.registrations = D.registrations.filter(function (x) { return x.series !== id; });
    return done(before, 'Deleted ' + s.title + '.');
  };
  A.setShown = function (id, on) {
    var s = A.seriesById(id); if (!s) return fail('That event is gone.');
    var before = begin(); s.enabled = !!on;
    return done(before, s.title + (on ? ' is showing on the website.' : ' is hidden from the website.'));
  };
  A.saveTemplate = function (form, name) {
    name = String(name || '').trim();
    if (!name) return fail('Name the template.');
    var before = begin(), fields = JSON.parse(JSON.stringify(form));
    fields.date = ''; fields.until = '';
    if (fields.dates) fields.dates = fields.dates.map(function (d) { return { date: '', start: d.start }; });
    D.templates.push({ id: ST.nextId('tpl'), game: form.game, name: name, yours: true, form: fields });
    return done(before, 'Saved the template "' + name + '".');
  };

  /* ---------- results and prizes ---------- */
  A.resultFor = function (occ) {
    return D.results.filter(function (r) { return r.series === occ.series.id && r.date === occ.date; })[0] || null;
  };
  /* data: { headcount, winner, top: [names], prizes (text), prizeRows: [{product, qty}], credit (text), reported, public, takeStock } */
  A.saveResults = function (occKey, data) {
    var occ = A.occByKey(occKey); if (!occ) return fail('That event is gone.');
    var hc = data.headcount === '' || data.headcount == null ? null : Number(data.headcount);
    if (hc !== null && (!isFinite(hc) || hc < 0 || hc !== Math.floor(hc))) return fail('Headcount must be a whole number.', { errors: { headcount: 'Use a whole number, 0 or more.' } });
    var before = begin(), id = occ.series.id, res = A.resultFor(occ), at = stamp();
    // stock: undo this date's earlier event-use and prize moves, then apply the new ones, so saving twice never double counts
    D.stockMoves.filter(function (m) { return m.event === id && m.date === occ.date && (m.reason === 'event' || m.reason === 'prize'); }).forEach(function (m) {
      var p = S.find(D.products, m.product); if (p) p.onHand -= m.qty;
    });
    D.stockMoves = D.stockMoves.filter(function (m) { return !(m.event === id && m.date === occ.date && (m.reason === 'event' || m.reason === 'prize')); });
    var notes = [], rows = (data.prizeRows || []).filter(function (x) { return x.product && Number(x.qty) > 0; });
    var used = data.takeStock ? S.usedAtEvent(D.eventProductUse, id, hc || 0) : [];
    used.forEach(function (u) {
      var r = S.applyMove(D.products, D.stockMoves, { product: u.product, qty: -u.qty, reason: 'event', event: id, date: occ.date, at: at, who: 'Staff' });
      if (!r.ok) notes.push(S.find(D.products, u.product).name + ': only ' + r.onHand + ' on hand, not all taken.');
      if (!r.ok && r.onHand > 0) S.applyMove(D.products, D.stockMoves, { product: u.product, qty: -r.onHand, reason: 'event', event: id, date: occ.date, at: at, who: 'Staff' });
    });
    rows.forEach(function (x) {
      var r = S.applyMove(D.products, D.stockMoves, { product: x.product, qty: -Number(x.qty), reason: 'prize', event: id, date: occ.date, at: at, who: 'Staff' });
      if (!r.ok) notes.push(S.find(D.products, x.product).name + ': only ' + r.onHand + ' on hand, prize not taken from stock.');
    });
    var rec = {
      series: id, date: occ.date, headcount: hc, winner: String(data.winner || '').trim() || null,
      top: (data.top || []).map(function (t) { return String(t).trim(); }).filter(Boolean),
      prizes: String(data.prizes || '').trim() || null, prizeRows: rows.map(function (x) { return { product: x.product, qty: Number(x.qty) }; }),
      credit: String(data.credit || '').trim() || null, reported: !!data.reported, public: !!data.public, takeStock: !!data.takeStock
    };
    if (res) D.results[D.results.indexOf(res)] = rec; else D.results.push(rec);
    return done(before, 'Saved results for ' + occ.series.title + ', ' + MG.fmtDate(MG.parseYmd(occ.date)) + '.' + (notes.length ? ' ' + notes.join(' ') : ''), { notes: notes });
  };

  /* ---------- stock ---------- */
  A.productById = function (id) { return S.find(D.products, id); };
  A.adjust = function (id, delta) {
    var before = begin(), p = S.find(D.products, id);
    var r = S.applyMove(D.products, D.stockMoves, { product: id, qty: delta, reason: delta > 0 ? 'received' : 'sold', at: stamp(), who: 'Staff' });
    if (!r.ok) return fail(p ? p.name + ' is already at ' + p.onHand + '.' : r.message);
    return done(before, p.name + ': ' + p.onHand + '.');
  };
  A.count = function (id, n) {
    var before = begin(), r = S.countTo(D.products, D.stockMoves, id, n, { at: stamp(), who: 'Staff' });
    if (!r.ok) return fail(r.message || 'Couldn’t save that count.');
    return done(before, r.product.name + ': counted ' + r.product.onHand + (r.none ? ' (no change).' : '.'));
  };
  A.receive = function (id, qty, note) {
    var before = begin(), p = S.find(D.products, id);
    var r = S.applyMove(D.products, D.stockMoves, { product: id, qty: Math.abs(Number(qty)), reason: 'received', at: stamp(), who: 'Staff', note: String(note || '').trim() || undefined });
    if (!r.ok) return fail(r.message || 'Couldn’t add that.');
    return done(before, 'Received ' + r.move.qty + ' ' + p.name + '. Now ' + p.onHand + '.');
  };
  A.saveProduct = function (data, editId) {
    var name = String(data.name || '').replace(/\s+/g, ' ').trim();
    if (!name) return fail('Enter a product name.', { errors: { name: 'Enter a product name.' } });
    var low = Number(data.low || 0);
    if (!isFinite(low) || low < 0 || low !== Math.floor(low)) return fail('Low-stock number must be a whole number, 0 or more.', { errors: { low: 'Use a whole number, 0 or more. 0 means no alert.' } });
    var before = begin(), p = editId ? S.find(D.products, editId) : null;
    if (!p) { p = { id: ST.nextId('p'), onHand: 0, price: null }; D.products.push(p); }
    p.name = name; p.category = data.category || 'sealed'; p.game = data.game || null; p.low = low;
    if (!editId && Number(data.onHand) > 0) S.applyMove(D.products, D.stockMoves, { product: p.id, qty: Number(data.onHand), reason: 'received', at: stamp(), who: 'Staff', note: 'Opening count' });
    return done(before, (editId ? 'Saved ' : 'Added ') + name + '.', { product: p });
  };
  A.deleteProduct = function (id) {
    var p = S.find(D.products, id); if (!p) return fail('That product is gone.');
    var before = begin();
    D.products = D.products.filter(function (x) { return x.id !== id; });
    D.eventProductUse = D.eventProductUse.filter(function (x) { return x.product !== id; });
    D.preorders = D.preorders.filter(function (x) { return x.product !== id; });
    return done(before, 'Deleted ' + p.name + '.');
  };

  /* ---------- preorders ---------- */
  A.addPreorder = function (data) {
    var errors = {}, customer = String(data.customer || '').replace(/\s+/g, ' ').trim(), contact = String(data.contact || '').trim(), qty = Number(data.qty), dep = Number(data.deposit || 0);
    var before = begin(), productId = data.product;
    var newName = String(data.newProduct || '').replace(/\s+/g, ' ').trim();
    if (productId === '__new') { if (!newName) errors.product = 'Name the product.'; } else if (!S.find(D.products, productId)) errors.product = 'Pick a product.';
    if (!customer) errors.customer = 'Enter the customer’s name.';
    if (!contact) errors.contact = 'Add a phone number or email so we can tell them it arrived.';
    if (!isFinite(qty) || qty < 1 || qty !== Math.floor(qty)) errors.qty = 'Use a whole number, 1 or more.';
    if (!isFinite(dep) || dep < 0) errors.deposit = 'Enter the deposit in dollars. 0 means none.';
    if (Object.keys(errors).length) return fail('Fix the highlighted fields.', { errors: errors });
    if (productId === '__new') { var p = { id: ST.nextId('p'), name: newName, category: 'sealed', game: null, onHand: 0, low: 0, price: null }; D.products.push(p); productId = p.id; }
    var o = { id: ST.nextId('o'), product: productId, customer: customer, contact: contact, qty: qty, deposit: dep, status: 'waiting', createdAt: MG.ymd(MG.now()) };
    D.preorders.push(o);
    return done(before, 'Preorder added for ' + customer + '.', { order: o });
  };
  A.setPreorderStatus = function (id, to) {
    var o = D.preorders.filter(function (x) { return x.id === id; })[0]; if (!o) return fail('That preorder is gone.');
    var before = begin(), r = S.setPreorderStatus(D.products, D.stockMoves, o, to, { at: stamp(), who: 'Staff' });
    if (!r.ok) return fail(r.message);
    return done(before, o.customer + ': ' + S.PREORDER_LABEL[to].toLowerCase() + '.' + (r.stockNote ? ' ' + r.stockNote : ''));
  };
  A.markAllArrived = function (productId) {
    var before = begin(), n = 0;
    D.preorders.forEach(function (o) { if (o.product === productId && o.status === 'waiting') { o.status = 'arrived'; n++; } });
    if (!n) return fail('Nothing is waiting for that product.');
    return done(before, n + (n === 1 ? ' preorder' : ' preorders') + ' marked as arrived.');
  };

  /* ---------- demo ---------- */
  A.resetDemo = function () { var before = ST.reset(); return { ok: true, msg: 'Demo data is back to the sample.', before: before }; };

  /* ---------- reading: what the screens need ---------- */
  // occurrences of every shown series between two dates, as stock.reservations wants them
  A.reservationLines = function (from, to) {
    var occs = MG.allOccurrences(from, to).map(function (o) {
      return { series: o.series, key: o.key, date: o.date, start: o.start, cancelled: o.cancelled, cap: MG.capOf(o), taken: R.counts(A.regs(o)).in, endAt: o.endAt };
    }).filter(function (o) { return o.endAt > MG.now(); });
    return S.reservations(D.eventProductUse, occs);
  };
  A.stockPicture = function (lookDays) {
    var now = MG.now(), to = MG.ymd(MG.addDays(now, lookDays)), lines = A.reservationLines(MG.ymd(now), to), map = S.reservedByProduct(lines);
    return { map: map, alerts: S.alerts(D.products, map), lines: lines };
  };
  A.unreportedList = function () {
    var now = MG.now(), from = MG.ymd(MG.addDays(now, -21)), past = MG.allOccurrences(from, MG.ymd(now)).filter(function (o) { return o.endAt <= now; });
    return R.unreported(past, D.registrations, D.results);
  };
  A.arrivedPreorders = function () { return D.preorders.filter(function (o) { return o.status === 'arrived'; }); };
})();
