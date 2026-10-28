# Mulligan Games website concept: handoff

Goal and scope: see `BRIEF.md`. Team agents: `.claude/agents/` (boss, researcher, designer, coder, mediator).
Research: `docs/research/`. Plan: `PLAN.md`. Rulings: `DECISIONS.md`. Design: `DESIGN.md`.

- **Repo:** https://github.com/Mishtuk/Mulligan-Games-Website-concept-
- **Commits:** authored as `Mish <113945444+Mishtuk@users.noreply.github.com>`. No AI attribution in commits.

## Working together (Desktop and Laptop)
Same rules as the Warminster VFW and Pokemon-Tracker repos.
- **Talk on GitHub:** the pinned issue "Coordination board: Desktop and Laptop" is the chat. Start every comment
  with `Laptop:` or `Desktop:` (both machines post as Mishtuk; the watchers filter on the prefix).
- **Also email** (so alerts reach you even when your watcher is down): for anything the other machine must act on
  (a new task issue, a handoff, a question that blocks you), send a short email to alexmishtuk@gmail.com with the
  subject `[Mulligan] Laptop: ...` or `[Mulligan] Desktop: ...` and a link to the comment. GitHub stays the record;
  the email is the alert. When you start a session, search Gmail for `subject:"[Mulligan] Desktop"` (or Laptop).
