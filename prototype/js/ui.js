/* Mulligan Games concept: small UI helpers shared by events.html and the admin pages.
 * Toast with Undo, dialogs, the demo bar, links that keep the demo clock, extra icons, file download.
 * Safety (owner rule): text from people goes in with MG.esc() or textContent, never raw.
 */
(function () {
  'use strict';
  var MG = window.MG, e = MG.esc;
  var U = MG.ui = {};

  /* ---------- extra icons (24px grid, same style as mg.js) ---------- */
  Object.assign(MG.iconPaths, {
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
    bag: '<path d="M5 8h14l-1 12.5H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    undo: '<path d="M9 7 4.5 11.5 9 16"/><path d="M5 11.5h9a5 5 0 0 1 0 10h-3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    dots: '<circle cx="5" cy="12" r="1.75" fill="currentColor"/><circle cx="12" cy="12" r="1.75" fill="currentColor"/><circle cx="19" cy="12" r="1.75" fill="currentColor"/>',
    trash: '<path d="M4.5 7h15M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>',
    copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',
    download: '<path d="M12 3.5v12M7 11l5 5 5-5M4.5 20.5h15"/>',
    chevdown: '<path d="m5 9 7 7 7-7"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    arrowup: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    arrowdown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    home: '<path d="M4 11.5 12 4l8 7.5V20H5z"/><path d="M10 20v-6h4v6"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    credit: '<rect x="3" y="6" width="18" height="12.5" rx="2"/><path d="M3 10.5h18M7 15h3"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18v-3H3zM12 6v14M12 6c-1-3.5-5-3.5-5-1.5C7 6 9 6 12 6zM12 6c1-3.5 5-3.5 5-1.5C17 6 15 6 12 6z"/>',
    store: '<path d="M4 9.5 5.5 4h13L20 9.5M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5 12.5V20h14v-7.5M10 20v-5h4v5"/>',
    link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6.5L20.5 7"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'
  });

  /* ---------- little helpers ---------- */
  U.$ = function (sel, root) { return (root || document).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  // keep the demo clock (?now=...) when going to another page of the prototype
  U.href = function (path) {
    var now = new URLSearchParams(location.search).get('now');
    if (!now) return path;
    var hash = '', i = path.indexOf('#');
    if (i !== -1) { hash = path.slice(i); path = path.slice(0, i); }
    var q = path.indexOf('?') === -1 ? '?' : '&';
    return path + q + 'now=' + encodeURIComponent(now) + hash;
  };
  // "Oct 27 6:10 PM" from "2026-10-27T18:10:00"
  U.stamp = function (iso) {
    var m = /^(\d{4}-\d\d-\d\d)T(\d\d):(\d\d)/.exec(iso || '');
    if (!m) return '';
    var d = MG.parseYmd(m[1]);
    return MG.fmtDate(d) + ' ' + MG.fmtTime(m[2] + ':' + m[3]);
  };
  U.download = function (name, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  U.copy = function (text, done) {
    var ok = function () { if (done) done(true); }, no = function () { if (done) done(false); };
    try { navigator.clipboard.writeText(text).then(ok, no); } catch (err) { no(); }
  };
  U.debounce = function (fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; };

  /* ---------- toast with Undo (DESIGN.md 9.1: bottom centre, charcoal, highlight Undo, 6 seconds) ---------- */
  var toastEl, toastTimer;
  U.toast = function (msg, opts) {
    opts = opts || {};
    if (!toastEl) {
      toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
      var hold = function () { clearTimeout(toastTimer); };
      var free = function (ev) { if (ev.type === 'focusout' && ev.relatedTarget && toastEl.contains(ev.relatedTarget)) return; if (toastEl._start) toastEl._start(); };
      toastEl.addEventListener('pointerenter', hold); toastEl.addEventListener('focusin', hold);
      toastEl.addEventListener('pointerleave', free); toastEl.addEventListener('focusout', free);
    }
    toastEl.textContent = '';
    var p = document.createElement('span'); p.className = 'toast-msg'; p.textContent = msg; toastEl.appendChild(p);
    var hide = function () { toastEl.classList.remove('on'); };
    if (opts.undo) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'toast-btn'; b.textContent = 'Undo';
      b.addEventListener('click', function () { MG.act.undo(opts.undo); hide(); U.toast('Undone.'); });
      toastEl.appendChild(b);
    }
    if (opts.href) {
      var a = document.createElement('a'); a.className = 'toast-btn'; a.href = opts.href; a.textContent = opts.label || 'See it'; toastEl.appendChild(a);
    }
    // the timer is paused while the pointer or keyboard focus is on the toast, and restarts in full after
    var ms = opts.ms || 6000;
    var start = function () { clearTimeout(toastTimer); if (!toastEl.matches(':hover, :focus-within')) toastTimer = setTimeout(hide, ms); };
    toastEl._start = start;
    toastEl.classList.add('on');
    start();
  };
  // run an action result through the toast: fail shows the message, success shows it with Undo
  U.say = function (res, opts) {
    opts = opts || {};
    if (!res.ok) { U.toast(res.msg || 'That didn’t work.'); return res; }
    if (!opts.quiet) U.toast(res.msg, { undo: res.before, href: opts.href, label: opts.label });
    return res;
  };

  /* ---------- dialogs: native <dialog>, close button first, Esc closes, focus returns ---------- */
  U.dialog = function (title, bodyHtml, opts) {
    opts = opts || {};
    var opener = document.activeElement, d = document.createElement('dialog');
    d.className = 'dlg' + (opts.cls ? ' ' + opts.cls : '');
    d.setAttribute('aria-labelledby', opts.bare && opts.labelledby ? opts.labelledby : 'dlg-t');
    // opts.bare: no title bar; bodyHtml (a string or a node) brings its own heading and close button (event detail)
    if (opts.bare) {
      d.innerHTML = '<div class="dlg-in"><div class="dlg-body"></div></div>';
      var bd = d.querySelector('.dlg-body');
      if (bodyHtml && bodyHtml.nodeType) bd.appendChild(bodyHtml); else bd.innerHTML = bodyHtml || '';
    } else d.innerHTML = '<div class="dlg-in"><div class="dlg-top"><h2 id="dlg-t" class="dlg-h">' + e(title) + '</h2>' +
      '<button type="button" class="dlg-x" data-close aria-label="Close">' + MG.icon('x') + '</button></div><div class="dlg-body">' + bodyHtml + '</div></div>';
    document.body.appendChild(d);
    d.addEventListener('click', function (ev) {
      if (ev.target === d || (ev.target.closest && ev.target.closest('[data-close]'))) d.close();
    });
    d.addEventListener('close', function () {
      d.remove();
      if (opener && opener.focus && document.contains(opener)) opener.focus();
      if (opts.onClose) opts.onClose();
    });
    d.showModal();
    if (opts.bare && opts.focus) { var f = d.querySelector(opts.focus); if (f) f.focus(); }
    return d;
  };
  // plain-words confirm: resolves true or false. body is text.
  U.confirm = function (o) {
    return new Promise(function (resolve) {
      var answered = false;
      var d = U.dialog(o.title, '<p>' + e(o.body || '') + '</p>' + (o.note ? '<label class="fld"><span>' + e(o.note) + '</span><input type="text" name="note" autocomplete="off"></label>' : '') +
        '<p class="dlg-acts"><button type="button" class="btn btn-2" data-close>' + e(o.cancel || 'Keep it') + '</button>' +
        '<button type="button" class="btn ' + (o.danger ? 'btn-bad-fill' : 'btn-act') + '" data-ok>' + e(o.ok || 'OK') + '</button></p>', {
        onClose: function () { if (!answered) resolve(false); }
      });
      d.querySelector('[data-ok]').addEventListener('click', function () {
        answered = true; var n = d.querySelector('input[name="note"]'); resolve(n ? { note: n.value } : true); d.close();
      });
    });
  };

  /* ---------- the concept bar: not part of the real site ---------- */
  // U.nav and U.reload are the two page-leaving calls, kept here so tests can replace them.
  /* D33 phone quick-action bar (public pages): constant icons, the current page marked, links keep ?now= */
  U.mobileBar = function () {
    var icons = ['calendar', 'clock', 'pin', 'phone'], here = location.pathname.split('/').pop() || 'index.html';
    Array.prototype.forEach.call(document.querySelectorAll('.mobile-bar a'), function (a, i) {
      var h = a.getAttribute('href');
      if (icons[i]) a.insertAdjacentHTML('afterbegin', MG.icon(icons[i])); // constant SVG, no data
      if (h === here) a.setAttribute('aria-current', 'page');
      if (/^[\w\/-]+\.html(#.*)?$/.test(h)) a.setAttribute('href', U.href(h));
    });
  };
  U.nav = function (href) { location.href = href; };
  U.reload = function () { location.reload(); };
  // U.demoBar(host, { note, owners: { href, label } }): built with createElement, text only.
  U.demoBar = function (host, opts) {
    opts = opts || {};
    var D = MG.data, cur = new URLSearchParams(location.search).get('now');
    function mk(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
    // same page, same other params and #hash, only ?now= changes
    function target(now) {
      var p = new URLSearchParams(location.search); p.set('now', now);
      return (location.pathname.split('/').pop() || './') + '?' + p.toString() + location.hash;
    }
    host.className = (host.className ? host.className + ' ' : '') + 'demo';
    host.setAttribute('aria-label', 'About this concept');
    host.textContent = '';
    var inner = mk('div', 'wrap demo-in');
    var msg = mk('p', 'demo-msg'); msg.appendChild(mk('strong', null, 'Concept with sample data.'));
    msg.appendChild(document.createTextNode(" ")); msg.appendChild(mk("span", "demo-note", opts.note || "Your clicks are saved in this browser only."));
    inner.appendChild(msg);

    var times = mk('p', 'demo-times'), lab = mk('label', null, 'Pretend it’s'); lab.setAttribute('for', 'demo-now');
    var sel = mk('select', 'demo-sel'); sel.id = 'demo-now';
    var matched = false;
    function opt(label, now, selected) {
      var o = mk('option', null, label); o.value = now; o.setAttribute('data-href', target(now)); o.selected = !!selected; sel.appendChild(o); return o;
    }
    D.demoMoments.forEach(function (m) {
      var on = cur === m.now || (!cur && m.now === D.demoNow); if (on) matched = true; opt(m.label, m.now, on);
    });
    opt('Real clock', 'real', cur === 'real'); if (cur === 'real') matched = true;
    if (!matched && cur) { var c = opt('Custom time', cur, true); c.setAttribute('data-href', target(cur)); }
    sel.addEventListener('change', function () {
      var o = sel.options[sel.selectedIndex]; U.nav(o.getAttribute('data-href'));
    });
    times.appendChild(lab); times.appendChild(document.createTextNode(' ')); times.appendChild(sel);
    inner.appendChild(times);

    var rs = mk('p', 'demo-reset'), btn = mk('button', 'demo-btn', 'Reset demo data'); btn.type = 'button'; btn.id = 'reset-demo';
    btn.addEventListener('click', function () {
      if (MG.act && MG.act.resetDemo) { var r = MG.act.resetDemo(); U.toast(r.msg, { undo: r.before }); }
      else { MG.state.reset(); U.reload(); }
    });
    rs.appendChild(btn); inner.appendChild(rs);

    if (opts.owners && opts.owners.href) {
      var ow = mk('p', 'demo-owners'), a = mk('a', null, opts.owners.label || 'Owners: open the counter screen');
      a.href = opts.owners.href; ow.appendChild(a); inner.appendChild(ow); inner.classList.add('has-owners');
    }
    host.appendChild(inner);
  };

  /* the Light | Dark switch is MG.scheme.html() / MG.scheme.wire() in mg.js, shared with the public pages */

  /* ---------- a live region for "Showing Magic: 9 events" style messages ---------- */
  U.announce = function (msg) {
    var r = document.getElementById('live'); if (!r) { r = document.createElement('p'); r.id = 'live'; r.className = 'vh'; r.setAttribute('role', 'status'); document.body.appendChild(r); }
    r.textContent = msg;
  };
})();
