#!/usr/bin/env bash
# Build the sheets Claude must LOOK at before showing anything.
# bash tools/critique.sh films/<name> [video.mp4] [strip-center-seconds]
set -euo pipefail
D=${1:?usage: tools/critique.sh films/<name> [video] [t]}
V=${2:-$( [ -f "$D/out/final.mp4" ] && echo "$D/out/final.mp4" || ls -t "$D"/out/silent_*.mp4 | head -1 )}
T=${3:-}
FF=$(node tools/ff.mjs); O="$D/out"; mkdir -p "$O"
DUR=$( ("$FF" -i "$V" 2>&1 || true) | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' | awk -F: '{print $1*3600+$2*60+$3}')
ROWS=$(awk -v d="$DUR" 'BEGIN{r=int((d*2+5)/6); print (r<1?1:r)}')
# Contact sheet: 2 fps, 6 across. Left to right, top to bottom, 0.5s apart.
"$FF" -y -loglevel error -i "$V" -vf "fps=2,scale=270:-1,tile=6x${ROWS}:padding=4:color=white" -frames:v 1 "$O/contact.png"
# Phone test: 1 fps at 360 px wide. If you can't read it here, nobody can.
"$FF" -y -loglevel error -i "$V" -vf "fps=1,scale=360:-1,tile=5x$(( (${DUR%.*}+5)/5 )):padding=4:color=white" -frames:v 1 "$O/phone.png"
# Strip: 12 consecutive frames around a fast action (pops, overlaps, text collisions).
if [ -n "$T" ]; then
  "$FF" -y -loglevel error -ss "$(awk -v t="$T" 'BEGIN{print (t>0.1?t-0.1:0)}')" -i "$V" -vf "scale=320:-1,tile=12x1:padding=2" -frames:v 1 "$O/strip.png"
fi
# Loop seam: first vs last frame side by side. They should match for loops.
"$FF" -y -loglevel error -i "$V" -vf "select='eq(n\,0)',scale=360:-1" -frames:v 1 "$O/_first.png"
"$FF" -y -loglevel error -sseof -0.05 -i "$V" -vf "scale=360:-1" -update 1 -frames:v 1 "$O/_last.png"
"$FF" -y -loglevel error -i "$O/_first.png" -i "$O/_last.png" -filter_complex hstack "$O/seam.png"
rm -f "$O/_first.png" "$O/_last.png"
echo "look at: $O/contact.png $O/phone.png $O/seam.png ${T:+$O/strip.png}"
echo "then score with prompts/critique-pass.md and log to $D/review_log.md"
