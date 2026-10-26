#!/usr/bin/env bash
# Board check for the coordination issue (number in tools/board_issue). Usage: tools/board_check.sh Desktop|Laptop
# Prints one line:  NEW_<OTHER> (they posted after you: answer)  <OTHER>_SILENT (your post > 45 min, no reply)
#                   WAITING (already reminded)  OK  ERROR
# ponytail: 45 min threshold hard-coded; make it an arg if the cadence changes.
ME=${1:-Desktop}; ISSUE=$(cat "$(dirname "$0")/board_issue")
gh api "repos/Mishtuk/Mulligan-Games-Website-concept-/issues/$ISSUE/comments?per_page=100" --paginate --jq '.[] | [.created_at, (.body|.[0:40]|gsub("\n";" "))] | @tsv' 2>/dev/null |
python -c '
import sys, datetime as d
me=sys.argv[1]; other="Laptop" if me=="Desktop" else "Desktop"; O=other.upper()
rows=[l.rstrip("\n").split("\t",1) for l in sys.stdin if "\t" in l]
them=[r for r in rows if r[1].startswith(other)]; mine=[r for r in rows if r[1].startswith(me)]
if not rows: print("ERROR no comments read (gh failed?)"); sys.exit()
if them and (not mine or them[-1][0] > mine[-1][0]): print("NEW_"+O, them[-1][0], them[-1][1]); sys.exit()
if not mine: print("OK nothing posted yet"); sys.exit()
age=(d.datetime.now(d.timezone.utc)-d.datetime.fromisoformat(mine[-1][0].replace("Z","+00:00"))).total_seconds()/60
if mine[-1][1].startswith(me+": reminder"): print("WAITING reminded, %d min" % age)
elif age > 45: print(O+"_SILENT %d min since" % age, mine[-1][0])
else: print("OK last %s post %d min ago" % (me, age))
' "$ME"
