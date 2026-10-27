# Laptop round 4: formatting fixes in `prototype/`, and the event detail layout

Boss, 2026-10-27. Input: `docs/review/round-4-formatting.md` (designer, F1-F24 + "Event detail: one layout").
Rulings: D37. Owner direction (D36): cleaner, slicker, more concise, laid out like the VFW site; formatting before new
features. Laptop scope: `prototype/` and docs. The Desktop owns `src/` (items for it at the end, to post on #2).

**Why this order:** first what makes the shared link look "jumbled" in the first minute (boxes inside cards, repeated
words, sections that run together, bands that vanish in dark), then the long phone pages (events page 10,400 px, week
strip, closed days), then the detail view, then the counter and the 404.

---

## Rulings, finding by finding

| Id | Ruling | Why (one line) |
|---|---|---|
| F1 card boxes | **Now (A, CSS only)** | The main "jumbled" cause; done in CSS so `MG.eventCard` markup stays (no template rewrite). |
| F2 repeated words | **Now (A front/sample, B cards/events page)** | Says each thing once; the walk-in line goes from cards but stays in the detail action box. Overrides D36's per-card walk-in line. |
| F3 section rhythm + bands | **Now (A)** | VFW pattern. Visit keeps its three columns but loses the card box: supersedes D36's "one three-column card" (the box was the means, not the point). |
| F4 band tokens / scheme | **Now (A)** | A real bug: light mode never gets the spec'd brown, dark bands vanish. Restores DESIGN 6 / D28. |
| F5 time labels + rail | **Now (A)** | Extends D36 (already hidden on wide screens) to phones; each card shows its own time. |
| F6 chips one row ≥900 | **Now (A)** | One row instead of 11 boxes; phones keep the 48 px strip. |
| F7 events page on a phone | **Now (B)** | 15 full weekly cards is the longest page owners will scroll; reuses the front page's row. |
| F8 hero | **Now: crop only (A). Cut: the height cap** | The owner asked for a bigger hero (D36); shrinking it fights that. The real fix is Q21's landscape clips. |
| F9 closed days merged | **Now (A front + CSS, B events page)** | Two rows of nothing become one quiet line; anchors kept. |
| F10 footer as an index | **Now (A CSS + index, B events.html, C 404)** | Riverside / VFW pattern; links the footer never had. |
| F11 orphaned clock icon | **Now (A)** | Bug. |
| F12 Special events | **Now (B)** | Keeps D36's two dates across; the date becomes a kicker, and today's dates aren't listed twice. |
| F13 events page head | **Now (B). Photo: drop it at every width** | It repeats the front page's door photo; the new detail picture carries photos onto the events path (D27 still met). |
| F14 New and preorders | **Now (A)** | Fills the empty cell, drops a tinted band per tile. |
| F15 hours note | **Now (A)** | Bold three-line note in a table cell; one plain line under the table. |
| F16 theme pill | **Now, labelled (A CSS + index, B events.html + `MG.scheme.html`)**: drop the "Theme" word everywhere, quieter outline on the brick header; keep "Light" / "Dark" words. **Icon-only button → mediator.** | D27 is the owner's explicit "clearly labelled" switch; a designer finding can't overrule it. Width drops from ~245 to ~170 px. |
| F17 phone hero height | **Now (A)** | The D33 bar covers the hero strip on the shared link. |
| F18 phone week strip | **Now (A)** | Removes one of three sideways strips; seven tiles fit at 390. |
| F19 + detail spec (dialog) | **Now (B)**, with two changes: the close X sits at the dialog's top-right (sticky, over the picture), not in the name bar under it; "Also on Friday" is **cut from the dialog** (the list behind it already shows that day). | With the picture on top, an X in the name bar is 220 px down and scrolls away on a phone. |
| Detail spec (build page) | **Desktop**, as written, including "Also on Friday". | The build's page is a standalone page; the designer's spec is complete. |
| F20 Between events | **Now (A)** | Heading levels at one size per level. |
| F21 three links to events | **Now (A)**: keep the head link and "See every date", drop "See all N events". | One link per job. |
| F22 admin counts and alerts | **Now (C)** | Counts aren't buttons; the counter screen is the owners' daily view. |
| F23 admin phone walk-in bar | **Now (C)** | A quarter of the phone screen for one field. |
| F24 404 buttons | **Now (C)** | Small, and it carries the F10 hours list. |
| Every F-item that exists in `src/` | **Desktop** (list below) | The prototype is the spec. |

Earlier decisions checked: D28 look (palette kept; F4 restores its brown; the card's circled cost pip was DESIGN anatomy,
not D28), D33 bar (F17 makes room for it), D34 nav (untouched), D36 hero (full bleed kept; F8 cap cut). Nothing here
adds a feature.

---

## Rules for all three packages

- **Ownership is exclusive.** Edit only your files. Need a change elsewhere? Write it under "Asks" in your hand-back.
  **Frozen** this round (no change; C owns them if one turns out to be needed): `js/rules.js`, `js/stock.js`,
  `js/state.js`, `js/actions.js`, `data/templates.js`, `js/admin-shell.js`, `admin-editor.js`, `admin-events.js`,
  `admin-inventory.js`, `admin-views.js`, `admin/*.html`, `js/tests-lib.js`, `tests-rules.js`, `tests-boot.js`, `fonts/`,
  `img/`, `media/`.
- **Owner rule (D20 client side).** No data (escaped or not) into `innerHTML`, `insertAdjacentHTML` or `outerHTML`. Any
  line you rewrite that carries data is converted to `createElement` + `textContent` / `setAttribute`. Constant strings
  and `MG.icon()` paths are fine. Every new renderer gets a hostile-title test (`window.__xss` stays 0, text shows).
- **Calm (D28, DESIGN 2.4).** No new animation, slide or hover lift.
- **Keep hooks other tests use:** `#det-dlg`, `.det-dates a`, `[data-signup]`, `.su`, `.su-done`, `.slot-t time`
  (hidden by CSS, still in the markup), `.day-more` (removed by A16, which updates its test), the texts "You're in.",
  "Seat 12 of 28", "waitlist (#4)", "Join the waitlist", "Wizards EventLink", "Prize packs paid by record",
  "Nothing. Packs are included".
- **Every "done when" includes:** `prototype/tests.html` 0 failed (122 today, plus new tests) with the command below;
  checked at 390 and 1280 px, light and dark, from disk and under the Pages subpath `/Mulligan-Games-Website-concept-/`
  (relative paths only, except `404.html`); no console errors; no sideways page scroll at 390 px.
  ```
  timeout 60 "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=15000 --dump-dom "file:///C:/Users/alexm/projects/Mulligan-Games-Website-concept-/prototype/tests.html" 2>/dev/null | grep -o '<span id="summary"[^<]*<'
  ```
- Don't commit or push; hand back the files changed, before/after measurements asked for below, and any Asks.

**Order:** A and B start together. B's events page uses three things A adds to `site.css` (A0 below); until they land
B works on the detail dialog (B1) first. C starts F22-F24 at once; C4-C6 wait for A and B.

---

## Package A: shared look and the front page

**Owns:** `prototype/css/site.css`, `prototype/css/tokens.css`, `prototype/css/front.css`, `prototype/index.html`,
`prototype/js/front.js`, `prototype/data/sample.js`, `prototype/js/tests-front.js`.
**Depends on:** B removes the walk-in line from `MG.eventCard` (`mg.js`), which also clears it from front-page cards.

0. **For B, first (shared CSS).** Move the base `.day-lines` / `.day-line` rules (`front.css:162-170`) into `site.css`
   (keep the `#days` overrides in `front.css`). Add `.day-off` (F9 below) and the F10 footer grid. Tell B when done.
1. **F4 bands.** `tokens.css:49` `--band: light-dark(#3E2A22, #2A1D17)`. Move `color-scheme: dark` off `.openbar`,
   `.cedh`, `.site-foot` onto their inner wrappers (`.openbar-in`, `.cedh-in`, `.foot-in`). In dark:
   `.openbar, .cedh, .site-foot { border-block: 1px solid rgb(255 255 255 / 0.08); }` (under
   `:root:has(meta[content="dark"])` / `@media (prefers-color-scheme: dark)` as tokens.css already keys dark). Add
   `.openbar-in, .cedh-in, .foot-in` to the print rule at `site.css:443`.
2. **F3 rhythm and bands.** `.sec { padding-block: var(--s7); }`, from 1024 px `padding-block: 4.5rem`; delete
   `.week { padding-top }` (`site.css:173`) and `.shop { padding-top }` (`front.css:114`). Bands (front.css, by section):
   This week `--paper`; Inside the shop `--surface`; cEDH `--band`; New and preorders `--paper`; Visit `--surface`;
   Between events `--paper`; footer `--band`. Every `--surface` band: `border-block: 1px solid var(--line)`. `.visit-in`
   loses border, radius, shadow and its inner padding; the three columns keep their hairlines. Delete the duplicate
   `.visit { background: var(--paper) }` (`front.css:141`). Further out keeps its box.
3. **F1 card shapes (CSS only, `site.css:233-290`).** `.ev-bar { border-bottom: 0; padding-bottom: 0.15rem; }`;
   `.ev-type { padding: 0 1rem 0.6rem; border-bottom: 1px solid var(--line); }` (game line reads as the bar's second line;
   one hairline between head and body). `.ev-cost { border: 0; min-width: 0; height: auto; padding: 0; background: none;
   font-size: var(--t-lg); }`. `.ev-stat { border-color: transparent; background: none; }`; keep today's border and fill
   only for `.ev[data-state]` = `full`, `waitlist`, `few`, `needs`, `cancelled` (the `MG.seatState` names already used in
   `site.css`); `open`, `closed`, `external`, `walkin`, `counter` get plain text. `.ev-stamp { transform: none; }`. Same for the front cEDH and preorder tiles that use `.ev-stat`
   (A13 below).
4. **F11.** `.ev-when > span:not(.tag) { flex: 1 1 10rem; min-width: 0; }`.
5. **F5.** `.slot-t { display: none; }` and `.slot[data-multi] .slot-cards { border-left: 0; padding-left: 0; }` at every
   width; drop the 1024 px `.slot` two-column grid (`site.css:227`). Markup unchanged.
6. **F6.** From 900 px: `.chip { min-height: 2.5rem; padding: 0 0.75rem; font-size: var(--t-sm); border-width: 1px; }`,
   `.chip-n { background: none; padding: 0; min-width: 0; }`. Phones unchanged. Check one row at 1280 on both pages.
7. **F16 (labelled, slimmer).** Delete the `.scheme-k` "Theme" span from `index.html`; drop `.scheme-k` CSS. In the
   header: `.site-head .scheme { background: transparent; border-color: rgb(255 255 255 / 0.35); color: var(--on-band); }`,
   pressed button cream fill / dark text; buttons stay 44 px. Same `mg-scheme` behaviour.
8. **F17.** Under 900 px `.phero { min-height: clamp(28rem, 62svh, 40rem); }`. Measure at 390x844: the hero strip's
   bottom must sit above 788 px (the D33 bar's top).
9. **F8 (crop only).** From 900 px `object-position: 50% 82%` on `.phero-media img, video` and
   `background-position: 50% 82%` on `.phero-media`. No height change.
10. **F18.** Under 768 px: `.wdeck ol { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); overflow: visible;
    margin-inline: 0; padding-inline: 0; gap: 4px; }`, `.wdeck .dc-num { font-size: 1.5rem; }`, `.dc-cap` hidden (the
    aria-label keeps the words). Tiles at least 44 px wide at 360.
11. **F2 front copy.** `front.js:256`: compact rows drop "Walk in"; keep only the exceptions ("Sign up here",
    "Pre-register at the counter", "Sign up on TopDeck", "Invite only", "N seats left"). One `.sec-note` under the This
    week head: "Most nights are walk-in. Cards with a Sign up button hold seats." cEDH (`front.js:292`): the line is
    "10 AM · $40"; the stat reads "80 registered" (no "on TopDeck" small line; the button already says TopDeck). Preorder
    tiles: drop "Preorders in store only." `sample.js`: drop the trailing "Kids welcome." from Learn to Play Pokemon.
    Rewritten lines go to `createElement` (owner rule).
12. **F9 front.** `front.js:195-201`: consecutive closed days become one `<div class="day-off">` holding an empty
    `<span id="d-YYYY-MM-DD">` per day and one `<p>`: "Monday and Tuesday · closed" (three or more: "Monday to Wednesday
    · closed"). CSS: no diamond, `--ink-2`, `--t-sm`, `padding-block: var(--s3)`, hairline above.
13. **F14 New and preorders.** From 1024 px: tiles `grid-template-columns: repeat(3, minmax(0, 1fr))`; the photo
    `grid-row: span 2; height: 100%; object-fit: cover`. Remove the tinted icon band from each tile (markup in `front.js`
    and CSS `site.css:343-358`). Countdown box: border only on the last 3 days (A3 rule).
14. **F15 hours.** `front.js:344`: the cell shows only the changed hours plus a `tag-upd` "Nov 1"; the reason goes in one
    `--ink-2` line under the table ("Sun Nov 1 opens at 10 AM for the cEDH Championship Series."). `.hours th { display:
    flex; gap: var(--s2); align-items: center; }` so "Today" sits beside the day name. Drop `.hours-note` styles.
    Visit note: just the address line (free play stays in the hero strip and the FAQ).
15. **F20.** `index.html:243-268`: the h2 and its Discord line become a normal `.sec-head`; below it three equal columns
    (Discord | What people say | Lately), each h3 `--t-lg`, `align-items: start`. One column under 768 px.
16. **F21.** Remove "See all N events on the events page" (`.day-more`); keep the head link and "See every date".
    Update the `tests-front.js:72` assertion accordingly.
17. **F10 footer.** `index.html:270-279` and the CSS (`site.css:397-403`): from 900 px
    `grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: var(--s6); padding-block: var(--s7) var(--s5)`. Columns: Brand (plate +
    "Card games, tables and a crew who know the formats."), Visit (address, phone, Directions), Hours ("Wed–Thu 2–10 PM",
    "Fri–Sat 2 PM–midnight", "Sun 1–10 PM", "Mon–Tue closed"), Explore (All events, This week, cEDH, Preorders, Discord;
    `events.html` links keep `?now=` through `keepNow`). Labels: `h2` styled `--t-xs`, 750, uppercase, 0.08em,
    `--on-band-2`. Under them a hairline row: the concept line + "Shop admin (concept)". Phones: Visit | Hours two
    columns, Explore as a wrapped row. Give B and C the exact footer markup in your hand-back (they copy it).

**Tests (`tests-front.js`):** compact rows contain no "Walk in" and keep "Sign up here" where the sample has it; cEDH line
is "10 AM · $40"; closed Mon/Tue is one `.day-off` with both `d-` anchors; the hours exception reason is one line outside
the table; at `?theme=light` the footer's computed background is `rgb(62, 42, 34)`, and at `?theme=dark` it differs from
the page background; no element contains the text "Theme"; a hostile title in a compact row is text.

**Done when:**
- [ ] At 1280 every gap between front-page sections is the same (write the measured px), bands alternate as listed, the
      cEDH band and footer have a visible edge in dark, and the light-mode bands are brown, not near-black.
- [ ] A weekly card at 1280 has at most two outlined shapes (the card, and the stat box only when it needs attention).
- [ ] At 390x844 the hero strip clears the bottom bar; the week strip doesn't scroll; chips are one row at 1280.
- [ ] No card or row on the front page says "Walk in"; the section note says it once.
- [ ] Footer is four columns at 1280 with working links (keeping `?now=`); theme switch reads "Light | Dark", ~170 px.
- [ ] Front page height at 390 and 1280 before / after written in the hand-back.

---

## Package B: events page, card builder and the detail dialog

**Owns:** `prototype/events.html`, `prototype/css/events.css`, `prototype/css/ui.css`, `prototype/js/events-page.js`,
`prototype/js/event-views.js`, `prototype/js/mg.js`, `prototype/js/ui.js`, new `prototype/js/tests-events.js`.
**Depends on:** A0 (`.day-line`, `.day-off`, footer CSS in `site.css`) for B3-B5 and B7; C wires `tests-events.js` into
`tests.html`. `mg.js`, `ui.js` and `event-views.js` are loaded by admin and tests too: keep every exported function and
its arguments; `U.dialog` keeps its current call shape (new options only).

1. **F19 + detail spec: the dialog.** Rewrite `V.detail` (`event-views.js:~60-95`) with `createElement`, in the spec's
   390 order, inside `.dlg-det` (42rem):
   - `ui.js` `U.dialog`: new `opts.bare` (no `.dlg-top` bar; the caller passes `opts.labelledby` and `opts.focus`, a
     selector). `events-page.js` opens the detail with `{ cls: 'dlg-det', bare: true, labelledby: 'det-title', focus:
     '#det-title' }`. Light dismiss, Esc and the `#e-<key>` hash behave as now. No "Event details" text anywhere.
   - Close X: `button.dlg-x` with `aria-label="Close"`, first child of the article, `position: sticky; top: var(--s2);
     float: right; margin: var(--s2) var(--s2) calc(-1 * var(--tap))`, surface fill, 1px `--line`, single focus ring.
   - Picture: `figure.det-pic` 16:9, no radius, `border-bottom: 3px solid var(--gc)`, `loading="eager"`, width/height
     set. Default per game: magic and cedh `media/video/cedh-monthly-event-poster.webp`, pokemon
     `media/video/sealed-packs-counter-poster.webp`, else `img/social/interior-welcome-banner-800.webp`; `alt` describes
     the picture ("Players at tables during a Commander night at Mulligan Games", etc.).
   - Head: kicker `p.det-kicker` ("Tonight" / "Tomorrow" when true, else "Fri, Oct 30"; `--t-sm` 800 uppercase 0.06em
     `--mark`); `h2#det-title` (tabindex -1, `--font-cond`, 800, `clamp(1.9rem, 1.3rem + 2.6vw, 3rem)`) with the price as
     plain text on the same baseline (`.det-price`, `--t-xl`, "Entry:" hidden prefix); game + format line; time line
     (`--t-md` 650); status banner (changed / cancelled, as now); tags.
   - Action box `.det-act` (the only box: `--surface`, 1px `--line`, `--r-card`, `--lift`, `padding: var(--s4)`): state in
     words + big number, the `[data-signup]` button full width, arrive-by line, then a small `btn-2` "Add this date to my
     calendar" (`data-ics-one`). Walk-in events: "Walk in. No sign-up needed." here (the only place it still shows).
     External: the tool link. Cancelled or past: no box; the banner plus "Next one: Fri Nov 6".
   - "About this night" (h3 `--t-lg`, hairline above): `dl.det-list` without row borders; terms `--ink-2` 650 (stacked under
     640 px as `--t-xs` uppercase); rows with no value left out; event code row "Event code ABC123 [Copy] on Wizards
     EventLink" (or the tool link); description last, max 62ch.
   - "Other dates": `ul.det-dates`, the next 6 dates after this one, one per row: linked date, start time, seat state in
     words ("open", "few seats", "full", "cancelled" struck + word in `--bad`, "changed"). Two columns under 640 px. Then
     `btn-2` "Add every Friday to my calendar" (`data-ics-series="<series id>"`, handled in `events-page.js` with
     `R.ics()` over that series' dates in the window). One-offs: section left out.
   - "Getting here": address, parking line, the "New here?" line for beginner-friendly events, then Directions + Call
     `btn-2` in `grid-template-columns: 1fr 1fr`.
   - "Also on Friday": **not in the dialog** (ruling above).
   - CSS: replace `ui.css:73-86` (`.det*`) with the above; drop `.det .ev-bar { padding-right }`. Delete the now-unused
     escaped template code.
2. **F2 cards and weekly list.** `mg.js:304` and `event-views.js:41`: no walk-in line on cards (nothing in `.ev-how` for
   walk-in). `V.weeklyCard` (`event-views.js:214-221`): the time line is "7 PM to 10 PM"; the "Next:" line only when the
   next date is cancelled or changed (keep the existing cancelled sentences). `events-page.js:114`: the day heading reads
   "Wednesday" + `<span class="wk-next">· next Nov 4</span>` (`--t-sm`, `--ink-2`). One `.sec-note` under the Every week and
   Tonight heads: "Most nights are walk-in. Cards with a Sign up button hold seats." Rewrite `renderWeekly` /
   `renderSpecial` string building with `createElement` (they're being rewritten anyway).
3. **F7 phone weekly list.** Under 640 px (`matchMedia('(max-width: 639px)')`, re-render on change), Every week renders
   each series as one `.day-line` row (game dot, time, linked title to `#e-<next key>`, bits: fee, exceptions only) under
   its day heading. Tonight and Special events keep full cards. From 640 px: cards (with F1/F2).
4. **F9 events page.** `events-page.js:114-116`: consecutive closed days with no cards become one `.day-off` row
   ("Monday and Tuesday · closed"), same markup as A12.
5. **F12 Special events.** From 1024 px: `#special .day { grid-template-columns: 1fr; }`, `.day-h` one line, no diamond,
   `--t-sm` 800 `--mark` (the date as a kicker above its card(s)); one kicker per date. When Tonight is showing, today's
   dates are left out of Special events.
6. **F13 head and controls.** Lede: "Every game night at the shop. Pick a game, check the seats, pay at the store."
   Delete the `.ep-photo` figure and its CSS (`events.css:8-18`) and the print rule's mention stays harmless. One controls
   row under the chips: Format select left; "Add to my calendar" (the `cal-menu`) and "Print the schedule" right, both
   `btn-2` with `min-height: 2.5rem`; Print hidden under 900 px. Measure: at 390x844 the first event (Tonight card or
   first row) starts above 788 px (was 1,022).
7. **F10 + F16 markup.** Replace the `events.html` footer with A's markup (A17); delete the `.scheme-k` span in
   `events.html` and in `MG.scheme.html()` (`mg.js:366`, admin gets the same slimmer switch).
8. Remove the now-redundant `.ep .slot-t { display: none }` (`events.css:75`; A5 hides it everywhere).

**Tests (`tests-events.js`, copy `pageTest`/`openPage` with the width argument from `tests-front.js`):** the detail
dialog has no "Event details" text, `aria-labelledby="det-title"`, focus on `#det-title`, a picture with alt, `.det-act`
holding `[data-signup]`, `.det-dates` with at most 6 items and state words, a series ics button; a cancelled date has no
`.det-act` and says "Next one:"; weekly cards' time line has no "Every"; no weekly card contains "Walk in"; at 390 px
`#weekly` has `.day-line` rows and no `.ev`; closed Mon/Tue is one `.day-off` with both anchors; at `now=2026-10-30T18:50`
no date of Oct 30 appears in `#special`; hostile title in the detail, a weekly row and a Special kicker is text.
Ask C to update `tests-ui.js:277` (`.ev-next` → `.wk-next` in the heading).

**Done when:**
- [ ] Events page at 390: height before/after written (target under 6,500 px from 10,400); first event above 788 px.
- [ ] Detail dialog at 390: action box fully inside the first 844 px; one heading; X reachable while scrolled; 1280 reads
      as the spec's phone order in a 42rem column.
- [ ] Every week says the day's next date once, in its heading; no card repeats it unless it differs.
- [ ] Special events at 1280: two dates across, kicker dates, no diamonds, nothing listed in both Tonight and Special.
- [ ] Admin pages still open with no console errors (they load `mg.js`, `ui.js`, `event-views.js`).

---

## Package C: counter, 404, test wiring, docs

**Owns:** `prototype/css/admin.css`, `prototype/js/admin-today.js`, `prototype/js/admin-roster.js`,
`prototype/js/tests-ui.js`, `prototype/js/tests-shared.js`, `prototype/tests.html`, `prototype/404.html`,
`prototype/README.txt`, `DESIGN.md`.
**Depends on:** C4 needs A's footer markup (A17); C5 needs B; C6 needs A and B handed back.

1. **Wire `tests-events.js`** in `tests.html` before `tests-boot.js` (404s until B creates it; fine).
2. **F22 Today.** `admin.css:106-110`: `.rstat` plain text, no border or fill, separated by `·`
   (`.rstat + .rstat::before { content: "·"; margin-right: var(--s2); color: var(--ink-2); }`); only `.rstat-warn` keeps
   its box; the jump-link variant keeps its 44 px hit area with no border. `admin-today.js:43-49`: the reminders become one
   line of text links joined by " · " ("3 low in stock · 3 will run short · Draft FNM Oct 23 not reported · 2 preorders
   arrived"), `--warn` icon on the first two, built with `createElement` (these lines carry data). `.rem` loses
   border/fill/pill (`admin.css:82-84`); wraps as text under 600 px instead of a scroll strip.
3. **F23 walk-in bar.** `admin-roster.js:40`: button content `<span>Add</span><span class="wb-long"> and check in</span>`
   (constant strings; accessible name stays "Add and check in"). `admin.css:366-367`: under 640 px `.walkbar { flex-wrap:
   nowrap; }`, `.walkbar .fld { flex: 1 1 0; }`, `.wb-long { display: none; }`, button `min-height: var(--tap-admin)`.
   Measure the bar at 390: about 72 px (was 135). Toast still clears it (re-check `--toast-bottom`).
4. **F24 404.** `.nf-acts { display: grid; grid-template-columns: 1fr 1fr; }` (Front page primary, then All events,
   Call, Directions); hours as a three-line list; footer replaced by A's F10 markup with absolute
   `/Mulligan-Games-Website-concept-/` paths.
5. **`tests-ui.js:277`:** after B lands, assert `#weekly .wk-next` instead of `.ev-next`. Admin tests: alert links are
   text links (a hostile series title in a reminder is text); walk-in button's accessible name is unchanged.
6. **DESIGN.md + README** after A and B hand back: 2.5 (theme switch "Light | Dark" without "Theme"), 6 (bands and
   rhythm, card anatomy without the cost pip and with the attention-only stat box, walk-in said once, closed days merged,
   phone week strip, hero crop, footer index), events page (phone rows, Special kickers, head and controls, no photo),
   section 7 detail (the round-4 layout; dialog differences: sticky X, no "Also on"), 9.2 Today counts and reminders,
   404. README: the new test count.

**Done when:**
- [ ] Admin Today at 390 and 1280: counts read as text, one alert line, no box until something needs attention.
- [ ] Walk-in bar is one row at 390 (height written) and the toast still clears it.
- [ ] `/Mulligan-Games-Website-concept-/nope` on Pages: two even button columns, footer matches the other pages.
- [ ] DESIGN.md matches what A, B and C built; tests.html 0 failed with `tests-events.js` wired.

---

## For the Desktop (one comment on #2; nothing here blocks the Laptop)

Round 4 is formatting only (D37). Port once the Laptop's round 4 lands; the prototype is the spec, and each F-id below
is in `docs/review/round-4-formatting.md` with exact CSS.
- **Event detail page (new layout):** build `src/lib/render.js:469-477` + `global.css:794-827` to the spec in
  `docs/review/round-4-formatting.md`, section "Event detail: one layout" (1280 two-block grid, 390 order, picture with
  per-game default and the series photo when set, kicker, plain price, one action box, About this night `dl`, Other dates
  always shown for a series with seat state and the series `.ics`, Getting here, **Also on <day>** rows). URLs,
  canonical, JSON-LD, banners and the no-JS form unchanged (15.4).
- **global.css / render.js cards:** F1 (no cost circle, game line in the bar, one hairline, stat box only for
  full / waitlist / few / needs / cancelled, straight stamp), F2 (walk-in said once per section, weekly "7 PM to 10 PM"
  with "next" in the day heading, cEDH "10 AM · $40" / "80 registered"), F5 (no slot time labels or rail), F11.
- **Bands and rhythm:** F3 (one section padding, alternating bands, Visit unboxed), **F4 bug** (`--band` light brown
  `#3E2A22` / dark `#2A1D17`, `color-scheme: dark` on the inner wrapper, not the band).
- **Front:** F6 chips one row ≥900, F8 hero crop 50% 82% (no height cap), F9 merged closed days, F10 footer index,
  F14 preorders grid, F15 hours note under the table, F16 theme switch "Light | Dark" without "Theme", F17 phone hero
  height, F18 seven fitted week tiles, F20, F21.
- **Events page:** F7 one-line weekly rows under 640, F12 kicker dates and no Tonight duplicates, F13 one-line lede,
  no head photo, one controls row.
- **Admin:** F22 Today counts as text and one alert line, F23 one-row walk-in bar on phones.
- **404:** F24 two-column buttons and the hours list.

## Deferred or cut (D37)

- **F8 hero height cap at 1440+:** cut (fights the owner's "bigger" hero, D36); revisit when Q21's landscape clips come.
- **F13 events-page photo at 16:9 from 900 px:** cut; the photo is dropped instead.
- **"Also on <day>" in the prototype dialog:** cut (the list behind the dialog shows that day). It stays in the build page.

## For the mediator

1. **F16 theme switch.** Designer: one 44 px moon/sun icon button like the VFW site, because the labelled pill competes
   with the nav and the owner asked for "like VFW" (D36). Boss/owner record: D27 is the owner's explicit "clearly
   labelled light/dark switch". Ruled for now: labelled "Light | Dark" without the "Theme" word; icon-only only if the
   mediator (or the owners at P3.4) say D36 replaces D27 on this point.
