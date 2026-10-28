# Round 8: for the Desktop (port to src/)

Boss, Laptop, 2026-10-28 (D55 owner ask, D59 to D65). The prototype is the reference: `prototype/index.html`, `events.html`,
`404.html`, `admin/*.html`, `css/tokens.css`, `css/site.css`, `css/front.css` (the "round 8 boss trims" blocks at the end),
`css/events.css`, `css/ui.css`, `css/admin.css`, `js/event-views.js` (`compactLine`, `weeklyRow`, `tonightBand`, `rowAct`),
`js/front.js`, `js/events-page.js`. Spec: `docs/review/round-8-new-look-laptop.md` (section 6 is its own port list); what was built and
trimmed: `DESIGN.md` sections 1, 2.1, 2.3, 2.4, 3 and 18. Copy behaviour, not prototype code. Every value goes in with Astro
`{}` escaping or `textContent`, never `set:html`; SQL stays `?` placeholders.

**Overlap note:** HANDOFF (71bdfeb) says the Desktop took round 8 over on 2026-10-28 and builds straight from the spec. The
Laptop prototype was already built (packages A to C) and has now been trimmed by the boss. Please port from the prototype as it
stands now rather than from the spec alone: the D61/D63 trims below are not in the spec. If you already built a part from the
spec, apply only the "Boss trims" items to it.

## 1. Fonts and tokens
1. Copy `prototype/fonts/fraunces.woff2` (67 KB) and `OFL-Fraunces.txt` to `public/fonts/`. Same `@font-face` (weight 400 800,
   `font-display: swap`) and the `Fraunces Fallback` face (local Georgia, size-adjust 104%, ascent 94%, descent 24%). Preload it
   in the layout head next to Archivo (`crossorigin`). CSP unchanged (`font-src 'self'`).
2. Copy the round-8 tokens from `prototype/css/tokens.css` with the same names: `--font-display`, `--t-hero`, `--t-page`,
   `--t-2xl`, `--t-xl`, `--t-card`, `--t-row`, `--t-lead`, `--sec-y`, `--head-gap`, `--pad`, `--r-panel`, `--r-btn`, `--r-photo`,
   `--lift-panel`, `--lift-band`, `--tn-bg`, `--on-tn`, `--on-tn-2`, `--on-tn-k`, `--scrim-rgb`, `--hero-act(-hover)`, `--kicker`.
   **`--sec-y` is the trimmed value** `clamp(2.75rem, 2rem + 3vw, 4.5rem)` (44px at 390, 70px at 1280), not the spec's 56/88.
3. Type table: DESIGN 3. Headings, card and row titles and big numerals in Fraunces 600; everything else Archivo at 100% width;
   Archivo condensed only for the admin counter numbers. Public buttons are pills (`--r-btn`); the admin keeps `--r-ctl`.

## 2. Hero (`src/pages/index.astro`, hero block)
1. **Remove the featured-clips row under the hero** (`section.feat`, the `FEATURED` / `feat` constants and the
   `{feat.length > 0 && <script src="/js/clips.js">}` line that exists only for it; keep clips.js for "Clips from the shop").
   In the new order Tonight sits right under the hero; the two clips stay in "Clips from the shop".
2. Five things in the copy: chip, h1 as two spans ("Shuffle up." / "Everyone's welcome.", `display: block` from 600px), the
   sub-line, two pill buttons (`.btn-hero` filled `--hero-act` "See this week" to `#week`; `.btn-on-dark` outline "Plan a visit"
   to `#visit`).
3. The strip: pause pill on the **left**, then next-up (`a.next#nextup` to `#tonight`: kicker "Tonight" / "On now" / "Today" /
   "Next up Wed", time in Fraunces, names with ellipsis); `padding-right: calc(var(--gutter) + 60px)` so the ThemeFab (D46)
   never sits on it. Drop the caption (`.media-cap`, `.cap-k`) and the clips link.
4. Scrim: spec 2.3 values (`.phero-media::after`, three breakpoints). Measured on the store montage (D65): h1 >= 3.93 at the
   brightest pixel, sub-line >= 10.98; your D54 numbers (h1 4.67) were for the old scrim and stay fine.
5. Phone hero `min-height: 30rem`, content-sized; it must end above the quick-actions bar at 390x844 (D52 test).

## 3. Front page order and sections
Order: hero, Tonight (brick band), This week (week card), What we play, cEDH, Clips, New and preorders + What people say,
Visit, footer. Remove "Between events" (reviews into New, Discord + socials into Visit, "Lately" off the home page).

1. **Tonight band** (`TonightBand.astro`, server-rendered): the lead-day rule from `front.js` (`leadYmd`, `tonightWord`), first 3
   dates as event cards, the rest as rows under "Also tonight", empty state "This week is quiet". **Boss trim (D61):** under
   600px, two or more cards are one sideways snap row (`grid-auto-flow: column; grid-auto-columns: 86%`, scroll-snap, the
   wrapper bleeds to the screen edge with the gutter as padding; `site.css` `.tn-cards:has(> :nth-child(2))`). CSS only.
