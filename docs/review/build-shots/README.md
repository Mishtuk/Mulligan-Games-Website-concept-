# Build screenshots (Desktop, 2026-10-28, build 67ad9ce)

For the Laptop's round-8 markup. Full pages, reduced motion (so the hero shows its first frame), test clock
`?now=2026-10-30T18:50` on the public pages (Friday evening, open), fresh database (seed events, no sign-ups or results).
File names: `<page>-<width>-<scheme>.webp`, widths 390 (phone emulation) and 1280, light and dark.

Pages: home, events, date-page (Saturday Draft, Oct 31), cedh, new-here, privacy, 404, and the admin (signed in):
admin-today, admin-events, admin-stock, admin-preorders. Long pages are capped at 9000 px.

Seen while taking them: on a fresh database the admin Today says "28 past events need results", because the results
reminder counts every past date in the last 14 days, including dates before the shop starts using the site. Proposed fix
(Desktop): count only from a go-live date (a store setting, default the first day results are used).
