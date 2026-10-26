/* Mulligan Games concept: event rules, as plain functions.
 *
 * Everything with logic lives here (and in stock.js) so the Phase 2 build can port it to server code and
 * so tests.html can check it. No DOM, no storage. Functions that change data take the array to change
 * ("all" = every registration) and say so; they never read window.MG_SAMPLE themselves.
 *
 * Rules (DESIGN.md sections 8 and 9, DECISIONS.md D5 and D6):
 *   - A seat is a registration with status "in". Seats left = cap - in. No cap = no limit, no waitlist.
 *   - Full and waitlist on: the next person is "waitlist", in sign-up order. Full and waitlist off: refused.
 *   - A seat frees up (cancel, staff removal, bigger cap): the first waitlisted people move in, in order.
 *   - Sign-ups close at the start (or N hours before). Staff can still add walk-ins and seat over the cap.
 *   - Min-to-run: below the minimum the event "needs players" (a warning, never an automatic cancel).
 */
(function () {
  'use strict';
  var MG = window.MG;
  var R = MG.rules = {};

  R.PAYMENTS = ['unpaid', 'door', 'online', 'comped', 'credit'];
  R.PAYMENT_LABEL = { unpaid: 'Not paid', door: 'At the door', online: 'Paid online elsewhere', comped: 'Comped', credit: 'Store credit' };
  R.PAYMENT_SHORT = { unpaid: 'Unpaid', door: 'Door', online: 'Online', comped: 'Comped', credit: 'Credit' };

  function trim(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }

  /* ---------- groups: the registrations of one dated event ---------- */
  // key = { series, date, start? }. A registration with no start matches any slot of that date.
  R.matches = function (r, key) {
    return r.series === key.series && r.date === key.date && (!r.start || !key.start || r.start === key.start);
  };
  R.group = function (all, key) { return all.filter(function (r) { return R.matches(r, key); }); };

  R.counts = function (group) {
    var c = { in: 0, waitlist: 0, cancelled: 0, noshow: 0, checkedIn: 0, paid: 0 };
    group.forEach(function (r) {
      if (r.status === 'in') {
        c.in++;
        if (r.checkedIn) c.checkedIn++;
        if (r.payment && r.payment !== 'unpaid') c.paid++;
      } else if (c[r.status] != null) c[r.status]++;
    });
    return c;
  };
  R.seatsLeft = function (cap, group) {
    if (!cap) return null;
    return Math.max(0, cap - R.counts(group).in);
  };
  R.isFull = function (cap, group) { return !!cap && R.counts(group).in >= cap; };

  // the waitlist in order: stored position first, then who signed up first
  R.waitlistOf = function (group) {
    return group.map(function (r, i) { return { r: r, i: i }; })
      .filter(function (x) { return x.r.status === 'waitlist'; })
      .sort(function (a, b) {
        var pa = a.r.waitlistPos == null ? 1e9 : a.r.waitlistPos, pb = b.r.waitlistPos == null ? 1e9 : b.r.waitlistPos;
        if (pa !== pb) return pa - pb;
        if (a.r.createdAt !== b.r.createdAt) return (a.r.createdAt || '') < (b.r.createdAt || '') ? -1 : 1;
        return a.i - b.i;
      }).map(function (x) { return x.r; });
  };
  // make waitlistPos 1..n (and null for everyone else); call after any change
  R.renumber = function (group) {
    var wl = R.waitlistOf(group);
    group.forEach(function (r) { if (r.status !== 'waitlist') r.waitlistPos = null; });
    wl.forEach(function (r, i) { r.waitlistPos = i + 1; });
    return wl;
  };

  /* ---------- sign-up form checks (DESIGN.md section 8) ---------- */
  R.validateSignup = function (form) {
    var err = {}, name = trim(form.name), email = trim(form.email), phone = trim(form.phone);
    if (!name) err.name = 'Enter your name so we can find you at the counter.';
    if (!email && !phone) err.email = 'Add an email or a phone number.';
    else {
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) err.email = 'That email doesn\u2019t look right.';
      if (phone && digits(phone).length < 7) err.phone = 'That phone number looks short.';
    }
    return err;
  };
  // someone already on the list (in or waitlist) with the same name, email or phone
  R.findDuplicate = function (group, form) {
    var n = trim(form.name).toLowerCase(), em = trim(form.email).toLowerCase(), ph = digits(form.phone);
    for (var i = 0; i < group.length; i++) {
      var r = group[i];
      if (r.status !== 'in' && r.status !== 'waitlist') continue;
      var c = String(r.contact || '').toLowerCase();
      if (n && trim(r.name).toLowerCase() === n) return r;
      if (em && c.indexOf(em) !== -1) return r;
      if (ph.length >= 7 && digits(c).indexOf(ph) !== -1) return r;
    }
    return null;
  };

  /* Public sign-up. ctx: { cap, waitlist, now, cutoffAt, id, createdAt, expected }
   * expected "in" means the person was shown an open seat; if the seat is gone by the time they send it,
   * result.raced is true ("That seat just went. You're on the waitlist (#1) instead."). */
  R.signUp = function (all, key, form, ctx) {
    if (trim(form.website)) return { ok: false, bot: true };        // honeypot: real people never fill it
    if (ctx.cutoffAt && ctx.now >= ctx.cutoffAt) {
      var hm = pad2(ctx.cutoffAt.getHours()) + ':' + pad2(ctx.cutoffAt.getMinutes());
      return { ok: false, error: 'closed', message: 'Sign-ups closed at ' + MG.fmtTime(hm) + '. Walk in if seats are left.' };
    }
    var errors = R.validateSignup(form);
    if (Object.keys(errors).length) return { ok: false, error: 'invalid', errors: errors };
    var group = R.group(all, key), dup = R.findDuplicate(group, form);
    if (dup) return { ok: false, error: 'dup', message: 'You\u2019re already signed up for this one, as ' + dup.name + '.', existing: dup };
    var c = R.counts(group), full = !!ctx.cap && c.in >= ctx.cap;
    if (full && !ctx.waitlist) return { ok: false, error: 'full', message: 'This one is full. Ask at the counter about open seats.' };
    var status = full ? 'waitlist' : 'in';
    var reg = {
      id: ctx.id, series: key.series, date: key.date, start: key.start || null, name: trim(form.name),
      contact: [trim(form.email), trim(form.phone)].filter(Boolean).join(' / '),
      playerId: trim(form.playerId) || null, status: status, waitlistPos: null, checkedIn: false, payment: 'unpaid',
      createdAt: ctx.createdAt
    };
    all.push(reg);
    var wl = R.renumber(R.group(all, key));
    return {
      ok: true, status: status, reg: reg, seat: status === 'in' ? c.in + 1 : null,
      position: status === 'waitlist' ? wl.indexOf(reg) + 1 : null,
      raced: ctx.expected === 'in' && status === 'waitlist'
    };
  };

  /* Move people from the waitlist into free seats, in order. Returns the people who moved in. */
  R.promote = function (all, key, cap) {
    var group = R.group(all, key), moved = [];
    while (true) {
      var wl = R.waitlistOf(group);
      if (!wl.length) break;
      if (cap && R.counts(group).in >= cap) break;
      var next = wl[0];
      next.status = 'in'; next.waitlistPos = null; next.promotedAt = true;
      moved.push(next);
      R.renumber(group);
    }
    R.renumber(group);
    return moved;
  };

  /* Cancel a sign-up (player asked, or staff removed them). The seat goes to the next on the waitlist.
   * refundDue: they had paid something real (door / online / credit), staff must hand it back. */
  R.cancelReg = function (all, key, regId, cap) {
    var group = R.group(all, key), reg = group.filter(function (r) { return r.id === regId; })[0];
    if (!reg || reg.status === 'cancelled') return { ok: false };
    var wasIn = reg.status === 'in';
    var refundDue = wasIn && (reg.payment === 'door' || reg.payment === 'online' || reg.payment === 'credit');
    reg.status = 'cancelled'; reg.checkedIn = false; reg.waitlistPos = null; delete reg.promotedAt;
    var promoted = wasIn ? R.promote(all, key, cap) : (R.renumber(group), []);
    return { ok: true, reg: reg, promoted: promoted, refundDue: refundDue };
  };

  // staff: move a waitlisted person in now, even when full ("over" tells the screen to say 29 of 28)
  R.moveIn = function (all, key, regId, cap) {
    var group = R.group(all, key), reg = group.filter(function (r) { return r.id === regId; })[0];
    if (!reg || reg.status !== 'waitlist') return { ok: false };
    reg.status = 'in'; reg.waitlistPos = null; reg.promotedAt = true;
    R.renumber(group);
    return { ok: true, reg: reg, over: !!cap && R.counts(group).in > cap };
  };
  // staff: nudge someone up (-1) or down (+1) the waitlist
  R.moveWaitlist = function (all, key, regId, dir) {
    var group = R.group(all, key), wl = R.waitlistOf(group), i = -1;
    wl.forEach(function (r, n) { if (r.id === regId) i = n; });
    var j = i + dir;
    if (i < 0 || j < 0 || j >= wl.length) return { ok: false };
    var t = wl[i]; wl[i] = wl[j]; wl[j] = t;
    wl.forEach(function (r, n) { r.waitlistPos = n + 1; });
    return { ok: true, position: j + 1 };
  };

  R.checkIn = function (reg, on) {
    if (reg.status !== 'in') return false;
    reg.checkedIn = !!on;
    return true;
  };
  R.setPayment = function (reg, p) {
    if (R.PAYMENTS.indexOf(p) === -1 || reg.status === 'cancelled') return false;
    reg.payment = p;
    return true;
  };

  /* Counter walk-in. mode: "auto" (refuse when full so the screen can offer the two buttons),
   * "waitlist", or "over" (seat anyway). ctx: { cap, id, createdAt, payment }. */
  R.addWalkIn = function (all, key, name, ctx) {
    name = trim(name);
    if (!name) return { ok: false, error: 'name', message: 'Type a name first.' };
    var group = R.group(all, key), dup = R.findDuplicate(group, { name: name });
    if (dup) return { ok: false, error: 'dup', existing: dup, message: dup.name + ' is already on the list.' };
    var mode = ctx.mode || 'auto', c = R.counts(group), full = !!ctx.cap && c.in >= ctx.cap;
    if (full && mode === 'auto') return { ok: false, error: 'full', full: true };
    var wait = full && mode === 'waitlist';
    var reg = {
      id: ctx.id, series: key.series, date: key.date, start: key.start || null, name: name, contact: '', playerId: null,
      status: wait ? 'waitlist' : 'in', waitlistPos: null, checkedIn: !wait, walkIn: true,
      payment: wait ? 'unpaid' : (ctx.payment || 'door'), createdAt: ctx.createdAt
    };
    all.push(reg);
    var wl = R.renumber(R.group(all, key));
    return { ok: true, reg: reg, status: reg.status, position: wait ? wl.indexOf(reg) + 1 : null, over: !wait && full };
  };

  /* Minimum to run: below it the event "needs players" (a warning only). */
  R.minToRun = function (taken, min) {
    if (!min) return { min: null, taken: taken, short: 0, ok: true };
    return { min: min, taken: taken, short: Math.max(0, min - taken), ok: taken >= min };
  };

  /* After the seats of a date change (bigger cap, one person removed): fill free seats from the waitlist. */
  R.afterCapacityChange = function (all, key, newCap) { return R.promote(all, key, newCap); };

  /* ---------- reminders for the admin Today screen ---------- */
  // past dates that had sign-ups where results are missing or not reported to the publisher tool.
  // occs: past occurrences ({ series, date, start, key }); results: [{ series, date, reported }]
  R.unreported = function (occs, all, results) {
    return occs.filter(function (o) {
      if (!o.series.tool || o.cancelled) return false;
      var has = R.group(all, { series: o.series.id, date: o.date, start: o.start }).some(function (r) { return r.status === 'in'; });
      var res = results.filter(function (x) { return x.series === o.series.id && x.date === o.date; })[0];
      if (res) return !res.reported;
      return has;
    });
  };

  /* ---------- series: words, form to data, checks ---------- */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var NTH = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', '-1': 'last' };
  R.DAYS = DAYS; R.NTH = NTH;

  R.recurrenceSummary = function (s) {
    var r = s.recurrence, t = s.start ? MG.fmtTime(s.start) : '';
    if (r.type === 'none') { var d = MG.parseYmd(r.date); return MG.dayName(d) + ' ' + MG.fmtDate(d) + (t ? ', ' + t : ''); }
    if (r.type === 'weekly') return 'Every ' + DAYS[r.day] + (t ? ', ' + t : '');
    if (r.type === 'nth') return NTH[r.nth] + ' ' + DAYS[r.day] + ' of the month' + (t ? ', ' + t : '');
    if (r.type === 'dates') {
      var lastM = null, bits = r.dates.map(function (x) {
        var dd = MG.parseYmd(x.date), m = dd.getMonth(), out = (m === lastM ? '' : MG.monthShort(dd) + ' ') + dd.getDate();
        lastM = m; return out;
      });
      return r.dates.length + (r.dates.length === 1 ? ' date: ' : ' dates: ') + bits.join(', ');
    }
    return '';
  };
  // the sentence under the "When" group: "Every Friday at 7 PM, starting Oct 30."
  R.recurrenceSentence = function (s) {
    var r = s.recurrence, t = s.start ? MG.fmtTime(s.start) : '', until = r.until ? ', until ' + MG.fmtDate(MG.parseYmd(r.until)) : '';
    var from = r.startDate ? ', starting ' + MG.fmtDate(MG.parseYmd(r.startDate)) : '';
    if (r.type === 'none') return r.date ? 'Once, on ' + MG.fmtLongDate(MG.parseYmd(r.date)) + (t ? ' at ' + t : '') + '.' : '';
    if (r.type === 'weekly') return 'Every ' + DAYS[r.day] + (t ? ' at ' + t : '') + from + until + '.';
    if (r.type === 'nth') return 'The ' + NTH[r.nth] + ' ' + DAYS[r.day] + ' of every month' + (t ? ' at ' + t : '') + from + until + '.';
    if (r.type === 'dates') {
      if (!r.dates.length) return '';
      return 'On ' + MG.list(r.dates.map(function (x) { return MG.fmtDate(MG.parseYmd(x.date)) + ' at ' + MG.fmtTime(x.start || s.start); })) + '.';
    }
    return '';
  };
  R.signupWords = function (s) {
    var t = s.tool && s.tool.name;
    return s.signup === 'walkin' ? 'Walk in, no sign-up' : s.signup === 'here' ? 'Sign up on this site' : s.signup === 'counter' ? 'At the counter only'
      : 'On ' + (t || 'another site');
  };

  R.TOOLS = ['Wizards EventLink', 'Play! Pokemon', 'Bandai TCG+', 'KONAMI NEURON', 'Ravensburger Play Hub', 'PlayRiftbound', 'Melee', 'Best Coast Pairings', 'TopDeck', 'Other'];
  // label of the optional player ID field, from the tool (DESIGN.md section 8); null hides it
  R.playerIdLabel = function (tool) {
    var n = (tool && tool.name || '').toLowerCase();
    if (n.indexOf('eventlink') !== -1 || n.indexOf('wizards') !== -1) return 'Wizards ID (Companion)';
    if (n.indexOf('play! pokemon') !== -1) return 'Play! Pokemon ID';
    if (n.indexOf('bandai') !== -1) return 'Bandai TCG+ ID';
    if (n.indexOf('konami') !== -1) return 'KONAMI ID';
    return null;
  };

  function int(v) { v = trim(v); return v === '' ? null : Number(v); }
  function isYmd(s) { return /^\d{4}-\d\d-\d\d$/.test(s || '') && !isNaN(MG.parseYmd(s)); }
  function isHm(s) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(s || '') || s === '24:00'; }
  function isUrl(s) { return /^https?:\/\/[^\s]+\.[^\s]+$/i.test(s || ''); }

  /* Checks the editor form (flat object, strings from inputs). Returns { field: "plain message" }. */
  R.validateSeries = function (f) {
    var e = {}, cap = int(f.capacity), min = int(f.minPlayers), fee = trim(f.fee);
    if (!trim(f.title)) e.title = 'Give the event a name.';
    if (!f.game) e.game = 'Pick a game.';
    if (f.repeat === 'dates') {
      var rows = (f.dates || []).filter(function (x) { return x.date || x.start; });
      if (!rows.length) e.dates = 'Add at least one date.';
      else if (rows.some(function (x) { return !isYmd(x.date) || !isHm(x.start); })) e.dates = 'Each date needs a day and a start time.';
    } else if (f.repeat === 'none' || f.repeat === undefined) { if (!isYmd(f.date)) e.date = 'Pick the first date.'; }
    else if (f.date && !isYmd(f.date)) e.date = 'Pick the first date.';
    else if (!f.date && (f.weekday === '' || f.weekday == null)) e.date = 'Pick the first date.';
    if (f.repeat !== 'dates' && !isHm(f.start)) e.start = 'Pick a start time.';
    if (f.end && !isHm(f.end)) e.end = 'That end time doesn\u2019t look right.';
    if (f.doors && !isHm(f.doors)) e.doors = 'That time doesn\u2019t look right.';
    if (f.repeat !== 'none' && f.repeat !== 'dates' && f.until) {
      if (!isYmd(f.until)) e.until = 'Pick the last date.';
      else if (isYmd(f.date) && f.until < f.date) e.until = 'The last date is before the first date.';
    }
    if (fee === '' || isNaN(Number(fee)) || Number(fee) < 0) e.fee = 'Enter the entry fee. 0 means free.';
    if (cap !== null && (isNaN(cap) || cap < 1 || cap !== Math.floor(cap))) e.capacity = 'Seats must be a whole number, 1 or more. Leave it empty for no limit.';
    if (min !== null && (isNaN(min) || min < 1 || min !== Math.floor(min))) e.minPlayers = 'Use a whole number, 1 or more.';
    else if (min !== null && cap !== null && !e.capacity && min > cap) e.minPlayers = 'The minimum can\u2019t be more than the seats.';
    if (!f.signup) e.signup = 'Choose how players sign up.';
    if (f.signup === 'external' && !isUrl(trim(f.toolUrl))) e.toolUrl = 'Add the link players sign up on (starts with https://).';
    else if (trim(f.toolUrl) && !isUrl(trim(f.toolUrl))) e.toolUrl = 'That link should start with https://.';
    if (f.signup === 'here' && cap === null && !e.capacity) { /* allowed: sign-ups with no limit */ }
    return e;
  };

  /* Form -> { series, uses }. Run validateSeries first. id is kept when editing. */
  R.seriesFromForm = function (f, id) {
    var cap = int(f.capacity), min = int(f.minPlayers), rec;
    if (f.repeat === 'weekly') rec = { type: 'weekly', day: Number(f.weekday) };
    else if (f.repeat === 'monthly') rec = { type: 'nth', nth: Number(f.nth), day: Number(f.weekday) };
    else if (f.repeat === 'dates') {
      var rows = f.dates.filter(function (x) { return x.date && x.start; }).sort(function (a, b) { return (a.date + a.start) < (b.date + b.start) ? -1 : 1; });
      rec = { type: 'dates', dates: rows.map(function (x) { return { date: x.date, start: x.start }; }) };
    } else rec = { type: 'none', date: f.date };
    if ((f.repeat === 'weekly' || f.repeat === 'monthly') && f.date) rec.startDate = f.date; // empty: the series keeps running as before
    if ((f.repeat === 'weekly' || f.repeat === 'monthly') && f.until) rec.until = f.until;
    var s = {
      id: id, title: trim(f.title), game: f.game, format: trim(f.format) || (MG.game(f.game).formats[0] || ''), kind: f.kind || 'special',
      recurrence: rec, start: f.repeat === 'dates' ? rows[0].start : f.start, end: f.end || null, fee: Number(trim(f.fee)),
      signup: f.signup, enabled: f.show !== false
    };
    if (f.doors) s.doors = f.doors;
    if (cap !== null) s.capacity = cap;
    if (min !== null) s.minPlayers = min;
    if (f.signup === 'here') {
      s.waitlist = !!f.waitlist && cap !== null;
      s.cutoff = f.cutoffMode === 'before' ? 'before' : 'start';
      if (f.cutoffMode === 'before') s.cutoffHours = Math.max(1, Number(f.cutoffHours) || 1);
    }
    var tn = f.toolName && f.toolName !== 'none' ? f.toolName : null, url = trim(f.toolUrl), code = trim(f.toolCode);
    if (tn || url || code || f.signup === 'external') {
      s.tool = { name: tn || 'another site' };
      if (url) s.tool.url = url;
      if (code) s.tool.code = code;
      if (f.signup === 'external' && trim(f.cta)) s.tool.cta = trim(f.cta);
    }
    if (trim(f.prize)) s.prize = trim(f.prize);
    if (trim(f.bring)) s.bring = trim(f.bring);
    if (trim(f.description)) s.description = trim(f.description);
    if (f.kids) s.kidsWelcome = true;
    if (f.invite) s.inviteOnly = true;
    if (f.game === 'cedh' && f.cedhSeries) s.cedhSeries = f.cedhSeries;
    if (f.game === 'warhammer' && (trim(f.whPoints) || trim(f.whRound) || trim(f.whList))) {
      s.warhammer = { points: int(f.whPoints), roundMins: int(f.whRound), listDeadline: trim(f.whList) || null };
    }
    if (f.featured) s.featured = true;
    if (f.templateOf) s.templateOf = f.templateOf;
    var uses = (f.uses || []).filter(function (u) { return u.product && Number(u.qty) > 0; }).map(function (u) {
      var row = { series: id, product: u.product };
      if (u.mode === 'fixed') row.fixed = Number(u.qty); else row.perSeat = Number(u.qty);
      if (u.seats && Number(u.seats) > 0) row.seatsPerDate = Number(u.seats);
      return row;
    });
    return { series: s, uses: uses };
  };

  /* Series (+ stock use rows) -> flat form, for editing and for templates. */
  R.formFromSeries = function (s, uses) {
    var r = s.recurrence, f = {
      title: s.title, game: s.game, format: s.format, kind: s.kind,
      repeat: r.type === 'weekly' ? 'weekly' : r.type === 'nth' ? 'monthly' : r.type === 'dates' ? 'dates' : 'none',
      date: r.type === 'none' ? r.date : r.type === 'dates' ? (r.dates[0] && r.dates[0].date) : (r.startDate || ''),
      weekday: r.day != null ? String(r.day) : '', nth: r.nth != null ? String(r.nth) : '1', until: r.until || '',
      dates: r.type === 'dates' ? r.dates.map(function (x) { return { date: x.date, start: x.start }; }) : [],
      start: s.start || '', end: s.end || '', doors: s.doors || '', fee: s.fee == null ? '' : String(s.fee),
      capacity: s.capacity ? String(s.capacity) : '', minPlayers: s.minPlayers ? String(s.minPlayers) : '',
      signup: s.signup, waitlist: !!s.waitlist, cutoffMode: s.cutoffHours ? 'before' : 'start', cutoffHours: String(s.cutoffHours || 2),
      toolName: (s.tool && s.tool.name !== 'another site' && s.tool.name) || 'none', toolUrl: (s.tool && s.tool.url) || '', toolCode: (s.tool && s.tool.code) || '',
      cta: (s.tool && s.tool.cta) || '', prize: s.prize || '', bring: s.bring || '', description: s.description || '',
      kids: !!s.kidsWelcome, invite: !!s.inviteOnly, cedhSeries: s.cedhSeries || '',
      whPoints: s.warhammer && s.warhammer.points != null ? String(s.warhammer.points) : '',
      whRound: s.warhammer && s.warhammer.roundMins != null ? String(s.warhammer.roundMins) : '',
      whList: (s.warhammer && s.warhammer.listDeadline) || '',
      show: s.enabled !== false, featured: !!s.featured,
      uses: (uses || []).map(function (u) {
        return { product: u.product, mode: u.fixed != null ? 'fixed' : 'perSeat', qty: String(u.fixed != null ? u.fixed : u.perSeat), seats: u.seatsPerDate ? String(u.seatsPerDate) : '' };
      })
    };
    return f;
  };

  /* A template (data/templates.js) -> a form. firstDate is the date the owner picked. */
  R.formFromTemplate = function (tpl, firstDate) {
    var t = tpl.fields || tpl, d = firstDate ? MG.parseYmd(firstDate) : null;
    var f = {
      title: t.title || '', game: t.game, format: t.format || '', kind: t.kind || 'special', repeat: t.repeat || 'none',
      date: firstDate || '', weekday: t.weekday != null ? String(t.weekday) : d ? String(d.getDay()) : '', nth: String(t.nth || 1), until: '',
      dates: (t.dates || []).map(function (x) { return { date: x.date || '', start: x.start || '' }; }),
      start: t.start || '', end: t.end || '', doors: t.doors || '', fee: t.fee == null ? '' : String(t.fee),
      capacity: t.capacity ? String(t.capacity) : '', minPlayers: t.minPlayers ? String(t.minPlayers) : '',
      signup: t.signup || 'walkin', waitlist: !!t.waitlist, cutoffMode: 'start', cutoffHours: '2',
      toolName: t.tool || 'none', toolUrl: t.toolUrl || '', toolCode: '', cta: t.cta || '', prize: t.prize || '', bring: t.bring || '',
      description: t.description || '', kids: !!t.kids, invite: !!t.invite, cedhSeries: t.cedhSeries || '',
      whPoints: t.whPoints ? String(t.whPoints) : '', whRound: t.whRound ? String(t.whRound) : '', whList: t.whList || '',
      show: true, featured: false,
      uses: (t.uses || []).map(function (u) { return { product: u.product, mode: u.fixed != null ? 'fixed' : 'perSeat', qty: String(u.fixed != null ? u.fixed : u.perSeat), seats: u.seatsPerDate ? String(u.seatsPerDate) : '' }; })
    };
    if (f.repeat === 'dates' && d && !f.dates.length) f.dates = [{ date: firstDate, start: f.start }];
    return f;
  };

  /* ---------- one-date exceptions (cancel / change / bring back) ---------- */
  R.findException = function (exceptions, seriesId, date) {
    for (var i = 0; i < exceptions.length; i++) if (exceptions[i].series === seriesId && exceptions[i].date === date) return exceptions[i];
    return null;
  };
  // patch: { type: 'cancel' | 'change', start?, capacity?, note? }. Returns the exception.
  R.setException = function (exceptions, seriesId, date, patch, updatedYmd) {
    var ex = R.findException(exceptions, seriesId, date);
    if (!ex) { ex = { series: seriesId, date: date }; exceptions.push(ex); }
    Object.keys(patch).forEach(function (k) { if (patch[k] === null || patch[k] === '' || patch[k] === undefined) delete ex[k]; else ex[k] = patch[k]; });
    delete ex.sample;
    ex.updated = updatedYmd || ex.updated;
    if (!ex.type) ex.type = 'change';
    // a "change" with nothing changed is no exception at all
    if (ex.type === 'change' && ex.start == null && ex.capacity == null && !ex.note) R.clearException(exceptions, seriesId, date);
    return ex;
  };
  R.clearException = function (exceptions, seriesId, date) {
    for (var i = exceptions.length - 1; i >= 0; i--) if (exceptions[i].series === seriesId && exceptions[i].date === date) exceptions.splice(i, 1);
  };

  /* ---------- .ics, built in the browser (DESIGN.md section 7) ---------- */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function icsLocal(d) { return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + 'T' + pad2(d.getHours()) + pad2(d.getMinutes()) + '00'; }
  function icsUtc(d) { return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) + 'T' + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + pad2(d.getUTCSeconds()) + 'Z'; }
  R.icsEscape = function (t) { return String(t == null ? '' : t).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,'); };
  function octets(ch) { var c = ch.charCodeAt(0); return c < 0x80 ? 1 : c < 0x800 ? 2 : (c >= 0xD800 && c <= 0xDFFF) ? 2 : 3; } // surrogate halves: 4 bytes per pair
  R.icsFold = function (line) { // lines longer than 75 octets continue on the next line after one space
    var out = '', n = 0, limit = 75;
    for (var i = 0; i < line.length; i++) {
      var ch = line.charAt(i), w = octets(ch);
      if (n + w > limit) { out += '\r\n '; n = 1; limit = 75; }
      out += ch; n += w;
    }
    return out;
  };
  var TZ = ['BEGIN:VTIMEZONE', 'TZID:America/New_York',
    'BEGIN:DAYLIGHT', 'TZOFFSETFROM:-0500', 'TZOFFSETTO:-0400', 'TZNAME:EDT', 'DTSTART:19700308T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU', 'END:DAYLIGHT',
    'BEGIN:STANDARD', 'TZOFFSETFROM:-0400', 'TZOFFSETTO:-0500', 'TZNAME:EST', 'DTSTART:19701101T020000', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU', 'END:STANDARD',
    'END:VTIMEZONE'];
  /* occs: occurrences from MG.occurrences. ctx: { now: Date, location, url: function (occ) -> string, calName } */
  R.ics = function (occs, ctx) {
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mulligan Games//Events concept//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'X-WR-CALNAME:' + R.icsEscape(ctx.calName || 'Mulligan Games events'), 'X-WR-TIMEZONE:America/New_York'].concat(TZ);
    occs.forEach(function (o) {
      var s = o.series, fee = MG.fmtFee(s.fee), desc = [fee === 'Free' ? 'Free entry.' : 'Entry ' + fee + '.', R.signupWords(s) + '.'];
      if (o.note) desc.push(o.note);
      if (s.tool && s.tool.name && s.tool.name !== 'another site') desc.push('Run on ' + s.tool.name + '.');
      if (ctx.url) desc.push(ctx.url(o));
      lines.push('BEGIN:VEVENT',
        'UID:' + o.key + '@mulligangames',
        'DTSTAMP:' + icsUtc(ctx.now || new Date()),
        'DTSTART;TZID=America/New_York:' + icsLocal(o.startAt),
        'DTEND;TZID=America/New_York:' + icsLocal(o.endAt),
        'SUMMARY:' + R.icsEscape((o.cancelled ? 'Cancelled: ' : '') + s.title),
        'LOCATION:' + R.icsEscape(ctx.location || ''),
        'DESCRIPTION:' + R.icsEscape(desc.join(' ')));
      if (o.cancelled) lines.push('STATUS:CANCELLED');
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.map(R.icsFold).join('\r\n') + '\r\n';
  };
  R.icsName = function (occ) { return occ ? 'mulligan-' + occ.series.id + '-' + occ.date + '.ics' : 'mulligan-events.ics'; };

  /* ---------- occurrence key ---------- */
  // "fnm-draft@2026-10-30" or "startrek-prerelease@2026-11-08T1500" -> { series, date, start }
  R.parseKey = function (key) {
    var m = /^(.+)@(\d{4}-\d\d-\d\d)(?:T(\d\d)(\d\d))?$/.exec(String(key || ''));
    return m ? { series: m[1], date: m[2], start: m[3] ? m[3] + ':' + m[4] : null } : null;
  };
})();
