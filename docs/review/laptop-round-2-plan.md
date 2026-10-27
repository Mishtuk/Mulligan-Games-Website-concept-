# Laptop round 2: what we fix in `prototype/` now

Boss, 2026-10-27. Inputs: `docs/review/live-concept-review.md` (designer, R1-R27) and
`docs/review/reference-sites-crossref.md` (advisor, ids X-A..X-F below refer to its snippets). Rulings: D32.
Laptop scope this round: `prototype/` and docs only. The Desktop owns `src/` (#14).

**Why this order:** the concept is what the owners click. First what they see in the first 10 seconds of the shared
link (busy moment, events first on a phone, a way into the admin, a preview picture), then what breaks at the counter
(overselling, a hidden toast, blank check-in buttons, squashed steppers), then hygiene (print, 404, deploy weight).

Phone number for anything that needs one: **(215) 789-3299**, `tel:+12157893299` (`docs/research/mulligan-public.md:20`,
already in `data/sample.js:21` and every page). The advisor's open question is closed.

---

## Rules for all three packages

- **Ownership is exclusive.** Edit only the files your package lists. Need a change in someone else's file? Write it
  under "Asks" in your hand-back; don't make it. Files nobody needs this round are listed under C as "frozen".
- **Owner rule (D20, client side).** New or changed code builds anything that carries data with `createElement` +
  `textContent` / `setAttribute`. No data (escaped or not) into `innerHTML`, `insertAdjacentHTML` or `outerHTML`.
  Constant strings and the icon SVG paths are fine. A line you rewrite gets converted; untouched escaped templates may stay.
- **Calm motion (D28, DESIGN 2.4).** No new animation, slide, reveal or hover lift. Colour transitions only.
- **Tests.** `prototype/tests.html` passes (89 today) plus your new tests; every fix that changes behaviour gets a
  test. Existing assertions in `js/tests-ui.js` are B's file: A must keep the events-page tests there passing
  **unchanged** (keep `[data-signup]`, `.su`, `.su-done`, `#det-dlg`, and the texts "You're in.", "Seat 12 of 28",
  "waitlist (#4)").
- **Every package's "done when" also includes:** checked at 390 px and 1280 px (B also 820 px), light and dark, from disk
  and under the Pages subpath `/Mulligan-Games-Website-concept-/` (relative paths only, except `404.html`); no console
  errors; no horizontal page scroll at 390 px except the intended sideways rows.
- Don't commit or push; hand back with the list of files changed and any "Asks".

---

## Package A: players (front page and events page)

**Owns:** `prototype/index.html`, `prototype/events.html`, `prototype/css/front.css`, `prototype/css/events.css`,
`prototype/js/front.js`, `prototype/js/events-page.js`, `prototype/js/event-views.js`, `prototype/js/mg.js`,
`prototype/data/sample.js`, new `prototype/js/tests-front.js`.
**Depends on:** C for `U.demoBar` (A5) and the `.print-only` / `.no-print` classes (A13); C wires `tests-front.js` into
`tests.html`. `event-views.js` and `mg.js` are also loaded by admin and tests: keep every exported function and its
arguments as they are.

1. **R3 busy moment by default.** `mg.js` `MG.now()`: no `?now=` means `D.demoNow`; `?now=real` means the real clock
   (with today's fallback to `demoNow` when the real date is outside `D.window`). `sample.js`: `demoNow:
   '2026-10-30T18:50'` (Friday, ten minutes before the 7 PM draft: public cards still take sign-ups, the counter has a
   check-in rush); add `{ label: 'Friday 6:50 PM', now: '2026-10-30T18:50' }` to `demoMoments`. Check the front page at
   18:50 shows tonight's 7 PM events with Sign up or Join the waitlist; if not, use `2026-10-30T17:30` and say so.
   `MG.isDemoClock()` stays true unless `?now=real`.
2. **R4 keep `?now=` on every link.** `front.js`: add `keepNow(path)` (same logic as `U.href`, `js/ui.js:41`); on init
   rewrite every static `a[href]` in the page that points to `*.html` (nav "All events", "All events and sign-ups",
   "See every date", footer); pass `href: keepNow('events.html')` to `MG.eventCard`; use it for the `#later` and
   `#rel-list` links (`front.js:246,286`). In-page `#...` links stay as they are.
3. **R1 events first on a phone.** `front.css:8`: under 768 px `grid-template-areas: "copy" "deck" "media"` and the media
   box at `aspect-ratio: 16 / 9` (`object-fit: cover`). Desktop layout unchanged.
4. **R6 (part) "All events" first** in the `index.html` nav list. (The edge fade waits for the mediator, below.)
5. **R15 + R2 one demo bar.** Replace the static `<aside class="demo">` in `index.html` with
   `<aside id="demo" class="demo-host"></aside>`, load `js/ui.js` after `mg.js`, delete `renderDemo()` from `front.js`
   and call `U.demoBar($('#demo'), { note: ..., owners: { href: 'admin/index.html', label: 'Owners: open the counter screen' } })`
   once C's new `U.demoBar` is in. Pass the same `owners` option from `events-page.js:267`.
6. **R2 footer link.** Copy the events page's "Shop admin (concept)" footer link (`events.html:122`) to `index.html`.
7. **R14 + font preload (heads of `index.html`, `events.html`).** `og:image` =
   `https://mishtuk.github.io/Mulligan-Games-Website-concept-/img/og/mulligan-games-og.jpg`; add `og:url` with that
   base (index: the base URL itself; events: base + `events.html`); add `<link rel="preload" href="fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>`.
8. **R5 compact week.** `front.js` renderDays: today and the next day that has events stay full cards; every later day
   renders as a day label plus one line per event (game dot + game name in text, time, title as the link, fee, seat
   state in words: `7 PM · Pauper Night · $10 · 3 seats left`), built with `createElement`. Each day keeps its
   `id="d-YYYY-MM-DD"` (the week strip links to it). After the list: "See all N events on the events page" (keeps
   `?now=`). Chip filter and counts behave as now. At ≥1024 px a day with one card lets it span the row instead of
   leaving an empty column. Update the "This week" bullet in DESIGN 6 via C's sync (list the spec changes in your hand-back for C10).
9. **R7 sign up in one step.** Card "Sign up" / "Join the waitlist" on the front page links to
   `events.html#su-<key>` (via `keepNow`); `events-page.js` opens the sign-up form straight away for `#su-`. From the
   detail dialog, "Sign up" replaces the dialog body with the form (back button "Back to details") instead of stacking
   a second dialog. `#e-<key>` keeps opening the detail.
10. **R16 Tonight first.** `events-page.js:81-138`: a "Today" block at the top (heading "Tonight" from 5 PM) with every
    date for today in time order, specials and weekly together; then specials, then weekly as now. Hidden when today
    has nothing. Respects the game and format filters.
11. **R17 confirmation copy.** `event-views.js:114-123`: one payment phrase in form and confirmation:
    "Pay $20 at the counter when you arrive." (free events: no line). Add the D26 personal link as a mock:
    "Keep this link to cancel or check your place:" + a read-only sample link + Copy button, and
    "We emailed it too." only when an email was given. Waitlist copy points to that link, not "this page".
12. **R26 + R23 small copy.** `events.html` `og:title` = its `<title>`. Opening an event dialog sets `document.title`
    to "<Event>, <Day Mon D>, <time> · Mulligan Games" and restores it on close. Front day header: drop the day-name
    chip when the heading already says Today or Tomorrow.
13. **X-C print button.** `events.html`: a "Print the schedule" `btn btn-2` next to the filters (wired in
    `events-page.js` with `addEventListener`, calls `window.print()`), class `no-print`; a `print-only` line at the end
    of `main`: "Mulligan Games · 445 York Rd, Warminster PA · (215) 789-3299 · Wed-Thu 2-10 PM, Fri-Sat 2 PM-midnight,
    Sun 1-10 PM". Print shows what the filter shows.
14. **R27 a real photo for New and preorders.** One store photo beside the tiles:
    `media/video/sealed-packs-counter-poster.webp` (29 KB; lazy, width/height set, alt "Sealed product on the counter
    at Mulligan Games"). No publisher box art. Phone: above the tile rail, max 220 px tall.

**Tests (`tests-front.js`):** no `?now=` gives Friday Oct 30 and `?now=real` gives the real date (or demoNow outside
the window) (A1); on `index.html?now=2026-10-30T19:30` every `a[href*=".html"]` carries that `now` (A2);
`events.html#su-<key>` opens the form without a detail dialog behind it (A9); the Today block lists today's dates in
time order and only those (A10); a hostile title in a compact week row and in the Today block shows as text (owner rule).

**Done when:**
- [ ] The plain Pages link opens on Friday 6:50 PM with tonight's events; `?now=real` shows the real day.
- [ ] At 390 px the h1 and the week strip are both inside the first 844 px (h1 was at 753 px); desktop hero unchanged.
- [ ] From the front page at any `?now=`, every link to another page keeps it; sign-up from a front card is one tap to the form.
- [ ] `#shop` starts at least 40% higher on the front page than before at 390 and 1280 px (write both numbers in the hand-back).
- [ ] Front page footer and demo bar both reach the admin; one demo bar, same wording as the other pages.
- [ ] `og:image` absolute and `og:url` present on both pages; events `og:title` matches its title.
- [ ] Print preview of `events.html` (with C's print CSS) is black on white, no buttons, store line at the bottom.
- [ ] tests.html passes, including the unchanged events-page tests in `tests-ui.js` and the new `tests-front.js`.

---

## Package B: counter (admin)

**Owns:** `prototype/admin/index.html`, `prototype/admin/events.html`, `prototype/admin/inventory.html`,
`prototype/css/admin.css`, `prototype/js/admin-shell.js`, `admin-today.js`, `admin-roster.js`, `admin-editor.js`,
`admin-events.js`, `admin-inventory.js`, `admin-views.js`, `prototype/js/tests-ui.js`.
**Depends on:** C for the toast pause and 48 px Undo (`ui.js`, `ui.css`) and the new `U.demoBar` `owners` option;
`U.confirm` keeps its current API.

1. **R10 waitlist is the primary when full.** `admin-roster.js:35` `walkBar()`: "Add to waitlist" is `btn btn-act`,
   "Seat anyway (29 of 28)" is `btn btn-2`; Seat anyway opens `U.confirm({ title: 'Seat anyway?', body: '<name> takes
   seat 29 of 28. The event is over its limit.', ok: 'Seat anyway', cancel: 'Go back' })` and only then submits.
   Rewrite `walkBar()` with `createElement` (it puts counts into markup). Enter in the name field adds to the waitlist.
2. **R11 (admin part) toast clear of the walk-in bar.** `admin.css`: on Today set `--toast-bottom` so the toast sits
   above the sticky `.walkbar` (`admin.css:164`) at every width (measure; about 9.5rem under 1024 px). Other admin
   pages keep 5.25rem / 1.25rem.
3. **R9 check-in button on phones.** `admin.css:123,127`: under 768 px show the tick at 0.35 opacity and a short "In"
   label instead of `color: transparent`; checked state as now. Keep the accessible name.
4. **R8 steppers full size.** `admin.css:331`: `.prod-acts .stepper { flex: none; }` and let Details wrap to its own
   row (or widen the last column to 19rem). Steppers render 56x56 at 1024 and 1280 px.
5. **R13 Unpaid as an outline.** `admin.css:143`: Unpaid is an outlined (warn-outline) segment with no fill; fill only
   the chosen Door / Online / Comped / Credit. Status still shown in words, not colour alone.
6. **R18 event buttons on Today.** `admin.css:88,95`: drop `nowrap`, `-webkit-line-clamp: 2`, full title in `title`
   attribute and accessible name.
7. **R12 (part) find the waitlist fast.** Stat chips on the roster ("3 on the waitlist", "5 checked in") become jump
   links to their lists (`#wait-<key>` etc.); the player ID moves onto the name line (one line per row at 820 px).
   The "Not here yet" filter goes to the Desktop list.
8. **R19 started under the minimum.** After an event's start time with fewer than `min` checked in, Today replaces
   "Needs N more to run" with "Started with 5 (min 8)" and two buttons: "Run it" (clears the warning for that date) and
   "Cancel this date" (the existing cancel flow with Undo). Before the start time nothing changes.
9. **R14 + font preload (heads of the 3 admin pages).** Same absolute `og:image`; `og:url` per page
   (`admin/index.html` etc.); font preload with `../fonts/archivo.woff2`. Pass `owners: { href: '../index.html',
   label: "See the players' side" }` to `U.demoBar` in `admin-shell.js:56`.

**Tests (in `tests-ui.js`):** update the "full event offers Add to waitlist and Seat anyway" test for the confirm step
(confirm resolves, then seated 29 of 28; cancel leaves nobody added) and assert Add to waitlist is the `btn-act`;
Enter adds to the waitlist; R19 shows "Started with" after the start time and "Needs" before it, and Run it clears it;
R13 the unpaid segment has no fill class until a payment is chosen; a hostile walk-in name in the confirm body is text.

**Done when:**
- [ ] A hurried tap on the primary button of a full event never oversells; Seat anyway needs a second, explicit tap.
- [ ] On Today at 390, 820 and 1280 px a check-in toast never covers the walk-in field.
- [ ] Phone roster check-in buttons show what they do; steppers are 56x56 at 1024/1280; a 28-row roster reads light.
- [ ] Event names on Today show up to 2 lines; the waitlist is one tap from the top of the roster.
- [ ] At 18:50 Friday no "Needs N more" shows for an event that already started.
- [ ] Admin heads: absolute `og:image`, `og:url`, font preload.
- [ ] tests.html passes with the updated and new tests.

---

## Package C: shared pieces, print, 404, media, docs

**Owns:** `prototype/css/site.css`, `prototype/css/ui.css`, `prototype/js/ui.js`, `prototype/tests.html`,
`prototype/js/tests-lib.js`, `tests-rules.js`, `tests-boot.js`, new `prototype/js/tests-shared.js`, new
`prototype/404.html`, `prototype/README.txt`, everything under `prototype/img/` and `prototype/media/` (deletions only),
`DESIGN.md`, `docs/research/social-photos.md`. **Frozen** (no change planned; C owns them if one is needed):
`css/tokens.css`, `js/rules.js`, `js/stock.js`, `js/state.js`, `js/actions.js`, `data/templates.js`, `fonts/`.
**Depends on:** C10 waits until A and B have handed back.

1. **Wire the tests.** `tests.html`: add `js/tests-shared.js` and `js/tests-front.js` (A creates it) before
   `tests-boot.js` (until A creates its file the tag 404s; the no-console-error check runs after A lands). Same
   absolute `og:image` in its head.
2. **R15 + R2 `U.demoBar`.** Rewrite with `createElement` (it now builds escaped `innerHTML`). One line, wraps to two
   at most at 390 px: "Concept with sample data." + note (short) · label "Pretend it's" + a `<select>` of
   `demoMoments` plus "Real clock" (`?now=real`), changing it navigates and keeps `#hash` and other params · "Reset demo
   data" button · optional `opts.owners` link. Reset: `MG.act.resetDemo()` with its toast when `MG.act` exists, else
   `MG.state.reset()` then `location.reload()` (front page). `.demo` CSS in `site.css:70-74`: at most 56 px tall at
   1280 px and 2 lines at 390 px; select and button at least 44 px tall.
3. **R11 (shared part) toast.** `ui.js:69-90`: pause the hide timer on `pointerenter` / `focusin`, restart it in full on
   `pointerleave` / `focusout`; `ui.css:62` `.toast-btn` `min-height: 3rem`. `--toast-bottom` stays the hook B sets.
4. **R24 theme switch.** `site.css:125-126`: buttons `min-height: 44px` (48 px if the header row keeps its height at 390).
5. **X-C print.** `site.css` `@media print`: force light (`color-scheme: light` on `:root` and on every element that
   sets `color-scheme: dark`: header, footer, open strip, bands), black on white, 11pt; hide `.skip`, `.demo`,
   `.demo-host`, `.site-nav`, `.scheme`, `.chips`, `.btn`, `.no-print`, video and decorative photos; keep the logo plate
   without shadow; `break-inside: avoid` on days and cards; card borders 1px black. `.print-only { display: none }` on
   screen, shown in print. Works for the events page (A13) and gives the front page a sane print too.
6. **X-E reduced-motion safety net** at the end of `site.css`, as in the crossref snippet E. Keep the targeted rules.
7. **R25 + X 404.** `prototype/404.html`: plate, "That page isn't here.", links to the front page, all events,
   today's hours (static text), Call (215) 789-3299 and Directions; absolute `/Mulligan-Games-Website-concept-/` paths
   for CSS, logo and links (404s are served at any depth); `min-height: calc(85svh - header)` so the footer doesn't sit
   under a short card; `noindex`; no JS needed.
8. **R20 media cleanup** (list below). `git rm` only; `source/` is not touched.
9. **README.txt.** The default clock (Friday 6:50 PM), `?now=real`, the new test count.
10. **DESIGN.md sync** after A and B hand back: 6 (phone hero order, compact week, Tonight block, one-step sign-up),
    6.1 (R21: "smaller file first", which for this loop is the mp4), 2.5 (absolute og:image, og:url), 5.x demo bar
    note, 9.2/9.4 (waitlist primary + confirm, toast position, Unpaid outline, started-under-minimum), 9.5 (steppers),
    print and 404 notes. `docs/research/social-photos.md`: mark the deleted files "removed from prototype/ in round 2;
    originals in source/social/, encodes in git history at 838e144".

**Tests (`tests-shared.js`):** toast stays while focused or hovered and hides after leaving (short `ms`); Undo button
is at least 48 px tall; the demo bar select lists every moment plus Real clock and its change target keeps the hash;
a hostile `note` in `U.demoBar` shows as text; reset without `MG.act` calls `MG.state.reset` (stub `location.reload`).

**Done when:**
- [ ] One demo bar, same words and controls on all 5 pages (front via A5), at most 2 lines on a phone.
- [ ] Toast pauses on hover/focus; Undo 48 px. Theme buttons at least 44 px.
- [ ] Print preview (light and dark mode) is black on white with no controls; front page prints sanely.
- [ ] `/Mulligan-Games-Website-concept-/nope` on Pages shows the 404 with working links and styles.
- [ ] The deleted files are gone, nothing references them (re-run the grep), the Pages artifact is about 13 MB smaller.
- [ ] DESIGN.md matches what A, B and C built; tests.html passes with all three new test sets.

### Media to delete (C8)

Checked with a grep of every `prototype/` HTML, CSS, JS and TXT file and the rest of the repo (only docs mention them).
Raw originals are in `source/social/` (untouched) and the encodes stay in git history.

| Delete | Size | Why it's safe |
|---|---|---|
| `media/video/cedh-monthly-event.mp4`, `.webm` | 2.44 + 2.71 MB | no page uses them (its poster stays: the cEDH photo) |
| `media/video/cedh-players-tables.mp4`, `.webm`, `-poster.webp` | 1.47 + 2.13 MB + 89 KB | the hero uses the `-loop` files |
| `media/video/storefront-exterior.mp4`, `.webm` | 1.87 + 1.89 MB | only its poster is used (Visit photo), poster stays |
| `media/video/sealed-packs-counter.mp4`, `.webm` | 0.52 + 0.87 MB | poster stays for A14 |
| `img/logo/logo-large-1020.png`, `logo-native-340.png` | 455 + 68 KB | upscale / copy of `source/social/logo/logo-master-340.png` |
| `img/logo/sign-photo-brick-720.jpg`, `sign-photo-roof-398.jpg` | 56 + 20 KB | unused; originals in `source/social/logo/` |
| `img/social/flyer-anniversary-4yr.webp`, `-800.webp`, `flyer-anniversary-buildabattle.webp`, `-800.webp` | 30+30+50+50 KB | DESIGN 2.5: flyers not used |
| `img/social/singles-display-case-800.webp`, `staff-group-800.webp`, `storefront-sign-roof-800.webp` | 40+43+13 KB | byte-identical to the full files, unused |

**Keep:** `cedh-players-tables-loop.webm` (still a `<source>`; R21 only fixes the spec wording), `logo-512.png` (the
build's web manifest icon), `staff-corgi-interior-800.webp` (used by `events-page.js`, harmless twin),
`interior-welcome-banner-800.webp` (a real smaller copy, used), `sealed-packs-counter-poster.webp` (A14).

---

## For the Desktop (one comment on #14; nothing here blocks the Laptop)

Port from the prototype once round 2 lands; the prototype is the spec.
- **Base.astro head (R14, R26, X):** `og:type`, `og:site_name`, `og:title`, `og:description`, absolute `og:image`
  (+ width, height, alt), `og:url`, `canonical`, `twitter:card`, `theme-color`, favicon, apple-touch icon, font preload,
  `manifest.webmanifest` (use `logo-512.png`); each per-date page (D16) gets its own title and description.
- **global.css:** drop the retired flyer-red tokens (lines 28-43) and adopt `prototype/css/tokens.css` (D28); add the
  reduced-motion safety net (X-E) and the print rules (C5).
- **P2.3 front/events:** phone order copy, deck, media (R1); compact week (R5); "All events" first (R6); Tonight block
  (R16); one-step sign-up on the per-date page (R7); phone video source about 400 KB and `srcset` / `sizes` with real
  480/800 copies (R21, R22); theme switch 44-48 px (R24); "Print the schedule" (A13); a webcal "Subscribe" link next
  to the .ics download.
- **P2.4a check:** confirmation shows the D26 link and one payment phrase (R17).
- **P2.4b counter:** waitlist primary + confirmed Seat anyway (R10); toast above the walk-in bar, pause on hover/focus,
  48 px Undo (R11); visible check-in on phones (R9); outlined Unpaid (R13); jump links, player ID on one line **and a
  "Not here yet" filter** (R12); 2-line event buttons (R18); started-under-minimum "Run it / Cancel" (R19); signed-in
  menu with Change password and Sign out (X).
- **P2.5:** steppers never squashed (R8).
- **Build checks:** Archivo fallback metrics measured for CLS (X-F); JSON-LD `HobbyShop`, `23:59` for a midnight close,
  `EventCancelled` for cancelled dates (X); the 404 with Hours / Call / Directions (C7); Lighthouse stays in P3.2.
- **Only if missing:** the open-now date-override note shows on every public page (covers the advisor's "closed early
  tonight" banner); if it doesn't, add the owner-set notice under the open-now strip.

## Deferred or cut (D32)

- **View transitions (X-B):** cut. DESIGN 2.4 says no load animation, and the owner asked for calm (D27). Revisit only
  if the owners ask at P3.4.
- **Eyebrow rule (X-D), link underline-grow, card line-clamp:** cut. Decoration, or (line-clamp) it would hide a
  date change or cancellation note on a card.
- **`viewport-fit=cover`:** cut. Nothing goes edge to edge, and without side insets on `.wrap` it would put content
  under a landscape notch; letterboxing is safer.
- **Printable flyer page, admin Help view, mobile menu sheet (unless the mediator rules for it), card photos, hover
  lifts, scroll reveals:** stay in "Not now" / skip, as the crossref itself suggests.
- **R12 "Not here yet" filter, R21/R22 re-encodes and srcset:** Desktop (needs the build or image tools the Laptop
  doesn't have).

## For the mediator

1. **Phone bottom action bar (Events, Hours, Call, Directions).** Advisor: the owner's own sites prove it, and it keeps
   Call and Directions one tap away all the way down a long page. Designer: DESIGN 12 kept the bottom bar for the admin
   only, and R1/R15 are about removing chrome on a phone; Call and Directions already sit in the open-now strip, and a
   bar that slides on scroll is motion D28 doesn't allow.
2. **Phone nav: sideways strip or a menu sheet.** Advisor: the front nav has 6 links, past its own "4 or fewer" rule,
   so a `<details>` sheet with Hours / Call / Directions in its footer (owner's sites). Designer (R6): keep the strip,
   put "All events" first and add an edge fade; the other links are in-page jumps on a page you scroll anyway.
   A4 ("All events" first) is done either way; the edge fade (C) waits for this ruling.
