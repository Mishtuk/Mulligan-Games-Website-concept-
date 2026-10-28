# A new look for Mulligan: Wix template research (D55)

Checked 2026-10-27 by the Researcher, in the owner's Chrome, read only (own tab, closed after; no sign-in, no "Edit this site").
Wix's template index has no Gaming-store, Hobbies or Bars category. Real categories used: Events (Venues), the "gaming" refine
filter (https://www.wix.com/website/templates/refine/gaming, pages 1-2), Restaurants and Food, Communities, Online Store.
Each template's live preview is an iframe at `wix.com/demone2/<slug>` or `wix.com/sgtemplates/<slug>`; I opened those directly
and read home page text, computed fonts and a screenshot of the first viewport (plus one inner page for Gaming Forum).
Seen vs judgement: the table's hero, nav, section order, type and colour are seen; "borrow / skip" is my judgement.

## Top takeaways

1. **Wix demos are weaker than the VFW / Riverside sites for our job.** Only 2 of 8 have a video element (Gaming Forum, Juja);
   the rest are still-photo heroes. The video-first hero the owner wants is a pattern Mulligan already has in D36/D55 and does
   better; Wix confirms the layout (full-bleed media, one centred line, one button) rather than adding to it.
2. **The best event idea is the comedy-club home page:** a short list of dated rows, each with one button, sitting in a
   cream card on a dark/blue band right under the hero. That is exactly D1 (events lead) and D51 (plain dates), and its cream-on-blue
   palette is already Mulligan's.
3. **Nobody shows a seven-day grid or filters.** Every template lists events as plain rows ("Fri, Jan 05 / name / place / Register").
   Keep our week strip (D51) and game filter; borrow the row look only.
4. **The "place to hang out" feel comes from type and warmth, not effects.** The two calm templates (Farm to Table Rustic, Juja) use a
   serif or friendly grotesk, large margins and one flat colour. The neon arcade ones (Gaming Arcade, Pinball) look like esports
   and would fight D36/D37 "calm and concise".
5. **Tabs look "better" mostly through a consistent page head:** a coloured band, large display title, one line of lead, then
   content. Gaming Forum's events page and the comedy club's section heads (small tag label above a big heading) do this.

## Recommendation: Direction B, "Card-table warm" (keep D28), with one borrowed block from Direction A

Choose **B** because: (a) the owner asked for the tabs to look "a little bit better", not a different brand, and D28 chose brick
and sign blue on purpose from the store's real front; (b) D36/D37 want calm, which cream plus editorial type delivers and
dark neon does not; (c) a full-bleed video behind white copy already supplies the "night at the shop" mood A would get from
a dark theme, so we get A's drama in the hero only and keep the readable cream page below; (d) dark mode already exists via the
D46 VFW button, so a night look is one tap away rather than a second site to maintain.
Borrow from A: a dark "Tonight" band right under the hero (the comedy-club move), not a dark page.

### Direction A: "Night at the shop" (dark, video-first, neon-ish)
- **Hero:** full-viewport video (D55), dark scrim, copy centred or lower-left: eyebrow "Open till midnight", H1 "Shuffle up. Everyone's welcome." (D51), two buttons (See this week / Plan a visit). Bottom strip: free play, caption, pause (D36).
- **Nav:** transparent over the hero, turning solid charcoal on scroll; wordmark left, 5 links right, Events as a filled pill.
- **Front page order:** hero, "Tonight" row, week strip (day / date / count, D51), Next 3 events as dark cards, TikTok clips row, Play here (games), Visit (hours, map), footer.
- **Events presentation:** dark cards, game-colour edge, neon-teal "Join" button, big date numerals.
- **Type:** Oswald (display, condensed caps) + Inter. Alternative: keep Archivo with Archivo Narrow for caps.
- **Tokens:** bg `#0F1115`, surface `#171A21`, ink `#EDEFF4`, ink-2 `#A9B0C0`, accent `#4FD1C2` (Riftbound teal), accent-2 `#E2603A`, highlight `#F2D58A`, line `#2A2F3A`.
- **Other tabs:** every page opens on a full-bleed photo head with a neon underline; events page is a dark list with filter chips.
- **Why not:** loses the brick and sign identity (D28), contrast and colour per game (D-colour system) is harder on near-black, reads as an esports or arcade site, which is not Mulligan's crowd of parents, kids and Magic regulars.

### Direction B: "Card-table warm" (cream, editorial type, photo cards) - RECOMMENDED
- **Hero:** full-bleed looping video (muted, poster, Save-Data and reduced-motion hold per D51), a warm brick-tinted scrim, white copy lower-left at 1280+, centred on phones. H1 "Shuffle up. Everyone's welcome." in the display serif; one line under it ("Open until midnight tonight" as a small pill, not the headline); two buttons: "See this week" (sign blue, filled) and "Visit the shop" (outline white). The strip along the bottom carries free play, caption, pause. The VFW round theme button stays bottom-right (D46).
- **Nav:** a cream bar with the logo on its white sign plate (current), links in sentence case, Events highlighted by a sign-blue underline; on the hero it sits transparent with white text and the brick coursing line beneath.
- **Front page order:** (1) video hero, (2) "This week at Mulligan" week strip plus the next 5 events as a clean row list inside one cream card (comedy-club style: date, name, game chip, one button), (3) a brick band "Tonight" only when something is on, (4) "What we play" six photo cards (Magic, Pokemon, One Piece, Riftbound, Warhammer, D&D) each linking to filtered events, (5) clips from TikTok (3 vertical cards), (6) shop short strip (singles, sealed, supplies), (7) Visit: hours, address, map, parking, (8) footer on the dark band.
- **Event presentation:** rows not tiles; large day-and-date on the left, event name in serif, game chip with icon and colour, price in plain words, seats or "walk in" on the right, one button. The seven-day strip above stays plain (D51). Detail page keeps D36's single layout.
- **Type pair:** headings **Fraunces** (variable, soft serif; used by the Farm to Table Rustic template) or the lighter option **Bricolage Grotesque**; body keep **Archivo** (already loaded, supports the tight layout). Body 17px / 1.55, headings 600 weight, tracking slightly tight on H1.
- **Tokens (existing D28 plus two):** `--paper #F5EFE4`, `--surface #FFFCF6`, `--ink #2B211C`, `--act #2F5FB0`, `--brick #6B3A2C`, `--band #3E2A22`, `--highlight #F2D58A`; add `--scrim rgba(27,23,21,.55)` for the video overlay and `--tag #E8D9BE` (a warmer chip background than `--surface-2`). Dark mode unchanged.
- **Other tabs:** one page head pattern on Events, Games, Shop, Visit, About: brick band with coursing, small tag label ("Events"), large serif title, one lead line, then content on cream. Events page: filter chips at the top (game, day), list grouped by day, sticky "Today" jump. Games: photo cards with the same chips. Shop: category cards with a plain price list, no cart (D2). Visit: hours table left, map right.
- **Cost:** CSS and markup changes only; no new data. Needs 2-4 real MP4/WebM loops (under ~4 MB each, 720p, no audio) from the owner's TikTok or shop footage, or licensed stock as a placeholder.

## The 8 templates

All checked 2026-10-27. "Video" = a `<video>` element found on the home page (my JS check).

| # | Name (Wix id) / preview | Category | Hero | Nav | Home section order | Events / schedule | Type (display + body) | Colour | Standout | Borrow / skip |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Club (Comedy), id 2391** https://www.wix.com/demone2/comedy-club | Events > Venues | Dark textured band, centred caps title over a cut-out photo, orange tag lines; no video; no button in hero | Blue top bar, 4 text links right plus 3 social icons; logo as a sticker top-left | Hero, "Who's coming to town" cream card with 9 dated rows, About, "The deal" info grid (4 items), See all events | Cream paper card: date, names, one blue "Buy tickets" button per row, then "See all events" | Poppins semibold throughout (heavy caps) | Charcoal, cream `#FFF9E2`, royal blue, orange tags | The cream card of dated rows on a blue band right under the hero | **Borrow** the event-row card and the blue + cream pairing; **skip** the caps shouting and sticker kitsch |
| 2 | **Gaming Forum, id 2353** https://www.wix.com/demone2/gaming-forum | Gaming (forum + events) | Full-bleed photo (video element present), centred condensed title, subtitle, one orange button | Transparent, 3 links (Home, Groups, Events) top-right in a black box | Hero, then a newsletter signup; nothing else | Inner Events page: head with title + lead + "Events list" button, photo grid, then rows "Fri, Jan 05 / name / city / Register Now" | Oswald (display) + Avenir light | Black, white, orange `#FF4700` | Shows the pure "hero is the page" idea: big media, 3 elements of text | **Borrow** the minimal hero stack (title, line, one button) and the 3-link nav; **skip** the empty page below and orange-on-black |
| 3 | **Gaming Arcade (Energetic), id 4219** https://www.wix.com/sgtemplates/n-patel | Events > Venues | Black page, green neon; large tall photo left, two tiny links centre ("Explore", "Join now"); no video | Tiny wordmark left, 4 links + login right | Hero, Mission, Special offers, Why choose us (3 numbered), Contact form | Nav "Events" page (Wix Events app, not read) | System-looking sans | Black, neon green | Numbered 1-2-3 "why" blocks | **Borrow** numbered reasons idea only; **skip** the look (weak, low contrast links, no clear event lead) |
| 4 | **Arcade Hall (Fun), id 4173** https://www.wix.com/sgtemplates/arcade-hall | Events > Venues | Full-bleed photo with dark tint, a scrolling marquee strip along the bottom ("New games every month"), "Menu" only top-right | Hidden hamburger "Menu" (desktop too) | Hero + marquee, About, Gallery, Services (3 cards), Opening hours, Follow, Highlights (3) | Highlights text mentions events; no schedule on home | Familjen Grotesk (display and body), Madefor text | Lilac `#E6D5FF`-ish page, black type | A marquee strip over the hero bottom, comparable to our free-play strip | **Borrow** the bottom hero strip (we already have it); **skip** the hidden menu on desktop (hurts finding Events) |
| 5 | **Pinball (Nostalgic), id 4248** https://www.wix.com/sgtemplates/m-garcia | Events > Venues | Huge ghost-outline title over a neon-bordered photo frame (not full-bleed), sparkle icons | Text wordmark left, 4 links right, teal highlight on the current page | Hero, Upcoming events (app), About, Marquee "Special offers >>>", Why us (3), Testimonials, Contact | "Upcoming events" block directly after the hero | Space Grotesk | Near-black `#141820`, teal-green, white | Photo framed by a thin glowing border, scrolling ">>>" marquee | **Borrow** "Upcoming events" as the first block after the hero; **skip** the ghost title (poor contrast) and testimonials (placeholder-prone) |
| 6 | **Farm to Table Venue (Rustic), id 4108** https://www.wix.com/sgtemplates/my-site-695 | Events > Venues / Restaurants | Photo split with a small inset photo; calm, lots of space (video: none) | Logo only, links collapsed | Hero, Our story, Opening hours, Highlights (3, one is Events), links | Events is one of three highlight tiles; tickets via Events app | Fraunces (display serif) + Questrial | Warm greige `#EDE8E0`, olive `#525226` text | Serif headings on a quiet warm ground: the best "hang out" mood | **Borrow** Fraunces-style serif headings and the opening-hours block; **skip** the olive and the hidden nav |
| 7 | **Gaming Company (Playful), id 3830** https://www.wix.com/demone2/juja-gaming-company | Gaming | Split: cream left with two tilted screenshots, video right; big friendly sans title; no overlay | Logo left, black pill "Menu" right | Hero, About, Collection (3 type cards), Key features (3) | None (company, not venue) | Sora (all) | Cream `#FFF3D6`, black, soft pink | The cream ground with a video panel: warm and friendly, calm | **Borrow** the cream plus video pairing for inner-page heads (a short video loop or photo beside the title); **skip** the split hero for the front page (the owner wants the whole hero as video) |
| 8 | **Gaming Store, id 3010** https://www.wix.com/demone2/arcade | Online Store | Gradient hero with a bright rounded card (title, sub, white pill button) beside a product poster | Wordmark left, "Products / On sale / Contact" plus a cart icon | Hero, Best sellers (10 product cards), Shop by category (3 tiles), Weekly deals banner, Upgrade your gear, Spend and save banner, Trending, Newsletter | N/A | Roboto (thin) + Montserrat | Violet, black, white | Category tiles with a clear "On sale" tag | **Borrow** a small sale/"Sealed this week" tag and 3 category tiles for our shop strip; **skip** the long product feed (D2: no cart, no stock promises) |

## Notes on the shape of the template set

- **Full-bleed hero is common, whole-hero video is not.** Videos found: Gaming Forum (a hero video element) and Juja (a video panel). The VFW and Riverside sites remain the better references; see `reference-sites-crossref.md`.
- **Nav:** half the templates hide the menu behind a hamburger even on desktop. Mulligan should not: Events must be one click and visible (D1).
- **Event rows beat tiles** in all three templates that show events (comedy club, Gaming Forum, Pinball).
- **Placeholders:** every demo uses lorem text and stock photos. Anything borrowed must be rewritten in Mulligan's plain voice (D36/D37).

## Screenshot notes (what each first viewport looked like, 1400x859)

- Gaming Forum: a full-height dark sci-fi soldier photo, title "50 ZONES" 70px Oswald white, subtitle, orange button; menu box top-right on black.
- Comedy club: charcoal band, tilted cut-out chicken, white caps title; below, a cream sheet with the date list and blue buttons; hard blue stripes at the edges.
- Gaming Arcade: black page, one tall blue-lit arcade photo filling the left half, empty right half with two tiny green links (weak composition).
- Arcade Hall: tinted full-bleed child at an arcade cabinet, a black marquee strip at the bottom, lilac page below.
- Pinball: black page, ghost heading, glow-bordered pinball photo.
- Farm to Table Rustic: left half photo, right half empty greige with a small inset photo (the demo's heading renders late).
- Juja: cream page, left half title and two screenshots, right half a driving video; sticky pill "Menu".
- Gaming Store: purple gradient, a rounded violet card and a game poster; products below.

## Sources
- https://www.wix.com/website/templates (category list) and https://www.wix.com/website/templates/refine/gaming, https://www.wix.com/website/templates/html/events/venues/2
- Template previews: wix.com/website-template/view/html/{2353, 2391, 3010, 3830, 4108, 4173, 4219, 4248} and the demo URLs in the table.
- Local: DESIGN.md token table (lines 55-76), DECISIONS.md D1, D28, D36, D46, D51, D55.
- Not done: no Wix inner pages other than Gaming Forum Events were read, and the second page of gaming templates, Communities and Restaurants and Bars categories were not browsed (time). Ask if a deeper pass is wanted.
