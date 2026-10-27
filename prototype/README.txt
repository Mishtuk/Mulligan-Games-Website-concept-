Mulligan Games concept prototype - opens from this folder, no internet or install needed.
Full walkthrough script: docs/owner-pack.md

Players
  index.html          Front page: open-now strip, this week, cEDH, preorders, visit
  events.html         All events: game chips, format filter, event details, sign up / waitlist, add to calendar

Other
  404.html            The page shown for a wrong address (GitHub Pages serves it)

Staff (counter)
  admin/index.html    Today: check in, paid, walk-ins, cancel (waitlist moves up), reminders
  admin/events.html   Events: new event from a template, repeats, cancel one date, roster and results
  admin/inventory.html  Stock: low stock, reserved for events, receive; #preorders for preorders

Tips
  The pages open on a pretend Friday 6:50 PM (ten minutes before the 7 PM draft). Add ?now=real to any address
  for the real clock, or ?now=2026-10-30T19:30 for another moment. The bar at the top has a "Pretend it's" menu.
  "Reset demo data" (in the bar at the top of each page) puts everything back.
  tests.html runs the rule and page checks (193 passed, 0 failed). Headless: timeout 400 chrome --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=120000 --dump-dom file:///.../prototype/tests.html | grep -o '<span id="summary"[^<]*<' (the budget must be 120000 or the run ends at "running...").
