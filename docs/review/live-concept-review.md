# Live concept review (issue #13, item 2)

Laptop designer, 2026-10-27. Reviewed: https://mishtuk.github.io/Mulligan-Games-Website-concept-/ (Pages build of
`prototype/` at 838e144), plus the source. Method: Claude in Chrome on the live site. The window runs at DPR 1.5, so
390 px (phone), 820 px (tablet) and 1280 px (desktop) were checked with same-origin iframes at exactly those widths,
light and dark, at `?now=2026-10-30T19:30` (Friday), `T18:50`/`T19:05` (counter) and the real clock (Tue 27 Oct). I did
not run the local server. Demo state: I checked Casey B. in and back out again (that is stored in my browser only).

Columns: **Imp** = impact H/M/L, **Eff** = effort S/M/L, **Where** = *proto* (prototype now, Laptop) or *P2.x* (the
real build on the Desktop; repeated in the #14 list at the end).

## Top 10 quick fixes for the prototype now

1. **R1** Phones: put the hero copy and week strip above the video, so events come first.
2. **R2** Add a "Shop admin" link to the front page. Right now owners can't get to the admin from there.
3. **R3** Open the shared link on a busy moment, not on "Closed today" (Tuesday).
4. **R4** Keep `?now=` on every front-page link. The Friday demo is lost on the first click.
5. **R14** Make `og:image` absolute and add `og:url`, so links shared in Messenger or Discord show the picture.
6. **R8** Inventory steppers are squashed to 30 px wide on desktop. Fix that column.
7. **R9** Phone roster: the check-in button is a blank square. Show the tick.
8. **R10** A full event offers "Seat anyway (29 of 28)" as the blue primary button. Make waitlist the primary.
9. **R11** The toast covers the walk-in bar and disappears while you read it. Move it up and pause it on hover/focus.
10. **R6** Phones: "All events" sits off-screen at the end of the sideways nav. Move it first.

## What passed

- **Paths:** all 52 referenced paths (6 pages, 6 CSS, 21 JS, 2 data files, font, images, video) return 200 under the
  `/Mulligan-Games-Website-concept-/` subpath. Everything is relative, and admin uses `../`. Cache is `max-age=600`.
- **Console:** no errors or warnings on index, events, admin Today/Events/Inventory and tests. `tests.html` shows 89
  passed, 0 failed.
- **Mobile overflow:** at 390 px, `scrollWidth` is 375 (the viewport minus the scrollbar) on front, events and admin.
  The only wide things are the intended sideways rows (nav, week strip, chips, demo times).
- **Contrast:** a computed scan of every visible text node on 9 page/theme combinations found no AA failure. The
  `tokens.css` values match the DESIGN 2.3 table (re-ran 22 pairs: act on paper 5.42, white on act 6.20, on-mark 6.11,
  cream on brick 8.10, Pokemon rule 3.70, line-strong 3.92 / 3.78).
- **Keyboard:** the first Tab is the skip link ("Skip to this week's events"). The focus ring is visible on the brick
  header (white, 3 px) and on cards. The sign-up dialog puts focus on "Your name".
- **Meta:** each page has its own `<title>` and description, a favicon, an apple-touch icon, `theme-color`, `noindex`
  and `summary_large_image`. The OG image (1200x630, 111 KB) reads well.

## Load weight

Front page, first visit, measured: **1.53 MB transferred**, of which the hero loop `cedh-players-tables-loop.mp4` is
1.33 MB (it starts after `load`). Before the video it is about 200 KB: 90 KB font, 47 KB poster (LCP), 16 KB plate,
about 40 KB CSS+JS gzipped. The events and admin pages are about 300 KB uncompressed with no video. The weight is fine.
The deploy is not: 19 MB, of which 13.6 MB is video that no page uses.

Biggest files in `prototype/` (bytes; "unused" = no page, CSS or JS references it):

| File | Size | Used |
|---|---|---|
| media/video/cedh-monthly-event.webm | 2,713,217 | unused |
| media/video/cedh-monthly-event.mp4 | 2,437,944 | unused |
| media/video/cedh-players-tables.webm | 2,132,028 | unused |
| media/video/storefront-exterior.webm | 1,894,575 | unused |
| media/video/storefront-exterior.mp4 | 1,872,354 | unused |
| media/video/cedh-players-tables-loop.webm | 1,776,941 | hero (2nd source, never picked by Chrome) |
| media/video/cedh-players-tables.mp4 | 1,472,376 | unused |
| media/video/cedh-players-tables-loop.mp4 | 1,332,585 | hero |
| media/video/sealed-packs-counter.webm / .mp4 | 865,469 / 523,924 | unused |
| img/logo/logo-large-1020.png | 454,691 | unused |
| img/logo/logo-512.png | 156,291 | unused |
| img/og/mulligan-games-og.jpg | 111,204 | og:image |
| media/video/cedh-monthly-event-poster.webp | 108,120 | cEDH photo (720x1280 shown about 330 px wide) |
| fonts/archivo.woff2 | 90,104 | all pages |
| media/video/cedh-players-tables-poster.webp | 89,280 | unused |

Also: six `img/social/*-800.webp` files are byte-identical to their full-size twins (corgi, staff-group,
singles-case, storefront-sign-roof, both flyers). Only `interior-welcome-banner-800` is a real smaller copy.

## Findings (ranked)

### Player on Friday deciding what to play this week

| ID | Page / file:line | What's wrong | Fix | Imp | Eff | Where |
|---|---|---|---|---|---|---|
| R1 | `css/front.css:8` (`grid-template-areas: "media" "copy" "deck"`), `index.html:83` | On a phone the demo bar, open strip, header, nav and a 4:3 video all come before the headline. The h1 starts at 753 px and the first event card at 1,661 px (844 px screen), which breaks "events first". | Under 768 px use `"copy" "deck" "media"`, or move the video to a 16:9 strip below the week strip. Target: first card under 900 px. | H | S | proto + P2.3 |
| R4 | `index.html:67,126,136`; `js/mg.js:263` (card `href` base); `js/front.js:246,286` | Front-page links (nav "All events", "All events and sign-ups", every card title and Sign up) drop `?now=`. From the Friday 7:30 view, one tap lands on the events page at the real Tuesday. | Send them through a helper like `U.href` (`js/ui.js:41`). front.js doesn't load ui.js, so copy the 6-line function or rewrite `a[href*=".html"]` on init. | H | S | proto |
| R5 | `#week` on the front page (`front.js` renderDays), `css/front.css` | "This week" lists every date as a full card: 4,420 px at 1,280, with "The shop" at 5,318 px (desktop) and 7,884 px (phone). The page is 9.3k / 13.7k px. At ≥1024 a single card sits in a 2-column track, so half the row is empty. | Show today and the next open day as cards, and the rest as one-line rows (`Wed 7 PM · Pauper Night · $10 · 28 seats`) with "See all 15 on the events page". Or use 3 columns at ≥1024. | H | M | proto (spec in DESIGN 6) + P2.3 |
| R6 | `index.html:62-67`, `css/site.css:105` | On phones the nav is a sideways row with "All events" last and off-screen, and no hint that it scrolls ("New and p..." is cut). | Make "All events" the first item (or a button in the plate row) and add an edge fade. | M | S | proto + P2.3 |
| R7 | `js/mg.js:284-293`; `js/events-page.js:246-252` | Signing up from the front page takes 3 taps: Sign up opens the events page's detail dialog, then Sign up again, then the form (a second dialog stacked on the first). | Link the front page to `events.html#su-<key>` and open the form straight away. From the detail dialog, swap the body to the form instead of stacking a new dialog. | M | S | proto; P2.3 per-date page has the form inline |
| R16 | `js/events-page.js:81-138` | The events page splits tonight: the Chaos Draft is under "Special events", while Draft FNM and Nexus Nights are under "Every week > Friday". | Add a "Today" / "Tonight" block at the top with every date for today in time order, then specials, then weekly. | M | S | proto + P2.3 |
| R17 | `js/event-views.js:114-123` | The confirmation has no personal link to cancel or check (D26). The waitlist copy says "Check this page", but there is no page to check. The form says "Pay $20 at the store when you arrive", the confirmation says "Pay $20 at the counter". | Mock the D26 link ("Keep this link to cancel or see your place: ...", "We emailed it too"). Use one payment phrase. | M | S | proto; check copy in P2.4a |
| R23 | front day header | "Today" heading plus a yellow "Friday" chip says the same day twice. | Drop the chip when the heading says Today/Tomorrow, or show the date there. | L | S | proto |

### Owner at the counter (admin Today, Inventory)

| ID | Page / file:line | What's wrong | Fix | Imp | Eff | Where |
|---|---|---|---|---|---|---|
| R10 | `js/admin-roster.js:35` | When an event is full, the blue primary button is "Seat anyway (29 of 28)" and "Add to waitlist" is secondary. A hurried tap at the counter oversells the event. | Make "Add to waitlist" primary. Make "Seat anyway" secondary with a confirm step (or a hold-to-confirm). | M | S | proto + P2.4b |
| R11 | `js/ui.js:69-90`, `css/ui.css:55-62`, `css/admin.css:6` | The toast sits over the sticky walk-in input on Today (it covered "Walk-in name" after a check-in). It hides after 6 s even with the pointer or focus on it: my Undo click landed after it had gone. The Undo button is 44 px tall (the admin floor is 48). | Raise `--toast-bottom` above the walk-in bar on Today (or dock the toast at the top). Pause the timer on hover/focus. Set the button to `min-height: 48px`. | M | S | proto + P2.4b |
| R9 | `css/admin.css:123,127` | Under 768 px the check-in button is an empty square (`color: transparent`, label hidden). It isn't clear what it does until you tap it. | Show the tick at 0.35 opacity (as on tablet) and a short "In" label. | M | S | proto + P2.4b |
| R8 | `css/admin.css:331` (`--pcols ... 15rem`, `.prod-acts` nowrap) | At ≥1024 the − / + steppers render at **30x56 px** (the spec is 56x56) because two steppers, Count and Details don't fit in 15rem. | Make the last column 19rem, or `.prod-acts .stepper { flex: none; }` and let Details drop to its own row. | M | S | proto + P2.5 |
| R12 | `js/admin-roster.js` (waitlist under the roster) | With 28 signed up, the waitlist appears only after 28 rows (about 2,600 px on a tablet), and the "3 on the waitlist" chip isn't a link. Rows with a Wizards ID take 3 lines. | Make the stat chips jump links. Add a "Not here yet" filter, or sink checked-in rows to the bottom. Move the player ID into the ⋯ menu or onto one line. | M | M | P2.4b (prototype optional) |
| R13 | `css/admin.css:143` | "✓ Unpaid" is the filled dark segment, the heaviest mark on every row. A 28-row roster reads as 28 dark blocks, and the paid states look lighter than unpaid. | Show Unpaid as an outline (or warn outline) with no fill. Fill only Door / Online / Comped / Credit once chosen. | M | S | proto + P2.4b |
| R18 | `css/admin.css:88,95` | Event buttons on Today truncate the name ("All Leylines' Eve Chao..."). | Allow 2 lines (`-webkit-line-clamp: 2`) and drop `nowrap`. | L | S | proto + P2.4b |
| R19 | Today vs the public card at 18:50 | Admin shows "Needs 3 more to run" for an event that started at 6 PM, while the public card says "On now · Walk in if seats are left". | After the start time, replace the chip with "Started with 5 (min 8): Run it / Cancel". The public card keeps "On now". | L | S | P2.4b |

### Owner seeing the pitch for the first time

| ID | Page / file:line | What's wrong | Fix | Imp | Eff | Where |
|---|---|---|---|---|---|---|
| R2 | `index.html:268` (footer) vs `events.html:122` | The front page has no way into the admin. Only the events-page footer has the small "Shop admin (concept)" link, and the admin is half the pitch. | Add the footer link to the front page too, plus a demo-bar link: "Owners: open the counter screen" → `admin/index.html?now=2026-10-30T18:50`. | H | S | proto |
| R3 | `data/sample.js:299` (`window` covers the real date); `js/mg.js:30` | The plain link opens on the real clock. Today (Tue) that is "Closed today. Back tomorrow at 2 PM." with an empty "Today", which is the weakest first impression. | Default to `demoNow` (Wednesday 4 PM, or Friday 7:30) unless `?now=real`, or whenever the store is closed at the real time. Give the owners the `?now=2026-10-30T19:30` link. | H | S | proto |
| R14 | all 6 pages, line 19 (`og:image` relative), no `og:url` | The OGP spec wants absolute URLs. Facebook / Messenger and Discord often drop a relative image, so the pitch link shows no picture. | `og:image` = `https://mishtuk.github.io/Mulligan-Games-Website-concept-/img/og/mulligan-games-og.jpg` (admin: same absolute URL), plus `og:url` per page. | M | S | proto; build: see #14 |
| R15 | `css/site.css:70-71`, `index.html:36-42`, `js/ui.js:147-149` | The demo bar takes 200-210 px above the header on phones (the 5 time links wrap to 4 lines) and about 150 px on the admin tablet. The front page says "See the page on:" while the other pages say "Pretend it's:", and only the other pages have "Reset demo data". | Make it one line: "Sample data · Pretend it's [select ▾] · Reset", or a collapsed `<details>`. Use the same wording and controls on every page. | M | S | proto |
| R27 | `#new` release tiles (`front.js` renderReleases) | The New and preorders tiles have only a game icon on a tinted head, so in the pitch they read as placeholders next to the photo-led sections. | Use the store's own photos (for example `sealed-packs-counter-poster.webp`, 29 KB, already committed) for the section, or a shelf photo per game once the owners send them. Keep publisher box art out. | M | M | proto |
| R20 | `media/video/*`, `img/logo/*`, `img/social/*-800` | The Pages artifact is 19 MB. That is 13.6 MB of unused video, 0.68 MB of unused logo PNGs (`logo-large-1020`, `-512`, `native-340`), 2 sign photos and the flyers (which DESIGN 2.5 says are not used), plus 6 byte-identical "-800" copies. | Move the unused files to `/source/social/` (gitignored, D27 keeps raw files there) or give them real uses. Make each `-800` a real 800 px copy or delete it. | L | S | proto |
| R21 | `index.html:88-89` vs DESIGN 6.1 (line about 435) | The spec says `.webm` first (smaller), but for this loop the webm is larger (1.78 MB vs 1.33 MB), so the mp4-first order in the page is the right one. On phones the 4:3 crop of a 9:16 clip shows about 42% of the frame and still costs 1.33 MB. | Update DESIGN 6.1 to "smaller file first", or re-encode the webm. In the build, add a phone `<source media="(max-width: 767px)">` with a 640x480 landscape crop (about 400 KB). | L | S | DESIGN now; P2.3 |
| R22 | `index.html:149,163` | The gallery uses the 960 px `interior-welcome-banner.webp` (42.8 KB) where the 800 copy exists. The cEDH photo is 720x1280 (108 KB) shown about 330 px wide. | `srcset`/`sizes` with real 480/800 copies. | L | S | P2.3 |
| R24 | `css/site.css:126` | The theme switch buttons are 40 px tall (the public target is 48). | `min-height: 44px` in the header (48 px if the head row can take it). | L | S | proto + P2.3 |
| R25 | Pages root | A mistyped path gets GitHub's generic 404. | Add `prototype/404.html` with the plate and links to the front page and events page, using absolute `/Mulligan-Games-Website-concept-/` paths (404 pages are served at any depth). | L | S | proto |
| R26 | `events.html:10,17`; detail dialog | The events page `og:title` ("...sign-ups **at** Mulligan...") differs from its `<title>`. Opening an event (`#e-...`) doesn't change `document.title`, so a shared event link previews as the generic page. | Make the og:title match the title. In the prototype, set `document.title` on open. Per-event previews come with the build's per-date pages (D16). | L | S | proto + P2.3 |

## For the Desktop build (#14)

- **`src/components/Base.astro`:** has only `<title>` and description. Add `og:type`, `og:site_name`, `og:title`,
  `og:description`, **absolute** `og:image` (from the configured origin, per DESIGN 2.5), `og:image:width/height/alt`,
  `og:url`, `twitter:card`, `theme-color`, favicon and apple-touch icon (R14). Give each per-date page (D16) its own
  title and description ("Draft FNM, Fri Oct 30, 7 PM, $20, 3 seats left") (R26).
- **`src/styles/global.css`:** still has the retired flyer-red tokens (`--flyer-red`, `--act` = flyer red, lines 28-43).
  D28 says the build adopts `prototype/css/tokens.css` as is.
- **Front page (P2.3):** phone order copy → deck → media (R1); compact week list (R5); "All events" first in the phone nav
  (R6); a Today block on the events page (R16); the sign-up form straight from the card / per-date page (R7); a phone
  video source and `srcset` (R21, R22); 48 px theme switch (R24).
- **Counter screens (P2.4b):** waitlist as the primary when full (R10); toast placement, pause on hover/focus, 48 px Undo
  (R11); a visible check-in affordance on phones (R9); outlined Unpaid (R13); jump links and a "Not here yet" filter
  (R12); 2-line event buttons (R18); the started-under-minimum state (R19).
- **Inventory (P2.5):** don't let the actions column squash the steppers (R8).
- **Sign-up (P2.4a, built):** check the confirmation copy shows the D26 personal link and one payment phrase (R17).
