# Mulligan Games: design spec

Owner: Laptop designer (P1.3 review: Desktop designer). Status: **P1.1 draft, reviewed against the P1.2 prototype in P1.3; for sign-off** (2026-10-26). Built from `BRIEF.md`, `DECISIONS.md` (D1 to D14),
`docs/research/*.md` (including `mulligan-facebook.md` and the "Rendered look" screenshot notes) and the Warminster VFW admin.
The front page prototype (`prototype/index.html`) is the reference build of this spec: when the two disagree, fix one
and note it here.

Contents: 1 Concept · 2 Tokens · 3 Type · 4 Layout system · 5 Components · 6 Front page · 7 Events page and event detail ·
8 Sign-up · 9 Admin · 10 Loading, empty, error · 11 Accessibility · 12 VFW reuse and divergence · 13 Prototype files
and data · 14 What may change

---

## 1. Concept: "the flyer, made live"

The store already has a look: red flyers with a white diamond and a black "Free Play All Day Everyday!" circle, posted
one a day on Facebook (fb, "How events are announced"). Players know it. The site takes that flyer and makes it live data,
then borrows the one layout every card player reads without thinking: **the trading card**.

Three ideas, used everywhere and nowhere else:

1. **Flyer red field with a white diamond.** Only the hero is a red field. The diamond holds what's next ("Next up 7 PM,
   Draft FNM"); the black circle says "Free play all day, every day we're open". Day headers carry a small red diamond
   with the date number (the screenshot study's "white diamond day number", turned round so it reads on the page).
2. **Event cards use card anatomy.** Name bar with the fee in a round cost pip (top right, like a mana cost); a type
   line with the game and format; a text box; a stat box in the bottom right for seats (like power/toughness). The
   game's colour is the frame band. Players parse it in one glance.
3. **The week is a dealt hand.** The hero shows the next seven days as small cards dealt in a row, with game-colour
   diamond pips for each event. Days the shop is closed are **tapped**: turned sideways, dashed, "Closed". This is
   the one animated moment (the deal on load); everything else is still.

What is deliberately quiet: a cool card-stock page (not cream), navy ink, one action colour (flyer red, only for "Sign
up" and other primary actions, per the screenshot study's "one accent colour, used for the action"), one type family.
cEDH, the store's identity (D4), gets the only other dark field: a navy band with a card-back lattice.

Placeholder wordmark (D13): two cards, the back one outlined in sign blue (from the storefront sign's lettering), the
front one flyer red with a white diamond, next to "Mulligan" in condensed black and "GAMES" letter-spaced in sign blue.
It is ours, not the store's logo; the real logo replaces it when the owners allow (Q12).

Voice: plain, short, friendly; sentence case; times as "7 PM", never "19:00"; money as "$20", "Free". Say what happens:
"Sign up", "Join the waitlist", "Pre-register at the counter", "Just show up". No jargon in admin ("Seats", not
"capacity"; "Sign-ups close", not "cutoff").

---

## 2. Tokens

Source of truth: `prototype/css/tokens.css`. Colours use `light-dark()` keyed off `color-scheme`; the
`<meta name="color-scheme">` content is mapped back to the property (see section 11, theme toggle). Elements that
must stay one scheme set `color-scheme` locally: the cEDH band, open-now strip and footer are `dark`; the white day
cards and next-up diamond in the hero are `light`. That makes every token inside them resolve to the right variant
with no extra rules.

### 2.1 Colour (semantic)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#EDF0F5` card stock | `#0B1027` night | page background |
| `--surface` | `#FFFFFF` | `#151C3D` | cards, panels, visit block |
| `--surface-2` | `#F6F7FA` | `#1C2449` | stat box, cancelled card, chip counts |
| `--ink` | `#131A3A` | `#EEF1FA` | text |
| `--ink-2` | `#4B546F` | `#AAB3D4` | secondary text |
| `--line` | `#C9CFDC` | `#2E3863` | decorative borders only |
| `--line-strong` | `#7A849C` | `#7C88B8` | input borders, stat box, dashed outlines (3:1+) |
| `--act` | `#C8161F` flyer red | `#FF6B70` | the one action colour: primary buttons |
| `--on-act` | `#FFFFFF` | `#0B1027` | text on `--act` |
| `--act-hover` | `#A3121A` | `#FF8F93` | |
| `--flyer` | `#C8161F` | `#A3121A` | hero field, day diamonds (white text on it) |
| `--sign` | `#2A3BD1` | `#A3AFFF` | wordmark only |
| `--band` | `#131A3A` | `#0E1534` | open-now strip, cEDH band, footer, admin sidebar |
| `--highlight` | `#FFE27A` foil | same | "Today", "Updated" (navy text) |
| `--focus` | `#131A3A` | `#FFFFFF` | focus ring (white inside the hero) |
| `--ok` / `--ok-bg` | `#1C6B3F` / `#E3F4EA` | `#6FD49A` / `#12321F` | open seats, on now, checked in |
| `--warn` / `--warn-bg` | `#8A5300` / `#FFF3D6` | `#F2B24C` / `#3A2C10` | few seats, needs players, low stock |
| `--bad` / `--bad-bg` | `#B3141D` / `#FCE6E7` | `#FF7A7F` / `#3D1418` | cancelled, errors, short stock |
| `--wait` | `#5B3FB0` | `#C1A9FF` | waitlist |

Status is never colour alone: every status has an icon and words (section 5.3).

### 2.2 Game colours (band + icon + written name)

The game's name is always written in `--ink`; the colour only paints the card's top band, the name-bar tint (13% mix),
the cost pip's inner ring, the chip icon and the diamond pips. Icons are simple generic shapes (no publisher marks).

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
| ink on paper / surface | 14.9 / 17.0 | 16.6 / 14.7 |
| ink-2 on paper / surface / surface-2 | 6.6 / 7.5 / 7.0 | 9.0 / 8.0 / 7.2 |
| text on `--act` button | 5.9 (white on red) | 6.8 (night on coral) |
| white on `--flyer` (hero, day diamond) | 5.9 | 7.9 |
| `--act` as text on paper | 5.1 | 6.8 |
| ok / warn / bad / wait text on surface | 6.5 / 6.3 / 6.9 / 7.6 | 9.1 / 8.9 / 6.6 / 8.2 |
| navy on foil highlight | 13.3 | 13.3 |
| foil on flyer (hero "Today" outline) | 4.6 | 6.2 |
| line-strong (non-text) on surface | 3.7 | 4.8 |
| game colours (non-text) on surface | 3.8 (Pokemon, lowest) to 7.8 | 6.0 to 9.9 |
| on-band / on-band-2 on band | 15.0 / 8.2 | 15.8 / 8.6 |

The black free-play circle on red is 3.2:1 as a shape; its white text is 17:1. Anyone changing a colour re-runs these
pairs (a PowerShell snippet is enough: relative luminance, `(L1+0.05)/(L2+0.05)`).

### 2.4 Space, radius, elevation, motion, sizes

- Space (4px base): `--s1` 4, `--s2` 8, `--s3` 12, `--s4` 16, `--s5` 24, `--s6` 32, `--s7` 48, `--s8` 64, `--s9` 96 (px).
  Page gutter `--gutter` = clamp(16px, ..., 32px); content max width `--maxw` 1240px.
- Radius by role, not one value: `--r-card` 14px (the 3mm corner of a 63mm card) for cards, panels, tiles;
  `--r-ctl` 10px buttons and inputs; `--r-box` 6px stat box and tags; `--r-pill` chips and the cost pip.
- Elevation: one shadow, `--lift` (hairline + soft drop) on cards and tiles. Nothing else floats except dialogs and the
  admin toast.
- Motion: the deal-in of the week cards (520ms, `--ease-deal`, 60ms stagger, closed cards rotate to tapped at the end);
  the "On now" dot pulse; 140ms colour transitions on buttons. `prefers-reduced-motion: reduce` collapses all of it to
  the end state. No scroll reveals, no hover lifts on cards.
- Targets: public `--tap` 48px minimum for buttons, chips and nav; text links inside a sentence or a card title follow
  WCAG 2.5.8 (24px or spaced) because the card's button is the target. Admin `--tap-admin` 56px for the counter actions
  (check-in, steppers, primary and secondary buttons, inputs); 48px floor for secondary controls that come in sets
  (chips, payment segments, row menu and its items, reminder chips, tabs, `btn-sm`), with 8px between separate targets
  (segments touch, as one control). P1.3: 56px everywhere made the roster row two lines on a tablet.

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
- **Primary** `.btn.btn-act`: flyer red, white text (dark: coral, night text), 48px tall (56 in admin), radius 10.
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
paper text, `aria-current="true"`. cEDH chip has a cEDH-purple border at rest (highlighted, per the screenshot study).
Phone: one row, scrolls sideways; desktop: wraps. The Magic chip includes cEDH (cEDH is Magic; `family: 'magic'`);
the cEDH chip shows only cEDH. A visually hidden live region says "Showing Magic: 9 events this week." after a change.
A chip with 0 still shows (so you learn the game exists) and leads to the empty state (section 10).

### 5.3 Event card (the core component)

Anatomy, top to bottom (markup from `MG.eventCard()` in `prototype/js/mg.js`):

```
┌──────────────────────────────────────────────┐ ← 6px band in game colour
│ Draft FNM                              ($20) │ ← name bar: title (h4, link to detail) + cost pip ("Free" when 0)
├──────────────────────────────────────────────┤   bar tinted 13% game colour
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
  **Updated** (foil yellow, pencil icon) when a one-date change has a note; the note follows the tag.

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
Red diamond with the date number (white, condensed) + day name ("Today", "Tomorrow", then "Wednesday") + a "Today"
foil tag with the weekday when relative + meta line "Oct 28, open 2 PM to 10 PM" (with any date override note:
"Opening at 10 AM for the cEDH Championship Series"). Sticky while you scroll the day (phone: top of screen; desktop:
left rail). Closed day: dashed diamond, "The shop is closed.", compact row.

### 5.6 Week deck (hero)
Seven cards (63:88 portrait, 70x98px phone, 80x111px desktop), white with navy text in both themes: weekday ("Today"
for the first), date number, up to eight diamond pips in game colours; caption under the card "4 events" or "Closed".
Each card links to that day's section (`#d-YYYY-MM-DD`) with an `aria-label` like "Wednesday Oct 28, today, 5 events".
Today: foil outline and foil caption. Closed: transparent, dashed white border, rotated 90° and scaled 0.74 (tapped).
Counts ignore the game filter and cancelled dates. Phone: scrolls sideways.

### 5.7 Next-up diamond (hero)
Tablet and up: a white rotated square (the flyer's diamond), upright text inside: "Next up" (red, small; "Next up
tomorrow", "On now"), the time huge ("7 PM"), up to two event names + "and 2 more". Links to that day. The black
free-play circle overlaps its lower left, rotated -10°. Phone: a white ticket row with a small red diamond on the left,
same text; the free-play line becomes a black pill under it.

### 5.8 Other public components
- **Open-now strip** (navy, always dark): status dot + "**Open now** till midnight" / "**Closed now.** Opens at 2 PM" /
  "**Closed today.** Opens Wednesday at 2 PM"; address (768+); phone link ("Call" on phones under 600); Directions.
  Logic: `MG.openStatus()`, handles closes at or after midnight and date overrides.
- **Further out list** (under the week): one row per series for days 8 to 35 (big one-offs, prereleases, cEDH, RCQs,
  monthly events), "and 2 more dates" tag for short series; date block, title link, game badge, time, fee, sign-up
  mode in words. Max 6 rows, then "See every date".
- **cEDH ticket** (in the band): date block, title, long date + time + entry, primary "Sign up on TopDeck" (the same
  label as the event card, so one action has one name; P1.3) or the invite-only sentence, stat box "120 registered on TopDeck". 6px cEDH-purple left edge.
- **Release tile**: the card anatomy again, portrait: art box (lattice in the game colour + big game icon; a real
  product image later, if the owners want), name, type line (game ◆ "Preorder" / "Out now" / "Coming soon"), text box
  (note, linked prerelease dates + fee), stat box ("6 days left, preorders end Sun Nov 1"; "Last day today";
  "Preorders closed"; "On the shelf"). Phone: horizontal rail with snap (80% width tiles); 768+: grid.
- **Hours table**: Monday to Sunday rows; today's row foil with a "Today" tag; closed rows in `--ink-2`; a date
  override inside the next 7 days shows under its weekday ("Sun Nov 1: 10 AM to 10 PM. Opening at 10 AM for cEDH.").
  Note under: "Hours from public listings. The owners will confirm them before launch." (until confirmed, D12).
- **Photo slot**: a 4:3 (phone), 21:9 (tablet), 4:5 (desktop) frame with the lattice and a caption saying what goes
  there. If an image loads, it covers the frame and the caption hides; if not, the frame stays honest. In the build,
  the photo comes from admin uploads (VFW photo pipeline), with required alt text.
- **Proof list** and **Lately at the shop**: diamond bullets; each line says its source ("Source: Facebook"); results
  come from public results (`results[].public`). A dashed slot holds 2 or 3 real reviews once the owners choose them.
  No made-up quotes, ever.
- **Theme toggle**: round 48px button in the header; shows the moon in light, sun in dark; text "Switch to dark
  theme". Two-state: system default + the opposite; never stores the value that equals the system (section 11).

---

## 6. Front page (prototype: `prototype/index.html`)

Order (D1 and the brief): open-now strip > header > hero (status + next up + week deck) > This week at Mulligan >
cEDH band > New and preorders > Visit > Between events (Discord, proof, lately) > footer. The concept-only demo bar
sits above everything in the prototype and is not built.

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
its own page, same content):

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

- Above the button: "Pay $20 at the store when you arrive." (D3), or "Free." Waitlist mode adds "The event is full. Join
  the waitlist and you move in automatically if a seat opens."
- Button: "Hold my seat" / "Join the waitlist". While sending: disabled with spinner + "Holding your seat...".
- Success (replaces the form, focus moves to it, `role="status"`):
  - "**You're in.** Seat 18 of 28 is yours for Draft FNM, Friday Oct 30 at 7 PM. Pay $20 at the counter." [Add to calendar]
  - "**You're on the waitlist (#3).** If a seat opens, you move in automatically. Check this page or ask at the counter."
  - Last-seat race: "That seat just went. You're on the waitlist (#1) instead."
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
- **≥1024px:** VFW layout: navy sidebar 15rem (`--band`, always dark): wordmark + "Shop admin", sections with icon,
  label and count badge: **Today** (default), **Events**, **Inventory** (badge: low + short count), **Preorders**
  (badge: arrived, to call), **Store info**, then Security log, Account, "View the website". Current item: foil left
  bar + tinted background (VFW `aria-current` style, foil instead of brass).
- **<1024px:** top bar 56px (wordmark mark + section title + open-now dot) and a **bottom tab bar** 64px, fixed:
  Today, Events, Stock, Preorders, More (More opens a sheet with the rest). Badges on the tabs. Safe-area padding.
- Toast: bottom centre above the tab bar, navy, foil Undo button, `role="status"`.
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
- **Cancel** a registered player: toast "Riley K. cancelled. Jordan K. moved in from the waitlist. Undo" (auto-promote,
  D6); the promoted row flashes `--ok-bg` once (respect reduced motion).
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
  date" (cancelled dates show the stamp and "Bring it back"). "Change this date": start time, seats, note (the note
  makes the public "Updated" tag), all for that date only.

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
   - *For players:* Prizes; What to bring; Description; Kids welcome; Invite only; cEDH series (when game is cEDH);
     Warhammer: points, round length, list deadline (when game is Warhammer).
   - *Stock it uses:* rows of product + "per seat" or "fixed" + qty ("3 per seat"); shows "Reserves 84 Draft boosters
     for Oct 30" live.
   - *On the website:* Show on the website; Feature on the front page.
   - Sticky save bar: "Save event", "Save as a template", "Cancel". Errors under fields + a summary at the top on
     failed save ("2 things need fixing", each a link to the field). Required: name, game, first date, start,
     fee (0 allowed), sign-up mode; link required when "On another site".

### 9.4 Event roster (one date) and results

`admin/events.html#roster/<key>`: header (title, date, time, fee, tool link + code with Copy), stat row ("28 of 28
signed up", "3 on the waitlist", "18 checked in", "15 paid"), tabs **Signed up / Waitlist / Cancelled**, rows as in
Today (9.2). Waitlist order is sign-up time; "Move up/down" arrows for staff override.

**Results panel** (after the start time, or "Enter results" in Today):
- Headcount (pre-filled from check-ins, editable); Winner; Top 4 / Top 8 names (text fields, autocomplete from the roster).
- Prizes given: product + qty rows (creates "prize" stock moves); store credit given (text or amount, pending Q4/Q6).
- "Reported to Wizards EventLink" checkbox (label uses the tool). Unreported results appear as a Today reminder.
- "Show these results on the website" switch (feeds "Lately at the shop").
- "Save results" + toast.

### 9.5 Inventory (`admin/inventory.html`)

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
| Front, This week | Server-rendered, so none in the build. Prototype: spinner + "Loading this week's events..." | Per day: "No scheduled events. Free play all day." Filter with no events: dashed lattice panel "No Riftbound events this week. The next one is Nexus Nights on Friday, Nov 6 at 7 PM." + "Show all games" | Panel `role=alert`: "The schedule didn't load. Reload the page. If it still fails, call the shop at (215) 789-3299 for tonight's events." |
| Further out / cEDH / releases | none (server) | "Nothing big on the calendar yet." / cEDH list hidden, link to TopDeck kept / section hidden | section hidden; never an empty box |
| Photo slot | lattice + caption | caption explains what goes there | same as empty |
| Events page | none (server) | as front filter | as front |
| Sign-up | button spinner "Holding your seat..." | n/a | field errors and messages in section 8 |
| Admin lists | 3 skeleton rows (surface-2 bars, no shimmer under reduced motion) | one sentence + the action ("No sign-ups yet. Share the event link or add a walk-in.") | toast with the server's plain message + "Try again"; field errors under the field (VFW `markErr`) |
| Admin offline | | | sticky banner (9.1) |

---

## 11. Accessibility (WCAG 2.2 AA)

- Contrast: section 2.3. Status never by colour alone: icon + words in every state, badge and stamp.
- Landmarks: skip link to "This week"; `header`, `nav` (Main; "This week, by day"; "Show one game"), `main`, `aside`
  (demo bar only in the prototype), `footer`. Headings: h1 hero headline, h2 sections, h3 days, h4 cards.
- Each card is an `article` labelled by its title; the fee pip has a hidden "Entry:" prefix; stat boxes read as text.
- Week deck links have full `aria-label`s; captions are `aria-hidden` (duplicated in the label).
- Chips: links with `aria-current`; filter results announced via a polite live region.
- Focus: 3px ring, `--focus` colour, 3px offset; white inside the red hero. Never removed.
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
| Open-now | `bar-hours.js` midnight-close logic and the strip | add date overrides with a public note; strip is navy, not the VFW bar colours |
| Theme | `ThemeFab` toggle | a header button, not a floating one; two-state with system default (modern-web-guidance) |
| Fonts | Archivo self-hosted | drop Literata: one family, the width axis gives the display voice |
| Public pages | server-rendered with markers | the card component and week deck are new |
| Events calendar | hall month grid | not on public pages (players want this week, not a month); the admin list uses "Next dates" per series |

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

- **Provisional until the owners react (P1.4/P3.4):** the exact flyer red and sign blue (taken from their flyers and
  sign by eye, no file); game colours; the placeholder wordmark (replaced by their logo with permission, Q12); the
  photo slots (their room photo, Q12). Layout, components and states are not provisional.
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
