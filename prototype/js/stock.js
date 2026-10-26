/* Mulligan Games concept: stock, reservations and preorders, as plain functions (DECISIONS.md D7, D8; DESIGN.md 9.5, 9.6).
 *
 * Rules:
 *   - On hand = the opening count plus every stock move (+ in, - out). It never goes below 0 through a sale, prize or event use.
 *   - "Count now": the shelf count wins; the difference is saved as a "counted" move.
 *   - Reserved = what upcoming events (inside the look-ahead window, cancelled dates skipped) will use:
 *       fixed qty, or per seat x seats. Seats = the date's cap, else the "seats per date" guess, else the sign-ups so far.
 *   - Low: on hand is at or under the product's low-stock number (a number of 0 means "no alert").
 *     Short: reserved is more than on hand. Out: 0 on hand. Free = on hand - reserved.
 *   - Preorders move waiting -> arrived -> picked up (or cancelled). Picked up takes the qty off the shelf.
 * No DOM, no storage.
 */
(function () {
  'use strict';
  var MG = window.MG;
  var S = MG.stock = {};

  S.REASONS = { received: 'Received', sold: 'Sold', counted: 'Counted', event: 'Used at an event', prize: 'Prize', adjust: 'Adjusted', pickup: 'Preorder pickup' };

  function find(products, id) { for (var i = 0; i < products.length; i++) if (products[i].id === id) return products[i]; return null; }
  S.find = find;

  /* Apply one move. move: { product, qty (+/-), reason, event?, date?, at, who, note? }. */
  S.applyMove = function (products, moves, move) {
    var p = find(products, move.product), qty = Number(move.qty);
    if (!p) return { ok: false, error: 'unknown', message: 'That product is gone.' };
    if (!isFinite(qty) || qty !== Math.floor(qty) || qty === 0) return { ok: false, error: 'qty', message: 'Use a whole number that isn’t 0.' };
    if (p.onHand + qty < 0) return { ok: false, error: 'short', onHand: p.onHand, message: 'Only ' + p.onHand + ' on hand.' };
    p.onHand += qty;
    move.qty = qty;
    moves.push(move);
    return { ok: true, product: p, move: move };
  };

  /* "Count now": set on hand to what is on the shelf. */
  S.countTo = function (products, moves, id, counted, meta) {
    var p = find(products, id), n = Number(counted);
    if (!p) return { ok: false, error: 'unknown' };
    if (!isFinite(n) || n < 0 || n !== Math.floor(n)) return { ok: false, error: 'qty', message: 'Counted must be a whole number, 0 or more.' };
    var diff = n - p.onHand;
    if (diff === 0) return { ok: true, none: true, product: p };
    return S.applyMove(products, moves, { product: id, qty: diff, reason: 'counted', at: meta.at, who: meta.who });
  };

  // on hand rebuilt from the opening count and the moves (the cached onHand must always equal this)
  S.onHandFromMoves = function (opening, moves, id) {
    return moves.reduce(function (n, m) { return m.product === id ? n + m.qty : n; }, opening);
  };

  /* ---------- reservations ---------- */
  /* uses: eventProductUse rows. occs: [{ series: { id, title }, key, date, start, cancelled, cap, taken }].
   * Returns lines: { product, series, title, key, date, start, qty, seats } for every date that will use stock. */
  S.reservations = function (uses, occs) {
    var lines = [];
    uses.forEach(function (u) {
      occs.forEach(function (o) {
        if (o.series.id !== u.series || o.cancelled) return;
        var seats = o.cap || u.seatsPerDate || o.taken || 0;
        var qty = u.fixed != null ? u.fixed : (u.perSeat || 0) * seats;
        if (qty > 0) lines.push({ product: u.product, series: o.series.id, title: o.series.title, key: o.key, date: o.date, start: o.start, qty: qty, seats: seats, fixed: u.fixed != null });
      });
    });
    return lines;
  };
  S.reservedByProduct = function (lines) {
    var map = {};
    lines.forEach(function (l) {
      var m = map[l.product] || (map[l.product] = { total: 0, lines: [] });
      m.total += l.qty; m.lines.push(l);
    });
    return map;
  };
  /* What an event takes from stock when it is over: fixed qty, or per seat x the real headcount. */
  S.usedAtEvent = function (uses, seriesId, headcount) {
    return uses.filter(function (u) { return u.series === seriesId; }).map(function (u) {
      return { product: u.product, qty: u.fixed != null ? u.fixed : (u.perSeat || 0) * (headcount || 0) };
    }).filter(function (x) { return x.qty > 0; });
  };

  /* ---------- low, short, out ---------- */
  S.status = function (p, reserved) {
    reserved = reserved || 0;
    var out = p.onHand <= 0;
    return {
      out: out,
      low: !!p.low && p.onHand <= p.low,
      short: reserved > p.onHand,
      reserved: reserved,
      free: p.onHand - reserved
    };
  };
  /* Products that need attention, from the reservation map. */
  S.alerts = function (products, reservedMap) {
    var low = [], short = [], attention = [];
    products.forEach(function (p) {
      if (p.enabled === false) return;
      var st = S.status(p, reservedMap[p.id] && reservedMap[p.id].total);
      if (st.low || st.out && p.low) low.push(p);
      if (st.short) short.push(p);
      if (st.low || st.short || st.out) attention.push(p);
    });
    return { low: low, short: short, attention: attention };
  };

  /* ---------- preorders ---------- */
  S.PREORDER = ['waiting', 'arrived', 'picked', 'cancelled'];
  S.PREORDER_LABEL = { waiting: 'Waiting', arrived: 'Arrived', picked: 'Picked up', cancelled: 'Cancelled' };
  var FLOW = { waiting: ['arrived', 'cancelled'], arrived: ['waiting', 'picked', 'cancelled'], picked: ['arrived'], cancelled: ['waiting'] };
  S.canMove = function (from, to) { return from === to || (FLOW[from] || []).indexOf(to) !== -1; };
  /* what is still owed: waiting and arrived orders */
  S.preorderTotals = function (list) {
    var open = list.filter(function (o) { return o.status === 'waiting' || o.status === 'arrived'; }), who = {};
    open.forEach(function (o) { who[String(o.customer).toLowerCase()] = 1; });
    return { qty: open.reduce(function (n, o) { return n + o.qty; }, 0), customers: Object.keys(who).length, deposits: open.reduce(function (n, o) { return n + (o.deposit || 0); }, 0) };
  };
  /* Change a preorder's status. Picked up takes the qty off the shelf (a "pickup" move) when there is enough;
   * going back from picked up puts it back. Returns { ok, stockNote }. */
  S.setPreorderStatus = function (products, moves, order, to, meta) {
    if (!S.canMove(order.status, to)) return { ok: false, error: 'flow', message: 'That order can’t go from ' + S.PREORDER_LABEL[order.status].toLowerCase() + ' to ' + S.PREORDER_LABEL[to].toLowerCase() + '.' };
    var from = order.status, note = null;
    if (to === 'picked' && from !== 'picked') {
      var r = S.applyMove(products, moves, { product: order.product, qty: -order.qty, reason: 'pickup', at: meta.at, who: meta.who, note: order.customer });
      if (r.ok) order.pickupMove = true; else note = 'Stock was not reduced: only ' + r.onHand + ' on hand.';
    }
    if (from === 'picked' && to !== 'picked' && order.pickupMove) {
      S.applyMove(products, moves, { product: order.product, qty: order.qty, reason: 'adjust', at: meta.at, who: meta.who, note: 'Pickup undone: ' + order.customer });
      order.pickupMove = false;
    }
    order.status = to;
    return { ok: true, stockNote: note };
  };
})();
