/* A very small test runner for tests.html: T.section(), T.test(name, fn), T.async(name, fn -> Promise), T.eq, T.ok.
 * Results are drawn into #results; a one-line summary goes into #summary and the page title
 * (so a headless browser can read it). */
(function () {
  'use strict';
  var T = window.T = { SKIP: {}, passed: 0, failed: 0, skipped: 0, list: null, queue: [], lists: {}, cur: null };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  T.section = function (name) {
    var h = document.createElement("h2"); h.textContent = name; document.getElementById("results").appendChild(h);
    T.list = document.createElement("ul"); document.getElementById("results").appendChild(T.list);
    T.lists[name] = T.list; T.cur = name;
  };
  function row(cls, name, detail) {
    var li = document.createElement('li'); li.className = cls;
    li.innerHTML = '<span class="mark">' + (cls === 'pass' ? 'PASS' : cls === 'skip' ? 'SKIP' : 'FAIL') + '</span> ' + esc(name) + (detail ? '<pre>' + esc(detail) + '</pre>' : '');
    T.list.appendChild(li);
  }
  T.test = function (name, fn) {
    if (!T.list) T.section('Tests');
    if (T.running) return;
    try { fn(); T.passed++; row('pass', name); }
    catch (err) { T.failed++; row('fail', name, err && err.message ? err.message : String(err)); }
  };
  // async tests run one after another once every file has loaded (see T.run)
  T.async = function (name, fn) { T.queue.push({ name: name, fn: fn, section: T.cur }); };
  T.skip = function (name, why) { T.skipped++; row('skip', name, why); };
  function plain(v) { return typeof v === 'string' ? v.replace(/ /g, ' ') : v; } // times use a no-break space
  T.eq = function (actual, expected, label) {
    actual = plain(actual); expected = plain(expected);
    if (actual !== expected) throw new Error((label ? label + ': ' : '') + 'expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual));
  };
  T.ok = function (cond, label) { if (!cond) throw new Error('not true' + (label ? ': ' + label : '')); };
  T.wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  T.run = function () {
    T.running = true; T.SKIP = T.SKIP || {};
    var chain = Promise.resolve();
    T.queue.forEach(function (it) {
      chain = chain.then(function () {
        T.list = T.lists[it.section] || T.list;
        return Promise.resolve().then(it.fn).then(function (res) { if (res === T.SKIP) { T.skipped++; row("skip", it.name, "the browser blocks reading pages inside pages on file:// (start Chrome with --allow-file-access-from-files, or serve the folder)"); } else { T.passed++; row("pass", it.name); } }, function (err) { T.failed++; row("fail", it.name, err && err.message ? err.message : String(err)); });
      });
    });
    return chain.then(T.finish, T.finish);
  };
  T.finish = function () {
    var s = T.passed + ' passed, ' + T.failed + ' failed' + (T.skipped ? ', ' + T.skipped + ' skipped' : '');
    var el = document.getElementById('summary'); el.textContent = s; el.className = T.failed ? 'fail' : 'pass';
    document.title = (T.failed ? 'FAIL: ' : 'PASS: ') + s;
  };
})();
