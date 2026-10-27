# Round 6: a visual "This week" and a social video row (designer spec, 2026-10-27)

**Owner (Mish, 2026-10-27):** "This Week at Mulligan" should look more visually appealing, "not just plain text...
images, more visual cues"; "maybe just don't put This Week at Mulligan, but put like videos from TikTok"; "for the
homepage, you can use like videos from TikTok, Instagram, and Facebook."
**Ruling to design within (main session):** events still lead the home page (BRIEF, D1). "This week" becomes visual;
the home page gains a social video row. Videos are official embeds behind click-to-load posters, nothing downloaded.

Inputs read: BRIEF, D1, D27, D28, D36-D40, DESIGN 2.5 / 5.3-5.6 / 6 (rounds 3-5), `social-assets-2.md`.
Shots (current prototype, Fri 6:50 PM demo): `scratchpad/shots-r6/` w1/w2 at 1280, p1/p2 at 390, plus the two
references (riv-1280, vfw-1280) and a contact sheet of all 33 store photos.

## What the shots show
- At 1280 the week is a wall of words from y≈1300 to y≈3000: four photo-less cards, then 13 underlined one-line rows.
  Nothing tells a Warhammer night from a Pokemon night except a 10px dot. At 390 it is the same over ~3,500px.
- VFW "What's going on": every event carries one photo, framed, same ratio, the text beside or below it. That is
  the cue the owner means. Riverside "Latest message": video posters in an even row, a round play button, date +
  title under the poster, never over it. Both stay calm because there is **one image per item, one ratio per row**.
- The store has a real photo for most games (contact sheet): Magic and cEDH nights, the Riftbound qualifier
  (packed room), Warhammer boards, painted marines, D&D at the tables, the Pokemon sealed wall. One Piece and
  Hololive have none.

---

## 1. Visual "This week"

