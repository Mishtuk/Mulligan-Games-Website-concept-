/* Mulligan Games concept: event templates and small extras for the admin prototype (DESIGN.md 9.3).
 *
 * A template fills the event form: pick a game and a kind of night, and fee, seats, times, tool link and stock use
 * are already there. The fields are flat form fields (see MG.rules.formFromTemplate). Staff-saved templates are
 * added at run time ("Yours" tag). Fees and seats follow data/sample.js; guesses are the same guesses.
 * Product ids are the ones in data/sample.js: p2 prerelease pack, p3 draft boosters, p4 prize packs, p6 Pokemon packs.
 */
window.MG_EXTRA = {
  // which product belongs to which "coming soon / preorder" release (for the preorder deadline in the admin)
  productRelease: { p1: 'startrek', p2: 'startrek', p5: 'delta-reign', p6: 'delta-reign', p7: 'radiance', p8: 'op12' },

  templates: [
    /* ---- Magic ---- */
    { id: 't-draft', game: 'magic', name: 'Draft night', fields: {
      title: 'Draft Night', game: 'magic', format: 'Draft', kind: 'weekly', repeat: 'weekly', weekday: 5, start: '19:00', end: '23:00', fee: 20, capacity: 28,
      signup: 'here', waitlist: true, tool: 'Wizards EventLink', prize: 'Prize packs paid by record.', bring: 'Nothing. Packs are included.',
      uses: [{ product: 'p3', perSeat: 3 }, { product: 'p4', fixed: 10 }] } },
    { id: 't-commander', game: 'magic', name: 'Commander night', fields: {
      title: 'Commander Night', game: 'magic', format: 'Commander', kind: 'open', repeat: 'weekly', weekday: 4, start: '17:00', end: '22:00', fee: 0, signup: 'walkin',
      description: 'Casual pods. Tell the counter your power level and we will seat you.' } },
    { id: 't-pauper', game: 'magic', name: 'Pauper', fields: {
      title: 'Pauper Night', game: 'magic', format: 'Pauper', kind: 'weekly', repeat: 'weekly', weekday: 3, start: '19:00', end: '22:00', fee: 10, capacity: 28,
      signup: 'here', waitlist: true, tool: 'Wizards EventLink', prize: 'Prizes paid by record.', bring: 'A 60-card Pauper deck.',
      uses: [{ product: 'p4', fixed: 6 }] } },
    { id: 't-standard', game: 'magic', name: 'Standard Showdown', fields: {
      title: 'Standard Showdown', game: 'magic', format: 'Standard', kind: 'weekly', repeat: 'weekly', weekday: 3, start: '19:00', end: '22:00', fee: 10, signup: 'walkin',
      tool: 'Wizards EventLink', prize: 'Standard Showdown promo packs.', bring: 'A Standard deck.' } },
    { id: 't-premodern', game: 'magic', name: 'Pre-Modern', fields: {
      title: 'Pre-Modern', game: 'magic', format: 'Pre-Modern', kind: 'weekly', repeat: 'weekly', weekday: 4, start: '19:00', end: '22:00', fee: 10, signup: 'walkin',
      tool: 'Wizards EventLink', bring: 'A Pre-Modern deck (sets from Fourth Edition to Scourge).' } },
    { id: 't-prerelease', game: 'magic', name: 'Prerelease', fields: {
      title: 'Prerelease', game: 'magic', format: 'Prerelease', kind: 'prerelease', repeat: 'dates', start: '19:00', fee: 50, signup: 'counter',
      tool: 'Wizards EventLink', bring: 'Nothing. Your prerelease kit is included.', featured: true,
      dates: [{ date: '', start: '19:00' }, { date: '', start: '15:00' }, { date: '', start: '17:00' }],
      uses: [{ product: 'p2', perSeat: 1, seatsPerDate: 20 }] } },
    { id: 't-rcq', game: 'magic', name: 'RCQ', fields: {
      title: 'Standard RCQ', game: 'magic', format: 'RCQ', kind: 'special', repeat: 'none', start: '12:00', doors: '11:00', end: '20:00', fee: 20, capacity: 32,
      minPlayers: 8, signup: 'here', waitlist: true, tool: 'Wizards EventLink', featured: true,
      prize: 'Prizing to the winners. 5 rounds Swiss, top 8.' } },
    { id: 't-magic-l2p', game: 'magic', name: 'Learn to play', fields: {
      title: 'Learn to Play Magic', game: 'magic', format: 'Learn to play', kind: 'learn', repeat: 'weekly', weekday: 3, start: '18:00', end: '20:00', fee: 0, signup: 'walkin',
      kids: true, description: 'Staff teach the game with loaner decks.' } },

    /* ---- cEDH ---- */
    { id: 't-mcs', game: 'cedh', name: 'Championship Series', fields: {
      title: 'Championship Series', game: 'cedh', format: 'Championship Series', kind: 'cedh', repeat: 'monthly', nth: 1, weekday: 0, start: '10:00', end: '20:00', fee: 40,
      signup: 'external', tool: 'TopDeck', toolUrl: 'https://topdeck.gg/circuit/mulligans', cedhSeries: 'mcs', featured: true,
      prize: 'A guaranteed dual land every month. Each winner gets an invitational seat.', bring: 'A cEDH deck. Up to 10 proxies, judge-approved, with full rules text.' } },
    { id: 't-5k', game: 'cedh', name: '5K', fields: {
      title: '5K cEDH Tournament', game: 'cedh', format: '5K', kind: 'cedh', repeat: 'none', start: '10:00', end: '22:00', fee: 60, signup: 'external',
      tool: 'TopDeck', toolUrl: 'https://topdeck.gg/mulligangames', cedhSeries: '5k', featured: true } },
    { id: 't-redemption', game: 'cedh', name: 'Redemption', fields: {
      title: 'Redemption', game: 'cedh', format: 'Redemption', kind: 'cedh', repeat: 'none', start: '12:00', end: '20:00', fee: 20, signup: 'external',
      tool: 'TopDeck', toolUrl: 'https://topdeck.gg/mulligangames', cedhSeries: 'redemption' } },
    { id: 't-cedh-weekly', game: 'cedh', name: 'Weekly', fields: {
      title: 'cEDH Weekly', game: 'cedh', format: 'Weekly', kind: 'weekly', repeat: 'weekly', weekday: 0, start: '14:00', end: '20:00', fee: 10, signup: 'walkin',
      tool: 'TopDeck', toolUrl: 'https://topdeck.gg/mulligangames', bring: 'A cEDH deck. Up to 10 proxies, judge-approved.' } },

    /* ---- Pokemon ---- */
    { id: 't-pk-league', game: 'pokemon', name: 'League night', fields: {
      title: 'Pokemon League Night', game: 'pokemon', format: 'League night', kind: 'weekly', repeat: 'weekly', weekday: 6, start: '18:30', end: '21:30', fee: 5, signup: 'walkin',
      kids: true, tool: 'Play! Pokemon' } },
    { id: 't-pk-cup', game: 'pokemon', name: 'League Cup', fields: {
      title: 'Pokemon League Cup', game: 'pokemon', format: 'League Cup', kind: 'special', repeat: 'none', start: '12:00', end: '19:00', fee: 15, capacity: 32,
      signup: 'here', waitlist: true, tool: 'Play! Pokemon', bring: 'A 60-card deck.' } },
    { id: 't-pk-challenge', game: 'pokemon', name: 'League Challenge', fields: {
      title: 'Pokemon League Challenge', game: 'pokemon', format: 'League Challenge', kind: 'special', repeat: 'none', start: '12:00', end: '18:00', fee: 10, capacity: 24,
      signup: 'here', waitlist: true, tool: 'Play! Pokemon', bring: 'A 60-card deck.' } },
    { id: 't-pk-prerelease', game: 'pokemon', name: 'Prerelease', fields: {
      title: 'Pokemon Prerelease', game: 'pokemon', format: 'Prerelease', kind: 'prerelease', repeat: 'dates', start: '12:00', fee: 30, signup: 'counter', tool: 'Play! Pokemon',
      dates: [{ date: '', start: '12:00' }, { date: '', start: '15:00' }], uses: [{ product: 'p6', perSeat: 6, seatsPerDate: 16 }] } },
    { id: 't-pk-l2p', game: 'pokemon', name: 'Learn to play', fields: {
      title: 'Learn to Play Pokemon', game: 'pokemon', format: 'Learn to play', kind: 'learn', repeat: 'weekly', weekday: 3, start: '19:00', end: '21:00', fee: 0, signup: 'walkin',
      kids: true, description: 'Staff teach the game with loaner decks. Kids welcome.' } },

    /* ---- One Piece ---- */
    { id: 't-op-store', game: 'onepiece', name: 'Store tournament', fields: {
      title: 'One Piece', game: 'onepiece', format: 'Store tournament', kind: 'weekly', repeat: 'weekly', weekday: 4, start: '19:00', end: '22:00', fee: 5, signup: 'walkin', tool: 'Bandai TCG+' } },
    { id: 't-op-l2p', game: 'onepiece', name: 'Learn to play', fields: {
      title: 'Learn to Play One Piece', game: 'onepiece', format: 'Learn to play', kind: 'learn', repeat: 'none', start: '18:00', end: '20:00', fee: 0, signup: 'walkin', kids: true } },

    /* ---- Riftbound ---- */
    { id: 't-rb-nexus', game: 'riftbound', name: 'Nexus Nights', fields: {
      title: 'Nexus Nights', game: 'riftbound', format: 'Nexus Nights', kind: 'weekly', repeat: 'weekly', weekday: 5, start: '19:00', end: '22:00', fee: 5, signup: 'walkin', tool: 'PlayRiftbound' } },
    { id: 't-rb-skirmish', game: 'riftbound', name: 'Summoner Skirmish', fields: {
      title: 'Summoner Skirmish', game: 'riftbound', format: 'Summoner Skirmish', kind: 'special', repeat: 'monthly', nth: 2, weekday: 6, start: '12:00', doors: '11:00', end: '18:00', fee: 10,
      signup: 'external', tool: 'PlayRiftbound', cta: 'Sign up online', prize: 'Paid by record. Winner gets a playmat and a bye; top 8 and participation promos.' } },
    { id: 't-rb-prerelease', game: 'riftbound', name: 'Prerelease', fields: {
      title: 'Riftbound Prerelease', game: 'riftbound', format: 'Prerelease', kind: 'prerelease', repeat: 'dates', start: '12:00', fee: 30, signup: 'counter', tool: 'PlayRiftbound',
      dates: [{ date: '', start: '12:00' }, { date: '', start: '15:00' }] } },

    /* ---- Hololive ---- */
    { id: 't-hl-weekly', game: 'hololive', name: 'Weekly', fields: {
      title: 'Hololive OCG', game: 'hololive', format: 'Weekly', kind: 'weekly', repeat: 'weekly', weekday: 4, start: '18:30', end: '21:30', fee: 5, signup: 'walkin', tool: 'Other' } },

    /* ---- Warhammer and tabletop ---- */
    { id: 't-wh-open', game: 'warhammer', name: 'Open tables', fields: {
      title: 'Tabletop and Warhammer', game: 'warhammer', format: 'Open tables', kind: 'open', repeat: 'weekly', weekday: 3, start: '17:00', end: '22:00', fee: 0, signup: 'walkin',
      description: 'Bring your army or any tabletop game. Tables are first come, first served.', bring: 'Your army, dice and tape measure.' } },
    { id: 't-wh-40k', game: 'warhammer', name: '40k event', fields: {
      title: '40k Tournament', game: 'warhammer', format: '40k', kind: 'special', repeat: 'none', start: '10:00', end: '19:00', fee: 25, capacity: 16, minPlayers: 6,
      signup: 'here', waitlist: true, tool: 'Best Coast Pairings', whPoints: 2000, whRound: 150, whList: '',
      bring: 'A painted 2000-point army, your list, dice and tape measure.' } },
    { id: 't-wh-killteam', game: 'warhammer', name: 'Kill Team', fields: {
      title: 'Kill Team Night', game: 'warhammer', format: 'Kill Team', kind: 'weekly', repeat: 'weekly', weekday: 2, start: '18:00', end: '21:00', fee: 5, signup: 'walkin',
      tool: 'Best Coast Pairings', whPoints: 0, whRound: 75 } },
    { id: 't-wh-paint', game: 'warhammer', name: 'Painting lesson', fields: {
      title: 'Painting Lesson', game: 'warhammer', format: 'Painting', kind: 'learn', repeat: 'none', start: '14:00', end: '16:00', fee: 10, capacity: 8, signup: 'here',
      waitlist: true, bring: 'Nothing. Paints and brushes are on the table.', uses: [{ product: 'p12', perSeat: 1, seatsPerDate: 8 }] } },

    /* ---- Other ---- */
    { id: 't-dnd', game: 'other', name: 'D&D open play', fields: {
      title: 'D&D Open Play', game: 'other', format: 'D&D', kind: 'open', repeat: 'weekly', weekday: 3, start: '19:00', end: '22:00', fee: 0, signup: 'walkin',
      description: 'Drop-in tables for new and returning players.' } },
    { id: 't-trade', game: 'other', name: 'Trade night', fields: {
      title: 'Trade Night', game: 'other', format: 'Trade night', kind: 'open', repeat: 'none', start: '18:00', end: '21:00', fee: 0, signup: 'walkin' } },
    { id: 't-charity', game: 'other', name: 'Charity event', fields: {
      title: 'Charity Event', game: 'other', format: 'Charity', kind: 'special', repeat: 'none', start: '12:00', end: '20:00', fee: 0, signup: 'walkin',
      description: 'All welcome. Proceeds and donations go to the cause named on the flyer.' } }
  ]
};
