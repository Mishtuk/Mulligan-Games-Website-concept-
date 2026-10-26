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
- **Usage limits:** near your limit, commit finished work, stash half-done work, file what's left as issues for the
  other machine, post a "Handoff" comment, email it, release your claims.

### Who does what (agreed on #2, 2026-10-26)
- **Laptop** (no Node/Python): research, `DESIGN.md`, static prototypes in `prototype/` (open from disk, no build).
- **Desktop** (Node, Chrome with sign-ins): Chrome research and screenshots, the Astro build reusing the Warminster
  VFW site, tests.

### Now working on
- **Laptop:** out of usage (claims released).
- **Desktop:** P1.3b designer (`DESIGN.md`); P2.2a coder: events data + admin API (`src/lib/events.js`, `src/lib/games.js`, `src/db.js`, `server.js`, `test/events.test.js`); Dependabot PRs #6-8 (waiting on owner OK to merge).

## Status (handoff, 2026-10-26)
**Research is done, the plan is set, the server base is ported, the design is signed off (P1.3, 2026-10-26). P2.2 can start;
P1.3b (DESIGN.md for D16-D18) comes before P2.3 / P2.4.**

### Done
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

### In progress
- **P1.1 designer (Laptop):** `DESIGN.md` + `prototype/` (index.html, tokens/site css, `data/sample.js` with the real
  schedule). Not committed yet. Next: P1.2 prototype of events page and admin (Today / check-in, events, inventory),
  then P1.3 designer review and sign-off. Post on #2 when signed off; that unblocks P2.2 onward.
- **#9 content seed: done.** `src/content/` (store, games, 22 series, 2 preorders), every entry sourced, unsourced facts null + `todo`; `test/content.test.js` (https-only links). Recurrence model ruled in D15.

### Open
- **Owner questions** (`OWNER-QUESTIONS.md`): hours, POS in use, 40k league app, online payment, logo / photo
  permission, which Discord, hosting. Facebook images can't be downloaded, so the concept uses a placeholder
  wordmark until the owners supply a logo.
- **PRs #6-8:** Dependabot bumps (astro, codeql) from the ported base; the Desktop merges them when tests pass.

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
- **Pages:** `/` is a placeholder; `/admin` has sign-in, Dashboard (visits, pages, referrers, security summary), Security
  log and Account (change password). No events, sign-ups, inventory, store facts or public UI yet (P2.2 onward).
- **Left behind from VFW:** hall, inquiries, bar/taps/menu/specials, news, honor, shop, volunteers, help requests, site
  settings, TV, feeds, hero/event photos, email (nodemailer), Post details + site rebuild (`site-build.js`, `post.js`).
  Copy those from VFW when a task needs them (store facts editing needs `site-build.js` + `post.js` + `content.js`).
- **Run tests:** `npm install && npm test` (41 tests, Node 22.13+). Build: `npm run build`. Serve: `node server.js`.
- **Local admin:** `ALLOW_DEFAULT_ADMIN=1 DATA_DIR=<temp folder> PORT=<free port> node server.js` after a build, then
  `/admin` with admin / admin (testing only; production refuses it). Stop that server by its PID, never all node.
