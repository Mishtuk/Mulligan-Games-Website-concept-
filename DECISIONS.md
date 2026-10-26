# Decisions

Rulings by the boss (after the mediator when there was a disagreement). Newest at the bottom. Each has a date, the
ruling, and why. Change a ruling by adding a new entry that replaces it, not by editing the old one.

Sources cited: `pub` = `docs/research/mulligan-public.md`, `sites` = `docs/research/stores-and-sites.md`,
`tools` = `docs/research/event-and-inventory-tools.md`.

---

### D1. Events lead the front page (2026-10-26)
The home page opens with today's hours / open-now and "This week at Mulligan" (next 7 days, grouped by day, filterable
by game). Retail comes after.
**Why:** about 20 events in 9 days (pub, takeaway 1); every store site that buries events behind a shop menu is a
worse example (sites, takeaway 1 and "mistakes").

### D2. Link out to official tools; we are not a tournament engine (2026-10-26)
No pairings, standings or match reporting. Each event has a "tool" field (EventLink / Companion, Play! Pokemon,
KONAMI NEURON, Bandai TCG+, Ravensburger Play Hub, PlayRiftbound, Melee, BCP, TopDeck, other) with a URL and/or event
code, shown to players and staff.
**Why:** sanctioned results must go through the publisher tools anyway, and they change often (Riftbound platform swap,
BCP/Melee merger, NEURON mandate, Spicerack shutdown claim) (tools, principle). The store already uses EventLink and
TopDeck (pub, takeaway 5).

### D3. No online payment without the owner's approval (2026-10-26)
Sign-up defaults to "pay at the store". Staff record payment status by hand: at the door / paid online elsewhere /
comped / store credit. If online payment is approved later, it is an external link per event (Square/Stripe/PayPal
payment link or the TopDeck/Melee page), and no card data touches our server (same rule as the VFW shop).
**Why:** brief (costs money / handles money: ask first); tools takeaway 4; sites takeaway 4 (don't force a cart for
pay-in-store events).

### D4. cEDH gets its own section and brand strip (2026-10-26)
A cEDH page and a front-page strip: Mulligans Championship Series (monthly), 5K cEDH, Redemption, the invitational,
charity events; prize line, proxy rule (10 max, judge-approved), parking note, TopDeck registration and standings
links, results archive. We do not recompute circuit points: TopDeck owns standings; we link to them.
**Why:** cEDH is the store's identity (40-120 players per event, HSOY self-description) and no other store site gives
it a section (pub, takeaway 2; sites, takeaway 5). Duplicating TopDeck's points would drift out of sync.

### D5. No player accounts; a short sign-up form (2026-10-26)
Name, email or phone (one required), optional player ID (Companion / Play! Pokemon / Bandai / Konami), honeypot and
rate limit. Confirmation on screen; email confirmation only once SMTP exists.
**Why:** sites takeaway 4; accounts add passwords, resets and privacy load the owners won't use. VFW volunteer sign-up
already has this shape.

### D6. Capacity with waitlist and auto-promote; check-in at the counter (2026-10-26)
Events can be walk-in only, pre-register here, or sign up externally. Pre-register events have a cap, an optional
cutoff and a waitlist that promotes the next person automatically when a seat frees up. Staff check people in and add
walk-ins from the admin "Today" screen.
**Why:** real caps of 16 and 28 (pub, takeaway 9); waitlist/check-in is what TopDeck and Spicerack built (tools,
takeaway 3); on-time start is why players choose a store (tools, section 3).

### D7. Data model, high level (2026-10-26)
- **Store:** name, address, phone, email, weekly hours, date overrides (closed / special hours / note), links
  (Discord, TopDeck, Wizards locator, Patreon, X, Instagram), parking note. Edited once in admin, shown everywhere
  (header strip, visit block, JSON-LD, .ics location).
- **Game:** fixed list in code (id, name, short label, colour token, icon, formats); admin toggles which are shown.
- **Event series:** title, game, format, kind (open play / weekly tournament / prerelease / league / learn to play /
  special or charity / cEDH series), recurrence (none / weekly / monthly / Nth weekday, as VFW), start / end, fee,
  capacity, sign-up mode (walk-in / here / external), cutoff, tool + URL + code, prize note, what to bring,
  description, cEDH series tag, Warhammer fields (points, round length, list deadline), featured, enabled.
- **Date exception:** series + date: cancelled / moved / changed capacity or time / note. A one-off event is a series
  with no recurrence.
- **Registration:** series + date, name, contact, player ID, status (in / waitlist / cancelled / no-show), waitlist
  position, checked in, payment status, created at. Contact details purged after the event (retention set in P2.4).
