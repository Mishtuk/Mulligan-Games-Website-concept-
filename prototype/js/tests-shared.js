/* Tests for the shared pieces in ui.js: toast pause and Undo size, the demo bar. */
(function () {
  'use strict';
  var T = window.T, MG = window.MG, U = MG.ui;
  T.section('Shared UI');

  T.async('toast stays while hovered or focused and hides after leaving', function () {
    U.toast('Checked in.', { ms: 60 });
    var el = document.querySelector('.toast');
    el.dispatchEvent(new Event('pointerenter'));
    return T.wait(150).then(function () {
      T.ok(el.classList.contains('on'), 'still shown while hovered');
      el.dispatchEvent(new Event('pointerleave'));
      return T.wait(150);
    }).then(function () {
      T.ok(!el.classList.contains('on'), 'hidden after leaving');
      U.toast('Again.', { ms: 60 });
      el.dispatchEvent(new Event('focusin'));
      return T.wait(150);
    }).then(function () {
      T.ok(el.classList.contains('on'), 'still shown while focused');
      el.dispatchEvent(new Event('focusout'));
      return T.wait(150);
    }).then(function () { T.ok(!el.classList.contains('on'), 'hidden after focus leaves'); });
  });

  T.test('the toast Undo button is at least 48px tall', function () {
    U.toast('Done.', { undo: '{}', ms: 100000 });
    var b = document.querySelector('.toast .toast-btn'), h = b.getBoundingClientRect().height;
    document.querySelector('.toast').classList.remove('on');
    T.ok(h >= 48, 'height ' + h);
  });

  function bar(opts) {
    var host = document.createElement('aside'); document.getElementById('sandbox').appendChild(host);
    U.demoBar(host, opts); return host;
  }

  T.test('demo bar select lists every moment plus Real clock; changes keep the hash', function () {
    var host = bar(), sel = host.querySelector('select');
    var labels = Array.prototype.map.call(sel.options, function (o) { return o.textContent; });
    MG.data.demoMoments.forEach(function (m) { T.ok(labels.indexOf(m.label) !== -1, m.label); });
    T.ok(labels.indexOf('Real clock') !== -1, 'Real clock');
    var real = Array.prototype.filter.call(sel.options, function (o) { return o.value === 'real'; })[0];
    T.ok(/now=real/.test(real.getAttribute('data-href')), real.getAttribute('data-href'));
    var old = location.hash; location.hash = '#keepme';
    var host2 = bar(), o2 = host2.querySelector('select').options[0];
    var href = o2.getAttribute('data-href'); location.hash = old;
    T.ok(/#keepme$/.test(href), href);
    var navTo = null, keep = U.nav; U.nav = function (h) { navTo = h; };
    sel.selectedIndex = 1; sel.dispatchEvent(new Event('change')); U.nav = keep;
    T.eq(navTo, sel.options[1].getAttribute('data-href'));
    host.remove(); host2.remove();
  });

  T.test('a hostile note and owners label in the demo bar show as text', function () {
    var bad = '<img src=x onerror="window.__xss=1"><script>window.__xss=1<\/script>';
    var host = bar({ note: bad, owners: { href: 'admin/index.html', label: bad } });
    T.ok(host.textContent.indexOf(bad) !== -1, 'text shown');
    T.eq(host.querySelectorAll('img, script').length, 0);
    T.eq(window.__xss, 0);
    T.eq(host.querySelector('.demo-owners a').getAttribute('href'), 'admin/index.html');
    host.remove();
  });

  T.test('demo bar reset without MG.act calls MG.state.reset then reloads', function () {
    var act = MG.act, reset = MG.state.reset, reload = U.reload, calls = [];
    MG.act = undefined; MG.state.reset = function () { calls.push('reset'); return '{}'; }; U.reload = function () { calls.push('reload'); };
    try { var host = bar(); host.querySelector('#reset-demo').click(); host.remove(); }
    finally { MG.act = act; MG.state.reset = reset; U.reload = reload; }
    T.eq(calls.join(','), 'reset,reload');
  });
})();
