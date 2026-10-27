# Round 7: for the Desktop (port to src/)

Boss, 2026-10-27 (D51 owner ask, D52 review). The prototype is the reference (`prototype/index.html`,
`prototype/css/front.css` "round 7" / "D52" blocks, `prototype/js/front.js`, `prototype/js/clips.js`); copy behaviour,
not prototype code. Every value goes in with `textContent` / Astro `{}` escaping, never `set:html`.

1. **Week strip, text only.** Seven tiles: day ("Today" for the first), date, count line ("3 events" / "1 event" /
   "Closed") **inside** the tile link; no photos, no game pips (drop `.dc-ph`, `.dc-pips`, `stripPh`, `mainEvent`).
   Grid of 7 equal columns, gap 3px (2px under 480px, list 0.5rem wider each side), tiles ~3.5rem tall (44-64px),
   capped at `max-width: 34rem`, left-aligned. Today: 2px accent border; closed: dashed, transparent. The aria-label
   keeps "Friday Oct 30, today, 3 events".
2. **Hero copy.** Headline (static) "Shuffle up. Everyone's welcome." Sub-line (static) "Free play every day we're open,
   big tables, and a crew who knows every format." plus a date-override note only when it is 60 characters or less.
   The old date line above the headline is gone.
3. **Status chip** above the headline (`p.phero-chip role=status`), from the hours data only:
   "Open now · till {close}" (green dot), "Opens {t} today", "Closed today · back {Wed|tomorrow} {t}",
   "Closed · back tomorrow {t}", "Closed this week"; a next day over a week away adds its date. Logic: `chipText()`.
4. **Featured TikTok clips.** From 900px: two 9:16 poster links on the right of the hero (`ul.phero-feat`, cards
   `clamp(8.75rem, 11.5vw, 10.5rem)`, copy column `min(40rem, 100% - 23rem)` so the headline and next-up ticket never
   sit under them); caption on a dark backing, up to 3 lines. Under 900px: one secondary "Watch a clip" button after
   "This week's events" (hidden from 900px). All are real `<a href=post target=_blank rel=noopener data-clip-id=...>`;
   the client binds any `a[data-clip-id]` to the existing click-to-load dialog only if the id equals a clip in the data
   that passes the round-6 validation (otherwise the card is removed). Clips: `7456651666096704814` ("A full room for
   the monthly cEDH") and `7467024512442289451` ("February's cEDH night and its prizes"); posters are the existing
   `media/social/tt-*.webp`. They also stay in "Clips from the shop". No third-party request before a click.
5. **Fix: open status once.** On the home page the bar above the header has no status: address (leading, also on
   phones: "445 York Rd", ", Warminster" from 600px), Call, Directions. The events page keeps its status text.
6. **Fix: free play once.** The hero strip loses "Free play all day, every day we're open" at every width. Strip:
   "On screen: ..." caption left (ellipsis if long), "Watch clips from the shop" (from 768px) and Pause right;
   48px tall on phones, `min-width: 0` so it never exceeds the screen.
7. **Fix: phone hero above the quick-actions bar.** Under 900px the hero floor is `clamp(24rem, 52svh, 40rem)` (was
   62svh), and at 360-420px the hero buttons share one row (`column-gap: var(--s2)`, button `padding-inline: 0.85rem`).
   At 390x844 the hero, strip and Pause end at ~745, above the bar (787); the theme button still clears Pause.
8. **Checks after the port:** port the round-7 and D52 tests in `prototype/js/tests-front.js` (chip at the demo times,
   cards clear the headline at 900/1024/1280/1440/1920, "Watch a clip" opens one TikTok iframe, each fact once, 390x844
   hero above the bar, 360px tiles). Network at 390 and 1280: only our origin before a click.
