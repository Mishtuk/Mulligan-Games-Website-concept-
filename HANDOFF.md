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
- **Reuse, don't recreate:** read `docs/research/` and the agent files before starting; extend them.
- **Usage limits:** near your limit, commit finished work, stash half-done work, file what's left as issues for the
  other machine, post a "Handoff" comment, email it, release your claims.

### Who does what (proposal, Laptop 2026-10-26)
- **Laptop** (no Node/Python): research on TCG store sites, event platforms and owner tools; `DESIGN.md`;
  static prototypes in `prototype/`.
- **Desktop** (Node, Chrome with sign-ins): Chrome research of the store's Facebook page (hours, games and formats
  they run, weekly schedule, prices, photos, logo, tone); later the Astro build reusing the Warminster VFW site.

### Now working on
- **Desktop:** #5 screenshot pass (docs/research/shots/, Rendered look section of stores-and-sites.md)
- **Laptop:** research (`docs/research/stores-and-sites.md`, `docs/research/event-and-inventory-tools.md`).
