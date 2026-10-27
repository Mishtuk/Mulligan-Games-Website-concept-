# Round 6: for the Desktop (port to src/)

Boss, 2026-10-27 (D48). Spec: `docs/review/round-6-visual.md`. The prototype is the reference; copy behaviour and
data, not prototype code. Every data value goes in with `textContent` / Astro `{}` escaping, never `set:html`.

1. **One photo per event, one map** (`src/lib/photos.js`, shared by the home page and later the event pages): port
   `MG.photoFor` / `MG.photosForDay` from `prototype/js/mg.js` as a constant map (game / format -> file + object-position,
   never from data, D20):
   magic `event-magic-night 50% 60%`, `event-full-room-2 50% 55%`, `play-room-night 50% 55%`; cedh `event-cedh-tables 50% 60%`,
   `event-full-room-3 50% 50%`; featured cEDH leads with `champion-belt 50% 42%`; pokemon `pokemon-sealed-shelf`;
   riftbound `event-packed-room 50% 55%`, `event-tables-fb 50% 60%`; warhammer `warhammer-table 50% 65%`,
   `warhammer-battle`; warhammer + format "Painting" `painted-marines 50% 45%`; other + "D&D" `dnd-table 50% 45%`,
   `dnd-one-shot-setup`; other `event-full-room 50% 55%`; One Piece `event-full-room-2` and Hololive `play-room-night`
   **tinted**; unknown game: `event-full-room` tinted. Rules: first photo of the list not used yet; a used-up list reuses
   its first; tinted picks are tracked apart from plain ones (`name:tint`). Today and the next day with events share one
   "used" map (no repeat between the two photo-card days); each one-line day starts fresh. Position must match
   `^\d{1,3}% \d{1,3}%$` or fall back to `50% 50%`.
2. **Photo band** on the home page's today and next-day cards only (not events page, Tonight block or admin):
   first child of `<article class="ev">`: `<figure class="ev-ph ph" aria-hidden="true" [data-tint]><img src="...-800.webp"
   width="800" height="600" alt="" loading="lazy" decoding="async" style="object-position:..."></figure>`; 3:1 on
   phones, 12:5 from 768px; the 3px game rule moves to the photo's foot; cancelled = grayscale 0.55; dark = brightness 0.9.
   CSS: `prototype/css/site.css` "round 6" blocks (`.ev-ph`, `.ph[data-tint]`, `.dl-ph`, `.dl-main`).
3. **Row thumbs** on later days: 48px (56px from 1024) square `<span class="dl-ph ph" aria-hidden="true">` before a
   `.dl-main` wrapper of time / title / bits; the dot stays in the markup for print. "Further out" stays text.
4. **Strip caps** from 768px (`.dc-ph`, `prototype/css/front.css`): the day's main event (featured > sign-up here or
   external > earliest), its card photo unless another tile already shows that file, then the next photo of its list.
   Hidden under 768px (lazy images in `display:none` are not fetched). Closed days: no photo.
