# Mulligan Games website concept: brief

**Client:** Mulligan Games, a trading card game store (Facebook: https://www.facebook.com/profile.php?id=100085975454414).

## The goal (the boss holds every task to this)
A website the owners of Mulligan Games would find **extremely useful** for running their store's events. Two sides:

1. **Public front (customers).** The home page shows what players want first: upcoming events and tournaments
   (this week, by game and format), how to sign up, what's new in store, hours and location. It should look like a
   place players want to go, not a generic template.
2. **Admin panel (owners and staff).** Managerial:
   - **Event and tournament organizing** for many TCGs and formats (Magic: Commander, Modern, Draft, Prerelease,
     Pokemon, Yu-Gi-Oh!, One Piece, Lorcana, Flesh and Blood, Star Wars Unlimited, ...) and tabletop / miniatures
     games (Warhammer 40k, Age of Sigmar, Kill Team, ...). Create recurring and one-off events, capacity, entry fee,
     sign-ups and waitlists, check-in, pairings or links to the official tool (Companion / Play! Pokemon / KONAMI /
     Melee / Best Coast Pairings), results, prize support, store credit.
   - **Inventory tracking**: sealed product, singles, accessories, miniatures and paints; stock counts, low-stock
     alerts, preorders, what an event uses (prize packs, draft boosters).

## How we decide
Research first: what successful TCG stores and event platforms do (store sites, Wizards' Store Locator / EventLink,
Play! Pokemon, Bandai TCG+, Melee.gg, TopDeck.gg, Best Coast Pairings, TCGplayer Pro, BinderPOS, Shopify TCG apps)
and what owners actually use. Build only what serves the goal; reuse before writing anything new.

## Reuse (to conserve tokens)
- **Warminster VFW site** (`Mishtuk/Warminster-VFW-website-`): Astro + `server.js` with a working admin (login, events,
  recurring events, photo upload, inbox, security log, dashboard), calendar/.ics, JSON-LD, theme toggle. Start from it.
- **Team definitions** come from Pokemon-Tracker, adapted here in `.claude/agents/`.
- Plugins installed on the Laptop: `frontend-design` and `modern-web-guidance`.

## Constraints
- The Laptop has no Node or Python. Building, tests and previews run on the Desktop; the Laptop does research,
  design specs and static prototypes (plain HTML/CSS/JS that opens without a build).
- Anything that costs money, publishes, or contacts the store: ask the owner (Mish) first.
- Don't copy the store's or other stores' branding or photos into a public deploy without permission; the concept can
  use them locally as reference.
