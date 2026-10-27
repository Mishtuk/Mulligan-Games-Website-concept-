# Round 4: formatting review after round 3, plus the event detail layout

Date: 2026-10-27. Designer, Laptop. Read-only on `prototype/` and `src/`.
Owner direction (D36): "a little bit more cleaner, slicker, so things aren't just popping out and everything's just
kind of jumbled up... more concise and formatted better", laid out like the VFW and Riverside sites. Formatting comes
before new features.

**How this was checked.** The prototype was served over http and shot at true phone width (390, mobile emulation) and
at 1280, light and dark; hero also at 1440 and 1920. Pages: `index.html`, `events.html`, the detail dialog
(`events.html?now=2026-10-30T18:50#e-fnm-draft@2026-10-30`), `admin/index.html`, `404.html` (the live Pages copy,
because its absolute `/Mulligan-Games-Website-concept-/` paths 404 on a local server; not a bug on Pages). The VFW
home and events pages and the Riverside home and events pages were shot at the same widths for comparison. No
console errors on any prototype page; no sideways scroll at 390.

**What the reference sites do that we don't** (the pattern behind most findings below):
- **One box per item, no boxes inside it.** A VFW event card is photo, a coloured date line, a title, a time and one
  paragraph. No dividers inside it, no circled price, no bordered stat box. A Riverside card is photo, small
  uppercase kicker, title, time, two lines and one text link. Ours has 5 to 7 bordered or tinted shapes per card.
- **Sections are told apart by background bands,** not by more boxes. VFW alternates cream and a darker cream with a
  hairline between them; Riverside alternates off-white and white with a full-width dark footer. Ours puts six sections
  on the same cream, with uneven gaps (96, 128, 128 px), so it reads as one long scroll of boxes.
- **Things are said once.** The section heading says "Every Thursday" and the cards under it don't repeat it.
- **Footer as an index:** Riverside has brand | Visit | Contact | Explore columns with small uppercase labels.

