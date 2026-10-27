/* Mulligan Games public pages: JS only enhances (D11). Pages work without it. No innerHTML: everything is textContent / attributes / hidden. */
(function () {
  'use strict';
  var meta = document.querySelector('meta[name="color-scheme"]');

  /* theme toggle: system default or its opposite, never stores the value that equals the system */
  var btn = document.getElementById('theme-btn');
  function system() { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  function stored() { try { return localStorage.getItem('mg-scheme'); } catch (e) { return null; } }
  if (btn && meta) {
    btn.addEventListener('click', function () {
      var cur = stored() || system(), target = cur === 'dark' ? 'light' : 'dark';
      try { if (target === system()) localStorage.removeItem('mg-scheme'); else localStorage.setItem('mg-scheme', target); } catch (e) { /* not saved */ }
      meta.content = target === system() ? 'light dark' : target;
    });
    window.addEventListener('storage', function (ev) { if (ev.key === 'mg-scheme') meta.content = ev.newValue || 'light dark'; });
  }

  /* events page: changing the format sends the form */
  var fmt = document.getElementById('fmt');
  if (fmt && fmt.form) {
    fmt.addEventListener('change', function () { fmt.form.submit(); });
    var show = fmt.form.querySelector('button[type="submit"]'); if (show) show.hidden = true; /* no-JS fallback only */
  }

  /* front page: game chips filter in place. Only from "All games": a page the server already filtered doesn't have the other cards. */
  var chips = document.getElementById('chips'), days = document.getElementById('days');
  if (!chips || !days) return;
  var start = chips.querySelector('[aria-current]');
  if (!start || start.getAttribute('data-chip') !== 'all') return;
  var empty = document.getElementById('filter-empty'), status = document.getElementById('filter-status');
  function apply(id, link) {
    chips.querySelectorAll('.chip').forEach(function (c) {
      if (c.getAttribute('data-chip') === id) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
    });
    document.querySelectorAll('#week [data-fgame]').forEach(function (el) {
      el.hidden = !(id === 'all' || el.getAttribute('data-fgame') === id || el.getAttribute('data-ffam') === id);
    });
    days.querySelectorAll('.slot').forEach(function (s) { s.hidden = !s.querySelector('.ev:not([hidden])'); });
    days.querySelectorAll('.day').forEach(function (d) {
      d.hidden = d.hasAttribute('data-quiet') ? id !== 'all' : !d.querySelector('.slot:not([hidden])');
    });
    var shown = days.querySelectorAll('.ev:not([hidden]):not([data-state="cancelled"])').length, any = days.querySelectorAll('.ev:not([hidden])').length;
    if (empty) empty.hidden = id === 'all' || any > 0;
    if (status) status.textContent = (id === 'all' ? 'Showing all games: ' : 'Showing ' + link.querySelector('span').textContent + ': ') + shown + (shown === 1 ? ' event' : ' events') + ' this week.';
    var p = new URLSearchParams(location.search);
    if (id === 'all') p.delete('game'); else p.set('game', id);
    history.replaceState(null, '', (p.toString() ? '?' + p : location.pathname) + '#week');
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('[data-chip]');
    if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
    ev.preventDefault();
    var id = a.getAttribute('data-chip');
    apply(id, a.classList.contains('chip') ? a : chips.querySelector('[data-chip="all"]'));
    var cur = chips.querySelector('[aria-current]');
    if (cur) { cur.focus(); cur.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  });
})();
