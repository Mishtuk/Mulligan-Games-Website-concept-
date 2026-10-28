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

### D23. P2.2b review calls (2026-10-26)
(1) Exceptions are keyed by day, so two slots on one day (seed prerelease Nov 8, 3 PM and 5 PM) share one cancel,
one change and one post text: a real data bug. Fix in P2.2b before P2.3/P2.4 build on the key: each occurrence gets
`slot` = `originalDate` for weekly / nth / one-off series and `originalDate + 'T' + start` (the slot's own start from
`recurrence.dates`) for "On these dates" series; the exception's `date` field and the DB `date` column hold that key
(no schema change); `validateException` accepts `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM` (60-day move check on the first 10
characters); `occurrences()` matches on the key; `/upcoming` returns `slot`; admin cancel / change / bring back /
copy send `o.slot`; `copyText` and `?date=` accept the key, and the P2.3 per-date page link uses it. Test: cancel the
3 PM slot, the 5 PM slot stays on and copies its own text. (2) Photo picker moves to P2.3 (events have no photo field,
D7; the first user is the room photo slot). (3) A series-specific editor replaces the generic `renderCrud` port.
(4) Game chips + search, colour band and live card preview move to P2.3 (the preview is the real P2.3 card); "Stock it
uses" to P2.5; roster-header copy and the 9.1 shell to P2.4. (5) Undo after "Cancel this date" only when the date had
no earlier change, accepted: undoing would mean restoring the old change, and "Change this date" does that by hand.
(6) Toast overlapping the save bar: fixed by the boss (toast lifts above the bar while it is on screen).
**Why:** (1) prereleases are the biggest events and the seed already has two slots on one day; the key is cheapest to
change before sign-ups and public URLs depend on it. The rest is either built on things that don't exist yet or rare.
Boss overrule: none.

### D24. P2.3a review calls; D20 on the server (2026-10-26)
(1) D20 clarified: server-rendered HTML outside Astro may use `render.js`'s `h` tagged template, the server twin of
Astro `{}`. Only the constant literal parts are markup; every `${}` value (strings, numbers, nested arrays) is
HTML-escaped, quotes included, so attributes are safe; `null` / `undefined` / `false` print nothing; only another `h`
result passes through. Links from data still go through `safeUrl`. The one raw door is `safe()`, allowed only on
`ldScript()` output (JSON with `<` escaped); a review greps `safe(` and `new Html(` (icons only). No `html()` helper,
no string-built markup. (2) CSP hashes come from the built page before `injectMarkers()`, never from the filled page,
so an escaping miss can't hash its own script (boss fix; injected parts are JSON / JSON-LD data blocks only).
(3) `?date=` and `?now=` must be real days in 2000-2999 (`realDay`): `2026-13-45` gave a 500 and `9999-12-31` broke the
date maths (boss fix, tested). Bad ids or dates give a titled `noindex` 404 with nothing echoed; the dateless redirect
only ever points at `/events/<id>?date=` (no open redirect). (4) The `?now=` test clock works only when
`NODE_ENV` is not `production`, the same switch as every other production guard; it only changes what time the page
shows (canonical, JSON-LD and caching are unaffected, `no-cache` everywhere). Deploy check in P3.2. (5) JSON-LD,
`.ics` and sitemap accepted as built (DST offsets, EventCancelled / EventRescheduled + previousStartDate, SoldOut from
seats, invite-only gets no Event, sameAs only non-null safe links, STATUS:CANCELLED with a stable UID). (6) Open items
accepted: Rich Results Test and the `robots.txt` Sitemap line wait for the domain (Q14, P3.2); store facts are read
at server start until P2.3b makes them editable.
**Why:** text APIs and an escape-everything tag can't miss a value; the rest are the smallest fixes that close real
500s and a CSP gap. Boss overrule: none.

### D25. P2.3b review calls (2026-10-26)
(1) Admin keeps its plain look; the DESIGN.md 9.1 shell stays in P2.4 (D23 confirmed). (2) The editor's live preview
mirrors render.js `card()` with DOM calls in a same-origin frame of `/new-here/` (no `srcdoc`, no `document.write`),
accepted: sharing would mean inserting an HTML string. Drift guard (boss): a test renders `card()` for every sign-up
kind and fails if any class or data attribute is missing from `pvCard`. Boss fixes found by it: the game badge lacked
its own `data-game` (icon showed the default colour) and an external sign-up with no link showed a button instead of
"Sign up online.". (3) Preview shows only the fresh "open" seat state, accepted (a form has no sign-ups yet).
(4) Holiday overrides are not in JSON-LD opening hours yet: deferred to P3.2 with the Rich Results Test
(`specialOpeningHoursSpecification`); the page strip and table already show them. (5) New `<!--mg:*-->` markers in
`Base.astro`, `index.astro`, `new-here.astro` beyond the claim, accepted: Desktop files, and "live without a restart"
needs them; each keeps its baked default. Injected parts are now server markup from `h` (D24 (1)); CSP hashes still
come from the template (D24 (2)) and the parts carry no inline script or style. (6) The icon SVG paths go in by
`innerHTML` / `new Html` from the `ICONS` constant only, never stored data (same as D24 (1)). (7) The room photo must
be one the picker offers (`pickablePhotos`), not any file on disk such as a `-800` thumbnail (boss fix, tested).
**Why:** each is the smaller option with no loss for owners or players; the test makes the copy safe to keep.
Boss overrule: none.

