# TCG / tabletop store websites: what the best ones do

Researcher: Mulligan Games team. Checked 2026-10-26.

**Method and limits (read first).** I fetched HTML with WebFetch and curl and read nav, text, scripts and markup. I did NOT
see rendered screenshots, so colours, type and real mobile behaviour are "not observed". Calendars on most sites are
JavaScript embeds, so I saw how they are built, not the event rows. Several fetches were rate-limited (429) or failed
TLS (Labyrinth Games, Rain City Games, Brick City). Card Kingdom returned only a header. "Take:" marks my judgement.

## Top takeaways for Mulligan Games

1. **Events are the home page, not a nav item.** Pandemonium, Game Kastle and Dreamers Vault put events front and
   centre; retail-first sites (Collector's Cache, TKO, Hairy T, Face to Face) bury them in a nav link or a Shopify
   collection. Mulligan hero = "This week at Mulligan" (next 7 days), then a hours / address / open-now strip.
2. **Game filter is the primary control; location is irrelevant for one store.** Dreamers Vault has Store (8) + Game
   (~25) filters with a dynamic list. We need Game chips (Magic, cEDH, Pokemon, Warhammer, Riftbound, Hololive,
   Other) plus optional format (Commander, Draft, Prerelease, Learn to play, League).
3. **One event = one row/card:** game banner, date block, time, price, seats left, one primary button. DV shows
   banner, day number + weekday, price, title, description, time, "Preregister". Add seats-left and Waitlist/Full states.
4. **Pre-registration: one short form, pay in store by default.** Face to Face sells events as Shopify products with
   an "Attendee details" step (pay online per attendee); Pandemonium uses the BookThatApp calendar app. Both route
   through a cart/app. For one store: name, email/phone, optional Companion / Melee / Play! Pokemon ID, pay at the door.
   Online payment is a later option and needs Mish's approval.
5. **Make cEDH a first-class brand.** No store I saw does this; all lump it under "Magic". A cEDH strip (next pod
   night, standings, bracket/rules, Discord) is a differentiator. Face to Face's events page links a "Sunday Showdown
   Leaderboard - View standings", showing players value standings.
6. **Warhammer gets its own lane.** Hairy T has a top-level Warhammer tree (40k, AoS, Horus Heresy, Old World, Kill
   Team, Necromunda, Blood Bowl, Underworlds, paints, Black Library); Mox and Game Kastle feature 40K as a home
   tile. Give us a league page: season, round dates, list submission, table count, "open tables" notes.
7. **Dated "coming soon" cards for Riftbound and Hololive** (prerelease date, preorder). Riftbound is in the nav or
   hero of F2F, TKO, Hairy T, Gamelandia and Collector's Cache.
8. **Add-to-calendar is table stakes.** Game Kastle: "subscribe to this calendar, or add these events"; Pandemonium:
   "Subscribe to our emails: be the first to know about new events". Ship .ics per event + one feed (the Warminster
   VFW base already has this).
9. **Admin-driven.** Every site here bolts events on via a third-party app or a product collection; none has one
   tool for events + registration + admin + inventory. Public pages render from the same data as the admin.
10. **Sell the room, not the webstore.** Game Kastle ("Impressive Gaming Spaces, Daily Scheduled Events,
    Knowledgeable Staff"), Mox ("Eat. Drink. Play."), Gamelandia ("friendly and inclusive") sell place and people.
    Use real photos of our tables and players (with permission), reviews with names, a community line.

## Store-by-store (what I saw)

### 1. Dreamers Vault (MN, 8 stores) - https://dreamersvault.com/Events
- Platform: Netascend (footer "Powered by Netascend"); older, custom feel. Shop still being integrated with the
  separate Lotus Vault singles site ("New site, same great everything").
- Home: banner "Join us at our new store in Eden Prairie", welcome text, big links Locations / Calendar / Events,
  "Coming soon" shop categories.
- Nav: Locations, Calendar, Events, Jobs, About Us, Contact Us, cart. Footer: shop categories, account, service
  (buylist, consignment, special order, comics pull form), social.
- Events: chronological list; Store and Game filters; AJAX reload ("Updating..."). Row: game banner, day/weekday,
  price, title, description, time, store, "Preregister". Multi-store events repeat per store; some free events say
  "contact store". Payment not visible on the list. Colours/mobile: not observed.
- Works: best event filter I found; price up front. Not: long unpaginated list, duplicates, dated look.

### 2. Face to Face Games (Canada, 2 stores) - https://facetofacegames.com
- Platform: Shopify, bilingual EN/FR.
- Home/nav: "Proudly Canadian Since 2006", per-game mega-menu (Singles, Sealed, High End, New Releases and
  Preorders, set names) for Magic, Pokemon, Yu-Gi-Oh!, Lorcana, Riftbound, One Piece, Star Wars, Cyberpunk;
  Supplies; Events menu (Montreal, Toronto, WPN program, "F2F Tour" rounds); tools: Deck Builder, Advanced Search.
- Events: each store has a Shopify collection (/collections/events-toronto). Events are products; theme has
  "Attendee details" (component-event-attendee) so players pay and register in the cart. Store page shows address,
  hours, a Sunday Showdown Leaderboard link, and a relocation notice banner.
- Works: paid online registration, leaderboard, location-change banner. Not: no calendar, events in a shop
  collection, menu built for singles buyers.

### 3. Card Kingdom (Seattle) - https://www.cardkingdom.com
- Only a header retrieved (sign in, hamburger, responsive logos). Retail and buylist machine; not an events reference.

### 4. Mox Boarding House (WA/OR/AZ) - https://www.moxboardinghouse.com
- Platform: Shopify with custom events.js. "Card Kingdom Exclusives" in Magic.
- Home: "Eat. Drink. Play. Where Games, Food, and Community Come to Life."
- Nav: Shop (Board Games, Magic, TCGs, RPGs, Miniatures incl. 40K and AoS), Our Locations, Eat & Drink, Events &
  Tournaments, Book a Private Room, Group Events & Catering.
- Events page: "Join our weekly events at your local Mox", intro copy, one calendar link per store. Calendar JS: not seen.
- Works: venue story; private-room and group funnel (revenue beyond tournaments). Not: events page is mostly links.

### 5. Game Kastle (9 locations, franchising) - https://www.gamekastle.com/pages/event-calendar
- Platform: Shopify + Event Calendar App (api.eventcalendarapp.com). Accessibility widget (contrast, font size,
  language). Named 5-star reviews with store.
- Home: "your gateway to amazing new worlds"; three value props; featured tiles Magic / D&D / Warhammer 40K; free games
  to play; "Host or sign up for classes".
- Calendar: "Use the filters to sort which location you want to see events for, subscribe to this calendar, or add
  these events to your calendar." Rows not observed.
- Works: location filter + subscribe; testimonials. Not: third-party calendar look.

### 6. Hairy Tarantula (Toronto) - https://hairyt.com/pages/events
- Platform: Shopify + BinderPOS (cdn.binderpos.com/eventCalendar.css; "Integrated with BinderPOS").
- Home: free-shipping banner, in-store cafe news, huge mega-menu (see takeaway 6), Deckbuilder, buylist.
- Events: BinderPOS event calendar with Grid / List / Tile switch and Filter.
- Works: view switch, deep Warhammer taxonomy. Not: overwhelming nav.

### 7. Pandemonium Books and Games (Boston) - https://www.pandemoniumbooks.com
- Platform: Shopify + BinderPOS + BookThatApp calendar (/apps/bookthatapp/calendar).
- Home: "Welcome to Pandemonium - we're glad you're here"; blocks Who we are / We buy cards / Newsletter / We buy
  books; "We host weekly events", "What's happening? Upcoming events - View full calendar"; email capture; parking info.
- Calendar: flat list with Pokemon Prerelease at 1 PM and 4 PM, author events, RPG one-shots, puzzle competition,
  a Nephilim tournament. No game filter seen.
- Works: events preview on home, warm tone, two prerelease flights, parking. Not: plain list.

### 8. Collector's Cache - https://www.collectorscache.com
- Platform: CrystalCommerce. Accepts PayPal, cards, money orders, checks, Bitcoin.
- Home: rotating promo banners (Pokemon 30th, Reality Fracture, Lorcana, Riftbound), Featured Deals grid with stock.
  "Upcoming Events" block holds only third-party seals; tournaments are a Quick Link. Nav: Buylist, Preorders,
  New Releases, Clearance, Advanced Search.
- Take: the cautionary example; big inventory, no event presence.

### 9. Gamelandia (Palo Alto) - https://gamelandia.fun (TCGplayer Hobby Shop of the Year 2024 winner)
- Platform: Shopify + rewards app; phone and "TEXT US!" in header. Promo bar "Riftbound Radiance is here".
- Nav: Play Here!, Camps & Afterschool, Rentals & Parties, Gift Cards, Blog, Community Partnership, Press; tagline
  "Palo Alto's award-winning friendly and inclusive game store". /pages/events 404'd; events not seen.
- Take: community programmes are part of the pitch and the award story.

### 10. TKO Toy Company (Guelph ON) - https://tkotoyco.com (HSOY 2025 finalist)
- Shopify + BinderPOS. Header "Official Hobby Shop of the Guelph Storm; sponsors of University of Guelph" (local trust
  signal). Home = per-game tiles with "available now" lines. Events is only a nav link.

### 11. Labyrinth Games and Puzzles (Washington DC) - HSOY 2025 winner
- Site not fetchable (TLS error). TCGplayer says winners are picked on community impact and story, not sales; this
  winner has a teacher fund for local classrooms. Other finalists: Brick City & Games (The Dalles OR), TKO Toy Co.
  Take: add a community / about story.

### 12. WPN Premium - https://wpn.wizards.com/en/wpn-premium-showcase-gallery
- Gallery of stores with owner quotes; Premium stores get priority placement in Wizards' Store & Event Locator.
  Take: keep name, address and hours identical to our locator listing.

## Cross-site observations
- Shopify on 7 of 9 sites fetched; BinderPOS on 4 (Hairy T, Pandemonium, TKO and Hairy's calendar). Legacy: Netascend,
  CrystalCommerce.
- Event tooling is bolted on (BinderPOS calendar, BookThatApp, Event Calendar App, product collections).
- All lead with a retail mega-menu; Mulligan nav should lead with events.
- Not observed: colours, type, photography, mobile rendering, speed. Designer should open Game Kastle, Mox, Dreamers
  Vault Events, Hairy T events and Pandemonium in a browser before locking style.
- Warhammer-heavy: no Warhammer-only store site found; evidence is Hairy T, Mox, Game Kastle, Dreamers Vault.

## Patterns that work
Home page
- Store name, address, today's hours, Open-now badge, phone, primary button "See this week's events".
- "This week" strip of 5-7 cards ordered by date: game icon, time, price, seats left.
- Game quick-links (Magic, cEDH, Pokemon, Warhammer, Riftbound, Hololive) jumping to filtered events.
- 3-4 dated "new / coming soon" tiles (TKO, Pandemonium).
- Email/Discord capture; parking and directions (Pandemonium).
- Proof of place: real photos, named reviews, community or sponsor line (Game Kastle, TKO).
Events page
- Game chips (DV) + view switch Grid / List / Tile (Hairy T) + month calendar.
- Card anatomy: date block, time, game badge, format, price, capacity, state (Open / Few seats / Waitlist / Full).
- Recurring events collapsed ("Every Friday 6 PM") showing the next date.
- Detail: what to bring, rules link, prize support, check-in time, add to calendar, share link.
- Calendar feed (Game Kastle); standings link for leagues and cEDH (Face to Face).
- Multiple prerelease flights (Pandemonium); private-room booking (Mox).

## Mistakes to avoid
- Burying events behind a shop mega-menu (Face to Face, Hairy T, TKO, Collector's Cache).
- An "events" block that is really ad badges (Collector's Cache).
- Repeating recurring events dozens of times (Dreamers Vault duplicates).
- JS-only calendars with no server-rendered fallback: weak for SEO and slow phones.
- Forcing a cart to register for free or pay-in-store events.
- Template/stock-photo look; a giant catalog menu on a phone.
- Hiding price in the list. No cancellation or location-change notice (Face to Face's banner is the right idea).

## Sources (all checked 2026-10-26)
- https://dreamersvault.com and /Events (WebFetch, curl)
- https://facetofacegames.com, /collections/events-toronto, /collections/events-wpn-program (curl)
- https://www.cardkingdom.com (WebFetch, header only)
- https://www.moxboardinghouse.com, /pages/events (curl)
- https://www.gamekastle.com, /pages/event-calendar (curl)
- https://hairyt.com, /pages/events (curl)
- https://www.pandemoniumbooks.com, /apps/bookthatapp/calendar (curl)
- https://www.collectorscache.com (WebFetch, first 100k chars)
- https://gamelandia.fun, https://tkotoyco.com (curl)
- https://seller.tcgplayer.com/hsoy-2025-finalists and web search on Hobby Shop of the Year 2024-2026
- https://wpn.wizards.com/en/wpn-premium-showcase-gallery (curl)
- Not fetched: Labyrinth Games, Rain City Games, Brick City (TLS errors)

## Rendered look (Desktop, headless Chrome, 2026-10-26)

Shots: `docs/research/shots/<site>-<page>-<desktop|phone>.webp` (desktop 1440 wide, phone 390 wide, first ~2 screens).
**Phone caveat:** headless Chrome enforces a minimum window width, so some phone shots (Dreamers Vault, Game Kastle, Mox)
are cropped on the right; judge phone quality from the stacking and tap-target sizes, not the cropping. Colours are read by
eye from the renders. Not captured: Hairy T's event list (the calendar embed rendered empty in headless), Pandemonium's
`/pages/events` (404; its events live in the home-page widget), WPN Premium showcase (headless gave no image; not worked
around), Labyrinth Games and Brick City (not retried; TLS errors earlier). Extra shots: home pages of Dreamers Vault,
Game Kastle and Hairy T.

### Dreamers Vault - `dv-events-*`, `dv-home-*`
- **Colours:** royal blue header and buttons, dark chocolate-brown cards with cream text, stone-texture page background.
- **Type:** condensed all-caps white titles, a serif section heading in blue, tiny cream body text.
- **Imagery:** official game key art as a banner on every card (Pokemon, Gundam, Star Wars, Warhammer Halloween); readable at a glance.
- **Phone:** one card per column, full-width blue Preregister button; fine, but the small description is hard to read on dark brown.
- **Steal:** big banner image, day number plus weekday and price on one line, one blue button. You can tell the game from across the room.
- **Avoid:** the texture and brown-on-brown body text; the same event repeated per store; a home page that is only three tiles.

### Game Kastle - `gk-events-*`, `gk-home-*`
- **Colours:** black header, electric blue feature band, grey cards, cyan top rule on each card.
- **Type:** wide techno display face, letter-spaced caps for headings; small light body text.
- **Imagery:** moody miniature photography and card art as full-bleed heroes; very game-store.
- **Phone:** filter collapses to one button, large single-column cards; grey-on-grey card text is low contrast.
- **Steal:** the three-icon proof strip ("Impressive Gaming Spaces / Daily Scheduled Events / Knowledgeable Staff") and the Subscribe + list/grid toggle above the grid.
- **Avoid:** a tall hero that pushes events below the fold; image-less cards leave huge empty grey boxes.

### Hairy Tarantula - `hairyt-home-*`, `hairyt-events-*`
- **Colours:** saturated purple everywhere, yellow and magenta promo banners, white product panels.
- **Type:** graffiti logo, bold sans nav, serif headings.
- **Imagery:** promo banners (set launch, "We'll buy your cards +30% store credit"); products on white.
- **Phone:** solid Shopify-theme stacking; the events page was blank without its calendar script.
- **Steal:** a store-credit trade-in banner with a number in it (+30%) as a hero.
- **Avoid:** an events page that is an empty shell until a script loads; Events is one of eight nav items.

### Face to Face Games - `f2f-home-*`
- **Colours:** near-black shell, orange CTA buttons and marquee strip, Riftbound key-art hero.
- **Type:** condensed uppercase nav and tile labels, plain sans body.
- **Imagery:** set hero, game tiles with "Shop all", event tiles that are branded city cards ("HALIFAX Oct 31").
- **Phone:** good stacking, but the newsletter modal opens over the hero on first load.
- **Steal:** upcoming events right on the home page as branded tiles with a single "Sign Up Now"; the orange marquee ticker for a standing message.
- **Avoid:** a modal on first paint; several stacked promo rows before the events.

### Mox Boarding House - `mox-home-*`
- **Colours:** charcoal, burgundy and gold (from the crest logo), warm photo tones.
- **Type:** tall condensed caps in cream and gold; confident and short.
- **Imagery:** full-bleed photo of real people playing at a table with beer; the best "this is a place" image in the set.
- **Phone:** hero scales well, text is large; body copy is a long centred paragraph.
- **Steal:** one real photo of the room, a three-word tagline and a crest logo; it sells atmosphere before product.
- **Avoid:** nothing event-related above the fold; the first screens have no schedule.

### Pandemonium Books and Games - `pandemonium-home-*`, `pandemonium-events-*`
- **Colours:** white with one forest green (header bar, footer, buttons); very restrained.
- **Type:** rounded Poppins-style sans throughout.
- **Imagery:** a washed-out slideshow; little photography.
- **Phone:** Shopify Dawn defaults, clean and readable.
- **Steal:** the "Upcoming Events" panel beside the hero listing the next 9 events as name and date/time, plus "View full calendar" and an email box. The plainest and most useful home-page schedule I saw.
- **Avoid:** tiny widget text and a slideshow competing with it; the `/pages/events` link 404s.

### TKO Toy Co - `tko-home-*`
- **Colours:** black, white, yellow and teal paint-splatter accents; hand-drawn X-eyed smiley logo.
- **Type:** hand-lettered marker style in tiles, condensed caps in nav.
- **Imagery:** set hero with paint splatter, illustrated tiles ("Knockout Deals", "Underdog Prospects").
- **Phone:** standard Shopify stacking, fine.
- **Steal:** one strong illustrated identity that makes a small shop feel like a brand; custom lettering instead of stock fonts.
- **Avoid:** Events is near the end of the nav; most of the home page is singles with "SAMPLE" watermarks.

### TopDeck.gg (platform, bonus) - `topdeck-mcs-*`
- **Colours:** dark navy surfaces, sky-blue accent, bright blue border on "Platinum" events.
- **Type:** clean modern sans, dense but tidy.
- **Imagery:** each organiser's own flyer art, so the page is a wall of flyers.
- **Phone:** the best of the set: filter row scrolls sideways, horizontal card rails, large tap targets.
- **Steal:** a facet row (distance, game chips with counts) above rails of cards; each card has name, format, date, place, "N registered".
- **Avoid:** nothing for a store; as a platform it has no hours or address.
- **Note for Mulligan:** the render shows "Mulligan's 5K cEDH Tournament" (Nov 7, 2026, Warminster PA, 120 registered, Platinum) under Trending, and "Mulligan Games, Warminster, PA" under Stores Near You. Players already see us here, with a flyer image we do not control.

### Good vs great
- **Great sites show the schedule on the first screen.** Pandemonium and Face to Face put dated events on the home page; the merely good (Game Kastle, Mox, Hairy T) lead with a hero or a shop.
- **Every great event card is the organiser's art plus five facts** (game, date, time, place, price or count). The merely good have grey boxes or text-only rows.
- **One real photo beats ten stock banners.** Mox's table shot sells the room; publisher key art sells the publisher.
- **One accent colour, used for the action.** Pandemonium's single green and TopDeck's single blue make the sign-up button obvious; Hairy T's purple everywhere does not.
- **Phone is a different layout, not a squeezed one.** TopDeck's sideways chip row and card rails beat stacked desktop pages.
- **No script needed to see the schedule.** Hairy T's events page is empty without its calendar embed.

### For Mulligan
- **Home first screen = "This week at Mulligan".** A dated list (day, time, game and format, price) like Pandemonium's panel but bigger, then hours, address and open-now; the weekly schedule is the hero, not a slideshow. Server-render it so it is never blank.
- **Events as flyer cards.** Keep the red/white-diamond look: red card, white diamond day number, heavy serif game name, price and seats left, one button. Show the owner's flyer as an optional image, but put time, price and cap in text so they are searchable (they are image-only on Facebook today).
- **A game chip row with counts** (Magic, cEDH, Pokemon, Warhammer, Riftbound, One Piece, Other) that scrolls sideways on a phone, as TopDeck does; cEDH gets its own highlighted chip and a "next pod night" strip.
- **One real photo of the room** (with permission) behind the tagline, Mox style; the Facebook crowd and prize photos are the source.
- **One accent colour for actions.** Mulligan red only for Sign up / Preregister and the date block; the rest white and charcoal so buttons read; light and dark mode.
- **Link to TopDeck for the Mulligan cEDH series** (Nov 7 listing) from the cEDH strip and show "N registered" so the page matches what players see there.