### 1.1 Heading: "This week" (was "This week at Mulligan")
**Decision:** the h2 becomes **"This week"**, same id `week-h`, same "All events and sign-ups" link and walk-in note.
**Why (one line):** it matches the nav link and the anchor, drops the wordy "at Mulligan" the owner disliked, and keeps
a real heading for screen readers and scanning (the strip alone can't be a heading; it is a list of links).

### 1.2 One photo per event: the map (single source, `MG.photoFor`)
Every event date gets exactly one decorative photo, picked in this order:
1. `series.photo` (future admin field, P2.x; not in the data yet, so skip in this round);
2. a **format override** (table below);
3. the **game list**, taking the first photo **not already used that day** (so Wednesday's two Magic rows, or
   Friday's two Magic cards, never show the same picture); if the list is used up, reuse its first photo.

| Game / format | Photos, in order (all in `img/social/`) | object-position | Treatment |
|---|---|---|---|
| Magic (all formats) | `event-magic-night`, `event-full-room-2`, `play-room-night` | 50% 60%, 50% 55%, 50% 55% | plain |
| cEDH | `event-cedh-tables`, `event-full-room-3` | 50% 60%, 50% 50% | plain |
| cEDH, `featured` (Championship, 5K, Redemption) | `champion-belt` first, then the cEDH list | 50% 42% | plain |
| Pokemon | `pokemon-sealed-shelf` | 50% 50% | plain |
| Riftbound | `event-packed-room`, `event-tables-fb` (the Riftbound qualifier weekend) | 50% 55%, 50% 60% | plain |
| Warhammer | `warhammer-table`, `warhammer-battle` | 50% 65%, 50% 50% | plain |
| Warhammer, format "Painting" | `painted-marines` | 50% 45% | plain |
| Other, format "D&D" | `dnd-table`, `dnd-one-shot-setup` | 50% 45%, 50% 50% | plain |
| Other (trade night, board games, charity, anything else) | `event-full-room` | 50% 55% | plain |
| One Piece | `event-full-room-2` | 50% 55% | **game tint** |
| Hololive | `play-room-night` | 50% 55% | **game tint** |
| Unknown game id | `event-full-room` | 50% 55% | game tint with `--g-other` |

**Game tint** (honest stand-in until the store has a photo of that game's night; it reads as "our play room, in the
game's colour", never as product art):
```css
.ph[data-tint] { background: var(--gc); }
.ph[data-tint] img { filter: grayscale(1) contrast(1.1); mix-blend-mode: multiply; opacity: 0.9; }
```
All photos are **decoration** (`alt=""`, wrapper `aria-hidden="true"`): the same picture repeats across events, and
the card text already says the game. No text, badge or chip sits on these photos (D37 "say things once").

### 1.3 Today and tomorrow: photo-topped cards (VFW pattern)
The cards for today and the next day with events (the existing full-card days, R5) get a photo band on top. Nothing
else in the card changes: name bar, type line, time + tags, prize, action + **seat stat box stay exactly as now**.

```
┌──────────────────────────────┐
│▓▓▓▓▓▓▓▓ photo band ▓▓▓▓▓▓▓▓▓▓│  3:1 on phones, 12:5 from 768px; object-fit: cover
├━━━━━━━━ 3px game rule ━━━━━━━┤  the rule moves from the bar's top to the photo's bottom edge
│ Draft FNM                $20 │
│ ⬠ Magic ◆ Draft, newest set  │
│ ◷ 7 PM to 11 PM              │
│ Prize packs paid by record.  │
│ [Join the waitlist]  [⧗ Full]│
└──────────────────────────────┘
```
```css
.ev-ph { position: relative; margin: 0; aspect-ratio: 3 / 1; overflow: hidden; background: var(--surface-2);
         border-bottom: 3px solid var(--gc); }
.ev-ph img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ev:has(> .ev-ph) .ev-bar { border-top: 0; padding-top: 0.6rem; }
@media (min-width: 768px) { .ev-ph { aspect-ratio: 12 / 5; } }
.ev[data-state="cancelled"] .ev-ph img { filter: grayscale(1); opacity: 0.55; }
.ev[data-state="cancelled"] .ev-ph[data-tint] img { opacity: 0.4; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .ev-ph img { filter: brightness(0.9); } }
:root:has(> head > meta[name="color-scheme"][content="dark"]) .ev-ph img { filter: brightness(0.9); }
```
(Write the dark rule the way the prototype already keys dark, via the `color-scheme` meta; one rule is enough.)
Sizes: at 390 the band is 358x119; at 1280 a grid card is ~468 wide, band 468x195. Markup, first child of
`<article class="ev">`:
```html
<figure class="ev-ph ph" aria-hidden="true"[ data-tint]>
  <img src="img/social/event-magic-night-800.webp" width="800" height="600" alt="" loading="lazy" decoding="async"
       style="object-position:50% 60%">
</figure>
```
Only the `-800` file, no `srcset` (decorative 3:1 / 12:5 band; 800w covers 468 CSS px at 1.7x, and the 1600w files
are 160-290 KB each). `MG.eventCard(occ, now, opts)` gets `opts.photo = { src, pos, tint }`; the front page passes it
only for the full-card days. The events page, its Tonight block and the admin do **not** get photos this round.
The object-position comes from the constant map, never from data (D20).

### 1.4 Later days: a small square photo on each one-line row
Rows keep their words (time, linked title, game · fee · seat words). The game **dot is replaced by a thumb**:
```
[▓▓] 10 AM  Championship Series            ← 48px thumb (56px from 1024), 10px corners, 3px game rule at its foot
[▓▓] cEDH · $60 · Sign up on TopDeck
```
```css
.day-line { display: grid; grid-template-columns: 3rem minmax(0, 1fr); align-items: center; column-gap: var(--s3);
            padding-block: 0.5rem; min-height: 4rem; }
.dl-ph { width: 3rem; height: 3rem; border-radius: 10px; overflow: hidden; background: var(--surface-2);
         border-bottom: 3px solid var(--gc); }
.dl-ph img { width: 100%; height: 100%; object-fit: cover; }
.dl-main { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.1rem 0.6rem; min-width: 0; }
.day-line .dl-dot { display: none; }  /* kept in the markup for print */
@media (max-width: 1023px) { .dl-bits { flex-basis: 100%; padding-left: 0; } }
@media (min-width: 1024px) { .day-line { grid-template-columns: 3.5rem minmax(0, 1fr); } .dl-ph { width: 3.5rem; height: 3.5rem; } }
.day-line[data-state="cancelled"] .dl-ph img { filter: grayscale(1); opacity: 0.55; }
@media print { .dl-ph { display: none; } .day-line .dl-dot { display: block; } }
```
`V.compactLine` builds `<span class="dl-ph ph" aria-hidden="true"[ data-tint]><img ... -800.webp width=800 height=600
alt="" loading=lazy decoding=async></span>` then wraps time, title and bits in `<span class="dl-main">` (createElement
only). Rows in "Further out" stay text: it is a date list and the photo count stays bounded (about 5 bands + 13 thumbs,
about 11 distinct files, all lazy).

### 1.5 The week strip: a photo cap on each open day, from 768px
Each open tile gets a short photo of the day's **main event** (first match: `featured`, then sign-up here or external,
then earliest start; game chip ignored, like the counts). Phones keep today's fitted tiles with dots only: a 50px-wide
tile is too small for a picture to read.
```css
@media (min-width: 768px) {
  .wdeck .daycard { height: 7.5rem; padding: 0 0 0.45rem; overflow: hidden; align-content: start; }
  .dc-ph { display: block; height: 2.5rem; margin-bottom: 0.35rem; background: var(--surface-2); border-bottom: 2px solid var(--gc); }
  .dc-ph img { width: 100%; height: 100%; object-fit: cover; }
  .wdeck li[data-closed] .daycard { align-content: center; }   /* closed: no photo, dashed, same height */
}
@media (max-width: 767px) { .dc-ph { display: none; } }
```
`<span class="dc-ph ph" aria-hidden="true"><img ... loading="lazy" alt=""></span>` goes first inside `.daycard`; the
tile's aria-label is unchanged. Same files as the cards (cached), so the strip adds no new downloads.

### 1.6 Calm checks (D36 / D37)
One image per item; one ratio per row (bands 3:1 or 12:5, thumbs 1:1, caps fixed height); no collage, no hover zoom,
no captions over these photos; seat state, fee and time read exactly as before; game colour still appears only as
thin rules (now under the photos). Phone length: about +500px for the This-week bands and thumbs, offset by removing
"Inside the shop" (section 2.1).

---

## 2. Social video row: "Clips from the shop"

### 2.1 Placement
Order: hero > **This week** (with Further out) > **Clips from the shop** > cEDH band > New and preorders > Visit >
Between events. The row **replaces "Inside the shop"** (same `--surface` band and borders, so the D37 band rhythm is
unchanged): the shop photos now live in This week and the clips show the room better than four stills. The
`interior-welcome-banner`, `singles-case-lit` and `shop-corgi` files stay in the repo (detail dialog, empty state).
Section id `clips`; not added to the five-link nav (D36). Name: **"Clips from the shop"**, sub "Short videos from our
TikTok and Instagram." ("and Facebook" once a Facebook clip is listed). Right side of the head: "Follow on TikTok" link (`.more`, external icon, opens TikTok).

### 2.2 Data (from `docs/research/social-videos.md`: 9 picks, 6 TikTok + 3 Instagram reels, no Facebook yet)
`store.clips` in `data/sample.js` (build: `src/content/store.json`), in this display order (room and event clips
first, the five real video frames lead so the first screen of the row is all real frames):
| # | Research pick | Platform | Caption on the card (plain words) | Credit line | Poster | object-position |
|---|---|---|---|---|---|---|
| 1 | 1 | TikTok | A full room for the monthly cEDH | | `media/social/tt-7456651666096704814.webp` | 50% 50% |
| 2 | 6 | TikTok | A PSA 10 Japanese Mewtwo EX, in the case | | `media/social/tt-7554825277990259981.webp` | 50% 50% |
| 3 | 3 | Instagram | Winning a Mulligan cEDH tournament | by @vespur | `media/social/ig-DTHcsxqjNDL.webp` | 50% 50% |
| 4 | 7 | TikTok | A sealed base set Charizard hanger | | `media/social/tt-7561535591314115895.webp` | 50% 50% |
| 5 | 2 | TikTok | February's cEDH night and its prizes | | `media/social/tt-7467024512442289451.webp` | 50% 50% |
| 6 | 5 | TikTok | Only at Mulligan Games: a Pokemon find | | `img/social/shop-floor-cases-800.webp` (store photo) | 62% 50% |
| 7 | 4 | TikTok | Pop 1 graded Pokemon cards | | `img/social/pokemon-sealed-shelf-800.webp` (store photo) | 35% 50% |
| 8 | 9 | Instagram | Custom Commander art and a PSA 10 | art by @perky_grn_fairy | `img/social/event-cedh-tables-800.webp` (store photo) | 55% 60% |
| 9 | 8 | TikTok | Make it or break it, episode 30 | | `img/social/singles-case-lit-800.webp` (store photo) | 50% 50% |
```js
{ platform: 'tiktok' | 'instagram' | 'facebook', id: '7456651666096704814' /* TikTok id or IG shortcode */,
  url: 'https://www.tiktok.com/@mulligangames/video/7456651666096704814', caption: 'A full room for the monthly cEDH',
  credit: '' /* 'by @vespur' */, date: '2025-01-09' /* sorting / admin only, not shown */,
  poster: 'media/social/tt-7456651666096704814.webp', pw: 240, ph: 427, pos: '50% 50%' }
```
- **No dates on the cards.** The best room clips are from early 2025; "Jan 2025" on the home page reads as a stale
  feed. The clips are evergreen; the date stays in the data for ordering.
- **Credits are shown** (owner asked to credit; the research flags pick 3 as @vespur's reel and pick 9's art as
  @perky_grn_fairy's): one `--ink-2` line under the caption. Q for the owner stays open (research note).
- Validation (D20): TikTok id `^\d{15,21}$`; IG shortcode `^[A-Za-z0-9_-]{5,20}$`; FB `url` must start with
  `https://www.facebook.com/`; `url` host must be `www.tiktok.com`, `www.instagram.com` or `www.facebook.com`; `poster`
  must start with `media/social/` or `img/social/`. A failing item is dropped; under 3 valid items the section hides.
- **Posters:** the 5 real frames are 240x427 WebP (6-20 KB). The 4 missing ones use a store photo (`-800`, 4:3) cropped
  to 9:16 by `object-fit: cover` + the `pos` above (checked in `shots-r6/posters-1100-light.png`: all four crop well).
  When the owners send stills (Q21), swap the `poster` value; nothing else changes.

### 2.3 The card (Riverside pattern: the words under the poster)
```
┌────────────┐
│[♪ TikTok]  │  platform badge, top left, on --scrim
│            │
│     (▶)    │  52px play disc, centred
│            │  poster 9:16, 12px corners, hairline ring
└────────────┘
A full room for       caption, 2 lines max
the monthly cEDH
by @vespur            credit, only when set
```
**Low-res posters (240px wide) and mixed sources.** Cards are never wider than the posters can carry: **164px on
phones, 192px (12rem) from 768px**, a fixed width, never stretched to fill a column (240px source = 1.25x at 1x
screens, 2.5x at 3x phones; at this size that reads as soft, not broken). What makes a store-photo poster sit with the
video frames is the shared frame, not filters: same 9:16 box, same corners, same hairline ring, same badge and play
disc, and the caption is always under the poster. No blur, tint or grain on either kind (degrading the sharp photos to
match would just make all nine look worse). The one darkening: a 28% bottom-up gradient over the lower third of
every poster, so the IG frame's black top/bottom bars and the bright store walls end in the same tone.
Markup: the whole card is one link to the real post (works with no JS, and is the "Open on TikTok" fallback):
```html
<li class="clip">
  <a class="clip-a" href="https://www.tiktok.com/@mulligangames/video/7456651666096704814" data-clip="0">
    <span class="clip-ph">
      <img src="media/social/tt-7456651666096704814.webp" width="240" height="427" alt="" loading="lazy" decoding="async">
      <span class="clip-badge"><svg class="ic" aria-hidden="true">…</svg>TikTok</span>
      <span class="clip-play" aria-hidden="true"><svg>…</svg></span>
    </span>
    <span class="clip-cap"><span class="vh">Play video: </span>A full room for the monthly cEDH</span>
    <span class="clip-by">by @vespur</span>   <!-- only when credit is set -->
  </a>
</li>
```
Store-photo posters: same markup with `width="800" height="600"` and `style="object-position:<pos>"` (constant from
the data table, validated as `^\d{1,3}% \d{1,3}%$`).
```css
.clips-sec { background: var(--surface); border-block: 1px solid var(--line); }
.clips { list-style: none; margin: 0 calc(-1 * var(--gutter)); padding: var(--s1) var(--gutter) var(--s2);
  display: grid; grid-auto-flow: column; grid-auto-columns: min(42%, 11.5rem); gap: var(--s3);
  overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x mandatory; scroll-padding-inline: var(--gutter);
  scrollbar-width: none; }
.clip { scroll-snap-align: start; min-width: 0; }
.clip-a { display: grid; gap: 0.15rem; color: var(--ink); text-decoration: none; border-radius: var(--r-photo); }
.clip-ph { position: relative; display: block; aspect-ratio: 9 / 16; overflow: hidden; border-radius: var(--r-photo);
  background: var(--surface-2); box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.1); }
.clip-ph img { width: 100%; height: 100%; object-fit: cover; }
.clip-ph::after { content: ""; position: absolute; inset: auto 0 0; height: 34%; pointer-events: none;
  background: linear-gradient(to top, rgb(18 12 9 / 0.28), transparent); }
.clip-badge { position: absolute; z-index: 1; top: 0.5rem; left: 0.5rem; display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.2rem 0.55rem 0.2rem 0.4rem; border-radius: var(--r-pill); background: var(--scrim); color: #FFFFFF;
  font-size: var(--t-xs); font-weight: 750; line-height: 1.4; }
.clip-badge .ic { width: 0.95rem; height: 0.95rem; }
.clip-play { position: absolute; z-index: 1; inset: 0; margin: auto; width: 3.25rem; height: 3.25rem;
  display: grid; place-items: center; border-radius: 50%; background: rgb(18 16 14 / 0.72);
  border: 2px solid rgb(255 255 255 / 0.85); color: #FFFFFF; }
.clip-cap { margin-top: 0.5rem; font-size: var(--t-sm); font-weight: 750; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.clip-by { font-size: var(--t-xs); font-weight: 600; color: var(--ink-2); }
.clip-a:hover .clip-play { background: var(--act); border-color: #FFFFFF; }
.clip-a:hover .clip-cap { text-decoration: underline; }
.clip-a:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
@media (min-width: 768px) { .clips { margin-inline: 0; padding-inline: 0; grid-auto-columns: 12rem; gap: var(--s4); } }
/* wide: the head on the left (like the cEDH band and Riverside's feature), the row on the right */
@media (min-width: 1024px) {
  .clips-sec .wrap { display: grid; grid-template-columns: 16rem minmax(0, 1fr); column-gap: var(--s6); align-items: start; }
  .clips-sec .sec-head { display: grid; gap: var(--s3); margin: 0; align-content: start; }
}
```
Sizes: 390 = 164x291 posters, 2.2 visible (the peeking card is the scroll hint, no fade); 768 = 192x341, about 3.6
visible; 1280 = 192x341 in a ~950px column, about 4.6 visible (four whole cards + a peek). Never more than one row:
the 9 items scroll sideways at every width. The section is ~460px tall at 1280 and ~420px at 390.

**Prev / next (from 768px):** two 44px round buttons under "Follow on TikTok" in the head
(`--surface`, 1px `--line-strong`, chevron icons; `aria-controls="clips"`, labels "Earlier clips" / "More clips").
Each scrolls by one card + gap (`scrollBy`, `behavior: 'smooth'` only when motion is allowed); `disabled` at either end
(update on `scrollend`, fallback `scroll` + 100ms debounce). Hidden under 768px (swipe).

### 2.4 Click: the official embed in a dialog
**One behaviour at every width: a modal `<dialog>`**, not in place. A 9:16 player inside a 164px phone card can't be
watched, a dialog gives one size and one code path, Esc closes it, and removing the iframe on close stops the sound.
Reuse the events page's dialog styles: `index.html` also loads `css/ui.css` (`.dlg`, `.dlg-top`, `.dlg-h`, `.dlg-x`).
```html
<dialog id="clip-dlg" class="dlg dlg-clip" aria-labelledby="clip-dlg-h">
  <div class="dlg-top"><h2 class="dlg-h" id="clip-dlg-h"></h2><button class="dlg-x" type="button" aria-label="Close video">×icon</button></div>
  <div class="clip-frame"></div>
  <p class="clip-foot"><a id="clip-out" target="_blank" rel="noopener">Open on TikTok<ext icon><span class="vh"> (opens TikTok)</span></a>
     <span>Playing loads TikTok's player.</span></p>
</dialog>
```
```css
.dlg-clip { width: auto; max-width: calc(100% - 1rem); }
.clip-frame { position: relative; width: min(calc(100vw - 2rem), calc((100svh - 9rem) * 9 / 16), 26rem);
  aspect-ratio: 9 / 16; margin-inline: auto; background: #000 var(--poster) center / cover no-repeat; }
.clip-frame[data-platform="instagram"] { aspect-ratio: auto; height: min(calc(100svh - 9rem), 46rem); }
.clip-frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.clip-foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--s2) var(--s4);
  margin: 0; padding: var(--s3) var(--s4); font-size: var(--t-sm); color: var(--ink-2); border-top: 1px solid var(--line); }
.dlg-clip::backdrop { background: rgb(12 9 7 / 0.82); }
```
Sizes: 390x844 = 358x636 player, dialog ~750 tall; 1280x900 = 416x740 player.
Script (`front.js`, createElement only; the iframe `src` built with `new URL()` from validated fields):
- Click on `.clip-a` (no modifier keys): `preventDefault`, remember the opener, set heading = caption, `--poster` =
  the poster (shows at once, so no black box while the embed loads), `#clip-out` href + label "Open on TikTok /
  Instagram / Facebook", `showModal()`, focus the close button, then append the iframe:
  - TikTok: `https://www.tiktok.com/player/v1/{id}?autoplay=1&loop=0&music_info=0&description=0&rel=0&native_context_menu=0&closed_caption=1`
    (the player TikTok's own oEmbed returns; if a browser refuses sound on autoplay it starts muted and the player's
    unmute button is there)
  - Instagram: `https://www.instagram.com/reel/{id}/embed/` (IG has no autoplay; the visitor taps play inside)
  - Facebook: `https://www.facebook.com/plugins/video.php?href={encodeURIComponent(url)}&show_text=false&autoplay=true&width=416`
  - attributes: `title="TikTok video: <caption>"`, `allow="autoplay; encrypted-media; fullscreen; picture-in-picture"`,
    `allowfullscreen`, `referrerpolicy="strict-origin-when-cross-origin"`. No `sandbox` (the players break under it).
- On `close` (X, Esc, backdrop click): remove the iframe, clear `--poster`, focus the opener card.
- If the iframe has not fired `load` after 8 s, show the line "The video didn't load." above `#clip-out` (the link is
  already there). No JS, or a modifier-click: the card link simply opens the post on its own site.

### 2.5 Privacy, motion, keyboard
- **No third-party request before a click:** posters are our files, the cards are plain links, no `embed.js`,
  `sdk.js` or TikTok script is ever loaded, no oEmbed fetch, no prefetch / preconnect. Check: network log on load
  shows only our origin (test below). Add one line to the privacy page: "Videos load from TikTok, Instagram or
  Facebook only when you press play; those sites may set their own cookies."
- **Reduced motion:** no hover zoom or animated preview anywhere; prev/next use `behavior: 'auto'`; the dialog opens
  without animation. Autoplay inside the dialog is fine (the visitor just pressed Play; WCAG 2.2.2 is about content
  that starts on its own).
- **Keyboard:** Tab walks the cards in order (each is one link; focus scrolls it into view, `scroll-margin-inline:
  var(--gutter)`); Enter opens; in the dialog focus starts on Close, Tab reaches the player and "Open on TikTok",
  Esc closes and focus returns to the card.
- **Tests (tests-front.js):** before any click, no `iframe` and no `tiktok.com / instagram.com / facebook.com` in any
  `src`; one click adds exactly one iframe whose origin is in the allow-list; close removes it; an item with a bad id
  is not rendered; fewer than 3 valid clips hides the section.

### 2.6 CSP (for the Desktop's build; `server.js` `csp()`)
Add one directive; nothing else changes (posters are `'self'`, no third-party script; Facebook is listed although no
Facebook clip is picked yet, so adding one later needs no server change):
```
frame-src https://www.tiktok.com https://www.instagram.com https://www.facebook.com
```
Keep `Permissions-Policy` free of `autoplay=()` and `fullscreen=()` (the iframe `allow` delegates them). Frames the
players nest (tiktokcdn, fbcdn, cdninstagram) are governed by the players' own CSP, not ours. The GitHub Pages
prototype sends no CSP, so it needs nothing.

---

## 3. Hero: keep it, add one quiet "Watch clips" link
**Recommendation:** keep the landscape still from 900px and the self-hosted portrait loop under 900px (D36, D40), and
add a text link **"Watch clips from the shop ›"** (to `#clips`) in the hero strip from 768px, beside the "On screen"
caption. Why: the hero image is the LCP and must stay self-hosted (a TikTok iframe there means a third-party request on
load, cookies, and a portrait player in a landscape box); a third hero button would compete with "This week's events"
and next up, which D36 says must stay "visible above all else". The owner's "videos on the homepage" is met by the
clips row one section down. If the owners send original landscape clips (Q21), those go into the hero loop then.
```css
.strip-clips { color: #FFFFFF; font-weight: 750; text-underline-offset: 0.2em; white-space: nowrap; display: none; }
@media (min-width: 768px) { .strip-clips { display: inline-flex; } }
```

---

## 4. Files to copy (public/img/social > prototype/img/social, full + `-800`)
Already there: `event-full-room`, `shop-floor-cases` (and the other round-5 files).
Copy both sizes of these 14 (28 files): `event-magic-night`, `event-full-room-2`, `play-room-night`,
`event-cedh-tables`, `event-full-room-3`, `champion-belt`, `pokemon-sealed-shelf`, `event-packed-room`,
`event-tables-fb`, `warhammer-table`, `warhammer-battle`, `painted-marines`, `dnd-table`, `dnd-one-shot-setup`.
Clip posters need nothing new: the 5 frames are already in `prototype/media/social/`, and the 4 store-photo posters
(`shop-floor-cases`, `singles-case-lit` already in `img/social/`; `pokemon-sealed-shelf`, `event-cedh-tables` in the
list above) reuse the same files as This week, so they are cached.
The page uses only the `-800` copies (about 50-95 KB each, ~11 distinct, all lazy); the full ones are for the build's
event pages later. Build improvement (not blocking): a `-320.webp` per photo for the thumbs and strip caps (~12 KB).
Also make `V.detailPic` (event-views.js `PICS`) read from the same `MG.photoFor` map so the detail dialog and the week
agree.

## 5. Sketches

**390 (phone)**
```
┌──────────────────────────────┐
│ hero (unchanged)             │
│ Free play all day...     [⏸] │ strip (no clips link under 768)
├──────────────────────────────┤ paper
│ This week                    │
│ All events and sign-ups ›    │
│ Most nights are walk-in...   │
│ [Tdy][Sat][Sun][Mon][Tue][Wed][Thu]  dots only
│ (All games 15)(Magic 9)(cE → │
│ ◆30 Today  Friday, Oct 30... │
│ ┌──────────────────────────┐ │
│ │▓▓▓▓▓ magic-night 3:1 ▓▓▓▓│ │ 358x119
│ │━━━━━━━━━━━━━━━━━━━━━━━━━━│ │
│ │ All Leylines' Eve…   $20 │ │
│ │ ⬠ Magic ◆ Chaos draft    │ │
│ │ ◷ 6 PM to 10 PM ● On now │ │
│ │ Sign-ups closed…  19 left│ │
│ └──────────────────────────┘ │
│ ┌ full-room-2 band ────────┐ │ Draft FNM (2nd Magic: next photo)
│ ┌ packed-room band ────────┐ │ Nexus Nights (Riftbound)
│ ◆31 Tomorrow                 │
│ ┌ magic-night band ────────┐ │ Saturday Draft
│ ┌ pokemon shelf, grey ─────┐ │ Pokemon League (cancelled)
│ ◆1 Sunday                    │
│ [▓▓] 10 AM Championship Series│ champion-belt thumb
│      cEDH · $60 · Sign up…   │
│ [▓▓] 2 PM cEDH Weekly        │
│ Monday and Tuesday · closed  │
│ ◆4 Wednesday …5 rows w/thumbs│
│ Further out (text rows)      │
├──────────────────────────────┤ surface band
│ Clips from the shop          │
│ Short videos from our TikTok │
│ and Instagram.               │
│ Follow on TikTok ↗           │
│ ┌──────┐ ┌──────┐ ┌──        │
│ │TikTok│ │TikTok│ │Insta     │ 164x291 posters
│ │  ▶   │ │  ▶   │ │  ▶       │
│ │      │ │      │ │          │
│ └──────┘ └──────┘ └──        │
│ A full   A PSA 10 Winning…   │
│ room for Japanese by @vespur │
├──────────────────────────────┤ cEDH band (dark) ...
```

**1280 (desktop)**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ hero: still + copy (unchanged)                                               │
│ ● Free play all day…        On screen: The shop floor…  Watch clips from the shop › │
├──────────────────────────────────────────────────────────────────────────────┤
│ This week                                              All events and sign-ups › │
│ Most nights are walk-in. Cards with a Sign up button hold seats.             │
│ ┌▓▓▓▓▓┐┌▓▓▓▓▓┐┌▓▓▓▓▓┐┌ ─ ─ ┐┌ ─ ─ ┐┌▓▓▓▓▓┐┌▓▓▓▓▓┐   2.5rem photo caps          │
│ │Today││ Sat ││ Sun ││ Mon ││ Tue ││ Wed ││ Thu │                              │
│ │ 30  ││ 31  ││  1  ││  2  ││  3  ││  4  ││  5  │                              │
│ └─────┘└─────┘└─────┘└ ─ ─ ┘└ ─ ─ ┘└─────┘└─────┘                              │
│ (All games 15)(Magic 9)(cEDH 2)(Pokemon 1)(One Piece 1)…                     │
│ ◆30        ┌▓▓▓ magic-night 12:5 ▓▓▓┐ ┌▓▓▓ full-room-2 12:5 ▓▓▓┐               │
│ Today      │━━━━━━━━━━━━━━━━━━━━━━━━│ │━━━━━━━━━━━━━━━━━━━━━━━│               │
│ Fri Oct 30 │ All Leylines' Eve… $20 │ │ Draft FNM         $20 │               │
│            │ … 19 seats left        │ │ … Full, 3 waiting     │               │
│            └────────────────────────┘ └───────────────────────┘               │
│            ┌▓▓▓ packed-room ▓▓▓▓▓▓▓▓┐                                          │
│            │ Nexus Nights        $5 │                                          │
│ ◆31 Tomorrow  [two banded cards]                                             │
│ ◆1 Sunday  [▓▓] 10 AM Championship Series  cEDH · $60 · Sign up on TopDeck   │
│            [▓▓] 2 PM  cEDH Weekly  cEDH · $10                                │
│ Monday and Tuesday · closed                                                  │
│ ◆4 Wednesday [▓▓] 5 PM Tabletop and Warhammer  Warhammer · Free   (5 rows)   │
│ Further out (text rows, unchanged)                                           │
├──────────────────────────────────────────────────────────────────────────────┤ surface
│ Clips from the  │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌──              │
│ shop            │ │TikTok │ │TikTok │ │Insta  │ │TikTok │ │   192x341       │
│ Short videos    │ │   ▶   │ │   ▶   │ │   ▶   │ │   ▶   │ │   posters,      │
│ from our TikTok │ │       │ │       │ │       │ │       │ │   4 + a peek,   │
│ and Instagram.  │ └───────┘ └───────┘ └───────┘ └───────┘ └──  scrolls      │
│                 │ A full    A PSA 10  Winning a A sealed                     │
│ Follow on TikTok↗│ room for… Japanese… Mulligan… base set…                   │
│ (‹) (›)         │                     by @vespur                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ cEDH band … New and preorders … Visit … Between events … footer              │
└──────────────────────────────────────────────────────────────────────────────┘
Click a poster → modal: [caption ............ (X)] / 416x740 player / "Open on TikTok ↗ · Playing loads TikTok's player."
```

## 6. For the Desktop (port note)
1. **Photos:** copy the 14 photos (section 4) into the build's public image folder; add `src/lib/photos.js`
   exporting the section 1.2 map and `photoFor(occ, usedToday)`; use it in `src/lib/render.js` for the full cards
   (`.ev-ph`), the one-line rows (`.dl-ph` + `.dl-main`) and the week tiles (`.dc-ph`), and in the event page /
   detail picture. Escape nothing new: every photo value is a constant (D20).
2. **Heading:** `src/pages/index.astro` "This week at Mulligan" > "This week".
3. **Clips:** `store.json` gets `clips[]` (section 2.2 shape and validation in `src/lib/store.js`); `index.astro`
   replaces the "Inside the shop" section with `#clips` (server-rendered cards as links, so it works without JS);
   one small client script for the dialog and prev/next (no inline handlers; it ships as a file, so no new CSP hash).
   Posters: copy `prototype/media/social/` (5 frames, 240x427) to the build's media folder; the other 4 point at
   shop photos with a `pos`; fail the build if a listed poster is missing. Cards stay 164px / 192px wide (not fluid)
   until 540x960 stills arrive from the owners (Q21); then the 1024+ width may grow to 14rem.
4. **CSP:** `server.js` `csp()` adds `frame-src https://www.tiktok.com https://www.instagram.com https://www.facebook.com`.
5. **CSS:** the rules above go into `src/styles/global.css` (front-page block) unchanged; the dialog reuses the build's
   existing dialog styles. Privacy page: the one line in 2.5.
6. **Hero:** strip link "Watch clips from the shop" from 768px; nothing else changes.
7. **Admin (later, not this round):** a "Photo" picker on the series editor (choose one of the shop photos) writing
   `series.photo`, and a "Clips" list under Store info (paste a TikTok / Instagram / Facebook link + caption; poster
   upload). Until then clips are edited in `store.json`.
