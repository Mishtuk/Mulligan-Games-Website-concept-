# Showing the concept to the store owners (about 15 minutes)

For Mish. Open `prototype/index.html` in a browser (a laptop or tablet works; a phone works for the public side).
How the owners see it (your laptop, a zip, or a private preview link) is your call; a preview link publishes it, so
check with yourself first. Nothing here needs the internet or a login.

## What this is

A sketch of a website for Mulligan Games, in two halves. The front is what players see: what is on this week, what it
costs, whether there is a seat, and when you are open. The back is for the people at the counter: who signed up, who has
arrived, what is low on the shelf. It is a working mock-up, not the real site: everything you click is real in the
sense that it responds, but it is saved only in this browser and nobody is contacted.

## Before you start
- Use a big window for the owners' side (a tablet is best), or a phone for the public side.
- The "Reset demo data" button at the bottom of the admin menu puts everything back as it was.
- The demo clock: add `?now=2026-10-30T19:30` to the admin address to pretend it is 7:30 PM on Friday, Oct 30.
  Example: `prototype/admin/index.html?now=2026-10-30T19:30`.

## Part 1: The front page and sign-up (4 min)
1. **Front page.** Scroll "This week". Notice: events grouped by day, with price and seats; a coloured band per game;
   the open-now line at the top. Ask: "Is this what a player asks you on the phone?"
2. **Click a game chip** (for example One Piece). Notice: the week narrows to that game only.
3. **Light/dark button** in the header. Notice: both are readable in a dim shop.
4. **All events** (menu). Notice: special events and tournaments first, then "Every week".
5. **Pick a capped night** (Friday draft or Pauper) and click **Sign up**. Enter a name. Notice: you get a seat, or a
   place on the waitlist when it is full. Sign up a few extra names to fill it.
6. **Open a cancelled or beginner-friendly date** if one is shown. Notice: cancelled dates say so in words.

## Part 2: Counter flow in admin (9 min)
Open `admin/index.html?now=2026-10-30T19:30` (or "Admin" link in the footer, then add the clock).

7. **Today (busy Friday).** Notice: it opens on the event happening now, with the people signed up listed.
   Click **Check in** next to a name. Notice: one tap, one hand; the count goes up. Click **Undo** in the message.
   Try the payment buttons on a checked-in row (Door, Online, Comped, Credit).
8. **Add a walk-in.** Use "Add name" or "Add and check in". Notice: if the event is full they go on the waitlist.
9. **Events, then New event.** Choose a game and kind of night, for example a **prerelease**. Notice: a template
   fills in price, seats and times; change the date to next month and click **Save event**. Notice: it appears on the
   public All events page ("View the website" in the menu).
10. **Weekly event, cancel one date.** Open a weekly night, pick one date, choose **Cancel this date**, add a note such
    as "Closed for the holiday." Notice: only that date is cancelled; the rest of the series stays. Check the
    public page: the date shows "cancelled" with your note.
11. **Record results and store credit.** On a finished event, open its results, enter placings and prizes (packs or
    store credit), **Save results**. Notice: the record is kept per event, so you can answer "who got what".
12. **Stock.** Open **Stock**. Notice: low items are flagged. After the prerelease from step 9, the boosters it
    reserves appear as "reserved", and a low-stock alert shows. Use +/- or **Save count** to change a count.
13. **Preorders.** Click **Preorders**, then the **Arrived: call these** chip. Notice: customers waiting on a product
    that just arrived, with a Call button and phone number. **Receive stock** marks a delivery in.

## What is real and what is sample
- **Real (from public sources):** name, address (445 York Rd), phone, hours as listed online, the weekly schedule
  and the flyer look (red, white diamond, black free-play circle).
- **Sample or guessed:** entry fees for the weekly nights, seat limits, the players and phone numbers, stock counts,
  preorders and prices. Guesses are marked in `prototype/data/sample.js`.
- **Not connected:** no payments, no emails or texts, no link to your register or the official pairing tools.
  Save and sign-up work only inside this browser.

## Questions to answer on the spot
Tick or write a short answer next to each. **(BLOCKS LAUNCH)** marks the five we cannot go live without.

**The shop**
- [ ] Hours still right: Wed-Thu 2-10, Fri-Sat 2 PM-midnight, Sun 1-10, closed Mon-Tue? Holidays coming up? **(BLOCKS LAUNCH)**
- [ ] Is the Sunday cEDH on the 1st at 10 AM, before the usual 1 PM opening?
- [ ] Public email, current Discord invite, Instagram, Spicerack, and TCGplayer store: which are yours? **(BLOCKS LAUNCH)**
- [ ] May we use your logo and Facebook photos (now, and on the public site)? **(BLOCKS LAUNCH)**
- [ ] A short shop video: could you send 2 or 3 of your own phone clips (10-15 seconds) of the room, the tables on a
      busy night and the shelves, ideally with no faces? We clean them up for a quiet looping picture behind the top
      of the front page. Clips with customers in them need those customers' OK. Until then the site shows a photo.

**Events and sign-ups**
- [ ] Entry fees for Hololive, One Piece, Nexus Nights, Pokemon, cEDH weekly, Championship Series, 5K, Redemption. **(BLOCKS LAUNCH)**
- [ ] Does Magic Academy still run? Seat limits: Pauper 28, FNM 28, Saturday draft 16?
- [ ] Which events take sign-ups on the site (capped ones only, or all)? Hold seats until the start, or release
      5, 10, 15 or 30 minutes before? Any late rule?
- [ ] Do you run Warhammer 40k, Age of Sigmar or Kill Team events, and on which app?
- [ ] Which official tools do you use besides Wizards (Play! Pokemon, Konami, Bandai, Ravensburger, Riftbound)?
- [ ] Do you sell or run Lorcana, Flesh and Blood, Star Wars Unlimited or D&D?

**Counter, stock and money**
- [ ] What do you use for the register and inventory today? Can it export a product list? Does it track store credit?
      Who keeps the record of prizes and credit, and are prizes packs, credit, or both?
- [ ] How many staff need a login? Should staff see stock counts, or only check people in?
- [ ] Take entry payment online? If yes, through whom?
- [ ] Should the schedule post to a Discord channel automatically (later)?

**"New here?" page and listings**
- [ ] For new players: age or kids rule, loaner decks, house rules, and which trade-ins you buy.
- [ ] Do you manage your Google listing? Want copy-ready event text to paste there?
- [ ] Hosting and web address: any preference or budget? (Not needed until the build is done.)

Write the answers and the date in `OWNER-QUESTIONS.md`, and add to `DECISIONS.md` if one changes a plan.
