#!/usr/bin/env bash
# Publish Best Gas Attendance: bash tools/deploy.sh "what changed"
# Stops at the first failure. Order: tests -> build -> Apps Script -> GitHub Pages.
set -euo pipefail
MSG="${1:?give a short description of the change}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEP="16AKfycbz1XJ-WF6qnXiGtieQev6g53pAMThwCWhpp7r-pwbWtQi-ShJrpQIJUFHr17E3AryKG"
DEP="${DEP:2}"
URL="https://script.google.com/macros/s/$DEP/exec"

cd "$SRC"
for t in tests/*.js; do
  case "$t" in *harness.js|*preview-*) continue ;; esac
  node "$t" | tail -1 | grep -q " 0 failed" || { echo "FAILED: $t"; node "$t" | grep FAIL; exit 1; }
done
echo "tests: all passed"
node tools/build.js

cd "$SRC/../apps-script"
for f in Code WebAuthn Attendance Admin Hr Leave Payroll Performance; do [ -f "$SRC/backend/$f.gs" ] && cp "$SRC/backend/$f.gs" "$f.js"; done
clasp push -f | head -1
clasp deploy -i "$DEP" -d "$MSG" | tail -1
curl -sL "$URL" | grep -q '"ok":true' || { echo "backend did not answer JSON after deploy"; exit 1; }
echo "backend: live"

cd "$SRC/../app"
git add -A
git -c core.autocrlf=false commit -q -m "$MSG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || echo "site: nothing new to commit"
git push -q origin main
echo "site: pushed (live in about a minute)"

cd "$SRC"
git add -A
git -c core.autocrlf=false commit -q -m "$MSG" || true
echo "source: committed locally"
