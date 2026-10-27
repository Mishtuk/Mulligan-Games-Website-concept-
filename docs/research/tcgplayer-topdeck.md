# TCGplayer store and TopDeck: what to add to the shop site

Researcher, Mulligan Games website team. Checked 2026-10-27. "Saw" = read on a fetched page or search result; "Judgement" = mine.
Extends `mulligan-public.md` and `event-and-inventory-tools.md` (not repeated here). Store: 445 York Rd, Warminster PA 18974.

## Top takeaways
1. **TCGplayer store is small and young as a marketplace seller.** Search snippet: 100% positive from 69 ratings, 71 completed sales, tagged Certified Hobby Shop, location "Pennsylvania" only. The live store page is JS-only and returned nothing to me, so listing counts, categories, shipping and pickup are UNVERIFIED. Do not publish numbers from it; link out instead.
2. **cEDH is large and measurable.** 20 events on the circuit from 2025-12-07 to 2026-11-08, 281 total registered per TopDeck. The monthly MCS runs 40-80 players, the 5K events 73-120. Biggest: Nov 7 2026 5K (120 registered, upcoming), Feb 21 2026 5K (102).
3. **Concrete cEDH numbers exist for the section:** 5K entry is $90 (Feb 5K page), guaranteed prizing regardless of turnout, 5 rounds, top 16 cut, $150 store credit for 11th-16th. MCS monthly fee is NOT found.
4. **Circuit points are published and simple:** two tiers by event size (30-63 players: 80/50/50/50/20.../10; 64+: 200/125/75/25). Every event winner gets an invite; next-highest by points also invited; invitational Nov 8 2026. Perfect for a one-table "how points work" panel.
5. **Prizes are the hook:** each monthly names a dual/land (Underground Sea, Tundra, Taiga+Bayou, Tropical Island, Badlands, Scrubland, Savannah, Bayou, Volcanic Island, Gaea's Cradle in Sep 2025). Show the prize in the event title, as TopDeck does.
6. **Redemption events** (Sunday after a 5K, 9-16 players) have a discounted entry for main-event players; price not listed.
7. **Rules to show once:** proxies max 10, recognizable art or full rules text, judge-approved; decklist required (TopDeck or paper); do not park in the adjacent RISE lot.
8. **Leaderboard data did not load** for me, so no standings are known. The site should pull or link TopDeck's leaderboard rather than copy it.

## TCGplayer (https://www.tcgplayer.com/sellers/Mulligan-Gaming-LLC/0062555a)
What I could see:
- Direct fetch (and the old `shop.tcgplayer.com/sellerfeedback/0062555a` which 301s to it) returned only the generic page title. JS-rendered; the marketplace search API returned HTTP 405.
- Search result for the old feedback URL (https://shop.tcgplayer.com/sellerfeedback/0062555a), as a snippet only: "Mulligan Gaming LLC", 100% positive, 69 ratings, 71 completed sales, Certified Hobby Shop tag, location Pennsylvania, recent feedback all five-star with no comments. Snippet may be stale; the search tool noted the Warminster address was not confirmed there.
- Not the same seller (similar names): "Mulligans Gaming" (Tennessee, https://shop.tcgplayer.com/sellerfeedback/d06f2ba3), "Mulligan Games" (North Carolina), "Mulligans LGS".
Could not see: games and categories, sealed vs singles split, listing counts, seller level, shipping terms, any in-store pickup option. Ask the owner to read these off their Seller Portal (5 minutes).
Judgement: 71 sales is small, so TCGplayer is a side channel; the TopDeck page's own words ("best MTG and Pokemon Singles selection in the Area", buys trade-ins, adding Riftbound, One Piece, Hololive OCG; https://topdeck.gg/mulligangames) describe the real shop better.
How to link: a plain outbound "Buy singles online on TCGplayer" link to the store URL above, new tab, with `rel="noopener"`. No embed, no live counts (no public API seen, and the page is JS-only). A "Certified Hobby Shop" badge could be mentioned once only if the owner confirms it on the live page.

## TopDeck
Store page https://topdeck.gg/mulligangames: event list is JS-loaded ("Loading more events..."); I got only profile info: 445 York Road, phone +1 215 789 3299, links to Discord, Twitter, Facebook, Patreon. Everything below comes from the circuit page https://topdeck.gg/circuit/mulligans (Mulligans Championship Series: EDH only, 20 events, 281 players, 10-proxy rule) and the Feb 5K event page https://topdeck.gg/event/mulligan-championship-series-february-5k.

### Attendance (registered, per the circuit page; "registered" may differ from played)
| Date | Event | Players |
|---|---|---|
| 2025-12-07 | MCS, Underground Sea | 60 |
| 2026-01-04 | MCS January, Tundra | 73 |
| 2026-02-01 | MCS February, Taiga + Bayou | 63 |
| 2026-02-21 | MCS February 5K | 102 |
| 2026-02-22 | February Redemption | 16 |
| 2026-03-01 | MCS March, Tropical Island | 67 |
| 2026-04-04 | MCS April, Badlands | 60 |
| 2026-05-03 | MCS May, Scrubland | 67 |
| 2026-05-16 | 5K cEDH May | 73 |
| 2026-05-17 | May 5K Redemption | 14 |
| 2026-06-07 | MCS June, Volcanic Island | 40 |
| 2026-07-05 | MCS July, Bayou | 59 |
| 2026-08-02 | MCS August, Savannah | 42 |
| 2026-08-08 | 5K cEDH August | 77 |
| 2026-08-09 | August 5K Redemption | 12 |
| 2026-09-06 | MCS September, Bayou | 69 |
| 2026-10-04 | MCS October, Volcanic Island | 69 |
| 2026-11-01 | MCS November (upcoming) | 80 |
| 2026-11-07 | 5K November, Drafting Duals (upcoming) | 120 |
| 2026-11-08 | November Redemption (upcoming) | 9 |

Derived (judgement, arithmetic on the table): 12 MCS monthlies average about 62 players (range 40-80); 5Ks 73-120; Redemptions 9-16. Mid-2026 dip: June 40, August 42.

### Fees, prizes, format (Feb 5K page; other events not seen)
- $90 on site, 5 Swiss rounds, top 16 cut, doors 9am, start 10am, lunch ~1pm provided. Decklist required. Winner: Kelsie Ricard (Stella Lee, Wild Card); top commanders listed: Kraum/Tymna 13, Rograkh/Thrasios 12, Kinnan 7.
- Prizes: 1st judge-foil Wheel of Fortune; 2nd-10th one drafted foil card each; 11th-16th $150 store credit.
- Monthly MCS entry fee and prize structure: NOT found. Older 2025 monthly results on mtgdecks.net list prizes and counts (Sep 2025 Gaea's Cradle, 61 players; Apr 2025 Badlands & Bayou, 37), snippet only, unfetched.

### Standings structure (circuit page)
- Points, 30-63 players: 1st 80, 2nd-4th 50, 5th-10th 20, 11th-63rd 10. 64+ players: 1st 200, 2nd-4th 125, 5th-16th 75, 17th-200th 25.
- Every event winner is invited; next-highest non-winners by points also invited; invites go out on the last event day; invitational 2026-11-08 ("details determined soon").
- Page text says 15 events/year but lists 20; treat as stale. A "Championship Series 2027" link exists. Leaderboard did not load.

## How to show it calmly
Rule: one idea per block, numbers over paragraphs, detail one click away (D36, VFW-like).

| Fact | Where | Form |
|---|---|---|
| Next cEDH event (name, date, prize, fee, seats left) | Front page | One card in the weekly schedule, prize in title |
| "Next big one: 5K, Nov 7" | Front page | One line under the schedule, only when within ~30 days |
| Circuit points table (two tiers) | cEDH section | One small table, collapsed under "How points work" |
| Invite rule + invitational date | cEDH section | Two lines |
| Attendance history (the table above) | cEDH section, "Past events" | Compact table or one sparkline-like row; front page gets only "60+ players most months" |
| Past winners, top commanders | cEDH section | Results archive page, linked, not on front |
| 5K fee, rounds, cut, prize ladder | Event page for that 5K | Small facts table |
| Proxy rule (10 max, art or text, judge) | cEDH section | One line, plus on each cEDH event page |
| Parking (not RISE lot) | Footer / visit block | One line |
| Redemption event (discounted for main players) | Beside its 5K | One line |
| TCGplayer link | Shop or Preorders section, footer | One outbound link: "Singles online on TCGplayer" |
| TCGplayer rating, sales count | Not at all | Tiny sample, unverified, would invite comparison |
| TCGplayer listing counts, shipping | Not at all until owner confirms | Use own inventory instead |
| Singles/sealed/trade-ins, upcoming Riftbound, One Piece, Hololive | Shop or Preorders section | Three short lines |
| TopDeck store page, Discord, Patreon | Footer | Icon links |
| Full leaderboard | Behind a link to TopDeck | "See standings" button |

Owner to confirm: monthly MCS fee, what TCGplayer lists (games, counts, shipping, pickup), whether attendance may be shown publicly.

## Sources
- https://www.tcgplayer.com/sellers/Mulligan-Gaming-LLC/0062555a (fetched; empty shell)
- https://shop.tcgplayer.com/sellerfeedback/0062555a (via search snippet)
- https://topdeck.gg/mulligangames
- https://topdeck.gg/circuit/mulligans
- https://topdeck.gg/event/mulligan-championship-series-february-5k
- mtgdecks.net search snippets (monthly 2025 results, unfetched)

## Round 5: owner answers research (2026-10-27)

Method: owner's Chrome via Claude in Chrome, read only. Private Seller Portal data not opened or recorded. "Verified" = read on the live page today.

### 1. TCGplayer storefront (verified, public pages only)
Source: https://www.tcgplayer.com/sellers/Mulligan-Gaming-LLC/0062555a and /feedback (renders when signed in; earlier fetch got an empty shell).
- Header: Mulligan Gaming LLC, Warminster, PA; 100% positive rating; 304 sales; "1 year on TCGplayer". Supersedes the old snippet (69 ratings / 71 sales).
- Badges (alt text, linked to TCGplayer help): certified hobby shop, Gold Star Seller, WPN seller.
- Feedback page: last 12 months, 153 ratings, all 5-star (0 of 1-4 star). Seller Feedback list shows 25 entries; many with no comment.
- Shop: "Search all 3219 items". Product Line filter: Pokemon Japan (2,588 items) and Magic: The Gathering (631). No other lines. Sealed vs singles split: NOT read (filter not checked); the top items seen were singles.
- Shipping policy, in-store pickup, return policy: NOT FOUND on the public storefront or feedback page. Not looked up in the Seller Portal. One buyer comment (Oct 5 2026) mentions a small shipping charge and no tracking number, so do not promise tracking or free shipping. Ask owner.
- Judgement: listing count and sales are public numbers but change; fine to say "100% positive, 300+ sales" if the owner agrees.

### 2. cEDH entry fees (verified, TopDeck pages read 2026-10-27)
- Monthly MCS: $60 entry, $10 deposit online to hold a spot (TopDeck shows $9.98 online charge), remainder at the door, no refund for no-shows. 5 rounds, cut to top 10, 30-min lunch break, 80-player max, prizes grow at 64. Prizes: 2nd-4th $150 credit, 5th-10th $60 credit, 1st TBD. Source: https://topdeck.gg/event/mulligan-championship-series-november-w-guaranteed (November 2026 event, at capacity).
- 5K: $100 entry, $10 deposit online (TopDeck $10.50 charge), rest at door. 5 rounds, top 16, lunch ~1pm provided. Nov 2026 prizes: set of Revised duals drafted in place order, 1st picks first + store credit, 11th-16th $125 credit. Source: https://topdeck.gg/event/mulligans-5k-cedh-tournament-november-guaranteed (at capacity). Note: the Feb 2026 5K was $90 (earlier section); fee has risen.
- Redemption (Sunday after 5K): $35, or $25 if you played the 5K, paid on site. 4 rounds, cut to top 10, only points not invitation, 64 max, credit prizes by attendance. Source: https://topdeck.gg/event/5k-november-redemption-event
- Invitational (Nov 8 2026): fee not read (page not opened).
- Fees change per event; show "from TopDeck" with a link rather than hard-coding.

### 3. Google reviews (verified; five-star confirmed on screen)
Listing: Mulligan Games, 445 York Rd, Warminster, PA 18974, (215) 789-3299. Rating 4.9, 81 reviews. Source: https://www.google.com/maps/place/Mulligan+Games/@40.2023802,-75.1002751,930m (search "Mulligan Games 445 York Rd Warminster PA").
Review summary chips: magic the gathering 17, selection of singles 7, pokemon 6, friendly employees 6, play space 4.
| Reviewer (as shown) | Age | Excerpt (verbatim) |
|---|---|---|
| Matthew Mills | 3 months | "Staff are awesome and super knowledgeable." |
| Jarrett Livingston | a year | "Incredible singles collection, great sealed selection, friendly and knowledgeable staff" |
| Tyler Adams | 5 months | "the best TCG store in the greater Philadelphia metropolitan area." |
| Wade Graeff | 3 weeks (edited) | "It has a ton of products for market prices and events for most tcg." |
| Eric Kuhn | 4 months (edited) | "I like the generous space they offer fellow players to just come in and join a game" |
| Jace Viera | 5 months | "the owners of the store had came in on a day off ... to buy my entire collection" (story; abbreviate with care) |
Also seen but star count not checked on screen: "H-13 ANA" (4 months; newbie-friendly owner, singles and sealed), Zach Eplett (a month), Ryan M (3 months, "Staff was super knowledgeable and helpful."). Use only after owner approves naming reviewers. Display names as Google shows them; first name + last initial would be Matthew M., Jarrett L., Tyler A., Wade G., Eric K., Jace V.

### 4. Store T-shirt (Q24): NOT FOUND
- Facebook is blocked for the browser extension (permission denied), so the shirt post could not be read. Web search found nothing. TCGplayer storefront lists only Pokemon Japan and MTG lines, so no shirt there (search page for "shirt" was not read; judgement). Instagram not checked. Price, sizes, in store or online: ask the owner. Do not mention a shirt price until confirmed.

### 5. Hours (verified on the Google listing today, a Tuesday)
Mon closed; Tue closed; Wed 2-10 PM; Thu 2-10 PM; Fri 2 PM-12 AM; Sat 2 PM-12 AM; Sun 1-10 PM. Source: Google Maps listing above. Compare with the site's current hours before publishing.