- **Desktop tools** (Git Bash): `tools/say.sh "Desktop: ..."` posts to the board (#2, number in `tools/board_issue`)
  and emails the alert over Gmail SMTP when `MULLIGAN_MAIL_USER` / `MULLIGAN_MAIL_PASS` (a Gmail app password) are set.
  `bash tools/board_check.sh Desktop` prints NEW_LAPTOP / LAPTOP_SILENT / WAITING / OK.
- **Task issues** are labeled `laptop` or `desktop`, each with a brief and a "Done when" checklist. Take the lowest
  open number for your machine, comment "Started", claim it below, close it with the commit hash.
- **Claims:** `git pull --rebase`, add a line under "Now working on" with the files you'll touch, push it alone first.
  Never edit files the other machine claimed. Pull before every push; never force-push `main`.
- **Every push gets a board post** (owner rule, 2026-10-26, both machines): right after `git push`, post `Laptop:` or
  `Desktop:` on #2 with each pushed commit's short hash and a one-line summary of what it changed (claims included).
- **Reuse, don't recreate:** read `docs/research/` and the agent files before starting; extend them.
- **Owner's reference sites (both machines, 2026-10-27):** for the overall sleek look and proven patterns, study the owner's
  other sites: Warminster VFW (`Mishtuk/Warminster-VFW-website-`, local `V:\WarminsterVFW`), Madison Networks
  (`Mishtuk/Madison-Networks`, `V:\MadisonNetworks`) and Riverside church (`Mishtuk/Riverside-Website`, `V:\RiversideWebsite`).
  Borrow layout, polish and components; keep Mulligan's own identity (D28).
- **Usage limits:** near your limit, commit finished work, stash half-done work, file what's left as issues for the
  other machine, post a "Handoff" comment, email it, release your claims.

### Who does what (agreed on #2, 2026-10-26)
- **Laptop** (Node 24 since 2026-10-27; no Python, no gh): research, `DESIGN.md`, static prototypes in `prototype/` (open from disk, no build).
- **Desktop** (Node, Chrome with sign-ins): Chrome research and screenshots, the Astro build reusing the Warminster
  VFW site, tests.

### Now working on
- **Laptop:** round 7 pushed (3d832d0: plain compact week strip, warm hero line + status chip, featured TikToks;
  D51/D52, port list `docs/review/round-7-port.md`). #16 prototype side done (D53): montage markup on every width with `<source media>` files, posters
  first, Save-Data / slow links hold the poster; wide files pending (flip `HERO_FILES` in `prototype/js/front.js`). Nothing
  else claimed; next: whatever the owner or the Desktop asks. The Laptop has Node 24 (no gh/python): tests run
  headless with Chrome (`prototype/tests.html` via --dump-dom), GitHub via curl + the git credential token.
- **Desktop:** **round 8 taken over** (owner, 2026-10-28: the Laptop ran out of tokens): spec `docs/review/round-8-new-look.md` (designer agent, from both Wix passes + Direction B + D55), then built straight into the build: `src/`, `public/`, `server.js`, `test/`, `DESIGN.md` (round-8 section). `prototype/` untouched. D-numbers: Laptop odd, Desktop even (next D59 / D60).
  (#16, Desktop part), then P2.6 results and prizes.

**Keep this file current (owner rule, 2026-10-27):** update this "Now working on" and the Status section with every
milestone push, not only at handoff. Sessions can end without warning.

## Status (handoff, 2026-10-27 evening, Desktop)
**Build: round 7 + montage video hero (3c1df2f) P2.6 results (15e111a), P2.7 /cedh/ (64ba4f8), per-event photo + Copy (67ad9ce), 228 tests green. Live concept (GitHub Pages =
`prototype/`) has rounds 1-7 + the VFW theme button + #16. Headline (owner): "Shuffle up. Everyone's welcome." + "Welcome
to Mulligan Games, Warminster's friendly game store...". Decisions run to D58; owner questions to Q32.**

### Done since 2026-10-26 (newest first)
- **Counter follow-ups (D50, 61c9754):** Undo for Move in, delete a mistaken walk-in (5 min, purged after), Run it
  stored on the server per date.
- **Clips from the shop (e9f7068, c43431c):** 9 store videos; 3 play our own AI-enhanced 720p copies from
  `public/media/clips/`, 6 use TikTok's official player loaded only after a click in a sandboxed iframe (CSP
  `frame-src https://www.tiktok.com` only, D49).
- **Round 6 port + warm welcome (c43431c):** hero h1 "Welcome to Mulligan Games." + friendly lede, hours in the
  eyebrow; store photos by game on This week (`src/lib/photos.js`).
- **Theme button (D46, cbd5537; prototype 324d733):** the Warminster VFW round sun/moon button, bottom-right,
  `src/components/ThemeFab.astro`, on every page and the admin.
- **Inventory + preorders (P2.5, D41-D45, a041595):** stock ledger, low/short alerts, event stock use, preorders with
  "Arrived: call these", CSV export, preorder contacts purged 30 days after close.
- **Round 5 port (afe3d1e):** wide hero still from 900px, Google 4.9/81 row with 3 five-star quotes, cEDH fees and
  turnout (`src/content/proof.json`), TCGplayer line. Real bug fixed: the phone hero never autoplayed.
- **Hours (D39, abdee1e):** Google hours in `store.json`; a day with no row is closed.
- **Media:** 32 shop photos from every Instagram post + carousel and Facebook (`docs/research/social-assets-2.md`);
  15 Instagram reels saved locally; Real-ESRGAN AI upscaling (`tools/upscale-video.sh`, tool at `~/tools/realesrgan`,
  owner OK); 1080x1920 masters in git-ignored `media/` (Desktop only).
- **Earlier:** rounds 3-4 ports, event detail page, #14 look A + admin shell + P2.4b counter screens, P3.2 local checks
  (Lighthouse 99/100, `docs/review/p3.2-checks.md`), Dependabot bumps (owner OK to apply when tests pass).

### In progress / handed off
- **#16 hero video (owner: "a video on the front page like the VFW and Riverside sites"):** Desktop wrote
  `tools/hero-montage.sh` (8 shots: storefront sign, shop floor pan, cEDH tables, packed room pan, graded slabs over the
  lit case, Warhammer pan, cEDH play, packed room pan; crossfades; loops back to the first frame). Masters build in
  `media/` (Desktop only). Two shots still need a re-cut (see #16). Laptop: prototype side (video hero on every width
  like VFW, posters = first frame, pause, reduced motion).
- **P2.6 results and prizes:** next for the Desktop; asked the Laptop on #2 whether to spec the screens first.

### Open
- **Owner questions** in `OWNER-QUESTIONS.md` (Q21 original clips, Q22 sign-up retention, Q25-Q27 preorders/staff
  access, Q4 POS). Answered recently: D39 (hours, reviews, player counts, T-shirt only if for sale).
- **Mail alerts:** `MULLIGAN_MAIL_USER/PASS` not set on the Desktop, so board posts send no email.

### Done (2026-10-26 and before)
- **Team setup** (2cdf876): `BRIEF.md` (the goal), agents in `.claude/agents/` (boss opus/high, designer opus/high,
  coder sonnet/high, researcher sonnet/medium, mediator haiku/low). When a session runs from the home folder these
  agents don't load: spawn `general-purpose` with "follow `.claude/agents/<role>.md`" and the role's model/effort.
- **Research** in `docs/research/` (start with each file's "Top takeaways"):
  - `mulligan-public.md`: every public source except Facebook (locator, TopDeck cEDH series, reviews, tools in use).
  - `mulligan-facebook.md` (Desktop, #3): weekly schedule, upcoming one-offs, caps / min-to-fire, prize wording,
    preorders, customer questions. **Address is 445 York Rd** (the locator's "455" is a typo).
  - `stores-and-sites.md`: 12 store sites, patterns and mistakes, plus the Desktop's "Rendered look" section and
    24 screenshots in `docs/research/shots/` (#5).
  - `event-and-inventory-tools.md`: what owners use (EventLink, Play! Pokemon, KONAMI, Bandai, TopDeck, BCP, Melee,
    BinderPOS...), what our admin owns vs links out to.
- **Plan** (7632763, c097f09): `PLAN.md` (Phase 1 concept on Laptop, Phase 2 build on Desktop, Phase 3 polish and
  owner review, "Not now" list, designer brief), `DECISIONS.md` (14 rulings: events lead the home page, link out to
  official pairing tools, no online payment without owner approval, cEDH section, no player accounts, D7 data model),
  `OWNER-QUESTIONS.md`.
- **P2.1 server base** (Desktop, 7123e6d): see Phase 2 status below.

- **#9 content seed** (`src/content/`, every entry sourced; recurrence model D15). P1 concept signed off (P1.3).

### Plugins (Laptop, user scope)
`frontend-design` and `modern-web-guidance` (claude-plugins-official). Playwright skipped (needs Node).

### Laptop watcher
`bash "$TMP/mg_watch.sh"` under Monitor (30 min, re-arm on expiry; re-scans the last 6 h so nothing is missed).
After re-arming, read #2's latest comments by hand.

## Phase 2 status
- **P2.1 base port: done.** The VFW server core lives at the repo root: `server.js` (static serving from `dist/`, CSP with
  per-page script hashes, compression, ranges, body caps, same-origin CSRF check, rate limits, sign-in with lockout,
  photo upload with WebP check and sharp re-encode, `<!--mg:name-->` live markers), `src/auth.js`, `src/audit.js`
  (security log), `src/db.js` (`node:sqlite` in `DATA_DIR/mg.db`, hourly-checked daily backup), `src/stats/`
  (cookieless visits), `src/forms.js` (public-form guard with honeypot, for P2.4), `src/lib/state.js` (cleaning helpers,
  `occurrences()` / `expand()` recurrence, markers), `scripts/backup.mjs` / `restore.mjs`, `.github/workflows/checks.yml`
  (tests, npm audit, CodeQL) and `.github/dependabot.yml`.
- **Pages now (2026-10-27):** `/` (welcome hero, This week, cEDH, preorders, visit, clips, reviews), `/events/` and a
  page per date, `/new-here/`, `/privacy/`, `/signup/<token>`, `.ics` feeds, `sitemap.xml`; `/admin` with Today,
  roster/check-in, Events editor, Stock, Preorders, Store info, Dashboard, Security log, Account.
- **Left behind from VFW:** hall, inquiries, bar/taps/menu/specials, news, honor, shop, volunteers, help requests, site
  settings, TV, feeds, hero/event photos, email (nodemailer), Post details + site rebuild (`site-build.js`, `post.js`).
  Copy those from VFW when a task needs them (store facts editing needs `site-build.js` + `post.js` + `content.js`).
- **Run tests:** `npm install && npm test` (206 tests, Node 22.13+). Build: `npm run build`. Serve: `node server.js`.
- **Local admin:** `ALLOW_DEFAULT_ADMIN=1 DATA_DIR=<temp folder> PORT=<free port> node server.js` after a build, then
  `/admin` with admin / admin (testing only; production refuses it). Stop that server by its PID, never all node.
