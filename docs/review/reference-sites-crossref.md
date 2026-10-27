# Cross-reference: the owner's other sites vs. the Mulligan concept

Date: 2026-10-27. Advisor pass. Read-only on all repos. Looks stay D28 (brick + sign blue, logo on a white plate); only
structure, polish and proven code are borrowed. "Ref" paths are relative to each repo:
VFW = `Warminster-VFW-website-`, RIV = `Riverside-Website`, MAD = `Madison-Networks`.
"Mulligan" paths are under `Mulligan-Games-Website-concept-/`. Mulligan's `src/` (Desktop build) already carries a port of
the VFW server, admin, JSON-LD and a 404; this doc is about what the *look and feel* layer is still missing.

## Top takeaways

1. **Phone bottom action bar** (RIV and MAD `components/MobileBar.astro`, identical logic) is the biggest proven win
   Mulligan lacks. For a store, four buttons that hide on scroll-down and return on scroll-up: **Events, Sign up / This
   week, Hours (open now), Directions**. Copy the 20-line script and CSS nearly verbatim; recolour with `--surface` and
   `--act`. Add `padding-bottom` to the footer so it never covers content.
2. **Cross-document view transitions** (RIV `global.css` ~l.298-305, VFW l.523-527): 6 CSS lines, no JS, header holds
   still while the page cross-fades. It makes a multi-page static site feel like an app and fits D28's "calm" motion
   rule (opacity only, reduced-motion respected). Prototype can get it today by adding one block to `site.css`.
3. **Print stylesheet + "Print this week" button** (VFW l.533-565 and its flyer page `pages/events/flyer.astro`).
   TCG stores post a weekly schedule on the counter window. Mulligan has no `@media print` anywhere. A one-page
   "This week at Mulligan" print view (and optional /events/flyer) is a real owner-useful feature, not just polish.
4. **Real mobile menu** (RIV/MAD `Header.astro`: `<details>` sheet, focus moves in, Esc closes, tap closes). Mulligan's
   header uses a horizontally scrolling nav strip; it works but hides pages off-screen at 360px. Keep the strip while
   there are 4 or fewer links; adopt the sheet if the nav grows (Shop/Preorders, New here, Contact).
5. **Admin phone drawer with `inert` + scrim + confirm `<dialog>`** (RIV `pages/admin.astro` ~l.1215-1260, l.317).
   Mulligan's admin is a counter tablet tool and already has better ergonomics (56px targets, undo toasts, `U.dialog`),
   but it can borrow the focus-containment pattern (`main.inert = true` while the drawer is open) for its small-screen nav.
6. **Head/meta hygiene** (RIV `layouts/Base.astro`): `canonical`, `og:url`, `viewport-fit=cover`,
   `apple-mobile-web-app-*`, a web `manifest.webmanifest`, size-matched fallback fonts (`size-adjust`,
   `ascent-override`) that stop layout jump. Mulligan has og/theme-color/apple-touch-icon but no canonical, no
   manifest, no fallback-font metrics for Archivo. Cheap, Desktop build.
7. **A 404 that helps** (VFW `pages/404.astro`: "Most wanted" link list + call button). Mulligan's 404 is two buttons;
   add Hours/Call and the events list. The prototype has no 404 at all.
