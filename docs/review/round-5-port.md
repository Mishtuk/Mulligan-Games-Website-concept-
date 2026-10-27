# Round 5: for the Desktop (port to src/)

Boss, 2026-10-27 (D40). The prototype (`prototype/`) is the reference; copy behaviour and data, not prototype code.

1. **Hero media switch** (`src/pages/index.astro`, `src/styles/global.css`): a `<picture>` with a `(min-width: 900px)`
   source `shop-floor-cases-800.webp 800w, shop-floor-cases.webp 1440w` (copy both from `prototype/img/social/` to
   `public/img/social/`), `object-position: 50% 30%`; the portrait poster stays the `<img>` fallback. The `<video>` has
   no `<source>`/poster in the HTML; the client script adds them only under 900px. Poster background and the LCP
   preload are per-screen (`media` attributes). Pause button hidden from 900px. Caption: "The shop floor at 445 York Rd"
   wide, "cEDH night at the shop" narrow. Check: at 1280 no .mp4/.webm request; at 390 no shop-floor-cases request.
2. **Inside the shop photos**: `singles-case-lit`, `shop-corgi`, `event-full-room` (with 800w variants and `sizes`)
   replace `singles-display-case`, `staff-corgi-interior`, `staff-group` in `index.astro`. Keep
   `staff-corgi-interior` in public/ (the events empty state in `src/lib/render.js` uses it).
3. **Preorder tiles**: no `.rel-text` when a tile has no note and no event; `.rel-foot { margin-top: auto }`.
4. **Reviews row** (`src/content/store.json` -> `reviews`, replacing `proof`): rating 4.9, count 81, Google Maps URL,
   three items exactly as `prototype/data/sample.js` (Jarrett L., Eric K., Tyler A.; verbatim text). One linked line
   "4.9 on Google · 81 reviews", then three `<q>` quotes with "Name, age". Escape everything (no `set:html`).
5. **cEDH fees** (`src/content/series.json`): MCS 60, 5K 100, Redemption 35; drop `feeConfirmed: false` on those three.
   Entry fact: "Championship Series $60, 5K $100, Redemption $35 ($25 after the 5K). A $10 online deposit holds a spot;
   the rest is paid at the door." The deposit is said once.
6. **Recent turnout**: a `circuit` list (TopDeck registered counts, `docs/research/tcgplayer-topdeck.md` table) in
   store.json; show the last four past events (newest first: date, plain name, "N players") and one "Full standings on
   TopDeck" link. Optional: drop the "Last Championship Series" line, which now repeats the first row.
7. **TCGplayer line** under New and preorders: link "Shop Pokemon Japan and Magic cards online on TCGplayer" to
   `https://www.tcgplayer.com/sellers/Mulligan-Gaming-LLC/0062555a` (new tab, noopener) + " · 100% positive". No sales
   count, no "singles" claim, no T-shirt.
