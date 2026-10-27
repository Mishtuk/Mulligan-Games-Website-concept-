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

### D16. Each event date gets its own page with Event JSON-LD; no anchor-only details (2026-10-26)
Replaces P2.3's "or anchors". Every upcoming occurrence is a server-rendered page (URL as `DESIGN.md` section 7:
`/events/<series-id>?date=YYYY-MM-DD`, with a self-canonical link that includes the date) carrying one Event JSON-LD
(offers, location, `eventStatus`). A `sitemap.xml` lists them. The prototype keeps its `#e-<key>` dialog.
**Why:** Google needs one crawlable URL per event and ignores multi-event list pages; recurring events are marked up per
date (`feature-ideas.md` section 4, takeaway 1). Cancels must flip to EventCancelled from admin, which only a live page can.

### D17. Event tags and seat-release time (extends D7) (2026-10-26)
Event series gain: beginner friendly (y/n), age (all ages / text note), play style (casual / competitive, mainly
Commander), seat-release time ("arrive by"). Shown on card, event page and sign-up reply. Commander brackets, entry rules
and "loaner decks" go in the existing description, not new fields. No separate public kit counter: for prereleases the
capacity is the kit count, so "seats left / sold out / waitlist" already answers it; P2.5 warns when reserved > on hand.
**Why:** players' top questions are "is it for beginners / kids", "casual or tuned", "is it sold out", "can I just show up"
(`feature-ideas.md` sections 2, 2c); owners lose seats to no-shows (section 3). Four fields, no new screens.

### D18. Publish everywhere by copy text, not integrations (2026-10-26)
Each event date has a "Copy post text" button (title, day, start and end time, fee, sign-up mode, page link) the owner
pastes into Facebook, Discord, Google Business Profile and the Wizards locator. No GBP / Facebook / Wizards APIs or
auto-posting; listings and GBP are the owner's to edit. A Discord webhook stays in "Not now" (Q7).
**Why:** owners post to five places (`feature-ideas.md` takeaway 5); GBP event posts need start and end times or show
as 24 h (section 4); posting to store accounts needs the owner, and APIs add keys and upkeep for one store.

### D19. P1.2 coder's open calls, confirmed (2026-10-26)
(1) Reserved stock looks ahead 14 days by default, with a 7 / 14 / 30 / 60 selector; a weekly event counts once per
date in the window (twice in 14 days). (2) "Paid" on Today counts every settled player: at the door, online elsewhere,
comped and store credit; the per-method split stays on the roster and in results. (3) Store info stays out of admin
nav until P2.3 builds the store-facts editor. (4) The weekly-nights list runs Monday to Sunday, like the hours table.
**Why:** 14 days covers the next two weeks of draft nights plus an upcoming prerelease without inflating "short";
"Paid" answers "who still owes?" at the counter; no nav item for a screen that doesn't exist; one week order site-wide.

### D20. No HTML injection: how the build renders data (2026-10-26)
Owner rule, for P2.2 onward. Server pages: Astro `{}` expressions only (they escape); `set:html` only on constant
markup or JSON-LD built with `JSON.stringify` and `<` escaped as `<`. Client JS: build DOM with `createElement` +
`textContent` / attributes; `innerHTML` / `insertAdjacentHTML` / `outerHTML` only with constant strings (no data,
escaped or not). Links from stored data go through one `safeUrl` (allow `https:`, `http:`, `tel:`, `mailto:`) on save
and on output. SQL is parameterised only (`?` placeholders), never built from strings. Keep the prototype's hostile-name
tests as build tests. The prototype is not changed: it is a throwaway concept, every value goes through `MG.esc` /
`MG.safeUrl`, and its injection tests pass; nothing is copied from it into the build without converting to the above.
**Why:** escaping inside `innerHTML` strings works until one value is missed (P1.3 found two); text APIs can't miss.

