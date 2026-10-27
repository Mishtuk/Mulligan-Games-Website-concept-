/* Clips from the shop (round 6, D47). The cards are plain links to the real posts (in the HTML, so they work with no JS).
 * A TikTok card, when clicked, opens ONE dialog and only then creates the official player iframe; nothing from TikTok is requested
 * before that. Instagram cards stay plain links (Instagram's embed will not play reels with licensed music).
 * The iframe is sandboxed (scripts, same-origin, presentation, popups only). createElement + textContent only; the id is checked against a strict pattern and the link's host before any URL is built. */
(function () {
  'use strict';
  var list = document.getElementById('clips-list');
  if (!list) return;
  var NS = 'http://www.w3.org/2000/svg', open = null;

  function mk(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function svg(d) {
    var s = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path');
    s.setAttribute('class', 'ic'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', '24'); s.setAttribute('height', '24'); s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('aria-hidden', 'true');
    p.setAttribute('d', d); s.appendChild(p); return s;
  }
  // The player address, or '' when the id or the card's link is not a TikTok video (same id pattern as src/lib/clips.js).
  function playerUrl(id, href) {
    var u; try { u = new URL(href); } catch (e) { return ''; }
    if (!/^\d{15,21}$/.test(id) || u.protocol !== 'https:' || u.hostname !== 'www.tiktok.com') return '';
    var p = new URL('https://www.tiktok.com/player/v1/' + id);
    p.search = 'autoplay=1&loop=0&music_info=0&description=0&rel=0&native_context_menu=0&closed_caption=1';
    return p.href;
  }

  // Our own copy of a clip: only a /media/clips/*.mp4 path (same pattern as src/lib/clips.js).
  function fileUrl(f) { return /^\/media\/clips\/[a-z0-9-]+\.mp4$/.test(f || '') ? f : ''; }

  function openClip(a, id, file) {
    var src = file ? fileUrl(file) : playerUrl(id, a.href);
    if (!src || open || !window.HTMLDialogElement) return false;
    var caption = a.getAttribute('data-caption') || (file ? 'Video' : 'TikTok video');
    var d = mk('dialog', 'dlg dlg-clip'); d.setAttribute('aria-labelledby', 'clip-dlg-h');
    var top = mk('div', 'dlg-top'), h = mk('h2', 'dlg-h', caption); h.id = 'clip-dlg-h';
    var x = mk('button', 'dlg-x'); x.type = 'button'; x.setAttribute('aria-label', 'Close video'); x.appendChild(svg('M6 6l12 12M18 6 6 18'));
    top.appendChild(h); top.appendChild(x);
    var frame = mk('div', 'clip-frame');
    var fail = mk('p', 'clip-fail', 'The video didn’t load.'); fail.hidden = true; fail.setAttribute('role', 'status');
    var foot = mk('p', 'clip-foot'), out = mk('a', null, file ? 'See the original post' : 'Open on TikTok'); out.href = a.href; out.target = '_blank'; out.rel = 'noopener';
    foot.appendChild(out); if (!file) foot.appendChild(mk('span', null, 'Playing loads TikTok’s player.'));
    d.appendChild(top); d.appendChild(frame); d.appendChild(fail); d.appendChild(foot);
    document.body.appendChild(d);
    open = d;
    var timer = 0;
    function done() { // Esc, the X and a click on the backdrop all end here: the iframe goes, so the sound stops
      clearTimeout(timer); open = null;
      var f = frame.firstElementChild; if (f) f.remove(); // an iframe or our video: removed, so the sound stops
      d.remove(); a.focus();
    }
    d.addEventListener('close', done);
    x.addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    d.showModal(); // the iframe (or video) is created only now, after the click
    if (file) { // our own file: no iframe, no third party. Reduced motion and Save-Data: no autoplay, controls only.
      var v = document.createElement('video'), im = a.querySelector('img'), ps = im && im.getAttribute('src');
      v.controls = true; v.muted = true; v.playsInline = true; v.preload = 'none';
      v.setAttribute('aria-label', caption);
      if (/^\/media\/clips\/[a-z0-9-]+\.webp$/.test(ps || '')) v.poster = ps;
      var still = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || (navigator.connection && navigator.connection.saveData);
      v.autoplay = !still;
      v.src = src;
      frame.appendChild(v);
      return true;
    }
    var f = document.createElement('iframe');
    f.title = 'TikTok video: ' + caption;
    f.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture'; f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    // sandbox: the player can run, play and open TikTok in a new tab, but cannot navigate this page, submit forms, open dialogs or download (tested D49)
    f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox');
    f.addEventListener('load', function () { clearTimeout(timer); fail.hidden = true; });
    f.src = src;
    frame.appendChild(f);
    timer = setTimeout(function () { fail.hidden = false; }, 8000);
    return true;
  }

  Array.prototype.forEach.call(list.querySelectorAll('.clip-a[data-tt], .clip-a[data-file]'), function (a) {
    a.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // modifier-click opens the post itself
      if (openClip(a, a.getAttribute('data-tt'), a.getAttribute('data-file'))) e.preventDefault();
    });
  });

  // sideways scroll buttons (from 1024px, see clips.css); hidden until this script runs
  var nav = document.getElementById('clips-nav'), prev = document.getElementById('clips-prev'), next = document.getElementById('clips-next');
  if (!nav || !prev || !next) return;
  nav.hidden = false;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
  function step() { var li = list.querySelector('.clip'); if (!li) return 200; return li.getBoundingClientRect().width + (parseFloat(getComputedStyle(list).columnGap) || 0); }
  function sync() { prev.disabled = list.scrollLeft <= 2; next.disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2; }
  prev.addEventListener('click', function () { list.scrollBy({ left: -step(), behavior: reduce && reduce.matches ? 'auto' : 'smooth' }); });
  next.addEventListener('click', function () { list.scrollBy({ left: step(), behavior: reduce && reduce.matches ? 'auto' : 'smooth' }); });
  var t = 0;
  list.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(sync, 100); });
  window.addEventListener('resize', sync);
  sync();
})();
