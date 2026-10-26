# Event and inventory tools TCG / tabletop stores actually use

Researcher: Mulligan Games website team. Checked 2026-10-26. "Seen" = on a fetched or searched source; "Judgement" = mine.
Confidence note: many vendor pages did not state price or API terms; those cells say "not found" rather than guessing.
Owner pain points: no Reddit threads were reachable through search, so section 3 is mostly vendor/trade press, flagged as secondhand.

## Top takeaways for Mulligan Games

Principle (judgement): every publisher forces stores onto its own app for pairings, results and sanctioning, and those apps
change often (Riftbound moves platform 2026-09-14, Spicerack reportedly shut down, BCP and Melee are merging, KONAMI requires
NEURON from 2026-04-01). So the admin must NOT try to be a tournament engine. It owns the store-side calendar, sign-up money
and stock; for the match itself it holds a link or event code and hands off.

Own it (nobody else covers it across all games):
1. One calendar for all games and formats, public and admin, with .ics and JSON-LD. Official locators (Wizards, Bandai,
   Play Hub, PlayRiftbound) each show only their own game; a player wanting "what is on Friday" has no single source.
2. Event templates and recurring nights (FNM, Pokemon League, Commander night, 40k league). Seen: TopDeck and Play Hub sell
   this as a feature, so stores clearly want it; the VFW admin already has recurring events to reuse.
3. Pre-registration with capacity, waitlist (auto-promote) and a cutoff, plus check-in at the counter. Wizards says
   pre-reg lets stores estimate attendance and staff; Spicerack and TopDeck both built automated waitlists.
4. Entry fee + payment status per player (paid at door / paid online / comped / store credit). Do not process cards at first
   (needs owner approval); record "paid" manually, add a Stripe/Square link later.
5. Prize-support and store-credit ledger per event and per player (who won what, credit issued, credit redeemed). No official
   tool does this; POS tools do store credit but not tied to event results. Owners report events lose money unless fees
   cover prize and staff (ICv2, TCGsync).
6. Event-product stock: sealed (draft/set boosters, prize packs, promo packs) with low-stock alerts and an "event uses N
   boosters" link so scheduling a prerelease reserves stock. Plus preorders as reserved quantities with deposit and pickup
   status. Singles pricing is out of scope (see below).
7. Per-event "tool link" field: official event code, Melee/BCP/TopDeck URL, Discord link, list-submission deadline (40k lists
   are due the night before at many events), round length and points level for miniatures events.
8. Light results log (winner, headcount, optional top 8) for the store's history and prize payout; headcount is also what
   Wizards/Bandai reporting needs, so it doubles as a reporting reminder.

Link or hand off (do not duplicate):
- Pairings, standings, match reporting: Wizards EventLink + Companion; Play! Pokemon event software; KONAMI NEURON; Bandai TCG+;
  Ravensburger Play Hub; PlayRiftbound.com; Melee/BCP/TopDeck for the rest. Sanctioned results must go through these anyway.
- Store/event locator listing: stores publish to each publisher locator; our site links to them, not replaces them.
- Singles pricing, buylist, TCGplayer sync, barcode labels: leave to BinderPOS-class tools / SortSwift / Shopify apps. Offer
  an optional CSV stock import and a "link to store POS" instead of building a singles engine.
- Online card payments and real POS: Square / Shopify / the store's existing POS.
- Discord: posting the weekly schedule to a webhook is cheap and valuable; a full bot is not.

Open questions for Mish (ask the owner, do not assume): which POS does Mulligan use today; which publisher programs is the
store enrolled in (WPN, Play! Pokemon, OTS, Bandai, Play Hub, Riftbound); does it take online entry payment; does it run
40k/AoS leagues and on which app (BCP?).

## 1. Events and tournaments

