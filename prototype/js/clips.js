/* Clips from the shop (round 6, D47). Loaded by index.html only.
 * The cards are plain links to the real posts (in the HTML, so they work without JS). This script validates the data, opens
 * ONE dialog on click and only then creates the official player iframe. Nothing from TikTok / Instagram / Facebook is
 * requested before that. createElement + textContent for data; ids are checked against strict patterns before any URL is built. */
(function () {
  'use strict';
  var MG = window.MG, U = MG && MG.ui, D = window.MG_SAMPLE || (MG && MG.data) || {};
  var HOSTS = { tiktok: 'www.tiktok.com', instagram: 'www.instagram.com', facebook: 'www.facebook.com' };
  var NAMES = { tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook' };

  /* ---------- validation + URL building (pure; tests call these) ---------- */
  function valid(c) {
    if (!c || typeof c !== 'object' || !HOSTS.hasOwnProperty(c.platform)) return false;
    if (typeof c.id !== 'string' || typeof c.url !== 'string' || typeof c.poster !== 'string') return false;
    if (c.platform === 'tiktok' && !/^\d{15,21}$/.test(c.id)) return false;
    if (c.platform === 'instagram' && !/^[A-Za-z0-9_-]{5,20}$/.test(c.id)) return false;
    if (c.platform === 'facebook' && !/^\d{5,25}$/.test(c.id)) return false;
    var u; try { u = new URL(c.url); } catch (e) { return false; }
    if (u.protocol !== 'https:' || u.hostname !== HOSTS[c.platform]) return false;
    return /^(media|img)\/social\/[\w.\-]+$/.test(c.poster);
  }
  // The iframe address for a valid clip, or '' when the clip is not valid.
  function embedUrl(c) {
    if (!valid(c)) return '';
    var u;
    if (c.platform === 'tiktok') {
      u = new URL('https://www.tiktok.com/player/v1/' + c.id);
      u.search = 'autoplay=1&loop=0&music_info=0&description=0&rel=0&native_context_menu=0&closed_caption=1';
    } else if (c.platform === 'instagram') u = new URL('https://www.instagram.com/reel/' + c.id + '/embed/');
    else {
      u = new URL('https://www.facebook.com/plugins/video.php');
      u.searchParams.set('href', c.url); u.searchParams.set('show_text', 'false'); u.searchParams.set('autoplay', 'true'); u.searchParams.set('width', '416');
    }
    return u.href;
  }
  window.MGClips = { valid: valid, embedUrl: embedUrl, open: null, dialog: null };

  function mk(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function icon(name) { var s = document.createElement('span'); s.innerHTML = MG.icon(name); return s.firstChild; } // fixed icon markup, no data

  /* ---------- the dialog ---------- */
  var openDlg = null;
  function openClip(clip, link) {
    if (openDlg && !openDlg.open && openDlg._mgDone) openDlg._mgDone(); // closed, but its close event has not run yet (it can lag a few hundred ms)
    if (openDlg || !U || !U.dialog) return false;
    var src = embedUrl(clip); if (!src) return false;
    var name = NAMES[clip.platform];
    var wrap = document.createElement('div');
    var top = mk('div', 'dlg-top'), h = mk('h2', 'dlg-h', clip.caption); h.id = 'clip-dlg-h';
    var x = mk('button', 'dlg-x'); x.type = 'button'; x.setAttribute('data-close', ''); x.setAttribute('aria-label', 'Close video'); x.appendChild(icon('x'));
    top.appendChild(h); top.appendChild(x);
    var frame = mk('div', 'clip-frame'); frame.setAttribute('data-platform', clip.platform);
    frame.style.setProperty('--poster', 'url("' + clip.poster + '")');
    var fail = mk('p', 'clip-fail', 'The video didn’t load.'); fail.hidden = true; fail.setAttribute('role', 'status');
    var foot = mk('p', 'clip-foot'), out = mk('a'); out.id = 'clip-out'; out.href = clip.url; out.target = '_blank'; out.rel = 'noopener';
    out.appendChild(document.createTextNode('Open on ' + name)); out.appendChild(mk('span', 'vh', ' (opens ' + name + ')')); out.appendChild(icon('external'));
    foot.appendChild(out); foot.appendChild(mk('span', null, 'Playing loads ' + name + '’s player.'));
    wrap.appendChild(top); wrap.appendChild(frame); wrap.appendChild(fail); wrap.appendChild(foot);
    if (link && link.focus) link.focus(); // so focus returns to the card even where a click does not focus a link
    var timer = 0, done = false;
    function finish() { // idempotent: runs on the close event, or earlier when the next card is opened first
      if (done) return; done = true;
      clearTimeout(timer); if (openDlg === d) { openDlg = null; window.MGClips.dialog = null; }
      var f = frame.querySelector('iframe'); if (f) f.remove(); // stops the sound at once
      if (d.parentNode) d.remove();
    }
    var d = U.dialog('', wrap, { bare: true, cls: 'dlg-clip', labelledby: 'clip-dlg-h', focus: '.dlg-x', onClose: finish });
    d._mgDone = finish;
    openDlg = d; window.MGClips.dialog = d;
    var f = document.createElement('iframe');
    f.title = name + ' video: ' + clip.caption;
    f.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture'; f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.addEventListener('load', function () { clearTimeout(timer); fail.hidden = true; });
    f.src = src;
    frame.appendChild(f);
    timer = setTimeout(function () { fail.hidden = false; }, 8000);
    return true;
  }
  window.MGClips.open = openClip;

  /* ---------- the row ---------- */
  function init() {
    var sec = document.getElementById('clips'), list = document.getElementById('clips-list');
    if (!sec || !list) return;
    var clips = D.clips || [], left = 0;
    Array.prototype.slice.call(list.querySelectorAll('.clip-a')).forEach(function (a) {
      var c = clips[+a.getAttribute('data-clip')];
      if (!valid(c)) { a.parentNode.remove(); return; }
      left++;
      // Instagram's embed will not play reels that use licensed music (both current picks): it shows a still and
      // 'Watch on Instagram'. So an Instagram card stays a plain link to the reel unless the clip says inline: true.
      if (c.platform === 'instagram' && c.inline !== true) return;
      a.addEventListener('click', function (ev) {
        if (ev.defaultPrevented || ev.button || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return; // modifier-click opens the post itself
        if (openClip(c, a)) ev.preventDefault();
      });
    });
    if (left < 3) { sec.hidden = true; return; }

    var nav = document.getElementById('clips-nav'), prev = document.getElementById('clips-prev'), next = document.getElementById('clips-next');
    if (!nav || !prev || !next) return;
    nav.hidden = false;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
    function step() { var li = list.querySelector('.clip'); if (!li) return 200; var g = parseFloat(getComputedStyle(list).columnGap) || 0; return li.getBoundingClientRect().width + g; }
    function go(dir) { list.scrollBy({ left: dir * step(), behavior: reduce && reduce.matches ? 'auto' : 'smooth' }); }
    function sync() { prev.disabled = list.scrollLeft <= 2; next.disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2; }
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    var t = 0;
    if ('onscrollend' in window) list.addEventListener('scrollend', sync);
    else list.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(sync, 100); });
    window.addEventListener('resize', sync);
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
