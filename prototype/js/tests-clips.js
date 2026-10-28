/* Tests for "Clips from the shop" (round 6, D47): nine cards that are real links, nothing third-party before a click,
 * one dialog with one validated iframe, bad ids refused, close removes the iframe and returns focus.
 * Loaded by tests.html after tests-front.js. Page checks run in an iframe (needs file access, otherwise skipped). */
(function () {
  'use strict';
  var T = window.T, MG = window.MG, D = MG.data, eq = T.eq, ok = T.ok;
  var BASE = location.href.replace(/[^\/]*$/, '').split('?')[0];
  var EXTERNAL = /^(https?:)?\/\//i;

  function openPage(path, width) {
    return new Promise(function (resolve, reject) {
      var f = document.createElement('iframe'), errors = [], settled = false;
      f.style.cssText = 'position:absolute;left:-9999px;width:' + (width || 1280) + 'px;height:900px';
      f.addEventListener('load', function () {
        try {
          var w = f.contentWindow; void w.document.body;
          var ce = w.console.error; w.console.error = function () { errors.push(Array.prototype.join.call(arguments, ' ')); ce.apply(w.console, arguments); };
          setTimeout(function () { if (!settled) { settled = true; resolve({ w: w, d: w.document, errors: errors, frame: f }); } }, 300);
        } catch (err) { reject(new Error('NOACCESS')); }
      });
      document.body.appendChild(f); f.src = BASE + path;
    });
  }
  function pageTest(name, fn) {
    T.async(name, function () {
      return openPage('index.html?now=2026-10-30T18:50').then(function (p) {
        return Promise.resolve(fn(p.w, p.d, p)).then(function () {
          eq(p.errors.join(' | '), '', 'console errors'); p.frame.remove();
        }, function (err) { p.frame.remove(); throw err; });
      }, function (err) { if (err && err.message === 'NOACCESS') return T.SKIP; throw err; });
    });
  }
  function click(el) { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })); }

  T.section('Clips from the shop');

  T.test('the data holds nine clips: seven TikTok, two Instagram, research order', function () {
    ok(Array.isArray(D.clips), 'D.clips');
    eq(D.clips.length, 9);
    eq(D.clips.filter(function (c) { return c.platform === 'tiktok'; }).length, 7);
    eq(D.clips.filter(function (c) { return c.platform === 'instagram'; }).length, 2);
    eq(D.clips[0].id, '7456651666096704814');
  });

  pageTest('nine cards, each a real link to its post, with caption, credit and the privacy line', function (w, d) {
    var as = d.querySelectorAll('#clips-list .clip-a');
    eq(as.length, 9);
    Array.prototype.forEach.call(as, function (a, i) {
      var c = D.clips[i];
      eq(a.getAttribute('href'), c.url, 'card ' + i + ' links to the post');
      ok(/^https:\/\/www\.(tiktok|instagram)\.com\//.test(a.href), 'card ' + i + ' host');
      ok(a.querySelector('.clip-cap').textContent.indexOf(c.caption) !== -1, 'caption ' + i);
      eq(!!a.querySelector('.clip-by'), !!c.credit, 'credit shown only when set, card ' + i);
    });
    eq(d.querySelector('#clips-list .clip-by').textContent, 'by @perky_grn_fairy');
    ok(/only when you press play/.test(d.querySelector('.clips-priv').textContent), 'privacy line');
  });

  pageTest('nothing from TikTok, Instagram or Facebook is in the page before a click', function (w, d) {
    eq(d.querySelectorAll('iframe').length, 0, 'no iframe');
    var bad = [];
    Array.prototype.forEach.call(d.querySelectorAll('script[src], img[src], link[href], source[src], video[src], embed, object'), function (n) {
      var u = n.getAttribute('src') || n.getAttribute('href') || '';
      if (EXTERNAL.test(u)) bad.push(n.tagName + ' ' + u);
    });
    eq(bad.join(', '), '', 'no external script, image, link or media in the DOM');
    ok(!d.querySelector('link[rel=preconnect], link[rel=prefetch], link[rel=dns-prefetch]'), 'no preconnect or prefetch');
    eq(d.querySelectorAll('dialog').length, 0, 'no dialog until a click');
  });

  pageTest('a click opens one dialog with exactly one iframe on the validated TikTok player URL', function (w, d) {
    var a = d.querySelector('#clips-list .clip-a');
    a.focus(); click(a);
    var dlg = d.querySelector('dialog.dlg-clip');
    ok(dlg && dlg.open, 'dialog is open');
    eq(d.querySelectorAll('dialog').length, 1);
    var fr = dlg.querySelectorAll('iframe');
    eq(fr.length, 1, 'one iframe');
    ok(fr[0].src.indexOf('https://www.tiktok.com/player/v1/7456651666096704814?') === 0, fr[0].src);
    eq(fr[0].getAttribute('sandbox'), 'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox', 'D49 sandbox tokens');
    eq(dlg.querySelector('#clip-dlg-h').textContent, D.clips[0].caption);
    eq(dlg.querySelector('#clip-out').getAttribute('href'), D.clips[0].url);
    ok(/Open on TikTok/.test(dlg.querySelector('#clip-out').textContent), 'Open on TikTok');
    eq(d.activeElement, dlg.querySelector('.dlg-x'), 'focus starts on Close');
    click(d.querySelectorAll('#clips-list .clip-a')[1]); // a second open is ignored while one is open
    eq(d.querySelectorAll('iframe').length, 1, 'still one iframe');
    dlg.close();
  });

  pageTest('an Instagram card is a plain link to the reel (licensed-music reels do not play in the embed); inline: true opens the reel embed', function (w, d) {
    var a = d.querySelectorAll('#clips-list .clip-a')[2];
    a.addEventListener('click', function (e) { e.preventDefault(); }, { once: true }); // stops the real navigation in the test
    click(a);
    eq(d.querySelectorAll('dialog').length, 0, 'no dialog for an Instagram card');
    var c = Object.assign({}, D.clips[2], { inline: true });
    ok(w.MGClips.open(c, a), 'opened with inline: true');
    eq(d.querySelector('dialog iframe').src, 'https://www.instagram.com/reel/DTHcsxqjNDL/embed/');
    ok(/Open on Instagram/.test(d.getElementById('clip-out').textContent), 'Open on Instagram');
    d.querySelector('dialog').close();
  });

  pageTest('closing removes the iframe and the dialog and returns focus to the card', function (w, d) {
    var a = d.querySelectorAll('#clips-list .clip-a')[3];
    a.focus(); click(a);
    ok(d.querySelector('dialog iframe'), 'iframe exists');
    d.querySelector('dialog .dlg-x').click();
    return T.wait(50).then(function () {
      eq(d.querySelectorAll('iframe').length, 0, 'iframe gone');
      eq(d.querySelectorAll('dialog').length, 0, 'dialog gone');
      eq(d.activeElement, a, 'focus is back on the card');
      click(a); eq(d.querySelectorAll('iframe').length, 1, 'can open again');
      d.querySelector('dialog').close();
    });
  });

  pageTest('a modifier-click is left to the browser (no dialog)', function (w, d) {
    var a = d.querySelector('#clips-list .clip-a');
    a.addEventListener('click', function (e) { e.preventDefault(); }, { once: true }); // stops the real navigation in the test
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true }));
    eq(d.querySelectorAll('dialog').length, 0);
  });

  pageTest('bad ids, hosts and posters are refused; no URL is built from them', function (w) {
    var C = w.MGClips, good = D.clips[0];
    function bad(patch, why) { var c = Object.assign({}, good, patch); eq(C.valid(c), false, why); eq(C.embedUrl(c), '', why + ' (no url)'); }
    ok(C.valid(good), 'the real clip is valid');
    bad({ id: '7456651666096704814/../../x' }, 'path in a TikTok id');
    bad({ id: '7456651666096704814"onload="x' }, 'quote in a TikTok id');
    bad({ id: 'abcdefghijklmnopqrs' }, 'letters in a TikTok id');
    bad({ id: '123' }, 'short TikTok id');
    bad({ id: '7456651666096704814?x=1' }, 'query in a TikTok id');
    bad({ platform: 'instagram', id: 'DT/../Hc', url: 'https://www.instagram.com/reel/DTHcsxqjNDL/' }, 'slash in an IG code');
    bad({ platform: 'instagram', id: 'DTH cs', url: 'https://www.instagram.com/reel/DTHcsxqjNDL/' }, 'space in an IG code');
    bad({ url: 'https://evil.example/@x/video/7456651666096704814' }, 'wrong host');
    bad({ url: 'javascript:alert(1)' }, 'javascript: url');
    bad({ url: 'http://www.tiktok.com/@x/video/7456651666096704814' }, 'http url');
    bad({ poster: 'https://evil.example/p.webp' }, 'external poster');
    bad({ platform: 'myspace' }, 'unknown platform');
    eq(C.valid(null), false); eq(C.embedUrl(undefined), '');
    var fb = Object.assign({}, good, { platform: 'facebook', id: '1273030047026539', url: 'https://www.facebook.com/watch/?v=1273030047026539' });
    eq(C.embedUrl(fb).indexOf('https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com'), 0, 'facebook href is encoded');
  });

  pageTest('a hostile caption in the dialog is text, not markup', function (w, d) {
    var c = Object.assign({}, D.clips[0], { caption: '<img src=x onerror="window.__xss=1">' });
    w.__xss = 0;
    ok(w.MGClips.open(c, d.querySelector('.clip-a')), 'opened');
    eq(d.querySelector('#clip-dlg-h').textContent, c.caption);
    eq(d.querySelectorAll('dialog img[src="x"], [onerror]').length, 0);
    eq(w.__xss, 0);
    d.querySelector('dialog').close();
  });

  pageTest('the hero has no clip links; the section exists, the week heading is "This week"', function (w, d) {
    eq(d.querySelectorAll('.phero .clips-link, .phero [data-clip-id]').length, 0, 'no clip links in the hero');
    ok(d.getElementById('clips'), 'target exists');
    eq(d.getElementById('week-h').textContent, 'This week');
    eq(d.getElementById('clips-h').textContent, 'Clips from the shop');
  });

  [390, 768, 1024, 1280].forEach(function (width) {
    T.async('no page-level horizontal scroll with the clips row at ' + width + 'px', function () {
      return openPage('index.html?now=2026-10-30T18:50', width).then(function (p) {
        var de = p.d.documentElement, sw = de.scrollWidth, cw = de.clientWidth, list = p.d.getElementById('clips-list');
        p.frame.remove();
        eq(sw, cw, 'document scrollWidth equals the viewport width');
        ok(list, 'row exists');
      }, function (err) { if (err && err.message === 'NOACCESS') return T.SKIP; throw err; });
    });
  });
})();
