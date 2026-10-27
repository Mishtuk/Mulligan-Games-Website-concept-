# Mulligan Games: design spec

Owner: Laptop designer (P1.3 review: Desktop designer). Status: **look A rolled out to every prototype page (D28, 2026-10-27; sections 1, 2, 2.5)**; **P1.1 draft, reviewed against the P1.2 prototype in P1.3; signed off. Section 15 (P1.3b, D16 to D18) signed off by the boss, D22** (2026-10-26). Built from `BRIEF.md`, `DECISIONS.md` (D1 to D14),
`docs/research/*.md` (including `mulligan-facebook.md` and the "Rendered look" screenshot notes) and the Warminster VFW admin.
The front page prototype (`prototype/index.html`) is the reference build of this spec: when the two disagree, fix one
and note it here.

Contents: 1 Concept · 2 Tokens · 3 Type · 4 Layout system · 5 Components · 6 Front page (6.1 hero video slot) · 7 Events page and event detail ·
8 Sign-up · 9 Admin · 10 Loading, empty, error · 11 Accessibility · 12 VFW reuse and divergence · 13 Prototype files
and data · 14 What may change · 15 Boss-ranking additions (D16 to D18: event fields, post text, per-date page, New
here?, No-show)

---

## 1. Concept: look A, "Brick and sign" (D27, D28)

The site looks like the shop at 445 York Rd: a brick front with the store's own sign on it. The owners found the first
look (saturated flyer red and navy) too flashy and short on photos (D27); of three calmer looks, A was chosen for the
whole site (D28; review shots in `docs/review/looks/`, the roll-out in `docs/review/look-a/`). It is built from the
store's identity rather than a generic game-shop palette, so it reads as Mulligan:

1. **The brick wall and the sign plate.** Every public page opens with a header in brick (`--brick`) with a very faint
   coursing pattern, and the store's real logo on a white sign plate, like the sign on the building. Nothing else on
   the page is a coloured field.
2. **Calm surfaces, real photos.** Warm cream paper and near-white cards in light; warm charcoal in dark. The colour on
   the page comes from the store's own photos and video (the play room, the tables, the singles case, the storefront).
3. **One accent: the sign's blue.** `--act` (#2F5FB0, the blue of the sign) is the only accent: primary buttons and
   links that act. Game colours appear only as dots, thin rules and icons, never as fills. No saturated red anywhere.
4. **Event cards keep the trading-card anatomy** (name bar + cost pip, type line, text box, stat box) with a thin 3px
   game-colour rule on top instead of a tinted band. Day numbers sit in small brick diamonds (`--mark`).

Logo: the store's wordmark (`prototype/img/logo/logo-plate-330.webp`, white background, so it always sits on the white
plate). The placeholder two-card mark of P1 is retired. Favicon `img/logo/favicon-32.png`, home-screen icon
`img/logo/logo-180.png` (section 2.5).

Voice: plain, short, friendly; sentence case; times as "7 PM", never "19:00"; money as "$20", "Free". Say what happens:
"Sign up", "Join the waitlist", "Pre-register at the counter", "Just show up". No jargon in admin ("Seats", not
"capacity"; "Sign-ups close", not "cutoff").

---

## 2. Tokens

Source of truth: `prototype/css/tokens.css`. **The build's `src/styles` adopts the same token names and values** (P2.3):
copy the `:root` block as is; any change is made in both places and the contrast table below is re-run. Colours use
`light-dark()` keyed off `color-scheme`; the `<meta name="color-scheme">` content is mapped back to the property (see
section 11, theme switch). Elements that must stay one scheme set `color-scheme: dark` locally: the header, the
open-now strip, the cEDH band, the footer and all admin chrome. Every token inside them then resolves to its dark value
with no extra rules.

### 2.1 Colour (semantic)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#F5EFE4` cream | `#1B1715` warm charcoal | page background |
| `--surface` | `#FFFCF6` | `#25201C` | cards, panels, dialogs |
| `--surface-2` | `#EEE5D6` | `#2E2823` | stat box, cancelled card, chip counts, photo placeholders |
| `--ink` | `#2B211C` | `#F3ECE2` | text |
| `--ink-2` | `#5F5047` | `#C0B3A5` | secondary text |
| `--line` | `#DED3C2` | `#3C342E` | decorative borders only |
| `--line-strong` | `#8D7C6D` | `#877869` | input borders, stat box, dashed outlines (3:1+) |
| `--act` | `#2F5FB0` sign blue | `#9DB8F2` | the one accent: primary buttons, links that act, current-item bars in admin |
| `--act-hover` | `#244C8F` | `#BBCEF7` | |
| `--on-act` | `#FFFFFF` | `#16120F` | text on `--act` |
| `--mark` / `--on-mark` | `#9C4A32` brick / white | `#C77A5E` / `#1B1715` | date diamonds only |
| `--brick` | `#6B3A2C` | same | public header wall (with the coursing pattern) |
| `--charcoal` | `#26211D` | same | admin top bar, sidebar, tab bar; toast; tests page bar |
| `--band` / `--on-band` / `--on-band-2` | `#3E2A22` | `#120F0D` (always used dark) | open-now strip, cEDH band, footer; text `#F5EFE4` / `#CDBFB0` |
| `--plate` | `#FFFFFF` | same | the sign plate behind the logo |
| `--highlight` / `--on-highlight` | `#F2D58A` / `#2B211C` | same | "Today", "Changed", admin count badges, Undo |
| `--scrim` | `rgb(18 16 14 / 0.84)` | same | caption chips and the video button on photos |
| `--focus` | `#2B211C` | `#FFFFFF` | focus ring |
| `--ok` / `--ok-bg` | `#1C6B3F` / `#E3F4EA` | `#6FD49A` / `#12321F` | open seats, on now, checked in |
| `--warn` / `--warn-bg` | `#8A5300` / `#FFF3D6` | `#F2B24C` / `#3A2C10` | few seats, needs players, low stock |
| `--bad` / `--bad-bg` | `#A3291B` / `#F8E4DE` | `#F08A78` / `#3A1A14` | cancelled, errors, short stock (text and borders, never a big field) |
| `--wait` | `#5B3FB0` | `#C1A9FF` | waitlist |

Retired with look A: `--flyer`, `--flyer-red*`, `--sign`, `--foil`, `--ink-navy`, `--night*`, `--cardstock`, the
`?look=` picker and `theme-a/b/c.css`. Status is never colour alone: every status has an icon and words (section 5.3).

### 2.2 Game colours (dots, thin rules, icons + written name)

The game's name is always written in `--ink`; the colour only paints a 3px rule on top of the event card, release tile,
admin event button and template tile, a 4px left edge on admin event rows, the chip and badge icon, and the dots on the
week cards. Never a fill or a tint. Icons are simple generic shapes (no publisher marks).

| Game (chip label) | Token | Light | Dark | Icon |
|---|---|---|---|---|
| Magic | `--g-magic` | `#B8541A` | `#F39A5B` | pentagon |
| cEDH | `--g-cedh` | `#6A2FB5` | `#B993F5` | crown |
| Pokemon | `--g-pokemon` | `#A87C00` | `#F2C230` | lightning bolt |
| One Piece | `--g-onepiece` | `#B02D66` | `#F07AAE` | anchor |
| Riftbound | `--g-riftbound` | `#0B7F75` | `#4FD1C2` | split diamond |
| Hololive | `--g-hololive` | `#1F7FC4` | `#6CC0F5` | microphone |
| Warhammer (and tabletop) | `--g-warhammer` | `#4A6378` | `#9DB4C8` | shield |
| Other (D&D, trade nights) | `--g-other` | `#5E6A7D` | `#A7B0C0` | d20 |

New games the admin enables later (Lorcana, Yu-Gi-Oh!, Gundam...) get a token and icon added to this table first.
Chip order follows the store's week: Magic, cEDH, Pokemon, One Piece, Riftbound, Hololive, Warhammer, Other. One Piece
is a chip (not under Other as D14 listed) because Facebook shows a weekly One Piece night (fb schedule, Thursday).

### 2.3 Contrast (checked with the WCAG formula, 2026-10-26)

| Pair | Light | Dark |
|---|---|---|
| ink on paper / surface | 13.7 / 15.3 | 15.2 / 13.9 |
| ink-2 on paper / surface-2 | 6.7 / 6.2 | 8.7 / 7.1 |
| `--act` as text on paper / surface | 5.4 / 6.1 | 9.0 / 8.1 |
| text on `--act` button (white / `#16120F`) | 6.2 (hover 8.4) | 9.4 |
| on-mark on `--mark` (date diamond) | 6.1 | 5.4 |
| white / cream on `--brick` (header) | 9.3 / 8.1 | same |
| cream / on-band-2 on `--charcoal` (admin) | 13.9 / 8.9 | same |
| `--act` (dark value) on charcoal (admin current bar) | 8.0 | same |
| on-band on band / on-band-2 on band | 16.7 on `#120F0D` / 7.5 on `#3E2A22` | same |
| ok / warn / bad / wait text on surface | 6.4 / 6.2 / 7.1 / 7.4 | 9.1 / 8.9 / 6.6 / 8.2 |
| warn on warn-bg / bad on bad-bg | 5.7 / 5.9 | 6.2 / 6.4 |
| ink on highlight | 11.0 | 11.0 |
| line-strong (non-text) on surface | 3.9 | 3.8 |
| game colours (non-text) on surface | 3.6 (Pokemon, lowest) to 7.5 | 6.0 to 9.9 |

All pass AA (text 4.5, large text and UI parts 3). Anyone changing a colour re-runs these pairs (a PowerShell snippet
is enough: relative luminance, `(L1+0.05)/(L2+0.05)`).

### 2.4 Space, radius, elevation, motion, sizes

- Space (4px base): `--s1` 4, `--s2` 8, `--s3` 12, `--s4` 16, `--s5` 24, `--s6` 32, `--s7` 48, `--s8` 64, `--s9` 96 (px).
  Page gutter `--gutter` = clamp(16px, ..., 32px); content max width `--maxw` 1240px.
- Radius by role, not one value: `--r-card` 14px (the 3mm corner of a 63mm card) for cards, panels, tiles;
  `--r-ctl` 10px buttons and inputs; `--r-box` 6px stat box and tags; `--r-pill` chips and the cost pip.
- Elevation: one shadow, `--lift` (hairline + soft drop) on cards and tiles. Nothing else floats except dialogs and the
  admin toast.
- Motion (look A, calm): no load animation; the hero video fade-in (600ms, opacity only); the "On now" dot pulse;
  smooth anchor scrolling only when motion is allowed; 140ms colour transitions on buttons. `prefers-reduced-motion: reduce` collapses all of it to
  the end state. No scroll reveals, no hover lifts on cards.
- Targets: public `--tap` 48px minimum for buttons, chips and nav; text links inside a sentence or a card title follow
  WCAG 2.5.8 (24px or spaced) because the card's button is the target. Admin `--tap-admin` 56px for the counter actions
  (check-in, steppers, primary and secondary buttons, inputs); 48px floor for secondary controls that come in sets
  (chips, payment segments, row menu and its items, reminder chips, tabs, `btn-sm`), with 8px between separate targets
  (segments touch, as one control). P1.3: 56px everywhere made the roster row two lines on a tablet.


### 2.5 Header and sign plate, photos, video hero, theme switch, icons and link previews (look A)

- **Header (public pages, `.site-head` in `site.css`):** `--brick` with an inline SVG brick coursing pattern at 11%
  opacity; `color-scheme: dark`. Left: the logo on the **sign plate** (`.plate`: white, 6px radius, 6px 10px padding,
  hairline `--plate-edge` ring and a small drop shadow; logo 168px wide, 132px under 420px; the link says "Mulligan
  Games, home"). Nav links in cream; the current page underlined. Right: the theme switch. Under 900px the nav drops
  to its own sideways-scrolling row. The footer repeats the plate (120px) on `--band`.
- **Admin chrome (`admin.css`):** plainer and calm for the counter: `--charcoal`, no brick texture. Sidebar (1024+,
  16rem): the plate (160px) with "SHOP ADMIN" under it, sections with a 4px `--act` bar on the current one, then
  open status, "View the website" and the labelled theme switch. Under 1024: a charcoal top bar with a small plate
  (100px), the page name and the open status (plus the switch from 600px), and a charcoal tab bar with a 3px `--act`
  bar on the current tab; on phones the switch is under More. Count badges use `--highlight`.
- **Photos (D27):** the store's own photos and stills only (`prototype/img/social/`, `media/video/*-poster.webp`;
  sources in `docs/research/social-photos.md`). `object-fit: cover`, `--r-photo` 12px corners (full-bleed on phones),
  explicit `width`/`height`, `loading="lazy"` except the first one on the page, and a real `alt`. Captions sit on a
  `--scrim` chip at the bottom left, never as text over the bare photo. Sources are max 960px, so photos are used at
  card size, never as a full-width hero. Where they appear: front hero (video), "Inside the shop" gallery, cEDH
  section, Visit (storefront); events page head (the "Welcome to Mulligan Games" banner over the play-room door: a
  16:7 strip on phones, beside the title from 768px); the public empty state (`.empty-photo`, staff with the corgi,
  plus "Free play is on all day"). Admin uses no photos (speed at the counter). Flyers built on third-party art and
  stills with burned-in captions are not used.
