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
for f in Code WebAuthn Attendance Admin Hr Leave Payroll Performance Dashboard Reports Engage Compliance Shifts Relations Custody Demo GovServices Expenses Journal Flows Recruitment Loans Training Insurance Announce HelpDesk Wave5 Wave6; do [ -f "$SRC/backend/$f.gs" ] && cp "$SRC/backend/$f.gs" "$f.js"; done
clasp push -f | head -1
clasp deploy -i "$DEP" -d "$MSG" | tail -1
curl -sL "$URL" | grep -q '"ok":true' || { echo "backend did not answer JSON after deploy"; exit 1; }
echo "backend: live"

cd "$SRC/../app"
git add -A
git -c core.autocrlf=false commit -q -m "$MSG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || echo "site: nothing new to commit"
git push -q home main   # BASMA's home: https://mohamedmahdi2025.github.io/ (repo MohamedMahdi2025/mohamedmahdi2025.github.io)
git push -q origin main # the old link (BesGasKSA/BG-attendance), kept while people move with the one-tap move
echo "site: pushed (live in about a minute)"
# GitHub Pages sometimes skips a push or leaves a deploy "in progress". Wait up to 6 minutes for the live build; only then
# publish once more (an empty commit). Never push again while GitHub may still be deploying: a second deploy on top of a
# running one is what gets stuck.
WANT=$(grep -oE '[0-9]{8}.[0-9]+' version.json)
for attempt in 1 2; do
  for i in $(seq 1 72); do
    GOT=$(curl -s --max-time 15 "https://mohamedmahdi2025.github.io/version.json?nc=$(date +%s%N)" | grep -oE '[0-9]{8}.[0-9]+' || true)
    [ "$GOT" = "$WANT" ] && break 2
    sleep 5
  done
  if [ "$attempt" = 1 ]; then echo "site: not live after 6 minutes, publishing once more"; git commit --allow-empty -q -m "Republish $WANT" && git push -q home main || echo "site: republish push failed"; fi
done
if [ "${GOT:-}" = "$WANT" ]; then echo "site: live $WANT"; else echo "site: WARNING live is still $GOT (wanted $WANT) - check GitHub Pages"; fi

cd "$SRC"
git add -A
git -c core.autocrlf=false commit -q -m "$MSG" || true
echo "source: committed locally"
git push -q origin HEAD:main 2>/dev/null && echo "source: pushed to MohamedMahdi2025/Basma" || echo "source: committed locally (push to Basma did not go through)"
