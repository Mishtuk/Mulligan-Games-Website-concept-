# Mulligan Games: social videos for the home page (pick list, embeds, posters)

Collected 2026-10-27 by the Researcher, read-only in the owner's Chrome (no likes, follows, clicks). Owner OK to use the
store's own social media: D27. No video was downloaded or ripped; the site shows official embeds behind a click-to-load poster.

## Top takeaways
1. **9 picks below: 6 TikTok, 2 Instagram reels** (plus Facebook not checked, see Gaps). Only 5 have a usable poster so far
   (frames from the earlier round's contact sheets, 240x427 WebP, 6-20 KB). The other 4 should use a store photo as poster.
2. **TikTok's oEmbed no longer returns a thumbnail or title** (2026-10-27: JSON has only the iframe html, no
   `thumbnail_url`). The profile page's cover URLs are signed and blocked when fetched outside the browser, and the page
   would not let us save them. So posters come from the owner's own clip frames or store photos. Ask the owners (Q21)
   for 9 poster stills; that is the clean fix.
3. TikTok has 54 videos on the profile (31 "Make it or break it" episodes, graded-card close-ups, 2 room clips). The best
   room content is old (Jan and Feb 2025); the newest videos (Aug and Sep 2026) are Pokemon graded-card clips. Use the
   room clips for the cEDH section and the newer slab clips for "From the shop".
4. TikTok dates below are decoded from the video id (UTC, exact). Instagram dates are not shown on the reels grid; marked ~.
5. No poster shows a minor: posters are hands/cards/tables, adults only. Clip 1 shows adult players at the table (as
   already posted by the store).

## Pick list
| # | Platform | URL | Id | Date | Caption (short) | What it shows | Poster file (prototype/media/social/) | Suggested place |
|---|---|---|---|---|---|---|---|---|
| 1 | TikTok | https://www.tiktok.com/@mulligangames/video/7456651666096704814 | 7456651666096704814 | 2025-01-09 | "What an amazing turn out this month." | Monthly cEDH night: full tables of adults playing | tt-7456651666096704814.webp | hero option, cEDH section |
| 2 | TikTok | https://www.tiktok.com/@mulligangames/video/7467024512442289451 | 7467024512442289451 | 2025-02-03 | "February's event. Monthly event got hot prizes" | cEDH tables close-up play, prizes (hands only) | tt-7467024512442289451.webp | cEDH section |
| 3 | Instagram | https://www.instagram.com/reel/DTHcsxqjNDL/ | DTHcsxqjNDL | ~2026-01 (newest reel) | by @perky_grn_fairy (collab; the reel header shows perky_grn_fairy, D42; research first said @vespur): "Still in shock from actually winning today's @mulligangames tournament... Love the cEDH community" | Tournament win: group at the tables, standings, shop welcome banner | ig-DTHcsxqjNDL.webp (banner frame) | This week / cEDH section |
| 4 | TikTok | https://www.tiktok.com/@mulligangames/video/7689650786942323998 | 7689650786942323998 | 2026-09-26 | "who out here like pop 1s? #pokemon #psa #lowpop" | Graded Pokemon slab | none: use public/img/social/pokemon-sealed-shelf-800.webp | From the shop |
| 5 | TikTok | https://www.tiktok.com/@mulligangames/video/7671778087264144653 | 7671778087264144653 | 2026-08-08 | "Only at Mulligan Games #pokemon" | Shop Pokemon find (newest in-store clip) | none: use shop-floor-cases-800.webp | From the shop / hero option |
| 6 | TikTok | https://www.tiktok.com/@mulligangames/video/7554825277990259981 | 7554825277990259981 | 2025-09-27 | "It's only at our LGS that you'll find it!" | PSA 10 Japanese Mewtwo EX slab in the display case | tt-7554825277990259981.webp (note: poster frame has no overlay text) | From the shop |
| 7 | TikTok | https://www.tiktok.com/@mulligangames/video/7561535591314115895 | 7561535591314115895 | 2025-10-15 | "Simply the best stuff in shop. Pristine base set hanger." | Sealed base set Charizard blister in the shop | tt-7561535591314115895.webp | From the shop |
| 8 | TikTok | https://www.tiktok.com/@mulligangames/video/7459197351555681582 | 7459197351555681582 | 2025-01-13 | "Make it or break it 30" | Fun series: episode 30 (31 episodes in all) | none: use singles-case-lit-800.webp | From the shop (the fun one) |
| 9 | Instagram | https://www.instagram.com/reel/DPcDJ7riL3B/ | DPcDJ7riL3B | ~2025-10 | "Awesome art done by @perky_grn_fairy #mtg #cedh #psa10" | Commander card art plus a PSA 10 (artist credited in caption) | none: use event-cedh-tables-800.webp | cEDH section |

Reserves (TikTok): 7557910069199916343 (2025-10-06, "Multiverse giftbox opening"), 7541155305963441421 (2025-08-21, "the only CGC 10
pristine of this awesome Reshiram SIR"), 7557759637194378510 (2025-10-05, new commander art). Other reels: DPNJplNDI7c,
DPHba4_D_HY, DNoeL5SP0ta, DHJsZJKyU_n (all graded-card clips); DLkn4jaTjiP is a guest's schedule post (skip).
Reel DTHcsxqjNDL and the art clips are posted by or credit other people: keep the credit line "by @perky_grn_fairy" visible (corrected D42) and ask the owner.

Placement idea: hero = still photo `shop-floor-cases` with a "Watch the room" play button opening #1 (video in the hero
hurts load and the boss disliked soft portrait posters); "From the shop" row = #4 to #8 (vertical 9:16 cards, 3 visible,
scroll); cEDH section = #1, #2, #9 plus #3.

## Official embed patterns (all need a click-to-load poster first, so nothing loads before the click)
- **TikTok:** `https://www.tiktok.com/player/v1/<id>?autoplay=1&muted=1` (this is what TikTok's oEmbed returns in its iframe) or
  `https://www.tiktok.com/embed/v2/<id>`. Iframe 325x578, `allow="autoplay; fullscreen; picture-in-picture"`, `loading="lazy"`.
- **Instagram:** `https://www.instagram.com/reel/<code>/embed` (iframe, about 400x480+; add `/captioned` to show the caption).
- **Facebook:** `https://www.facebook.com/plugins/video.php?href=<url-encoded video URL>&show_text=false&width=560`.
- Always keep a plain "Watch on TikTok / Instagram" link under each poster (works with no JS, no tracking).

## CSP the real build needs (only added when the visitor clicks)
- `frame-src https://www.tiktok.com https://www.instagram.com https://www.facebook.com`
- `img-src` and `script-src`: nothing extra if only iframes are used (the Instagram `embed.js` script is not needed).
- The iframes set cookies and send the visitor's data to the platform: mention in the privacy note and load only after the click.
- Posters are self-hosted (`/media/social/`), so no third-party image domain is needed (`*.tiktokcdn.com`, `*.cdninstagram.com` not needed).

## Gaps
- **Facebook videos not checked** this round (the brief said skip if blocked; I did not try). Round 1 (`store-videos.md`)
  has two local FB clips: ids 1273030047026539 and 2878095335734610 (frames in `source/social/vframes/`).
- 4 posters missing (picks 4, 5, 8, 9); IG reel dates are approximate; the 5 existing posters are low-res (240 px wide), fine
  for cards up to about 240 CSS px. Owner should send poster stills (Q21).