| Tool | Games | Cost | Pairings / standings | Pre-reg + payment | API / embed |
|---|---|---|---|---|---|
| Wizards EventLink + Companion + Store & Event Locator | Magic, D&D | Free to WPN stores | Yes via Companion; ending the event auto-reports it | Players enroll with event code or QR in Companion or in the locator (announced 2026-10-01); organizer can add by Wizards Account email or one-time guest; online payment not found | None found; link out to locator.wizards.com |
| Play! Pokemon (TOM, being replaced by Pokemon Event Manager) | Pokemon TCG, VGC | Free to approved organizers | Yes, desktop software; players need a Player ID | Not found for stores | None found |
| KONAMI NEURON / Official Tournament Store program | Yu-Gi-Oh! | Free | Results and decklists via NEURON; duelists must use NEURON to register for OTS events from 2026-04-01 | In-app | None found |
| Bandai TCG+ (organizer = Bandai TCG Event Manager web) | One Piece, Dragon Ball, Digimon | Free | Yes; players see pairings and report results | In-app; stores must file event reports in TCG+ | None found; store sets game title so events show |
| Ravensburger Play Hub | Disney Lorcana | Free; store applies and is approved | Event types: weekly play, prerelease, set champs, core constructed, pack rush; creation tools and calendar with recurring play | Players search and register in app; store-side details not published | None found; replaced earlier Melee-based program |
| Riftbound (PlayRiftbound.com replaces carde.io on 2026-09-14) | Riftbound | Free; store applies via Riot/UVS program | Players check pairings and report on phones; new organizer and judge tools promised, no dates | Riot ID sign-in; payments not mentioned | carde.io fan projects expected to break |
| Melee.gg | Magic (Pro Tour), Star Wars: Unlimited, many | 8.99% platform fee on USD entry fees through Melee (10.99% non-USD); events up to 128 players may skip Melee payments | Yes | Yes, Stripe Express; PayPal dropped mid-2026 except JPY | API help article exists; terms not retrieved |
| Best Coast Pairings (BCP) | Warhammer 40k/AoS/Kill Team, Catan, many more | "Free*" per an older app listing; current pricing unclear | Yes, plus list/deck submission, rankings | Online registration and ticketing | Not found. Merging with Melee into Galactic Events Studio (2026-02-19); unified login and Match Manager planned |
| TopDeck.gg | 30+ games incl. Commander pods, Swiss, elimination | Not on features page | Auto pairings, timers, live standings | Templates, QR sign-up, automated waitlist, check-in, deck list collection (Moxfield import), payment processing | Yes: REST API (tournaments-v2) and Discord bot |
| Spicerack | Magic | not found | Pairings, waitlist, invitational series | n/a | One source (Cool Stuff Inc, 2026-05-29) says it shut down, team moving to "tabletop.gg"; unverified |
| Tabletop Admiral, ITC, Unity League, Hololive OCG, Challonge | 40k (TTA, ITC), Magic (Unity), hololive OCG, generic brackets (Challonge) | Not found | Not found | Not found | Not retrieved. Judgement: TTA/ITC are 40k ranking/league layers around BCP; Challonge is a generic bracket tool |

Warhammer notes (seen on event pages): list deadline the evening before, lists as plain text pasted into BCP, round length
like 90 min + 10 min setup, random round 1 then Swiss, BCP app optional for players, walk-up registration common. So the
event form needs round length, points level, list deadline, and a "register on BCP" link.

Judgement on embeds: no official platform offers a documented embed for store websites. Plan to link and show the event
code; optionally pull from TopDeck/Melee APIs later after checking their terms.

## 2. Store ops, inventory, POS

| Tool | Price (seen) | Handles | Notes |
|---|---|---|---|
| BinderPOS (Shopify-based) | $100/mo Basic, $150/mo Pro, plus 2% web / 2.5% TCGplayer commission; separate Shopify account | POS, kiosk, buylist, store credit, events module, singles + sealed DB, 12-hour price updates | TCGplayer stopped new customers 2025-02-19; waitlist only in 2026 (competitor-sourced). Existing stores still use it |
| Crystal Commerce | Not found independently; competitor claims $599 setup | Webstore, POS, inventory | Unverified price |
| TCGplayer Pro / seller tools | Commission varies | TCGplayer-native inventory, limited POS | Marketplace-seller oriented |
| SortSwift | Free tier up to $499/mo bundles; Core+ $369 with POS; autopricing from $15.99/mo; claims 0% commission | Inventory, POS, buylist, autopricing, TCGplayer integration | All figures from SortSwift's own pages |
| Shopify + TCG apps | Kori TCG Manager $14.99 / $24.99 per mo (launched 2026-07-10, no reviews); Synq $29 / $79 / $149 per mo by card count | Singles and sealed listing, barcodes, TCGplayer price sync | Event tickets and preorders as plain Shopify products (judgement) |
| Square for Retail, Lightspeed | Not retrieved | General POS | Not game-aware; event entry is just a product |
| Card scanners | Not retrieved | Fast singles intake | Usually bundled with SortSwift/Synq-style tools |