5. **Clips from the shop** (replaces "Inside the shop"; heading "This week" replaces "This week at Mulligan"):
   - Data: `src/content/store.json` -> `clips`, copied from `prototype/data/sample.js` `clips` (9 items, order as there):
     `{ platform, id, url, caption, credit, date, poster, pw, ph, pos }`, optional `inline: true` for an Instagram reel
     that plays in the embed. Item 3's credit is **"by @perky_grn_fairy"** (the reel's own header; research said
     @vespur, corrected D48). No dates shown on cards.
   - Validation at build and in the client (drop the item if it fails; hide the section under 3 valid items):
     TikTok id `^\d{15,21}$`, Instagram `^[A-Za-z0-9_-]{5,20}$`, Facebook `^\d{5,25}$`; `url` must parse, be
     `https:` and its host must equal the platform's (`www.tiktok.com` / `www.instagram.com` / `www.facebook.com`);
     `poster` `^(media|img)/social/[\w.\-]+$`. URLs are built only with `new URL()` from a validated id
     (`prototype/js/clips.js` `valid` / `embedUrl`).
   - Card: one `<a class="clip-a" href=url target=_blank rel=noopener>` per clip (works with no JS): 9:16 poster (164px
     phones, 192px from 768px), platform badge, play disc, caption (2 lines), credit line when set; row scrolls sideways;
     prev/next buttons from 1024px. Markup and CSS: `prototype/index.html` `#clips`, `prototype/css/clips.css`.
   - Click (TikTok, Facebook, and Instagram only with `inline: true`): one modal `<dialog class="dlg dlg-clip">` built with
     createElement; heading = caption; the iframe is created **after** `showModal()`: TikTok
     `https://www.tiktok.com/player/v1/{id}?autoplay=1&loop=0&music_info=0&description=0&rel=0&native_context_menu=0&closed_caption=1`,
     Instagram `https://www.instagram.com/reel/{id}/embed/`, Facebook `plugins/video.php?href=...`; `allow="autoplay;
     encrypted-media; fullscreen; picture-in-picture"`, `referrerpolicy="strict-origin-when-cross-origin"`, no sandbox.
     Footer link "Open on TikTok". Close (X, Esc, backdrop) removes the iframe and returns focus to the card; opening
     the next card before the late `close` event runs finishes the old dialog first. 8 s without `load` shows "The video
     didn't load." Dialog `width: fit-content`; frame `min(100vw - 3rem, (100svh - 10rem) * 9/16, 26rem)`.
   - **Instagram cards are plain links** (no dialog): IG's embed will not play reels with licensed music (both picks)
     and only shows a still with "Watch on Instagram". Their hidden label reads "Watch on Instagram: ...".
   - Hero strip: "Watch clips from the shop" link to `#clips` from 768px.
6. **CSP** (`server.js` `csp()`): add `"frame-src https://www.tiktok.com https://www.instagram.com https://www.facebook.com"`.
   Nothing else: posters are `'self'`, no third-party script, no oEmbed fetch, no preconnect. Keep `autoplay` and
   `fullscreen` out of `Permissions-Policy`. The inline `--poster: url(...)` needs the existing `style-src 'unsafe-inline'`.
7. **Privacy page** (`src/pages/privacy.astro`), one sentence: "Videos load from TikTok, Instagram or Facebook only
   when you press play; those sites may set their own cookies." The same line sits under the clips row.
8. **Files to copy** to `public/` (same paths): `img/social/` both sizes of `event-magic-night`, `event-full-room-2`,
   `play-room-night`, `event-cedh-tables`, `event-full-room-3`, `champion-belt`, `pokemon-sealed-shelf`,
   `event-packed-room`, `event-tables-fb`, `warhammer-table`, `warhammer-battle`, `painted-marines`, `dnd-table`,
   `dnd-one-shot-setup` (28 files; `event-full-room`, `shop-floor-cases`, `singles-case-lit` are already there), and
   `media/social/` the 5 posters `tt-7456651666096704814`, `tt-7554825277990259981`, `tt-7561535591314115895`,
   `tt-7467024512442289451`, `ig-DTHcsxqjNDL` (.webp, 240x427). The page uses only the `-800` files.
9. **Checks after the port**: home at 390 and 1280: no request to tiktok/instagram/facebook (or any other host) before a
   click; no iframe in the DOM; thumbs, clip posters and strip caps load only on scroll; one click = one iframe; Esc
   removes it. Port `prototype/js/tests-clips.js` and the round-6 tests in `tests-front.js`.
10. **Not blocking, later**: a `-320.webp` per photo for thumbs and strip caps (now 50-95 KB `-800` files at 48-56px);
    make the event detail picture (`V.detailPic`) read the same map; owner poster stills for the 4 store-photo posters
    and a better IG frame (Q21); confirm with the owner that crediting @perky_grn_fairy is wanted.
