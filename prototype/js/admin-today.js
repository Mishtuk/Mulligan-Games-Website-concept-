/* Mulligan Games concept: admin Today, the counter check-in screen (DESIGN.md 9.2). The default admin screen.
 * Tonight's events as a row of buttons, the roster of the one you picked (check-in, payment, walk-ins, waitlist).
 */
(function () {
  'use strict';
  var MG = window.MG, D = MG.data, R = MG.rules, A = MG.act, U = MG.ui, V = MG.views, e = MG.esc, $ = U.$;
  var sel = null, roster = null;

  function todays(now) {
    var ymd = MG.ymd(now);
    return MG.allOccurrences(ymd, ymd).filter(function (o) { return !o.cancelled; });
  }
  function pickDefault(list, now) {
    if (!list.length) return null;
    var hasList = function (o) { return o.series.signup === 'here' || o.series.signup === 'counter'; };
    var on = list.filter(function (o) { return o.startAt <= now && o.endAt > now; });
    if (on.length) { var busy = on.filter(hasList).sort(function (a, b) { return R.counts(A.regs(b)).in - R.counts(A.regs(a)).in; })[0]; return (busy || on[0]).key; }
    var next = list.filter(function (o) { return o.startAt > now; });
    if (next.length) { var first = next.filter(function (o) { return o.startAt.getTime() === next[0].startAt.getTime(); }); return (first.filter(hasList)[0] || first[0]).key; }
    return list[list.length - 1].key;
  }
  function nextEventAfter(now) {
    var occs = MG.allOccurrences(MG.ymd(MG.addDays(now, 1)), MG.ymd(MG.addDays(now, 30))).filter(function (o) { return !o.cancelled; });
    return occs[0] || null;
  }
  function countText(o) {
    var s = o.series;
    if (s.signup === 'here' || s.signup === 'counter') {
      var c = R.counts(A.regs(o)), cap = MG.capOf(o);
      return c.in + (cap ? ' of ' + cap : '') + ' signed up' + (c.waitlist ? ', ' + c.waitlist + ' waiting' : '');
    }
    return 'Walk-in';
  }

  function renderTop() {
    var now = MG.now(), list = todays(now), st = MG.openStatus(now);
    $('#today-h').textContent = 'Today, ' + MG.fmtLongDate(now).replace(/^(\w+), (\w+) /, function (m, d, mo) { return d + ' ' + mo.slice(0, 3) + ' '; });
    $('#today-open').innerHTML = '<span class="ob-dot" aria-hidden="true"></span>' + e(st.open ? 'Open till ' + MG.fmtTime(st.closeHm) : 'Closed now');
    $('#today-open').setAttribute('data-open', st.open);

    // reminders: low stock, results not reported, preorders to call
    var pic = A.stockPicture(14), un = A.unreportedList(), arrived = A.arrivedPreorders(), chips = '';
    if (pic.alerts.low.length) chips += '<a class="rem rem-warn" href="' + e(U.href('inventory.html?f=low')) + '">' + MG.icon('alert') + pic.alerts.low.length + ' low in stock</a>';
    if (pic.alerts.short.length) chips += '<a class="rem rem-warn" href="' + e(U.href('inventory.html?f=short')) + '">' + MG.icon('alert') + pic.alerts.short.length + ' will run short for events</a>';
    if (un.length) {
      var o = un[0], d = MG.parseYmd(o.date);
      chips += '<a class="rem" href="' + e(U.href('events.html#roster/' + encodeURIComponent(o.key))) + '">' + MG.icon('pencil') + e(o.series.title + ' ' + MG.fmtDate(d)) + ' not reported' + (un.length > 1 ? ' (and ' + (un.length - 1) + ' more)' : '') + '</a>';
    }
    if (arrived.length) chips += '<a class="rem" href="' + e(U.href('inventory.html?f=arrived#preorders')) + '">' + MG.icon('bag') + arrived.length + (arrived.length === 1 ? ' preorder' : ' preorders') + ' arrived</a>';
    $('#reminders').innerHTML = chips;

    var keys = list.map(function (o) { return o.key; });
    if (!sel || keys.indexOf(sel) === -1) {
      var h = /^#e=(.+)$/.exec(location.hash), fromHash = h && decodeURIComponent(h[1]);
      sel = fromHash && keys.indexOf(fromHash) !== -1 ? fromHash : pickDefault(list, now);
    }
    var empty = $('#today-empty'), main = $('#today-main');
    if (!list.length) {
      var nx = nextEventAfter(now);
      empty.hidden = false; main.hidden = true;
      empty.innerHTML = '<div class="empty lattice" role="note"><p class="empty-h">Nothing on today.</p><p>' + (nx ? 'The next event is ' + e(nx.series.title) + ', ' + e(MG.relDay(nx.date, now) === 'tomorrow' ? 'tomorrow' : MG.dayName(MG.parseYmd(nx.date))) + ' at ' + e(MG.fmtTime(nx.start)) + '.' : 'Nothing is scheduled yet.') + '</p>' +
        '<a class="btn btn-act" href="' + e(U.href('events.html#new')) + '">Make a one-off event</a></div>';
      return;
    }
    empty.hidden = true; main.hidden = false;
    $('#evsel').innerHTML = list.map(function (o) {
      var over = o.endAt <= now;
      return '<li><button type="button" class="evb" title="' + e(o.series.title) + '" data-key="' + e(o.key) + '" data-game="' + e(o.series.game) + '" aria-pressed="' + (o.key === sel) + '">' +
        '<span class="evb-t">' + e(MG.fmtTime(o.start)) + '</span><span class="evb-n">' + e(o.series.title) + '</span><span class="evb-c">' + e(countText(o)) + (over ? ', finished' : '') + '</span></button></li>';
    }).join('');
  }

  function init() {
    MG.shell.init();
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('.evb'); if (!b) return;
      sel = b.getAttribute('data-key'); history.replaceState(null, '', location.pathname + location.search + '#e=' + encodeURIComponent(sel));
      renderTop(); roster.render();
    });
    renderTop();
    roster = V.mountRoster($('#roster'), { getKey: function () { return sel; }, onResults: V.openResults });
    MG.state.subscribe(renderTop);
  }
  try { init(); } catch (err) {
    var m = document.getElementById('main'); if (m) m.innerHTML = '<div class="empty" role="alert"><p class="empty-h">Today didn’t load.</p><p>Reload the page. Nothing was lost.</p></div>';
    if (window.console) console.error(err);
  }
})();