### D26. Players manage their own sign-up through a personal link (2026-10-27, owner)
- **Question:** P2.4 gap G2: how does a player cancel or check their place on the waitlist (`docs/review/p2.4-prep.md`)?
- **Ruling (Mish):** a personal link. The confirmation shows a private, unguessable link, also emailed when the player
  gave an email. It shows their seat or waitlist number and has a Cancel button, which frees the seat and promotes the
  next person on the waitlist. Staff can still cancel anyone in admin. No player accounts (D5 stands).
- **Build notes:** random token of at least 128 bits, stored hashed, compared in constant time; rate-limited; the page
  shows only that one sign-up; `noindex` and `Referrer-Policy: no-referrer`; the link stops working after the event.

### D27. Use the store's social photos and videos on the concept now (2026-10-27, owner)
- **Ruling (Mish):** don't wait for the store's permission (Q12/Q21). Pull photos, the logo and videos from Mulligan's
  Instagram, Facebook and other socials, commit web-ready copies to the repo (`prototype/img/`, `prototype/media/`)
  and use them on the live concept. Raw downloads stay local in `/source/social/`. Supersedes the "branding stays
  local" part of the earlier rulings and the DESIGN 6.1 note that video stays out of the public repo.
- **Also (owner):** the first look was too flashy (saturated red + navy) and lacked photos; the redesign uses a calmer
  palette, photo-led sections and a clearly labelled light/dark switch.

