// One store photo per event, picked from this constant map by game / format (round 6, D47; never from data, D20).
// Used by the front page (photo bands, row thumbs, strip caps) and the event page. Each file has a -800 copy in public/img/social.
// A list is tried in order; a photo already used that day is skipped while the list lasts.
const A = {
  'event-magic-night': 'Players at Magic tables in the Mulligan Games play room',
  'event-full-room-2': 'The play room full of players at their tables',
  'play-room-night': 'The play room at night, tables set for a game',
  'event-cedh-tables': 'Commander games under way at the tables in the play room',
  'event-full-room-3': 'Players seated across the long tables on an event night',
  'champion-belt': 'The championship belt on display at Mulligan Games',
  'pokemon-sealed-shelf': 'A shelf of sealed Pokemon product in the shop',
  'event-packed-room': 'A packed play room on a game night',
  'event-tables-fb': 'Rows of tables with players mid-game',
  'warhammer-table': 'A Warhammer battle set up on a table with terrain',
  'warhammer-battle': 'Painted Warhammer armies facing each other across the table',
  'painted-marines': 'A row of painted space marine miniatures',
  'dnd-table': 'A group around a table playing a tabletop role-playing game',
  'dnd-one-shot-setup': 'A role-playing game set up on a table, dice and maps ready',
  'event-full-room': 'The play room full of players on an event night',
};
const L = (...xs) => xs.map(([file, pos = '50% 50%']) => ({ file, pos, alt: A[file] }));
const PH = {
  magic: L(['event-magic-night', '50% 60%'], ['event-full-room-2', '50% 55%'], ['play-room-night', '50% 55%']),
  cedh: L(['event-cedh-tables', '50% 60%'], ['event-full-room-3']),
  cedhFeat: L(['champion-belt', '50% 42%']),
  pokemon: L(['pokemon-sealed-shelf']),
  riftbound: L(['event-packed-room', '50% 55%'], ['event-tables-fb', '50% 60%']),
  warhammer: L(['warhammer-table', '50% 65%'], ['warhammer-battle']),
  painting: L(['painted-marines', '50% 45%']),
  dnd: L(['dnd-table', '50% 45%'], ['dnd-one-shot-setup']),
  other: L(['event-full-room', '50% 55%']),
  onepiece: L(['event-full-room-2', '50% 55%']),
  hololive: L(['play-room-night', '50% 55%']),
};

/** The photo for one event: { file, pos, alt, tint }. `used` (optional, updated) holds the names already shown, so a list does not repeat while it lasts.
 *  A tinted stand-in (One Piece, Hololive, unknown games: the play room in the game colour) is tracked apart from plain photos. */
export function photoFor(o, used = {}) {
  if (o.photo) { const file = o.photo.replace(/\.webp$/, ''); used[file] = true; return { file, pos: '50% 50%', alt: o.photoAlt || '', tint: false, up: file.startsWith('photo-') }; } // chosen in the admin (events.js validates the name)
  const g = o.game;
  let list, tint = false;
  if (g === 'cedh') list = [...(o.featured ? PH.cedhFeat : []), ...PH.cedh];
  else if (g === 'warhammer' && o.format === 'Painting') list = PH.painting;
  else if (g === 'other') list = o.format === 'D&D' ? PH.dnd : PH.other;
  else if (g === 'onepiece' || g === 'hololive') { list = PH[g]; tint = true; }
  else if (['magic', 'pokemon', 'riftbound', 'warhammer'].includes(g)) list = PH[g];
  else { list = PH.other; tint = true; }
  const sfx = tint ? ':tint' : '';
  const pick = list.find((p) => !used[p.file + sfx]) ?? list[0];
  used[pick.file + sfx] = true;
  return { ...pick, tint };
}
/** Photos for one day's events in time order, no repeat while the lists last: Map(key -> photo). `used` may be shared between days. */
export function photosForDay(occs, key, used = {}) {
  const out = new Map();
  for (const o of occs) if (o.photo) used[o.photo.replace(/\.webp$/, '')] = true; // a chosen photo is not handed to another event that day
  for (const o of [...occs].sort((a, b) => (a.start || '').localeCompare(b.start || '') || String(a.title).localeCompare(String(b.title)))) out.set(key(o), photoFor(o, used));
  return out;
}
/** Folder of a photo's files: the site's own pictures, or an admin upload. */
export const photoDir = (p) => (p.up ? '/media/photos/' : '/img/social/');
/** Position must look like "50% 60%", anything else falls back (it goes into a style attribute). */
export const photoPos = (p) => (/^\d{1,3}% \d{1,3}%$/.test(p.pos || '') ? p.pos : '50% 50%');
