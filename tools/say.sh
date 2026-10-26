#!/usr/bin/env bash
# Post to the coordination board AND email the alert. Usage: tools/say.sh "Desktop: message"
# Email needs MULLIGAN_MAIL_PASS (Gmail app password of the sending account MULLIGAN_MAIL_USER) set on this machine; without it, board only.
ISSUE=$(cat "$(dirname "$0")/board_issue")
gh issue comment "$ISSUE" -R Mishtuk/Mulligan-Games-Website-concept- -b "$1" || exit 1
[ -z "$MULLIGAN_MAIL_PASS" ] && { echo "board only: MULLIGAN_MAIL_PASS not set, no email"; exit 0; }
python - "$1" "$ISSUE" <<'PY'
import os, sys, smtplib
from email.message import EmailMessage
u = os.environ["MULLIGAN_MAIL_USER"]; body, issue = sys.argv[1], sys.argv[2]
m = EmailMessage(); m["From"] = u; m["To"] = os.environ.get("MULLIGAN_MAIL_TO", "alexmishtuk@gmail.com")
m["Subject"] = "[Mulligan] " + body.split("\n")[0][:70]
m.set_content(body + f"\n\nhttps://github.com/Mishtuk/Mulligan-Games-Website-concept-/issues/{issue}")
with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s: s.login(u, os.environ["MULLIGAN_MAIL_PASS"]); s.send_message(m)
print("emailed")
PY
