#!/bin/zsh
# Saved with the "requested listening sets" feature, which is not live yet. When it ships, copy this to
# ~/.claude/scheduled-tasks/co-gemini-audio/extra.sh for the nightly routine (see tools/co_new_set.md).
# Helper for the nightly routine's second job: making the listening sets requested on the CO page
# (tools/co_new_set.md in the repo explains the whole process). It always uses the tools from GitHub
# main, in a throwaway folder, so the user's checkout is never touched.
#   extra.sh spec                          print tools/co_new_set.md: how to write and deliver a set
#   extra.sh check <set.json>              check a written set (node tools/check_co.js --one)
#   extra.sh record <set.json> <out.mp4>   record it with Vivienne and Rémy (make_audio.py --one)
set -e
abs() { [[ -z "$1" || "$1" == /* ]] && print -r -- "$1" || print -r -- "$PWD/$1"; }
SET=$(abs "$2")
OUT=$(abs "$3")
cd /Users/ttrinh/Misc/tcf-reussir
git fetch origin --quiet
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
git archive origin/main tools site/data.js site/comp-co.js | tar -x -C "$TMP"
case "$1" in
  spec) cat "$TMP/tools/co_new_set.md" ;;
  check) node "$TMP/tools/check_co.js" --one "$SET" ;;
  record) python3 -B "$TMP/tools/make_audio.py" --one "$SET" --out "$OUT" ;;
  *) echo "usage: extra.sh spec | check <set.json> | record <set.json> <out.mp4>"; exit 2 ;;
esac