Shots: `C:\Users\alexm\AppData\Local\Temp\claude\C--\56191821-4528-4ba6-bfb0-1b410caaeb0f\scratchpad\shots-r4\`
(prototype, `<page>-<width>-<scheme>-s<n>.png`) and `...\shots-r4\ref\` (VFW `vfw-*`, Riverside `rs-*`).

---

## Findings, ranked

Impact: H changes what an owner sees on the shared link in the first minute; M is visible on a normal scroll; L is
polish. Effort: S is under an hour of CSS/copy; M is a component change; L is a layout rewrite. Paths are under
`prototype/` unless they start with `src/`. Each fix also applies to the Desktop build where the same component exists
(`src/styles/global.css`, `src/lib/render.js`).

### F1. Event cards have too many boxes inside them (both pages, every width). H / M
`css/site.css:233-271` (`.ev`, `.ev-bar`, `.ev-cost`, `.ev-type`, `.ev-stat`).
One card has a 3px game rule, a name bar with a hairline under it, a circled price, a game row with another hairline,
a clock line, a prize line, an outlined or filled button and a bordered tinted stat box. With 2 to 4 cards side by side
that adds up to 20+ outlined shapes on a screen. This is the main reason it looks "jumbled". Fix:
- Price: drop the circle. `.ev-cost { border: 0; min-width: 0; height: auto; padding: 0; font-size: var(--t-lg); }`,
  so "$20" is plain condensed text at the right of the title. "Free" stays a word.
- Game and format go into the name bar as a second line under the title (`.ev-type` moves inside `.ev-bar`,
  `padding: 0; border: 0;`). That removes one hairline and about 34px per card.
- Keep one hairline only, between the head (title, game) and the body (time, prize, action).
- Stat box: no border or fill when nothing needs attention ("19 seats left of 24" in `--ink-2`, plain text, number
  still big). Keep the box for **Full / waitlist, Few seats, Needs players and Cancelled** only:
  `.ev-stat { border-color: transparent; background: none; }` plus `.ev[data-state="full"|"few"|"needs"] .ev-stat`
  keeps today's border and fill. Then a box means "look at this".
- Cancelled stamp: keep it, but straighten it (`transform: none`). A rotated stamp next to straight boxes reads as
  something sticking out.
Result: 2 shapes per card (the card and, only when it matters, the stat box), like the VFW cards.

### F2. The same words repeat on every card and row (both pages). H / S
- Events page, Every week (`js/event-views.js:214-221`, `js/events-page.js:114`): under the heading "Wednesday", every
  card says "Every Wednesday, 7 PM to 10 PM" and "Next: Wed Nov 4." Fix: inside the weekly list the time line is just
  "7 PM to 10 PM". "Next: Wed Nov 4" goes once, in the day heading ("Wednesday · next Nov 4", `--t-sm`, `--ink-2`).
  A card keeps its own "Next:" line only when it differs (the next date is cancelled or changed).
- "Walk in. No sign-up needed." is on most weekly cards (8 of the 9 Wednesday and Thursday cards,
  `js/event-views.js:41`), and "Walk in" ends 9 of the 11 one-line rows on the front page (`js/front.js:256`). Fix: walk-in is the default. Leave the walk-in line off cards and rows
  and say it once, under each section head: "Most nights are walk-in. Cards with a Sign up button hold seats."
  (`.sec-note`). Rows keep only the exceptions: "Sign up here", "Pre-register at the counter", "Sign up on TopDeck",
  "Invite only", "28 seats left".
- Learn to Play Pokemon has a "Kids welcome" tag and then ends its description with "Kids welcome." (sample data,
  `data/sample.js`): drop the sentence; the tag says it.
- cEDH tickets (`js/front.js:292`): "Sun 1 Nov" in the date block, then "Sunday, November 1, 10 AM. Entry $40." Fix:
  the line becomes "10 AM · $40". "Sign up on TopDeck" plus "80 registered on TopDeck": the stat reads
  "80 registered".
- New and preorders: "Preorders in store only." starts three tiles, and the section note already says "Preorders are
  taken at the counter or by phone." Drop it from the tiles.
- "Free play all day, every day we're open" is in the hero strip, the Visit note and the Good to know answer. Keep the
  hero strip and the FAQ answer; the Visit note becomes just the address line, or nothing (see F14).

### F3. Sections run together: uneven gaps, one background (front page). H / S
`css/site.css:168-172` (`.sec`), `css/front.css:141` (`.visit`). Measured at 1280: This week and Inside the shop have
32px top padding, the rest 64px, so the gaps between sections are 96 / 128 / 128 px with no change of background,
and Further out and Visit are boxed cards sitting inside them. Fix (the VFW and Riverside pattern):
- One rhythm: `.sec { padding-block: var(--s7); }` (48px) on phones and `padding-block: 4.5rem` (72px) from 1024px,
  the same for every section (drop the 32px top overrides on `#week` and `#shop`).
- Alternate the bands: This week `--paper`; Inside the shop `--surface`; cEDH `--band`; New and preorders `--paper`;
  Visit `--surface`; Between events `--paper`; footer `--band`. Every `--surface` band gets
  `border-block: 1px solid var(--line)`.
