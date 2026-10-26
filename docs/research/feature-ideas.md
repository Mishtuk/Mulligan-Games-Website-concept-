# Feature ideas: nearby stores, player wants, owner time sinks, discovery

Researcher: Mulligan Games team. Checked 2026-10-26. "Saw" = on a fetched or searched page; "Judgement" = mine.
Builds on `stores-and-sites.md`, `event-and-inventory-tools.md`, `mulligan-public.md`, `mulligan-facebook.md`; not repeated.

**Limits (read first).** Second pass 2026-10-26 via Claude in Chrome. Reddit itself is blocked in the extension ("not allowed
due to safety restrictions"), so I read Reddit only as Google result snippets (title, comment count, top-answer line), never
thread bodies; counts are Google's rounded "N+ comments". Upvotes were not visible. Several store sites (Rock Bottom square
site, Fire and Joy, All-Stars, Lookin' For Games event pages) failed to render in the extension, so section 1 combines
Google local panels with a few fetched pages. Treat store facts as "listing says".

## Top takeaways for Mulligan Games

1. **Per-event pages are a must for Google, so `events/[id]` beats anchors.** Google's Event docs: each event needs its own
   crawlable URL with markup on that page, and "listing pages with multiple events or schedules aren't supported". PLAN P2.3
   says "events/[id] (or anchors, per DESIGN.md)". Anchors give no rich results. Decide per-event URLs (new, S).
2. **Nearby competition is weak online.** Saw: Lookin' For Games (Levittown) homepage has a "This Week at LFG" widget but
   /events and /calendar are 404 and no fees/formats appear; All-Stars Collectibles (Langhorne, Oxford Valley Mall) puts
   its real schedule on the Wizards locator (FNM Modern $10 at 7 PM, Standard Showdown $15 capacity 18) and posts
   cancellations on Facebook ("regular Friday Night Prerelease is cancelled", sale day). Rock Bottom has MOVED: 119 York Rd
   Warminster listings are stale; Facebook and Closo (5 Oct 2026) show New Hope, so it is no longer a Warminster neighbour.
   The nearest Magic competitor by Google distance is All-Stars (16 mi); Mulligan shows as the top local result at 4.9 (81).
   A current page with fee/cap/seats and "still on / cancelled" would stand out. Standing out is cheap: be accurate.
2b. **Players already recommend Mulligan on Reddit (saw, snippet):** r/BucksCountyPA "Pokemon & Magic TCG" (10+ comments, 2
   months ago) says "Try Mulligan Games in Warminster. John is amazing and kind", and a card show visits Warminster a few
   times a year. People also ask r/BucksCountyPA for Warhammer, Lorcana, FaB, Star Wars Unlimited and D&D stores. Reputation
   is the asset; the site must make the first visit easy (hours, what's on, what to bring).
2c. **Prerelease sell-outs are the loudest player complaint (saw, snippets).** r/magicTCG "LGS reports a shortage of
   prerelease kits" (20+), r/Union_Arena_TCG "turned me away at prerelease because they sold all of the product" (20+),
   r/Lorcana "Pre-Release Limit Thoughts?" (60+), r/mtg stores "sold out 5 prereleases, then released more tickets" (200+),
   r/mtg "LGS claims can't sell pre-release kits to take home" (20+). Show capacity and sold-out state before people drive.
3. **"Is it still happening?" is the core fear; answer it on every card.** Seen: recurring listings need dates added by hand
   (Paizo thread), stores say "see our Facebook/Discord" (Level One), WPN says conflicting calendars cause confusion. Show
   "Confirmed / Cancelled / Changed" with last-updated stamp, and keep website, .ics, Google and Wizards identical.
4. **Owners' pain is attendance guesswork and the no-show.** Seen: no-shows and silent drops (ICv2 owner column),
   pre-registered and on-site check-in needs two staffers (ICv2 prerelease column), waitlist/no-show handling done by hand
   (a San Antonio One Piece store: waitlist called if unpaid by 11 AM). Pre-reg + waitlist + "arrive by X or the seat goes" + check-in
   (already D6/P2.4) is the right fix; add a one-click "no-show" mark and an auto-posted cancel notice.
5. **One create-once, publish-everywhere habit saves the most time.** Owners post to Wizards, TopDeck, Facebook, Discord,
   AllEvents (mulligan-public #6). Cheapest wins: a copyable "post text" block per event and a printable/TV weekly sheet
   (both were cut to "Not now"; evidence says move them up).
6. **Beginner and parent clarity is a gap even at big sites.** Level One's events page shows no fee, format, age or new-player
   info (saw). Pokemon's own parents guide says leagues are casual and run in stores (saw). Add "New here?" and a per-event
   "beginner friendly / bring a deck / loaner decks" line plus an age policy.
7. **Google Business Profile matters as much as the site.** Event posts need title, start/end date and time (no time = 24 h
   event), posts older than 6 months archive. GBP is free and is where "game store near me" lands (judgement + Manaverse).
   The site should hand the owner a ready GBP post per event; hours must match the site exactly.
8. **Treat the competitor notes as unverified.** Few nearby stores' events were verifiable beyond secondhand listings. Use
   them for the team only, never on the public site.

## 1. Nearby competitors (about 30 min: Bucks / Montgomery / NE Philly)

Search tools found few current schedules. Treat every entry as "listing says", confirm by phone or Chrome before relying on it.

| Store (area) | Saw | Site / events observation | Where Mulligan can stand out (judgement) |
|---|---|---|---|
| Lookin' For Games (Levittown, Bucks; 4354 New Falls Rd) | Site shows hours (Fri to 11 pm), address, phone, online store, "bring your own or try ours"; footer (c) 2019; Meetup shows Fri night Magic, Wed game night, D&D, SWU, Yu-Gi-Oh; Inquirer lists painting nights and Extra Life charity. | https://lookinforgames.com (rendered 2026-10-26): hours Fri to 11 pm, "This Week at LFG" widget (no event text in page), membership, consignment, wifi; /events and /calendar return 404; no fees/formats/ages shown. Reddit r/BucksCountyPA (20+, 7 months ago) says it "has a warhammer night I think". | Fresh calendar with fees, cap, Discord, cEDH; they are the nearest "real" competitor, but ~15 min away and Friday-only late hours (till 11, Mulligan to midnight). |
| Brave New Worlds (Old City Philly; second store Willow Grove) | Directory: strong Magic community, board game nights; 2009 forum said Willow Grove once ran Warhammer 40K night. | bravenewworlds.com redirects to a GoDaddy "for sale" page (saw); no current schedule found. | They have no usable web presence for events (as far as I could see); a verified schedule beats them. |
| Alternate Universes / Fire and Joy (Holmes Delco, Blue Bell) | Inquirer: card-focused, buy/sell cards in store or online, no play space mentioned. alternateuniverses.com now redirects to fireandjoy.com. | Not fetched (redirect). | Retail/singles first, little play; Mulligan sells the room. |
| 7th Dimension Games (Jenkintown, Montgomery) | Inquirer: used games, commission sales. Site: Root, Magic, Pokemon, D&D, Battletech, miniatures; no hours, events or location on the fetched page. | https://www.7thdimensiongames.com: product overview, no events or hours. | Same: an hours + events page wins. |
| Garden of Earthly Delights (NE Philly, 7907 Bustleton Ave) | Directory: weekly Magic and Pokemon league nights, graded vintage; hours 10-7 (earlier close). | Listing only (thecardshopfinder.com). | Earlier close than Mulligan's Fri/Sat midnight; late play is the gap. |
| Rock Bottom Games and Hobbies (was 119 York Rd, Warminster) | Google 2026-10-26: Warminster listings (KeepUpCards 3.8/11 reviews, Card Shop Hub, Sun 11-4, Tue 10-6) are old; Facebook says 5820 Lower York Rd, New Hope; Closo dated 5 Oct 2026 lists New Hope, Tue-Thu 12-8, Fri-Sun 12-6. Online store on a Square site (code for 5% off $150). | Square site did not render. | It has left Warminster, so Mulligan is the only game store listed there. Stale directories show why one verified hours/address matters. |
| All-Stars Collectibles (Oxford Valley Mall, Langhorne; 4.7/386; 16 mi) | Site says FNM "every Friday at 6:15, 20+ year tradition"; Wizards locator shows FNM Modern 7 PM $10, FNM Draft 7 PM, Standard Showdown 4 PM $15 capacity 18; Facebook page (1.1K followers) posts cancellations/schedule changes. | Site page did not render; schedule lives on Wizards locator + Facebook. | Fees and capacity shown on the locator: copy that; avoid cancellations only on Facebook. Mall hours limit late play. |
| Warminster Games Masters Guild | Seen only as Facebook/Instagram video results (1 month ago); no site or address found. | Social only. | Unverified: confirm whether it is a club that overlaps Mulligan. |
| Top Deck Games (Cherry Hill NJ; 40k, Magic, D&D, Pokemon, Dragon Ball) | Inquirer: especially good for 40k; lots of table space. | Over the bridge; site not reachable (DNS). | Their Warhammer pull is a reason to confirm Mulligan's 40k plans (Q5). |
| Redcap's Corner (West Philly), Philly Game Shop (South Philly) | Redcap's: Magic, Pokemon, Warhammer, weekly tournaments. Philly Game Shop on Wizards locator: FNM Draft with an event Discord named. | Outside 30 min or marginal. | Context: city stores publish via Wizards locator; their sites are mixed. |
| Libraries (New Hope-Solebury weekly Magic and Pokemon club; Levittown game nights) | Free weekly clubs for kids/teens/adults. | buckscountyparent.com, buckslib.org calendars. | Parents see "free Magic club" first; Mulligan's "Learn to Play" page must say how it differs. |

Judgement: other stores post schedules in three places (Facebook, Discord, Meetup). Nobody I could see offers a single
accurate page with fee, cap, status, calendar download and a map. Late hours (Fri/Sat midnight) and cEDH depth are the
differentiators; both are already Mulligan's.

## 2. What players say they want

Saw on Reddit via Google snippets only (2026-10-26; counts are Google's "N+ comments"; upvotes not visible):
- Players want a way to find events: r/magicTCG/r/mtg "I built a free site for finding when and where to play Magic" (40+, 4
  months ago: by format, distance, date, list/calendar/map). r/shopify "How would you create a calendar for events for a Local
  game store" (10+, 1 month ago): top answer "Google Calendar embedded in the shop" (owners want cheap and easy).
- Prerelease anxiety: see 2c above; r/mtgfinance "Game Store Owners Report 'Very Positive' Prerelease" (130+) quotes a store
  with 134 slots sold out for Fri/Sat and only a handful left Sunday. r/magicTCG "No-one at prerelease?" (230+, 1 year ago)
  shows the opposite worry: empty rooms, so show who is signed up.
- Commander night etiquette: r/EDH "What makes a good Commander Night?" (50+, 3 months ago, top reply 44 votes: competitions
  are inherently competitive, casuals want a different night); r/magicTCG "AITA for locking out my opponents from playing in
  a paid" event (330+, 4 months ago). Tag competitive vs casual and state entry rules.
- Local asks: r/BucksCountyPA "Best local game store for table top" (20+) wants a Warhammer store ("Sundays we meet to play
  Warhammer, store opens at 11"); "Any game stores in the area?" (20+, 2 years ago) asks for Lorcana, Flesh and Blood, D&D,
  Star Wars Unlimited; "Best / Worst Card Shops" (9) is a parent with young kids entering Pokemon.
- Rock Bottom's move and a Levittown store rebrand ("Everyone's Gaming Outlet", r/longisland 40+) show players struggle to know
  which listing is current.

Saw (earlier pass, non-Reddit):
- Recurring events on a locator go stale unless dates are added by hand; players are told to "contact the store directly"
  (Paizo forum threads rzs2tks4 and rzs2r8zo).
- A community moved announcements to Discord and said events "are still happening but won't be posted here for the time
  being" (Meetup, Austin social gaming).
- A shop's site says its upcoming events "can be found on our Facebook Events page or by joining our Discord" and shows
  no fee, format, age or new-player info (Level One Game Shop).
- Pokemon prerelease thread (r/pkmntcg, search snippet only): stores let regulars hold spots and give league priority;
  pre-registration is allowed; implies sold-out anxiety and priority rules that players want stated up front.
- Bandai One Piece pages: stores manage registration differently; "contact your local store"; Bandai takes no responsibility
  for store/player problems (en.onepiece-cardgame.com store tournament pages). A store ran a TCG+ lottery capped at 32 with a
  waitlist and "pay by 11 AM Saturday or we go through the waitlist" (dlair.net event page).
- Warhammer: forum posts say "call ahead", space is tight, terrain tables need arranging (Meetup listing, Dakkadakka).
- Commander: brackets (1-5) are the new baseline for matching pods; a league guide suggests asking each player's bracket at
  sign-up to avoid a tuned deck landing at a precon table (mtgevent.com blog, fanfinity.gg).

Not found on Reddit via snippets: any thread about LGS "website vs Discord" or no-shows; those needs rest on the owner sources
in section 3. The new Reddit evidence is mostly about prerelease capacity and finding the right store.

Judgement (match to the complaints in the brief): stale schedule, "is it still on", missing fee, "can I bring a kid / is it
beginner friendly", "is it sold out", "can I just show up". The fix is data on the card, not extra pages: status, fee,
seats left, beginner/age tag, walk-in vs sign-up, and a "last updated" stamp. Requests I could not confirm from players but
the sources imply: reminders, a calendar they can subscribe to, and one place to ask "any seats?".

## 3. What eats owners' time (and the small tools that help)

Saw (old but consistent, ICv2 columns by store owners 2003-2020 plus WPN):
- Prerelease weekends: needs one staffer for pre-registered check-in and one for on-site; planning counts, prizes, venue,
  staff (ICv2 war-spark pre-release column; Six Feet Under Games column).
- Silent drops and no-shows: staff learn only when an opponent reports the empty seat (ICv2).
- A store pre-sold all 60 prerelease boosters with a buy-a-box promo before midnight; Pokemon allowed selling kits on
  receipt instead of running a tournament (ICv2). Kit counts and who is owed one are tracked by hand.
- Same questions repeatedly in DMs/Facebook ("what time", "how much", "is there room"); WPN advises one consistent calendar
  everywhere so staff stop correcting versions (WPN "How to design a stellar store calendar", 2022).
- Posting to five places: WPN tells owners to post in EventLink so it lands on the locator, and in-store, window, bathroom QR code
  (WPN calendar article); TopDeck offers an embeddable calendar and store hub that updates as events change (overpower.topdeck.gg
  /help/creating-store-hub).

Small tools that fix them (judgement, matched to existing plan):
- Event page with live seat count and waitlist (P2.4) answers "is there room" without a DM.
- A "kit/box reservation" line on prerelease events (reserve N kits, show "x left") ties to inventory (P2.5).
- No-show button on the Today screen, plus a stated "seat released at start time" rule on the card.
- Copy-paste text block per event for Facebook/Discord/GBP/Wizards; weekly flyer and TV pages (see ideas 3 and 4).
- Pinned "FAQ" page (parking, age, proxies, payment) to cut repeat DMs.

## 4. How players find a local store; what the site needs

Saw (Google docs, fetched 2026-10-26):
- **Event rich results** (developers.google.com/search/docs/appearance/structured-data/event): required `name`, `startDate`
  (ISO-8601 with UTC offset), `location` as Place with `name` and full `address`. Recommended: `endDate`, `description`, `image`
  (16x9, 4x3, 1x1, min 720 px wide), `offers` (price, `priceCurrency`, `availability`, `url`), `organizer`, `eventStatus`.
  Use price 0 for free. `eventStatus`: EventScheduled, EventCancelled (keep other properties), EventPostponed, EventRescheduled
  (update startDate and optionally `previousStartDate`).
- Rules that bite us: one unique crawlable URL per event; the page must focus on one event (list pages unsupported); do not mark
  up business hours; do not mark short promotions as events; events must be bookable by the public (invitation-only events
  ineligible); recurring events: the docs give no recurring type, so mark each upcoming date as its own Event.
  Use Rich Results Test, URL Inspection, sitemap, Search Console report. Eligibility is not a guarantee of display.
- **Google Business Profile posts** (support.google.com/business/answer/7662907): types Update, Offer, Event; Event posts need
  title, start and end date/time (no time = shown as 24 h); posts older than 6 months archive unless date-ranged.
- Manaverse (game-store podcast): profile is the store's first impression for "game store near me" and "Magic cards"; a
  dedicated website page plus a filled profile helps beat big-box in the map pack (summary, no concrete tips available).
- WPN: events posted in EventLink appear on the Wizards locator; TopDeck "Follow" feeds a twice-weekly digest of up to four
  events from followed stores, only events within 30 days (topdeck.gg blog 2025-04-26), so scheduling 30 days ahead matters.

Judgement, minimum for Mulligan: (1) `HobbyShop` LocalBusiness JSON-LD with address, phone, hours, sameAs (Facebook, TopDeck,
Discord, Wizards locator); (2) per-event pages with Event JSON-LD incl. offers and status, regenerated from admin so cancels flip
to EventCancelled; (3) sitemap listing every event URL; (4) matching address/phone/hours across the site, GBP and the
Wizards locator (D12; 445 vs 455 York Rd unresolved); (5) add events 30 days ahead for TopDeck digests; (6) a "game store
near Warminster" page with parking, map and Google reviews link; (7) Instagram/Discord as secondary, not primary.
I did not find a source that says Instagram or Discord changes Google ranking; do not promise that.

## 5. Small ideas other stores/sites use (and fit for one store)

| Idea | Who does it (saw) | Fits one-store site? |
|---|---|---|
| Open-now strip from hours + overrides | Warminster VFW base `bar-status` (BRIEF/PLAN); Lookin' For Games lists hours | Yes, already in PLAN P2.3 |
| Embeddable/subscribable calendar | TopDeck store hub embed https://overpower.topdeck.gg/help/creating-store-hub ; Game Kastle subscribe (sites) | Yes, already D11 |
| Follow/"digest" email | TopDeck weekly digest https://topdeck.gg/blog/following-weekly-digest-20250426 | Later (needs email); use TopDeck's own follow button link now |
| Calendar printed + TV + QR | WPN calendar guidance https://wpn.wizards.com/news/how-to-design-stellar-store-calendar (window, POS, bathroom QR, TV) | Yes, cheap; in "Not now" |
| Event post/flyer text for socials | WPN marketing materials (posters, social graphics) https://wpn.wizards.com/news/how-to-run-successful-commander-events-and-grow-your-community | Yes, simple text block |
| Bring-a-Friend / new-player program | WPN Orientation https://wpn.wizards.com/en/news/wpn-orientation-player-path | Yes, a page + a flag on events |
| Parent / age policy page and code of conduct | Play! Pokemon Parents Guide https://www.pokemon.com/uk/play-pokemon/about/parents-guide ; a NJ comic shop league with code of conduct (patch.com) | Yes, static page |
| Drop-in/free league wording ("come for an hour") | A Rio Rancho league (thecardshopfinder.com) | Yes, one line per event |
| Commander bracket field on sign-up/event | mtgevent.com league guide; Wizards Commander brackets | Yes, one optional field (not pairings) |
| Waitlist with release time ("pay by 11 AM") | San Antonio One Piece store (dlair.net) | Yes, in D6 |
| Restock/notify-me | Big retailers have it (Pokemon Center, Target) per pagecrawl.io; no independent store example found | Maybe: a manual "Tell me when X arrives" form feeding the preorder list; low priority |
| Trade-in info | Mulligan buys trade-ins (mulligan-public) | Yes, a static page with what you buy and when to bring it |
| Gift cards, lost and found | Not found in any fetched source | Gift cards: link only, needs POS (Q4). Lost and found: a small note on Visit page, not a feature |
| Table space for open play | Top Deck Games "lots of table space" (Inquirer); Lookin' For Games three play spaces (Meetup) | Yes: show "tables free tonight" only if staff set it (S) |
| Results + winner photos | Face to Face leaderboard (sites); P2.6 | Yes, opt-in (already P2.6) |
| Community charity events | Lookin' For Games Extra Life, CHOP cEDH charity (pub) | Yes, a highlight flag on events |

## Idea list

Size S = under a day, M = a few days, L = a week plus. "PLAN" = already scoped; "Not now" = listed there; "New" = not in PLAN.

| # | Idea | Helps | Evidence | Size | Status |
|---|---|---|---|---|---|
| 1 | Per-event pages with their own URL and Event JSON-LD (offers, status, location name+address) instead of anchors | players (find via Google), owners | S4 | M | New (refines P2.3) |
| 2 | Status on every card: Confirmed / Changed / Cancelled, with "updated" time, and EventCancelled in JSON-LD | players | S2, S3, S4 | S | New |
| 3 | "Copy post text" per event (title, time, fee, link) for Facebook/Discord/GBP/Wizards | owners | S3, S5 | S | New |
| 4 | Printable weekly flyer and in-store TV screen with QR to the site | owners, players | S3, S5 | M | Not now (move up after launch) |
| 5 | "New here?" page: beginner, parent, age policy, code of conduct, what to bring, loaner decks, Bring-a-Friend | players, parents | S2, S5 | S | New |
| 6 | Event tags: beginner friendly, age, drop-in vs sign-up, bracket (Commander) | players | S2, S5 | S | New (extends D7 fields) |
| 7 | Waitlist release time and "seat released at start" rule shown on card and sign-up | players, owners | S3 | S | PLAN (D6/P2.4); add the time field |
| 8 | One-tap no-show mark on Today screen, counted in results | owners | S3 | S | New (extends P2.4/P2.6) |
| 9 | Prerelease kit/box reservation shown on the event ("12 kits left" / "Sold out, waitlist open"); raised priority by Reddit | players, owners | S3, R2c | M | PLAN (P2.5 event product use); add public count |
| 10 | "GBP checklist" in admin: copy event as Google Business Profile post, remind to repost every 6 months | owners | S4 | S | New |
| 11 | Sitemap and `HobbyShop` JSON-LD with sameAs and identical hours/address everywhere | owners | S4 | S | PLAN (jsonld, D12); add sitemap |
| 12 | Open-now strip with holiday overrides and "open late tonight" wording | players | S5 | S | PLAN (P2.3) |
| 13 | Embeddable/subscribable calendar and per-game .ics | players | S4, S5 | S | PLAN (D11) |
| 14 | Link to TopDeck store hub / "Follow us on TopDeck" button, add events 30 days ahead | players, owners | S4 | S | New |
| 15 | Trade-in and buylist info page (what is bought, how often, store credit bonus if any) | players | S5 | S | New (a page, not a price engine) |
| 16 | "Tables free tonight" staff-set badge for open play | players | S5 | S | New |
| 17 | Public results with winner photo for opt-in events | players | S5 | M | PLAN (P2.6) |
| 18 | Manual "tell me when it arrives" form feeding preorder list | players, owners | S5 | M | New (low priority) |
| 19 | FAQ page (parking, age, payment, proxies, prerelease rules) to cut repeat DMs | owners | S3 | S | New |
| 20 | Weekly Discord webhook post of the schedule | owners | S3 | M | Not now (wait for Q7) |
| 21 | Per-session capacity for prereleases/big events, with "extra session added" status when one fills | players, owners | R2c | S | New (extends 9) |
| 22 | Competitive vs casual tag and entry rules on Commander/cEDH nights (Commander bracket if any) | players | R2 | S | New (merge into 6) |
| 23 | Check Google Maps/directory listings match the site (old Warminster Rock Bottom listings show stale data persists) | owners | R1 | S | New (add to GBP checklist 10) |

New evidence on ruled-out items (no new proposals): the Bandai pages and a San Antonio store show that "pay by a deadline or the
waitlist gets your seat" works without online payment (supports D3). Commander brackets are a field, not pairings (D2 holds).

## Sources (all checked 2026-10-26)

- Google Event structured data: https://developers.google.com/search/docs/appearance/structured-data/event
- Google Business Profile posts: https://support.google.com/business/answer/7662907
- WPN, store calendar: https://wpn.wizards.com/news/how-to-design-stellar-store-calendar
- WPN, Commander events: https://wpn.wizards.com/news/how-to-run-successful-commander-events-and-grow-your-community
- WPN Orientation (Bring-a-Friend): https://wpn.wizards.com/en/news/wpn-orientation-player-path
- TopDeck store hub: https://overpower.topdeck.gg/help/creating-store-hub ; digest: https://topdeck.gg/blog/following-weekly-digest-20250426
- Lookin' For Games: https://lookinforgames.com ; Meetup https://meetup.com/lookin-for-games
- Inquirer shop guide: https://www.inquirer.com/philly-tips/board-game-shops-philadelphia.html
- Card shop directory entries: https://thecardshopfinder.com/pa/philadelphia/brave-new-worlds/ , .../redcaps-corner/ , .../top-deck-games/
- 7th Dimension Games: https://www.7thdimensiongames.com
- Level One Game Shop events: https://levelonegameshop.com/pages/in-store-events
- Manaverse GBP episode: https://manaversesaga.com/mvp162-mastering-your-stores-google-business-profile-with-bill-hibbler/
- ICv2 owner columns: https://icv2.com/articles/games/view/11983/rich-waldbiesser-six-feet-under-games-organized-play-problems ; https://icv2.com/articles/columns/view/43093/war-spark-offers-big-sales-opportunity-re-think-pre-release-structure
- Bandai One Piece store tournaments: https://en.onepiece-cardgame.com/events/store_tournament/ ; San Antonio example https://www.dlair.net/medicalcenter/?p=14373
- r/pkmntcg prerelease thread (snippet only): https://lr.eu.psf.lt/r/pkmntcg/comments/1kqs1mr/prerelease_help
- Reddit via Google snippets, 2026-10-26 (thread URLs not exposed by Google text; find by title): Google queries
  https://www.google.com/search?q=site:reddit.com+local+game+store+website+events+schedule ,
  ...+LGS+prerelease+sold+out..., ...+Warminster+OR+%22Bucks+County%22... ; threads cited by title in sections 2 and 2b/2c
  (r/BucksCountyPA, r/magicTCG, r/mtg, r/Lorcana, r/EDH, r/Union_Arena_TCG, r/shopify, r/mtgfinance). Marked "R1/R2/R2c" above.
- Rock Bottom and Warminster/Langhorne stores via Google results 2026-10-26: https://www.google.com/search?q=Rock+Bottom+Games+and+Hobbies+Warminster+PA ;
  Wizards locator for All-Stars (https://locator.wizards.com, Langhorne); http://www.allstarscollectibles.com/MAGIC (snippet only)
- Lookin' For Games site (rendered): https://www.lookinforgames.com ; /events and /calendar 404
- Paizo locator threads: https://paizo.com/threads/rzs2tks4 , https://paizo.com/threads/rzs2r8zo
- Pokemon Parents Guide: https://www.pokemon.com/uk/play-pokemon/about/parents-guide
- Commander league/brackets: https://www.mtgevent.com/blog/how-to-run-a-commander-league/ ; https://www.fanfinity.gg/blog/whats-a-power-level-a-first-look-into-the-commander-brackets/
- Bucks library clubs: https://buckscountyparent.com/event/magic-the-gathering-club/2024-08-16
- Warhammer store chatter: https://www.dakkadakka.com/dakkaforum/posts/skipread/703621.page
- Restock alert background: https://pagecrawl.io/blog/pokemon-tcg-restock-new-set-drop-alerts

## Boss ranking (2026-10-26)

Judged against BRIEF.md: useful to owners, works, simple / reuses VFW, looks right to players. "Now (covered)" = already in
PLAN, no new line. Design for the Now items is added to `DESIGN.md` under P1.3 before any build.

| # | Bucket | Where it went |
|---|---|---|
| 1 | Now | P2.3 "own page per date + Event JSON-LD, Rich Results Test"; D16 (replaces "or anchors") |
| 2 | Now | P2.3 "Cancelled / Changed with updated date, cancelled dates stay listed" (no "Confirmed" label: noise) |
| 3 | Now | P2.2 "Copy post text" per date; D18 |
| 4 | Later | Not now: flyer + TV with QR, first thing after launch |
| 5 | Now | P2.3 "New here?" page (merged with 15, 19); Q20. Bring-a-Friend: Drop (WPN program, not a site feature) |
| 6 | Now | P2.2 D17 fields (beginner friendly, age); P2.3 shows them; D17 |
| 7 | Now | P2.2 seat-release time field (D17); P2.4 sign-up reply states it |
| 8 | Now | P2.4 one-tap No-show with Undo + promote; P2.6 no-show count |
| 9 | Drop | Capacity is the kit count; seats left / sold out / waitlist already shows it (D17); P2.5 warns on stock |
| 10 | Now | Merged into 3 (post text has start and end time for GBP). 6-month repost reminder: Drop (event posts expire anyway) |
| 11 | Now | P2.3 `sitemap.xml` + `HobbyShop` `sameAs` |
| 12 | Now (covered) | P2.3 open-now strip with holiday overrides; wording is the designer's |
| 13 | Now (covered) | D11 + P2.3 `.ics` feeds (per-game in the VFW Adapt table). Embed widget: Drop (subscribe link covers it) |
| 14 | Now (covered) | TopDeck link is a store link (D7) and in P2.7; "post 30 days ahead" is owner advice, not code |
| 15 | Now | Merged into 5 (trade-ins section of "New here?"); Q20 |
| 16 | Drop | Staff won't update it mid-event; a stale badge is worse than none |
| 17 | Later | Results already in P2.6; winner photos need player consent (Not now) |
| 18 | Later | Notifying needs email (Not now); preorders cover it |
| 19 | Now | Merged into 5 |
| 20 | Later | Already in Not now (Q7) |
| 21 | Drop | D15 `dates` recurrence + D7 date exceptions already model sessions; an extra session is just another date |
| 22 | Now | Merged into 6: casual / competitive tag (D17); brackets go in the description |
| 23 | Now | P3.1 "listing check", mismatches to OWNER-QUESTIONS; Q18 |

Counts: 16 Now (9 with new PLAN lines, 4 merged into those, 3 already covered), 4 Later, 3 Drop. New owner questions: Q18-Q20.
