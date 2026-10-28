# Round 8: a new look for the public pages (D55, D60)

Designer spec, 2026-10-28 (Desktop, taking over from the Laptop, which ran out of tokens). It is written against the
**build** (`src/pages/*.astro`, `src/lib/render.js`, `src/styles/global.css`), not `prototype/`, and is built straight into
`src/`. Inputs: D55 (owner), `docs/research/wix-templates.md` (Laptop, Direction B), `docs/research/wix-templates-desktop.md`
(Desktop), DESIGN.md, the owner's VFW / Riverside / Madison sites, and the 44 build shots in `docs/review/build-shots/`.
Admin is not part of round 8.

## 1. Rationale

The owner asked for the tabs to "look a little bit better" and to "start reimagining the front page" from Wix templates.
Both research passes agree on the shape: the Laptop's Direction B, "Card-table warm" (cream, a warm serif display face over
Archivo, a full-bleed video hero, dated rows in one cream card, a brick "Tonight" band, one page head on every tab), and
the Desktop's shop-template order (hero, what's on, play by game, a short promise row, reviews, visit, join). This spec
merges them. The front page gets fewer kinds of boxes and a clearer order. Every tab gets the same calm head. The new
look comes from type and order, with no new colours and no effects.

**Stays:** the D28 identity (brick header with coursing, the logo on its white sign plate, sign blue as the one accent,
cream and charcoal, game colours only as dots, rules and icons) and every D28 colour token. Also staying: the D54 montage
hero (video, scrim, strip, holds), the D46 round theme button bottom-right, the D51 headline "Shuffle up. Everyone's welcome."
and its sub-line, the status chip, the D51 plain week strip, the D33 phone bar, the D34 nav, the footer, the events page
filters, the date page layout (D37 6), and the click-to-load clips (D47).

**Changes:**
1. Display type: **Fraunces** for page titles and section heads. Archivo stays for everything else (section 4).
2. Front page order (section 2). There is a Tonight band when something's on. "This week" becomes a lineup of up to 3
   big cards above one card of dated rows. A "Play by game" tile row replaces the game chips on the home page. "Why
   players choose Mulligan" holds the promises and the reviews. Visit becomes "Find your table". "Between events"
   becomes "Join in".
3. Things said once (D37): the hero loses its second button (the clip opens from the strip). The featured-clip row under
   the hero folds into "Clips from the shop", since the hero itself is the video now (D55). Visit loses "Good to know",
   because every line in it is said elsewhere.
4. One page-head pattern for every tab (section 3).

Not taken: the Laptop's brick page-head band, because the header is already brick and a second brick field doubles it
and pushes content down on phones. Also not taken: a third, monospaced font for times (one more file for little gain),
`--tag` (too close to `--surface-2`), the 4th promise "fair trade-ins" (an opinion, and Q20 is open), marquees,
handwritten fonts and product grids.

## 2. Front page, in order

Backgrounds alternate as D37 (3) requires: video, brick, paper, surface, paper, band, paper, surface, paper, surface,
then the band footer. Section padding stays at `.sec` (4.5rem from 1024px). Every heading below is the exact copy.
The marker names are the existing `<!--mg:*-->` markers, plus one new one (`games`).

### 2.1 Hero (`.phero`, marker `hero`): video, unchanged apart from the type and one button
- Data: store hours (`chipText`), the week (`next` ticket), and the D54 video files. Nothing new.
- Copy: the chip (live), h1 **Shuffle up. Everyone's welcome.**, and the sub-line unchanged: "Welcome to Mulligan Games,
  Warminster's friendly game store: a big play room, free play every day we're open, and card nights all week. Come say hi."
- Actions: the next-up ticket (`.next`, a link, kept for D36's "next up in the first screen"; its `href` becomes `#tonight`
  when the Tonight band shows) and **one** primary button, **This week's events** → `#week`. `CLIP_BTN` (phones' "Watch a
  clip") leaves `.phero-acts`.
- Strip: the clips link shows at every width. Under 600px its label is **Watch clips**, from 600px **Watch clips from the
  shop**. It goes to `#clips` (a plain anchor, no dialog). The caption and pill rules from D53 stay.
