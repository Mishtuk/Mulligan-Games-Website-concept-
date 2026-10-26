/* Mulligan Games concept: HTML builders for the admin screens (rows, lists, results form).
 * Every value a person typed (names, contacts, titles, notes, product names) goes through MG.esc().
 * The screens' behaviour is in admin-today.js, admin-events.js, admin-inventory.js; these only return strings.
 */
(function () {
  'use strict';
  var MG = window.MG, R = MG.rules, S = MG.stock, U = MG.ui, e = MG.esc;
  var V = MG.views = MG.views || {};

  V.btn = function (cls, attrs, inner) { return '<button type="button" class="' + cls + '" ' + attrs + '>' + inner + '</button>'; };
  V.catLabel = { sealed: 'Sealed', singles: 'Singles', accessory: 'Accessories', miniature: 'Miniatures', paint: 'Paint', other: 'Other' };

  /* ---------- roster rows (Today and roster page) ---------- */
  V.contactLinks = function (c) {
    c = String(c || '');
    return c.split(' / ').filter(Boolean).map(function (part) {
      var p = part.trim();
      if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p)) return '<a href="mailto:' + e(encodeURI(p)) + '">' + e(p) + '</a>';
      var d = p.replace(/\D/g, '');
      return d.length >= 7 ? '<a href="tel:' + e(d) + '">' + e(p) + '</a>' : e(p);
    }).join(' and ');
  };
  V.regRow = function (r, o) {
    o = o || {};
    var idLine = r.playerId ? '<span class="rr-meta">' + e(o.idLabel || 'Player ID') + ' ' + e(r.playerId) + '</span>' : '';
    var when = r.createdAt ? '<span class="rr-meta">' + (r.walkIn ? 'Walk-in ' : 'Signed up ') + e(U.stamp(r.createdAt)) + '</span>' : '';
    var contact = o.showContact ? '<span class="rr-contact">' + (r.contact ? V.contactLinks(r.contact) : 'No contact given') + '</span>' : '';
    var checked = !!r.checkedIn, nm = e(r.name);
    var pay = '';
    if (o.fee !== 0 && r.status === 'in') {
      pay = '<div class="pay" role="group" aria-label="Payment for ' + nm + '">' + R.PAYMENTS.map(function (p) {
        return '<button type="button" class="pay-b" data-act="pay" data-v="' + p + '" aria-pressed="' + (r.payment === p) + '" title="' + e(R.PAYMENT_LABEL[p]) + '">' + e(R.PAYMENT_SHORT[p]) + '</button>';
      }).join('') + '</div>' +
        '<label class="pay-sel"><span class="vh">Payment for ' + nm + '</span><select data-act="paysel">' + R.PAYMENTS.map(function (p) {
          return '<option value="' + p + '"' + (r.payment === p ? ' selected' : '') + '>' + e(R.PAYMENT_LABEL[p]) + '</option>';
        }).join('') + '</select></label>';
    } else if (r.status === 'in') pay = '<span class="tag pay-free">Free entry</span>';
    return '<li class="rrow" data-reg="' + e(r.id) + '" data-status="' + e(r.status) + '"' + (checked ? ' data-checked' : '') + (o.flash ? ' data-flash' : '') + '>' +
      '<button type="button" class="chk56" data-act="checkin" aria-pressed="' + checked + '" aria-label="' + (checked ? 'Undo check-in for ' : 'Check in ') + nm + '">' +
        MG.icon('check') + '<span class="chk-t">' + (checked ? 'Checked in' : 'Check in') + '</span></button>' +
      '<div class="rr-who"><strong class="rr-name">' + nm + '</strong>' + idLine + when + contact + (o.promoted ? '<span class="tag tag-ok">Moved in from the waitlist</span>' : '') + '</div>' +
      pay + V.rowMenu(r, o) + '</li>';
  };
  V.rowMenu = function (r, o) {
    return '<details class="menu"><summary aria-label="More for ' + e(r.name) + '">' + MG.icon('dots') + '</summary><div class="menu-pop">' +
      V.btn('menu-b', 'data-act="edit"', MG.icon('pencil') + 'Edit name or contact') +
      V.btn('menu-b', 'data-act="contact"', MG.icon('eye') + (o && o.showContact ? 'Hide contact' : 'Show contact')) +
      V.btn('menu-b menu-bad', 'data-act="cancel"', MG.icon('cancel') + 'Cancel sign-up') + '</div></details>';
  };
  V.waitRow = function (r, o) {
    o = o || {};
    var nm = e(r.name), contact = o.showContact ? '<span class="rr-contact">' + (r.contact ? V.contactLinks(r.contact) : 'No contact given') + '</span>' : '';
    return '<li class="rrow rrow-wait" data-reg="' + e(r.id) + '" data-status="waitlist">' +
      '<span class="wpos" aria-label="Number ' + e(r.waitlistPos) + ' on the waitlist">#' + e(r.waitlistPos) + '</span>' +
      '<div class="rr-who"><strong class="rr-name">' + nm + '</strong><span class="rr-meta">Signed up ' + e(U.stamp(r.createdAt)) + '</span>' + contact + '</div>' +
      V.btn('btn btn-2 wmove', 'data-act="movein"', MG.icon('arrowup') + 'Move in<span class="vh"> ' + nm + '</span>') +
      '<details class="menu"><summary aria-label="More for ' + nm + '">' + MG.icon('dots') + '</summary><div class="menu-pop">' +
        V.btn('menu-b', 'data-act="up"', MG.icon('arrowup') + 'Move up the list') + V.btn('menu-b', 'data-act="down"', MG.icon('arrowdown') + 'Move down the list') +
        V.btn('menu-b', 'data-act="contact"', MG.icon('eye') + (o.showContact ? 'Hide contact' : 'Show contact')) +
        V.btn('menu-b menu-bad', 'data-act="cancel"', MG.icon('cancel') + 'Remove from the waitlist') + '</div></details></li>';
  };
  V.cancelledRow = function (r) {
    return '<li class="rrow rrow-off" data-reg="' + e(r.id) + '" data-status="cancelled"><div class="rr-who"><strong class="rr-name">' + e(r.name) + '</strong>' +
      '<span class="rr-meta">Cancelled</span></div></li>';
  };

  /* ---------- results form (DESIGN.md 9.4) ---------- */
  V.resultsForm = function (occ, rec, ctx) {
    var s = occ.series, tool = s.tool && s.tool.name && s.tool.name !== 'another site' ? s.tool.name : null;
    var top = (rec && rec.top) || [], names = ctx.names || [], rows = (rec && rec.prizeRows && rec.prizeRows.length ? rec.prizeRows : []);
    var prodOpts = function (sel) {
      return '<option value="">Pick a product</option>' + ctx.products.map(function (p) { return '<option value="' + e(p.id) + '"' + (p.id === sel ? ' selected' : '') + '>' + e(p.name) + '</option>'; }).join('');
    };
    var topInputs = '';
    for (var i = 2; i <= 8; i++) topInputs += '<label class="fld"><span>' + i + (i === 2 ? 'nd' : i === 3 ? 'rd' : 'th') + ' place</span><input name="top' + i + '" list="rn-' + e(occ.key) + '" value="' + e(top[i - 1] || '') + '" autocomplete="off"></label>';
    return '<form class="rf" novalidate data-key="' + e(occ.key) + '">' +
      '<datalist id="rn-' + e(occ.key) + '">' + names.map(function (n) { return '<option value="' + e(n) + '">'; }).join('') + '</datalist>' +
      '<p class="su-err" role="alert" hidden></p>' +
      '<div class="rf-grid"><label class="fld"><span>Players <small>(from check-ins, you can change it)</small></span><input name="headcount" inputmode="numeric" value="' + e(rec && rec.headcount != null ? rec.headcount : ctx.headcount) + '" aria-describedby="e-headcount"><em class="err" id="e-headcount" hidden></em></label>' +
      '<label class="fld"><span>Winner</span><input name="winner" list="rn-' + e(occ.key) + '" value="' + e((rec && rec.winner) || top[0] || '') + '" autocomplete="off"></label></div>' +
      '<details class="rf-top"' + (top.length > 1 ? ' open' : '') + '><summary>Top 8</summary><div class="rf-grid">' + topInputs + '</div></details>' +
      '<fieldset class="rf-prizes"><legend>Prizes given</legend><div class="rf-rows" id="prize-rows">' + rows.map(function (r) { return V.prizeRow(r, prodOpts(r.product)); }).join('') + '</div>' +
      '<button type="button" class="btn btn-2 btn-sm" data-act="add-prize">' + MG.icon('plus') + 'Add a prize</button>' +
      '<label class="fld rf-text"><span>Anything else <small>(for the website, e.g. "Playmat for the winner")</small></span><input name="prizes" value="' + e((rec && rec.prizes) || '') + '" autocomplete="off"></label>' +
      '<label class="fld"><span>Store credit given <small>(for example "$10 each for top 4")</small></span><input name="credit" value="' + e((rec && rec.credit) || '') + '" autocomplete="off"></label></fieldset>' +
      (ctx.useLines.length ? '<label class="chk"><input type="checkbox" name="takeStock"' + (ctx.takeStock ? ' checked' : '') + '><span>Take what the event used out of stock: <span id="use-hint">' + e(ctx.useHint) + '</span></span></label>' : '') +
      '<label class="chk"><input type="checkbox" name="reported"' + (rec && rec.reported ? ' checked' : '') + '><span>Reported to ' + e(tool || 'the publisher tool') + '</span></label>' +
      '<label class="chk"><input type="checkbox" name="public"' + (rec && rec.public ? ' checked' : '') + '><span>Show these results on the website</span></label>' +
      '<p class="rf-acts"><button type="submit" class="btn btn-act">Save results</button></p></form>';
  };
  V.prizeRow = function (r, optsHtml) {
    return '<div class="prow"><label class="fld"><span class="vh">Product</span><select name="pp">' + optsHtml + '</select></label>' +
      '<label class="fld"><span class="vh">How many</span><input name="pq" inputmode="numeric" value="' + e(r.qty || '') + '" placeholder="How many"></label>' +
      V.btn('btn btn-2 btn-sm', 'data-act="del-prize" aria-label="Remove this prize"', MG.icon('trash')) + '</div>';
  };

  /* ---------- events list row ---------- */
  V.eventRow = function (s, o) {
    o = o || {};
    var now = o.now, game = MG.game(s.game), next = o.next, st = next && MG.seatState(next, now);
    var seats = s.capacity ? s.capacity + ' seats' : s.signup === 'walkin' ? 'No limit' : 'No seat limit';
    var nextLine = '';
    if (next) {
      var d = MG.parseYmd(next.date), c = R.counts(R.group(MG.data.registrations, { series: s.id, date: next.date, start: next.start }));
      nextLine = 'Next: ' + MG.dayShort(d) + ' ' + MG.fmtDate(d);
      if (next.cancelled) nextLine += ', cancelled';
      else if (s.signup === 'here') nextLine += ', ' + c.in + (MG.capOf(next) ? ' of ' + MG.capOf(next) : ' signed up') + (c.waitlist ? ', ' + c.waitlist + ' waiting' : '');
    }
    var fee = s.fee == null ? 'Fee not set' : MG.fmtFee(s.fee) === 'Free' ? 'Free' : '$' + s.fee;
    return '<li class="erow' + (s.enabled === false ? ' erow-off' : '') + '" data-series="' + e(s.id) + '" data-game="' + e(s.game) + '">' +
      '<div class="erow-main"><div class="erow-head"><h3 class="erow-title">' + e(s.title) + '</h3>' + MG.gameBadge(s.game) + (s.enabled === false ? '<span class="tag">Hidden from the website</span>' : '') + '</div>' +
      '<p class="erow-sum">' + e(R.recurrenceSummary(s)) + '</p>' +
      '<p class="erow-meta"><span>' + e(fee) + '</span><span>' + e(seats) + '</span><span>' + e(R.signupWords(s)) + '</span></p>' +
      (nextLine ? '<p class="erow-next">' + e(nextLine) + '</p>' : '') + '</div>' +
      '<div class="erow-acts"><label class="sw"><input type="checkbox" role="switch" data-act="shown"' + (s.enabled === false ? '' : ' checked') + '><span class="sw-t">Showing on the website</span></label>' +
      V.btn('btn btn-2', 'data-act="edit"', MG.icon('pencil') + 'Edit<span class="vh"> ' + e(s.title) + '</span>') +
      V.btn('btn btn-2', 'data-act="expand" aria-expanded="' + (!!o.open) + '"', 'Dates' + MG.icon('chevdown', 'chev')) + '</div>' +
      (o.open ? V.dateList(s, o.dates, now) : '') + '</li>';
  };
  V.dateList = function (s, occs, now) {
    if (!occs.length) return '<div class="erow-dates"><p class="hint">No dates coming up.</p></div>';
    return '<div class="erow-dates"><h4>Next dates</h4><ul class="dates">' + occs.map(function (o) {
      var d = MG.parseYmd(o.date), c = R.counts(R.group(MG.data.registrations, { series: s.id, date: o.date, start: o.start }));
      var count = s.signup === 'here' || c.in ? c.in + (MG.capOf(o) ? ' of ' + MG.capOf(o) : ' signed up') + (c.waitlist ? ', ' + c.waitlist + ' waiting' : '') : '';
      return '<li class="drow' + (o.cancelled ? ' drow-off' : '') + '" data-key="' + e(o.key) + '" data-date="' + e(o.date) + '"><div class="drow-when"><strong>' + e(MG.dayShort(d) + ' ' + MG.fmtDate(d) + ', ' + MG.fmtTime(o.start)) + '</strong>' +
        (o.cancelled ? '<span class="tag tag-bad">' + MG.icon('cancel') + 'Cancelled</span>' : '') + (o.note && !o.cancelled ? '<span class="tag tag-upd">' + MG.icon('pencil') + 'Updated</span>' : '') +
        (count ? '<span class="drow-n">' + e(count) + '</span>' : '') + (o.note ? '<span class="drow-note">' + e(o.note) + '</span>' : '') + '</div><div class="drow-acts">' +
        V.btn('btn btn-2 btn-sm', 'data-act="roster"', 'Roster<span class="vh"> for ' + e(MG.fmtDate(d)) + '</span>') +
        (o.cancelled ? V.btn('btn btn-2 btn-sm', 'data-act="restore"', 'Bring it back')
          : V.btn('btn btn-2 btn-sm', 'data-act="change"', 'Change this date') + V.btn('btn btn-bad btn-sm', 'data-act="cancel-date"', 'Cancel this date')) + '</div></li>';
    }).join('') + '</ul></div>';
  };

  /* ---------- inventory rows ---------- */
  V.badges = function (st) {
    var h = '';
    if (st.out) h += '<span class="tag tag-bad">' + MG.icon('alert') + 'Out</span>';
    else if (st.low) h += '<span class="tag tag-warn">' + MG.icon('alert') + 'Low</span>';
    if (st.short) h += '<span class="tag tag-bad">' + MG.icon('alert') + 'Short</span>';
    return h;
  };
  V.productRow = function (p, o) {
    o = o || {};
    var st = S.status(p, o.reserved && o.reserved.total), lines = (o.reserved && o.reserved.lines) || [];
    var g = p.game ? MG.gameBadge(p.game) : '<span class="tag">' + e(V.catLabel[p.category] || 'Other') + '</span>';
    var nm = e(p.name), sum = lines.slice(0, 3).map(function (l) { var d = MG.parseYmd(l.date); return e(l.title) + ' ' + e(MG.fmtDate(d)) + ': ' + l.qty; }).join(', ');
    var more = '';
    if (o.open) {
      var moves = (o.moves || []).slice(-10).reverse();
      more = '<div class="prod-more"><div><h4>Reserved for events</h4>' + (lines.length ? '<ul class="plain">' + lines.map(function (l) {
        var d = MG.parseYmd(l.date);
        return '<li>' + e(l.title) + ', ' + e(MG.dayShort(d) + ' ' + MG.fmtDate(d)) + ': <strong>' + l.qty + '</strong> <span class="rr-meta">' + (l.fixed ? 'fixed' : l.seats + ' seats') + '</span></li>';
      }).join('') + '</ul>' : '<p class="hint">Nothing in the next ' + e(o.look) + ' days.</p>') + '</div>' +
        '<div><h4>Last moves</h4>' + (moves.length ? '<ul class="plain">' + moves.map(function (m) {
          return '<li><strong>' + (m.qty > 0 ? '+' : '') + m.qty + '</strong> ' + e(S.REASONS[m.reason] || m.reason) + (m.note ? ', ' + e(m.note) : '') + ' <span class="rr-meta">' + e(U.stamp(m.at)) + '</span></li>';
        }).join('') + '</ul>' : '<p class="hint">No moves yet.</p>') + '</div>' +
        '<p class="prod-edit">' + V.btn('btn btn-2 btn-sm', 'data-act="edit"', MG.icon('pencil') + 'Edit product') + V.btn('btn btn-bad btn-sm', 'data-act="delete"', MG.icon('trash') + 'Delete product') + '</p></div>';
    }
    return '<article class="prod" data-id="' + e(p.id) + '"' + (st.out ? ' data-out' : st.low ? ' data-low' : '') + (st.short ? ' data-short' : '') + ' aria-label="' + nm + '">' +
      '<div class="prod-name"><h3>' + nm + '</h3><div class="prod-tags">' + g + V.badges(st) + '</div></div>' +
      '<dl class="prod-nums"><div class="n-hand"><dt>On hand</dt><dd>' + p.onHand + '</dd></div><div class="n-res"><dt>Reserved</dt><dd>' + st.reserved + '</dd></div>' +
      '<div class="n-free"><dt>Free</dt><dd' + (st.free < 0 ? ' class="neg"' : '') + '>' + st.free + '</dd></div><div class="n-low"><dt>Low at</dt><dd>' + (p.low || 'No alert') + '</dd></div></dl>' +
      (sum ? '<p class="prod-sum">For events: ' + sum + (lines.length > 3 ? ' and more' : '') + '</p>' : '') +
      '<div class="prod-acts">' + V.btn('stepper', 'data-act="minus" aria-label="Take one off ' + nm + '"', MG.icon('minus')) +
        V.btn('stepper', 'data-act="plus" aria-label="Add one to ' + nm + '"', MG.icon('plus')) +
        V.btn('btn btn-2', 'data-act="count" aria-expanded="' + (!!o.counting) + '"', 'Count<span class="vh"> ' + nm + '</span>') +
        V.btn('btn btn-2 btn-sm', 'data-act="more" aria-expanded="' + (!!o.open) + '"', 'Details' + MG.icon('chevdown', 'chev')) + '</div>' +
      (o.counting ? '<form class="prod-count" data-act="countform"><label class="fld"><span>Counted on the shelf</span><input name="n" inputmode="numeric" value="' + p.onHand + '" autocomplete="off" aria-describedby="e-count-' + e(p.id) + '"></label>' +
        '<button type="submit" class="btn btn-act">Save count</button><button type="button" class="btn btn-2" data-act="count-cancel">Cancel</button><em class="err" id="e-count-' + e(p.id) + '" hidden></em></form>' : '') +
      more + '</article>';
  };

  /* ---------- preorder rows ---------- */
  var POICON = { waiting: 'hourglass', arrived: 'box', picked: 'check', cancelled: 'cancel' };
  V.preorderRow = function (o, ctx) {
    ctx = ctx || {};
    var nm = e(o.customer);
    var contact = ctx.showContact ? '<span class="rr-contact">' + (o.contact ? V.contactLinks(o.contact) : '') + '</span>' : '';
    var call = (o.status === 'arrived' && ctx.bigCall) ? '<p class="po-call">' + callLinks(o.contact, o.customer) + '</p>' : '';
    return '<li class="po" data-id="' + e(o.id) + '" data-status="' + e(o.status) + '"><div class="po-who"><strong class="rr-name">' + nm + '</strong>' +
      '<span class="rr-meta">' + e(o.qty) + ' x ' + e(ctx.product || '') + ', deposit $' + e(o.deposit || 0) + ', ordered ' + e(MG.fmtDate(MG.parseYmd(o.createdAt))) + '</span>' + contact +
      V.btn('linkbtn', 'data-act="contact"', MG.icon('eye') + (ctx.showContact ? 'Hide contact' : 'Show contact') + '<span class="vh"> for ' + nm + '</span>') + call + '</div>' +
      '<div class="seg" role="group" aria-label="Status for ' + nm + '">' + S.PREORDER.map(function (s) {
        return '<button type="button" class="seg-b" data-act="status" data-v="' + s + '" aria-pressed="' + (o.status === s) + '">' + MG.icon(POICON[s]) + e(S.PREORDER_LABEL[s]) + '</button>';
      }).join('') + '</div></li>';
  };
  function callLinks(contact, who) {
    return String(contact || '').split(' / ').filter(Boolean).map(function (part) {
      var p = part.trim();
      if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p)) return '<a class="btn btn-act" href="mailto:' + e(encodeURI(p)) + '">' + MG.icon('mail') + 'Email ' + e(who) + '</a>';
      var d = p.replace(/\D/g, '');
      return d.length >= 7 ? '<a class="btn btn-act" href="tel:' + e(d) + '">' + MG.icon('phone') + 'Call ' + e(who) + ' at ' + e(p) + '</a>' : '';
    }).join(' ');
  }
})();
