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
