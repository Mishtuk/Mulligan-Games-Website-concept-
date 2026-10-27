/* Mulligan Games concept: sample data.
 *
 * One global, window.MG_SAMPLE, shaped like the data model in DECISIONS.md D7 so the
 * Phase 2 build can seed from it. Plain data plus one small helper that fills
 * registrations; no rendering here.
 *
 * Sources (all checked 2026-10-26):
 *   fb  = docs/research/mulligan-facebook.md (weekly schedule, one-offs, caps, prizes, preorders)
 *   pub = docs/research/mulligan-public.md   (hours, Wizards fees and caps, TopDeck cEDH counts)
 * Anything marked "guess" or "sample" is made up to show a state and must be confirmed
 * by the owners (see OWNER-QUESTIONS.md) before anything is public. Names of people are fake.
 */
(function () {
  'use strict';

  /* ---------- Store (D7 Store) ---------- */
  var store = {
    name: 'Mulligan Games',
    tagline: 'A local card and gaming shop in Warminster. Stop in and stay for a game.', // fb bio
    address: { street: '445 York Rd', city: 'Warminster', region: 'PA', zip: '18974' }, // fb: 445 settled
    phone: '(215) 789-3299',
    phoneHref: 'tel:+12157893299',
    email: null, // pub: mulligangames455@gmail.com unverified (Q3)
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Mulligan+Games+445+York+Rd+Warminster+PA+18974',
    parking: 'Park in any lot next to the shop except the RISE lot.', // pub, TopDeck venue note
    freePlay: 'Free play all day, every day we’re open.', // fb weekly flyer
    kids: 'Kids are welcome. Learn to Play Pokemon on Wednesdays is a good first night.', // fb staff reply
    // Weekly hours, 0 = Sunday. close "24:00" = midnight. pub (Apple Maps + KeepUpCards) agree; owner to confirm (Q2).
    hours: [
      { day: 0, open: '13:00', close: '22:00' },
      { day: 1, closed: true },
      { day: 2, closed: true },
      { day: 3, open: '14:00', close: '22:00' },
      { day: 4, open: '14:00', close: '22:00' },
      { day: 5, open: '14:00', close: '24:00' },
      { day: 6, open: '14:00', close: '24:00' }
    ],
    hoursConfirmed: false,
    // Date overrides (D7). Nov 1 is a guess: the 1st-Sunday cEDH starts at 10 AM (fb) but Sunday opens at 1 PM (pub).
    hourOverrides: [
      { date: '2026-11-01', open: '10:00', close: '22:00', note: 'Opens at 10 AM for the cEDH Championship Series.', confirmed: false }
    ],
    links: {
      discord: { url: 'https://discord.gg/YJAW4aTwaZ', confirmed: false }, // two invites found (Q3)
      topdeck: 'https://topdeck.gg/mulligangames',
      topdeckCircuit: 'https://topdeck.gg/circuit/mulligans',
      wizards: 'https://locator.wizards.com/store/15986',
      facebook: 'https://www.facebook.com/profile.php?id=100085975454414',
      instagram: 'https://www.instagram.com/mulligangames',
      tiktok: 'https://www.tiktok.com/@mulligangames',
      x: 'https://x.com/MulliganGames',
      patreon: 'https://www.patreon.com/MulliganGames'
    },
    // Q23: five-star Google reviews only, verbatim excerpts, first name + last initial (docs/research/tcgplayer-topdeck.md, 2026-10-27)
    reviews: {
      rating: '4.9', count: 81, source: 'Google',
      url: 'https://www.google.com/maps/search/?api=1&query=Mulligan+Games+445+York+Rd+Warminster+PA+18974',
      items: [
        { text: 'Incredible singles collection, great sealed selection, friendly and knowledgeable staff', name: 'Jarrett L.', age: 'a year ago' },
        { text: 'I like the generous space they offer fellow players to just come in and join a game', name: 'Eric K.', age: '4 months ago' },
        { text: 'the best TCG store in the greater Philadelphia metropolitan area.', name: 'Tyler A.', age: '5 months ago' }
      ]
    },
    tcgplayer: { url: 'https://www.tcgplayer.com/sellers/Mulligan-Gaming-LLC/0062555a', line: 'Shop Pokemon Japan and Magic cards online on TCGplayer', positive: '100% positive' }
  };

  /* ---------- cEDH circuit turnout (TopDeck circuit page, "registered"; the last rows are what the front page shows) ---------- */
  var circuit = {
    url: 'https://topdeck.gg/circuit/mulligans',
    events: [
      { date: '2026-06-07', title: 'Championship Series', players: 40 }, { date: '2026-07-05', title: 'Championship Series', players: 59 },
      { date: '2026-08-02', title: 'Championship Series', players: 42 }, { date: '2026-08-08', title: '5K', players: 77 },
      { date: '2026-08-09', title: 'Redemption', players: 12 }, { date: '2026-09-06', title: 'Championship Series', players: 69 },
      { date: '2026-10-04', title: 'Championship Series', players: 69 }
    ]
  };

  /* ---------- Games (D7 Game, D14 chips). Fixed list in code; admin toggles "shown". ---------- */
  // family: the Magic chip also shows cEDH. color = token name in css/tokens.css (--g-<id>).
  var games = [
    { id: 'magic',     name: 'Magic: The Gathering', short: 'Magic',     icon: 'magic',     shown: true,
      formats: ['Commander', 'Draft', 'Standard', 'Pauper', 'Pre-Modern', 'Modern', 'Sealed', 'Prerelease', 'RCQ', 'Learn to play'] },
    { id: 'cedh',      name: 'cEDH (competitive Commander)', short: 'cEDH', icon: 'cedh', family: 'magic', shown: true,
      formats: ['Championship Series', '5K', 'Redemption', 'Invitational', 'Weekly'] },
    { id: 'pokemon',   name: 'Pokemon TCG',          short: 'Pokemon',   icon: 'pokemon',   shown: true,
      formats: ['League night', 'League Cup', 'League Challenge', 'Prerelease', 'Learn to play'] },
    { id: 'onepiece',  name: 'One Piece Card Game',  short: 'One Piece', icon: 'onepiece',  shown: true,
      formats: ['Store tournament', 'Treasure Cup', 'Learn to play'] },
    { id: 'riftbound', name: 'Riftbound',            short: 'Riftbound', icon: 'riftbound', shown: true,
      formats: ['Nexus Nights', 'Summoner Skirmish', 'Prerelease'] },
    { id: 'hololive',  name: 'Hololive OCG',         short: 'Hololive',  icon: 'hololive',  shown: true,
      formats: ['Weekly', 'Bloom Cup'] },
    { id: 'warhammer', name: 'Warhammer and tabletop', short: 'Warhammer', icon: 'warhammer', shown: true,
      formats: ['Open tables', '40k', 'Age of Sigmar', 'Kill Team', 'Painting'] },
    { id: 'other',     name: 'D&D, trade nights and more', short: 'Other', icon: 'other', shown: true,
      formats: ['D&D', 'Trade night', 'Board games', 'Charity'] }
  ];

  /* ---------- Event series (D7). A one-off is a series with no recurrence. ----------
   * recurrence:
   *   { type: 'none', date }                       one-off
   *   { type: 'weekly', day }                      0 = Sunday
   *   { type: 'nth', nth, day }                    nth weekday of the month (1..5, -1 = last)
   *   { type: 'dates', dates: [{ date, start }] }  a short series (prerelease slots, RCQ dates)
   * signup: 'walkin' | 'here' | 'counter' | 'external'
   * fee: dollars, 0 = free. feeConfirmed false = guess.
   * tool: official tool the store reports to (D2). externalCount: "N registered" shown from TopDeck.
   */
  var series = [
    // Wednesday (fb weekly flyer; fees and caps from pub where the Wizards locator lists the same night)
    { id: 'tabletop-wed', title: 'Tabletop and Warhammer', game: 'warhammer', format: 'Open tables', kind: 'open',
      recurrence: { type: 'weekly', day: 3 }, start: '17:00', end: '22:00', fee: 0, signup: 'walkin',
      description: 'Bring your army or any tabletop game. Tables are first come, first served.', bring: 'Your army, dice and tape measure.' },
    { id: 'pauper', title: 'Pauper Night', game: 'magic', format: 'Pauper', kind: 'weekly',
      recurrence: { type: 'weekly', day: 3 }, start: '19:00', end: '22:00', fee: 10, capacity: 28, signup: 'here',
      cutoff: 'start', tool: { name: 'Wizards EventLink' }, prize: 'Prizes paid by record.', bring: 'A 60-card Pauper deck.' },
    { id: 'standard-showdown', title: 'Standard Showdown', game: 'magic', format: 'Standard', kind: 'weekly',
      recurrence: { type: 'weekly', day: 3 }, start: '19:00', end: '22:00', fee: 10, signup: 'walkin',
      tool: { name: 'Wizards EventLink' }, prize: 'Standard Showdown promo packs.', bring: 'A Standard deck.' },
    { id: 'dnd-wed', title: 'D&D Open Play', game: 'other', format: 'D&D', kind: 'open',
      recurrence: { type: 'weekly', day: 3 }, start: '19:00', end: '22:00', fee: 0, signup: 'walkin',
      description: 'Drop-in tables for new and returning players.' },
    { id: 'pokemon-l2p', title: 'Learn to Play Pokemon', game: 'pokemon', format: 'Learn to play', kind: 'learn',
      recurrence: { type: 'weekly', day: 3 }, start: '19:00', end: '21:00', fee: 0, signup: 'walkin', kidsWelcome: true,
      description: 'Staff teach the game with loaner decks.' },

    // Thursday
    { id: 'commander-thu', title: 'Commander Night', game: 'magic', format: 'Commander', kind: 'open',
      recurrence: { type: 'weekly', day: 4 }, start: '17:00', end: '22:00', fee: 0, signup: 'walkin',
      description: 'Casual pods. Tell the counter your power level and we will seat you.' },
    { id: 'hololive-thu', title: 'Hololive OCG', game: 'hololive', format: 'Weekly', kind: 'weekly',
      recurrence: { type: 'weekly', day: 4 }, start: '18:30', end: '21:30', fee: 5, feeConfirmed: false, signup: 'walkin',
      tool: { name: 'Bushiroad' } },
    { id: 'premodern', title: 'Pre-Modern', game: 'magic', format: 'Pre-Modern', kind: 'weekly',
      recurrence: { type: 'weekly', day: 4 }, start: '19:00', end: '22:00', fee: 10, signup: 'walkin',
      tool: { name: 'Wizards EventLink' }, bring: 'A Pre-Modern deck (sets from Fourth Edition to Scourge).' },
    { id: 'onepiece-thu', title: 'One Piece', game: 'onepiece', format: 'Store tournament', kind: 'weekly',
      recurrence: { type: 'weekly', day: 4 }, start: '19:00', end: '22:00', fee: 5, feeConfirmed: false, signup: 'walkin',
      tool: { name: 'Bandai TCG+' } },

    // Friday
    { id: 'fnm-draft', title: 'Draft FNM', game: 'magic', format: 'Draft, newest set', kind: 'weekly',
      recurrence: { type: 'weekly', day: 5 }, start: '19:00', end: '23:00', fee: 20, capacity: 28, signup: 'here',
      waitlist: true, cutoff: 'start', tool: { name: 'Wizards EventLink' },
      prize: 'Prize packs paid by record.', bring: 'Nothing. Packs are included.' },
    { id: 'nexus-nights', title: 'Nexus Nights', game: 'riftbound', format: 'Nexus Nights', kind: 'weekly',
      recurrence: { type: 'weekly', day: 5 }, start: '19:00', end: '22:00', fee: 5, feeConfirmed: false, signup: 'walkin',
      tool: { name: 'PlayRiftbound' } },

    // Saturday
    { id: 'sat-draft', title: 'Saturday Draft', game: 'magic', format: 'Draft, set changes weekly', kind: 'weekly',
      recurrence: { type: 'weekly', day: 6 }, start: '18:00', end: '22:30', fee: 20, capacity: 16, minPlayers: 8,
      signup: 'here', waitlist: true, cutoff: 'start', tool: { name: 'Wizards EventLink' },
      prize: 'Prize packs paid by record.', bring: 'Nothing. Packs are included.' },
    { id: 'pokemon-sat', title: 'Pokemon League Night', game: 'pokemon', format: 'League night', kind: 'weekly',
      recurrence: { type: 'weekly', day: 6 }, start: '18:30', end: '21:30', fee: 5, feeConfirmed: false, signup: 'walkin',
      kidsWelcome: true, tool: { name: 'Play! Pokemon' } },

    // Sunday: cEDH
    { id: 'cedh-weekly', title: 'cEDH Weekly', game: 'cedh', format: 'Weekly', kind: 'weekly',
      recurrence: { type: 'weekly', day: 0 }, start: '14:00', end: '20:00', fee: 10, feeConfirmed: false, signup: 'walkin',
      tool: { name: 'TopDeck', url: 'https://topdeck.gg/mulligangames' }, bring: 'A cEDH deck. Up to 10 proxies, judge-approved.' },
    { id: 'cedh-mcs', title: 'Championship Series', game: 'cedh', format: 'Championship Series', kind: 'cedh',
      cedhSeries: 'mcs', featured: true,
      recurrence: { type: 'nth', nth: 1, day: 0 }, start: '10:00', end: '20:00', fee: 60,
      signup: 'external', tool: { name: 'TopDeck', url: 'https://topdeck.gg/circuit/mulligans' }, // TopDeck, Nov 2026: $60, $10 deposit online
      externalCount: { '2026-11-01': 80 },
      prize: 'A guaranteed dual land every month. Each winner gets an invitational seat.',
      bring: 'A cEDH deck. Up to 10 proxies, judge-approved, with full rules text.' },

    // One-offs and short series (fb + pub)
    { id: 'chaos-draft-oct30', title: 'All Leylines’ Eve Chaos Draft', game: 'magic', format: 'Chaos draft', kind: 'special',
      recurrence: { type: 'none', date: '2026-10-30' }, start: '18:00', end: '22:00', fee: 20, capacity: 24, minPlayers: 8,
      signup: 'here', cutoff: 'start', tool: { name: 'Wizards EventLink' }, prize: 'Prize packs paid by record.' }, // pub (cap and min are guesses)
    { id: 'cedh-5k-nov7', title: '5K cEDH Tournament', game: 'cedh', format: '5K', kind: 'cedh', cedhSeries: '5k', featured: true,
      recurrence: { type: 'none', date: '2026-11-07' }, start: '10:00', end: '22:00', fee: 100,
      signup: 'external', tool: { name: 'TopDeck', url: 'https://topdeck.gg/mulligangames' },
      externalCount: { '2026-11-07': 120 } }, // pub + TopDeck render (120 registered). Fee: TopDeck, Nov 2026. Start time: a guess.
    { id: 'cedh-invitational', title: 'Championship Series Invitational', game: 'cedh', format: 'Invitational', kind: 'cedh',
      cedhSeries: 'invitational', featured: true,
      recurrence: { type: 'none', date: '2026-11-08' }, start: '11:00', end: '20:00', fee: 0, signup: 'external',
      inviteOnly: true, tool: { name: 'TopDeck', url: 'https://topdeck.gg/circuit/mulligans' },
      description: 'Every Championship Series winner plus the next players by circuit points.' },
    { id: 'cedh-redemption-nov8', title: 'Redemption', game: 'cedh', format: 'Redemption', kind: 'cedh', cedhSeries: 'redemption',
      recurrence: { type: 'none', date: '2026-11-08' }, start: '12:00', end: '20:00', fee: 35, // $25 if you played the 5K (TopDeck, Nov 2026)
      signup: 'external', tool: { name: 'TopDeck', url: 'https://topdeck.gg/mulligangames' }, externalCount: { '2026-11-08': 9 } },
    { id: 'startrek-prerelease', title: 'Star Trek Prerelease', game: 'magic', format: 'Prerelease', kind: 'prerelease', featured: true,
      recurrence: { type: 'dates', dates: [ { date: '2026-11-06', start: '19:00' }, { date: '2026-11-08', start: '15:00' }, { date: '2026-11-08', start: '17:00' } ] },
      end: null, fee: 50, signup: 'counter', tool: { name: 'Wizards EventLink' },
      bring: 'Nothing. Your prerelease kit is included.' },
    { id: 'rb-skirmish', title: 'Summoner Skirmish', game: 'riftbound', format: 'Summoner Skirmish', kind: 'special',
      recurrence: { type: 'nth', nth: 2, day: 6 }, start: '12:00', doors: '11:00', end: '18:00', fee: 10,
      signup: 'external', tool: { name: 'the store form', cta: 'Sign up online', url: 'https://tinyurl.com/RBMulliganGames' },
      prize: 'Paid by record. Winner gets a playmat and a bye; top 8 and participation promos.' },
    { id: 'standard-rcq', title: 'Standard RCQ', game: 'magic', format: 'RCQ', kind: 'special', featured: true,
      recurrence: { type: 'dates', dates: [ { date: '2026-11-15', start: '12:00' }, { date: '2026-11-22', start: '12:00' } ] },
      doors: '11:00', end: '20:00', fee: 20, capacity: 32, minPlayers: 8, signup: 'here', waitlist: true,
      tool: { name: 'Wizards EventLink' },
      prize: 'Prizing to the winners; store credit paid out by participation. 5 rounds Swiss, top 8.' }
  ];

  /* ---------- One-date exceptions (D7). ---------- */
  var exceptions = [
    // sample: shows how a cancelled night looks. Not a real cancellation.
    { series: 'pokemon-sat', date: '2026-10-31', type: 'cancel', note: 'No league on Halloween. Back next Saturday.', updated: '2026-10-24', sample: true },
    // sample: shows the "Updated" badge (fb takeaway 6: last-minute changes are common).
    { series: 'onepiece-thu', date: '2026-10-29', type: 'change', start: '19:30', note: 'Starts at 7:30 this week.', updated: '2026-10-25', sample: true }
  ];

  /* ---------- Registrations (D7). Fake names; counts chosen to show every card state. ---------- */
  var FIRST = ['Sam', 'Jordan', 'Alex', 'Riley', 'Casey', 'Morgan', 'Taylor', 'Jamie', 'Drew', 'Quinn', 'Avery', 'Parker',
    'Reese', 'Rowan', 'Skyler', 'Devon', 'Emerson', 'Hayden', 'Jesse', 'Kendall', 'Logan', 'Micah', 'Noel', 'Peyton',
    'Sage', 'Tatum', 'Blake', 'Cameron', 'Dakota', 'Elliot', 'Finley', 'Harper', 'Indy', 'Jules'];
  var LAST = 'ABCDEFGHJKLMNPRSTVW';
  var registrations = [];
  function fill(seriesId, date, count, opts) {
    opts = opts || {};
    var cap = opts.capacity || Infinity;
    for (var i = 0; i < count; i++) {
      var n = registrations.length;
      var name = FIRST[(n * 7 + i) % FIRST.length] + ' ' + LAST.charAt((n * 3 + i) % LAST.length) + '.';
      var waiting = i >= cap;
      registrations.push({
        id: 'r' + (n + 1), series: seriesId, date: date, start: opts.start || null, name: name,
        contact: i % 3 === 0 ? '(215) 555-01' + String(10 + (n % 90)) : name.split(' ')[0].toLowerCase() + n + '@example.com',
        playerId: opts.playerIds && i % 2 === 0 ? String(9000000 + n * 137) : null,
        status: waiting ? 'waitlist' : 'in',
        waitlistPos: waiting ? i - cap + 1 : null,
        checkedIn: !!opts.checkedIn && !waiting && i < opts.checkedIn,
        payment: !!opts.checkedIn && !waiting && i < opts.checkedIn ? (i % 5 === 4 ? 'credit' : 'door') : 'unpaid',
        createdAt: '2026-10-2' + (i % 6) + 'T1' + (i % 9) + ':0' + (i % 6) + ':00'
      });
    }
  }
  fill('pauper', '2026-10-28', 11, { capacity: 28 });              // Open
  fill('fnm-draft', '2026-10-30', 31, { capacity: 28, playerIds: true }); // Full + 3 on the waitlist
  fill('chaos-draft-oct30', '2026-10-30', 5, { capacity: 24 });     // Needs 3 more to run
  fill('sat-draft', '2026-10-31', 13, { capacity: 16, playerIds: true }); // Few seats (3 left)
  fill('standard-rcq', '2026-11-15', 5, { capacity: 32, start: '12:00' }); // Needs players
  fill('fnm-draft', '2026-10-23', 26, { capacity: 28, checkedIn: 24 }); // last week, for the roster and results
  // one cancelled sign-up, to show the cancelled row in the roster
  registrations.push({ id: 'r' + (registrations.length + 1), series: 'pauper', date: '2026-10-28', name: 'Harper N.',
    contact: 'harper@example.com', playerId: null, status: 'cancelled', waitlistPos: null, checkedIn: false,
    payment: 'unpaid', createdAt: '2026-10-22T18:10:00' });

  /* ---------- Results (D7). Real ones from fb; public: true shows on the site. ---------- */
  var results = [
    { series: 'cedh-mcs', date: '2026-10-04', headcount: 69, winner: null, prizes: 'Volcanic Island to the winner.', reported: true, public: true },
    { series: 'reality-fracture-prerelease', title: 'Reality Fracture Prerelease', game: 'magic', date: '2026-09-27', headcount: 52, public: true, reported: true },
    { series: 'anniversary', title: '4-year anniversary weekend', game: 'other', date: '2026-10-18', headcount: null, public: true,
      prizes: 'Food drive for the Warminster Food Bank, 19 raffle prizes.', reported: true },
    { series: 'fnm-draft', date: '2026-10-23', headcount: 24, winner: 'Sam B.', top: ['Sam B.', 'Riley K.', 'Quinn D.', 'Drew T.'],
      prizes: '24 prize packs', reported: false, public: false } // sample: unreported, for the admin reminder
  ];

  /* ---------- Releases: coming soon / preorder tiles (fb takeaway 7, D14). ---------- */
  var releases = [
    { id: 'startrek', game: 'magic', name: 'Star Trek', status: 'preorder', preorderEnds: '2026-11-01',
      note: '', event: 'startrek-prerelease' },
    { id: 'delta-reign', game: 'pokemon', name: 'Mega Evolution: Delta Reign', status: 'preorder', preorderEnds: '2026-11-01',
      note: 'The prerelease ran Oct 24.' },
    { id: 'radiance', game: 'riftbound', name: 'Riftbound: Radiance', status: 'out', note: 'On the shelf now.', event: 'rb-skirmish' },
    { id: 'op12', game: 'onepiece', name: 'One Piece set 12', status: 'soon', note: 'Ask at the counter for the release date.' },
    { id: 'gundam', game: 'other', name: 'Gundam Card Game nights', status: 'soon',
      note: 'You asked, we listened: a Gundam night is coming in the next few months.' } // fb comment reply
  ];

  /* ---------- Inventory (D7 Product + Stock move, D8 scope). onHand is the cached sum of moves. ---------- */
  var products = [
    { id: 'p1', name: 'Star Trek Play Booster Box', category: 'sealed', game: 'magic', onHand: 6, low: 4, price: null },
    { id: 'p2', name: 'Star Trek Prerelease Pack', category: 'sealed', game: 'magic', onHand: 30, low: 20, price: null },
    { id: 'p3', name: 'Draft boosters, current set', category: 'sealed', game: 'magic', onHand: 54, low: 36, price: null },
    { id: 'p4', name: 'Prize packs', category: 'sealed', game: 'magic', onHand: 40, low: 24, price: null },
    { id: 'p5', name: 'Delta Reign Elite Trainer Box', category: 'sealed', game: 'pokemon', onHand: 8, low: 4, price: null },
    { id: 'p6', name: 'Delta Reign booster pack', category: 'sealed', game: 'pokemon', onHand: 120, low: 36, price: null },
    { id: 'p7', name: 'Riftbound Radiance booster display', category: 'sealed', game: 'riftbound', onHand: 3, low: 2, price: null },
    { id: 'p8', name: 'One Piece OP-12 booster box', category: 'sealed', game: 'onepiece', onHand: 0, low: 2, price: null },
    { id: 'p9', name: 'Hololive OCG starter deck', category: 'sealed', game: 'hololive', onHand: 5, low: 3, price: null },
    { id: 'p10', name: 'Matte sleeves, black (100)', category: 'accessory', game: null, onHand: 14, low: 10, price: null },
    { id: 'p11', name: 'Playmat, store design', category: 'accessory', game: null, onHand: 6, low: 4, price: null },
    { id: 'p12', name: 'Contrast paints (assorted)', category: 'paint', game: 'warhammer', onHand: 42, low: 30, price: null },
    { id: 'p13', name: 'Combat Patrol box', category: 'miniature', game: 'warhammer', onHand: 2, low: 2, price: null },
    { id: 'p14', name: 'Kill Team starter set', category: 'miniature', game: 'warhammer', onHand: 1, low: 1, price: null },
    { id: 'p15', name: 'Magic singles (binder lots)', category: 'singles', game: 'magic', onHand: 1, low: 0, price: null, lot: true }
  ];
  var stockMoves = [
    { product: 'p3', qty: 72, reason: 'received', at: '2026-10-20T15:00:00', who: 'Owner' },
    { product: 'p3', qty: -18, reason: 'event', event: 'fnm-draft', date: '2026-10-23', at: '2026-10-23T19:05:00', who: 'Staff' },
    { product: 'p4', qty: -24, reason: 'prize', event: 'fnm-draft', date: '2026-10-23', at: '2026-10-23T23:10:00', who: 'Staff' },
    { product: 'p13', qty: -1, reason: 'sold', at: '2026-10-24T16:30:00', who: 'Staff' }
  ];
  // What an event uses (D7). perSeat x capacity (or x sign-ups when there is no cap) is reserved for upcoming dates.
  var eventProductUse = [
    { series: 'fnm-draft', product: 'p3', perSeat: 3 },
    { series: 'fnm-draft', product: 'p4', fixed: 10 },
    { series: 'sat-draft', product: 'p3', perSeat: 3 },
    { series: 'pauper', product: 'p4', fixed: 6 },
    { series: 'chaos-draft-oct30', product: 'p3', perSeat: 3 },
    { series: 'startrek-prerelease', product: 'p2', perSeat: 1, seatsPerDate: 20 }
  ];

  /* ---------- Preorders (D7). Fake customers. ---------- */
  var preorders = [
    { id: 'o1', product: 'p1', customer: 'Jordan K.', contact: '(215) 555-0142', qty: 1, deposit: 50, status: 'waiting', createdAt: '2026-10-08' },
    { id: 'o2', product: 'p1', customer: 'Riley M.', contact: 'riley@example.com', qty: 2, deposit: 100, status: 'waiting', createdAt: '2026-10-09' },
    { id: 'o3', product: 'p5', customer: 'Casey T.', contact: '(215) 555-0187', qty: 1, deposit: 20, status: 'arrived', createdAt: '2026-10-05' },
    { id: 'o4', product: 'p5', customer: 'Avery P.', contact: 'avery@example.com', qty: 2, deposit: 0, status: 'arrived', createdAt: '2026-10-06' },
    { id: 'o5', product: 'p8', customer: 'Devon S.', contact: '(267) 555-0119', qty: 1, deposit: 40, status: 'waiting', createdAt: '2026-10-12' },
    { id: 'o6', product: 'p7', customer: 'Micah R.', contact: 'micah@example.com', qty: 1, deposit: 30, status: 'picked', createdAt: '2026-10-01' },
    { id: 'o7', product: 'p5', customer: 'Noel W.', contact: '(215) 555-0170', qty: 1, deposit: 20, status: 'cancelled', createdAt: '2026-10-03' }
  ];

  window.MG_SAMPLE = {
    version: 1,
    // Demo clock: the page uses ?now=YYYY-MM-DDTHH:MM if given, the real clock only with ?now=real (and only if it falls in `window`),
    // else demoNow (Friday 6:50 PM, the busy moment). Keeps the concept meaningful after these dates pass.
    window: { from: '2026-10-19', to: '2026-11-29' },
    demoNow: '2026-10-30T18:50',
    demoMoments: [
      { label: 'Wednesday 4 PM', now: '2026-10-28T16:00' },
      { label: 'Friday 6:50 PM', now: '2026-10-30T18:50' },
      { label: 'Friday 7:30 PM', now: '2026-10-30T19:30' },
      { label: 'Monday (closed)', now: '2026-10-26T12:00' },
      { label: 'Saturday 11:30 PM', now: '2026-10-31T23:30' }
    ],
    store: store,
    // Round 6 (D47): the store's own social videos, in display order. Cards link to the post; the official player loads only after a click.
    clips: [
      { platform: 'tiktok', id: '7456651666096704814', url: 'https://www.tiktok.com/@mulligangames/video/7456651666096704814', caption: 'A full room for the monthly cEDH', credit: '', date: '2025-01-09', poster: 'media/social/tt-7456651666096704814.webp', pw: 240, ph: 427, pos: '50% 50%' },
      { platform: 'tiktok', id: '7554825277990259981', url: 'https://www.tiktok.com/@mulligangames/video/7554825277990259981', caption: 'A PSA 10 Japanese Mewtwo EX, in the case', credit: '', date: '2025-09-27', poster: 'media/social/tt-7554825277990259981.webp', pw: 240, ph: 427, pos: '50% 50%' },
      { platform: 'instagram', id: 'DTHcsxqjNDL', url: 'https://www.instagram.com/reel/DTHcsxqjNDL/', caption: 'Winning a Mulligan cEDH tournament', credit: 'by @perky_grn_fairy', date: '2026-01-10', poster: 'media/social/ig-DTHcsxqjNDL.webp', pw: 240, ph: 427, pos: '50% 50%' },
      { platform: 'tiktok', id: '7561535591314115895', url: 'https://www.tiktok.com/@mulligangames/video/7561535591314115895', caption: 'A sealed base set Charizard hanger', credit: '', date: '2025-10-15', poster: 'media/social/tt-7561535591314115895.webp', pw: 240, ph: 427, pos: '50% 50%' },
      { platform: 'tiktok', id: '7467024512442289451', url: 'https://www.tiktok.com/@mulligangames/video/7467024512442289451', caption: 'February’s cEDH night and its prizes', credit: '', date: '2025-02-03', poster: 'media/social/tt-7467024512442289451.webp', pw: 240, ph: 427, pos: '50% 50%' },
      { platform: 'tiktok', id: '7671778087264144653', url: 'https://www.tiktok.com/@mulligangames/video/7671778087264144653', caption: 'Only at Mulligan Games: a Pokemon find', credit: '', date: '2026-08-08', poster: 'img/social/shop-floor-cases-800.webp', pw: 800, ph: 600, pos: '62% 50%' },
      { platform: 'tiktok', id: '7689650786942323998', url: 'https://www.tiktok.com/@mulligangames/video/7689650786942323998', caption: 'Pop 1 graded Pokemon cards', credit: '', date: '2026-09-26', poster: 'img/social/pokemon-sealed-shelf-800.webp', pw: 800, ph: 600, pos: '35% 50%' },
      { platform: 'instagram', id: 'DPcDJ7riL3B', url: 'https://www.instagram.com/reel/DPcDJ7riL3B/', caption: 'Custom Commander art and a PSA 10', credit: 'art by @perky_grn_fairy', date: '2025-10-10', poster: 'img/social/event-cedh-tables-800.webp', pw: 800, ph: 600, pos: '55% 60%' },
      { platform: 'tiktok', id: '7459197351555681582', url: 'https://www.tiktok.com/@mulligangames/video/7459197351555681582', caption: 'Make it or break it, episode 30', credit: '', date: '2025-01-13', poster: 'img/social/singles-case-lit-800.webp', pw: 800, ph: 600, pos: '50% 50%' }
    ],
    circuit: circuit,
    games: games,
    series: series,
    exceptions: exceptions,
    registrations: registrations,
    results: results,
    releases: releases,
    products: products,
    stockMoves: stockMoves,
    eventProductUse: eventProductUse,
    preorders: preorders
  };
})();