- **Video hero (front page):** the hero copy and week strip on the left, a framed 4:5 box (16:9 on tablets, 4:3
  full-bleed on phones) on the right holding the poster `<img>` (LCP, `fetchpriority=high`, no `decoding=async`) and a
  muted looping `<video>` (`preload="none"`, `poster` set to the same image, started 300ms after `load` unless
  reduced motion, Save-Data or a slow link). The box background is the poster too, so it is never black or empty.
  The video stays at opacity 0 until a real frame has been painted (`requestVideoFrameCallback`, else the first
  `timeupdate` past 0), and drops back to the poster on `error`, `emptied` or `abort`; blocked autoplay simply leaves
  the poster. A "Play video / Pause video" button (48px, `--scrim`) is the control (WCAG 2.2.2); the choice lasts the
  visit (`sessionStorage`). Section 6.1 keeps the encoding, crop and size budgets.
- **Theme switch:** a labelled pill on every page, "Theme | Light | Dark" (two `aria-pressed` buttons with sun and
  moon icons, in a `role="group"` named "Colour theme"; the word "Theme" hides under 420px). Follows the system until
  the visitor picks; the pick is stored (`mg-scheme`) only when it differs from the system. One implementation:
  `MG.scheme` in `mg.js` (`html()` draws it, `wire()` handles clicks with one delegated listener, other tabs via the
  `storage` event and system changes). `?theme=light|dark` shows one scheme without saving it (screenshots, reviews);
  every page's head script reads it before first paint.
- **Icons and link previews (every page, relative paths so they work under the Pages subpath
  `/Mulligan-Games-Website-concept-/`):** `<link rel="icon" href="img/logo/favicon-32.png">`, `<link
  rel="apple-touch-icon" href="img/logo/logo-180.png">` (admin pages use `../`), `theme-color` (`#6B3A2C` public,
  `#26211D` admin), `og:type`, `og:site_name`, `og:title`, `og:description`, `og:image` =
  `img/og/mulligan-games-og.jpg` (1200x630: the logo plate on brick with "Card nights five days a week." beside the
  play-room door photo) with width, height and alt, and `twitter:card` = `summary_large_image`. Note for the build:
  Facebook and X want an absolute `og:image`, so the prototype uses `https://mishtuk.github.io/Mulligan-Games-Website-concept-/img/og/mulligan-games-og.jpg` on every page (tests.html too) and an absolute `og:url` per page; the build writes `{siteUrl}/img/og/...` and `canonical` from the configured origin. Fonts: `<link rel="preload" href="fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>` in every head.
