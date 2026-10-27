/* Mulligan Games concept: the admin shell (DESIGN.md 9.1).
 * Look A (D28), calm for the counter: charcoal chrome with the logo on its white sign plate (no brick texture).
 * 1024px and up: a charcoal sidebar. Under 1024px: a top bar and a bottom tab bar (Today is one tap away at the counter).
 * Each admin page has <body data-page="today|events|inventory"> and the empty slots #side #top #tabs #demo #main.
 */
(function () {
  'use strict';
  var MG = window.MG, U = MG.ui, e = MG.esc, $ = U.$;
  var SH = MG.shell = {};

  var ITEMS = [
    { id: 'today', label: 'Today', tab: 'Today', href: 'index.html', icon: 'clock' },
    { id: 'events', label: 'Events', tab: 'Events', href: 'events.html', icon: 'calendar' },
    { id: 'inventory', label: 'Inventory', tab: 'Stock', href: 'inventory.html', icon: 'box' },
    { id: 'preorders', label: 'Preorders', tab: 'Preorders', href: 'inventory.html#preorders', icon: 'bag' }
  ];

  function current() {
    var page = document.body.getAttribute('data-page');
    if (page === 'inventory' && location.hash.indexOf('#preorders') === 0) return 'preorders';
    return page;
  }
  function badges() {
    var pic = MG.act.stockPicture(14);
    return { inventory: pic.alerts.attention.length, preorders: MG.act.arrivedPreorders().length };
  }
  function badgeHtml(n, what) { return n ? '<span class="nb" aria-label="' + n + ' ' + e(what) + '">' + n + '</span>' : ''; }
  function openLine() {
    var st = MG.openStatus(MG.now());
    return st.open ? 'Open till ' + MG.fmtTime(st.closeHm) : 'Closed now';
  }
  var BADGE_WORD = { inventory: 'need attention', preorders: 'arrived, to call' };

  SH.render = function () {
    var cur = current(), b = badges(), nowStr = openLine(), isOpen = MG.openStatus(MG.now()).open;
    // the store's wordmark on its white plate, as on the public header (relative path: works under the Pages subpath)
    var plate = function (cls) { return '<span class="plate ' + cls + '"><img src="../img/logo/logo-plate-330.webp" alt="" width="330" height="102"></span>'; };
    $('#side').innerHTML = '<a class="side-brand" href="' + e(U.href('index.html')) + '" aria-label="Mulligan Games shop admin, Today">' + plate('side-plate') +
      '<span class="side-name">Shop admin</span></a>' +
      '<nav aria-label="Admin sections"><ul class="side-nav">' + ITEMS.map(function (it) {
        return '<li><a href="' + e(U.href(it.href)) + '"' + (cur === it.id ? ' aria-current="page"' : '') + '>' + MG.icon(it.icon) + '<span>' + e(it.label) + '</span>' + badgeHtml(b[it.id], BADGE_WORD[it.id]) + '</a></li>';
      }).join('') + '</ul></nav>' +
      '<div class="side-foot"><p class="side-open" data-open="' + isOpen + '"><span class="ob-dot" aria-hidden="true"></span>' + e(nowStr) + '</p>' +
      '<a class="side-link" href="' + e(U.href('../events.html')) + '">' + MG.icon('external') + 'View the website</a>' +
      MG.scheme.html('side-scheme') + '</div>';
    $('#top').innerHTML = '<a class="top-mark" href="' + e(U.href('index.html')) + '" aria-label="Mulligan Games shop admin, Today">' + plate('top-plate') + '</a>' +
      '<p class="top-title">' + e((ITEMS.filter(function (i) { return i.id === cur; })[0] || ITEMS[0]).label) + '</p>' +
      '<p class="top-open" data-open="' + isOpen + '"><span class="ob-dot" aria-hidden="true"></span>' + e(nowStr) + '</p>' +
      MG.scheme.html('top-scheme');
    $('#tabs').innerHTML = '<ul>' + ITEMS.map(function (it) {
      return '<li><a href="' + e(U.href(it.href)) + '"' + (cur === it.id ? ' aria-current="page"' : '') + '>' + MG.icon(it.icon) + '<span>' + e(it.tab) + '</span>' + badgeHtml(b[it.id], BADGE_WORD[it.id]) + '</a></li>';
    }).join('') + '<li><button type="button" class="tab-more" id="tab-more">' + MG.icon('dots') + '<span>More</span></button></li></ul>';
  };

  SH.init = function () {
    U.demoBar($('#demo'), { note: 'This is the owners’ side. Everything you click is saved in this browser only.' });
    SH.render();
    MG.state.subscribe(SH.render);
    window.addEventListener('hashchange', SH.render);
    document.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target : ev.target.parentElement;
      if (t.closest('#tab-more')) {
        var d = U.dialog('More', '<ul class="more-list"><li><a class="btn btn-2" href="' + e(U.href('../events.html')) + '">' + MG.icon('external') + 'View the website</a></li>' +
          '<li class="more-scheme">' + MG.scheme.html() + '</li>' +
          '<li><p class="hint">Store info, the security log and the account page arrive with the real site (Phase 2).</p></li></ul>');
        return;
      }
    });
    MG.scheme.wire();
  };
})();
