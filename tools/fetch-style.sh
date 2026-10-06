#!/usr/bin/env bash
# Fetch one Lemo-Opuscar demo (source + poster) to READ its techniques. Not tracked, not rendered.
#   bash tools/fetch-style.sh <slug>        -> refs/styles/<slug>/  (demo/, poster.jpg)
# Only after films/<name>/treatment.md exists: the demo is a technique library, never a story source.
set -euo pipefail
S=${1:?usage: tools/fetch-style.sh <slug>   (slugs: ls styles/)}
[ -f "styles/$S/STYLE.md" ] || { echo "no styles/$S/STYLE.md: unknown slug"; exit 1; }
REPO=https://github.com/lemomo-ai/lemo-opuscar.git
TMP=refs/.lemo-opuscar; OUT=refs/styles/$S
if [ ! -d "$TMP/.git" ]; then
  git clone --depth 1 --filter=blob:none --sparse "$REPO" "$TMP"
fi
git -C "$TMP" sparse-checkout add "styles/$S" "core"
mkdir -p "$OUT"
cp -R "$TMP/styles/$S/demo" "$OUT/"
[ -f "$TMP/styles/$S/poster.jpg" ] && cp "$TMP/styles/$S/poster.jpg" "$OUT/"
echo "-> $OUT  (their engine helpers: $TMP/core)"
echo "Demo code uses window.render(t)/READY/DUR, 24 fps, 1920x1080. Port techniques into seek(t) + lib/motion.js; see styles/README.md."