8. **Mulligan is ahead on**: light/dark switch (labelled Light | Dark pill beats VFW's icon-only FAB), contrast table
   and token discipline, 48/56px targets, game-colour-as-rule system, trading-card event anatomy, `light-dark()`
   tokens, undo toasts, roster/check-in UX, `inert` preview, test page (`tests.html`). Do not regress these to match the
   references. Details at the bottom.

## Table

| Pattern | Where in reference | Mulligan today | Recommendation | Effort | When |
|---|---|---|---|---|---|
| Phone bottom action bar (hide on scroll down, show on up/near end, safe-area, `backdrop-filter`) | RIV+MAD `src/components/MobileBar.astro`; CSS inline in that file | none (`prototype/css/site.css`, `src/components/Base.astro`) | **Borrow.** Items: Events, Hours/Open, Call or Directions, Sign up. 56px high, current page gets a pill behind the icon (`--act` tint). See snippet A. | S | Prototype now (front.html + events.html), then build |
| Native view transitions (header pinned, root cross-fade 220/380ms) | RIV `src/styles/global.css` l.298-305; VFW l.523-527 | none | **Borrow.** Opacity only (drop the 6px translate to honour "no motion beyond fade" in D28). Snippet B. | S | Prototype now |
| `@media print` for the schedule (hides header/footer/buttons, forces light, 11pt, link URLs shown) | VFW `global.css` l.533-565, l.670-680 | none | **Adapt.** Print "This week" as a two-column list: day, time, game, fee. Drop VFW's month grid. Add a `Print this week` `btn-2` on events page. Snippet C. | M | Prototype now (css + button), build later |
| Printable flyer page | VFW `src/pages/events/flyer.astro`, `scripts/flyer.ts` | none | **Adapt, later.** Weekly flyer from live data is useful for the window and Facebook. Owner has not asked; park as P3. | L | Desktop build |
| Mobile menu `<details>` sheet with focus-in, Esc, tap-to-close | VFW/RIV/MAD `Header.astro` (inline script ~15 lines) | scrolling nav strip (`.site-nav`, site.css l.~95) | **Adapt, conditional.** Keep strip at 4 links. If nav reaches 5+, use sheet and keep logo plate + open-now strip. Sheet footer: today's hours, Call, Directions (VFW `.sheet-info`). | M | Build; prototype only if nav grows |
| Today's hours / open-now computed in the browser, no-JS fallback text, dot (filled = open, ring = closed) | VFW `components/TodayHours.astro`, `scripts/bar-status.ts` | open-now strip (`.openbar`, `js/front.js`) with filled dot and pulse | **Skip (parity).** Mulligan's is equal or better. One borrow: the ring-vs-filled dot already matches `.ob-dot`. Verify the no-JS fallback text exists ("See hours"). | S | Check in build |
| Sticky live banner above header, pushes layout via `html[data-live]` | RIV `components/LiveBanner.astro` | none; `.tag-now` on cards | **Skip.** Mulligan's open-now strip covers it. Consider only for "Tournament in progress / sold out tonight" owner-set notice. Admin-set notice banner is more useful: see next row. | S | Skip for now |
| Owner-set alert banner (admin writes, server inlines `<!--rs:alerts-->`) | RIV `layouts/Base.astro` l.82; `pages/admin.astro` Alerts view | "Changed" tag and cancel state per event only | **Adapt.** A store-wide "Closed early tonight / Holiday hours" banner is a top owner request in every shop. Reuse VFW/RIV alert storage; style as `--highlight` strip under the open-now bar. | M | Desktop build |
| Page-head pattern with eyebrow + h1 + lede, optional photo | RIV `.page-head`, `.eyebrow` (global.css l.154-159, l.216-260) | brick header only; page titles ad hoc per page | **Adapt.** Eyebrow with a 2rem rule before it is a nice, cheap rhythm for `sec-head`. Use `--mark` brick for the rule, not gold. Snippet D. Skip the big radial circle and photo bleed. | S | Prototype now |
| Link underline-grow hover (`background-size` 2rem to 100%) and arrow nudge | RIV/MAD `.link`, `.link-arrow` l.164-174 | underline thickness change only (`a:hover`) | **Adapt.** Use on `.more` links ("All events", "Directions"). Transform-free, 0.3-0.4s `--ease`. Reduced-motion: set transition none. | S | Prototype now |
| Card hover lift (`translateY(-4px)`, big shadow) | RIV/MAD `a.card:hover` | none, by D28 | **Skip.** DESIGN.md 2.4 forbids it; looks like a template. | - | Skip |
| Scroll-reveal via `animation-timeline: view()` | RIV `.reveal` global.css l.675-690 | none | **Skip.** D28: no scroll reveals. | - | Skip |
| `size-adjust`/`ascent-override` fallback font | RIV `Base.astro` l.30-34 | `tokens.css` Archivo with `font-display: swap`, no metric-matched fallback | **Borrow.** Add a `@font-face 'Archivo Fallback'` on `local('Arial')`, then insert it in `--font`. Measure size-adjust with the Desktop build (Lighthouse CLS). | S | Desktop build |
| Font preload + unicode-range latin subset | RIV `Base.astro` l.25-28, l.58-59 | single variable woff2, no preload | **Borrow preload only.** `<link rel=preload as=font crossorigin>` for `archivo.woff2`. Subsetting only if file > ~60 KB. | S | Prototype now (one line per page) |
| `canonical`, `og:url`, `apple-mobile-web-app-*`, `viewport-fit=cover`, manifest | RIV `Base.astro` l.43-66; `pages/manifest.webmanifest.ts` | og/theme-color/apple-touch present; no canonical, og:url, manifest; viewport lacks `viewport-fit=cover` (header already uses `env(safe-area-inset-top)`, which is 0 without it on iOS notch landscape) | **Borrow.** Add `viewport-fit=cover` now; canonical/og:url/manifest in `Base.astro`. Add Twitter card (already present). | S | viewport now, rest Desktop |
| JSON-LD: LocalBusiness + OpeningHoursSpecification + Event[] (next 10 one-offs, offset-aware times) | VFW `src/lib/jsonld.js` | `src/lib/jsonld.js` exists (ported); `prototype/index.html` has a block | **Skip (done).** One check: use `23:59` for midnight close, and `eventStatus` EventCancelled for cancelled nights (VFW emits only EventScheduled). Mulligan's cancel state is richer; map it. Prefer `Store` > `LocalBusiness` subtype `HobbyShop` for this shop type. | S | Desktop build |
| 404 with "Most wanted" link list + phone | VFW `pages/404.astro`; RIV centered 404 `min-height: calc(85svh - header)` | `src/pages/404.astro`: 2 buttons; prototype: none | **Adapt.** Add Hours, Directions, Call. Use the RIV `85svh` trick so the footer is not sitting under a short card. Add `prototype/404.html` so the owner can review it. | S | Prototype now |
| Theme toggle | VFW `ThemeFab.astro` (round FAB, bottom-right, sets `data-theme`, rotates icons) | `.scheme` labelled Light \| Dark pill in the header (`site.css`, `MG.scheme`) | **Skip.** Mulligan's is clearer and doesn't cover content. Only steal: `try/catch` around `localStorage` (already done) and `mq.addEventListener('change')` so the label stays correct when the system flips. Check `MG.scheme` does the latter. | S | Check |
| Skip link | RIV `.skip-link` (pill, `top:1rem` on focus), VFW same | `.skip` on every page, targets `#week` / `#main` | **Skip (parity).** One gap: after the view transition the skip target still works. Fine. | - | Skip |
| Focus rings that flip on dark bands | MAD `global.css` l.105-107 (`.site-header :focus-visible { outline-color: sand }`) | `:focus-visible { var(--focus) }` with `color-scheme: dark` on header/footer, so token flips automatically | **Skip.** Mulligan's token approach is the cleaner version of the same idea. | - | Skip |
| Prose styling for text pages (68ch, heading rule, `li::marker`, blockquote) | RIV `.prose` l.264-284 | `new-here`, `privacy` pages have their own rules | **Adapt** for the "New here?" and Rules pages: `max-width: 68ch; line-height: 1.7` is the key number. | S | Build |
| `text-wrap: balance` headings / `pretty` paragraphs | VFW l.120, 123 | already in `site.css` | **Skip (done).** | - | Skip |
| Event "date tile" (4.5rem square: day number + month label) | RIV `ComingUpStyles.astro` `.cu-date`, `.cu-card` | brick diamond `.day-dia` + day-card; cards carry the date text | **Skip.** Diamond is the Mulligan answer. One idea to take: `-webkit-line-clamp: 2` on descriptions so cards in a row keep equal height (`.cu-about`). Check `.ev-text` for runaway notes. | S | Prototype now |
| Event cards: photo with cycling images, `IntersectionObserver`, pause on hover/focus, off for reduced-motion | VFW `scripts/event-cycle.ts`, `.vfw-evph` | no photos on cards (admin uses none) | **Skip.** Card photos conflict with trading-card anatomy and add weight. Reuse only if a "Featured" hero rotates photos of the shop. | L | Skip |
| Events calendar month grid + `.ics` + print month | VFW `pages/events.astro`, `events.ics.ts`, `.vfw-calendar` | week-by-day list; `.ics` per event and all (DESIGN 7) | **Skip the grid** (DESIGN.md l.803 already decided). `.ics` already planned; add `webcal://` link alongside the download so phones subscribe instead of importing once (`Add to my calendar` plus `Subscribe`). | S-M | Desktop build |
| Admin: slide-in drawer, `inert` on main, scrim, Esc closes, focus returns to trigger | RIV `pages/admin.astro` l.1215-1260 | `admin-shell.js` tab bar/sidebar, `U.dialog` | **Adapt.** Add `inert` to the page while a dialog or the phone drawer is open (native `<dialog>.showModal()` already makes the rest inert; verify `U.dialog` uses `showModal`). | S | Prototype check now |
| Admin: user menu with `aria-expanded`, click-outside and Esc | RIV admin l.1243-1260 | n/a (no accounts in prototype) | **Borrow in build** for the signed-in menu: Change password, Sign out. | S | Desktop build |
| Admin: native `<dialog id="confirm">` with `form method="dialog"` | RIV admin l.317-326 | `U.dialog` (JS-built) | **Skip.** Equivalent; keep Mulligan's. | - | Skip |
| Admin: security log / activity, backup, help view | VFW `src/audit.js`, RIV views `activity`, `backup`, `help` | Mulligan `src/audit.js` ported; Today/Events/Inventory only in prototype | **Adopt in build** as already ported. Add a short "Help" view (RIV `src/help/index.js`): owners are not developers. | M | Desktop build |
| Admin: email list + sending | RIV `src/email/*` | none (D-decisions: ask first) | **Skip** until owner asks (cost + contacts the store: BRIEF constraint). | L | Skip |
| Body padding when bottom bar present (`--bar-h`, `scroll-padding-bottom`) | RIV global.css l.59-66, 73 | n/a | **Borrow with takeaway 1.** Sticky `.day-h` and anchor jumps must also clear the bar. | S | With bar |
| `prefers-reduced-motion` blanket (`0.01ms !important`) | VFW l.528-531; RIV l.309-311 | targeted per component (site.css l.384, front.css l.128, admin.css l.358) | **Borrow as a safety net** at end of `site.css`: catches future additions. Keep the targeted rules. | S | Prototype now |
| Lighthouse targets (100/100/100/100 on mobile) | MAD `HANDOFF.md` status | not measured | **Adopt as a build gate.** Desktop runs Lighthouse on `/` and `/events/`; image `width/height`, preload poster (already done), inline CSS. RIV uses `build.inlineStylesheets: 'always'`; check `astro.config.mjs`. | S | Desktop build |
| Contact/phone prominent: "Call" button in header on phones | VFW `Header.astro` `.mast-call`; MAD "Request service" header button | `ob-link` Directions in open-now strip; no call | **Adapt.** Add Call to the bottom bar and the open-now strip (`tel:`). Needs the owner's phone number (OWNER-QUESTIONS) - do not invent one. | S | With bar, after owner answer |
| Form fields: `:focus-visible` ring + inline error text | MAD `global.css` l.608+ (`.field`) | `.fld` has ring and `.err` | **Skip (parity).** | - | Skip |

## Snippets

**A. Bottom bar (adapt RIV/MAD).** Markup: `<nav class="mobile-bar" aria-label="Quick actions">` with 4 `<a>` containing
an `.ic` svg and a `<span>`. Script: verbatim from `MobileBar.astro` (scroll direction, 6px dead zone, `nearEnd` at
120px, rAF throttle).
```css
.mobile-bar { display: none; }
@media (max-width: 699px) {
  :root { --bar-h: calc(62px + env(safe-area-inset-bottom)); }
  body { padding-bottom: var(--bar-h); }
  html { scroll-padding-bottom: calc(var(--bar-h) + 1rem); }
  .mobile-bar {
    position: fixed; inset: auto 0 0; z-index: 45; display: grid; grid-template-columns: repeat(4, 1fr);
    padding: 0.3rem max(0.5rem, env(safe-area-inset-right)) env(safe-area-inset-bottom) max(0.5rem, env(safe-area-inset-left));
    background: color-mix(in oklab, var(--surface) 90%, transparent);
    backdrop-filter: saturate(1.4) blur(14px); border-top: 1px solid var(--line);
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .mobile-bar.is-hidden { transform: translateY(calc(100% + 2px)); }
  .mobile-bar a { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
    min-height: 56px; color: var(--ink-2); text-decoration: none; font-size: 0.8125rem; font-weight: 750; }
  .mobile-bar svg { width: 44px; height: 30px; padding: 4px 10px; border-radius: 999px; }
  .mobile-bar a[aria-current="page"] { color: var(--ink); }
  .mobile-bar a[aria-current="page"] svg { background: color-mix(in oklab, var(--act) 20%, var(--surface)); color: var(--act); }
}
@media (prefers-reduced-motion: reduce) { .mobile-bar { transition: none; } }
```
Note on the 48px rule: 56px bar items beat `--tap`; the label is 13px (`--t-xs` is 14px, so use 0.875rem if the
designer wants to stay on-scale).

**B. View transitions (opacity only, calm).**
```css
@media (prefers-reduced-motion: no-preference) {
  @view-transition { navigation: auto; }
  .site-head { view-transition-name: site-head; }
  ::view-transition-group(site-head) { animation-duration: 0s; }
  ::view-transition-old(root) { animation: 0.18s ease-in both vt-out; }
  ::view-transition-new(root) { animation: 0.3s ease-out both vt-in; }
}
@keyframes vt-out { to { opacity: 0; } }
@keyframes vt-in  { from { opacity: 0; } }
```
Unsupported browsers just navigate normally. Keep the sticky `.day-h` out of any `view-transition-name`.

**C. Print this week.**
```css
@media print {
  @page { margin: 12mm; }
  :root { color-scheme: light; --paper:#fff; --surface:#fff; --ink:#000; --ink-2:#222; }
  body { background:#fff; color:#000; font-size: 11pt; }
  .skip, .demo, .openbar, .site-nav, .scheme, .chips, .btn, .mobile-bar, .site-foot { display: none !important; }
  .site-head { background: none; padding: 0; }                /* keep the plate/logo; drop the brick */
  .plate { box-shadow: none; padding: 0; }
  .day { break-inside: avoid; border-top: 1px solid #000; }
  .ev { box-shadow: none; border: 1px solid #000; break-inside: avoid; }
  a { text-decoration: none; }
}
```
Add a footer line printed only: store name, 445 York Rd, hours (`.print-only { display:none }` and show under print).

**D. Eyebrow rule for `sec-head`.**
```css
.eyebrow { display:flex; align-items:center; gap:.75rem; font-size: var(--t-xs); font-weight: 800; letter-spacing:.14em; text-transform: uppercase; color: var(--ink-2); }
.eyebrow::before { content:""; width: 2rem; height: 2px; background: var(--mark); }
```
RIV values: 0.14em tracking, 2rem x 2px rule. Contrast: `--ink-2` on `--paper` is 6.7 so the small caps text passes.

**E. Safety net at the end of `site.css`.**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
```

**F. Fallback font stub (measure before shipping).**
```css
@font-face { font-family: 'Archivo Fallback'; src: local('Arial'); size-adjust: 100%; ascent-override: 90%; descent-override: 22%; line-gap-override: 0%; }
/* --font: 'Archivo', 'Archivo Fallback', 'Bahnschrift', ... */
```
The 100/90/22 numbers are placeholders; RIV's real ones were 96/101/39 for Source Sans on Arial. Compute from Archivo's
hhea metrics on the Desktop (capsize or `fontaine`-style calc), then check CLS.

## Reference values worth knowing (for comparison, not for copying)

| Value | RIV | VFW | MAD | Mulligan |
|---|---|---|---|---|
| Body size | 18-19px fluid | step-0 | similar | 17px fixed (`--t-md`) |
| Type scale | 6 fluid `clamp()` steps | same family | same | 1.25 steps, fluid only for 2xl and hero |
| Section padding | `clamp(3.25rem, 1.5rem + 7vw, 8rem)` | same | same | `--s7` 48px, `--s8` 64px at 1024 |
| Container | 76rem | 76rem | 76rem | 77.5rem |
| Radius | 8 / 14 / pill | 4px (VFW is squarer) | 8 / 14 | 14 card, 10 control, 6 box |
| Button transition | 0.25s `--ease` x5 props | similar | 0.25s | 140ms colour only |
| Easing | `cubic-bezier(0.16, 1, 0.3, 1)` | same | same | `--ease-deal` .2,.9,.25,1.15 (overshoot; use RIV easing for fades) |
| Header height token | `--header-h: 76px` (58 landscape) | yes | yes | `scroll-padding-top: 4.5rem` hard-coded |
| Mobile bar | 62px + safe-area | none | same | none |

Mulligan's section padding is tighter than the church and consulting sites. That is right for a schedule-first store;
do not inflate it to match.

## What Mulligan already does better (keep)

- **Tokens**: `light-dark()` in one `:root` with a documented contrast table (DESIGN.md 2.3). References duplicate
  light/dark blocks or are light-only (RIV is light only by brief).
- **Colour discipline**: one accent, game colours only as dots, rules and icons; status never colour alone.
- **Touch targets**: 48px public and 56px counter. References use 44px (RIV `.cu-row a` padding) or less.
- **Theme switch**: labelled Light | Dark pill with `aria-pressed`; VFW's FAB is icon-only and floats over content.
- **Event card anatomy**: stat box seats, cost pip, state variants (full, waitlist, cancelled, needs players), each with
  icon + words. VFW/RIV event cards are content cards with no live seat state.
- **Open-now strip**, **this-week chips with counts**, **sticky day headers** with a bracket for simultaneous starts.
- **Admin counter UX**: undo on every toast, steppers, check-in roster, preview with `inert`, shared dialog helper,
  in-browser `tests.html` suite.
- **Motion budget**: fewer moving parts than RIV/MAD (no hover lifts, reveals, zoom-ins); that is what D28 asked for.
- **Concept bar** (`.demo`) clearly separates prototype scaffolding from the real site.

## Suggested order

1. Prototype now (all S): bottom bar (A), view transitions (B), print (C) + "Print this week" button, `viewport-fit=cover`,
   font preload, `prefers-reduced-motion` safety net (E), eyebrow rule (D), `prototype/404.html`, line-clamp on `.ev-text`.
2. Desktop build: canonical/og:url/manifest, Archivo fallback metrics (F), richer 404, JSON-LD cancelled status and
   subtype, store-wide alert banner, webcal subscribe link, Help view, Lighthouse gate, mobile sheet only if nav grows.
3. Only on owner request: printable flyer page, email list, photo cycling.

Open dependency: the Call button needs the store's phone number; not in the repo. Add it to OWNER-QUESTIONS.md if absent.