- With Visit on a `--surface` band, take away its card box (`.visit-in` loses its border, radius and shadow) and keep
  the three columns split by hairlines. Further out keeps its box (it's a list inside This week).

### F4. Dark bands barely separate in dark mode; light mode bands render near-black, not the spec'd brown. H / S
`css/tokens.css:49` (`--band: light-dark(#3E2A22, #120F0D)`), used by `.openbar` (`site.css:97`), `.cedh`
(`site.css:314`) and `.site-foot` (`site.css:397`). Each of those sets `color-scheme: dark` on the same element, so
`light-dark()` always picks `#120F0D`, even in the light theme. In dark mode `#120F0D` against `--paper #1B1715` is
almost the same tone: the cEDH band and the footer show no edge (see `home-1280-dark-s3/s4/s6`). Fix:
- Move `color-scheme: dark` from the band element to its inner wrapper (`.openbar > .wrap`, `.cedh-in`, `.foot-in`),
  so the band's own background resolves in the page's scheme.
- `--band: light-dark(#3E2A22, #2A1D17)`: warm brown in light (as DESIGN 6 says), and in dark a brick-brown that is
  lighter than the page. Add `border-block: 1px solid rgb(255 255 255 / 0.08)` on the bands in dark. `--on-band-2
  #CDBFB0` on `#2A1D17` is about 9:1.

### F5. Phones: the time label repeats the card's time ("7 PM / 2 events start at 7 PM / 7 PM to 11 PM"). H / S
`css/site.css:209-228` (`.slot-t`), with the rail. Wide screens already hide it (`front.css:110`, `events.css:75`).
On a phone the reader sees the time three times before the event name. Fix: hide `.slot-t` and the rail at every
width (`.slot-t { display: none; }`, `.slot-cards { border-left: 0; padding-left: 0; }`). Cards are already in time
order and each shows its own time. Saves about 60px per time group on the phone.

### F6. Game chips wrap to two rows at 1280 (front and events page). M / S
`css/site.css:176-187`. Nine chips with icons and pill counts are about 1,480px wide, so Warhammer and Other drop to a
second row and the filter becomes a block of 11 boxes. Fix from 900px: `.chip { min-height: 2.5rem; padding: 0 0.75rem;
font-size: var(--t-sm); border-width: 1px; }`, `.chip-n { background: none; padding: 0; min-width: 0; }` (the count
stays, as plain `--ink-2` text). That's about 1,080px, one row. Phones keep the 48px scroll strip.

### F7. Events page on a phone is 10,400px: 15 full weekly cards. H / M
`js/events-page.js:104-117`, `css/events.css`. The front page already shows later days as one-line rows; the events
page doesn't. Fix under 640px: "Every week" uses the front page's `.day-lines` row (dot, time, linked title, bits),
one row per series, and the title opens the detail. Full cards stay for Tonight and Special events. Estimated page
height drops to about 6,000px. From 640px keep the cards (with F1 and F2 applied).

### F8. The hero at 1440 and 1920 is a soft close-up of the back of someone's head. M / S
`css/front.css:15` and `:80` (`object-position: 50% 42%`). The only loop is a 540x960 phone reel, scaled about 3.5x. At
42% the crop lands on a player's head (`hero-1440-light.png`, `hero-1920-dark.png`). Until Q21's landscape clips come:
from 900px use `object-position: 50% 82%` (the playmat, deck box and cards: it reads as a card game even when soft) and
`background-position: 50% 82%` on `.phero-media`. From 1440px, cap the hero height:
`.phero { min-height: clamp(34rem, 70svh, 44rem); }`, so less of the soft picture shows.

### F9. Closed days take a full row each (front and events page). M / S
`js/front.js:195-201`, `js/events-page.js:114-116`. "Monday: The shop is closed." and "Tuesday: The shop is closed." are
two rows with dashed diamonds (about 140px). Fix: merge consecutive closed days into one light row, "Monday and
Tuesday · closed" (no diamond, `--ink-2`, `--t-sm`), keeping both `d-YYYY-MM-DD` anchors as empty `<span id>`s.

### F10. The footer is a run-on sentence, with no links. M / S
`index.html:270-279`, `events.html` footer, `css/site.css:397-402`. Fix, Riverside pattern: from 900px a four-column
grid, `grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: var(--s6);`, `padding-block: var(--s7) var(--s5)`.
- Brand: logo plate and one line ("Card games, tables and a crew who know the formats.").
- Visit: address, phone, Directions.
- Hours: four short lines, "Wed–Thu 2–10 PM", "Fri–Sat 2 PM–midnight", "Sun 1–10 PM", "Mon–Tue closed".
- Explore: All events, This week, cEDH, Preorders, Discord.
Column labels are small uppercase `--t-xs`, 750 weight, letter-spacing 0.08em, `--on-band-2`. Under them, a hairline
row: the concept line and "Shop admin (concept)". On phones: Visit | Hours in two columns, Explore as a wrapped row.

### F11. Bug: an orphaned clock icon on narrow cards. M / S
`css/site.css:256` (`.ev-when`, `flex-wrap: wrap`). When a card is a third wide (Hololive OCG in Every week at 1280),
"Every Thursday, 6:30 PM to 9:30 PM" doesn't fit next to the icon. The whole span wraps, so the icon sits alone on a
line. Fix: `.ev-when > span:not(.tag) { flex: 1 1 10rem; min-width: 0; }` so the text wraps inside its span. (F2's
shorter weekly line also avoids it.)

### F12. Events page, Special events: double date columns and a duplicate. M / S
`css/events.css:76-81`, `js/events-page.js:95`. At 1280 each half-width column has a 6.5rem column of its own (a diamond
plus "Fri Oct 30") and then the card, so the cards are 440px wide with a stack of diamonds down the middle of the page.
The Chaos Draft is listed in both Tonight and Special events on the same screen. Fix:
- The date becomes a kicker line above its card (VFW: "Sat, Oct 24" in the accent colour). `#special .day
  { grid-template-columns: 1fr; }`, `.day-h` is one line, `--t-sm`, 800 weight, `--mark` colour, no diamond. A date
  with two cards keeps one kicker.
- When Tonight is showing, leave today's dates out of Special events.

### F13. Events page head and controls: three rows before the first event. M / S
`events.html:80-93`, `css/events.css`. At 1280: h1, a three-line lede, Add to my calendar, the same door photo as the
front page's "Inside the shop", then two rows of chips, then Format + Print. On a phone the photo is above the h1 and
the first event starts at 1,022px. Fix:
- Lede is one sentence: "Every game night at the shop. Pick a game, check the seats, pay at the store."
- Photo: hide under 900px. From 900px keep it but at 16:9 and `max-height: 16rem`, or drop it (it repeats the front
  page).
- One controls row under the chips: Format select on the left; "Add to my calendar" and "Print the schedule" on the
  right as `btn-2` small (`min-height: 2.5rem`). "Print the schedule" is hidden under 900px (nobody prints from a
  phone).

### F14. New and preorders: empty cell under the photo, a tinted band on every tile. M / S
`css/front.css:189-190` (`.new .wrap` 18rem + 1fr), `css/site.css:343-358`. At 1280 the photo takes the left column and
the five tiles wrap 4 + 2 beside it. That leaves an empty area under the photo and an empty fourth slot. Each tile also
opens with a 70px tinted band holding one icon. Fix:
- Tiles `grid-template-columns: repeat(3, minmax(0, 1fr))` beside the photo, with the photo set to `grid-row: span 2;
  height: 100%; object-fit: cover`, so the 5 tiles plus the photo fill two even rows.
- Remove the icon band. The game icon already sits in the game line.
- Drop "Preorders in store only." (F2). The countdown box keeps its border only on the last 3 days (F1 rule).

### F15. Visit: the hours exception note is bold, right-aligned and three lines long. M / S
`js/front.js:344`, `css/site.css:373` (`.hours-note`). "Sun Nov 1: 10 AM to 10 PM. Opening at 10 AM for the cEDH
Championship Series." sits in bold small type in the time cell. Fix: the cell shows the changed hours only
("10 AM to 10 PM", with a `tag-upd` "Nov 1"). The reason goes in one regular `--ink-2` line under the table:
"Sun Nov 1 opens at 10 AM for the cEDH Championship Series." The "Today" pill moves onto the same line as the day name
(`th { display: flex; gap: var(--s2); align-items: center; }`) so the Friday row is not twice as tall.

### F16. The header's three-part theme pill competes with the nav. M / S
`index.html:69-73`, `css/site.css:141-150` (`.scheme`). "Theme | Light | Dark" is about 245px wide on a brick header,
next to five nav links. On phones it takes the right half of the header row. VFW uses one round 40px moon button.
Fix: one icon button, 44px, `border: 1px solid rgb(255 255 255 / 0.35)`, `border-radius: 50%`, showing the moon in
light and the sun in dark, with `aria-label="Dark theme"` / `"Light theme"` and `aria-pressed`. Same remembered
`mg-scheme` behaviour. The admin sidebar's switch can stay labelled.

### F17. In the shared link, the phone bottom bar covers the hero strip. M / S
`css/front.css:9` (`min-height: clamp(30rem, 72svh, 48rem)`). At 390x844 the demo bar (98px), open-now strip and
header push the hero to 267px. The hero strip (free play, Play video) then lands at 817-874, under the fixed
56px bar (787-844). Owners judge the concept from this link. Fix under 900px:
`.phero { min-height: clamp(28rem, 62svh, 40rem); }` (523px at 844 tall, so the strip ends at about 790). Copy is
bottom-aligned, so nothing else moves.

### F18. Phones: the week strip scrolls sideways, below the nav and above the chips. M / S
`css/front.css:84-99` (`.wdeck`). That's three sideways strips in the first two screens. Fix under 768px: seven tiles in
one fitted row, with no scrolling. `.wdeck ol { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr));
overflow: visible; margin-inline: 0; padding-inline: 0; gap: 4px; }`. Tile: day initials ("Fri") `--t-xs`, number
1.5rem, game dots. Drop the "3 events" caption under phones (the dots carry it, the aria-label keeps the words).

### F19. Detail dialog: two headings, a floating price, a heavy ring on the close button. M / S
`css/ui.css:36-43`, `js/event-views.js:87`. A bar titled "Event details" sits above a second bar titled "Draft FNM".
The $20 circle stops 95px short of the right edge, and the close button opens with a double focus ring. Fix (and see
the detail spec below): the event name is the dialog heading (`aria-labelledby` points at it). The close X sits in
that bar at the right, after the price (plain text, F1). Focus starts on the heading (`tabindex="-1"`), not the X.
Add to calendar and Directions go side by side on phones (`grid-template-columns: 1fr 1fr`).

### F20. Between events: the h2 and two h3s sit in one row at different sizes and heights. L / S
`index.html:243-268`, `css/site.css:384-385`. "Between events" (52px) is level with "What people say" and "Lately at
the shop" (28px), and their tops are 15px apart. Fix: the h2 and its Discord line go full width as a normal `.sec-head`.
Below it go three equal columns, Discord (button and socials) | What people say | Lately, each with a `--t-lg` h3,
top-aligned.

### F21. This week links to the events page three times. L / S
`index.html` week section. "All events and sign-ups" (head), "See all 15 events on the events page" (after the
days), "See every date" (Further out). Keep the head link and "See every date". Drop the middle one, or make it the
one link and drop the head link on phones.

### F22. Admin Today: counts look like buttons, and alert pills wrap. M / S
`css/admin.css:82-84` (`.rem`), `:106-110` (`.rstat`). "Checked in 0 of 5", "Paid 0" and "5 of 24 seats" are bordered,
tinted boxes the same height as the Run it / Cancel buttons under them, so the counter screen has 4 + 4 + 2 + 2
outlined shapes before the first name. Fix: `.rstat` becomes plain text separated by `·` (no border, no fill). Only
`.rstat-warn` (Started with 0 / Needs 3 more) keeps a box. Alerts (`.rem`) become one quiet line of text links,
"3 low in stock · 3 will run short · Draft FNM Oct 23 not reported · 2 preorders arrived", with a `--warn` icon on the
first two.

### F23. Admin phone: the walk-in bar takes 135px above the tab bar. M / S
`css/admin.css:167-168` (`.walkbar`). The input and the "Add and check in" button wrap into two rows, so the bar plus
the tab bar cover a quarter of an 844px screen. Fix under 640px: one row, `.walkbar .fld { flex: 1 1 0; }`, button
"Add" (`aria-label="Add and check in"`), `min-height: var(--tap-admin)`. About 72px tall.

### F24. 404: four buttons wrap raggedly. L / S
`404.html` `.nf-acts`. At 1280, Directions sits alone on a second row. On phones there are three rows. Fix:
`.nf-acts { display: grid; grid-template-columns: 1fr 1fr; }` (Front page primary, then All events, Call, Directions).
The hours line becomes a small three-line list, as in the F10 footer.

### Kept as is (checked, fine)
Hero copy, scrim and the left alignment to the logo edge at 1280 to 1920; nav strip with edge fade (D34); bottom bar
(D33); Inside the shop grid; Further out rows; the hours table itself; no sideways scroll; contrast on the hero.

---

## Event detail: one layout for the prototype dialog and the build's page

**What's wrong now.** Build (`src/lib/render.js:469-477`, `src/styles/global.css:794-827`): the head (title, date, tags)
is unboxed in the left column. The ticket (stat + action) is the only boxed thing, alone at the top right, and the page
ends after the facts. With few facts and no description that's about 350px. There's no picture, and "Other dates" only
shows when the series has later dates (it's in the code, `render.js:464`, as one row of the facts list, easy to miss).
Prototype dialog: the double heading (F19), and it lists the facts before the place, so "Other dates" ends up as a
wrapped row of six links.

**Principle.** It reads like a VFW featured event: a picture, then the answer to "can I play and what do I do", then
the details. One box, the action box, which holds the state and the button. Everything else is text on the page with
hairlines between groups. All of it comes from data we already have.

### 1280 (build page; the dialog uses the phone order inside a 42rem dialog)

```
< All events                                                     (dp-back, 48px tap)
┌─────────────────────────────── picture 7fr ───────────────┐  FRI, OCTOBER 30 · TONIGHT        kicker, --mark
│                                                           │  Draft FNM                  $20   h1 3rem / price --t-xl
│        series photo, else the game's default photo        │  ⬠ Magic ◆ Draft, newest set
│        4:3, --r-photo, 3px game rule along the bottom     │  🕒 7 PM to 11 PM
│                                                           │  [status banner, if any]
│                                                           │  [Beginner friendly][Kids welcome]   tags
│                                                           │  ┌ action box (--surface, --lift) ─────┐
│                                                           │  │ Full · 3 waiting   [Join waitlist]  │
│                                                           │  │ Arrive by 6:50 PM or your seat …    │
└───────────────────────────────────────────────────────────┘  │ (sign-up form opens here)           │
                                                                └─────────────────────────────────────┘
──────────────────────────────────────────────────────────────────────────────────────────── hairline, 48px above
About this night (8fr)                                     │ Other dates (4fr)
Prizes      Prize packs paid by record.                    │ Fri Nov 6     7 PM   open
Bring       Nothing. Packs are included.                   │ Fri Nov 13    7 PM   open
Ages        All ages. Kids welcome.                        │ ~~Fri Nov 20~~  cancelled
Play style  Casual                                         │ Fri Nov 27    7 PM   open
Event code  ABC123  [Copy]   on Wizards EventLink          │ [Add every Friday to my calendar]
Description paragraph, max 62ch                            │
                                                           │ Getting here
                                                           │ 445 York Rd, Warminster PA 18974
                                                           │ Park in any lot except the RISE lot.
                                                           │ [Directions] [Call]
──────────────────────────────────────────────────────────────────────────────────────────── hairline
Also on Friday                                       (only when other events share the date; 2 to 3 compact cards)
[Chaos Draft  6 PM  $20  19 seats]   [Nexus Nights  7 PM  $5  Walk in]
```

### 390 (build page and prototype dialog, same order)

```
< All events
┌──────────────────────────────┐  picture full-bleed, 16:9, no radius, 3px game rule under it
└──────────────────────────────┘
FRI, OCT 30 · TONIGHT              kicker
Draft FNM                    $20   h1 clamp(1.9rem…), price right
⬠ Magic ◆ Draft, newest set
🕒 7 PM to 11 PM
[status banner]  [tags]
┌ action box ──────────────────┐
│ Full · 3 waiting             │
│ [   Join the waitlist      ] │  full width
│ Arrive by 6:50 PM or …       │
└──────────────────────────────┘
About this night                   h2 --t-lg, hairline above
Prizes                             dl stacked: term --t-xs uppercase --ink-2, value --t-md
Prize packs paid by record.
Bring …   Ages …   Event code …
Other dates                        2-column grid of links (Fri Nov 6 / Fri Nov 13 …), cancelled struck + word
Getting here
445 York Rd … parking
[Directions] [Call]                two equal columns
Also on Friday                     one-line rows (front page .day-line), not cards
```

### Spec
- **Grid (from 1024px):** top block `grid-template-columns: minmax(0, 7fr) minmax(20rem, 5fr); gap: var(--s6);
  align-items: start`. Lower block `minmax(0, 8fr) minmax(16rem, 4fr)`, `gap: var(--s7)`, with
  `margin-top: var(--s7)` and a hairline (`border-top: 1px solid var(--line); padding-top: var(--s6)`). "Also on" has
  the same hairline and spacing. Nothing is sticky (the page is short enough). From 640 to 1023: the picture goes on top
  at 16:9, then the right column's content, then the lower block in one column with Other dates and Getting here side
  by side.
- **Picture:** the series photo when set (the VFW photo upload carries over), else a default per game.
  Magic → `media/video/cedh-monthly-event-poster.webp` cropped to the table, cEDH → the same, Pokemon →
  `sealed-packs-counter-poster.webp`, everything else → `img/social/interior-welcome-banner.webp`. `alt` describes the
  picture, not the event. With no usable picture, the top block is one column (text max 44rem) and there's no empty
  box. `loading="eager"`, `fetchpriority="high"`, width/height set.
- **Kicker:** `--t-sm`, 800, uppercase, letter-spacing 0.06em, `--mark`. It reads "TONIGHT" / "TOMORROW" when that's
  true, else the weekday and date. The full date stays in the `<time>` element and JSON-LD.
- **Head:** h1 is the event name (`--font-cond`, `--wdth-head`, 800, `clamp(1.9rem, 1.3rem + 2.6vw, 3rem)`). Price is
  plain text on the same baseline (F1). The game and format line, the time line (`--t-md`, 650) and the status banner
  (15.4 table, unchanged) follow, then the tags.
- **Action box (the only box):** `--surface`, 1px `--line`, `--r-card`, `--lift`, `padding: var(--s4)`. Row 1 is the
  state in words plus the big number (seats left / waiting / registered), with the button at the right from 1024px and
  full width below on phones. Then arrive-by. The sign-up form opens inside it (15.4 rule kept). Cancelled or past:
  no box. The banner says it, plus "Next one: …".
- **About this night:** a `dl` with a 9rem term column from 640px, terms in `--ink-2` 650 weight, no row borders (one
  hairline above the block is enough). Rows with no value are left out. The description is the last row, as a
  paragraph, max 62ch. The official tool shows as "Event code ABC123 [Copy] on Wizards EventLink", or as a link when
  there's a URL.
- **Other dates:** always shown for a series (the next 6 after this one). One per row: date, start time and seat state
  in words ("open", "few seats", "full", "cancelled" in `--bad` after a struck date, "changed"). The date you're on is
  left out. Under them, "Add every Friday to my calendar" (`btn-2`, the series `.ics`). For a one-off with no other
  dates the column shows only Getting here.
- **Getting here:** address, parking line, then Directions + Call (`btn-2`, two equal columns). The "New here?" line
  for beginner-friendly events goes here.
- **Also on Friday** (optional, cheap: same feed): other events on the same date, as front-page `.day-line` rows.
  Hidden when there are none.
- **Height check:** with a picture, 1280 lands at about 1,100-1,300px (about 1.3 screens). On phones the action box is
  inside the first 844px.
- **Dialog (prototype):** same order as 390, inside `.dlg-det` (42rem). The picture is 16:9 at the top with no radius
  (the dialog clips it). The name bar is the dialog heading with the close X at its right. No "Event details" title.
  The lower block goes in one column. Kept: `#e-<key>` hash, light dismiss and Esc.
- **Unchanged from 15.4:** URLs, canonical, JSON-LD, status banner table, 404 and 500 copy, no-JS form.