### D21. Mediator: coder vs designer on age, arrive-by and copy text (2026-10-26)
Sides: the coder's `events.js` (`ageMin` integer, `arriveBy` clock time, copy text with "UPDATED:" / "CANCELLED:" and
"fee to be confirmed") against DESIGN.md §15.1-15.3 (`ageNote` + `kidsWelcome`, `arriveByMins`, "Changed" tag and the
§15.3 template). Both agree on `beginnerFriendly` and `playStyle`; those stay as they are.

1. **Age: designer's `ageNote`.** `ageNote` is a string up to 60 characters, or null; `kidsWelcome` is "All ages".
   Coder: in `src/lib/events.js` remove `ageMin` from `INTS`, from `clean()` and from the copy-text tags; validate
   `ageNote` (null or 60 characters or fewer after collapsing whitespace); `clean()` stores it trimmed and as null when
   `kidsWelcome` is true. Update the age asserts in `test/events.test.js`.
2. **Arrive by: designer's `arriveByMins`.** Integer 0, 5, 10, 15 or 30, or null; kept only when `signup` is `here` or
   `counter`. Coder: in `src/lib/events.js` remove `arriveBy` from `TIMES` and the start check in `validate()`; validate
   `arriveByMins` against that list; `occurrences()` adds `arriveBy` per date (start minus mins; null without a start or
   mins), so a one-date start change moves it. Update the arrive-by asserts in `test/events.test.js`.
   Designer: no change.
3. **Copy text: designer's §15.3 template, and "Changed", not "UPDATED".** Title with no prefix; "Changed: {note}" line
   (or the §15.3 server sentence) on a changed date; "Cancelled: {title}" in sentence case with the §15.3 layout and
   "Next one:"; "Entry $20" / "Free entry" (line left out when the fee is null); sign-up lines by mode; link
   `<baseUrl>/events/<id>?date=` kept. No tags line and no arrive-by line; missing values are left out, not
   "to be confirmed". Coder: rewrite `copyText()` in `src/lib/events.js` to that template and update its asserts in
   `test/events.test.js`. Designer: add one sentence to DESIGN.md §15.3 saying the post text has no tags or arrive-by
   line (D17 names the card, event page and sign-up reply only).

**Why:** the owners' words ("13 and up", "kids with a parent") fit `ageNote` and an integer ages cannot; a fixed clock
time would print the old seat-release time after a one-date start change, which breaks the sign-up promise. The §15.3
template is the wording the admin and public pages are already specified to use, so the post reads the same everywhere
and players see one message. The changes are local to `events.js` and its tests; the designer's fields and text are
already written.
Boss overrule: none.

### D22. P1.3b and P2.2a review calls (2026-10-26)
Design (P1.3b, DESIGN.md section 15): (1) "No-show" takes the payment control's place on a roster row until check-in,
confirmed (keeps the 768 row on one line; nobody pays before they arrive). (2) The card tag "Updated" is renamed
"Changed" and the roster tab "Cancelled" becomes "Cancelled and no-shows", accepted (one word for one thing, matches
the page banner, D21 and the post text). (3) No default arrive-by time; Q8 now asks the owners for one.
Code (P2.2a): (4) `inviteOnly` is a validated series boolean and prints "Invite only." in the post text, accepted.
(5) The external sign-up line is always "Sign up online: {link}"; no `cta` field (15.1 adds none; 15.3 updated).
(6) A changed date with no note gets a server sentence (new time, seats, or "Moved from ..."), accepted. (7) `safeUrl`
accepts `localhost` hosts: accepted. Stored links are only ever shown as links, never fetched by the server, so a
localhost link can't reach anything the clicker's own browser couldn't, and the dev `PUBLIC_URL` needs it. (8) One-date
exceptions are keyed by the original date and a move is limited to 60 days, accepted (keeps "Bring it back" a single
delete and the expansion window bounded). (9) The seed loads once, guarded by a kv flag, so deleted events don't come
back, accepted. (10) Stored text keeps going through the shared `text()` cleaner, which drops anything between `<`
and `>`; DESIGN.md 15.2 changed to say so (defence in depth on top of D20, not instead of it).
**Why:** each call either follows the signed-off spec or is the smaller option with no loss for owners or players.