2. **This week:** strip (D51) + chips + one `.wk-card` of rows, one action each (`rowAct` table: Sign up / Join the waitlist /
   TopDeck link with `rel=noopener` / Details / Cancelled stamp). Rows: 48px thumb, 60px tall from 768px. **Boss trim (D61):**
   with all games showing, the next **two** days with events after the lead day are open; every later day renders as
   `section.day.day-fold#d-YYYY-MM-DD` with its h3 head and a `<details class="wk-fold"><summary class="day-sum">` holding
   "N events" + the first three titles ("and N more") + a chevron, then the `ul.day-lines`. A strip tile or `#d-` hash opens the
   fold (small client script: on click of `a[href^="#d-"]` and on `hashchange` / load, set `details.open = true`). A game filter
   renders every day open. "Further out": on phones the date leads the meta line (`front.css` 767px block).
3. **What we play** (`WhatWePlay.astro`, static): six cards, counts from the week. **Boss trim:** 6 across from 1100px (1:1),
   3 across 768-1099px (4:3), a sideways snap row under 768px (`grid-auto-columns: 42%`).
4. **cEDH:** Fraunces type. **Boss trims:** photo hidden under 768px, a 2:1 strip from 768px; facts as a `5.25rem | 1fr` grid on
   phones; under 480px the ticket button and registered count share one line (smaller button padding, no icon on the stat);
   "Recent turnout" is `<details class="turnout-fold" id="turnout" open>` with the h4 in the summary, and the client closes it
   under 900px (open without JS). "Full standings on TopDeck" stays outside the details.
5. **Clips:** Fraunces h2 only.
6. **New and preorders:** tiles, TCGplayer line, then "What people say" (`#proof-rate`, three quotes). **Boss trims:** side photo
   only 768-1199px; from 1200px the tiles are one row (`repeat(auto-fit, minmax(12.5rem, 1fr))`); under 900px the quotes are a
   sideways row of cards.
7. **Visit:** three columns from 1024px; Find us gains Discord and the socials. **Boss trims:** hours rows `padding-block:
   0.45rem`; "Good to know" becomes four `<details>` (summary = the question, 44px min, "+" / minus sign), not a `<dl>`; on phones
   Directions and the phone button share a row (padding 0.875rem).
8. **Footer on the home page only:** hide `.foot-visit` and `.foot-hours` (body class `home`; the Visit section is right
   above); other pages keep the four columns.

## 4. Events page and per-date page
1. Page head component (`.page-head`, coursing rule) with the chips and the Format / calendar / print row inside; also on New
   here?, 404 and Privacy.
2. Tonight as the brick band (ids `#today-wrap`, `#today-h`, `#today`), cards + "Also tonight" rows; **drop the walk-in note
   inside the band** (it stays once, above Every week).
3. **Boss trim (D63): Special events and tournaments are rows**, not cards: one `.wk-card`, grouped by date with a sentence-case
   `--kicker` head ("Sun Nov 1"), each row `compactLine(occ, {action: 'button'})` (no thumb, the game dot) whose bits add, in this
   order, "Invite only" or the TopDeck count ("80 registered"), then the other dates ("Also Sun Nov 8, 3 PM and Sun Nov 8, 5 PM"
   or "Repeats: 1st Sunday of the month"). The title opens the per-date page / dialog, which keeps the full card content.
   The old 2-column card grid at 1024px goes.
4. Every week: rows at every width in one `.wk-card`, grouped by weekday.
5. Per-date page (D16): the 4.3 type (Fraunces name and numbers, sentence-case kicker, one primary action).

## 5. Admin
h1 / h2 / roster titles / legends / top title in Fraunces 600, "Shop admin" in Fraunces, the 3px brick top rule on the phone
top bar and the sidebar, counter numbers in Archivo condensed, buttons `--r-ctl`, 56px targets. No layout change.

## 6. Tests to mirror (prototype `js/tests-front.js`, `tests-events.js`, `tests-look.js`)
- Hero: no iframe and no `[data-clip-id]` in the hero; `#nextup` in the strip and in the first screen at 390x844; the strip's
  last 76px free at 390 and 1280; the h1 is two lines at 1280.
- Tonight: always has a heading (closed Monday gives "Next up: Wednesday"); at 390 the cards are one sideways row and the page
  has no horizontal scroll.
- Week: Wednesday folded at Fri 18:50, its summary starts "5 events" and names the first title; a strip tile opens it; a chip
  shows every day open; chip counts equal the rows shown; at most one `.btn-act` per row.
- Special events: rows only, at most one button each, the TopDeck count, "Invite only" and the other dates present.
- Page budgets (demo bar excluded in the build, so tighter numbers are fine): front 390 <= 8,900px, 1280 <= 7,100px; events
  1280 <= 3,750px.
- No third-party request before a click (fonts included); no `set:html` with data.

## 7. Owner check before a public deploy
The montage's packed-room shots show identifiable customers, some of whom look young (spec "Noted for the owner"; D54 says no
recognisable minors). Ask Mish to confirm the store is fine with those shots, or cut them, before the build goes public.
