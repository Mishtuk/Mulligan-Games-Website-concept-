# Mulligan Games website: plan

Owner of this file: the boss. Goal: `BRIEF.md`. Rulings: `DECISIONS.md`. Open questions: `OWNER-QUESTIONS.md`.
Last updated 2026-10-26.

**Order of work:** Phase 1 gives the owners something to click through (a concept, no server). Phase 2 builds the
real site on the Desktop by copying the Warminster VFW site. Phase 3 is polish and owner review. Within each phase,
take tasks top to bottom. A task with an unfinished "needs" waits; everything else can run in parallel.

**Owners:** Laptop designer (Opus) / Laptop coder-prototype (plain HTML/CSS/JS, no Node) / Desktop coder (Node, Astro,
tests) / Desktop researcher (Chrome with sign-ins). The boss reviews each task against its "done when" before it closes.

**Gates (from boss.md):** nothing is designed before its research is in `docs/research/`; nothing is built before
`DESIGN.md` covers it. Anything that costs money, publishes, or contacts the store goes to Mish first.

---

## Phase 0: research already in flight (Desktop)

### R1. Facebook research (issue #3)
- **Owner:** Desktop researcher. **Files:** `docs/research/mulligan-facebook.md`, `source/fb/` (local only, git-ignored).
- **Done when:**
  - [ ] Hours, weekly schedule, games and formats run, prices, Warhammer evidence (or none), tone of voice, logo and
        photo inventory are written with "saw" vs "judgement" marked, like `mulligan-public.md`.
  - [ ] It says which of the open questions in `OWNER-QUESTIONS.md` Facebook answers (address, Discord, email,
        Warhammer, Pokemon league) and which it doesn't.
  - [ ] Logo and best room/table photos are saved under `source/fb/` with a list in the doc (local reference only).
- **Plan around it:** the designer starts now with a placeholder wordmark and provisional colours; R1 feeds task P1.4.