### D28. Look A, "Brick and sign", for the whole site (2026-10-27, owner delegated the pick)
- **Question:** which of the three calmer looks (A brick and sign, B felt table, C clean neutral; `docs/review/looks/`).
- **Ruling:** A. Mish asked for "whatever a TCG card shop would most like". A is built from the store's own identity
  (the sign's deep blue on the brick front at 445 York Rd, the real logo on a white sign plate), so it reads as
  Mulligan rather than as any game store; warm cream / charcoal keeps it calm. B (felt) was the runner-up.
- **Next:** roll A across events, event detail and admin in `prototype/`, retire the B/C files and the look picker,
  update DESIGN.md tokens; the build (P2.3 `src/styles`) adopts the same tokens.

### D29. Issue #11 review calls (P2.3a F1-F4 + lows, P2.3b B1-B7) (2026-10-27)
(1) Accepted as built: decoded admin path segments (bad `%` gives 400), `?now=` for sitemap and exception `updated`
(store save too, test clock outside production only, D24 (4)), the F3 409 with its list (nothing removed without
`confirmOrphans: true`), null-hours guards, `.ics` SEQUENCE in minutes, duplicate slots 422, B2-B7. The `src/auth.js`
change is only the production start check: PUBLIC_URL must be `https://`; development and tests need none. Tests use
the real clock only for session expiry: the suite passes with the clock moved to 31 Oct, 9 Nov 2026 and 1 Mar 2027.
(2) Uploads: magic bytes before sharp, dimensions read from the header and must match exactly, 900 KB per picture and
2 MB per request, file name made by the server. Boss fix: sharp gets `limitInputPixels` of the expected size, so a
tiny file with a huge picture is refused unread (tested, 6000x6000 PNG). Without sharp only a plain WebP passes, so
iPhone uploads fail: the P3.2 deploy check must see "sharp found" in the start log.
(3) Boss fix: F3 saves the series before removing the old cancellations, so a failed save can't lose them; the dialog's
cancel says "Go back".
(4) B4 drop-on-read left undone, accepted: past special days never match a day shown, don't count toward the 60 and
go on the next save.
(5) "On now" past midnight only on the hero, accepted: This week starts at today, and shop hours past midnight are rare.
Revisit if the owners run late nights.
(6) D20 chart: accepted with a guard test (boss) that fails on any `innerHTML` in `src/` other than icon paths, any
`outerHTML` / `insertAdjacentHTML` / `document.write` / `srcdoc`, and any `set:html` that is not a constant.
**Why:** the smallest fixes that close a decode-bomb gap and a data-loss order; the rest don't change what owners or
players see. Boss overrule: none.

### D30. P2.4a review calls: first public form with personal data (2026-10-27)
(1) **Retention N = 30 days after the event** (the day it really happens, after a move), accepted. Then email, phone,
player ID and the private link are wiped and the name shrinks to initials; status, check-in, payment and counts stay;
backups hold the rows up to 7 more days (privacy page says so). A policy call, so Q22 asks Mish to confirm or change it.
Boss fix: the purge read `max(event_day, slot day)`, so a date moved earlier kept contacts past the stated 30 days; it
now uses the real day only (tested).
(2) **Duplicate rule (G3): same name AND same email or phone** (name folded for case and spaces; email exact ignoring
case; phone by digits). Name alone refused two different "Chris Smith"s; contact alone refused a parent signing up two
kids. The reply's "as Chris S." can then only echo a name the sender already typed. Staff walk-ins stay name-only (the
counter sees the person); a "Seat anyway" on a name match is P2.4b.
(3) **G4 fixed now: a series edit or delete that would drop an upcoming date holding a seat or a waitlist place is
refused (409 `signed_up`, dates and counts listed, no override).** The message says how: set a last date after them and
make a new event, or move one date with "Change this date" (a moved date keeps its key, D23). Carrying people over to a
new slot was rejected: which new date they wanted is a guess. Past dates are not checked. Tested over HTTP.
(4) Boss fixes: CSP for the form shown again with errors was hashed from the filled page (undoing D24 (2)); it now
hashes the built template (tested: same header as the GET page). The server error log redacts `/signup/<token>`.
The privacy page no longer implies cancelling deletes details (it doesn't until N days; the counter erases at once)
and states that the security log keeps the IP of spam or blocked posts (newest 500).
(5) Accepted as built: 192-bit token, only its SHA-256 stored and looked up by index (D26's "constant time": nothing
compares the secret in JS, and a hash lookup leaks nothing usable); `noindex` meta + `X-Robots-Tag`, `no-referrer`,
`no-store`, not counted in stats; link dead after the event ends and wiped by the purge; cancel touches only the token's
row. Public POST: origin check (a missing Origin passes, as VFW), honeypot gives the normal 303 and stores nothing
(G13), 30 per hour per address, 8 KB body, field lengths and shapes; every value goes back through `h`. Every change is
one `BEGIN IMMEDIATE` transaction; the last-seat and double-cancel races are tested. Roster API: session + origin on
every write, 1200 per hour, ids numeric and scoped to the slot, `erase` keeps only initials and the row's status.
Seats left, cards and JSON-LD availability read the real counts.
(6) Moved to P2.4b: G6 cancel Undo (inverse with a precondition), G1 "Add a pre-registration" at the counter, G10
per-slot headcount row, walk-in "Seat anyway" on a name match, and emailing the link (needs mail set up and the owner's OK).
**Why:** the smallest changes that keep the privacy page true and stop a routine edit from silently losing seats.
Boss overrule: G3 changed from the coder's name OR contact rule.

### D31. P2.4b server review calls: cancel Undo, pre-registration, headcount, seat anyway (2026-10-27)
(1) **G6 cancel Undo: an inverse with a precondition, 5 minutes** (staff toast and the player's page). A waitlisted
person gets their old place back (just ahead of whoever holds it now). A seated person gets the seat back; if that
makes the event full, the **last** person auto-promoted since the cancel who has not checked in goes back to waitlist
#1, exactly as No-show Undo (15.7). Nobody like that (checked in, walk-in took the seat): both keep seats, "29 of 28".
Undo ends with the normal promote, so a seat freed meanwhile never sits empty while someone waits. Refused: after 5
minutes (`expired`), already undone or not cancelled (`state`), or the same person signed up again (`dup`, G3 rule).
Boss fixes (tested): the coder's version bumped the specific people the cancel promoted, so after a second cancel the
person ahead in line lost the seat to the one behind, and a person was sent back to the waitlist even with a seat
free. The `dup` check was name-only, so a different "Chris Smith" blocked the player's own Undo; it now uses the D30
(2) rule (name alone only for rows with no contact, i.e. walk-ins). Accepted: two cancels undone in a row can end "29 of
28" (the precondition fails for the second; nobody loses a seat unfairly).
(2) **The public `POST /api/signup/undo-cancel {token}` stays.** The player page cancels in one tap with no confirm,
so a mistaken tap needs a way back; it is the same guard as `/api/signup/cancel` (hashed token lookup, origin check,
120 per hour per address, 8 KB body, 404 after the event ends, dead after the purge or a counter erase) and touches
only that one row plus, at most, the one person promoted into their seat in the last 5 minutes and not yet checked in.
Cancel and Undo again in a loop only moves that same person back and forth, within the rate limit. Its button on the
`/signup/<token>` page goes with the P2.4b screens.
(3) Accepted as built: G1 `addPreReg` (counter and sign-up-here events, not checked in, contact optional, same seat and
waitlist rules, no cutoff, name match refused unless `anyway`; a waitlisted pre-registration is stored unpaid like a
walk-in), G10 `headcount` table (one integer per slot, walk-in-only events, 0-9999, +/- or set), walk-in `anyway`, the
`undo` column added by `ALTER TABLE` only when missing (tested on an old database, opened twice). Every new admin route
sits behind session + origin + 1200/hour; JSON fields are type-checked; SQL `?` only; names stay text.
**Why:** the No-show rule already decides who goes back, so cancel Undo reuses it; the old way could give a seat to
the wrong person. Boss overrule: G6 bump rule changed from "the people this cancel promoted".

### D32. Laptop round 2 scope: live review (R1-R27) + reference-sites crossref (2026-10-27)
Plan: `docs/review/laptop-round-2-plan.md` (packages A players, B counter, C shared; disjoint files).
(1) **The concept opens on a busy moment.** No `?now=` means Friday Oct 30, 6:50 PM (sample `demoNow`); `?now=real`
gives the real clock. The plain shared link no longer lands on "Closed today" (R3).
(2) **Full event at the counter: "Add to waitlist" is the primary; "Seat anyway (29 of 28)" is secondary behind a
confirm** (R10). D31's server `anyway` stands; only the screen changes.
(3) **Adopted from the crossref now:** print CSS + "Print the schedule" on the events page (counter-window schedule),
font preload, the reduced-motion safety net, a 404 with Hours / Call / Directions. **Cut:** view transitions (DESIGN
2.4 "no load animation", D27 calm), eyebrow rule, underline-grow, card line-clamp (would hide a change note),
`viewport-fit=cover` (no edge-to-edge content; letterboxing is safer). Printable flyer page stays "Not now".
(4) **Media:** delete the files no page uses from `prototype/` (13.6 MB of video, unused logo PNGs, sign photos,
flyers, identical -800 twins). `source/` is untouched and the encodes stay in git history (838e144). Keep
`logo-512.png` (build manifest), the loop `.webm` (still a source) and the posters in use.
(5) **New prototype code follows D20's client rule** (createElement + textContent for data), including lines rewritten
in old escaped templates. Test files are owned like code: B owns `tests-ui.js`, A adds `tests-front.js`, C adds
`tests-shared.js` and owns `tests.html`.
(6) Phone: (215) 789-3299 (pub l.20), already on every page; the crossref's open question is closed.
(7) To the mediator: a phone bottom action bar, and strip vs menu sheet for the phone nav. "All events" moves first in
the nav either way.
**Why:** the owners judge the concept from the shared link on a phone and from the counter screen; these are the
fixes that change what they see there. Decoration and motion the spec already ruled out stay out.

### D33. Phone bottom action bar on public pages: adopt, static (2026-10-27, mediator)
- **Question:** add the owner's MobileBar (advisor) or keep phone chrome to admin only with no sliding bar (designer)?
- **Ruling:** Adopt, as a **static** bar: no hide-on-scroll, no transform or transition. Public pages only, under 900px,
  fixed to the bottom with `env(safe-area-inset-bottom)`, 56px tall, four items in this order: Events (`events.html`),
  Hours (the open-now strip), Directions (the existing link), Call (`tel:+12157893299`). Current page gets the `--act`
  tint. `body` gets `padding-bottom` for the bar; anchor and sticky targets get `scroll-padding-bottom`. Hidden in print.
  Admin keeps its own tab bar (DESIGN 12) and is not touched.
- **Why:** the designer's motion objection is about the slide, and a static bar removes it. Owners' sites prove the
  pattern, and Call and Directions are what a player on a phone needs at any scroll depth. The header is not sticky on
  Mulligan, so the bar is the one always-visible action and does not duplicate a sticky header. Its Events duplicates
  the nav's "All events" under 900px; accepted, because the nav is the desktop menu too. Cost accepted: 56px of a phone
  screen; R1 still holds because the bar sits below the content, not above it. Call is not in the open-now strip today
  (only Directions is), so the bar carries it.
- **Next:** **A** adds the markup (`<nav class="mobile-bar" aria-label="Quick actions">`, four links) to
  `index.html` and `events.html` only. **C** adds the `.mobile-bar` CSS to `site.css` (under 900px, no transition, print
  hidden) and the `body` padding. DESIGN.md 2.5 and 12 get one line for the public bar (C owns DESIGN.md).

### D34. Phone nav: keep the sideways strip, "All events" first, with an edge fade (2026-10-27, mediator)
- **Question:** a sideways nav strip (designer, R6) or a `<details>` menu sheet (advisor: 6 links is past the 4-link rule)?
- **Ruling:** Keep the strip. "All events" first (A4), plus an edge fade on the strip's right side (C). No menu sheet
  now. The crossref's "4 or fewer" rule is superseded for this strip: a sheet becomes the answer only if the nav grows
  past 6 links.
- **Why:** D33 now puts Events, Hours, Directions and Call in the bottom bar, so the strip needs only the page link and
  the in-page jumps. Five of the six links are in-page jumps on a page the reader scrolls anyway. A sheet adds a new
  widget, a JS focus trap and a tap, against the brief's "simpler". The one link that matters most for players is
  now first and visible.
- **Next:** **A** keeps the `index.html` nav order (All events first) and adds nothing else. **C** adds the edge fade
  to `.site-nav` in `site.css` (a `mask-image` or pseudo-element gradient on the right, under 900px, hidden when the
  strip is at its end, no motion). Test at 360px: "All events" visible without scrolling.

### D36. Round 3: cleaner, more concise layout; full-bleed hero (2026-10-27, owner)
- **Owner (Mish):** "a little bit more cleaner, slicker, so things aren't just popping out and everything's just kind
  of jumbled up... more concise and formatted better", laid out like the Warminster VFW site; the hero picture/video
  "bigger along the whole screen... like the other websites" with the text "really visible above all else".
  Formatting problems come before new features.
- **Ruling:** the hero photo/video fills the full width under a dark scrim with white copy, and a strip along its bottom
  carries free play, the caption and the pause control (VFW / Riverside pattern). The seven-day strip moves to the top
  of "This week". On phones the headline and next up stay in the first screen; this replaces R1's "week strip before
  the photo" order. Wide-screen week: no time column, two even card columns, light headers for one-line days, four
  "Further out" rows. Visit becomes one three-column card. Spec: DESIGN.md 6 "Round 3".
- **Why:** the owner's call; it matches the sites they already like and leaves fewer competing boxes on screen.
- **Known gap:** the only loop is a 540px phone reel, soft at full width; Q21 now asks for landscape 1080p clips.
- **Round 3, second pass (same day, after the Desktop's build formatting list on #2):** day cards on wide screens
  flow into one two-column grid in time order (slot time labels hidden, each card shows its time), so a lone slot no
  longer leaves half a row empty; the events page uses the same grid for Tonight and shows Special events two dates
  side by side. Nav is five short links (All events, This week, cEDH, Preorders, Visit) on both pages. Walk-in copy is
  "Walk in. No sign-up needed." with an open-door icon (the old one read as an empty box). "Nothing else scheduled
  today" only when something ran earlier that day.

### D37. Round 4 scope: formatting before features (2026-10-27)
Plan: `docs/review/round-4-plan.md` (packages A shared look + front page, B events page + detail dialog, C counter + 404
+ docs; disjoint files). Input: `docs/review/round-4-formatting.md` (F1-F24 + event detail layout).
(1) **One box per item.** Event cards lose the cost circle and the inner hairlines (one left, head / body); the stat box
is plain text unless the event is full, waitlisted, low on seats, needs players or cancelled (F1). Admin Today counts
read as text and the reminders as one line of links (F22).
(2) **Say things once.** Walk-in is the default: no walk-in line on cards or rows; one note per section ("Most nights are
walk-in. Cards with a Sign up button hold seats."); the detail's action box still says it. Weekly cards drop
"Every <day>" and "Next:", which move to the day heading (F2). Replaces D36's per-card walk-in line.
(3) **Sections by bands, not boxes:** one section padding, alternating paper / surface / band backgrounds; Visit keeps
three columns without its card box (replaces D36's "one three-column card"). `--band` fixed to brown `#3E2A22` in light
and `#2A1D17` in dark, with `color-scheme: dark` on the inner wrapper (F3, F4, a bug).
(4) **Hero (D36 stands):** crop moves to the table (50% 82%) from 900 px; the 1440+ height cap is cut because the owner
asked for a bigger hero. Phone hero shortened so its strip clears the D33 bar (F8, F17).
(5) **Theme switch stays labelled (D27):** "Light | Dark" without the "Theme" word, quieter outline. The designer's
icon-only button (F16) goes to the mediator: D27 (labelled) vs D36 (like VFW).
(6) **Event detail:** one layout for the build page and the prototype dialog (picture, kicker, name + plain price, one
action box, About this night, Other dates always shown for a series, Getting here). The dialog has a sticky close X at
the top-right and no "Also on <day>"; the build page keeps "Also on <day>". The events page head drops its photo.
(7) Everything else in F5-F24 as the plan lists; no new features this round. The Desktop ports the same list (#2).
**Why:** the owner's D36 words ("not popping out... jumbled... more concise"); the reference sites show the pattern;
each fix removes a shape or a repeated line, except two bugs (F4 bands, F11 icon) and the detail page, which was the
thinnest page in the build.

### D38. Round 4 review: PASS with fixes (2026-10-27)
Boss review of packages A, B, C (`docs/review/round-4-plan.md`) before push. Tests 143 passed, 0 failed; no console
errors on index, events, admin Today / Events / Inventory; no sideways scroll at 390.
**Injection (owner rule):** no data-fed `innerHTML` in new code; `V.detailEl`, `V.weeklyRow`, Special kickers, admin
reminders and walk-in button use `createElement` + `textContent`. `MG.eventCard` (parsed through `template.innerHTML`)
escapes every data field; the one gap, the fee in `.ev-cost`, is now escaped. `V.detail()` / `V.weeklyCard()` strings
(`outerHTML`) are only used by tests; the pages append the elements.
**Fixed in review:** (1) F23's CSS had not landed: the walk-in bar was still two rows (~135px) and read "Add  and check in";
now one row at 74px under 640px when there is one button (a full event's two buttons keep their row), toast clears it
(toast bottom 676 vs bar top 698 at 390x844). (2) Admin counts and reminders: no "·" starting a wrapped line on phones,
no "·" inside the boxed warning count. (3) Events page Every week from 1024px: "next Nov 4" sits on its own line
without a leading "·" (the dot is now CSS, beside the name only). (4) DESIGN.md round-4 notes corrected (week strip fits
seven tiles, hero crop F8 50% 82%, controls row contents, closed days / walk-in note).
**Measured:** events page at 390 is 6,252px (target under 6,500), first event at 714px (above the 788px bar); chips one
row at 1280; detail dialog action box ends at 625px on 390 and 827px on 1280, X stays at the top while scrolled, focus on
`#det-title`.
**Carried, not blocking:** the hero at 1440/1920 is a portrait clip upscaled (soft); Q21 landscape clips fix it. The Visit
head's address line repeats "Find us" on phones. At 1280 the toast can briefly cover the walk-in bar when the roster is
short (pre-existing). The counter-only card (Star Trek Prerelease) has its text and Call button on different baselines.

### D39. Owner answers: reviews, T-shirt, TCGplayer, cEDH fee, player counts, hours (2026-10-27, owner)
- **Owner (Mish):** "just use the 5 star reviews, if they have t-shirts for sale then use that, i logged into tcg player
  and just research the cEDH entry fee, also yes player counts should be shown public, just use whatever hours you can
  find and assume they are closed otherwise".
- **Q23 reviews:** show five-star Google reviews only: three short quotes (first name + initial as Google shows them,
  linked to the Google listing) plus "4.9 on Google, 81 reviews". One quiet row, no carousel.
- **Q24 T-shirt:** if the research finds the shirt is for sale, one line + one photo in the Shop / New and preorders
  area; if not confirmed, leave it out.
- **TCGplayer:** the owner signed in to TCGplayer in Chrome on the Laptop for research. Only public-facing facts go on the
  site (what they sell, rating, pickup / shipping); nothing from the seller account's private numbers.
- **cEDH entry fee:** research it (TopDeck event pages, store posts) and show it.
- **Player counts:** public. Show attendance (TopDeck circuit table) on the cEDH section and past-event results.
- **Hours (Q2):** use the hours found (Google, 2026-10-27: Wed-Thu 2-10 PM, Fri-Sat 2 PM-midnight, Sun 1-10 PM). Any
  day with no hours found is **closed**; the site never shows a day as open without hours.

### D40. Round 5 review: PASS with small fixes (2026-10-27, boss)
**Checked:** hero from 900px is the `shop-floor-cases` still (one image request, no .mp4/.webm at 1280/1920), under
900px the portrait poster + loop (no large still at 390); caption switches. Preorder footers align; no empty bodies.
Inside the shop shows the three new photos; deleted files are unreferenced in prototype/. Reviews: "4.9 on Google · 81
reviews" + three five-star quotes, verbatim, first name + last initial. Fees and the four turnout rows (Oct 4 69, Sep 6
69, Aug 9 12, Aug 8 77) match the research tables. No new data-fed innerHTML (all createElement). Tests 152/0.
**Boss fixes:** TCGplayer line said "singles" (the sealed/singles split was never read) -> "Magic cards"; turnout rows
used "MCS ..." jargon -> plain "Championship Series" / "5K" / "Redemption"; Entry fact shortened ("$25 after the 5K",
"holds a spot"); DESIGN note now says the line keeps the rating only (D39 allows it).
**Carried, not blocking:** "Last Championship Series, Oct 4: 69 players" repeats the first turnout row; the Redemption
(Nov 8) is not in "Next cEDH events"; at 1920 the 1440w still is slightly soft. Port list: `docs/review/round-5-port.md`.

### D41. Stock is a ledger (P2.5, 2026-10-27, boss)
On hand = SUM(stock_moves) for the product. A move that would take it below 0 is refused (422 "Only N on hand"). Count
now saves the difference as a `counted` move; Undo writes the opposite `adjust` move (refused below 0). A preorder pickup
writes a `pickup` move (note "Preorder #id", no personal data) when there is stock; if not, the order still closes and
the toast says stock was not reduced; undoing a pickup puts back only what was taken. A product with waiting or arrived
preorders can't be deleted; deleting one removes its moves, event use and closed preorders.

### D42. Reserved and alerts (P2.5, 2026-10-27, boss)
Reserved = what events use on dates from today to today + 7/14/30/60 days (default 14); cancelled dates and hidden
events don't count, moved dates count on the new date (D23 slot keys). Per date: a fixed qty, or per seat x seats, where
seats = the date's capacity, else a "seats per date" guess, else sign-ups so far. Short = reserved > on hand. Low = on
hand <= low_at (0 = no alert). Alerts cover shown products only.

### D43. Preorder flow (P2.5, 2026-10-27, boss)
Statuses waiting, arrived, picked, cancelled. Moves: waiting -> arrived | cancelled; arrived -> waiting | picked |
cancelled; picked -> arrived | waiting; cancelled -> waiting | arrived. A contact (phone 7-15 digits, or email) is
required; qty 1-999; deposit whole dollars 0-99999. "Mark all waiting as arrived" and its Undo are each one transaction.

### D44. Preorder retention (P2.5, 2026-10-27, boss; owner-confirmable, Q25)
PREORDER_RETENTION_DAYS (30) days after an order is picked up or cancelled, the daily purge deletes the contact and cuts
the name to initials ("S. B.", as sign-ups). Qty, deposit and status stay; a purged order can't be reopened. Contacts
appear only on admin routes, never in logs; backups hold them up to 7 more days; the privacy page says so.

### D45. Product CSV export (P2.5, 2026-10-27, boss)
Columns name, category, game, sku, on_hand, low_at, shown. Cells starting with = + - @ tab or CR get a leading ';
cells with , " CR LF are quoted. text/csv attachment `mulligan-products.csv`, no-store; each export is logged as
`inventory_export` with no customer data. Import waits on Q4 (POS).

### D46. Light/dark: the VFW round button, bottom-right (2026-10-27, owner)
- **Owner (Mish):** "reuse the one you made for the warminster VFW website and put it in the bottom right of the website".
- **Ruling:** `src/components/ThemeFab.astro` is the VFW site's ThemeFab (same markup, icons, behaviour, styles), on
  every public page and the admin. Moon in light mode, sun in dark mode, aria-label "Switch to dark/light mode", 44px,
  hidden in print and without JS. Mulligan differences only: the theme stays in `<meta name="color-scheme">` with the
  `mg-scheme` key (switching back to the system's scheme follows the system again), colours use this site's tokens,
  and on phones it sits above the quick-actions bar (D33) and the admin tab bar. Replaces the labelled Light | Dark pill
  in the header (D28/D37 wording) everywhere.

### D47. Round 6: a visual "This week" and the store's social videos on the home page (2026-10-27, owner)
- **Owner (Mish):** "For the This Week at Mulligan, I wanted to look a little bit more visually appealing and not just
  plain text... images, more visual cues for things. Also, maybe just don't put This Week at Mulligan, but put like videos
  from TikTok and like other things like that. Also, for the homepage, you can use like videos from TikTok, Instagram, and
  Facebook."
- **Ruling (main session):** events keep leading the home page (BRIEF, D1), but "This week" becomes visual: real store
  photos by game as the cue on cards, rows and the week strip. The home page gets a row of the store's own TikTok /
  Instagram / Facebook videos. Videos are **official embeds behind click-to-load posters** (no stream downloading; no
  third-party request before a click); posters from TikTok's public oEmbed or the post's og:image. The heading may change
  (designer decides in `docs/review/round-6-visual.md`).

### D48. Round 6 review: PASS with boss fixes (2026-10-27, boss)
**Checked:** no new data-fed innerHTML (photo values pass `MG.esc` + a position pattern; clip dialog is createElement;
the icon helper only takes constant SVG). Clip ids, hosts and posters are validated before `new URL()`. Network log on
load (real Chrome, 127.0.0.1): only our origin, no iframe, no third-party request before a click. Real players: TikTok
loads and plays in the dialog at 1280 and 400px (controls, sound toggle, fullscreen); close (X / Esc) removes the iframe
and focus returns to the card. This week reads as photos-first and stays calm: one image per item, one ratio per row.
Weight at 390: hero poster + loop as before; 5 band photos (~300 KB, lazy but inside Chrome's load distance) come with
the page; thumbs, clip posters and the cEDH stills load only on scroll; all photos are `-800`, no srcset. Tests 170/0.
**Boss fixes:** (1) the dialog spanned the whole window (`width: auto` beats the UA's fit-content on a fixed dialog) ->
`width: fit-content`; at 400px it overflowed into scrollbars -> frame `100vw - 3rem` / `100svh - 10rem`, `overflow-x:
hidden`. (2) Instagram's embed will not play these reels (licensed music: it shows a still + "Watch on Instagram" that
opens IG), so Instagram cards are now plain links unless a clip has `inline: true`. (3) The IG reel credit said
"by @vespur"; the reel's own header shows **@perky_grn_fairy** -> corrected (data, card, test, research). (4) Today's and
tomorrow's cards opened with the same Magic photo, and 4 of 5 strip tiles showed the same picture -> the two card days
share one "used" map, strip tiles avoid repeats, tinted stand-ins no longer use up a game's plain photos (+1 test).
(5) Opening a new card in the gap before the old dialog's late `close` event no longer falls through to the TikTok link.
**Noted, not blocking:** TikTok's player sometimes shows its own "Watch this video on TikTok" app prompt instead of the
video (seen once at 400px; the same clip played on retry); the dialog's "Open on TikTok" covers it. The 240px posters
read soft but acceptable at 164-192px; the IG poster frame is mostly black (Q21 stills). Round 6 was first logged
as D41/D42, numbers the Desktop had already used for P2.5 (stock ledger); renumbered to D47/D48. Port list: `docs/review/round-6-port.md`.

### D49. Round 6 port + welcome hero: PASS with boss fixes (2026-10-27, boss)
**Owner request folded in:** the hero opens "Welcome to Mulligan Games." + the lede "A friendly game store in Warminster with
a big play room, free play every day we're open, and card nights all week. Come say hi."; the hours moved into the eyebrow
"<date> · <status>" (`hoursStatus()`: open till / open today from / closed today or for the night, back ... / closed this
week; date alone when hours are unknown). **Checked (headless Chrome, CDP, 1280 and 500):** no third-party request on load
or after scrolling the whole page; no iframe/dialog before a click; clips.js is an external self script; one click = one
TikTok iframe; Esc and backdrop remove it, no TikTok request after close, focus returns to the card. Captions/credits go
through Astro escaping and textContent; photo alt text is constant. **Boss fixes:** (1) the player iframe is now sandboxed
`allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox` (tested: the player loads
and plays, video readyState 4, at 1280 and 500; no top navigation, forms, modals or downloads) - supersedes "no sandbox" in
D48/round-6-port. (2) Photo bands get `srcset` 800w/1600w (`sizes="(min-width: 1024px) 30rem, 100vw"`); thumbs and strip
caps stay on -800. (3) Print hides the bands, the clips section and the clip dialog. (4) Hero "Watch clips from the shop"
link is 44px tall. (5) Privacy page: the clip-video sentence (port item 7) was missing; added. (6) Deleted unused
`interior-welcome-banner*` and `shop-corgi*` from public/img/social (prototype keeps its own copies). (7) Tests: hero copy
and every eyebrow state, band srcset, sandbox tokens. **Noted:** with three Magic photos, a busy two-day stretch reuses
Magic photos on the next card day, and a tinted stand-in can share a base photo with a plain card the same day (D48 rule).
Tests 200/0.

### D50. Counter follow-ups: Move-in Undo, delete a walk-in, Run it on the server (2026-10-27, boss)
(1) **Move-in Undo, 5 minutes:** only a person still seated from a staff move-in, not checked in and unpaid (else
`changed`). They go back just ahead of whoever holds their old place (pos - 0.5); freeing a seat bumps nobody; ends with
the normal promote, so a seat free meanwhile goes to the first in line (maybe them).
(2) **Delete a mistaken walk-in:** staff walk-ins only, within 5 minutes of being made, while seated or waiting. The row
goes, so it is neither a cancellation nor a no-show; a seat it held goes to the next in line. A name-only snapshot
(no contact exists on a walk-in) waits in `walkin_trash` for the Undo and is purged once 5 minutes pass: on each
delete, by a timer per delete, and at start and hourly in runPurge; never logged or returned. Undo restores the same id
and place; if that makes it full, the D31 rule bumps the last unchecked person promoted since the delete (shared
`bumpLastPromoted`, also used by cancel and No-show Undo, behaviour unchanged). Refused: same name back on the list
(`dup`), id reused or already restored (`state`). Accepted: ids are not AUTOINCREMENT, so deleting the newest row lets
the next sign-up reuse its id; a device with a stale list for a few seconds could act on that new row (every reply
re-sends the roster). Hourly backups may hold a snapshot up to 7 days, as any row (privacy page).
(3) **Run it lives on the server:** `run_it (series, slot)` (D23 key), `event.runIt` in the roster reply (Today reads
the same), `{on: false}` is its Undo, refused on a cancelled date; every counter device sees it. localStorage is gone.
Routes `POST roster/:series/:slot/:id/movein {undo}`, `/:id/delete {undo}`, `/runit {on}`: session + origin, 1200/hour,
body cap, JSON types checked, SQL `?` only, one transaction each; unknown date or non-numeric id 404, refused 409/422.
The coder logged this as "D32" (taken); renumbered.
### D51. Round 7 (first logged as D49/D50, numbers the Desktop had already used): plain compact week strip, a warm opening line, TikTok videos up top (2026-10-27, owner)
- **Owner (Mish):** "there shouldn't be pictures in the calendar days. It should only, like today, 30, three events,
  Saturday, 31st, one event... a little bit more compact. Also, maybe add a couple videos from the [TikTok] on the
  homepage as well. Also, the front page still just says open till midnight tonight instead of a warm welcoming opening
  line... do research on other card shops and see what they would say, and then add videos to the front page."
- **Ruling:** the week strip drops the round-6 photos (D47) and shows only day, date and event count, more compact. The
  hero headline becomes a warm card-shop welcome (from `docs/research/opening-lines.md`); open/closed moves to a small
  status chip. Two featured TikTok clips go near the top of the front page (click-to-load, as D47), in addition to
  "Clips from the shop". Photos stay on the event cards and rows.

### D52. Round 7 review: PASS with boss fixes (2026-10-27, boss)
**Checked:** week strip is text-only (day, date, count inside the tile; no img, no pips), 7 tiles >= 44px at 360, capped
34rem at 1280. Headline "Shuffle up. Everyone's welcome." + static sub-line; chip reads right at all five cases
(Fri 18:50 "Open now · till midnight", Fri 11:00 "Opens 2 PM today", Mon 12:00 "Closed today · back Wed 2 PM",
Wed 23:30 "Closed · back tomorrow 2 PM", Tue 12:00 "Closed today · back tomorrow 2 PM"), green dot only when open.
Featured cards clear the headline and next-up ticket at 900-1920 (tests at 900/1024/1280/1440/1920); dark mode fine
(hero is dark in both themes). Injection: chip and headline are textContent; `bindFeatured` matches `data-clip-id`
to a data clip by strict equality and re-runs `valid()` before binding; the dialog is createElement; no new data-fed
innerHTML. Network (real Chrome, 390 and 1280, five times): only our origin before a click, no iframe; one click on a
featured card / "Watch a clip" = one `www.tiktok.com/player/v1/<id>` iframe. Tests 193/0 (budget 120000).
**Boss fixes:** (1) open status was said twice on the home page -> index.html's bar drops `#ob-status` (front.js no
longer renders it); the address now leads the bar on phones too ("445 York Rd", ", Warminster" from 600px); events.html
keeps its status. (2) free play was said twice -> the hero strip's "Free play all day..." line is gone at every width;
the strip is caption left, clips link + Pause right, 48px tall on phones (was 56). (3) at 390x844 the hero ended at 792,
under the quick-actions bar (787) -> phone hero floor 62svh -> 52svh (hero is as tall as its copy, ends ~745) and from
360-420px the two hero buttons share one row (trimmed padding/gap; they stacked at 375 and with a scrollbar);
(4) the featured-card captions sat on the light counter/wall -> dark backing, up to 3 lines (2-line clamp cut "monthly
cEDH" at 1024); (5) the strip could be wider than a 360 screen (nowrap caption as min-content) -> `min-width: 0` +
ellipsis. +3 tests (each fact once; events.html keeps status; 390x844 hero above the bar). README test command updated.
**Noted:** with the concept-only demo bar on top, a 360x740 phone or an 820px tablet still puts the hero's end under
the quick-actions bar; without the demo bar (the real site) both clear it. Port list: `docs/review/round-7-port.md`.
- **Open (owner to choose):** the build (Desktop D49) opens "Welcome to Mulligan Games." + "A friendly game store in Warminster with a big play room, free play every day we're open, and card nights all week. Come say hi."; the prototype opens "Shuffle up. Everyone's welcome." (from docs/research/opening-lines.md). One line for both once the owner picks.

### D53. #16 hero montage, prototype side: PASS with boss fixes (2026-10-27, boss)
**Checked (real Chrome via puppeteer, served on http):** 390x844 / 360x740 portrait: the portrait poster paints, then after load
`hero-portrait.mp4` gets its src and plays (currentTime advances; no `--autoplay-policy` flag needed, muted autoplay is allowed
headless); the pill reads Pause video / Play video and the frame freezes while paused. Save-Data on 4g and effectiveType 3g:
no video request at all, portrait poster, pill "Play video"; a press loads and plays. Reduced motion: plays (DESIGN 17.1, as
VFW / Riverside), pill visible and works. 1280 / 1920 / 844x390 landscape: only `hero-poster.jpg` is fetched, no request for
`hero.mp4` / `hero-720.mp4` (HERO_FILES false), no console error, pill hidden, no horizontal overflow. One poster per screen.
Headline still the largest, clearest thing; featured TikTok cards clear the copy at 900 / 1280 / 1920; D46 corner test passes.
Injection: no new data-fed innerHTML (the hero code is textContent / attributes from a fixed manifest).
**Boss fixes:** (1) the strip caption cut to "445 Y..." at 390 -> hidden under 600px (the strip is the pill alone; the address
already leads the bar above the header), and 600-899px drops the "On screen:" lead-in (`.cap-k`), which was 8px short at 768
with a scrollbar. (2) +5 tests (198/0): Save-Data and 3g holds (the page is written into an about:blank frame whose
`navigator.connection` is overridden first; `document.open` keeps the Window but erases its listeners), caption hidden at 390,
caption whole at 768 and 900. (3) DESIGN 17.1: the build note no longer says to put `src` straight on the `<source>`s (that
would fetch before the poster and skip the hold); "For the Desktop" port note added (what to copy, the two HERO_FILES flags).
**Noted:** at 900x800 the theme button sits on the edge of the second featured card's caption backing (not its text); landscape
phones still open on the concept-only demo bar (D52 note).
