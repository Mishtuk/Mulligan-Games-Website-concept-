# Round 8: the new look, "Card-table warm" (spec for the coders)

Designer, Laptop, 2026-10-27. Owner ask: D54 (the whole hero is a video, reimagine the front page, other tabs "a little bit
better", try a look researched from Wix templates). Coordinator's round-8 ruling: **D55**. Research: `docs/research/wix-templates.md`
(direction B recommended). Any new decision this spec asks for is listed at the end as **D57+ proposals** (odd numbers, Laptop).

**Looked at first (2026-10-27, headless Chrome, served on http :8812):** `index`, `events`, event detail dialog, admin Today and `404`
at 390 and 1280 (index also 1280 dark, events 390 dark), the VFW and Riverside home pages at 390 and 1280, and a contact
sheet of the new hero montage (`hero.mp4`, `hero-portrait.mp4`). Shots: `C:\Users\alexm\AppData\Local\Temp\claude\C--\56191821-4528-4ba6-bfb0-1b410caaeb0f\scratchpad\shots-r8\`.
What I saw:
- **The type is the reason it reads as a flyer and not as a place.** Every heading is Archivo at 62% width, weight 900:
  "This week", "Clips from the shop", "cEDH at Mulligan" and the card titles all shout at the same pitch. VFW (Literata) and
  Riverside (DM Serif Text) both get their calm from a serif display face over a plain sans, which is the Wix "Farm to Table"
  point too.
- **The hero has too many jobs.** Chip, headline, sub-line, the next-up ticket, a pale-blue button, two TikTok cards and a
  caption strip. VFW and Riverside each show 5 things: chip or kicker, headline, one line, two buttons, then a strip.
- **"This week" is long and mixed.** Two days of big photo cards, then three styles of row, then a "Further out" box.
  At 390 it runs to about 4,000 px. The comedy-club pattern (one cream card of dated rows, one button per row) fixes this.
- **The D46 corner collides.** At 1280 and at 390 the round theme button sits on the right end of the hero strip, which is
  where the pause pill would go now that the montage plays on every width.
- **Bright footage.** The Desktop's store montage (18.4 s: the sign against the sky, the shop floor, cEDH playmats, the packed
  white-walled event room, the Warhammer table, Magic cards in play) averages about 49% luma. The left 55% of the frame reaches
  pure white (the sign, the sky, the walls). So the scrim is designed for a pure-white pixel under every line of text (section 2.3).
- Small things to check while in the files: the cEDH loop box and the New and preorders photo tile rendered black or empty
  in the full-page shots (lazy media that never got its poster). Make sure both show their poster before they play. The 404 is
  unstyled when served from the repo root because its paths are absolute (`/Mulligan-Games-Website-concept-/...`). That is
  correct for Pages, so test it there or through a junction (section 5, C).

---

## 1. Direction: "Card-table warm"

Cream paper, a soft serif for anything you read as a name or a heading, plain Archivo for everything you scan, the store's
own video at the top, and one brick band that says "tonight". It keeps the D28 identity: the brick header with its
coursing, the logo on its white sign plate, and sign blue as the one action colour. **No identity change.** The new look comes
from type, rhythm and fewer, larger shapes, not from new colours. The header stays solid brick rather than going transparent
over the video (Wix/Riverside do that): the brick wall is the store's front and D28's first rule.

### 1.1 Type pair: Fraunces (display) + Archivo (body), both self-hosted woff2

**Self-hosted, not the Google Fonts CSS.** Since D48/D49 the page makes no third-party request on load, and the build's CSP is
`font-src 'self'`. Fetch the file once, then serve it from `fonts/`:
```
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
curl -s -A "$UA" "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..800&display=swap" > f.css
# take the src url of the block commented /* latin */ (not latin-ext) and save it:
curl -s "<that url>.woff2" -o prototype/fonts/fraunces.woff2      # 67,304 bytes (checked today), axes opsz 9-144, wght 400-800
```
Licence: SIL OFL 1.1. Save `OFL.txt` from github.com/undercasetype/Fraunces as `prototype/fonts/OFL-Fraunces.txt` and add a
line to `fonts/README.txt`. Archivo stays as it is (`archivo.woff2`, 90 KB). Its width axis is no longer used on public pages.

```css
@font-face { font-family: 'Fraunces'; src: url('../fonts/fraunces.woff2') format('woff2');
  font-weight: 400 800; font-style: normal; font-display: swap; }
@font-face { font-family: 'Fraunces Fallback'; src: local('Georgia');           /* starting values: tune by overlay */
  size-adjust: 104%; ascent-override: 94%; descent-override: 24%; line-gap-override: 0%; }
--font-display: 'Fraunces', 'Fraunces Fallback', Georgia, 'Times New Roman', serif;
```
Every page head gets `<link rel="preload" href="fonts/fraunces.woff2" as="font" type="font/woff2" crossorigin>` next to the
Archivo preload (admin pages use `../`, the 404 uses the absolute subpath). Leave `font-optical-sizing: auto` on, so Fraunces
picks its display cut at large sizes and its text cut on card titles. No italics, no SOFT/WONK axes. Numbers set in Fraunces
use `font-variant-numeric: lining-nums tabular-nums`.

| Level | Family | Weight | Size | Line height | Tracking | Notes |
|---|---|---|---|---|---|---|
| Hero headline `--t-hero` | Fraunces | 600 | `clamp(2.75rem, 1.9rem + 3.6vw, 5rem)` = 44 px at 390, 76 at 1280, 80 cap | 1.0 | -0.02em | two block spans, see 2.1 |
| Page head h1 `--t-page` (events, 404) | Fraunces | 600 | `clamp(2.5rem, 1.9rem + 2.6vw, 4rem)` = 40 to 64 | 1.02 | -0.015em | |
| Section / band h2 `--t-2xl` | Fraunces | 600 | `clamp(2rem, 1.55rem + 2vw, 3rem)` = 32 to 48 | 1.08 | -0.01em | replaces the 62%/900 head; the cEDH h2 uses this size too (was its own 4.75rem) |
| Day name in the week card (h3) `--t-xl` | Fraunces | 600 | 1.5rem (24) | 1.1 | 0 | |
| Card title (`.ev-title`, Tonight cards, detail dialog h2 at 2rem) `--t-card` | Fraunces | 600 | 1.375rem (22) | 1.15 | 0 | |
| Row title (`.dl-title`) `--t-row` | Fraunces | 600 | 1.1875rem (19) | 1.2 | 0 | |
| Big numerals (strip date, stat number, cEDH ticket date, detail "28") | Fraunces | 600 | strip 1.375rem, stat 1.75rem, ticket 2rem, detail 2.4rem | 1.0 | 0 | lining tabular |
| Kicker (`.kicker`) | Archivo | 700 | 0.875rem (14) | 1.3 | 0.01em | sentence case, never uppercase; colour: see 1.3 |
| Lead (hero sub, page-head lead) `--t-lead` | Archivo | 400 | `clamp(1.0625rem, 1rem + 0.35vw, 1.25rem)` = 17 to 20 | 1.5 | 0 | max 38ch |
| Body `--t-md` | Archivo | 400 | 1.0625rem (17) | 1.55 | 0 | unchanged |
| Row time (`.dl-time`), meta `--t-sm` | Archivo | 700 / 500 | 0.9375rem (15) | 1.45 | 0 | tabular |
| Small `--t-xs` | Archivo | 600 | 0.875rem (14) | 1.45 | 0 | unchanged |
| Buttons | Archivo | 700 | 1rem | 1.1 | 0 | width 100% (no 88% condensing) |
| Nav, chips | Archivo | 600 | 1rem / 0.9375rem | 1.2 | 0 | width 100% |

Archivo condensed (62% and 72%, weight 900) **stays only in the admin's counter numbers** (`.cnt-n`, `.wpos`, `.evb-t`,
`.prod-nums dd`, `.su-big` in admin), because those are read across a counter, not admired.

### 1.2 Colour tokens (D28 kept; new tokens marked NEW)

The existing table (DESIGN.md 2.1) stands unchanged. Additions:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--font-display` NEW | Fraunces stack | same | headings, card and row titles, big numerals |
| `--kicker` NEW | `var(--mark)` #9C4A32 | `var(--mark)` #C77A5E | kicker text on `--paper` / `--surface` only (never on `--surface-2`: 4.41 in dark) |
| `--tn-bg` NEW | `var(--brick)` #6B3A2C | same (fixed, like the header) | the Tonight band |
| `--on-tn` / `--on-tn-2` NEW | #FFFFFF / #E9DCCB | same | text on the band / its secondary text |
| `--on-tn-k` NEW | `var(--highlight)` #F2D58A | same | the kicker on the band, the current-nav underline on the header |
| `--scrim-rgb` NEW | `23 18 14` (#17120E) | same | the hero scrim, chip and strip, as `rgb(var(--scrim-rgb) / a)` |
| `--hero-act` NEW | #2F5FB0 (fixed sign blue) + white text; hover #244C8F | same | the hero's primary button (the hero is dark in both themes, but the pale dark-scheme blue looked washed out on video) |

Not added: the research's `--tag` chip colour. The kicker does not reach 4.5 on it (4.39) and the chips already read on `--surface`.

**Contrast, WCAG formula, run 2026-10-27, every pair this round introduces:**

| Pair | Light | Dark | Need |
|---|---|---|---|
| Fraunces headings `--ink` on paper / surface | 13.72 / 15.34 | 15.18 / 13.75 | 4.5 |
| Kicker `--kicker` on paper / surface | 5.34 / 5.96 | 5.40 / 4.90 | 4.5 |
| (forbidden) kicker on surface-2 | 4.89 | **4.41, fails** | do not use |
| `--on-tn` white / cream #F5EFE4 on `--tn-bg` | 9.26 / 8.10 | same | 4.5 |
| `--on-tn-2` #E9DCCB on `--tn-bg` | 6.87 | same | 4.5 |
| `--on-tn-k` #F2D58A (kicker, underline) on `--tn-bg` / on header brick | 6.47 | same | 4.5 |
| Card edge: surface on `--tn-bg` (non-text) | 9.05 (#FFFCF6) | 1.74 (#25201C), so dark cards get a `1px rgb(255 255 255 / .12)` ring | 3 / decorative |
| White on `--hero-act` / its hover | 6.20 / 8.38 | same | 4.5 |
| Page-head lead `--ink-2` on `--surface` | 7.53 | 7.86 | 4.5 |
| Footer h2 cream on `--band` | 11.77 (#3E2A22) | 14.26 (#2A1D17) | 4.5 |
| White over hero scrim, **worst case: a pure-white video pixel**, at alpha .45 / .50 / .62 / .70 / .80 | 3.01 / 3.50 / 5.21 / 6.93 / 10.04 | same | headline 3 (large), other text 4.5 |
| Chip text (white) on the chip's own fill alpha .60 over white, no scrim | 4.86 | same | 4.5 |
| Strip text cream on the strip fill alpha .72 over white, no scrim | 6.52 | same | 4.5 |
| Open dot #6FD49A on the scrim (non-text) | 10.24 | same | 3 |

### 1.3 The accent rule (one rule)

**Sign blue marks the one thing to press, and nothing else is blue.** Each hero, card and row has at most one filled blue
button. Everything else is an outline or a quiet text link. Two supporting roles keep their meaning: brick (`--kicker` and
`--mark`) marks time and place (kickers, day numerals), and `--highlight` marks "now" (the Today tag, the Tonight kicker, the
current nav item). Game colours stay as dots, 3 px rules and icons only.

### 1.4 Rhythm, radii, shadows

- **Section padding** `--sec-y: clamp(3.5rem, 2.6rem + 3.6vw, 5.5rem)` (56 at 390, 88 at 1280; replaces D37's 48/72).
  **Head to content** `--head-gap: clamp(1.25rem, 1rem + 1vw, 2rem)`. **Panel padding** `--pad: clamp(1rem, 0.8rem + 0.8vw, 1.5rem)`.
  Grid gaps 16 px under 768, 24 px from 768. Rows: 12 px block padding, min height 64 px on phones and 72 px from 768.
- **Radii:** `--r-card` 14 (unchanged), `--r-photo` 12, `--r-ctl` 10 (inputs; admin buttons), NEW `--r-panel` 18 (the week
  card, the dialog, the What-we-play cards), NEW `--r-btn` 999px (public buttons become pills, like the status chip and the
  theme button; admin overrides back to `--r-ctl`).
- **Shadows:** `--lift` (unchanged, cards). NEW `--lift-panel: 0 1px 0 light-dark(#DED3C2, #0006), 0 24px 48px -28px light-dark(#3E2A2259, #000d)`
  (week card, dialog). NEW `--lift-band: 0 1px 0 rgb(0 0 0 / .2), 0 18px 32px -18px rgb(0 0 0 / .6)` (cards on the brick band).
- **Motion:** unchanged (the hero's 600 ms fade, 140 ms colour on buttons). No reveals, no hover lifts.

---

## 2. Hero: full-bleed montage on every width

### 2.1 Content (five things plus the strip)

```html
<section class="phero" aria-labelledby="hero-h">
  <div class="phero-media" id="hero-media"> picture + video exactly as DESIGN 17.1 (unchanged) </div>
  <div class="phero-in wrap"><div class="phero-copy">
    <p class="phero-chip" id="hero-chip" role="status">...</p>                       <!-- D52 texts unchanged -->
    <h1 class="phero-h" id="hero-h"><span>Shuffle up.</span> <span>Everyone’s welcome.</span></h1>
    <p class="phero-sub" id="hero-sub">Free play every day we’re open, big tables, and a crew who knows every format.</p>
    <p class="phero-acts"><a class="btn btn-hero" id="hero-cta" href="#week">See this week</a>
       <a class="btn btn-on-dark" id="hero-visit" href="#visit">Plan a visit</a></p>
  </div></div>
  <div class="phero-strip"><div class="phero-strip-in wrap">
    <button class="vid-btn" id="vid-btn" type="button" data-paused>...</button>      <!-- moves to the LEFT (VFW) -->
    <a class="next" id="nextup" href="#tonight"><span class="next-k" id="nextup-k">Tonight</span>
       <span class="next-time" id="nextup-time">7 PM</span> <span class="next-what" id="nextup-what">Draft FNM, Nexus Nights</span></a>
  </div></div>
</section>
```
- **Removed from the hero:** `ul.phero-feat` (the two featured TikTok cards), `#hero-clip` ("Watch a clip"), the strip's
  `.media-cap` / `.cap-k` caption and `.clips-link`. The clips stay in "Clips from the shop" (section 3, number 6). The caption
  goes because the strip now carries next-up, and the address already leads the bar above the header (D52, say it once).
- The h1's two spans are `display: block` from 600 px, so it breaks as "Shuffle up. / Everyone’s welcome." on wide screens.
  At 390 it wraps naturally to three lines. `textContent` stays "Shuffle up. Everyone’s welcome." (the space is a text node).
- **Next-up moves into the strip** (Riverside's "Sundays 9:00 & 10:30" spot). That keeps D36's "next up in the first screen"
  with one fewer box in the copy. Kicker texts: "Tonight" (from 5 PM, or when every remaining event starts at 5 PM or later),
  "On now", "Today", "Next up Wed". Same `renderHero()` data. Time in Fraunces 600 1.25rem, names Archivo 600 0.9375rem
  cream, one line with ellipsis, `min-width: 0`, 48 px tall link.
- **Buttons:** `.btn-hero` is the filled sign-blue pill (white text 6.20). `.btn-on-dark` is a transparent pill with a 1.5 px
  white 70% border and white text, hover 12% white fill. At 360 to 420 px they share one row (D52): padding 0 1rem, gap 8 px.

### 2.2 Layout and sizes

| | Phones under 600 | 600 to 899 | 900 and up |
|---|---|---|---|
| Copy position | bottom-left, `align-content: end` | bottom-left | bottom-left, max-width 46rem, 56 px above the strip |
| Hero min-height | `30rem` (content-sized; must end above the 56 px quick-actions bar at 390x844, D52 test) | `clamp(30rem, 70svh, 40rem)` | `clamp(34rem, calc(100svh - 8.5rem), 54rem)` (strip at the fold at 1280x900 without the demo bar) |
| Padding | 24 top / 24 bottom | 32 / 32 | 48 / 56 |
| Gaps | chip 16, h1 12, sub 20 | same | chip 20, h1 16, sub 28 |
| Strip | 52 px | 56 px | 64 px |

Order inside the strip: `[pause pill] [next-up link]`, then nothing. **The D46 corner:** the strip's inline-end padding is
`calc(var(--gutter) + 60px)` at every width, so the fixed theme button (44 px plus 16 px offset) never sits on the next-up
text or the pill. Pause pill: 44 px circle with only the icon under 420 px (accessible name stays), a 44 px pill "Pause video" /
"Play video" from 420 px, 1.5 px white 60% border, transparent fill. Behaviour is D53's `wireVideo` unchanged.
Video crop: `object-position: 50% 50%` (the montage is framed centre-safe; drop the old `50% 82%` table crop, which was for
the still).

### 2.3 Scrim (fixed values, both themes; designed for a pure-white pixel under the text)

Colour `rgb(var(--scrim-rgb) / a)` with --scrim-rgb `23 18 14`. Layers on `.phero-media::after`, top layer first:

- **900 to 1199:** `linear-gradient(90deg, a.82 0%, a.66 60%, a.30 85%, a.15 100%)`,
  `linear-gradient(0deg, a.72 0%, a.40 28%, transparent 55%)`, `linear-gradient(a.12, a.12)`
- **1200 and up:** the same with the 90deg stops at `a.82 0%, a.68 45%, a.28 75%, a.12 100%`
- **Under 900:** `linear-gradient(0deg, a.90 0%, a.80 45%, a.55 75%, a.30 100%)`, `linear-gradient(a.12, a.12)`

Worst points checked (combined alpha, then the worst-case white-text ratio from the table in 1.2):

| Point | Combined alpha | White text |
|---|---|---|
| 1280: end of the sub-line (x 50%, 32% up) | .78 | about 9.3 |
| 1280: end of "Everyone’s welcome." (x 59%, 54% up) | .56 | about 4.4 (large text needs 3) |
| 900: end of the headline (x 69%, 54% up) | .59 | about 4.8 |
| 390: sub-line (30 to 46% up) | .82 or more | about 10.8 |
| 390: headline (49 to 77% up) | .58 or more | about 4.6 |
| Chip at any width: its own fill a.60 plus the scrim | .76 or more | about 8 |
| Strip: fill a.72 on the bottom layer | .85 or more | 12 or more |

Rules: no `backdrop-filter`, no `mix-blend-mode`, and no text-shadow counted toward contrast (DESIGN 6.1). A soft
`text-shadow: 0 2px 24px rgb(23 18 14 / .35)` on the h1 is allowed as decoration only. The right side of the frame stays
light (.12 to .30), so the footage shows. Coder check: pause on the sign shot (0 to 1.5 s) and on the white event room, at 390
and 1280, light and dark. The headline must still be the clearest thing on screen.

### 2.4 Chip

Pill, min height 36 px (44 px is not needed, since it is not a control), padding 6 px 14 px 6 px 10 px, fill a.60, border
`1px rgb(255 255 255 / .28)`, white Archivo 700 0.9375rem, a green dot #6FD49A only when open (D52). Texts unchanged.

---

## 3. Front page, reimagined

**Order (events still lead, D1):**
1. Hero
2. **Tonight** (brick band)
3. **This week** (one cream card of dated rows plus the compact strip)
4. **What we play** (game photo cards)
5. **cEDH** (band, D4)
6. **Clips from the shop**
7. **New and preorders, plus What people say**
8. **Visit**
9. Footer

**Cut or merged:**
- "Between events" goes. Its reviews (the `#proof-rate` and `#proof` ids kept) move into 7. Discord and the social links move
  into Visit's "Find us". "Lately" is not shown on the home page: it repeats what Clips shows, and its data stays.
- The second day of big cards goes. Only the lead day is shown as cards, in Tonight.
- The featured clips leave the hero.

Background rhythm: video, then brick, paper, surface, band, paper, surface, paper, band. No two neighbours alike.

### 3.1 Tonight (`section.tn-band#tonight`, NEW)

- **Lead day:** today if any event is still to come or on now. Otherwise the next day with events within 7 days. h2 `#tonight-h`:
  "Tonight" (same rule as the strip kicker) / "Today" / "Next up: Wednesday". Kicker above it: the full date "Friday, October 30"
  (`--on-tn-k`). Head row right (900 and up): "See the whole week ›" to `#week` in cream with an underline.
  A `span id="d-<lead ymd>"` sits in the band so old day links still land.
- **Cards:** the first 3 dates of the lead day in time order are the existing event cards (`MG.eventCard`, photo band, game
  rule, one action box) on `--surface` with `--lift-band`. A 4th and later date go below the cards as rows
  (`ul.day-lines` with `.dl-act`, on one `--surface` panel, h3 "Also tonight"). Columns: 1 under 600, 2 from 600, 3 from
  1024. Cards keep their 12:5 photo band from 768 and 3:1 under 768 (existing tests).
- Cards in this band link to `events.html#e-<key>`. The Sign up button goes to `events.html#su-<key>` (R7).
- **Empty** (nothing in 7 days): h2 "This week is quiet", one line "Free play every day we’re open.", a `.btn-on-dark`
  "All events". The band never vanishes, so the hero's "See this week" target and the strip link always land.
- Padding `--sec-y` top, `--sec-y` bottom. Text `--on-tn`. Inside the band `color-scheme` stays the page's, so cards follow
  light or dark. Only the band's own text is fixed cream or white. Print: no background, ink text.

### 3.2 This week (`section.sec.week#week`, on `--paper`)

- Head: h2 "This week" + "All events and sign-ups ›" (right from 768, own line under 768). Under it the single note "Most nights
  are walk-in. A Sign up button holds a seat." (D37 rule: once).
- The **compact week strip** (D51, unchanged component: day, date, count inside the tile; 7 fitted tiles under 768; 34rem cap
  from 768). Restyle: tile `--surface`, 1px `--line`, radius 10, date number Fraunces 600 1.375rem. The lead-day tile links
  to `#tonight`, the others to `#d-<ymd>`.
- **Game chips:** one row from 900, sideways rail under 900 (unchanged). They filter **this card only**, and the counts count
  what the card lists (the lead day is excluded). Tonight is not filtered.
- **The week card** `div.wk-card` (`--surface`, `--r-panel`, `--lift-panel`, padding `--pad` inline, 8 px block) holds `#days`
  then `.later`:
  - Days after the lead day up to today + 6. Each day: `div.day` with a head (Fraunces 600 1.5rem day name "Tomorrow" /
    "Sunday", meta "Nov 1 · 10 AM to 10 PM" Archivo 500 0.9375rem `--ink-2`) and `ul.day-lines`. Days are divided by a 1px `--line`.
  - From 900 the head is a 10rem left column and the rows sit to its right. Under 900 the head sits on top, sticky
    (`top: 0`, `--surface` background) while you scroll that day's rows.
  - Consecutive closed days merge into one quiet `.day-off` line (F9). A day with nothing on: "Free play all day."
  - **Further out**: a 1px rule, h3 "Further out" (Fraunces 1.25rem), then 4 rows with the date shown inline ("Fri 6 Nov"
    in Archivo 700), then "See every date ›".
- **Row** = `V.compactLine(..., opts)` (package A extends it; existing classes kept for the tests):
  `li.day-line[data-state][data-game] > .dl-dot, .dl-ph (thumb), .dl-main > .dl-time + .dl-title a + .dl-bits, .dl-act`.
  - **From 768:** grid `3.5rem 4.75rem minmax(0,1fr) auto`, areas `"ph time title act" "ph time bits act"`. Thumb 56 px,
    radius 8. Time Archivo 700 15 px tabular. Title Fraunces 19 px. Bits Archivo 500 15 px `--ink-2` ("Magic · $20 · 3 seats
    left"). Action right-aligned, vertically centred.
  - **Under 768:** grid `48px minmax(0,1fr)`, the action on its own line under the bits. The title link stretches over the
    row (`::after { inset: 0 }`), so the whole row opens the date, and `.dl-act` sits above it with `position: relative; z-index: 1`.
  - **The one action** (`.dl-act`), by state:

    | State | Control |
    |---|---|
    | open / few / needs | `a.btn.btn-act.btn-row` "Sign up" (index: `events.html#su-<key>`; events page: `button[data-signup]`) |
    | waitlist | `.btn.btn-2.btn-row` "Join the waitlist" (same targets) |
    | external (TopDeck) | `a.btn.btn-2.btn-row` "Sign up on TopDeck" + ext icon + `.vh` "(opens TopDeck)", `target=_blank rel=noopener` |
    | walk-in, closed, full, counter, invite-only | `a.dl-more` "Details ›" (quiet link, 48 px tall) from 768; nothing under 768 (the row is the link) |
    | cancelled | `span.stamp` with a ⊗ icon and "Cancelled" in `--bad`; the title stays a link |

    `.btn-row`: 44 px min height from 768 (WCAG 2.5.8 is met and the rows are spaced 12 px), 48 px under 768, padding 0 1.125rem.

### 3.3 What we play (`section.sec.play#play`, on `--surface`, NEW)

Head: h2 "What we play" and the lead "Pick a game to see its nights." Six cards as static `<a>` in the HTML (the photo and the
link are constants; only the count is filled by front.js with `textContent`). Grid: 2 columns under 768 (photo 1:1),
3 columns from 768 (photo 4:3), gap 16/24. Card: `--paper` (so it shows on the `--surface` section) with a 1px `--line`,
`--r-panel`, photo on top (`--r-photo` inner top corners), then the game icon and name in Fraunces 600 1.25rem, then
"7 nights this week ›" Archivo 500 15 px (or "Ask at the counter" when 0). Hover: the underline on the name, no lift.

| Card | Photo (`img/social/*-800.webp`, lazy) | Link |
|---|---|---|
| Magic | `event-magic-night` | `events.html?game=magic` |
| cEDH | `event-cedh-tables` | `#cedh` |
| Pokemon | `pokemon-sealed-shelf` | `events.html?game=pokemon` |
| Warhammer and tabletop | `warhammer-battle` | `events.html?game=warhammer` |
| D&D and board games | `dnd-table` | `events.html?game=other` |
| One Piece, Riftbound, Hololive | `event-tables-fb` | `events.html` (the count is the sum of the three) |

Alt text is constant and plain ("Players at a Magic night", and so on). Links keep `?now=` (keepNowLinks).

### 3.4 cEDH (band, D4): type only

Same content and layout as now. The h2 takes the section size (Fraunces). Ticket dates use the Fraunces numerals. Facts dt in
Fraunces 600 1.125rem. Check that the loop box shows its poster (it was black in the shot).

### 3.5 Clips from the shop: type only

Unchanged row (D47/D48). The h2 uses Fraunces. Captions Archivo 600. The privacy line stays under the row. Nothing loads before a click.

### 3.6 New and preorders, plus What people say (`section.sec.new#new`, on `--surface`)

Tiles as now (rail under 768, 4 across from 1024, `.rel-foot` aligned), restyled: titles Fraunces, 3 px game rule kept. Under
them the TCGplayer line. Then a 1px rule and h3 "What people say": `#proof-rate` ("4.9 on Google · 81 reviews", link) on the
left. Then `#proof` with the 3 quotes in 3 columns from 900 (stacked under 900): quote in Fraunces 400 1.125rem/1.45, the name
and age under it in Archivo 600 14 px `--ink-2`. All built with createElement as now.

### 3.7 Visit (on `--paper`)

Three unboxed columns from 1024 (Hours | Find us | Good to know), stacked under 1024. h3s in Fraunces. "Find us" gains the
Discord button (`btn-2` "Chat with the regulars on Discord", ext icon) and one line of social links (Facebook, Instagram,
TikTok, TopDeck), moved from Between events.

### 3.8 Footer

Same index markup. h2s in Fraunces 600 1.25rem cream. Nothing else changes.

### 3.9 Sketches

```
390 (real site; the concept's demo bar sits above)
┌──────────────────────────────────┐
│445 York Rd          ☎ Call ⌖ Dir │ open bar (--band)
│[ MULLIGAN plate ]                │ brick header + coursing
│All events  This week  cEDH  Pre›│ nav strip, edge fade (D34)
├──────────────────────────────────┤ HERO: hero-portrait.mp4, scrim .30 top → .90 foot
│ ( ● Open now · till midnight )   │ chip
│ Shuffle up.                      │ h1 Fraunces 600, 44px, 3 lines
│ Everyone’s                       │
│ welcome.                         │
│ Free play every day we’re open,  │ sub 17px white
│ big tables, and a crew who knows │
│ every format.                    │
│ [ See this week ] ( Plan a visit )│ blue pill + white outline pill, one row
├──────────────────────────────────┤ strip 52px
│ (❚❚)  Tonight 7 PM Draft FNM, N… │ pause left, next-up link; right 76px free (D46 ◐)
└──────────────────────────────────┘ ends above the quick-actions bar
█ BRICK BAND  #tonight ████████████
█ Friday, October 30   (highlight) █ kicker
█ Tonight                          █ h2 cream
█ ┌ photo 3:1 ───────────────────┐ █
█ │ All Leylines’ Eve Chaos Draft│ █ card title Fraunces 22
█ │ ⬠ Magic · Chaos draft   $20  │ █
█ │ ◷ 6 PM to 10 PM     ● On now │ █
█ │ 19 seats left of 24          │ █
█ └──────────────────────────────┘ █
█ [ card: Draft FNM · Join the waitlist ] █
█ [ card: Nexus Nights ]           █
████████████████████████████████████
This week                           (paper)
All events and sign-ups ›
Most nights are walk-in. A Sign up button holds a seat.
[Tod][Sat][Sun][Mon][Tue][Wed][Thu]  7 fitted tiles
(All games 12)(⬠ Magic 7)(♛ cEDH 2)(… → chips rail
┌ week card (surface, r18) ────────┐
│ Tomorrow            (sticky head)│ Fraunces 24
│ Sat, Oct 31 · 2 PM to midnight   │
│ [▣] 6 PM  Saturday Draft         │ whole row is the link
│     Magic · $20 · 3 seats left   │
│     [ Sign up ]                  │ only rows that hold seats
│ ──────────────────────────────── │
│ [▣] 6:30 PM  Pokemon League Night│
│     Pokemon · $5   ⊗ Cancelled   │
│ ════════════════════════════════ │
│ Sunday · Nov 1 …                 │
│ Mon and Tue · closed             │
│ Wednesday … (5 rows)             │
│ ─ Further out ─                  │
│ Fri 6 Nov  Star Trek Prerelease  │
│ …                See every date ›│
└──────────────────────────────────┘
What we play                       (surface)
┌photo 1:1┐ ┌photo 1:1┐
│⬠ Magic  │ │♛ cEDH   │   3 rows of 2
│7 nights›│ │2 nights›│
cEDH band (stacked, as now)
Clips from the shop (rail)
New and preorders (rail) · TCGplayer line · What people say (stacked quotes)
Visit (stacked) · footer · [Events Hours Directions Call] fixed bar
```
```
1280
┌──────────────────────────────────────────────────────────────────────────────────────┐
│445 York Rd, Warminster                                    ☎ (215) 789-3299   ⌖ Directions│ open bar
│[ MULLIGAN plate ]                        All events  This week  cEDH  Preorders  Visit  │ brick, current = highlight underline
├──────────────────────────────────────────────────────────────────────────────────────┤
│ VIDEO full-bleed: hero.mp4 (hero-720.mp4 ≤1100). Scrim .82 at left → .12 at right       │
│                                                            (footage reads clearly here)│
│  ( ● Open now · till midnight )                                                       │
│  Shuffle up.                                            h1 76px, 2 lines              │
│  Everyone’s welcome.                                                                  │
│  Free play every day we’re open, big tables, and                                      │
│  a crew who knows every format.                                                       │
│  [ See this week ]  ( Plan a visit )                                                  │
│                                                                                      │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ ( ❚❚ Pause video )   Tonight  7 PM  Draft FNM, Nexus Nights ›                  ·· ◐   │ strip 64px; right 76px free
└──────────────────────────────────────────────────────────────────────────────────────┘
███ BRICK BAND #tonight ███████████████████████████████████████████████████████████████
█  Friday, October 30                                                                 █
█  Tonight                                                      See the whole week ›  █
█  ┌ photo 12:5 ────────────┐ ┌ photo ──────────────────┐ ┌ photo ──────────────────┐ █
█  │All Leylines’ Eve… $20  │ │Draft FNM           $20  │ │Nexus Nights        $5   │ █
█  │⬠ Magic · Chaos draft   │ │⬠ Magic · Draft          │ │◈ Riftbound              │ █
█  │◷ 6–10 PM   ● On now    │ │◷ 7–11 PM                │ │◷ 7–10 PM                │ █
█  │Sign-ups closed. 19 left│ │(Join the waitlist) Full │ │                         │ █
█  └────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘ █
███████████████████████████████████████████████████████████████████████████████████████
  This week                                                   All events and sign-ups ›
  Most nights are walk-in. A Sign up button holds a seat.
  [Today 30][Sat 31][Sun 1][Mon 2][Tue 3][Wed 4][Thu 5]      (34rem, left)
  (All games 12)(⬠ Magic 7)(♛ cEDH 2)(ϟ Pokemon 1)(⚓ One Piece 1)(◈ Riftbound 1)…
  ┌ week card ───────────────────────────────────────────────────────────────────────┐
  │ Tomorrow      │ [▣] 6 PM     Saturday Draft                          [ Sign up ]  │
  │ Sat, Oct 31   │              Magic · $20 · 3 seats left, almost full              │
  │ 2 PM–midnight │ [▣] 6:30 PM  Pokemon League Night                    ⊗ Cancelled  │
  │               │              Pokemon · $5                                         │
  ├───────────────┼───────────────────────────────────────────────────────────────────┤
  │ Sunday        │ [▣] 10 AM    Championship Series          ( Sign up on TopDeck ↗ )│
  │ Nov 1         │              cEDH · $60 · 80 registered                           │
  │               │ [▣] 2 PM     cEDH Weekly                               Details ›  │
  │ Mon and Tue · closed                                                              │
  │ Wednesday …(5 rows)   Thursday …(4 rows)                                          │
  │ ── Further out ──────────────────────────────────────────────────────────────────│
  │ Fri 6 Nov   Star Trek Prerelease   Magic · 7 PM · $50 · and 2 more dates Details ›│
  │ … 3 more                                                       See every date ›  │
  └───────────────────────────────────────────────────────────────────────────────────┘
  What we play                                                              (surface)
  [ Magic ][ cEDH ][ Pokemon ]
  [ Warhammer ][ D&D ][ One Piece, Riftbound, Hololive ]   photo 4:3, name, "N nights ›"
  ███ cEDH band: lede + facts │ next 3 tickets + recent turnout ███
  Clips from the shop: head left │ rail right
  New and preorders: 4 tiles · TCGplayer line ── What people say: 4.9 on Google · quote │ quote │ quote
  Visit: Hours │ Find us (+ Discord, socials) │ Good to know
  ███ footer index ███
```

---

## 4. Other tabs

### 4.1 One page head (`header.page-head`, events.html and 404.html)

A full-width `--surface` band right under the brick header, closed at the bottom by a 6 px **coursing rule**:
`background: linear-gradient(var(--brick) 0 2px, var(--paper) 2px 4px, var(--brick) 4px 6px)` on `::after` (VFW's rule under its
hero, in brick). Inside `.wrap`: an optional `.kicker`, an h1 at `--t-page`, a `.lead` (`--t-lead`, `--ink-2`, max 38ch),
then the page's own tools. Padding 32/32 under 900 and 48/40 from 900. **No photo** (D37 F13 stands). Dark mode: `--surface`
dark; the coursing rule uses the same brick, with `--paper` dark between.

### 4.2 Events page (`events.html`)

- **Head:** h1 "Events", lead "Every game night at the shop. Pick a game, check the seats, pay at the store." The chips row and
  the controls row (Format select left; "Add to my calendar" and "Print the schedule" right, Print hidden under 900) move
  **inside** the page head, so the head is the filter bar. The open bar keeps its status (D52).
- **Tonight** (`#today-wrap`, from 5 PM as now): becomes the same full-bleed brick band as the home page
  (`section.tn-band`, `V.tonightBand`). It is the first block under the head. Ids `#today-wrap`, `#today-h` ("Tonight") and
  `#today` are kept. The markup moves out of `.wrap.ep`, so the band can run edge to edge: close `.wrap`, add the band with its
  own `.wrap`, reopen `.wrap` for the rest. No `100vw` hacks.
- **Special events and tournaments** (`#special`, paper): as now (2 dates side by side from 1024, D36). The date head becomes
  a sentence-case kicker "Sun, Nov 1" (`--kicker`, no uppercase). Card titles are Fraunces.
- **Every week** (`#weekly`): **rows at every width** in one `.wk-card` (same component as the home page). Day groups with the
  left head column from 900 ("Wednesday", "next Nov 4" meta) and rows built by `V.weeklyRow(..., {action: 'button'})`.
  The one note "Most nights are walk-in. A Sign up button holds a seat." sits above the card. This replaces the 3-column weekly
  card grid (it was about 1,500 px of near-identical cards at 1280). The row's "Details ›" and the title open the detail dialog
  (`#e-<key>`), and Sign up opens the form.
- **Empty and loading states:** unchanged copy, set in the new type.

### 4.3 Event detail dialog (`#det-dlg`, `V.detailEl`): CSS only, plus one class

- Dialog radius `--r-panel`, `--lift-panel`, max-width 42rem, backdrop `rgb(23 18 14 / .6)`. The sticky close X is a 44 px circle (as now).
- The picture stays on top (full-bleed in the dialog, 16:9, 3 px game rule under it).
- Kicker "Wed, Nov 4" in sentence case `--kicker` (drop the uppercase and letter-spacing). The name `.det-h` is in Fraunces 600,
  `clamp(1.75rem, 1.4rem + 1.6vw, 2.25rem)`, with the price on the right in Fraunces 600.
- Action box: `--surface` with a 1px `--line-strong`, `--r-card`, the big number in Fraunces 600 2.4rem, one primary button
  (accent rule), the calendar button outlined.
- Facts (`dl`): two columns from 600 (label Archivo 700 15 px, value Archivo 400), 1px `--line` between items.
- Nothing about the structure changes (round-4 single layout).

### 4.4 404 (`404.html`)

The page head (h1 "That page isn't here.", lead "The link may be old or mistyped. Here is where to go."), then on `--paper` one
`--surface` panel (`--r-panel`, `--pad`) with the three-line hours list and the existing 2-column `.nf-acts` (Front page primary;
All events, Call, Directions outline pills). Absolute `/Mulligan-Games-Website-concept-/` paths everywhere, the Fraunces
preload included. `noindex` stays.

### 4.5 Admin chrome (light touch: fonts, tokens, header)

- **Fonts:** `.adm h1` (for example "Today, Friday Oct 30") becomes Fraunces 600 `clamp(1.75rem, 1.4rem + 1.6vw, 2.5rem)`, lh
  1.05. `.adm h2`, `.roster-title`, `details.past > summary`, `.fgroup > legend` become Fraunces 600 at their current sizes.
  `.top-title` becomes Fraunces 600 1.375rem. **Kept in Archivo condensed:** `.cnt-n`, `.wpos`, `.evb-t`, `.prod-nums dd`
  (counter numbers). Event tiles (`.evb` names) become Archivo 700 at 100% width.
- **Tokens:** nothing new for admin. Buttons stay `--r-ctl` (`.adm .btn { border-radius: var(--r-ctl) }`, overriding the public
  pill), and 56 px targets stay.
- **Header/sidebar:** the sidebar stays `--charcoal`. Under the plate, "SHOP ADMIN" (uppercase tracked) becomes "Shop admin" in
  Fraunces 600 1.125rem cream. The phone/tablet top bar and the sidebar get a 3 px `--brick` top rule (`border-top`) to tie them
  to the public header. Current section: the 4 px `--act` bar, unchanged. No photos in admin (unchanged).
- Each admin page head gets the Fraunces preload (`../fonts/fraunces.woff2`).

---

## 5. Package split (3 coders, disjoint files)

Shared contract (everyone codes against these names now; A ships them first): tokens `--font-display`, `--t-hero`,
`--t-page`, `--t-2xl`, `--t-xl`, `--t-card`, `--t-row`, `--t-lead`, `--sec-y`, `--head-gap`, `--pad`, `--r-panel`, `--r-btn`,
`--lift-panel`, `--lift-band`, `--tn-bg`, `--on-tn`, `--on-tn-2`, `--on-tn-k`, `--scrim-rgb`, `--hero-act`, `--kicker`. Classes
`.kicker`, `.lead`, `.page-head`, `.tn-band` (+ `.tn-head`, `.tn-cards`, `.tn-rest`), `.wk-card`, `.btn-hero`, `.btn-on-dark`,
`.btn-row`, `.dl-act`, `.dl-more`, `.stamp`. JS `V.compactLine(occ, now, base, photo, opts)` and
`V.weeklyRow(s, now, from, to, opts)` with `opts.action: 'link' | 'button' | null`, and
`V.tonightBand(occs, now, opts) -> { cards: div.tn-cards, rest: ul.day-lines | null }`.

**Done when (all packages):** `tests.html` 0 failed (the headless command in `prototype/README.txt`, budget 120000). No new
data-fed `innerHTML` (createElement + textContent. The one existing path, `MG.eventCard` in a `<template>`, may be reused,
not extended). Checked at 390 and 1280, light and dark (`?theme=`), with shots read. No horizontal overflow at 360. Pages
subpath works (relative paths, the 404 absolute). Network on load: own origin only (fonts included). Don't commit.

### A: Look and shared parts
**Owns:** `prototype/fonts/*`, `css/tokens.css`, `css/site.css`, `css/ui.css`, `js/event-views.js`, `js/mg.js` (only if card
markup must change), `tests.html`, NEW `js/tests-look.js`, `DESIGN.md`.
1. Fraunces woff2 + OFL + README (1.1). `@font-face` and the fallback face in tokens.css.
2. Tokens (1.2, 1.4). Update the contrast comment at the top of tokens.css.
3. site.css base. h1 to h4 use `--font-display` 600 per the 1.1 table. Swap every public `--font-cond` + 900 display use
   (`.dc-num`, `.day-dia`, `.day-name`, `.slot-t time`, `.ev-title`, `.ev-cost`, `.ev-stat-big`, `.later h3/b`, `.cedh h2`,
   `.cedh-facts dt`, `.cedh-next h3`, `.empty-h`) to Fraunces 600. `.sec` uses `--sec-y`. Buttons become pills (Archivo 700,
   100% width), plus `.btn-hero` / `.btn-on-dark` / `.btn-row`. `.kicker`, `.lead`, `.page-head` + coursing rule, `.tn-band`,
   `.wk-card`, the row grid with `.dl-act` (3.2), nav weight and highlight underline, footer h2, chips, strip tiles. Print rules for
   the band and the head. **site.css is loaded by the admin too:** list every change that shows there in a note to C.
4. ui.css: the detail dialog (4.3), `.su-big` in Fraunces.
5. event-views.js: the `opts.action` in `compactLine` / `weeklyRow` per the 3.2 table, and `V.tonightBand` (first 3 cards via
   the existing todayBlock path, the rest as rows). createElement only.
6. tests-look.js (registered in tests.html): one control per state (open = one `.btn-act` "Sign up" to `#su-<key>`; waitlist =
   `.btn-2`; external = `rel=noopener` + `.vh`; walk-in = `.dl-more`; cancelled = `.stamp` and no button). An XSS title stays
   text in a row with an action. `document.fonts.check('600 20px Fraunces')` after load. A luminance check of the 1.2 pairs.
7. DESIGN.md: 1 (one Round 8 paragraph), 2.1/2.3/2.4 additions, the 3 table replaced, new section 18 pointing here.

**Done when:** the shared contract exists and is used by no page yet broken; the existing tests pass with the new type (a
font-only change may move boxes: fix the CSS, not the tests, unless a test pins an old font); tests-look green.

### B: Front page
**Owns:** `index.html`, `css/front.css`, `css/clips.css`, `js/front.js`, `js/clips.js`, `js/tests-front.js`, `js/tests-clips.js`.
1. Hero (2.1 to 2.4). Remove the featured cards, "Watch a clip", the caption and the clips link. Next-up goes into the strip,
   the pill goes left, the D46 padding goes on, plus the scrim, heights and the h1 spans. Keep D53 `wireVideo` (`HERO_FILES` are
   already true for the Desktop montage). Add the Fraunces preload.
2. Tonight band (3.1): `renderTonight()` with the lead-day rule and the empty state.
3. This week (3.2): `.wk-card` around `#days` + `.later`. Lead day excluded. `isCardDay` and the card path in `renderDays` go
   (rows only). Chip counts match the card. The strip's lead tile goes to `#tonight`. Rows use `opts.action: 'link'`.
4. What we play (3.3), static HTML plus counts.
5. cEDH, Clips, New + What people say, Visit, footer (3.4 to 3.8). Delete `section#community` and its render code (keep
   `#proof-rate` / `#proof` in `#new`).
6. Tests. Remove the featured-card, "Watch a clip" and caption tests (D51/D53 hero checks 900 to 1920, 390 clip button, `.media-cap`
   at 390/768/900). Rewrite "today and the next day are cards" as "the lead day is cards in `#tonight`, other days are rows in
   `#days`". Add: no `iframe` and no `[data-clip-id]` in `.phero`; `#nextup` inside `.phero-strip` and inside the first screen at
   390x844; the strip's last 76 px are free at 390 and 1280 (FAB box does not intersect `#nextup` or `#vid-btn`); the h1
   is 2 lines at 1280; Tonight always has a heading (closed-Monday clock `?now=2026-11-02T12:00` gives "Next up: Wednesday");
   chip counts equal the rows shown; each row has at most one `.btn-act`.

**Done when:** first screen at 390x844 = chip, headline, sub, both buttons, strip above the quick-actions bar; at 1280x900 the
strip sits at the fold; pause on the sign frame and the white-room frame and the copy is clear; the page is shorter than
today's 11,366 px at 390 (target about 7,500) and 7,972 px at 1280 (target about 6,000).

### C: Events, 404, admin
**Owns:** `events.html`, `404.html`, `css/events.css`, `js/events-page.js`, `admin/*.html`, `css/admin.css`, `js/admin-shell.js`
(other admin js only if a heading id needs it), `js/tests-events.js`, `js/tests-ui.js`.
1. Page head on events (chips and controls inside) and 404 (4.1, 4.2, 4.4). Add the Fraunces preload (the 404 with the absolute path).
2. Events Tonight as the full-bleed band (ids kept), Special events kickers, Every week as rows in one `.wk-card`
   (`opts.action: 'button'`, dialog and form wiring unchanged).
3. Admin chrome (4.5), including the `.adm .btn` radius override and the fixes for anything in A's admin note.
4. Tests. tests-events: weekly rows at 1280 too (title links to the next date, one action, F7 phone test still true); Tonight
   band ids and text; Special events first two dates share a row. tests-ui: admin h1 text unchanged; the admin uses
   Fraunces for h1 and Archivo for `.cnt-n`.
5. 404 check: from the scratchpad, `cmd //c mklink /J <scratch>\pages\Mulligan-Games-Website-concept- <repo>\prototype`, serve
   `<scratch>\pages` and open `/Mulligan-Games-Website-concept-/404.html`. Or check on Pages after the push.

**Done when:** events at 1280 is visibly shorter (today 4,336 px; target about 3,000) and reads head, then brick Tonight, then
Special, then the week card; the dialog opens from a row and from a card, Esc and X close it, and focus returns; admin Today at
390 and 1280 looks the same apart from the type and the brick rule (no layout change, 56 px targets).

**Order:** A1 to A3 and A5 first (about the first hour). B and C build markup against the contract in parallel and pick up the
CSS when it lands. B and C never edit A's files. A change needed there goes to A as a one-line request.

---

## 6. For the Desktop (port to `src/`, after the Laptop review)

- **Fonts:** copy `fraunces.woff2` to `public/fonts/` with `OFL-Fraunces.txt`. Same `@font-face` and fallback. Preload in the
  layout head. The CSP is unchanged (`font-src 'self'`).
- **Tokens:** copy the round-8 additions into `src/styles` with the same names (tokens are one source; re-run the 1.2 table if
  any value changes).
- **Hero (`Hero.astro`):** your 3c1df2f build already plays the montage on every width. Remove the **featured clips row under the
  hero**: in the new order Tonight sits right under the hero, and the clips stay in "Clips from the shop". Move next-up into
  the strip, the pause pill to the left, the 76 px right padding (ThemeFab), the 2.3 scrim layers, the h1 spans and the two pill
  buttons.
- **Front page (`src/pages/index.astro`):** the new order in 3. New `TonightBand.astro` (server-rendered from the same
  occurrences; the lead-day rule as in front.js), the week card with rows and one action each (Astro escaping, no `set:html`),
  `WhatWePlay.astro` (static), reviews moved into the shop section, Discord into Visit, Between events removed.
- **Events and the per-date page:** the page head component (also on New here?, 404 and Privacy), Tonight as the band, Every week
  as rows. The per-date page (D16) takes the 4.3 type and action box.
- **Admin:** h1/h2/top-title in Fraunces, counter numbers in Archivo condensed, the brick top rule, buttons stay `--r-ctl`.
- **Wix:** D54 asks the Desktop to research the same gallery (https://www.wix.com/website/templates). Compare with
  `docs/research/wix-templates.md`, and log anything that changes this spec as a decision. Don't fork the look.

---

## 7. Proposals for the boss (log from D57, odd numbers)

**Logged (boss, 2026-10-28):** the Desktop had used D57, so these are **D59** (look), **D61** (front page, plus boss trims) and **D63** (events page, plus Special events as rows); the review is **D65**. The trims are not in this spec: see DESIGN 18 and `docs/review/round-8-port.md`.

- **D57 (proposed):** the round-8 look is "Card-table warm": Fraunces display + Archivo body, self-hosted. Public buttons are
  pills. One accent rule (1.3). Section rhythm `--sec-y` replaces D37's 48/72 px.
- **D59 (proposed):** front page order as in 3. "Between events" is removed (reviews go to the shop section, Discord to Visit,
  Lately off the home page). Only the lead day is shown as cards (in Tonight). The hero's next-up moves into the strip (D36's
  "next up in the first screen" still holds). The strip caption is retired.
- **D61 (proposed):** the events page's Every week becomes rows at every width (supersedes D36's weekly card grid and F7's
  640 px split). One page head pattern for events and the 404, still with no photo (F13 stands).
- **Noted for the owner, not a design call:** the montage's packed-room shots show identifiable customers, some of whom look
  young. D54 says no recognisable minors, so the boss should confirm the store is fine with those shots before a public deploy.
