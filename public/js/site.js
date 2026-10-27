/* Mulligan Games public pages: JS only enhances (D11). Pages work without it. No innerHTML: everything is textContent / attributes / hidden. */
(function () {
  'use strict';
  /* the light/dark button is src/components/ThemeFab.astro (reused from the VFW site, D46) */

  /* front page hero video: the poster shows until a real frame is painted; held back for reduced motion / Save-Data / slow links */
  var v = document.getElementById('hero-video'), vbtn = document.getElementById('vid-btn'), box = document.getElementById('hero-media');
  if (v && vbtn && box && v.play) {
    /* the portrait loop is for phones: from 900px the landscape still shows and the video is never loaded */
    var narrow = matchMedia('(max-width: 899px)');
    var addSources = function () {
      if (v.querySelector('source')) return;
      v.poster = '/media/video/cedh-players-tables-loop-poster.webp';
      var el = document.createElement('source'); el.src = '/media/video/cedh-players-tables-loop.mp4'; el.type = 'video/mp4'; v.appendChild(el);
      v.load();
    };
    var rm = matchMedia('(prefers-reduced-motion: reduce)'), c = navigator.connection || {}, pref = null, vlab = document.getElementById('vid-label');
    var hold = rm.matches || c.saveData || /^(slow-2g|2g|3g)$/.test(c.effectiveType || '');
    try { pref = sessionStorage.getItem('mg-video'); } catch (e) { /* not stored */ }
    var label = function (playing) { vlab.textContent = playing ? 'Pause video' : 'Play video'; if (playing) vbtn.removeAttribute('data-paused'); else vbtn.setAttribute('data-paused', ''); };
    var start = function () { if (!narrow.matches) return; addSources(); v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () { label(false); }); };
    var reveal = function () { box.classList.add('is-on'); };
    v.addEventListener('playing', function () {
      label(true);
      if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(reveal);
      else v.addEventListener('timeupdate', function t() { if (v.currentTime > 0) { v.removeEventListener('timeupdate', t); reveal(); } });
    });
    ['error', 'emptied', 'abort'].forEach(function (n) { v.addEventListener(n, function () { box.classList.remove('is-on'); label(false); }); });
    v.addEventListener('pause', function () { label(false); });
    vbtn.addEventListener('click', function () {
      var go = v.paused;
      try { sessionStorage.setItem('mg-video', go ? 'play' : 'pause'); } catch (e) { /* not stored */ }
      if (go) start(); else v.pause();
    });
    try { rm.addEventListener('change', function (ev) { if (ev.matches) v.pause(); }); } catch (e) { /* old browsers */ }
    try { narrow.addEventListener('change', function (ev) { if (!ev.matches) v.pause(); }); } catch (e) { /* old browsers */ }
    if (narrow.matches) { /* phones only: on wide screens the video is never loaded and the pause control stays hidden */
      vbtn.classList.add('is-ready'); label(false);
      if (!((hold && pref !== 'play') || pref === 'pause')) {
        var later = function () { setTimeout(start, 300); };
        if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
      }
    }
  }

  /* events page: changing the format sends the form */
  var fmt = document.getElementById('fmt');
  if (fmt && fmt.form) {
    fmt.addEventListener('change', function () { fmt.form.submit(); });
    var show = fmt.form.querySelector('button[type="submit"]'); if (show) show.hidden = true; /* no-JS fallback only */
  }

  /* events page: Print the schedule */
  var pb = document.getElementById('print-btn');
  if (pb) pb.addEventListener('click', function () { window.print(); });

  /* front page: game chips filter in place. Only from "All games": a page the server already filtered doesn't have the other cards. */
  var chips = document.getElementById('chips'), days = document.getElementById('days');
  if (!chips || !days) return;
  var curChip = chips.querySelector('[aria-current]'); /* not "start": var is function-wide and would overwrite the hero's start() */
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
