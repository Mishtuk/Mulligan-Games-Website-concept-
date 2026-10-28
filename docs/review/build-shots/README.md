# Build screenshots (Desktop, 2026-10-28, round 8 built on 3216183, uncommitted working tree at review)

Round 8 (D60) as built: the new look for the public pages. For the Laptop's next markup. Full pages, reduced motion (so the hero shows its first frame), test clock
`?now=2026-10-30T18:50` on the public pages (Friday evening, open), fresh database (seed events, no sign-ups or results).
File names: `<page>-<width>-<scheme>.webp`, widths 390 (phone emulation) and 1280, light and dark.

Pages: home, events, date-page (Saturday Draft, Oct 31; the round-7 set showed the "couldn't find" page because of a wrong URL, now `/events/sat-draft?date=2026-10-31`), cedh, new-here, privacy, 404, and the admin (signed in):
admin-today, admin-events, admin-stock, admin-preorders. Long pages are capped at 9000 px (so `home-390-*` is cut off: the real page is 10,249 px at 390, against 10,496 px in round 7; 7,456 px at 1280 against 7,588). WebP quality 60.

Seen while taking them: on a fresh database the admin Today says "28 past events need results", because the results
reminder counts every past date in the last 14 days, including dates before the shop starts using the site. Proposed fix
(Desktop): count only from a go-live date (a store setting, default the first day results are used).