- h1: Fraunces 600, `--t-hero` (new value, section 4), line-height 1.0, letter-spacing -0.01em, max-width 14ch, the
  existing text-shadow. At 390 it is 3 lines. At 1280 it is 2 to 3 lines in the 40rem copy column.
- 390: the hero still ends above the D33 bar at 390x844 (the D52 test). 1280: the copy sits lower-left as now.

### 2.2 Tonight (new band, only when something's on; new `tonight(ctx)` in render.js, rendered inside the `week` marker before the section)
- Data: `upcoming(ctx, today, today)`, live and not ended (the same set as the events page's Tonight). When it is empty,
  the band does not render at all: no heading and no empty state.
- Heading: **Tonight** when `now` is 5 PM or later, else **Today** (the events page rule). No lead line.
- Body: up to 4 rows, then "and N more today" linking to `/events/`. Each row has the time (Archivo 62% 900, 1.75rem), the
  title (a link to the date page), "Game · fee · seats" (`seatWords`, walk-in rows leave the seat part out, as `dayLine`
  does), and for sign-up states (open, few, needs, waitlist) one `btn btn-act` "Sign up" / `btn btn-2` "Join the waitlist"
  to `<date page>#signup`. An event on now shows the existing "On now" tag.
- Look: `id="tonight"`, `--brick` background with the header's coursing SVG (share the `.site-head` background rule).
  `color-scheme: dark` sits on the inner wrapper, so text is `--on-band`, secondary is `--on-band-2`, and buttons use the
  dark `--act`. Padding is 2rem at 390 and 3rem at 1024 and up.
- 390: the heading, then the rows stacked, and a sign-up button full width under its row. 1280: the heading in a 14rem
  left column, the rows in a 2-column grid on the right.
- When it shows, the This week card leaves today out (the events page F12 rule), and the strip's Today tile links to
  `#tonight`.

### 2.3 This week (`#week`, marker `week`)
- Heading **This week**. The lead is one line that replaces both walk-in notes: "There's always something on. Most nights
  are walk-in; a Sign up button means seats are held." Keep the link "All events and sign-ups".
- **Lineup:** h3 **Coming up**, then up to 3 big cards. The data uses the `laterRows` filter (live, not weekly, open or
  learn kinds, one per series) over today to 13 days, earliest first. If none are found, the lineup does not render. Each
  card is the existing `card(ctx, o, { photo, compact: true })` with its photo band (`photoFor`). Lineup events also stay
  in the rows below. That is the one deliberate repeat, because the rows are the full schedule.
  At 390 the cards sit on a sideways snap rail (card width 85%, `scroll-padding-inline: var(--gutter)`). From 768px they
  sit on a grid: 2 cards are 2 halves, 3 cards are 3 columns.
- **Week strip:** the D51 `deck()` stays, unchanged, above the rows.
- **Game chips: removed from the home page.** "Play by game" (2.4) is the home page's way to pick a game. The events page
  keeps its chips (D14). `week()` keeps reading `?game=` so old links still filter. `site.js` already returns when
  `#chips` is missing.
- **Rows card:** one `--surface` card (`--r-card`, `--lift`, no inner padding) holding every day as a day section. The day
  head (`.day-h` with the diamond, the name and the hours meta) is followed by its event rows (`dayLine` + its thumb),
  each row with a 1px `--line` rule between. Today and the next day no longer use photo cards; every day is rows. Closed
  runs stay as the quiet `dayOff` line. A row whose state is open, few, needs or waitlist gets one `btn btn-2 btn-sm`
  ("Sign up" / "Join the waitlist") on the right, linking to the date page. Other rows have no button, since walk-in is
  said once in the lead.
  At 390 the day head sits above its rows, and each row is time (4.5rem column), title, and bits under the title. The
  thumb is hidden under 600px and the button wraps under the bits. At 1280 a 13rem left column holds the day head and
  the rows sit on the right. Rows are at least 56px tall with 12px 20px padding.
- **Further out | Lately at the shop:** the existing `.later` aside, and `lately()` (moved here from the community
  section, marker `lately` moves with it). They are 2 columns from 1024px and stacked below that. Further out leaves out
  any series already in the lineup. With no results, Lately does not render and Further out takes the full width.

### 2.4 Play by game (new, `#games`, new marker `games` → `gameTiles(ctx)`; the baked fallback is the same tiles without counts, built in index.astro from games.json)
- Heading **Play by game**, lead "Pick a game to see all its nights."
- Data: `ctx.games` (shown ones, chip order) and this week's live count per game (the same `inGame` count the chips use).
- Tile: a link to `/events/?game=<id>` (keeps `?now=`). It has the game icon (24px, game colour), the name (Archivo 72%
  800, 1.125rem) and "3 this week" / "1 this week" / "Nothing this week" (`--t-sm`, `--ink-2`). The tile is `--surface`,
  `--r-card`, with a 3px game-colour rule on top (the DESIGN 2.2 pattern), min-height 88px, and no photo.
- 390: 2 columns (8 tiles, 4 rows). 768: 4 columns. 1024 and up: 8 in one row.

### 2.5 Meet the shop (Q31): a reserved slot, nothing is built now
It goes here, after Play by game (Q31 says "under This week"), once the owners send their own words and a photo. Until
then there is no markup, no placeholder and no invented story. When Q31 is answered, it becomes one paper section with a
photo and up to 80 words.

### 2.6 New and preorders (`#new`, marker `releases`): unchanged apart from the type
The heading and the note stay as they are, so do the TCGplayer line and the nav link "Preorders" → `#new`.

### 2.7 cEDH at Mulligan (`#cedh`, markers `cedh-live`, `cedh`, `turnout`): kept for D4
The h2 becomes Fraunces 600 at `--t-2xl`. The current 4.75rem condensed size goes, so it matches the other sections. The
copy, facts, photo, tickets and turnout stay.

### 2.8 Why players choose Mulligan (`#why`, replaces "What people say" inside the community section)
- Heading **Why players choose Mulligan**. The lead is the rating, said once and linked: "4.9 on Google from 81 reviews"
  (`proof.reviews.rating`, `count`, `url`).
- **Promises:** 3 items of fixed copy in index.astro, taken from the Google review themes (`docs/research/social-assets-2.md`:
  staff ~35 reviews, selection ~30, newcomers and kids) and from store facts. Each has an icon, a short Archivo 800 title
  and one line:
  1. `cards` (one new constant path in `icons.js`: two overlapping rounded cards, 24px grid, stroke 2) **Singles and sealed**: "A big Magic and Pokemon singles case, with sealed product on the shelf."
  2. `users` **Staff who know the games**: "Friendly, patient help, from your first deck to your next tournament."
  3. `sprout` **Easy to start**: "Learn-to-play nights, and kids are welcome at Pokemon Learn to Play. [New here? Start here.]"
     The last sentence is built from `store.kids`, and the item is left out without it. The link goes to `/new-here/`.
- **What people say:** h3 **What people say**, then the 3 `proof.reviews.items` as quotes (Archivo 1.125rem / 1.5, with
  the name and age under each in `--t-sm` `--ink-2` and a 3px `--line-strong` left rule). There are no card boxes and
  no carousel (D39).
- 390: everything stacked. 1024: promises in 3 columns, quotes in 3 columns.

### 2.9 Find your table (`#visit`, markers `visit`, `hours`)
- Heading **Find your table**, lead "Look for the sign on the roof. The door is right below it." (moved from
  `.visit-small`). The nav link "Visit" → `#visit` stays.
- 2 columns from 768px: **Hours** (the `hours()` table) and **Find us** (address, Directions, Call, Parking). The "Good
  to know" column goes, because each line is said elsewhere: New here and kids are in 2.8, free play is in the hero
  sub-line, and preorders are in 2.6.
- Surface band, no photo.

### 2.10 Clips from the shop (`#clips`): data `clips.json`, unchanged apart from order and type
`FEATURED` clips come first in the rail, then the rest in file order. The `.feat` section under the hero and its markup
are removed, and `clips.js` still loads (the rail needs it). The privacy line stays.

### 2.11 Join in (`#community`, marker `discord`)
- Heading **Join in** (was "Between events"). The lead stays as the existing Discord / no-Discord sentence. The Discord
  button and the socials list stay.
- 390: stacked. 1280: the lead on the left and the actions on the right in one row.

### 2.12 Length
The page must not be longer than the round-7 build shots (`home-1280-light` 7,582px, `home-390-light` 9,000px). The
photo-card days becoming rows pays for the new sections.

## 3. One page head for every tab

**Pattern `.pg-head`** (a `<header>`, the first thing in `<main>`'s wrap):
- An optional kicker `.pg-k`, **only when it is a fact** (DESIGN 3: no decorative labels). Today only the date page has
  one. It is Archivo 800, `--t-sm`, letter-spacing 0.04em, uppercase, in `--mark`.
- `h1`: Fraunces 600, `--t-page`, line-height 1.05, letter-spacing -0.01em, max-width 20ch, `text-wrap: balance`.
- `.pg-lede`: one or two sentences, Archivo 400, `--t-lead`, line-height 1.5, `--ink-2`, max-width 60ch.
- It closes with a 1px `--line` rule across the wrap. Padding-block is 2rem / 1.5rem at 390 and 3.5rem / 2rem from 1024px.
  It sits on `--paper`, with no photo and no band.
- It replaces `.ep-head` (events, cedh), the bare `h1` + `.nh-lede` (new here, privacy) and the dashed `.empty.lattice`
  box (404, missing date).

| Tab | Kicker | h1 | Lede | Body gets (layout only, no new features) |
|---|---|---|---|---|
| Events (`events()` in render.js) | none | Events | "Every game night at the shop. Pick a game, check the seats, pay at the store." (as now) | Chips and the format row stay. The walk-in note is said **once**, under the format row (it is in Tonight and Every week today). The `ep-sec` h2s (Tonight, Special events and tournaments, Every week) move to Fraunces 600 `--t-2xl`. |
| A date page (`eventPage`) | the date kicker (`.dp-kick`, already a fact: "Friday, October 30 · Tonight") restyled as `.pg-k` | the event title (`.ev-title` in `.dp-name`), Fraunces 600 clamp(2rem, 1.6rem + 1.8vw, 3rem) | none (the ticket box speaks) | Photo, ticket, About, Other dates, Getting here, Also on and Results stay, with their h2s in Fraunces at 1.5rem. `eventMissing` uses the pattern: h1 "We couldn't find that event date.", lede "It may have moved or finished.", then the existing buttons. No dashed box. |
| cEDH (`cedh.astro`) | none | cEDH at Mulligan | Shortened: "A monthly cEDH tournament, with 5K weekends, a Sunday Redemption and a November invitational. Forty to 120 players an event." | From 1024px, "Next events" and "Entry and parking" sit side by side (7fr / 5fr), the two points tables sit side by side, and Turnout and Results sit side by side. The Rules block folds into "Entry and parking" as one `dl` (Entry, Parking, Proxies), and its h2 becomes **Entry, parking and proxies**. |
| New here? | none | New here? | as now | The TOC sidebar and diamonds stay, and the h2s go to Fraunces 600 1.5rem. |
| Privacy | none | Privacy | as now | `det-list` unchanged, h2s in Fraunces 600 1.5rem, the text column max 70ch. |
| 404 | none | We couldn't find that page. | "Try the events list or the front page. Or come by or call." | The hours (marker `hours`), then `.nf-acts` as now. No dashed box. |

## 4. Type

- **Display: Fraunces** (Undercase Type, SIL Open Font License 1.1). It is a soft, warm "old style" serif that reads like
  a shop sign or a menu and pairs with Archivo's grotesk. Bricolage Grotesque was considered and rejected, because a
  second grotesk would blur into Archivo. DM Serif and Literata were left out because Riverside and VFW already use them.
- **One file:** the static Latin instance, weight 600 normal, as woff2 (for example `fraunces-latin-600-normal.woff2`
  from the `@fontsource/fraunces` package, fetched once with `npm pack` at dev time; do **not** add it to package.json).
  Commit it as `public/fonts/fraunces-600.woff2`, with a budget of 60 KB or less.
  `@font-face { font-family: 'Fraunces'; src: url('/fonts/fraunces-600.woff2') format('woff2'); font-weight: 600; font-display: swap; }`
  and `font-synthesis: none` on display elements. Preload it in Base.astro next to Archivo. Ship `public/fonts/OFL-Fraunces.txt`
  **and the missing `public/fonts/OFL-Archivo.txt`** (DESIGN 3 asks for it; it is not in `public/fonts/` today).
  CSP `font-src 'self'` is unchanged, and nothing loads from Google Fonts.
- **Body and UI: Archivo**, unchanged (file, axes, sizes).
- **Where Fraunces goes (public selectors only):** `.phero-h`, `.pg-head h1`, `.sec-head h2`, `.cedh h2`, `.tonight h2`,
  `.ep-sec > h2`, `.dp-name .ev-title`, `.dp h2`, `.nh h2`. **Not** on h3/h4, card titles, day names, numbers, chips,
  buttons, the footer or anything in the admin. The base `h1, h2, h3, h4` rule stays Archivo because admin.astro imports
  global.css too.

| Role | Token | Font | Size | Weight | Line height |
|---|---|---|---|---|---|
| Hero headline | `--t-hero` (new value) | Fraunces | clamp(2.5rem, 1.6rem + 4.2vw, 5rem) | 600 | 1.0, -0.01em |
| Page title | `--t-page` (new) | Fraunces | clamp(2.25rem, 1.6rem + 2.8vw, 3.75rem) | 600 | 1.05 |
| Section head | `--t-2xl` (new value) | Fraunces | clamp(1.75rem, 1.3rem + 1.9vw, 2.75rem) | 600 | 1.1 |
| Sub-page h2 (date, new here, privacy) | n/a | Fraunces | 1.5rem | 600 | 1.15 |
| Lead | `--t-lead` (new) | Archivo 100% | 1.1875rem (19px) | 400 | 1.5 |
| Everything else | as DESIGN 3 | Archivo | unchanged | unchanged | unchanged |

`--font-display: 'Fraunces', 'Iowan Old Style', Georgia, 'Times New Roman', serif`.

## 5. Tokens

**There are no new colour tokens.** The new pieces use D28 tokens. Light and dark values are unchanged.
New non-colour tokens: `--font-display`, `--t-page`, `--t-lead`, plus new values for `--t-hero` and `--t-2xl`.

New colour pairs, checked with the WCAG formula (2026-10-28) and added to DESIGN 2.3:

| Pair (Tonight band on `--brick` #6B3A2C, same in both themes; inner `color-scheme: dark`) | Ratio | Needs |
|---|---|---|
| `--on-band` #F5EFE4 text | 8.10 | 4.5 |
| `--on-band-2` #CDBFB0 secondary text | 5.15 | 4.5 |
| dark `--act` #9DB8F2 button fill against the band | 4.66 | 3 (UI) |
| `--on-act` #16120F on that button | 9.38 | 4.5 |
| dark `--ok` #6FD49A "On now" dot / tag text | 5.10 | 4.5 |
| dark game colours (icons only) | 3.57 (One Piece, lowest) to 5.53 | 3 (UI) |

| Pair (page kicker `--mark`, small text) | Light | Dark |
|---|---|---|
| on `--paper` | 5.34 | 5.40 |
| on `--surface` | 5.96 | 4.90 |

The hero h1 and sub-line keep D54's scrim. Contrast does not depend on weight, but Fraunces has thinner strokes, so the
D54 frame-by-frame check must be re-run (6, item 3).

## 6. Port checklist (coder)

Each item is done when its check passes. Tests run with `npm test`. Screens are checked at 390x844 and 1280x800, light
and dark.

1. **Fonts.** `public/fonts/fraunces-600.woff2` (≤ 60 KB), `OFL-Fraunces.txt` and `OFL-Archivo.txt` exist. `@font-face`
   and `--font-display` are in global.css, and the preload is in Base.astro. *Check:* in the network panel, the font
   comes from our origin only, there is no CSP error in the console, and `document.fonts.check('600 1em Fraunces')` is
   true on `/`.
2. **Type scale.** The section 4 tokens and selectors. *Check:* computed `font-family` of `.phero-h`, `.pg-head h1` and
   `#week-h` starts with Fraunces. It is Archivo on `.ev-title` inside `.slots`, `.day-name` and every element of
   `/admin`, whose screens match the build shots.
3. **Hero.** One button (`.phero-acts` has exactly one `.btn`), plus the next-up link. `CLIP_BTN` is gone and the strip
   clips link shows at 390 ("Watch clips"). *Check:* the D52 test (the hero ends above the bar at 390x844) passes, and
   the D54 contrast sampler gives h1 ≥ 4.5 and sub-line ≥ 4.5 on the worst frame at 390, 1280 and 1920.
4. **Tonight band.** `tonight(ctx)` is rendered only with live, not-ended events today. *Check (test clock `?now=`):* Fri
   18:50 shows "Tonight" and ≤ 4 rows, Fri 11:00 shows "Today", Mon (closed, nothing on) shows no `#tonight` element. When
   it shows, the week card has no `#d-<today>` section and the Today strip tile links to `#tonight`.
5. **Lineup.** At most 3 `.ev` cards under "Coming up", from the `laterRows` filter over 14 days. *Check:* a week with no
   specials renders no "Coming up" heading, and Further out has no series that is in the lineup.
6. **Rows card.** Every day is rows (no `.slots` in `#week`). There is a sign-up button only on open, few, needs or
   waitlist rows, and none on walk-in rows. *Check:* rows ≥ 56px tall, buttons ≥ 44px; at 390 no row overflows and
   nothing scrolls sideways at 360.
7. **Chips off the home page.** There is no `#chips` on `/`, and `/events/` keeps its chips. `/?game=magic#week` still
   filters server-side. *Check:* no console error on `/`, and the events page chip tests pass.
8. **Play by game.** The `games` marker plus a baked fallback. There are 8 tiles, each linking to `/events/?game=<id>`
   (keeping `?now=`), with counts that equal the events-page chip counts for the week. *Check:* the layout is 2 / 4 / 8
   columns at 390 / 768 / 1280 and tiles are ≥ 88px tall.
9. **Why players choose Mulligan.** The rating is said once (the old `.proof-rate` line is gone), there are 3 promises
   (the third disappears when `store.kids` is empty), and the 3 quotes come from proof.json. *Check:* the string "4.9 on
   Google" occurs once on `/`.
10. **Find your table.** The new heading and lead, and 2 columns from 768px. "Good to know" is gone. *Check:*
    "Look for the sign on the roof" occurs once on `/`.
11. **Clips and featured.** The `.feat` section is gone, and `FEATURED` clips are first in `#clips-list`. *Check:* no
    third-party request before a click (the D52 network test), and one click opens one TikTok iframe.
12. **Join in.** Renamed. *Check:* `#comm-h` reads "Join in".
13. **Page heads.** `.pg-head` on events, the date page (kicker), cedh, new-here, privacy and 404, and `eventMissing`
    uses it. *Check:* each page has exactly one h1, inside `.pg-head`, and there is no `.empty.lattice` on 404 or on a
    missing date.
14. **Tab bodies.** The events walk-in note appears once. The cEDH two-column layout applies from 1024px, and "Rules"
    merges into **Entry, parking and proxies**. *Check:* at 1280 the cEDH page is shorter than `cedh-1280-light`
    (3,684px), and at 390 nothing scrolls sideways.
15. **Contrast table.** The section 5 pairs are added to DESIGN 2.3. *Check:* a re-run of the PowerShell / node snippet
    matches.
16. **Shots.** Regenerate `docs/review/build-shots/` (the same 44 names). *Check:* `home-*` is not longer than in 2.12,
    and dark mode reads right (the Tonight band, tiles and quotes use tokens, with no hard-coded light colours).
17. **Docs.** DESIGN.md section 18 notes what was built (and any change from this spec). Post the push summary on
    issue #2.

**Do not:**
- Add marquees, tickers, scroll reveals, hover lifts, parallax or any new motion. Reduced motion still collapses
  everything as now, and the D54 Save-Data / 2g-3g / reduced-motion holds stay exactly as built.
- Add new data: no new JSON fields, DB columns or API routes. Q31 "Meet the shop" waits for the owners.
- Load anything third-party at runtime: no Google Fonts, CDN, embeds or maps. Keep the CSP as is (`font-src 'self'`).
- Remove or rename existing `<!--mg:*-->` markers. `lately` moves within the page, and `games` is the only new one. Do
  not break the baked no-server fallbacks.
- Use data-fed `innerHTML`. Everything new goes through `h```, values are escaped (D20), and there is a test per new
  render function with a `<img onerror>` title.
- Go below 44px for any target. The public `--tap` stays 48px where it is set today.
- Touch admin (`admin.astro`, `admin.css`) or `prototype/`.
- Use Fraunces for body text, numbers, card titles or buttons, or ship more than one Fraunces file.