Gap: Square/Lightspeed pricing and scanner specifics not retrieved; do not quote numbers.

## 3. Pain points (secondhand; no direct Reddit access)

- Events lose money: an owner in ICv2 stopped "hemorrhaging" once entry fees covered prize and staff; TCGsync (a vendor) says many
  shops run FNM at a loss and suggests fee = prize pool plus some store credit.
- Wizards ties promo and prize allocation to live metrics (WPN, since 2024-03-01), so accurate headcount reporting matters.
- Start times: Wizards cites Reddit threads and market research that on-time start is why players pick a store; pre-reg is their
  fix. Generic event data: free events see 40-60% no-shows vs 10-20% for paid (Skift, not game-specific), supporting deposit or waitlist.
- Prices move constantly; manual singles repricing is called "impossible" (vendor blogs). Online and in-store stock must share one count.
- Each publisher has its own app, account and reporting deadline, so staff juggle 4-6 tools a week.
- Platform churn: Riftbound platform swap, Spicerack shutdown (unverified), BCP/Melee merger, Lorcana off Melee, BinderPOS closed to new customers.

## Sources (all checked 2026-10-26)
- https://wpn.wizards.com/en/news/definitive-guide-wizards-eventlink (2024-03-25)
- https://wpn.wizards.com/en/news/new-wizards-eventlink-enrollment-option-and-dnd-role-selection (2026-10-01)
- https://wpn.wizards.com/en/news/how-get-started-wizards-eventlink ; https://wpn.wizards.com/news/wizards-eventlink-update-log-june-2-2021
- https://wpn.wizards.com/en/news/3-tools-preregistration ; https://wpn.wizards.com/en/event/friday-night-magic-outlaws-of-thunder-junction
- https://pocketmonsters.net/news/4458 (Pokemon Event Manager replacing TOM); https://media.pocketmonsters.net/pdf/play-pokemon-tournament-rules-handbook-en-2025-01-01.pdf
- https://www.yugioh-card.com/en/products/neuron/
- https://dbs-cardgame.com/us-en/organized-play ; https://world.digimoncard.com/event/2025/store_tournament/03 ; https://onepiece.gg/store-tournament-2026-vol-3/
- https://www.disneylorcana.com/en-US/news/2025/06/2025-6-ravensburger-play-hub-live ; https://icv2.com/articles/news/view/54074/
- https://playriftbound.com/en-us/news/announcements/introducing-the-new-playriftboundcom ; https://uvsgames.com/riftbound-faq/
- https://help.melee.gg/docs/payment-update-release-timeline/ ; https://app.prod.melee.gg/Policy/Payments
- https://frontlinegaming.org/2026/02/19/best-coast-pairings-and-melee-gg-merge-galactic-events-studio-aims-to-level-up-tournament-tech/
- https://topdeck.gg/features/tournament-operations ; https://topdeck.gg/features/integrations
- https://spicerack.featurebase.app/changelog ; https://www.coolstuffinc.com/a/week-in-magic-friday-may-29th-05292026 (shutdown claim)
- https://binderpos.com/pricing ; https://seller.tcgplayer.com/blog/articles/unlocking-the-power-of-binderpos-understanding-the-fee-structure
- https://sortswift.com/compare/binderpos ; https://sortswift.com/compare/crystal-commerce ; https://sortswift.com/compare/tcgplayer-pro ; https://www.sortswift.com/pricing/bundles
- https://apps.shopify.com/kori-tcg-manager ; https://apps.shopify.com/synq-tcg-card-manager
- https://tcgsync.com/blog/how-to-run-friday-night-magic ; https://icv2.com/articles/news/view/33376/ ; https://meetings.skift.com/2025/11/26/no-shows-create-stress-wreak-havoc-on-events/
- https://afk.games/event/warhammer-40k-team-rtt/ and Warhammer World event packs (40k list/round conventions)
