/* Light/dark switch (D46): the round button from the Warminster VFW site, fixed bottom-right on every public page and the admin.
 * Moon in light mode, sun in dark mode. The theme lives in <meta name="color-scheme"> (set before first paint from mg-scheme);
 * choosing the system's own scheme forgets the choice, so the page follows the system again. Standalone: no MG needed.
 * Built with DOM calls only (no innerHTML). */
(function () {
  'use strict';
  var meta = document.querySelector('meta[name="color-scheme"]');
  if (!meta || document.querySelector('.theme-fab')) return;
  var NS = 'http://www.w3.org/2000/svg';
  var mq = matchMedia('(prefers-color-scheme: dark)');
  function svg(cls, shapes) {
    var s = document.createElementNS(NS, 'svg'); s.setAttribute('class', cls); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
    shapes.forEach(function (d) {
      var p = document.createElementNS(NS, d.cx ? 'circle' : 'path');
      Object.keys(d).forEach(function (k) { p.setAttribute(k, d[k]); }); s.appendChild(p);
    });
    return s;
  }
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'theme-fab'; btn.setAttribute('aria-label', 'Switch to dark mode'); btn.dataset.next = 'dark';
  btn.appendChild(svg('ico-moon', [{ d: 'M20 14.5A8 8 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z' }]));
  btn.appendChild(svg('ico-sun', [{ cx: '12', cy: '12', r: '4.2' }, { d: 'M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8' }]));
  function now() { return meta.content === 'light' || meta.content === 'dark' ? meta.content : mq.matches ? 'dark' : 'light'; }
  function paint() {
    var next = now() === 'dark' ? 'light' : 'dark';
    btn.dataset.next = next; btn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
  }
  btn.addEventListener('click', function () {
    var t = now() === 'dark' ? 'light' : 'dark', sys = mq.matches ? 'dark' : 'light';
    meta.content = t === sys ? 'light dark' : t;
    try { if (t === sys) localStorage.removeItem('mg-scheme'); else localStorage.setItem('mg-scheme', t); } catch (e) { /* storage blocked: the choice lasts for this visit */ }
    paint();
  });
  addEventListener('storage', function (e) { if (e.key === 'mg-scheme') { meta.content = e.newValue || 'light dark'; paint(); } });
  try { mq.addEventListener('change', paint); } catch (e) { /* old browsers */ }
  paint();
  document.body.appendChild(btn);
})();
