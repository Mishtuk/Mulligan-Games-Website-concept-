# Questions for the owners (via Mish)

Only the store owners or Mish can answer these. Mish relays them; we do not contact the store ourselves. When answered,
write the answer and date under the question and, if it changes a ruling, add an entry to `DECISIONS.md`.
"Blocks" says which task waits on it. Started 2026-10-26.

## Store facts (block P3.1 content and any public deploy)
1. **Address: settled, 445 York Rd** (Facebook About page, 2026-10-26; the Wizards locator's "455" is a typo the owners may want fixed there). Only confirm it if anything changed.
   Whichever it is, should the other listings be corrected?
2. **Hours:** are Wed-Thu 2-10 PM, Fri-Sat 2 PM-midnight, Sun 1-10 PM, closed Mon-Tue still right? (Google Maps shows the same, 2026-10-27.) Any holiday closures
   coming up?
3. **Contact and links:** is mulligangames455@gmail.com the public email? Which Discord invite is current
   (discord.gg/YJAW4aTwaZ or discord.gg/uVbJ5frYRY)? Instagram handle? Is Spicerack still used? Is the TCGplayer seller
   "Mulligan Gaming LLC" yours?

## How the store runs (block P2.4-P2.6 scope)
4. **Which POS / inventory system do you use today** (Square, Shopify + BinderPOS, SortSwift, other, paper)? Does it
   track store credit and preorders already? Can it export a product list (CSV)? We don't want to duplicate it.
5. **Warhammer 40k / Age of Sigmar / Kill Team:** do you run leagues or events? If so, on which app (Best Coast Pairings,
   Tabletop Admiral, none)?
6. **Prize support and store credit:** how are prizes paid today (packs, store credit, both)? Who keeps the record?
7. **Discord:** should the site post the weekly schedule to a Discord channel automatically (later feature)? Which server
   and channel?
8. **Pre-registration:** which events should take sign-ups on the site (only capped ones like Draft and Pauper, or all)?
   Any no-show rule (e.g. waitlist after 10 minutes late)? The site can show "Arrive by" per event: should seats be held
   until the start time, or 5, 10, 15 or 30 minutes before? Until you say, events show no arrive-by time.
9. **Publisher programs:** besides Wizards (WPN), are you enrolled in Play! Pokemon, Konami OTS, Bandai, Ravensburger Play
   Hub or Riftbound? This decides which official-tool links the event form offers.
10. **Staff logins:** how many people need admin access? Should staff (not owners) be able to see inventory counts or
    only check people in?

## Permission and money (Mish decides; block publishing)
11. **Online entry payment:** yes or no? If yes, which provider (Square, Stripe, PayPal, TopDeck/Melee payments)?
12. **Logo and photos:** may we use the store logo and Facebook photos in the concept shown to the owners, and later on
    the public site? Real photos of the tables/room would help.
13. **Showing the concept:** how should the owners see Phase 1 (on Mish's laptop, a zip, or a private GitHub Pages
    preview)? A preview link publishes it.
14. **Hosting and domain** (Phase 3, costs money): any preference or budget? Not needed until the build is done.

## Weekly schedule details (from the design pass, 2026-10-26; block P3.1 content)
15. **Entry fees for the weekly nights** not on any flyer or listing: Hololive (Thu), One Piece (Thu), Nexus Nights
    (Fri), Pokemon (Sat), cEDH weekly (Sun), and the Championship Series, 5K and Redemption entries. The concept uses
    guesses marked in `prototype/data/sample.js`.
16. **Sunday opening:** public listings say Sunday opens at 1 PM, but the 1st-Sunday cEDH starts at 10 AM. Do you open
    early that day (the concept shows it as a one-day override)?
17. **Wizards locator vs your flyer:** the locator still lists Magic Academy (Thu 7 PM, Sun 4 PM) and Commander/EDH open
    play blocks; your April flyer doesn't. Does Magic Academy still run? Which seat limits are current (Pauper 28, FNM 28,
    Saturday draft 16)?

## From the feature research (2026-10-26; `docs/research/feature-ideas.md`)
18. **Google Business Profile:** do you manage the store's Google listing yourselves, and would you post events there?
    (The site will give you copy-ready event text; we never edit your listings.) Blocks: nothing; shapes P3.1's listing check.
19. **Other games:** players in Bucks County ask for Lorcana, Flesh and Blood, Star Wars Unlimited and D&D. Do you sell or
    run any of them, or plan to? Decides which game chips are switched on (D14).
20. **"New here?" page:** kids / age rule, loaner or precon decks to borrow, house rules or code of conduct, and which
    trade-ins you buy (and when to bring them). Blocks the page's text in P2.3 / P3.1.

## Front-page video (2026-10-26; `docs/research/store-videos.md`)
21. **A short shop video:** the site can open with a 10-15 second muted loop of the shop and tables. Your posted videos are
    mostly close-ups of graded cards, so could you send 2-3 original clips (phone files, not reposts) of the room, the
    tables on a busy night and the shelves, ideally with no faces? We clean them up and upscale them for the site. Clips
    with customers (e.g. the Jan 2026 cEDH reel, a collab with a customer) need their OK too. Until then the site shows a photo.
    **Round 3 (D36):** the hero now fills the whole screen width, so please film them **sideways (landscape), 1080p or
    better**. The current loop is a 540 px wide phone reel and looks soft on a laptop or TV.

## Sign-ups (2026-10-27; D30)
22. **How long to keep sign-up contact details (D30, owner-confirmable):** we picked 30 days after the event, then email,
    phone and player ID are deleted and the name shrinks to initials (counts and no-show totals stay); backups hold them up
    to 7 more days. Longer helps if you call people about a lost item or a result fix; shorter is kinder. Keep 30, or say
    a number. Blocks nothing; it is one setting (`RETENTION_DAYS`) and the privacy page follows it.

## Reviews and found facts (2026-10-27; `docs/research/social-assets-2.md`)
23. **Google review quotes:** the store has 4.9 stars from 81 Google reviews. OK to show "4.9 on Google, 81 reviews" plus
    3 short quotes (first name + initial, linked to Google) on the front page? The research doc has a shortlist of 6.
24. **Store T-shirt:** is it for sale? If yes, one line in the Shop section.
