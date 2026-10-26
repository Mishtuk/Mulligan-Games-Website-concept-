/* Mulligan Games concept: the event editor form (DESIGN.md 9.3): HTML, reading it back, templates, live card preview.
 * Every value goes into the HTML through MG.esc(). Rules (checks, building the series) live in rules.js.
 */
(function () {
  'use strict';
  var MG = window.MG, D = MG.data, R = MG.rules, S = MG.stock, U = MG.ui, V = MG.views, e = MG.esc;

  function opt(v, label, cur) { return '<option value="' + e(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + e(label) + '</option>'; }
  function fld(name, label, input, o) {
    o = o || {};
    return '<label class="fld' + (o.cls ? ' ' + o.cls : '') + '"' + (o.ifs ? ' data-if="' + e(o.ifs) + '"' : '') + ' id="f-' + e(name) + '"><span>' + label + '</span>' + input +
      (o.hint ? '<small class="hint-s">' + e(o.hint) + '</small>' : '') + '<em class="err" id="e-' + e(name) + '" hidden></em></label>';
  }
  function inp(name, val, attrs) { return '<input name="' + e(name) + '" value="' + e(val) + '" autocomplete="off" aria-describedby="e-' + e(name) + '" ' + (attrs || '') + '>'; }
  function chk(name, label, on, ifs) { return '<label class="chk"' + (ifs ? ' data-if="' + e(ifs) + '"' : '') + '><input type="checkbox" name="' + e(name) + '"' + (on ? ' checked' : '') + '><span>' + label + '</span></label>'; }

  V.formatsFor = function (game, cur) {
    var list = (MG.game(game).formats || []).slice();
    if (cur && list.indexOf(cur) === -1) list.unshift(cur);
    return list;
  };

  V.useRow = function (u, products) {
    return '<div class="urw"><label class="fld"><span>Product</span><select name="u-product"><option value="">Pick a product</option>' + products.map(function (p) { return opt(p.id, p.name, u.product); }).join('') + '</select></label>' +
      '<label class="fld"><span>How it counts</span><select name="u-mode">' + opt('perSeat', 'Per seat', u.mode) + opt('fixed', 'Fixed', u.mode) + '</select></label>' +
      '<label class="fld"><span>How many</span><input name="u-qty" inputmode="numeric" value="' + e(u.qty) + '" autocomplete="off"></label>' +
      '<label class="fld" data-useseats><span>Seats <small>(if no limit)</small></span><input name="u-seats" inputmode="numeric" value="' + e(u.seats || '') + '" autocomplete="off"></label>' +
      '<button type="button" class="btn btn-2 btn-sm urw-x" data-act="del-use">' + MG.icon('trash') + 'Remove</button></div>';
  };
  V.dateRow = function (d) {
    return '<div class="drw"><label class="fld"><span>Day</span><input type="date" name="d-date" value="' + e(d.date) + '"></label>' +
      '<label class="fld"><span>Starts</span><input type="time" name="d-start" value="' + e(d.start) + '"></label>' +
      '<button type="button" class="btn btn-2 btn-sm" data-act="del-date" aria-label="Remove this date">' + MG.icon('trash') + '</button></div>';
  };

  /* The whole form. f = flat form object (rules.formFromSeries shape). */
  V.editorForm = function (f, ctx) {
    ctx = ctx || {};
    var g = MG.game(f.game || 'magic'), products = D.products;
    var wd = R.DAYS.map(function (d, i) { return opt(i, d, f.weekday); }).join('');
    var nth = [1, 2, 3, 4, -1].map(function (n) { return opt(n, R.NTH[n], f.nth); }).join('');
    var tools = R.TOOLS.slice(); if (f.toolName && f.toolName !== 'none' && tools.indexOf(f.toolName) === -1) tools.unshift(f.toolName);
    var signups = [['walkin', 'Walk in, no sign-up', 'Players just show up. Free play and weekly nights.'], ['here', 'Sign up on this site', 'Players hold a seat here. You get a roster, a waitlist and check-in.'],
      ['counter', 'At the counter only', 'Players pre-register in the shop (prereleases). You add the names.'], ['external', 'On another site', 'Players sign up on TopDeck, Melee or another page. We link to it.']];
    return '<form class="eform" novalidate autocomplete="off" data-edit="' + e(ctx.editId || '') + '">' +
      '<div id="errsum" class="errsum" role="alert" tabindex="-1" hidden></div>' +
      (ctx.tplName ? '<p class="say">Filled in from the template "' + e(ctx.tplName) + '". Change anything you like.</p>' : '') +
      '<fieldset class="fgroup"><legend>Basics</legend><div class="fgrid">' +
        fld('title', 'Name', inp('title', f.title, 'placeholder="Draft FNM"'), { cls: 'wide' }) +
        fld('game', 'Game', '<select name="game" aria-describedby="e-game">' + MG.data.games.map(function (x) { return opt(x.id, x.name, f.game); }).join('') + '</select>') +
        fld('format', 'Format', '<select name="format">' + V.formatsFor(f.game, f.format).map(function (x) { return opt(x, x, f.format); }).join('') + '</select>') +
      '</div></fieldset>' +
      '<fieldset class="fgroup"><legend>When</legend><div class="fgrid">' +
        fld('date', 'First date', '<input type="date" name="date" value="' + e(f.date) + '" aria-describedby="e-date">', { ifs: 'repeat!=dates' }) +
        fld('start', 'Starts', '<input type="time" name="start" value="' + e(f.start) + '" aria-describedby="e-start">', { ifs: 'repeat!=dates' }) +
        fld('end', 'Ends <small>(optional)</small>', '<input type="time" name="end" value="' + e(f.end) + '" aria-describedby="e-end">') +
        fld('doors', 'Doors open <small>(optional)</small>', '<input type="time" name="doors" value="' + e(f.doors) + '" aria-describedby="e-doors">') +
        fld('repeat', 'Repeats', '<select name="repeat">' + opt('none', 'Does not repeat', f.repeat) + opt('weekly', 'Every week', f.repeat) + opt('monthly', 'Every month', f.repeat) + opt('dates', 'On these dates', f.repeat) + '</select>', { cls: 'wide' }) +
        fld('weekday', 'On', '<select name="weekday">' + wd + '</select>', { ifs: 'repeat=weekly|monthly' }) +
        fld('nth', 'Which one', '<select name="nth">' + nth + '</select>', { ifs: 'repeat=monthly' }) +
        fld('until', 'Last date <small>(leave empty for never)</small>', '<input type="date" name="until" value="' + e(f.until) + '" aria-describedby="e-until">', { ifs: 'repeat=weekly|monthly' }) +
        '<div class="wide" data-if="repeat=dates" id="f-dates"><div class="date-rows" id="date-rows">' + (f.dates && f.dates.length ? f.dates : [{ date: '', start: '' }]).map(V.dateRow).join('') + '</div>' +
          '<button type="button" class="btn btn-2 btn-sm" data-act="add-date">' + MG.icon('plus') + 'Add a date</button><em class="err" id="e-dates" hidden></em></div>' +
      '</div><p class="say" id="sentence" aria-live="polite"></p></fieldset>' +
      '<fieldset class="fgroup"><legend>Entry and seats</legend><div class="fgrid">' +
        fld('fee', 'Entry fee ($)', '<input name="fee" inputmode="numeric" value="' + e(f.fee) + '" aria-describedby="e-fee">', { hint: '0 means free.' }) +
        fld('capacity', 'Seats', '<input name="capacity" inputmode="numeric" value="' + e(f.capacity) + '" aria-describedby="e-capacity">', { hint: 'Leave empty for no limit.' }) +
        fld('minPlayers', 'Minimum players to run', '<input name="minPlayers" inputmode="numeric" value="' + e(f.minPlayers) + '" aria-describedby="e-minPlayers">', { hint: 'Shows "needs players" until it is met. Leave empty for none.' }) +
      '</div>' +
      '<div class="radios" role="radiogroup" aria-label="How players sign up" id="f-signup">' + signups.map(function (s) {
        return '<label class="rcard"><input type="radio" name="signup" value="' + s[0] + '"' + (f.signup === s[0] ? ' checked' : '') + '><strong>' + e(s[1]) + '</strong><small>' + e(s[2]) + '</small></label>';
      }).join('') + '<em class="err" id="e-signup" hidden></em></div>' +
      chk('waitlist', 'Waitlist when full. The next person moves in automatically when a seat opens.', f.waitlist, 'signup=here') +
      '<div class="fgrid" data-if="signup=here">' + fld('cutoffMode', 'Sign-ups close', '<select name="cutoffMode">' + opt('start', 'At the start time', f.cutoffMode) + opt('before', 'Hours before the start', f.cutoffMode) + '</select>') +
        fld('cutoffHours', 'How many hours before', '<select name="cutoffHours">' + [1, 2, 3, 6, 12, 24].map(function (n) { return opt(n, n + (n === 1 ? ' hour' : ' hours'), f.cutoffHours); }).join('') + '</select>', { ifs: 'cutoffMode=before' }) + '</div>' +
      '</fieldset>' +
      '<fieldset class="fgroup"><legend>Official tool</legend><div class="fgrid">' +
        fld('toolName', 'Tool', '<select name="toolName">' + opt('none', 'None', f.toolName) + tools.map(function (t) { return opt(t, t, f.toolName); }).join('') + '</select>', { hint: 'We link to it. Pairings and results stay there.' }) +
        fld('toolUrl', 'Link', '<input type="url" name="toolUrl" value="' + e(f.toolUrl) + '" placeholder="https://" aria-describedby="e-toolUrl">', { hint: 'Needed when players sign up on another site.' }) +
        fld('toolCode', 'Event code', '<input name="toolCode" value="' + e(f.toolCode) + '" autocomplete="off">', { hint: 'Shown to players with a copy button.' }) +
        fld('cta', 'Button text', '<input name="cta" value="' + e(f.cta) + '" placeholder="Sign up online" autocomplete="off">', { ifs: 'signup=external' }) +
      '</div></fieldset>' +
      '<fieldset class="fgroup"><legend>For players</legend><div class="fgrid">' +
        fld('prize', 'Prizes', inp('prize', f.prize, 'placeholder="Prize packs paid by record."'), { cls: 'wide' }) +
        fld('bring', 'What to bring', inp('bring', f.bring), { cls: 'wide' }) +
        fld('description', 'Description', '<textarea name="description" rows="3">' + e(f.description) + '</textarea>', { cls: 'wide' }) +
      '</div>' + chk('kids', 'Kids welcome', f.kids) + chk('invite', 'Invite only', f.invite) +
      '<div class="fgrid" data-if="game=cedh">' + fld('cedhSeries', 'cEDH series', '<select name="cedhSeries">' + opt('', 'Not part of a series', f.cedhSeries) + opt('mcs', 'Championship Series', f.cedhSeries) + opt('5k', '5K', f.cedhSeries) + opt('redemption', 'Redemption', f.cedhSeries) + opt('invitational', 'Invitational', f.cedhSeries) + '</select>') + '</div>' +
      '<div class="fgrid" data-if="game=warhammer">' + fld('whPoints', 'Army points', '<input name="whPoints" inputmode="numeric" value="' + e(f.whPoints) + '">') + fld('whRound', 'Round length (minutes)', '<input name="whRound" inputmode="numeric" value="' + e(f.whRound) + '">') +
        fld('whList', 'List deadline', '<input name="whList" value="' + e(f.whList) + '" placeholder="Oct 28">') + '</div>' +
      '</fieldset>' +
      '<fieldset class="fgroup"><legend>Stock it uses</legend><p class="hint">Prize packs and draft boosters this event takes. The Inventory screen reserves them for upcoming dates.</p>' +
        '<div class="use-rows" id="use-rows">' + (f.uses || []).map(function (u) { return V.useRow(u, products); }).join('') + '</div>' +
        '<button type="button" class="btn btn-2 btn-sm" data-act="add-use">' + MG.icon('plus') + 'Add stock</button><p class="reserve-line" id="reserve-line" aria-live="polite" hidden></p></fieldset>' +
      '<fieldset class="fgroup"><legend>On the website</legend>' + chk('show', 'Show on the website', f.show !== false) + chk('featured', 'Feature on the front page', f.featured) + '</fieldset>' +
      '<div class="savebar"><p class="sb-msg" id="sb-msg" aria-live="polite"></p>' +
        '<button type="button" class="btn btn-2" data-act="leave">Cancel</button>' +
        '<button type="button" class="btn btn-2" data-act="save-tpl">Save as a template</button>' +
        '<button type="submit" class="btn btn-act">Save event</button></div></form>';
  };

  /* read the form back into the flat object */
  V.readForm = function (form) {
    var el = form.elements, f = {};
    ['title', 'game', 'format', 'date', 'start', 'end', 'doors', 'repeat', 'weekday', 'nth', 'until', 'fee', 'capacity', 'minPlayers', 'cutoffMode', 'cutoffHours',
      'toolName', 'toolUrl', 'toolCode', 'cta', 'prize', 'bring', 'description', 'cedhSeries', 'whPoints', 'whRound', 'whList'].forEach(function (k) { f[k] = el[k] ? el[k].value : ''; });
    f.signup = (form.querySelector('input[name="signup"]:checked') || {}).value || '';
    ['waitlist', 'kids', 'invite', 'show', 'featured'].forEach(function (k) { f[k] = el[k] ? el[k].checked : false; });
    f.dates = U.$$('.drw', form).map(function (r) { return { date: r.querySelector('[name="d-date"]').value, start: r.querySelector('[name="d-start"]').value }; });
    f.uses = U.$$('.urw', form).map(function (r) {
      return { product: r.querySelector('[name="u-product"]').value, mode: r.querySelector('[name="u-mode"]').value, qty: r.querySelector('[name="u-qty"]').value, seats: r.querySelector('[name="u-seats"]').value };
    });
    return f;
  };

  /* show/hide pieces by rule: data-if="name=a|b" or "name!=a" */
  V.applyIfs = function (form, f) {
    U.$$('[data-if]', form).forEach(function (n) {
      var rule = n.getAttribute('data-if'), m = /^(\w+)(!?=)(.+)$/.exec(rule), v = String(f[m[1]]), vals = m[3].split('|');
      var hit = vals.indexOf(v) !== -1;
      n.hidden = m[2] === '=' ? !hit : hit;
    });
    U.$$('[data-useseats]', form).forEach(function (n) { n.hidden = !!f.capacity; });
  };

  /* a draft series from a (maybe unfinished) form, for the live card and the stock line */
  V.draftSeries = function (f, now) {
    var d = Object.assign({}, f);
    if (!d.title) d.title = 'Your event';
    if (d.repeat === 'none' && !/^\d{4}-\d\d-\d\d$/.test(d.date || '')) d.date = MG.ymd(MG.addDays(now, 7));
    if (d.repeat !== 'dates' && !d.start) d.start = '19:00';
    if (d.repeat === 'dates') { d.dates = (d.dates || []).filter(function (x) { return x.date && x.start; }); if (!d.dates.length) { d.repeat = 'none'; d.date = MG.ymd(MG.addDays(now, 7)); d.start = d.start || '19:00'; } }
    if (d.fee === '' || isNaN(Number(d.fee))) d.fee = '0';
    if (!d.signup) d.signup = 'walkin';
    if (d.weekday === '') d.weekday = String(d.date ? MG.parseYmd(d.date).getDay() : 5);
    if (d.capacity && (isNaN(Number(d.capacity)) || Number(d.capacity) < 1)) d.capacity = '';
    if (d.minPlayers && (isNaN(Number(d.minPlayers)) || Number(d.minPlayers) < 1)) d.minPlayers = '';
    if (d.toolUrl && !/^https?:\/\//i.test(d.toolUrl)) d.toolUrl = '';
    return R.seriesFromForm(d, 'draft');
  };

  V.previewHtml = function (f, now) {
    var built = V.draftSeries(f, now), s = built.series, from = MG.ymd(now);
    var occ = MG.occurrences(s, s.recurrence.startDate && s.recurrence.startDate > from ? s.recurrence.startDate : from, MG.ymd(MG.addDays(now, 500)))[0] || MG.occurrences(s, '2000-01-01', '2100-01-01')[0];
    if (!occ) return { html: '<p class="hint">Pick a date to see the card.</p>', built: built };
    return { html: MG.eventCard(occ, now, { href: '#' }), built: built, occ: occ };
  };
  V.reserveText = function (built, occ) {
    if (!occ || !built.uses.length) return null;
    var lines = S.reservations(built.uses, [{ series: built.series, key: occ.key, date: occ.date, start: occ.start, cancelled: false, cap: MG.capOf(occ), taken: 0 }]);
    if (!lines.length) return null;
    var d = MG.parseYmd(occ.date), short = false;
    var text = 'Reserves ' + lines.map(function (l) {
      var p = S.find(D.products, l.product); if (p && l.qty > p.onHand) short = true;
      return l.qty + ' ' + (p ? p.name : 'product');
    }).join(' and ') + ' for ' + MG.fmtDate(d) + '.' + (short ? ' That is more than is on hand.' : '');
    return { text: text, short: short };
  };

  /* ---------- templates ---------- */
  V.templatesFor = function (game) {
    var yours = D.templates.filter(function (t) { return t.game === game; }).map(function (t) { return { id: t.id, name: t.name, yours: true, form: t.form, summary: V.formSummary(t.form) }; });
    var built = window.MG_EXTRA.templates.filter(function (t) { return t.game === game; }).map(function (t) { return { id: t.id, name: t.name, fields: t.fields, summary: V.fieldsSummary(t.fields) }; });
    return yours.concat(built);
  };
  function words(fee, cap, signup, wait, tool, uses, minPlayers) {
    var bits = [fee === 0 || fee === '0' ? 'free' : '$' + fee];
    if (cap) bits.push(cap + ' seats');
    bits.push(signup === 'here' ? 'sign up here' : signup === 'counter' ? 'at the counter' : signup === 'external' ? 'sign up on another site' : 'walk in');
    if (wait) bits.push('waitlist');
    if (minPlayers) bits.push('needs ' + minPlayers);
    if (tool && tool !== 'none') bits.push(tool.replace(/^Wizards /, ''));
    if (uses && uses.length) { var u = uses[0], p = S.find(D.products, u.product); if (p) bits.push((u.fixed != null ? u.fixed : u.perSeat + ' per seat') + (u.fixed != null ? '' : '') + ' ' + p.name.toLowerCase().replace(/, current set$/, '')); }
    return bits.join(', ');
  }
  V.fieldsSummary = function (t) { return words(t.fee, t.capacity, t.signup, t.waitlist, t.tool, t.uses, t.minPlayers); };
  V.formSummary = function (f) { return words(f.fee, f.capacity, f.signup, f.waitlist, f.toolName, (f.uses || []).map(function (u) { return u.mode === 'fixed' ? { product: u.product, fixed: u.qty } : { product: u.product, perSeat: u.qty }; }), f.minPlayers); };

  // a good first date for a template: the weekday it repeats on, or a Friday four weeks out for prereleases
  V.defaultDate = function (t, now) {
    var f = t.fields || t.form || {}, wd = f.weekday != null && f.weekday !== '' ? Number(f.weekday) : null;
    if (f.kind === 'prerelease') { var d = MG.addDays(now, 28); while (d.getDay() !== 5) d = MG.addDays(d, 1); return MG.ymd(d); }
    if (f.repeat === 'monthly' && wd != null) {
      var nth = Number(f.nth || 1), y = now.getFullYear(), m = now.getMonth();
      for (var i = 0; i < 14; i++) {
        var first = new Date(y, m + i, 1), off = (wd - first.getDay() + 7) % 7, hit = new Date(y, m + i, 1 + off + (nth > 0 ? (nth - 1) * 7 : 0));
        if (nth < 0) { var last = new Date(y, m + i + 1, 0); hit = new Date(y, m + i, last.getDate() - ((last.getDay() - wd + 7) % 7)); }
        if (hit > now) return MG.ymd(hit);
      }
    }
    var d2 = MG.addDays(now, 1);
    if (wd != null) while (d2.getDay() !== wd) d2 = MG.addDays(d2, 1); else d2 = MG.addDays(now, 7);
    return MG.ymd(d2);
  };
  V.formFromTemplate = function (t, now) {
    var date = V.defaultDate(t, now), f;
    if (t.form) { f = JSON.parse(JSON.stringify(t.form)); f.date = date; f.weekday = String(MG.parseYmd(date).getDay()); }
    else f = R.formFromTemplate({ fields: t.fields }, date);
    if (f.repeat === 'dates') {
      var base = MG.parseYmd(date), slots = t.fields ? t.fields.dates : f.dates;
      f.dates = (slots && slots.length ? slots : [{ start: f.start }]).map(function (x, i) {
        return { date: MG.ymd(MG.addDays(base, i === 0 ? 0 : 2)), start: x.start || '19:00' };
      });
    }
    return f;
  };
})();