### R2. Chrome screenshot pass (issue #5)
- **Owner:** Desktop researcher. **Files:** `docs/research/screenshots/` (or as #5 says) + a short notes section.
- **Done when:**
  - [ ] Phone and desktop screenshots of the reference sites the store study could not render (Game Kastle, Mox,
        Dreamers Vault Events, Hairy T events, Pandemonium; plus the Wizards locator page for store 15986).
  - [ ] A few lines per site on colour, type, photo use and mobile behaviour (the "not observed" gaps in
        `stores-and-sites.md`).
- **Plan around it:** the designer locks layout and components first; visual style is provisional until P1.4.

---

## Phase 1: concept the owners can click through (Laptop)

Static prototype in `prototype/`: plain HTML/CSS/JS that opens from disk (`file://`), no build, no server, no CDN
scripts. Sample data comes from the research (the Wizards schedule for Oct 28 - Nov 5 2026, the cEDH Championship
Series / 5K / Redemption dates). Four screens: front page, events page, admin events, admin inventory.

### P1.1 Design spec + front page prototype
- **Owner:** Laptop designer. **Files:** `DESIGN.md`, `prototype/index.html`, `prototype/css/tokens.css`,
  `prototype/css/site.css`, `prototype/data/sample.js`.
- **Needs:** research in `docs/research/` (done). Not blocked by R1/R2 (see brief at the end).
- **Done when:**
  - [ ] `DESIGN.md` covers: tokens (colour light + dark, type scale, spacing, radius, game colours each paired with an
        icon or label), layout per screen (front page, events page, event detail, admin Today/check-in, admin events
        list + editor, admin event roster, admin inventory, admin preorders), components with all states (event card:
        open / few seats / waitlist / full / cancelled / free / walk-in only / external sign-up), loading / empty /
        error states, phone-first breakpoints, and where it follows or departs from the VFW admin and why.
  - [ ] `prototype/index.html` opens from disk on a phone-width and a desktop window, light and dark, and shows: open-now
        strip (today's hours, address, phone), "This week at Mulligan" grouped by day with game chips that filter, the
        cEDH strip, coming-soon / preorder tiles, visit block (hours table, parking note), Discord / community, footer.
  - [ ] `prototype/data/sample.js` sets one global (e.g. `window.MG_SAMPLE`) with store info, games, event series
        (recurring + one-off), a few registrations and inventory items, shaped like the data model in `DECISIONS.md` D7.
  - [ ] No owner logo or Facebook photos are committed (placeholder wordmark; photos referenced from `source/fb/` only
        if they exist locally, with a visible fallback).
  - [ ] Contrast checked (WCAG AA) for text and status badges in both themes; status never by colour alone.

### P1.2 Events page + admin screens prototype
- **Owner:** Laptop coder-prototype. **Files:** `prototype/events.html`, `prototype/admin/index.html` (Today),
  `prototype/admin/events.html`, `prototype/admin/inventory.html`, `prototype/js/*.js`, `prototype/css/admin.css`.
- **Needs:** P1.1 (`DESIGN.md` covers these screens; reuse its tokens and `sample.js`).
- **Done when:**
  - [ ] Events page: game chips + format filter, list grouped by day, recurring nights collapsed ("Every Friday 7 PM",
        next date), event detail (fee, cap, seats left, what to bring, official tool link / event code, prize note),
        sign-up dialog (name, email or phone, optional player ID, "pay at the store") that shows "You're in" or
        "You're on the waitlist (#3)", and "Add to calendar" that downloads a valid `.ics` built in the browser.
  - [ ] Admin Today: tonight's events with a counter check-in list (tap to check in, mark paid: at the door /
        online elsewhere / comped / store credit), walk-in add, waitlist auto-promotes when someone cancels.
  - [ ] Admin events: Coming up / Already happened lists; "New event" from a template (game + format fill fee, cap,
        times, tool link); repeat weekly / monthly / Nth weekday; skip or cancel one date of a repeating event;
        results entry (headcount, winner / top 8, prizes given, "reported to Wizards/TopDeck" tick).
  - [ ] Admin inventory: products by category and game, on-hand count with +/- and "count now", low-stock filter and
        badge, "reserved for events" (from event product use, e.g. draft = 3 boosters x seats), preorders list
        (customer, qty, deposit, status: waiting / arrived / picked up).
  - [ ] All state is in memory with optional `localStorage` (wrapped in try/catch) and a "Reset demo data" button.
  - [ ] Works at 360px, 768px (tablet at the counter) and 1280px; keyboard reachable; no console errors.

### P1.3 Designer review of the prototype
- **Owner:** Laptop designer. **Files:** `DESIGN.md` (fixes), prototype fixes, a short review list on the task issue.
- **Needs:** P1.2.
- **Done when:**
  - [ ] Every screen checked against `DESIGN.md` at three widths and both themes; deviations either fixed or the spec
        updated with the reason.
  - [ ] Boss signs off against P1.1 and P1.2 "done when".

### P1.4 Fold in Facebook + screenshot findings
- **Owner:** Laptop designer. **Files:** `DESIGN.md`, `prototype/css/tokens.css`, `prototype/data/sample.js`.
- **Needs:** R1 and R2 (whichever has landed; do it twice if they land apart).
- **Done when:**
  - [ ] Real schedule, hours and tone from R1 replace guesses in `sample.js`; any conflict with `mulligan-public.md`
        is noted in `OWNER-QUESTIONS.md`, not silently picked.
  - [ ] Colour and type decisions cite R2 / R1 (store's own look, what reference stores do well); `DESIGN.md` says
        what changed.

### P1.5 Owner click-through pack
- **Owner:** Laptop designer (writes), Mish (decides how to show it).
- **Files:** `prototype/README.txt` (how to open, what to try, what is fake).
- **Needs:** P1.3 (and P1.4 if R1 has landed).
- **Done when:**
  - [ ] A one-screen "what to click" list: find Friday's draft, sign up, get waitlisted; at the counter check people in;
        make next month's prerelease from a template; see the low-stock alert after the prerelease reserves boosters.
  - [ ] The questions from `OWNER-QUESTIONS.md` that the click-through should answer are listed at the bottom.
  - [ ] Mish has said how the owners see it (zip, his laptop, or a GitHub Pages preview: publishing needs his OK).

---

## Phase 2: the real site on the Desktop (copy the Warminster VFW site)

Local clone of the base: `C:\Users\alexm\projects\Warminster-VFW-website-` (Astro 7 static build + `server.js` on
Node 22 built-ins + `node:sqlite` + nodemailer). Build at this repo's root (`package.json`, `src/`, `server.js`,
`test/`); `prototype/` stays as the concept. Every rule with logic gets a `node --test` test.

### What to take from VFW

| Copy as-is (rename `vfw` to `mg`) | Adapt | Leave behind |
|---|---|---|
| `src/auth.js` (scrypt login, backoff, signed `__Host-` session, session version, startup checks) | `src/lib/state.js`: keep `occurrences()` / `expand()` (weekly, monthly, Nth weekday), `esc`/`text`/`para`, `isDate`/`isTime`, `etDay`, `anchorOf`/`eventHref`, `injectMarkers` + data script; replace `validateEvent` and the renderers with game/format/fee/capacity/tool-link versions | Beer taps, food menu, drink specials, hall inquiry/booking, help requests, youth, honor, VA news feeds, hero video and photo bank |
| `src/audit.js` (security log) + Security log admin view | `src/lib/bar-hours.js` to `store-hours.js` (same midnight-close and open-now logic; add holiday / date overrides) + `TodayHours.astro` and `bar-status.ts` as the open-now strip | `event-photos.js` title rules (use game banners instead) |
| `src/db.js` kv helpers, `backup()`, `scripts/backup.mjs` / `restore.mjs` | `src/lib/post.js` + Admin "Post details" + `src/site-build.js` rebuild-and-swap, for store facts (address, phone, hours, links, parking) | `/support` donate, `/join` |
| `server.js` core: static serving, CSP with per-page script hashes, compression, ranges, `readBody` caps, same-origin CSRF check, rate limits, honeypot `publicForm`, login/logout, photo upload (WebP check, sharp re-encode) | Volunteer shifts + sign-ups (`validateShift`, `validateSignup`, `shift_signups`, `shiftsWithCounts`, retention purge): the template for event registration with capacity; add waitlist, auto-promote, check-in, payment status | |
| `src/stats/index.js` + dashboard view | Shop orders (pay at pickup, retention, admin Orders view): the template for preorders | |
| `ThemeFab.astro`, `Lightbox.astro`, admin shell helpers (`toast` with Undo, `ask`, `api`, `fld`/`markErr`, `renderCrud`, unsaved-changes bar, leave warning, phone menu) | `src/lib/jsonld.js`: LocalBusiness to `HobbyShop`, Event with offers (fee), capacity, `eventStatus` for cancellations | |
| Tests: `auth`, `security`, `backup`, `photo-base`, `server` (trim to what remains), `state` recurrence cases | `src/pages/events.ics.ts` (static, misses admin edits) to a server route: one feed, per-game feeds, per-event `.ics` | |
| CI (tests, `npm audit`, CodeQL), `docs/backups.md`, launch security checklist in VFW `HANDOFF.md`, `docs/azure.md` (if hosting is Azure) | Hall bookings month grid: admin month view of events | |

### P2.1 Port the base (no UI yet)
- **Owner:** Desktop coder. **Files:** `package.json`, `astro.config.mjs`, `server.js`, `src/auth.js`, `src/audit.js`,
  `src/db.js`, `src/stats/`, `scripts/backup.mjs`, `scripts/restore.mjs`, `test/`, `.github/workflows/`, `.gitignore`.
- **Needs:** this plan approved by Mish. Not gated on `DESIGN.md` (no user-facing UI); start after R1/R2.
- **Done when:**
  - [ ] Fresh `npm install && npm test` passes; `node server.js` serves a placeholder home and `/admin` sign-in with
        `ALLOW_DEFAULT_ADMIN=1` on a temp `DATA_DIR`.
  - [ ] Everything in the "Leave behind" column is gone (no dead routes, tables or tests); no `vfw` names left in code.
  - [ ] Security log, rate limits, CSP and backups work as in VFW (their tests pass).

### P2.2 Events data and admin
- **Owner:** Desktop coder. **Files:** `src/lib/events.js` (from `state.js`), `src/lib/games.js`, `src/db.js`,
  `server.js` (admin API), `src/pages/admin.astro`, `test/events.test.js`.
- **Needs:** P2.1, `DESIGN.md` admin events sections (P1.3 signed off).
- **Done when:**
  - [ ] Event series per `DECISIONS.md` D7 (game, format, kind, fee, capacity, sign-up mode, tool link + code,
        Warhammer fields, cEDH series tag) with server-side validation and errors under the field.
  - [ ] Templates: picking game + format pre-fills; staff can save their own template.
  - [ ] Recurrence reuses `occurrences()`; one date can be cancelled, moved or given a note without touching the series.
  - [ ] Tests: recurrence (incl. 5th-weekday and DST weeks), one-date exception, validation rejects.

### P2.3 Public front page + events page
- **Owner:** Desktop coder. **Files:** `src/pages/index.astro`, `src/pages/events.astro`, `src/pages/events/[id]`
  (or anchors, per `DESIGN.md`), `src/components/*`, `src/styles/global.css`, `src/lib/store-hours.js`,
  `src/lib/jsonld.js`, server `.ics` routes, `test/hours.test.js`, `test/ics.test.js`, `test/jsonld.test.js`.
- **Needs:** P2.2, `DESIGN.md` front + events sections.
- **Done when:**
  - [ ] Matches the signed-off prototype at 360 / 768 / 1280, light and dark; pages render server-side (work without JS;
        chips enhance).
  - [ ] Admin edits appear on the public pages without a rebuild (markers), including cancellations.
  - [ ] Open-now strip correct across midnight closes and holiday overrides (tested).
  - [ ] `.ics` feed and per-event files include admin edits and exceptions (tested); JSON-LD validates (tested).

### P2.4 Sign-ups, waitlist, check-in
- **Owner:** Desktop coder. **Files:** `src/lib/registrations.js`, `src/db.js`, `server.js`, `src/pages/admin.astro`
  (Today + roster views), event detail form, `test/registrations.test.js`.
- **Needs:** P2.3.
- **Done when:**
  - [ ] Public form (no account): name, email or phone, optional player ID; honeypot, rate limit, origin check as VFW.
  - [ ] Capacity, cutoff, waitlist with auto-promote on cancel or staff removal; "You're on the waitlist (#n)" reply.
  - [ ] Admin Today: check-in, walk-in add, payment status (at door / online elsewhere / comped / store credit).
  - [ ] Contact details deleted N days after the event (N decided in `DECISIONS.md`); counts kept; privacy page says so.
  - [ ] Tests: capacity edge (last seat), double sign-up, promote order, cancel after check-in, retention purge.

### P2.5 Inventory
- **Owner:** Desktop coder. **Files:** `src/lib/inventory.js`, `src/db.js`, `server.js`, `src/pages/admin.astro`
  (Inventory + Preorders), `test/inventory.test.js`.
- **Needs:** P2.2 (event product use), `DESIGN.md` inventory sections, owner answer on POS (OWNER-QUESTIONS Q4).
- **Done when:**
  - [ ] Products with on-hand from stock moves (receive, sale, count, event use, prize, adjust); low-stock threshold
        and alert list on the admin home.
  - [ ] Event product use (fixed or per seat) shows "reserved" for upcoming dates and warns when reserved > on hand.
  - [ ] Preorders: customer, qty, deposit, status; "arrived" lists who to call.
  - [ ] CSV export of products; CSV import only if the owner's POS can export (Q4).
  - [ ] Tests: count math, reservation math, low-stock trigger, preorder status flow.

### P2.6 Results and prizes
- **Owner:** Desktop coder. **Files:** `src/lib/results.js`, `server.js`, `src/pages/admin.astro`, `test/results.test.js`.
- **Needs:** P2.4.
- **Done when:**
  - [ ] Per date: headcount (from check-ins, editable), winner / top N, prizes given (linked to stock moves), a
        "reported to the publisher tool" tick, and a reminder list of unreported events.
  - [ ] Store credit: as decided after Q4/Q6 (ledger here, or "issued in POS" note only).
  - [ ] Public results archive for tournaments that opt in.

### P2.7 cEDH section
- **Owner:** Desktop coder. **Files:** `src/pages/cedh.astro`, `src/lib/events.js` (series tag), components.
- **Needs:** P2.3, `DESIGN.md` cEDH section.
- **Done when:**
  - [ ] Next Championship Series / 5K / Redemption dates from the event data, prize line, proxy rule, parking note,
        TopDeck registration and standings links, results archive. No points maths on our side (D4).

---

## Phase 3: polish and owner review

### P3.1 Content fill
- **Owner:** Desktop researcher. **Files:** seed files under `src/content/`, `docs/research/` updates.
- **Needs:** R1. Start now from `docs/research/mulligan-facebook.md` (issue #6); owner answers to Q1-Q3 fill the gaps later.
- **Done when:** [ ] the real weekly schedule, hours, address, phone, links and current one-offs are seeded, each
  traced to a source or an owner answer.

### P3.2 Quality pass
- **Owner:** Desktop coder. **Files:** as needed.
- **Done when:** [ ] mobile Lighthouse performance 90+ and accessibility 100 on home and events (VFW's bar);
  [ ] `npm test`, `npm audit`, CodeQL clean; [ ] works with JS off for public pages.

### P3.3 Design review of the build
- **Owner:** Laptop designer (screenshots taken by Desktop researcher in Chrome).
- **Done when:** [ ] a fix list comparing build vs `DESIGN.md` per screen, each item filed as a Desktop task or closed.

### P3.4 Owner walkthrough and one feedback round
- **Owner:** Laptop designer (script), Desktop coder (fixes). Mish runs the session; contacting the store needs his OK.
- **Done when:** [ ] owner feedback recorded in `DECISIONS.md` or `OWNER-QUESTIONS.md`; [ ] the boss scopes the fixes
  into tasks (anything new goes to "Not now" unless it serves the goal); [ ] fixes merged and tested.

---

## Not now (cut or later, with the reason)

- **Online entry payments** (Stripe / Square / Melee payments): needs owner approval and money handling (D3). Later: an
  external payment link per event, VFW-shop style, nothing touching our server.
- **Pairings, standings, match reporting:** official tools own this (D2).
- **Pulling data from TopDeck / Melee APIs:** check their terms first; links are enough for launch.
- **Singles pricing, buylist, TCGplayer sync, barcode labels, POS:** BinderPOS-class tools do this (D8).
- **Player accounts / logins, loyalty points:** a short sign-up form is enough (D5).
- **Discord bot.** A webhook that posts the weekly schedule is a cheap later add once Q7 is answered.
- **Email newsletter / text reminders:** later; needs SMTP or a provider (costs money).
- **Webstore / shopping cart.**
- **Warhammer league page** with seasons and lists: fields only until the owner confirms they run 40k (Q5).
- **In-store TV screen** (VFW `/tv`) and **printable weekly flyer** (VFW `/events/flyer`): good cheap reuses for after
  launch, not needed for the concept.
- **Private room / party booking, multiple stores, Spanish.**
- **Hosting, domain, deploy, Cloudflare Access:** owner decision and cost; VFW launch checklist applies when chosen.
- **Real logo and photos in any public deploy:** only with permission (Q12).

---

## Next: designer brief (hand this to the Laptop designer, Opus, high effort)

**Task:** P1.1 (then P1.3, P1.4, P1.5). Write `DESIGN.md` and the front page prototype. The coder-prototype builds the
other screens from your spec, so the spec must be exact enough to build without asking.

**Read first (do not redo this research):** `BRIEF.md`, `DECISIONS.md`, `OWNER-QUESTIONS.md`,
`docs/research/mulligan-public.md`, `docs/research/stores-and-sites.md`, `docs/research/event-and-inventory-tools.md`.
Use the `frontend-design` and `modern-web-guidance` skills. For admin patterns, skim
`C:\Users\alexm\projects\Warminster-VFW-website-\src\pages\admin.astro` (shell, toast with Undo, inline field errors,
Coming up / Already happened lists) and the VFW `HANDOFF.md` sections on the admin and hall calendar.

**Who it's for:**
- Players on a phone deciding "what's on tonight / this week, what does it cost, is there a seat". cEDH players who
  travel for the Championship Series and 5Ks. New players looking for Learn to Play.
- Owners and staff at the counter on a tablet, mid-event, with one hand: check people in, mark paid, see what's low.

**Identity:** a late-night local card shop (open till midnight Fri/Sat) whose brand is cEDH and community, in Warminster
PA. It must look like a place players want to go, not a Shopify theme or generic AI page. No logo or photos yet:
design a placeholder wordmark and make the photo slots work with and without real photos. Colours are provisional
until the Facebook research (issue #3) and screenshot pass (#5) land; say in `DESIGN.md` which tokens may change.

**Front page order:** open-now strip (today's hours, address, phone, directions) > "This week at Mulligan" grouped by day
with game chips (Magic, cEDH, Pokemon, Warhammer, Riftbound, Hololive, Other) > cEDH strip (next Championship Series and
5K, prize line, TopDeck link) > coming soon / preorders (Riftbound, One Piece, Hololive) > visit (hours table, parking:
not the RISE lot) > Discord and reviews > footer. Events are the page, not a nav item.

**Event card anatomy:** date block, time, game badge (colour + icon + text), format, fee ("Free" when 0), seats left,
one primary action. States: Open, Few seats, Waitlist, Full, Cancelled, Walk-in only, Sign up on TopDeck / Companion
(external). Repeating nights collapse to "Every Friday 7 PM" with the next date. Wed and Thu have two 7 PM events side
by side: make that read clearly.

**Admin screens to specify:** Today (counter check-in, the default screen), Events list + editor (template first:
pick game + format, the rest fills in; repeat rules; cancel one date), Event roster (registered, waitlist, checked in,
paid status, results, prizes), Inventory (on hand, +/-, count now, low stock, reserved for events), Preorders.
Plain words, no codes or jargon; big touch targets; errors under the field; Undo over confirm dialogs where safe.

**Must:** phones first (360px), tablet 768px for admin, desktop 1280px; light and dark; WCAG AA; status never by
colour alone; real loading, empty and error states; server-rendered first (the build is Astro static + server
markers, so design nothing that only works as a JS app). Self-hostable fonts only (the build's CSP blocks CDNs).

**Must not:** design payments, player accounts, pairings or a singles price engine (see "Not now"); copy other stores'
branding; commit the store's logo or Facebook photos.

**Deliver:** `DESIGN.md` (tokens, type, layout per screen, components and states, sample copy, VFW reuse/divergence
notes), `prototype/index.html`, `prototype/css/tokens.css`, `prototype/css/site.css`, `prototype/data/sample.js`.
Claim the files in `HANDOFF.md` first; commit as Mish; don't push without the boss's OK. Then post "Laptop: P1.1 done"
on the board with the screens checked.
