/* Mulligan Games concept: demo state that survives page changes.
 *
 * The data starts as window.MG_SAMPLE. Anything the owners change (sign-ups, check-ins, events, stock, preorders)
 * is saved to localStorage (always inside try/catch) and laid back over MG_SAMPLE on every page load, so the
 * public pages and the admin pages show the same shop. "Reset demo data" puts the sample back.
 *
 * Load after js/mg.js. Works on the front page too (index.html loads this one file to show live seat counts).
 * Tests set window.MG_NO_PERSIST = true first so they never touch the owners' saved demo.
 *
 * Safety (owner rule): this file never builds HTML. Whatever comes back from localStorage is plain data and is
 * escaped (MG.esc) or set with textContent wherever it is shown.
 */
(function () {
  'use strict';
  var MG = window.MG, D = MG.data;
  var KEYS = ['series', 'exceptions', 'registrations', 'results', 'products', 'stockMoves', 'eventProductUse', 'preorders', 'templates', 'headcounts', 'seq'];
  var STORE_KEY = 'mg-demo-v1', VERSION = 1;
  var persist = !window.MG_NO_PERSIST;
  var listeners = [];

  function pick() { var o = {}; KEYS.forEach(function (k) { o[k] = D[k]; }); return o; }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // the extras the admin needs on top of the sample
  var X = window.MG_EXTRA || { productRelease: {} };
  D.templates = []; D.headcounts = {}; D.seq = 100;
  D.products.forEach(function (p) { if (!p.release && X.productRelease[p.id]) p.release = X.productRelease[p.id]; });
  var pristine = JSON.stringify(pick());

  function apply(text) {
    var o = JSON.parse(text);
    KEYS.forEach(function (k) { if (o[k] !== undefined) D[k] = o[k]; });
  }
  function load() {
    if (!persist) return false;
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return false;
      var o = JSON.parse(raw);
      if (!o || o.v !== VERSION || !o.data) return false;
      KEYS.forEach(function (k) { if (o.data[k] !== undefined) D[k] = o.data[k]; });
      return true;
    } catch (err) { return false; }
  }
  load();

  var S = MG.state = {
    persisting: persist,
    snapshot: function () { return JSON.stringify(pick()); },
    restore: function (text) { apply(text); S.save(); S.notify(); },
    save: function () {
      if (!persist) return;
      try { localStorage.setItem(STORE_KEY, JSON.stringify({ v: VERSION, data: pick() })); } catch (err) { /* private window or full: the demo still works until the page closes */ }
    },
    reset: function () {
      var before = S.snapshot();
      apply(pristine);
      if (persist) { try { localStorage.removeItem(STORE_KEY); } catch (err) { /* ignore */ } }
      S.notify();
      return before;
    },
    // a pristine copy of the sample, for tests and "is this changed?"
    pristine: function () { return clone(JSON.parse(pristine)); },
    isChanged: function () { return S.snapshot() !== pristine; },
    subscribe: function (fn) { listeners.push(fn); return function () { var i = listeners.indexOf(fn); if (i !== -1) listeners.splice(i, 1); }; },
    notify: function () { listeners.forEach(function (fn) { try { fn(); } catch (err) { if (window.console) console.error(err); } }); },
    nextId: function (prefix) { D.seq = (D.seq || 100) + 1; return prefix + D.seq; }
  };

  // another tab changed the demo (or reset it): follow it
  if (persist) window.addEventListener('storage', function (ev) {
    if (ev.key !== STORE_KEY) return;
    if (!load()) apply(pristine);
    S.notify();
  });
})();
