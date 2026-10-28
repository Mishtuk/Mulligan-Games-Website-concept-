/* Mulligan Games public pages: JS only enhances (D11). Pages work without it. No innerHTML: everything is textContent / attributes / hidden. */
(function () {
  'use strict';
  /* the light/dark button is src/components/ThemeFab.astro (reused from the VFW site, D46) */

  /* front page hero video (#16): plays by itself like the VFW and Riverside heroes, but is held back (poster only, Play button) for reduced motion,
   * Save-Data and 2g/3g, unless the visitor chose Play this session. The <source>s carry data-src: nothing is fetched until arm(), so a held
   * screen downloads no video. The poster is the box's CSS background (one file per screen). No inline script (CSP D24). */
  var v = document.getElementById('hero-video'), vbtn = document.getElementById('vid-btn'), vlab = document.getElementById('vid-label');
  if (v && vbtn && vlab && v.play) {
    var rm = matchMedia('(prefers-reduced-motion: reduce)'), c = navigator.connection || {}, pref = null;
    var hold = rm.matches || c.saveData || /^(slow-2g|2g|3g)$/.test(c.effectiveType || '');
    try { pref = sessionStorage.getItem('mg-video'); } catch (e) { /* not stored */ }
    var sync = function () { vlab.textContent = v.paused ? 'Play video' : 'Pause video'; if (v.paused) vbtn.setAttribute('data-paused', ''); else vbtn.removeAttribute('data-paused'); };
    var start = function () {
      if (!v.currentSrc) { Array.prototype.forEach.call(v.querySelectorAll('source[data-src]'), function (s) { s.src = s.getAttribute('data-src'); }); v.preload = 'auto'; v.load(); }
      var p = v.play(); if (p && p.catch) p.catch(sync);
    };
    v.addEventListener('play', sync); v.addEventListener('pause', sync);
    vbtn.addEventListener('click', function () {
      var go = v.paused;
      try { sessionStorage.setItem('mg-video', go ? 'play' : 'pause'); } catch (e) { /* not stored */ }
      if (go) start(); else v.pause();
    });
    try { rm.addEventListener('change', function (ev) { if (ev.matches) v.pause(); }); } catch (e) { /* old browsers */ }
    vbtn.classList.add('is-ready'); sync();
    if (!((hold && pref !== 'play') || pref === 'pause')) { /* after load, so the poster and the page come first */
      var later = function () { setTimeout(function () { if (v.paused && !v.currentSrc) start(); }, 300); };
      if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
    }
  }

  /* events page: changing the format sends the form */
  var fmt = document.getElementById('fmt');
  if (fmt && fmt.form) {
    fmt.addEventListener('change', function () { fmt.form.submit(); });
    var show = fmt.form.querySelector('button[type="submit"]'); if (show) show.hidden = true; /* no-JS fallback only */
  }

  /* event page: Copy the TopDeck event code (the button is hidden in the HTML, so without JS or a clipboard there is no dead control) */
  var cc = document.querySelector('.copy-code');
  if (cc && navigator.clipboard && navigator.clipboard.writeText) {
    cc.hidden = false;
    cc.addEventListener('click', function () {
      navigator.clipboard.writeText(cc.getAttribute('data-copy')).then(function () {
        cc.textContent = 'Copied';
        setTimeout(function () { cc.textContent = 'Copy'; }, 2000);
      }, function () { /* denied: the code is still on the page to select */ });
    });
  }

  /* events page: Print the schedule */
  var pb = document.getElementById('print-btn');
  if (pb) pb.addEventListener('click', function () { window.print(); });

  /* front page: game chips filter in place. Only from "All games": a page the server already filtered doesn't have the other cards. */
  var chips = document.getElementById('chips'), days = document.getElementById('days');
  if (!chips || !days) return;
  var curChip = chips.querySelector('[aria-current]');
  if (!curChip || curChip.getAttribute('data-chip') !== 'all') return;
  var empty = document.getElementById('filter-empty'), status = document.getElementById('filter-status');
  function apply(id, link) {
    chips.querySelectorAll('.chip').forEach(function (c) {
      if (c.getAttribute('data-chip') === id) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
    });
    document.querySelectorAll('#week [data-fgame]').forEach(function (el) {
      el.hidden = !(id === 'all' || el.getAttribute('data-fgame') === id || el.getAttribute('data-ffam') === id);
    });
    days.querySelectorAll('.day, .day-off').forEach(function (d) {
      d.hidden = d.hasAttribute('data-quiet') ? id !== 'all' : !d.querySelector('.ev:not([hidden]), .day-line:not([hidden])');
    });
    var shown = days.querySelectorAll('.ev:not([hidden]):not([data-state="cancelled"]), .day-line:not([hidden]):not([data-state="cancelled"])').length, any = days.querySelectorAll('.ev:not([hidden]), .day-line:not([hidden])').length;
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