- **Phone nav (D34):** the main nav stays a sideways strip with "All events" first and a static right-edge fade (mask, no motion) under 900 px. **Phone quick-action bar (D33):** `.mobile-bar` (Events, Hours, Directions, Call) on public pages under 900 px: fixed bottom, static, 56 px tall items in 4 equal columns on `--charcoal`, an icon over each label (calendar, clock, pin, phone), the current page tinted `--act`, links keep `?now=`, safe-area padding, the page gets matching bottom padding and the toast sits above it; hidden in print.
- **Print:** `@media print` in `site.css` forces light and black on white at 11pt, hides the demo bar, nav, theme switch, chips, buttons, `.no-print`, video and decorative photos, keeps the logo plate, avoids breaking days and cards, and shows `.print-only` (the store line on the events page). **404:** `prototype/404.html` (plate, "That page isn't here.", Front page, All events, hours, Call, Directions; absolute `/Mulligan-Games-Website-concept-/` paths; `noindex`; footer clears a short card). **Demo bar:** one bar on all five pages, built with `createElement`: "Concept with sample data." + short note, "Pretend it's" menu (every demo moment plus Real clock, keeps the hash and other params), "Reset demo data", and an optional link to the other side (owners: counter screen; admin: the players' side). At most 2 lines at 390 px, 56 px at 1280 px, controls 44 px. The prototype opens on Friday 6:50 PM; `?now=real` shows the real clock. Toast: pauses on hover and focus and restarts in full after, Undo is 48 px.

---

## 3. Type

One family: **Archivo** (variable, weight 100 to 900, width 62% to 125%, SIL OFL). The VFW site already self-hosts it
(`public/fonts/archivo.woff2`, 90 KB, Latin subset), so the build reuses that file and its `@font-face`
(`font-stretch: 62% 125%`) and the CSP stays as is. The width axis gives the condensed display voice the flyers have,
without a second font. The prototype copies the same file to `prototype/fonts/`; on `file://` some browsers refuse
fonts from a parent folder, so the stacks fall back to Bahnschrift (Windows), DIN Condensed (Apple), Roboto Condensed
(Android), Arial Narrow. **Licence:** ship the OFL text next to the font in the build (`public/fonts/OFL-Archivo.txt`,
from github.com/Omnibus-Type/Archivo); the prototype folder has a note.

| Role | Size | Width | Weight | Line height | Notes |
|---|---|---|---|---|---|
| Hero headline (`--t-hero`) | clamp(2.6rem ... 6.25rem) | 62% | 900 | 0.95 | max 15ch, `text-wrap: balance` |
| Section head (`--t-2xl`) | clamp(2rem ... 3.25rem) | 62% | 900 | 1.1 | |
| Day name, cEDH ticket date, big numbers | 1.75 to 2.5rem | 62% | 900 | 1.0 | tabular numbers |
| Card title (`--t-lg`) | 1.3125rem (21px) | 72% | 800 | 1.1 | |
| Body (`--t-md`) | 1.0625rem (17px) | 100% | 400 | 1.55 | max ~70ch |
| Meta (`--t-sm`) | 0.9375rem (15px) | 100% | 500 to 650 | 1.45 | card text, notes |
| Small (`--t-xs`) | 0.875rem (14px) | 100% | 600 to 800 | 1.45 | stat units, chip counts, tags; never paragraphs |
| Buttons | body size | 88% | 750 | 1.1 | |

Rules: sentence case everywhere (the only capitals-with-tracking is "GAMES" inside the wordmark). No label above every
heading; the date line above the hero headline is information, not decoration. Times never break: the space before
"PM" is a no-break space (`MG.fmtTime`). Respect user text size: all sizes in rem.

---

## 4. Layout system

- **Breakpoints (min-width, phones first):** base 360px; `600px` large phone (phone number shows in the strip);
  `768px` tablet (hero diamond appears, release tiles become a grid, visit goes two columns; **admin's main layout**);
  `900px` header nav joins the logo row; `1024px` desktop (day groups become a two-column rail, cEDH band two columns,
  admin sidebar); content stops growing at 1240px (seen at 1280).
- **Phone is a different layout, not a squeezed one** (screenshot study): chips and release tiles scroll sideways with
  snap (every sideways rail sets `scroll-padding-inline: var(--gutter)`, else snapping pulls the first item to the
  screen edge); the week deck scrolls sideways; day headers stick to the top while you scroll that day's cards.
- **Alignment:** everything left-aligned; numbers in stat boxes and the hours table right-aligned or tabular. Nothing
  centred except inside the diamond, the week cards and placeholders.
- **Server-rendered first (D11):** every section in section 6 is plain HTML from the server. JS only enhances: chips
  filter in place (they are links `?game=magic#week` without JS), the theme toggle, the sign-up dialog (falls back to
  the event's own page with a form).

---

## 5. Components

### 5.1 Buttons and links
- **Primary** `.btn.btn-act`: sign blue `--act`, white text (dark: light blue, charcoal text), 48px tall (56 in admin), radius 10.
  One per card or section. Labels say what happens: "Sign up", "Register on TopDeck", "Join the Discord", "Save event".
- **Secondary** `.btn.btn-2`: surface with a `--line-strong` 2px border, ink text. "Join the waitlist", "Call the shop",
  "Directions", "Show all games".
- **Danger** (admin only) `.btn.btn-bad`: `--bad` text on surface with `--bad` border; filled only inside a confirm.
- **External links** carry an external icon and a visually hidden "(opens TopDeck)" and `target=_blank rel=noopener`.
- **Text links**: underlined, 0.08em, thicker on hover. "More" links (`All events and sign-ups`) end in a chevron icon.
- Disabled: never grey out a button with no reason; replace it with a sentence (`.ev-how`: "Full. Ask at the counter
  about open seats.").

### 5.2 Game chips (filter)
Pill links, 48px, icon in the game colour + name + count for the next 7 days ("Magic 9"). Current chip: ink fill,
paper text, `aria-current="true"`. The cEDH chip looks like the others (its crown icon is cEDH purple; look A: no coloured borders).
Phone: one row, scrolls sideways; desktop: wraps. The Magic chip includes cEDH (cEDH is Magic; `family: 'magic'`);
the cEDH chip shows only cEDH. A visually hidden live region says "Showing Magic: 9 events this week." after a change.
A chip with 0 still shows (so you learn the game exists) and leads to the empty state (section 10).

### 5.3 Event card (the core component)

Anatomy, top to bottom (markup from `MG.eventCard()` in `prototype/js/mg.js`):

```
┌──────────────────────────────────────────────┐ ← 3px rule in game colour
│ Draft FNM                              ($20) │ ← name bar: title (h4, link to detail) + cost pip ("Free" when 0)
├──────────────────────────────────────────────┤   bar on --surface, no tint
│ ⬠ Magic  ◆  Draft, newest set               │ ← type line: game badge (icon + name) ◆ format
├──────────────────────────────────────────────┤
│ ◷ 7 PM to 11 PM   [● On now] [Kids welcome]  │ ← text box: time line + tags
│ [✎ Updated] Starts at 7:30 this week.        │    change note (only when an exception has a note)
│ Prize packs paid by record.                  │    prize line, else description (front page: prize only)
│                                              │
│ [ Sign up ]                  ┌─────────────┐ │ ← foot: one action (or a sentence) + stat box
│                              │ ⚠ 3 seats left│ │
│                              │ almost full │ │
└──────────────────────────────┴─────────────┴─┘
```

- Width: fills its grid cell; min 19rem in multi-column grids, full width on phone. Height grows with content; cards in
  a row align their foot to the bottom (flex column).
- Title links to the event detail (`events.html#e-<key>`; in the build `/events/<series-id>?date=YYYY-MM-DD`).
- The time line always shows start and end ("7 PM to 11 PM"); with doors: "Doors 11 AM, starts noon".
- Fee pip: "$20", "Free", or "?" only when the admin left the fee blank (admin warns; section 9.3).
- Tags (small, rounded 6px): **On now** (green dot pulse) between start and end; **Kids welcome**; **Invite only**;
  **Changed** (`--highlight`, pencil icon; was "Updated") when a one-date change has a note; the note follows the tag,
  then "Updated Oct 25.". D17 tags (beginner friendly, age rule, casual / competitive) and the "Arrive by" line:
  section 15.5.

#### Event card: states

Exactly one state per card, computed by `MG.seatState()` in this order (first match wins). Every state has an icon,
words and (where useful) a number; colour only reinforces.

| # | State | When | Action area | Stat box |
|---|---|---|---|---|
| 1 | **Cancelled** | one-date exception type cancel | none; the note ("No league on Halloween.") | none; a red "Cancelled" stamp (circle-x icon, 3px border, tilted -5°) bottom right; card goes `--surface-2`, band and text muted. Stays in the list so nobody drives over. |
| 2 | **Walk-in only** | sign-up = walk in | door icon + "Just show up. No sign-up needed." | none |
| 3 | **External sign-up** | sign-up = another site | primary "Sign up on TopDeck" (or the tool's own label, e.g. "Sign up online") + external icon | if a count is known: users icon, "80 registered, on TopDeck" |
| 4 | **Pre-register at the counter** | sign-up = in store only (prereleases today) | door icon + "Pre-register at the counter." + secondary "Call the shop" (tel:) | none |
| 5 | **Sign-ups closed** | sign up here, now past the cutoff (default: start time) | "Sign-ups closed. Walk in if seats are left." When no seats are left: "Sign-ups closed. All seats are taken." | seat icon, "4 seats left, of 28"; lock + "Full" at 0; none when there is no seat limit |
| 6 | **Waitlist** | full, waitlist on | secondary "Join the waitlist" | hourglass, "Full", "3 waiting"; `--wait` border |
| 7 | **Full** | full, waitlist off | "Full. Ask at the counter about open seats." | lock, "Full" |
| 8 | **Needs players** | min to run set and sign-ups below it | primary "Sign up" | users icon, "5 signed up, needs 8 to run"; warn border and fill |
| 9 | **Few seats** | seats left ≤ max(3, 15% of seats) | primary "Sign up" | alert triangle, "3 seats left, almost full"; warn border and fill |
| 10 | **Open** | otherwise | primary "Sign up" | seat icon (green), "17 seats left, of 28" |

Modifiers that combine with any state: **Free** (pip says "Free"), **On now**, **Updated**, **Kids welcome**,
**Invite only** (cEDH invitational: action is the sentence "Invite only. Seats come from the Championship Series.").

Two events at the same time (Wednesday has four at 7 PM, Thursday two): cards that share a start time sit in one
**slot** under one time label, "7 PM, 4 events start at 7 PM", with a 3px ink bracket line down their left edge. On
desktop the time label is a left rail and the cards sit side by side; on phone they stack inside the bracket.

### 5.4 Stat box
The card's power/toughness corner: 2px `--line-strong` border, 6px radius, `--surface-2` fill; icon + big condensed
number + unit, small line under. Reused for cEDH "registered" counts, preorder "6 days left", and admin counts.

### 5.5 Day header
Brick diamond (`--mark`) with the date number (`--on-mark`, condensed) + day name ("Today", "Tomorrow", then "Wednesday") + meta line (for Today and Tomorrow it starts with the weekday, no separate tag, R23) "Oct 28, open 2 PM to 10 PM" (with any date override note:
"Opening at 10 AM for the cEDH Championship Series"). Sticky while you scroll the day (phone: top of screen; desktop:
left rail). Closed day: dashed diamond, "The shop is closed.", compact row. Phone (D35): closed and one-line days use a smaller diamond and name, and a closed day drops the "The shop is closed." line (the meta already says closed).

### 5.6 Week strip (hero)
Seven flat day cards in a row under "THE NEXT SEVEN DAYS" (look A replaced the dealt, tapped hand): `--surface`, 1px
`--line`, 10px radius, 5.6rem tall; weekday, condensed date number, up to eight round dots in game colours; caption
under the card ("4 events", "Closed"). Today: 2px `--act` border, ink caption. Closed: transparent with a dashed
`--line-strong` border. No deal animation. Each links to its day section (`#d-YYYY-MM-DD`) with an `aria-label` like
"Wednesday Oct 28, today, 5 events". Counts ignore the game filter and cancelled dates. Phone: scrolls sideways.

### 5.7 Next-up ticket (hero)
A `--surface` ticket with a 4px `--act` left edge: the time huge ("5 PM"), "NEXT UP" / "NEXT UP WEDNESDAY" / "ON NOW"
small caps in `--ink-2`, up to two event names + "and 2 more"; links to that day. Beside it the primary "This week's
events" button. Under both, "Free play all day, every day we're open" with a small `--ok` dot (the flyer's black
circle is retired with look A).

### 5.8 Other public components
- **Open-now strip** (`--band`, always dark): status dot + "**Open now** till midnight" / "**Closed now.** Opens at 2 PM" /
  "**Closed today.** Opens Wednesday at 2 PM"; address (768+); phone link ("Call" on phones under 600); Directions.
  Logic: `MG.openStatus()`, handles closes at or after midnight and date overrides.
- **Further out list** (under the week): one row per series for days 8 to 35 (big one-offs, prereleases, cEDH, RCQs,
  monthly events), "and 2 more dates" tag for short series; date block, title link, game badge, time, fee, sign-up
  mode in words. Max 6 rows, then "See every date".
- **cEDH ticket** (in the band): date block, title, long date + time + entry, primary "Sign up on TopDeck" (the same
  label as the event card, so one action has one name; P1.3) or the invite-only sentence, stat box "120 registered on TopDeck". 4px cEDH-purple left edge.
- **Release tile**: the card anatomy again, portrait: art box (4.5rem `--surface-2`, 3px game rule on top, the game icon; a real
  product image later, if the owners want), name, type line (game ◆ "Preorder" / "Out now" / "Coming soon"), text box
  (note, linked prerelease dates + fee), stat box ("6 days left, preorders end Sun Nov 1"; "Last day today";
  "Preorders closed"; "On the shelf"). Phone: horizontal rail with snap (80% width tiles); 768+: grid.
- **Hours table**: Monday to Sunday rows; today's row in `--highlight` with a "Today" tag; closed rows in `--ink-2`; a date
  override inside the next 7 days shows under its weekday ("Sun Nov 1: 10 AM to 10 PM. Opening at 10 AM for cEDH.").
  Note under: "Hours from public listings. The owners will confirm them before launch." (until confirmed, D12).
- **Photos**: the store's own photos in fixed-ratio frames (section 2.5); `--surface-2` shows while one loads. In the
  build, photos come from admin uploads (VFW photo pipeline), with required alt text.
- **Proof list** and **Lately at the shop**: diamond bullets; each line says its source ("Source: Facebook"); results
  come from public results (`results[].public`). A dashed slot holds 2 or 3 real reviews once the owners choose them.
  No made-up quotes, ever.
- **Theme switch**: the labelled "Theme | Light | Dark" pill in the header (section 2.5, section 11).

---

## 6. Front page (prototype: `prototype/index.html`)

Order (D1 and the brief): open-now strip > header > hero (status + next up + week deck) > This week at Mulligan >
cEDH band > New and preorders > Visit > Between events (Discord, proof, lately) > footer. The concept-only demo bar
sits above everything in the prototype and is not built. Phone order (R1): copy, week deck, then the photo box (16:9) so events come first. "This week" (R5): today and the next day with events (after the game filter) are full cards, later days are one line per event with the seat state in words, every day keeps its `d-YYYY-MM-DD` anchor, then "See all N events". Sign up (R7): a card goes straight to the form on the events page (`events.html#su-<key>`); from the detail dialog the form replaces the body with a "Back to details" button. The events page opens with a "Tonight" block (from 5 PM) listing today's dates in time order. The full demo-bar spec is in 2.5.

Look A (D28) keeps this order and grid; the header is brick with the logo plate, and the bands are `--band` brown, not navy.

**Round 3 (D36, owner direction 2026-10-27), replaces the hero layout and the phone order above; the sketch below is older.**
Cleaner and more concise, laid out like the owner's VFW and Riverside sites:
- **Hero: full-bleed.** The photo/video fills the whole section width (`.phero-media` absolute, `object-fit: cover`,
  position 50% 38-42%), `min-height: clamp(30rem, 72svh, 48rem)` on phones and `clamp(34rem, 78svh, 50rem)` from
  900px. Dark in both themes (`color-scheme: dark`). Scrim: phones `to top` 0.94 > 0.8 (42%) > 0.38 (78%); from 900px
  `90deg` 0.9 > 0.74 (36%) > 0.22 (68%) > 0.08, plus a bottom 0.5 > 0 (30%) so the strip sits on dark. Copy is white,
  left, max 40rem: date (uppercase, 85% white), h1 `clamp(2.5rem, 1.3rem + 4.8vw, 5.25rem)` with a soft text-shadow,
  sub (92% white), then the next-up ticket (glass: 10% white fill, 28% white border, accent left rule) and the primary
  button. Copy is bottom-aligned on phones, centred from 900px.
- **Hero strip** along the bottom (Riverside pattern): 72% black, `Free play all day...` left, `On screen: ...` caption
  (from 768px) and the outlined Pause / Play pill right. The pause control is never inside the photo any more.
- **Week strip** moves out of the hero to the top of "This week" (under the section head). Phone check: headline and
  next up inside the first 844px, the strip within 220px of the hero's bottom.
- **This week, wide screens:** day column 12rem; a day's cards flow into one two-column grid in time order (no time column; each card shows its own time), days that are only one-line rows get the light header (2.6rem mark,
  28px name). "Further out" shows 4 rows, each one line (`Fri 6 Nov` inline).
- **Visit** is one card with three columns divided by hairlines: Hours | Find us (address, Directions, Call, parking +
  "sign on the roof") | Good to know. The two storefront photos are gone from the front page.
- **Between events** drops the dashed review placeholder.

```
PHONE 360                                   DESKTOP 1280
┌────────────────────────────┐              ┌──────────────────────────────────────────────────────────┐
│● Open now till 10 PM  ☎ ⌖ │ strip         │● Open now till 10 PM        445 York Rd  ☎ (215)…  ⌖ Dir │
│[logo]               [☾]    │              │[logo]       This week cEDH New and preorders Visit All [☾]│
│This week cEDH New… (scroll)│              ├──────────────────────────────────────────────────────────┤
├────────────────────────────┤              │ RED FIELD                                       ◆◆◆◆◆◆◆  │
│RED  Wednesday, October 28  │              │ Wednesday, October 28                          ◆ Next up ◆│
│Open till                   │              │ Open till                                     ◆  5 PM   ◆ │
│10 PM tonight.              │              │ 10 PM tonight.                               (free) ◆◆◆◆  │
│Today: Tabletop… at 5 PM; … │              │ Today: Tabletop and Warhammer at 5 PM; …                   │
│┌◆ Next up 5 PM ─────────┐  │              │ [Today][Thu][Fri][Sat][Sun][tapped][tapped]               │
│└ Tabletop and Warhammer ┘  │              ├──────────────────────────────────────────────────────────┤
│(Free play all day…)        │              │ This week at Mulligan                All events and sign-ups│
│[Today][Thu][Fri][Sat] →    │              │ (All 15)(Magic 9)(cEDH 2)(Pokemon 1)(One Piece 1)…         │
├────────────────────────────┤              │ ◆28        5 PM  [Tabletop and Warhammer]                  │
│This week at Mulligan       │              │ Today      7 PM ┃[D&D Open Play] [Learn to Play Pokemon]   │
│(All 15)(Magic 9)(cEDH… →   │              │ Oct 28…  4 events┃[Pauper Night ] [Standard Showdown   ]  │
│◆28 Today [Wednesday]       │ sticky        │ ─────────────────────────────────────────────────────────│
│5 PM                        │              │ ◆29 Tomorrow …                                             │
│[card                    ]  │              │ Further out (6 rows)                                       │
│7 PM  4 events start at 7 PM│              ├────────────── cEDH BAND (navy + lattice) ────────────────┤
│┃[card]┃[card]┃[card]┃[card]│              │ cEDH at Mulligan          │ Next cEDH events            │
│…                           │              │ lede, 4 facts (2x2)       │ [ticket][ticket][ticket]    │
├────────────────────────────┤              ├──────────────────────────────────────────────────────────┤
│Further out                 │              │ New and preorders  [tile][tile][tile][tile][tile]          │
│cEDH band (stacked)         │              │ Visit: hours table │ Find us + Good to know │ photo 4:5    │
│New and preorders (rail →)  │              │ Between events: Discord │ What people say │ Lately         │
│Visit, Between events       │              │ footer (navy)                                             │
└────────────────────────────┘              └──────────────────────────────────────────────────────────┘
```

**Hero copy rules** (`front.js` `headline()` and `sub()`):
- Open, closes at midnight: "Open till midnight tonight." Otherwise "Open till 10 PM tonight."
- Before opening today: "Open today from 2 PM."
- After closing: "Closed for the night. Back tomorrow at 2 PM." Closed day: "Closed today. Back Wednesday at 2 PM."
- Sub line: "On now: Draft FNM and Nexus Nights." then "Tonight: Saturday Draft at 6 PM." ("Today" before 5 PM),
  up to three time groups; with nothing left today: "Next up Wednesday: Pauper Night, Standard Showdown and 3 more."
  A date override note for today is appended.
- Date line: "Wednesday, October 28".

**This week:** next 7 days from today, grouped by day, then by start time. Events that already ended today drop off;
events on now stay with "On now". Days with no events: "No scheduled events. Free play all day." Closed days: compact
row (shown only when no game filter is on). The section's first screen on desktop shows the deck already, and the first
day starts right under the chips.

**Copy that is fixed text** (in the HTML, edited by the owners later through Store info): cEDH lede and facts, Good to
know (kids, sign-up, free play, preorders: the questions customers asked in Facebook comments, fb takeaway 9), parking.

### 6.1 Hero video slot (build with P2.3; issue #12; owner questions Q12, Q21)

**Look A (D27, D28) supersedes the layers and scrim below:** the video sits in its own framed box beside the hero
copy (section 2.5), not behind a red field, so no scrim is needed (captions use `--scrim` chips), and the store's clips
and posters are committed (D27 lifts the repo rule at the end of this section). The encoding, crop and size budgets
still apply.

A muted loop of the shop sits **behind** the red hero as a texture, never in front of it. The hero is still the flyer:
red field, white next-up diamond, white day cards, black free-play circle. The video only shows through the red.
It is built only when a clip exists and the owners have said yes; until then the hero ships exactly as section 6 draws it.

**What shows, in order (each step is the fallback of the one above)**
1. Video playing (clip exists, motion allowed, connection fine).
2. The clip's poster (reduced motion, Save-Data, slow link, autoplay blocked, or the file still loading).
3. The room photo (the photo slot from admin, P2.3b, Q12) used as the poster, with the same crop and scrim.
4. The plain `--flyer` red field (today's hero). Never an empty box, a spinner or a broken-player icon.

**Layers.** `.hero` stays the positioning box. Add `.hero-media` (`position:absolute; inset:0; z-index:0; overflow:hidden;
aria-hidden="true"`) holding a `<picture>` poster and the `<video>`, then `.hero-scrim`, then the existing `.hero-in`
(`position:relative; z-index:1`). The diamond, deck and free-play circle are untouched and opaque. The video is
decoration: no audio track, no captions needed, no accessible name; the pause button is its only control.

**The video element.** `muted loop playsinline preload="none"`, no `controls`, no `autoplay` attribute (the script starts
it, so nothing downloads early). `<source>` order: the smaller file first, which for the `-loop` clip is the `.mp4`; the other format follows. Check sizes whenever a clip is re-encoded.
`tools/enhance-video.sh <in> <name> [height=1080] [seconds=12]` writes `media/<name>.mp4` (H.264, CRF 20, faststart),
`media/<name>.webm` (VP9, CRF 33) and `media/<name>.jpg` (first frame = poster source); no audio. The script does not
make the AVIF/WebP posters, a vertical cut, or a smaller rendition: the coder adds those (poster formats through the
site's photo pipeline with the jpg as the `<picture>` fallback; run the script again with `height=720`, or a cropped
input, for the other sizes).

**Start after load (reuse of the Warminster VFW `Hero.astro` approach).** The poster paints first and is the LCP image
(`fetchpriority=high`, explicit `width` and `height`). A small inline script chooses a source and calls `play()` 300ms
after `window.load`, and adds `.is-on` on the `playing` event, so the video fades in over the poster (600ms, opacity
only; the poster stays underneath, so there is never a black frame). Poster only, no download, when any of these is true:
- `prefers-reduced-motion: reduce` matches (also live: if it flips to reduce, pause and show the poster);
- `navigator.connection.saveData` is on, or `effectiveType` is `slow-2g`, `2g` or `3g`;
- no clip is configured (no `<source>` is written, as VFW only writes sources for files that exist).
If `play()` is rejected (low-power mode), retry once on the first touch or click, then give up silently. Without
JavaScript the poster shows and the schedule is unaffected (server-rendered, section 11).

**Pause control (WCAG 2.2.2).** The loop plays for more than 5 seconds beside content, so a control is required. A
visible button in the hero, bottom right (above the deck on phone, never over the diamond): "Pause video" / "Play
video" (icon + words, 48px tall, white text on a solid `--band` fill, white focus ring); the label changes, no
`aria-pressed`. It exists whenever there is a video file. When the clip is held back (reduced motion, Save-Data, slow
link) it reads "Play video" so a visitor can opt in; pressing it fetches and starts the clip. The choice lasts for the
visit (`sessionStorage`, try/catch), not across visits. Paused keeps the current frame on screen (the poster is not
swapped back in).

**No layout shift.** The media never sets the hero's height: `.hero-media` is `inset:0`, so the hero is sized by its
content alone. The poster and video fill the identical box with `object-fit:cover`; both carry `width`, `height` and an
`aspect-ratio` matching their crop. Nothing is inserted into the flow after load: the pause button is in the markup
(`visibility:hidden` until the script confirms a source, its space reserved).

**Crops (phone and desktop; vertical and horizontal clips).** Never stretch; always `cover`.
| Viewport | Clip used | Box and crop |
|---|---|---|
| Phone portrait (under 700px) | the vertical clip if there is one; else the landscape clip, centre 9:16 band | tall hero: `object-position` centre 40% (keep tables and shelves, not the ceiling) |
| Tablet and desktop | the landscape clip, 16:9, 1080p (720p under 1280px wide) | wide, short hero: `cover` trims top and bottom; `object-position` centre 55% |
| Desktop, owners sent only vertical clips | not used; the room photo (step 3) stays | a 9:16 clip cropped to a wide band is mostly blur |
Frame the shot so the middle third survives both crops (door, tables, shelf in the centre band). If pre-cropping with
ffmpeg, crop first, then run the script (it scales by height only). Name the files `<name>` (landscape) and `<name>-m`
(portrait); the inline script picks by viewport and orientation.

**Legibility over video (scrim).** New tokens in `tokens.css`: `--scrim` = `--flyer` (the field stays flyer red: light
`#C8161F`, dark `#A3121A`); `--scrim-text` 0.90 alpha behind any text; `--scrim-edge` 0.60 where nothing sits. Phone:
one uniform `--scrim-text` layer. Tablet and desktop: a left-to-right gradient, `--scrim-text` under the headline and
sub line (left 60%) easing to `--scrim-edge` at the far right behind the opaque diamond, plus a bottom band at
`--scrim-text` under the deck captions. Worst case checked (a pure white video pixel under the scrim, the harshest
possible frame, WCAG formula, 2026-10-26): white text on the 90% scrim is 5.2:1 light and 6.7:1 dark (AA needs 4.5;
88% gives 5.1 and 6.5; 80% fails at 4.45 in light, so never go below 88% behind text). The "Today" caption is foil
text and only 4.1:1 at 90% over white, so while video is on it sits on a solid `--flyer` pill (foil on flyer 4.6,
section 2.3). Focus ring stays white (section 11). Each real clip is checked on its brightest frames under the
scrim; clips with large white areas (windows, white walls) are graded down or re-cut. No `mix-blend-mode`, backdrop
blur or text shadows to fake contrast. One clip serves both themes (the dark scrim is simply deeper).

**File size budgets (hard limits; over budget means re-encode, not ship).**
| File | Budget |
|---|---|
| Poster, phone portrait (AVIF / WebP) | 35 KB / 60 KB |
| Poster, landscape (AVIF / WebP) | 130 KB / 200 KB |
| Landscape 1080p mp4, 12s | 3.0 MB (script default CRF 20 will likely go over: raise CRF or cut seconds until under) |
| Landscape 720p mp4 (tablet, small desktop) | 1.5 MB |
| Portrait phone mp4 (about 540x960) | 1.2 MB |
| webm | no larger than its mp4 |
| Clip length | 10 to 15 s, seamless loop (matching first and last frame, or a cross-fade in the edit) |
Nothing downloads before `load`, so only the poster counts against LCP: an oversize poster is the blocker, not the
video. A phone fetches one poster plus at most one portrait clip, about 1.3 MB.

**Repo and rights.** `media/` and `source/` are gitignored: no store video file (originals, enhanced mp4/webm, or
posters cut from them) goes into the public repo until the owners answer **Q12** (logo and photos) and **Q21** (they
send their own clips, with customers' OK where people appear). Until then the page works with no clip (fallback steps
3 and 4), and the build reads the clip from a setting, not a hard-coded path. Clips are the owners' own files, not
reposts (the social archive is licensed audio and graded-card close-ups: `docs/research/store-videos.md`). No faces by
preference; any identifiable customer needs consent.

**Added to section 10 (states):** clip missing > the fallback list above; autoplay blocked > poster + "Play video";
network error mid-play > the current frame stays, no message, the button reads "Play video".

---

## 7. Events page and event detail (P1.2: `prototype/events.html`)

**URL:** prototype `events.html`, filters `?game=magic&format=Draft`, details `#e-<key>` (key = `series@YYYY-MM-DD`,
plus `T1500` when a series has two slots that day). Build: `/events`, `/events/<series-id>?date=YYYY-MM-DD`.

Layout (same header, strip and footer as the front page; no hero):

```
Events                                         [Add to my calendar ▾]  (all events .ics / this game .ics)
(All)(Magic)(cEDH)(Pokemon)…   Format: [All formats ▾]
─ Special events and tournaments ─────────────────────────── (one-offs, monthly, short series; next 60 days, by date)
  ◆6 Fri Nov 6   7 PM  [Star Trek Prerelease card]  (+ "also Sun Nov 8, 3 PM and 5 PM")
  ◆7 Sat Nov 7  10 AM  [5K cEDH Tournament card]
─ Every week ─────────────────────────────────────────────── (recurring weekly series, collapsed, one card each)
  Wednesday   [Pauper Night card: "Every Wednesday, 7 PM. Next: Wed Oct 28" + that date's seats]
              [Standard Showdown] [D&D Open Play] [Learn to Play Pokemon] [Tabletop and Warhammer]
  Thursday …   Friday …   Saturday …   Sunday …   (Monday, Tuesday: "Closed")
```

- **Collapsed weekly card:** the event card with the time line replaced by "Every Friday, 7 PM to 11 PM" and a second
  line "Next: Fri Oct 30" (or "Next: Fri Nov 6. Oct 30 is cancelled." when the next date is cancelled). State and stat
  box describe the next date. The title opens the detail on the next date.
- Format select lists the formats of the chosen game (from `games[].formats`), "All formats" first.
- Empty filter: the empty state (section 10) with the next matching date beyond 60 days, else "Nothing scheduled yet".

**Event detail** (prototype: a `<dialog>` opened from `#e-<key>`, also opened on load when the hash is present; build:
its own page per date, D16, specified in section 15.4 with layouts, status banners and JSON-LD):

```
[×]                                                    ← close (Esc, light dismiss)
Draft FNM                                       ($20)  ← same name bar as the card
⬠ Magic ◆ Draft, newest set
Friday, October 30 · 7 PM to 11 PM                     ← (render as two lines; no middle dots in the build)
[Updated] note, if any            [Cancelled stamp], if cancelled
┌ stat box: Full, 3 waiting ┐   [ Join the waitlist ]  ← the card's action, full width on phone
Prizes        Prize packs paid by record.
Bring         Nothing. Packs are included.
Kids          Welcome (when set)
Official tool Wizards EventLink. Event code: (shown when set; copy button)
Other dates   Fri Nov 6, Fri Nov 13, Fri Nov 20 (links; cancelled ones struck with the word "cancelled")
[Add to calendar]  [Directions]                       ← .ics built in the browser (prototype), served (build)
445 York Rd, Warminster. Park in any lot except the RISE lot.
```

`.ics`: one VEVENT per occurrence, `UID:<key>@mulligangames`, `DTSTART;TZID=America/New_York`, `LOCATION` = address,
`DESCRIPTION` = fee + sign-up mode + detail URL, `STATUS:CANCELLED` for cancelled dates. File name
`mulligan-<series>-<date>.ics`.

---

## 8. Sign-up (D5, D6)

Opened from "Sign up" / "Join the waitlist" (prototype: a dialog over the detail; build: the form on the event page,
POST, server reply page). One column, 48px fields, labels above, errors under the field.

| Field | Type / autocomplete | Rules and copy |
|---|---|---|
| Your name | text, `autocomplete="name"` | required. Error: "Enter your name so we can find you at the counter." |
| Email | email, `autocomplete="email"` | one of email or phone is required |
| Phone | tel, `autocomplete="tel"` | hint under both: "One is enough. We only use it about this event." Error (on the email field): "Add an email or a phone number." |
| Player ID (optional) | text, `inputmode="numeric"` | label from the tool: "Wizards ID (Companion)", "Play! Pokemon ID", "Bandai TCG+ ID", "KONAMI ID". Hidden when the tool has none. |
| website (honeypot) | hidden from people | off-screen, `tabindex=-1`, `autocomplete="off"` |

- Above the button: "Pay $20 at the counter when you arrive." (D3; one phrase in form and result, R17), and no payment line for a free event. Waitlist mode adds "The event is full. Join
  the waitlist and you move in automatically if a seat opens."
- Button: "Hold my seat" / "Join the waitlist". While sending: disabled with spinner + "Holding your seat...".
- Success (replaces the form, focus moves to it, `role="status"`):
  - "**You're in.** Seat 18 of 28 is yours for Draft FNM, Oct 30 at 7 PM." then "Pay $20 at the counter when you arrive." [Add to calendar] [Done]
  - "**You're on the waitlist (#3).** If a seat opens, you move in automatically (and we email you, when an email was given). Use the link below to check your place or cancel."
  - Both add the D26 personal link (R17): "Keep this link to cancel or check your place:" + the link read-only + Copy, and "We emailed it too." only when an email was given. The prototype shows a sample link.
  - Last-seat race: "That seat just went. You're on the waitlist (#1) instead."
  - When the event has an arrive-by time (D17, 15.1 `arriveByMins`), "You're in" adds: "Arrive by 6:50 PM or your
    seat goes to the next person on the waitlist." (without a waitlist: "... or your seat may go to a walk-in.").
- Errors: duplicate ("You're already signed up for this one, as Sam B."); closed ("Sign-ups closed at 7 PM. Walk in if
  seats are left."); network ("Couldn't reach the shop's site. Your seat isn't held yet. Try again."); rate limited
  ("Too many tries. Wait a minute and try again.").
- No email confirmation until SMTP exists (D5); the success text says what to do instead.
- Privacy line under the form: "We delete your contact details 30 days after the event." (N set in P2.4.)

---

## 9. Admin (P1.2: `prototype/admin/*.html`, `prototype/css/admin.css`)

Same tokens and Archivo; the admin is calm (no red field, no deal animation). Built for a tablet at the counter
(768px, landscape 1024px) with one hand, mid-event; works on a phone; desktop is a bonus. Targets 56px; body 17px;
plain words. **Undo over confirm**: check-in, payment, +/- stock, status changes, cancelling one date and removing
a sign-up all act at once and show a toast with Undo (6s, VFW `toast(msg, {label, fn})`). Confirm dialogs only for:
deleting a whole series, deleting a product, and cancelling a date that has sign-ups (says "11 people signed up. They
won't be told automatically; their contacts are in the roster.").

### 9.1 Shell
- **≥1024px:** VFW layout: charcoal sidebar 16rem (`--charcoal`, always dark): logo plate + "SHOP ADMIN", sections with icon,
  label and count badge: **Today** (default), **Events**, **Inventory** (badge: low + short count), **Preorders**
  (badge: arrived, to call), **Store info**, then Security log, Account, "View the website". Current item: 4px `--act` left
  bar + tinted background (VFW `aria-current` style, the sign blue instead of brass).
- **<1024px:** top bar 56px (wordmark mark + section title + open-now dot) and a **bottom tab bar** 64px, fixed:
  Today, Events, Stock, Preorders, More (More opens a sheet with the rest). Badges on the tabs. Safe-area padding.
- Toast: bottom centre above the tab bar, `--charcoal`, `--highlight` Undo button, `role="status"`.
- Offline/unsaved: a sticky banner "Can't reach the server. Your last change isn't saved." with "Try again".
- Unsaved-changes bar in editors (VFW): sticky bottom "You have unsaved changes [Discard] [Save event]".

### 9.2 Today (counter check-in, the default screen)

```
TABLET 768 (portrait)
┌─────────────────────────────────────────────────────────┐
│ Today, Friday Oct 30                ● Open till midnight│
│ ┌ 3 low in stock ┐ ┌ FNM Oct 23 not reported ┐ ┌ 2 preorders arrived ┐   ← reminder chips (links)
│ [6 PM Chaos Draft 5 of 24 signed up] [7 PM Draft FNM 28 of 28 signed up, 3 waiting] [7 PM Nexus Nights Walk-in]
├─────────────────────────────────────────────────────────┤
│ Draft FNM · 7 PM · $20         Checked in 18 of 28 · Paid 15 · Waitlist 3    (no middots in build: separate stats)
│ [ Find a name…                                   ]  [Enter results]
│ ┌──┐ Sam B.          Wizards ID 9001370   [Not paid|Door|Online|Comped|Credit] [⋯]
│ │✓ │ Riley K.        —                     [ … ]
│ └──┘ … 64px rows, checked rows tinted --ok-bg with "Checked in" text
│ Waitlist                                                    
│  #1 Jordan K.   signed up Oct 27 6:10 PM        [Move in]   
├─────────────────────────────────────────────────────────┤
│ [ Walk-in name…              ] [Add and check in]          ← sticky bottom (above tab bar)
└─────────────────────────────────────────────────────────┘
```

- Opens on the event that's on now or starts next today; tomorrow's first event if nothing is left.
- Event buttons say the count in words ("28 of 28 signed up, 3 waiting"; P1.3: "0/28 of 28 +3" needed decoding).
  Check-ins are in the stat row under the title.
- Phone (under 600px): reminder chips scroll sideways in one row and the open-now pill is left to the top bar, so the
  roster and the sticky walk-in bar fit on the first screen.
- **Row:** a 56x56 check button (empty box / filled green check + "Checked in" visually hidden or visible at 768+),
  name (bold), player ID, sign-up time small; payment: segmented control of five 48px buttons at 600+ with short labels
  "Unpaid / Door / Online / Comped / Credit" (full label as the tooltip and in the toast), a native select under 600 with
  the full labels "Not paid / At the door / Paid online elsewhere / Comped / Store credit" (D3). The check button shows
  "Check in" / "Checked in" at 14px from 768 (88px wide). Row menu (⋯):
  "Cancel sign-up", "Edit name or contact", "Show contact" (contacts are hidden by default: privacy at a public counter).
- Tapping check-in toggles at once; toast "Sam B. checked in. Undo".
- **No-show** (one tap, Undo, promotes the waitlist): section 15.7.
- **Cancel** a registered player: toast "Riley K. cancelled. Jordan K. moved in from the waitlist. Undo" (auto-promote,
  event is full: two buttons replace one: "Add to waitlist" (the primary) and "Seat anyway (29 of 28)" (secondary, asks "Seat anyway?" before it seats; R10). The toast sits above the walk-in bar (R11), Unpaid is an outlined segment with no fill (R13), and an event past its start with fewer than the minimum shows "Started with 5 (min 8)" with "Run it" and "Cancel this date" (R19).
- **Walk-in add:** name only (contact optional), adds as checked in and "At the door" payment preset (editable). If the
  event is full: two buttons replace one: "Add to waitlist" and "Seat anyway (29 of 28)".
- **Walk-in-only events:** no list; a big headcount counter (- 56px, number 3rem, + 56px) "Players tonight" plus an
  optional "Add a name" for results; the headcount feeds results.
- **Enter results** (also in the roster): opens the results panel (9.4).
- Empty: "Nothing on today. The next event is Pauper Night, Wednesday at 7 PM." + "Make a one-off event".

### 9.3 Events: list and editor

**List** (`admin/events.html`):
- Header "Events" + primary "New event". Game chips (same as public) + search.
- **Coming up** (open) and **Already happened** (VFW `<details>` with a count) sections.
- Row per series: band in game colour, title, repeat summary ("Every Wednesday, 7 PM"; "1st Sunday of the month, 10 AM";
  "3 dates: Nov 6, 8, 8"; "Friday Oct 30, 6 PM"), fee, seats, sign-up mode in words, next date with its count ("Next:
  Fri Oct 30, 28 of 28, 3 waiting"), switch "Showing on the website".
- Expand a row: **Next dates** (8): each date with its count and actions "Roster", "Change this date", "Cancel this
  date" (cancelled dates show the stamp and "Bring it back"), plus "Copy post text" (section 15.3). "Change this
  date": start time, seats, note (the note makes the public "Changed" tag), all for that date only.

**Editor, template first** (`admin/events.html#new`):
1. **What game?** 8 big tiles (icon, name; 2 columns phone, 4 tablet).
2. **What kind of event?** templates for that game, each showing what it fills, e.g. for Magic: "Draft night: $20, 28
   seats, sign up here, waitlist, EventLink, 3 boosters per seat", "Commander night: free, walk in", "Pauper: $10, 28
   seats", "Standard Showdown: $10, walk in", "Pre-Modern: $10, walk in", "Prerelease: $50, at the counter, 3 slots",
   "RCQ: $20, 32 seats, needs 8, doors 1 hour early", "Learn to play: free, kids welcome", "Start blank". Staff-saved
   templates appear first with a "Yours" tag. Pokemon: League night, League Cup, League Challenge, Prerelease, Learn
   to play. cEDH: Championship Series (1st Sunday, TopDeck), 5K, Redemption, Weekly. Riftbound: Nexus Nights, Summoner
   Skirmish (2nd Saturday), Prerelease. Warhammer: Open tables, 40k event, Kill Team, Painting lesson.
3. **The form**, pre-filled, in these groups (one column phone; two columns of fields at 1024 with a live **card
   preview** on the right, the real `MG.eventCard` output; on phone, "Preview the card" expands under the form):
   - *Basics:* Name; Game; Format.
   - *When:* First date; Starts; Ends (optional); Doors open (optional); **Repeats**: Does not repeat / Every week on
     {weekday} / Every month on the {1st, 2nd, 3rd, 4th, last} {weekday} / On these dates (add date + time rows);
     Ends: Never / On {date}. A sentence under the group reads it back: "Every Friday at 7 PM, starting Oct 30."
   - *Entry and seats:* Entry fee ($, "0 means free"); Seats ("Leave empty for no limit"); Minimum players to run;
     **How players sign up** (visible label over radio cards with a one-line explainer): Walk in, no sign-up / Sign up on this site /
     At the counter only / On another site (+ Link and Button text, e.g. "Sign up online"). Waitlist when full
     (checkbox, on). Sign-ups close: At the start time / {n} hours before.
   - *Official tool (D2):* Tool (EventLink, Play! Pokemon, Bandai TCG+, KONAMI, Ravensburger Play Hub, PlayRiftbound,
     Melee, Best Coast Pairings, TopDeck, Other), Link, Event code.
   - *For players:* Prizes; What to bring; Description; Who it's for (Beginner friendly, Ages incl. "Kids welcome",
     Play style: section 15.2); Invite only; cEDH series (when game is cEDH); Warhammer: points, round length, list
     deadline (when game is Warhammer). "Hold seats until" sits under "Sign-ups close" (15.2).
   - *Stock it uses:* rows of product + "per seat" or "fixed" + qty ("3 per seat"); shows "Reserves 84 Draft boosters
     for Oct 30" live.
   - *On the website:* Show on the website; Feature on the front page.
   - Sticky save bar: "Save event", "Save as a template", "Cancel". Errors under fields + a summary at the top on
     failed save ("2 things need fixing", each a link to the field). Required: name, game, first date, start,
     fee (0 allowed), sign-up mode; link required when "On another site".

### 9.4 Event roster (one date) and results

`admin/events.html#roster/<key>`: header (title, date, time, fee, tool link + code with Copy), stat row ("28 of 28
signed up", "3 on the waitlist", "18 checked in", "15 paid"), tabs **Signed up / Waitlist / Cancelled and
no-shows** (15.7), rows as in Today (9.2). "Copy post text" next to the tool link (15.3). Waitlist order is sign-up time; "Move up/down" arrows for staff override.

**Results panel** (after the start time, or "Enter results" in Today):
- Headcount (pre-filled from check-ins, editable); Winner; Top 4 / Top 8 names (text fields, autocomplete from the roster).
- Prizes given: product + qty rows (creates "prize" stock moves); store credit given (text or amount, pending Q4/Q6).
- "Reported to Wizards EventLink" checkbox (label uses the tool). Unreported results appear as a Today reminder.
- "Show these results on the website" switch (feeds "Lately at the shop").
- "Save results" + toast.

### 9.5 Inventory (`admin/inventory.html`)

Round 2 (R8): the − / + steppers never shrink; they stay 56 x 56 at 1024 and 1280 px and Details wraps to its own row.

```
Inventory                                  [Receive stock] [Add product]
⚠ 3 products are low. 2 will run short for upcoming events.   ← banner, links to the filter
[Search…]  (All)(Low 3)(Short 2)(Sealed)(Accessories)(Miniatures)(Paint)(Singles)  Game: [All ▾]
┌───────────────────────────────────────────────────────────────────────────────┐
│ Draft boosters, current set   ⬠ Magic                              ⚠ Short   │
│ On hand 54   Reserved 132 (FNM Oct 30: 84, Sat Draft Oct 31: 48)   Free -78  │
│ Low at 36                              [ − ] [ + ] [Count]                   │
└───────────────────────────────────────────────────────────────────────────────┘
```
- Phone: one card per product (as above). 768+: a table with columns Product, Game, On hand, Reserved, Free, Low at,
  actions; the row expands to show reservations and the last 10 moves.
- **On hand** = sum of stock moves (D7). **Reserved** = for upcoming dates in the next 14 days: fixed qty, or per seat x
  seats (sign-ups when there's no seat limit; `seatsPerDate` for counter-only prereleases). **Free** = on hand -
  reserved.
- Badges (icon + word): **Low** (warn, alert icon) when on hand ≤ low; **Short** (bad, alert) when reserved > on hand;
  **Out** (bad) at 0.
- **− / +** change by 1 at once (sale / received), toast "Draft boosters: 53. Undo". **Count**: inline number field
  "Counted [ 50 ] Save count" creates a "counted" move for the difference. **Receive stock**: product, qty, note.
- Singles: one lot row per game at most (D8), no per-card stock.

### 9.6 Preorders (`admin/inventory.html#preorders`)

- Grouped by product with the deadline from releases ("Preorders end Sun Nov 1, 6 days") and totals ("3 ordered, 2
  customers, $150 in deposits").
- Row: customer, contact (tap to call/email; hidden until tapped), qty, deposit, status segmented **Waiting / Arrived /
  Picked up / Cancelled** (icons + words), created date.
- Filter "Arrived: call these" (badge in nav) lists arrived orders with big tel/email buttons.
- "Mark all waiting as arrived" per product (toast with Undo). "New preorder": product (or new), customer, contact, qty,
  deposit.
- Empty: "No preorders yet. Add one when a customer asks at the counter."

### 9.7 Store info (P2.3)
Hours per weekday (open/close or Closed; close may be midnight or after), date overrides (date, Closed or hours, note
shown publicly), address, phone, email, links (Discord, TopDeck, Wizards locator, socials), parking note, kids/age
note, free-play line. Saving updates the strip, hours table, footer, JSON-LD and .ics location (VFW `post.js` flow).

---

## 10. Loading, empty and error states

| Where | Loading | Empty | Error |
|---|---|---|---|
| Front, This week | Server-rendered, so none in the build. Prototype: spinner + "Loading this week's events..." | Per day: "No scheduled events. Free play all day." Filter with no events: dashed panel with a shop photo (public pages; `.empty-photo`) "No Riftbound events this week. The next one is Nexus Nights on Friday, Nov 6 at 7 PM." + "Show all games" | Panel `role=alert`: "The schedule didn't load. Reload the page. If it still fails, call the shop at (215) 789-3299 for tonight's events." |
| Further out / cEDH / releases | none (server) | "Nothing big on the calendar yet." / cEDH list hidden, link to TopDeck kept / section hidden | section hidden; never an empty box |
| Photo | `--surface-2` frame + caption | caption explains what goes there | same as empty |
| Events page | none (server) | as front filter | as front |
| Sign-up | button spinner "Holding your seat..." | n/a | field errors and messages in section 8 |
| Admin lists | 3 skeleton rows (surface-2 bars, no shimmer under reduced motion) | one sentence + the action ("No sign-ups yet. Share the event link or add a walk-in.") | toast with the server's plain message + "Try again"; field errors under the field (VFW `markErr`) |
| Admin offline | | | sticky banner (9.1) |
| Event date page (15.4) | none (server) | n/a | 404 "We couldn't find that event date."; 500 "The event page didn't load..." |
| "New here?" (15.6) | none (server) | Good first nights: "No beginner nights in the next two weeks. Call the shop..." | as any server page |
| Copy post text (15.3) | none (local data) | n/a | clipboard refused: "Copy this text" dialog with the text selected |
| No-show (15.7) | Today skeleton rows | no button when everyone is checked in | rolled back + toast "Couldn't save. Riley K. is still signed up. Try again." |

---

## 11. Accessibility (WCAG 2.2 AA)

- Contrast: section 2.3. Status never by colour alone: icon + words in every state, badge and stamp.
- Landmarks: skip link to "This week"; `header`, `nav` (Main; "This week, by day"; "Show one game"), `main`, `aside`
  (demo bar only in the prototype), `footer`. Headings: h1 hero headline, h2 sections, h3 days, h4 cards.
- Each card is an `article` labelled by its title; the fee pip has a hidden "Entry:" prefix; stat boxes read as text.
- Week deck links have full `aria-label`s; captions are `aria-hidden` (duplicated in the label).
- Chips: links with `aria-current`; filter results announced via a polite live region.
- Focus: 3px ring, `--focus` colour, 3px offset; white on dark chrome (header, strip, admin bars). Never removed.
- Targets: section 2.4 (48px public, 56px admin counter actions, 48px admin floor); spacing between adjacent targets
  at least 8px.
- Motion: one load animation, reduced-motion respected. The pulse dot stops.
- Theme: follows the system; the toggle maps `<meta name="color-scheme">` back to `color-scheme` via `:root:has(...)`
  so it works without JS-only classes; stored in `localStorage` (`mg-scheme`) only when it differs from the system;
  an inline head script applies it before paint (try/catch).
- Text scale: rem everywhere; layouts tested at 200% zoom (cards reflow; stat box wraps under the button).
- Forms: labels above fields, `autocomplete` set, errors under the field with `aria-describedby` and `aria-invalid`,
  focus the first error.
- Dialogs: native `<dialog>` with `showModal()`, close button first, Esc closes, focus returns to the opener.

---

## 12. VFW reuse and where we diverge

| Area | Follow VFW | Diverge, and why |
|---|---|---|
| Admin shell | sidebar sections, current-item bar, count badges, `toast()` with Undo, `ask()` confirm, `fld`/`markErr` errors under the field, unsaved-changes bar, Coming up / Already happened | **Bottom tab bar under 1024px** instead of VFW's top "Menu" dropdown under 800px: the counter tablet is used one-handed mid-event and Today must be one tap away. **56px targets** (VFW 52): gloves-off, standing, busy. |
| Recurrence | `occurrences()` weekly / monthly / Nth weekday | add "On these dates" (prerelease slots, RCQ dates) and per-date exceptions (cancel / change / note) shown publicly as Cancelled / Updated |
| Sign-ups | volunteer shift sign-up shape (name, contact, slots, retention) | add waitlist with auto-promote, check-in, payment status, player ID |
| Open-now | `bar-hours.js` midnight-close logic and the strip | add date overrides with a public note; strip is `--band` (warm dark brown), not the VFW bar colours |
| Theme | `ThemeFab` toggle | a labelled Light / Dark switch in the header (owner, D27), two-state with system default (modern-web-guidance) |
| Fonts | Archivo self-hosted | drop Literata: one family, the width axis gives the display voice |
| Public pages | server-rendered with markers | the card component and week deck are new |
| Events calendar | hall month grid | not on public pages (players want this week, not a month); the admin list uses "Next dates" per series |
| Base polish (look A) | `global.css`: smooth anchor scroll gated on reduced motion, `touch-action: manipulation` on controls, tap-highlight and `::selection` in the accent tint, `safe-area-inset-top` on the header | the header is not sticky on Mulligan: the day headings are the sticky element while you scroll the week |
| Owner's other sites (Madison Networks, Riverside) | Madison `docs/design.md`: 12px radius for media, dark bands reserved for header / strip / footer (and here cEDH), white and cream sections alternating, a phone bottom bar for the main actions (the admin tab bar; D33 adds a static one to the public pages), field borders at 3:1 | no transparent-over-hero header and no scroll reveals: the hero is a framed photo, and the counter screens stay still. Riverside's public repo showed no design notes to borrow beyond the same Astro + server.js stack |

---

## 13. Prototype files and data (for the P1.2 coder)

- `prototype/index.html` (front page), `css/tokens.css` (all values), `css/site.css` (public styles; reuse its card,
  chip, stat box, tag, button and empty-state classes on `events.html`), `fonts/archivo.woff2`.
- `data/sample.js`: one global `window.MG_SAMPLE` shaped like D7: `store` (hours, overrides, links, parking, proof),
  `games`, `series` (weekly, nth, dates, one-off), `exceptions`, `registrations`, `results`, `releases`, `products`,
  `stockMoves`, `eventProductUse`, `preorders`, plus `window`, `demoNow` and `demoMoments` for the demo clock.
- `js/mg.js`: shared helpers to reuse on every page: `MG.now()` (honours `?now=YYYY-MM-DDTHH:MM`), `ymd`, `parseYmd`,
  `addDays`, `fmtTime`, `fmtDate`, `fmtLongDate`, `fmtFee`, `list`, `game`, `inGame`, `occurrences(series, from, to)`,
  `allOccurrences(from, to)`, `nextOf(series, from)`, `regsFor(occ)`, `seatState(occ, now)`, `hoursFor`, `openStatus`,
  `relDay`, `icon(name)`, `gameBadge`, `eventCard(occ, now, opts)`, `scheme.toggle()`. Admin pages should mutate
  `MG_SAMPLE` in memory (and `localStorage` with try/catch, P1.2) and re-render with these.
- `js/front.js`: the front page only.
- Demo clock: the concept bar links to Wednesday 4 PM (every card state visible), Friday 7:30 PM (on now, sign-ups
  closed), Monday (closed day, "Back Wednesday") and Saturday 11:30 PM (open till midnight). Without `?now=` the real
  clock is used inside the sample window (Oct 19 to Nov 29, 2026), else Wednesday 4 PM.
- Sample data sources: weekly schedule and one-offs from `mulligan-facebook.md` (the master "Weekly Events" flyer,
  checked against October's daily flyers); fees and caps for nights that also appear on the Wizards locator from
  `mulligan-public.md` (Pauper $10 / 28, Standard Showdown $10, Pre-Modern $10, FNM $20 / 28, Saturday Draft $20 / 16);
  cEDH counts from TopDeck (Nov 1: 80, Nov 7: 120, Nov 8 Redemption: 9). **Guesses, marked `feeConfirmed: false` or
  commented:** fees for Hololive, One Piece, Nexus Nights, Pokemon league, cEDH weekly, Championship Series, 5K and
  Redemption; Chaos Draft cap and minimum; 5K start time; the Nov 1 early opening; the Halloween cancellation and the
  One Piece time change (both labelled sample, to show states). People's names are fake.
- Not used from the Wizards locator: Commander/EDH open play blocks (covered by the free-play line) and Magic Academy
  (not on the store's own flyer). Owners to say whether Academy still runs (added to `OWNER-QUESTIONS.md`).

---

## 14. What may change (provisional) and what changed today

- **Provisional until the owners react (P1.4/P3.4):** the sign blue and brick (sampled from the sign and
  the brick front by eye, no file); game colours; logo artwork (a crop from their flyer until they send the original).
  Look A itself is decided (D28). Layout, components and states are not provisional.
- **Folded in from R1 (Facebook, 2026-10-26):** real weekly schedule (four 7 PM events on Wednesday, two on Thursday
  and Friday), the flyer look, the black free-play circle, prize wording, caps and minimum to run (new "Needs players"
  state), in-store pre-registration (new "Pre-register at the counter" state), last-minute changes (the "Updated" tag),
  preorder deadlines (release tiles with a countdown), the kids question (Good to know), One Piece as a chip, Gundam
  as "coming soon". Address 445 York Rd.
- **P1.3 design review (Desktop, 2026-10-26):** list and reasons in `docs/review/p1.3-design-review.md`. Spec changes:
  admin target floor (2.4), rail scroll padding (4), closed-and-full card (5.3 state 5), one label for TopDeck sign-up
  (5.8), Today event buttons in words, phone reminders row and short payment labels (9.2), "How players sign up" is a
  visible label in the editor (9.3).
- **Folded in from R2 (screenshots, 2026-10-26):** schedule on the first screen (the week deck lives in the hero), one
  action colour (red only on actions), white-diamond day numbers, a sideways chip row with counts (TopDeck), cEDH chip
  highlighted, "N registered" matching TopDeck, one real room photo slot (Mox), no script needed to see the schedule
  (server-rendered).
- **P1.3b boss-ranking additions (2026-10-26):** new section 15 (D16 to D18). Spec changes elsewhere: the "Updated"
  tag is renamed "Changed" and the card adds "Updated <date>" (5.3, 9.3); the "Kids welcome" checkbox moves into the
  editor's "Who it's for" ages choice (9.3); the sign-up reply states the arrive-by time (8); the roster tab
  "Cancelled" becomes "Cancelled and no-shows" (9.4).

---

## 15. Boss-ranking additions (P1.3b: D16, D17, D18)

From `docs/research/feature-ideas.md` "Boss ranking" (ideas 1, 2, 3, 5, 6, 7, 8, 10, 15, 19, 22) and `DECISIONS.md`
D16 to D18. Written in build order: admin first (P2.2), then public (P2.3), then the counter (P2.4). Same tokens,
components and voice as sections 2 to 9; there are no new colours. Every element below reads in both themes because it
only uses tokens from 2.1 (pairs already checked in 2.3).

**Owner rule (D20), applies to every part of this section:** anything a person typed (event name, note, age rule,
description, player names) is shown as text, never as HTML: Astro `{}` on the server, `textContent` / `.value` in the
browser. The post text (15.3) is plain text, never HTML. Links from stored data go through `safeUrl`.

### 15.1 New and reused field names (the data model for P2.2)

Reused, already in the seed (`src/content/series.json`) or the prototype (`prototype/data/sample.js`, `rules.js`):
`kidsWelcome` (series), `inviteOnly` (series), `doors` (series), exception `{ series, date, type: 'cancel' | 'change',
start, capacity, note, updated }`, registration `status` (`'in' | 'waitlist' | 'cancelled' | 'noshow'`).

| Field | On | Type | Default | Meaning |
|---|---|---|---|---|
| `beginnerFriendly` | series | boolean | `false` | "Beginner friendly" tag; lists the event on "New here?" |
| `ageNote` | series | string, max 60, or `null` | `null` | an age rule in the owner's words ("13 and up"). `kidsWelcome: true` is the "All ages" choice; never both set |
| `playStyle` | series | `'casual'` / `'competitive'` / `null` | `null` | "Casual" / "Competitive" tag |
| `arriveByMins` | series | integer, one of `0, 5, 10, 15, 30`, or `null` | `null` | seat-release time as minutes before the start, so a one-date time change moves it too. Kept only when `signup` is `'here'` or `'counter'`; saved as `null` otherwise |
| `updated` | exception | date `YYYY-MM-DD` (store time zone) | set by the server | already in the sample; the server sets it on every save of that exception (cancel, change). "Bring it back" deletes the exception |

No other new fields. Commander brackets, entry rules and loaner decks stay in `description` (D17).

### 15.2 Admin: D17 fields in the event editor (P2.2)

Two places in the existing editor form (9.3, step 3). Nothing else in the form moves.

**a) "Entry and seats" group, under "Sign-ups close"** (shown only when "How players sign up" is "Sign up on this
site" or "At the counter only"; same `data-if` mechanism as the waitlist box):

- **Hold seats until** (select, 56px): "No set time" (default, `null`) / "The start time" (`0`) / "5 minutes before" /
  "10 minutes before" / "15 minutes before" / "30 minutes before". Hint: "After this, a seat nobody has claimed can go
  to the waitlist or a walk-in. Players see it as "Arrive by"."
- Read-back sentence under it (same `.say` style and `aria-live` as the "When" sentence), with the real time:
  "Players must arrive by 6:50 PM. After that you can mark no-shows and the waitlist moves up." With "No set time":
  no sentence.

**b) "For players" group: a new block "Who it's for" between "Description" and "Invite only".** The old "Kids
welcome" checkbox becomes one of the age choices.

- **Beginner friendly** (checkbox, 56px row): "Beginner friendly. New players are welcome and someone will help them."
- **Ages** (visible label over three radio cards, the "How players sign up" style): "Not stated" (default) / "All
  ages. Kids welcome." (`kidsWelcome: true`) / "Age rule" (reveals a 56px text field "Age rule", placeholder "13 and
  up", hint "Short, in your words. Shown on the card.").
- **Play style** (visible label over a 3-button segmented control, 48px, like payment): "Not stated" (default) /
  "Casual" / "Competitive". Hint: "Mainly for Commander nights. Put the bracket or house rules in the description."

```
TABLET 768 (fields two-up where they fit)               PHONE 360 (one column)
┌ Entry and seats ─────────────────────────────────┐    ┌ Entry and seats ─────────────┐
│ Entry fee ($) [20     ]   Seats [28     ]        │    │ … (as today)                 │
│ How players sign up  (radio cards, 2x2)          │    │ Sign-ups close               │
│ [x] Waitlist when full …                         │    │ [At the start time       ▾]  │
│ Sign-ups close            Hold seats until       │    │ Hold seats until             │
│ [At the start time  ▾]    [10 minutes before ▾]  │    │ [10 minutes before       ▾]  │
│ Players must arrive by 6:50 PM. After that …     │    │ Players must arrive by 6:50  │
├ For players ─────────────────────────────────────┤    │ PM. After that …             │
│ Prizes / What to bring / Description (wide)      │    ├ For players ─────────────────┤
│ Who it's for                                     │    │ Who it's for                 │
│ [ ] Beginner friendly. New players are welcome…  │    │ [ ] Beginner friendly. New … │
│ Ages                                             │    │ Ages                         │
│ (•) Not stated  ( ) All ages  ( ) Age rule       │    │ (•) Not stated               │
│                     Age rule [13 and up     ]    │    │ ( ) All ages. Kids welcome.  │
│ Play style [Not stated|Casual|Competitive]       │    │ ( ) Age rule                 │
│ [ ] Invite only                                  │    │ Play style                   │
└──────────────────────────────────────────────────┘    │ [Not stated|Casual|Compet…]  │
                                                        │ [ ] Invite only              │
                                                        └──────────────────────────────┘
```

At 360 the three age cards stack one per row; the segmented control stays one row (three segments, 15px labels, fits
328px). At 1024 the live card preview on the right shows the new tags and the arrive-by line as you change them.

**Template defaults** (step 2): every "Learn to play" template sets `beginnerFriendly: true` and `kidsWelcome: true`;
cEDH templates and RCQ set `playStyle: 'competitive'`; "Commander night" sets `'casual'`. No template sets
`arriveByMins`: that is store policy the owners haven't stated (OWNER-QUESTIONS Q8), so it stays "No set time" until
they pick one. Template summaries add the words: "Learn to play: free, kids welcome, beginner friendly".

**Validation** (server-side; shown under the field with `aria-describedby` + `aria-invalid` and in the "N things need
fixing" summary, VFW `markErr`):

| Field | Rule | Message under the field |
|---|---|---|
| Age rule | required when "Age rule" is picked | "Write the age rule, for example "13 and up"." |
| Age rule | 60 characters or fewer | "Keep it to 60 characters. Put more in the description." |
| Ages | not both `kidsWelcome` and `ageNote` | none: the radios make it impossible; the server drops `ageNote` when `kidsWelcome` is true |
| Play style | `casual`, `competitive` or empty | "Pick casual, competitive or not stated." (only a tampered request gets here) |
| Hold seats until | one of the listed values | "Pick a time from the list." (tampered request) |
| Hold seats until | with "Doors open" set: start minus minutes is not before the doors | "That's before the doors open at 11 AM. Pick a shorter time." |

The age rule is stored trimmed, line breaks collapsed to spaces, with anything between `<` and `>` removed (the shared
`text()` cleaner every text field uses, D22); what is left is always shown as text, never as HTML.

### 15.3 Admin: "Copy post text" on each date (D18, P2.2)

**Where:** every date row in the Events list's "Next dates" (9.3), after "Roster":
`[Roster] [Copy post text] [Change this date] [Cancel this date]`; on a cancelled date `[Roster] [Copy post text]
[Bring it back]` (it copies the cancellation notice). `btn btn-2 btn-sm`, copy icon, visually hidden "for Draft FNM,
Oct 30". The roster header (9.4) gets the same button next to the tool link. At 360 the buttons wrap under the date
(as today); at 768+ they sit on the date's line.

**Text format.** One pure function `postText(occurrence, siteUrl)` in `src/lib/events.js`, tested (P2.2). Plain text
only: lines joined with `\n`; no HTML, no Markdown, no emoji, no HTML entities (an event named "R&D Night" stays
`R&D Night`). Times as `MG.fmtTime` but with plain spaces ("7 PM", "noon", "midnight"). Values are the date's own (a
one-date change wins over the series). A line whose value is missing is left out, never written as "?" or "TBA". Post text has no tags or arrive-by
line (D21). The built function is `copyText(series, date, siteUrl, exceptions)` (P2.2a); same output.

```
{title}                                       ← "Cancelled: {title}" on a cancelled date (own layout, below)
{Weekday}, {Month} {d}, {start} to {end}      ← no end set: "{Weekday}, {Month} {d}, starts {start}"
                                                 doors set: "..., doors {doors}, starts {start}" (+ " to {end}")
Changed: {note}                               ← changed date only (see below)
Entry ${fee}                                  ← fee 0: "Free entry"; fee null: line left out
{sign-up line}                                ← by sign-up mode, below
Details: {siteUrl}/events/{series-id}?date={YYYY-MM-DD}   ← "Details and sign-up: ..." when signup = here
```

Sign-up line by mode: `walkin` "Just show up. No sign-up needed." / `here` "Sign up on our website to hold a seat."
/ `counter` "Pre-register at the counter." / `external` "Sign up online: {tool.url}" (no `cta` field, D22) / invite only
"Invite only." / mode not set (two seed events have `null`): line left out.

**Changed date:** the time line uses the new time; the "Changed:" line uses the note, or, with no note, a sentence the
server writes: "Starts at 7:30 PM this week (usually 7 PM)." / "Seats changed to 20 for this date."

**Cancelled date:**
```
Cancelled: {title}
{Weekday}, {Month} {d}
{note}                                        ← left out if none
Next one: {Weekday}, {Month} {d}, {start}     ← next date that isn't cancelled; left out if none
Details: {url of the cancelled date's page}
```

`{siteUrl}` is the configured public origin (the one the canonical links and `sitemap.xml` use); the domain is still
open (Q14). The link always names the date, so a pasted post points at that night, not the series.

**Examples from the real seed** (`src/content/series.json`; the domain shown as `<site>`):

```
Draft FNM
Friday, October 30, starts 7 PM
Entry $20
Just show up. No sign-up needed.
Details: https://<site>/events/fnm-draft?date=2026-10-30
```
```
Riftbound Second Saturday Summoner Skirmish
Saturday, November 14, doors 11 AM, starts noon
Entry $10
Sign up online: https://tinyurl.com/RBMulliganGames
Details: https://<site>/events/rb-skirmish?date=2026-11-14
```
Null fee (seed "Tabletop Wednesday", `fee: null`): no "Entry" line. Cancelled (the prototype's sample exception, not a
real cancellation):
```
Cancelled: Pokemon League Night
Saturday, October 31
No league on Halloween. Back next Saturday.
Next one: Saturday, November 7, 6:30 PM
Details: https://<site>/events/pokemon-sat?date=2026-10-31
```

**Feedback:**
- Copied: the button turns to a check icon + "Copied" for 2 seconds (fixed width, no layout jump), and the toast
  (`role="status"`) says "Post text for Draft FNM, Oct 30 copied. Paste it into Facebook, Discord or Google." With a
  missing value it adds one sentence: "No entry fee is set, so the post leaves it out." / "No end time is set. Google
  shows events without one as all day."
- Clipboard fails (not a secure page, permission refused, old browser; `U.copy` reports `false`): a dialog "Copy this
  text" opens with the text in a read-only `<textarea>` (filled through `.value`), 8 rows, already selected, hint
  "Press and hold the text, then Copy. On a keyboard: Ctrl+C." and one button "Done". Focus goes to the textarea; Esc
  or "Done" closes it and focus returns to the button.
- No loading state: the text is built from data already on the screen.

### 15.4 Public: one page per event date (D16, P2.3)

**URL:** `/events/<series-id>?date=YYYY-MM-DD`; when a series has two slots on one day (Star Trek Prerelease, Nov 8),
also `&time=HHMM` (`/events/startrek-prerelease?date=2026-11-08&time=1500`). `<link rel="canonical">` is that same URL
with its parameters. `/events/<series-id>` without a date redirects (302) to the next date that isn't cancelled.
Server-rendered (D11); works without JS.

```
PHONE 360                      TABLET 768                          DESKTOP 1280
┌────────────────────────┐     ┌────────────────────────────────┐  ┌──────────────────────────────────────────────┐
│ strip + header         │     │ strip + header                 │  │ strip + header                               │
│ < All events           │     │ < All events                   │  │ < All events                                 │
│▬▬▬▬▬ game band ▬▬▬▬▬▬▬▬│     │▬▬▬▬▬▬▬▬ game band ▬▬▬▬▬▬▬▬▬▬▬▬▬│  │▬▬▬▬▬▬▬▬▬▬ game band ▬▬▬▬▬▬▬▬▬▬│               │
│ Draft FNM        ($20) │ h1  │ Draft FNM                ($20) │  │ Draft FNM              ($20) │ ┌ ticket ───┐ │
│ ⬠ Magic ◆ Draft, newest│     │ ⬠ Magic ◆ Draft, newest set    │  │ ⬠ Magic ◆ Draft, newest set  │ │ stat box  │ │
│ Friday, October 30     │     │ Friday, October 30             │  │ Friday, October 30           │ │ Full,     │ │
│ 7 PM to 11 PM          │     │ 7 PM to 11 PM                  │  │ 7 PM to 11 PM                │ │ 3 waiting │ │
│ [status banner, if any]│     │ [status banner, if any]        │  │ [status banner, if any]      │ │ Arrive by │ │
│ [Beginner friendly]    │     │ [Beginner friendly][Kids       │  │ [tags]                       │ │ 6:50 PM … │ │
│ [Kids welcome][Casual] │     │  welcome][Casual]              │  │ Prizes  …                    │ │ [Join the │ │
│ ┌stat box┐             │     │ ┌stat box┐ [Join the waitlist] │  │ Bring   …                    │ │ waitlist] │ │
│ [Join the waitlist   ] │     │ Arrive by 6:50 PM or your …    │  │ Ages    …                    │ │ (sign-up  │ │
│ Arrive by 6:50 PM or … │     │ (sign-up form, when opened)    │  │ Official tool …              │ │  form)    │ │
│ (sign-up form)         │     │ Prizes / Bring / Ages / Play   │  │ Other dates …                │ └───────────┘ │
│ Prizes … (dl stacked)  │     │  style / Official tool         │  │ [Add to calendar][Directions]│ sticky, 22rem │
│ Other dates …          │     │  (dl, term and value side by   │  │ address + parking            │               │
│ [Add to calendar]      │     │  side)                         │  │ New here? line               │               │
│ [Directions]           │     │ Other dates …                  │  └──────────────────────────────────────────────┘
│ address + parking      │     │ [Add to calendar] [Directions] │
│ New here? line         │     │ address + parking, New here?   │
└────────────────────────┘     └────────────────────────────────┘
```

- The prototype's detail dialog (section 7) becomes this page: h1 is the event name in the card's name bar (bar tint,
  cost pip); date and time are two lines (condensed, `--t-lg`). The facts list is a `<dl>`: Prizes, Bring, Ages ("All
  ages. Kids welcome." or the age rule), Play style ("Casual" / "Competitive"), Official tool (+ event code with
  Copy), Description, Other dates. Rows with no value are left out.
- Action area = the card's state (5.3) and its action. "Sign up" / "Join the waitlist" go to the sign-up form (section
  8), which sits right under the action on phone and tablet and inside the ticket at 1024+ (ticket: `--surface`,
  `--lift`, `--r-card`, sticky at top 16px, 22rem wide). Without JS the form is simply there, open.
- **Arrive by** (when `arriveByMins` is set and signup is here / counter): one line under the action, clock icon,
  `--t-sm`: "Arrive by 6:50 PM or your seat goes to the next person on the waitlist." Without a waitlist: "Arrive by
  6:50 PM or your seat may go to a walk-in."
- **Beginner-friendly** events end with: "First time at Mulligan? Read New here?" (link to 15.6).
- **Other dates:** the next 6 dates of the series after this one, as links ("Fri Nov 6"). A cancelled date is struck
  (`<s>`, `--ink-2`) and followed by the word "cancelled" in `--bad` (the word is what screen readers hear; `<s>` is
  not announced): "~~Sat Oct 31~~ cancelled". It stays a link (its page says why). A changed date adds "changed". The
  date you're on is not listed.
- JSON-LD (one `Event`): `eventStatus` EventScheduled; EventCancelled on a cancelled date (all other properties kept);
  EventRescheduled with `previousStartDate` when a one-date change moved the start. `offers.availability`: InStock
  (open, needs players, walk-in), LimitedAvailability (few seats), SoldOut (full or waitlist); `offers.price` 0 when
  free; no `offers` when the fee is null. **No Event JSON-LD on invite-only dates** (Google: events must be open to
  the public).

**Status banner** (between the time and the tags; `role="note"`; 3px left border, `--r-box`, icon + words):

| State | Banner | Rest of the page |
|---|---|---|
| Cancelled | `--bad-bg`, `--bad` border, circle-x: "**Cancelled.** No Pokemon League Night on Saturday, October 31." + the note on its own line + "Updated Oct 24." (`--ink-2`) + link "Next one: Saturday, November 7" | the card's Cancelled stamp by the title; no action, form or arrive-by; Add to calendar gives the cancelled VEVENT; the page stays up (and in the sitemap) until the date passes |
| Changed (exception type change) | `--warn-bg`, `--warn` border, pencil: "**Changed for this date.**" + the note, else the server's sentence ("Starts at 7:30 PM this week (usually 7 PM).") + "Updated Oct 25." | the time line shows the new time |
| Past date | `--surface-2`, `--line-strong` border: "This date has passed." + link "Next one: Friday, November 6" | no action or form; not in the sitemap |
| Scheduled | no banner (no "Confirmed" label: noise, Boss ranking #2) | |

"Updated <date>" reads "Updated today" / "Updated yesterday" / "Updated Oct 24" (from `exception.updated`, store time
zone). Text on `--bad-bg` and `--warn-bg` is `--ink` (14:1 or more in both themes); the coloured word is the bold
lead-in.

**Other states:** full, waitlist, sign-ups closed, needs players, few seats and open are the card states (5.3) in the
stat box and action. Loading: none (server-rendered); the sign-up form has its own (section 8). Unknown series, or a
date that isn't one of its dates: 404 page with the normal header, "We couldn't find that event date." + "See all
events" (+ "Next one: ..." when the series exists). Server error: 500 page "The event page didn't load. Reload the
page, or call the shop at (215) 789-3299."

### 15.5 Public: D17 tags and arrive-by on the event card (P2.3)

The card (5.3) gets the new tags in its tag row and one arrive-by line. Tag order: **On now**, **Changed**, then
**Beginner friendly** (sprout icon), **Kids welcome** (existing kid icon) *or* the age rule (info icon, text as typed,
e.g. "13 and up"), **Casual** (mug icon) / **Competitive** (trophy icon), **Invite only**. The D17 tags are neutral:
`--surface-2` fill, `--ink` text, 1px `--line-strong` border, 6px radius, `--t-xs`; only On now (green) and Changed
(`--highlight`) keep colour. Tags wrap; at 360 a card with four tags takes two tag lines, never truncated. New icons (sprout,
info, mug, trophy) are simple generic shapes like the rest of the set.

The "Updated" tag (5.3, 9.3) is renamed **Changed** (same highlight + pencil) to match the page banner and Boss ranking #2,
and the note ends with the date in `--ink-2`: "[✎ Changed] Starts at 7:30 this week. Updated Oct 25." A cancelled
card's note also ends "Updated Oct 24."

```
│ ◷ 7 PM to 11 PM                                 │
│ ⏲ Arrive by 6:50 PM to keep your seat.          │ ← signup here/counter with arriveByMins only; --t-sm, --ink-2
│ [Beginner friendly] [Kids welcome] [Casual]      │ ← each with its icon
```

The arrive-by line shows in every state except Cancelled, Walk-in only and External (it matters to people already
signed up even after sign-ups close). The collapsed weekly card (section 7) shows it too. Further out rows (5.8) show
no tags (one line per series).

### 15.6 Public: "New here?" page (P2.3; feature ideas 5, 15, 19)

**URL** `/new-here`. Linked from the front page's "Good to know" block (first line: "New here? Start here."), the
footer, and every beginner-friendly event page (15.4). Same strip, header and footer; no hero. One column, max 70ch,
left-aligned. 768+: an "On this page" list of section links under the lede; 1024+: that list becomes a sticky left
rail (14rem) beside the text. h1 "New here?", an h2 per section with the day-header diamond (5.5 shape, no number) as
a small bullet.

**Rule: no store policy is invented.** A section or sentence marked **TODO** below is **not rendered** until the owners
answer OWNER-QUESTIONS Q20 (or the question named). A build test fails if "TODO" reaches a public page. The text lives
in the page source like the other fixed copy (section 6) and moves to Store info later.

| # | Section (h2) | Sample copy | Source |
|---|---|---|---|
| 1 | (lede, no h2) | "Never been to Mulligan Games? Here's what to expect, what to bring and which nights are good for a first visit." | |
| 2 | Good first nights | From data: beginner-friendly events in the next 14 days, as Further out rows (date block, title link, game badge, time, fee, sign-up mode). Empty: "No beginner nights in the next two weeks. Call the shop at (215) 789-3299 to ask what's on." | `beginnerFriendly` |
| 3 | Free play | "Free play all day, every day we're open. Bring a deck and find a table." | `store.freePlay` (fb flyer) |
| 4 | What to bring | "Each event page says what to bring." General advice: **TODO Q20** | event data; Q20 |
| 5 | Borrowing a deck | **TODO Q20** (loaner or precon decks: which games, which nights) | Q20 |
| 6 | Kids and ages | "Each event shows "Kids welcome" or its age rule." Store-wide rule (age, whether an adult must stay): **TODO Q20** | D17; Q20 |
| 7 | Signing up and paying | "Some events are walk-in: just show up. Others hold a seat when you sign up on the event's page, and you pay at the store when you arrive. If an event says "Arrive by", come by then or your seat can go to the next person waiting." Any other no-show rule: **TODO Q8** | D3, D5, D6, D17; Q8 |
| 8 | Prereleases | "Prerelease seats are pre-registered at the counter. The event page shows if seats are left." Limits and priority: **TODO Q20** | fb (Star Trek: in store only); Q20 |
| 9 | Proxies | cEDH: "Up to 10 proxies, approved by a judge." Other events: **TODO Q20** | D4 (pub); Q20 |
| 10 | House rules | **TODO Q20** (code of conduct) | Q20 |
| 11 | Trade-ins | "We buy trade-ins." What, and when to bring them: **TODO Q20** | pub; Q20 |
| 12 | Getting here | address, `store.parking` ("Park in any lot next to the shop except the RISE lot."), Directions button, today's hours line | store facts (confirmed before launch, D12) |
| 13 | Still have a question? | "Call (215) 789-3299." + "Or ask in our Discord." once Q3 picks the invite | store facts; Q3 |

Free-play wording: the line keeps the store's own words, "Free Play All Day, Everyday" (decided on #2, 2026-10-27), as the section 3 heading or tag; the sample sentence stays as supporting text.

States: loading none (server); empty only in section 2 (above); error as any server page. Both themes: page tokens
only.

### 15.7 Counter: one-tap "No-show" with Undo on Today (P2.4; feature idea 8)

**When it shows:** on Today (9.2) and the roster (9.4), on rows with status `in` that are **not checked in**, from the
seat-release time (`start - arriveByMins`), or from the start time when none is set. Before that the row is as now.
Never on walk-in-only events (no list) or external sign-ups (no roster).

**Where:** in the row, between the name and the row menu, **in place of the payment control** on that row (someone
who hasn't arrived hasn't paid at the door; payment comes back the moment they're checked in). A payment already set
before they arrived shows as a small tag under the name ("Paid online elsewhere"). One tap, no confirm (Undo over
confirm, section 9). This keeps the 768 row on one line (P1.3).

```
TABLET 768, after 6:50 PM
│ [✓ Checked in] Sam B.    Wizards ID 9001370  [Unpaid|Door|Online|Comped|Credit] [⋯]
│ [  Check in  ] Riley K.  signed up Oct 27    [ ⨯ No-show ]                      [⋯]  ← btn-2, 48px, user-x icon
│ …
│ Waitlist
│  #1 Jordan K.   signed up Oct 27 6:10 PM                         [Move in]
│ ▸ No-shows (1)                                       ← <details>, closed by default
│     Pat L.   No-show, marked 6:52 PM                 [They're here: seat them]

PHONE 360
│ [ ] Riley K.             [No-show] [⋯] │   ← in the payment select's place; text label kept, 15px
```

The header stat row adds "No-shows 1" when there is at least one. Button text "No-show", visually hidden "Mark Riley
K. as a no-show".

**What a tap does** (server: `status: 'noshow'`, `checkedIn: false`, seat freed; same promote as a cancel, D6):
- Waitlist on and someone waiting: #1 moves in (`status: 'in'`, row flashes `--ok-bg` once, "Moved in from the
  waitlist" tag). Toast: "Riley K. marked no-show. Jordan K. moved in from the waitlist: call their name. Undo".
- Nobody waiting (or no waitlist): "Riley K. marked no-show. 1 seat open for a walk-in. Undo".
- **Undo** (6s, toast button): Riley back to `in`; Jordan back to waitlist #1, unless Jordan was checked in meanwhile:
  then both keep their seats and the count reads "29 of 28" (as "Seat anyway"). Toast: "Riley K. is signed up again."
- **Late arrival after the toast is gone:** "They're here: seat them" in the No-shows list checks them in if a seat is
  free; if full, the walk-in pair appears in its place: "Add to waitlist" / "Seat anyway (29 of 28)".
- Roster page (9.4): the tab "Cancelled" becomes "Cancelled and no-shows"; no-show rows carry a neutral "No-show" tag
  (user-x icon, `--surface-2`). P2.6 counts `noshow` registrations per date.

**States:** before the release time (no button); button shown; marked (row moves to "No-shows", toast); undone (row
back in place); nothing to mark (everyone checked in: no buttons, nothing extra to say); event cancelled (not on
Today; roster read-only, no button); full with waitlist (promote, above); full without waitlist ("1 seat open for a
walk-in"); loading (Today's skeleton rows, section 10); error (the change shows at once and rolls back if the server
refuses: toast "Couldn't save. Riley K. is still signed up. Try again."; offline: banner, 9.1). Both themes: tokens
only. Names are set with `textContent`.
