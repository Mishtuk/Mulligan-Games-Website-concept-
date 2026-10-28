# Wix templates, the Desktop's pass (round 8 redesign, owner asked both machines)

Checked 2026-10-27 in Chrome on https://www.wix.com/website/templates. The Laptop's pass
(`docs/research/wix-templates.md`) covered gaming and venue templates (comedy club, arcades, gaming forum/store); this
pass looks at the **closest shop relatives (comic and toy stores)** and at **local hangouts that sell "come in and stay"
(bar, cafe) plus an events-lineup template**, to avoid repeating it. Method: open each live demo, read its nav, its
section headings in order, the hero (video or not), and the fonts (computed styles). The demos block scripted scrolling,
so the screenshots are of the first screen only; the section orders below come from the page structure.

## Top takeaways
1. **Every shop template uses the same calm order:** hero, then "what we have" by category, then a featured row, then
   a short promise row, then reviews, then visit / join. Mulligan already has most of these; the gap is a **promise row**
   ("why players choose us") and a **"play by game"** entry point.
2. **The best hero match is a bar, not a game store:** "The Gilded Finch" (Bar, Friendly) is a full-bleed video of
   someone at work, white text bottom-left, one plain button, and one small quiet line top-right ("Your neighborhood spot
   for every kind of night"). That is exactly our montage hero; keep ours, borrow the **one-button** discipline.
3. **Local-shop copy beats e-commerce copy:** the comic store "Ben's Comics" opens with **the owner's story** ("The Man
   Behind the Comics") and ends with **"Visit the Store"** (address + opening hours as its own section). That fits a
   card shop people walk into far better than the bestseller / shipping blocks of online stores.
4. **Event language that reads warm:** "There's always something on" (bar) and "Secure your spot" (festival) are better
   section names than "Events" / "Sign up". The festival's **lineup of a few big cards** is how to show this week's
   headline events above the full list.
5. **Skip:** moving marquees (reduced motion, and they "blast"), handwritten display fonts, product grids, shipping /
   returns promises, newsletter pop-ups.

## The 7 templates
| # | Template (Wix id) / demo | Category | Hero | Nav | Home sections in order | Type | Borrow / skip |
|---|---|---|---|---|---|---|---|
| 1 | **Comics Store (Retro)**, wh-1359, https://www.wix.com/demone2/bens-comics | Store | Outline comic display title | Shop · About · Contact | The Man Behind the Comics → Explore the Shelves → Featured Collection → Editor's Pick → This Week Only → **Visit the Store** (Address, Opening Hours) | CC Biff Bam Boom outline + Neue Haas Grotesk | **Borrow:** owner-story block near the top ("Meet John and Mike", both named in Google reviews); a "This week only" block for the weekly deal; Visit as its own section with hours. Skip the comic font. |
| 2 | **Comics Store (Fun)**, wh-1381, https://www.wix.com/demone2/kays-comics | Store | **Video hero**, condensed caps headline | Home · About · Shop · Contact · Cart | Explore Our Universes (categories) → What's Flying Off the Shelves → Stack More, Spend Less → **Built for Serious Comic Fans** (4 promises) → Happy Readers → Join the League | Tusker Grotesk condensed + Oktah Round | **Borrow:** the 4-promise row, rewritten from our Google reviews: "Huge singles selection · Friendly, knowledgeable staff · Fair trade-in rates · A big play room"; "Explore our universes" → "Play by game" tiles. Skip shipping/returns. |
| 3 | **Comics Store (Vintage)**, wh-1330, https://www.wix.com/demone2/inkwell-legends | Store | Giant red condensed headline on yellow, burst texture, serif sub-line; scrolling marquee strip on top | Home · The Vault · Dispatch · Shop | Trending Issues → Explore the Ages → The Collector's Circle → Our Archival Standard → Instagram → Fresh Off Press | Murs Gothic (238px) + Arial | **Borrow:** shop-flavoured nav words only if they stay clear (we keep plain words). **Skip:** the marquee and the shouting headline (too loud for the owner's "calm"). |
| 4 | **Toy Store (Retro)**, wh-1131, https://www.wix.com/demone2/wh-mochi-and-oak | Store | Huge rounded wordmark | Shop All · About · Contact · FAQ | **Shop by Age** → Bestsellers → **Why Parents Choose Us?** → The Collections → What Parents Are Saying → Join the Family | VAG Rounded | **Borrow:** "Shop by age" → "**New here? Start here**" picks by experience (Learn to Play Pokemon, Commander nights, Draft) and a FAQ link in the nav (we have New here?). |
| 5 | **Bar (Friendly)**, wh-1463, https://www.wix.com/demone2/the-gilded-finch-1 | Restaurants & Food | **Full-bleed video** (bartender pouring), white text bottom-left, **one** button, a small yellow pill top-right with one rolling line | Menu · Contact (two boxed buttons) | Hero → **More Than a Bar, We're Your Second Home** → A Taste of What's Shaking → **There's Always Something On** | Mansalva (handwritten) + Neue Haas Unica | **Borrow:** "your second home" idea in the intro line; "There's always something on" as the This week heading or sub-line; the one-button hero. **Skip:** handwritten font, moving pill. |
| 6 | **Cafe (Grunge)**, wh-1378, https://www.wix.com/demone2/asphalt-bloom-cafe | Restaurants & Food | Plain photo, small Helvetica headline "Coffee with Character" | Home · Our Story · Menu · Contact | Hero → More Than a Cafe, It's a Mindset → Signature Creations → **Find Your Corner** (visit) → From the Street (Instagram) | Helvetica + **IBM Plex Mono** body | **Borrow:** a monospaced face for **times and prices only** (schedule feel, aligns columns); "Find your table" as the Visit heading. |
| 7 | **Music Festival (Dramatic)**, wh-1240, https://www.wix.com/demone2/cinderwave-sonora | Events | Huge wide display title | **Lineup · The Experience · Tickets** (3 links) | Hero → Feel the Pulse → **Harbingers of the Soundwave** (4 big artist cards = lineup) → A Canvas of Sand and Stars → Echoes (reviews) → **Secure Your Spot** | Benzin (wide) | **Borrow:** a "lineup" of 3-4 big cards for this week's headline events (cEDH, prerelease, RCQ) above the plain list; "Save your seat" wording on sign-up events. Skip the wide display face. |

## What this means for Mulligan's front page (proposal for the round-8 spec)
Order (events still lead, D1; one photo or video per section, calm):
1. **Hero:** our montage video (D54), "Shuffle up. Everyone's welcome." + the Welcome sub-line, status chip, **one**
   primary button ("See this week") and the Watch-a-clip link. Nothing moving besides the video.
2. **This week**, headed with "There's always something on": a **lineup of 2-3 big cards** for the week's headline
   events, then the compact day list.
3. **Play by game:** 7 small tiles (Magic, cEDH, Pokemon, One Piece, Riftbound, Hololive, Warhammer), each to its filter.
4. **Why players choose Mulligan:** 4 promises from the Google reviews (singles selection, friendly staff, fair
   trade-ins, big play room), small icons, one line each.
5. **Meet the shop:** a short owner story (who runs it, since Oct 2022, moved to 445 York Rd in Sept 2024) with one photo
   (needs the owners' words; Q to add).
6. **What people say:** the 3 five-star quotes (D39).
7. **Find your table (Visit):** address, hours, parking, directions, one photo.
8. **Join in:** Discord + socials + clips.
Type: keep our condensed display + body (they match the comic/arcade templates); add a mono only for times/prices if the
designer agrees.

## Owner question this raises
- **Q31 (proposed):** a short "Meet the shop" story in the owners' own words (who you are, why you opened, what you want
  the shop to be) plus a photo of the owners; the comic-store templates open with exactly this.