- **Result:** series + date, headcount, placings (names as typed), prizes given, reported-to-publisher flag, public y/n.
- **Product:** name, category (sealed / singles lot / accessory / miniature / paint / other), game, optional
  SKU/barcode, low-stock threshold, optional price for display, enabled.
- **Stock move:** product, +/- qty, reason (received / sold / counted / event use / prize / adjust / preorder pickup),
  linked event date, who, when. On hand = sum of moves (cached).
- **Event product use:** series -> product, qty fixed or per seat (e.g. draft 3 boosters per seat, prize packs fixed).
  "Reserved" = use for upcoming dates.
- **Preorder:** product, customer, contact, qty, deposit, status (waiting / arrived / picked up / cancelled).
- **Store credit:** pending Q4 / Q6: either a ledger (player, +/- amount, reason, event) or only a "credit issued in POS"
  note on the result.
**Why:** tools takeaways 2-8 (store-side calendar, sign-ups, money, stock, tool links, results); VFW already stores
events with this recurrence model and sign-ups with slots, so the shape ports cleanly.

### D8. Inventory scope: event-relevant stock, not a POS (2026-10-26)
Track counts for sealed product, accessories, miniatures and paints, with low-stock alerts, preorders and stock
reserved by events. Singles are at most a lot-level count or a link to the store's POS/TCGplayer. No pricing engine,
buylist, barcode printing or TCGplayer sync.
**Why:** tools ("link or hand off"): BinderPOS / SortSwift / Shopify apps do singles; the gap no one covers is "this
prerelease needs 6 boxes" and prize payouts tied to events.

### D9. Reuse the Warminster VFW stack (2026-10-26)
Astro static pages + `server.js` (Node 22 built-ins, `node:sqlite`) with HTML markers for live data, the VFW admin
shell, auth, security log, backups, CSP and tests. Copy-as-is / adapt / leave-behind list is in `PLAN.md` Phase 2.
**Why:** brief (reuse first); the VFW site is feature-complete, hardened by an audit and red-team test, and already
has events with recurrence, .ics, JSON-LD, sign-ups with slots and an open-now badge.

### D10. Phase 1 is a static prototype; the Desktop may port the base in parallel (2026-10-26)
The concept is plain HTML/CSS/JS in `prototype/` that opens from disk (the Laptop has no Node). Phase 2 task P2.1
(porting server, auth, security, backups: no user-facing UI) may start before `DESIGN.md` is done; every UI task waits
for `DESIGN.md` sign-off.
**Why:** keeps both machines busy without building UI ahead of the design (boss rule).

### D11. Public pages are server-rendered and the calendar feed is live (2026-10-26)
Events render as HTML (no JS-only calendar); chips and dialogs enhance. The `.ics` feed is generated by the server so
admin edits and cancellations appear (VFW's build-time `.ics` misses them). Repeating nights appear once, collapsed.
**Why:** sites "mistakes" (JS-only calendars, duplicated recurring events); sites takeaway 8 (add-to-calendar is table
stakes); the VFW ponytail note in `events.ics.ts`.

### D12. Store facts are not guessed in public (2026-10-26)
The concept uses the research values and marks unconfirmed ones (address 455 vs 445 York Rd, email, Discord invite).
Nothing goes public until the owner confirms them; then the site is the canonical source and the Wizards locator listing
should match it.
**Why:** pub takeaway 3 and identity section (conflicting sources); sites, WPN Premium note (keep listings identical).

### D13. Branding and photos (2026-10-26)
The store's logo and Facebook photos may be used locally as reference (`source/fb/`, git-ignored). Nothing of theirs
or of other stores is committed or deployed without written permission. The concept uses a placeholder wordmark.
**Why:** brief constraints.

### D14. Game chips are the main control; Warhammer, Riftbound, Hololive have lanes (2026-10-26)
Chips: Magic, cEDH, Pokemon, Warhammer, Riftbound, Hololive, Other (admin can enable more, e.g. One Piece, Lorcana,
Yu-Gi-Oh!). Warhammer events carry points, round length, list deadline and a BCP link, but there is no league page
until the owner confirms they run 40k (Q5). New games show as dated "coming soon / preorder" tiles.
**Why:** sites takeaways 2, 6, 7; pub "Games and products" (Warhammer claimed but no events found; Riftbound, One Piece,
Hololive planned).

### D15. One recurrence shape: nested `recurrence` (2026-10-26)
Seed, prototype and the P2.2 schema use `recurrence: { type: none | weekly | nth | dates, ... }` (D7's "as VFW" meant
the behaviour, not the flat fields). The flat VFW `date + recurring` model can't express multi-date blocks (prerelease
slots, RCQ dates). P2.2's `events.js` expands the nested shape directly; the adapter in `test/content.test.js` is
deleted then.
**Why:** one model, no adapter in production; the flat model loses the `dates` case.
