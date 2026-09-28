#!/usr/bin/env bash
# Mix score + sfx under the picture, normalize to -14 LUFS, write final.mp4.
# bash tools/mux.sh films/<name> [silent.mp4]
set -euo pipefail
D=${1:?usage: tools/mux.sh films/<name> [silent.mp4]}
V=${2:-$(ls -t "$D"/out/silent_*.mp4 | head -1)}
FF=$(node tools/ff.mjs)
IN=(-i "$V"); N=0; MIX=""
for a in "$D/audio/score.wav" "$D/audio/track.wav" "$D/out/sfx.wav"; do
  [ -f "$a" ] && { IN+=(-i "$a"); N=$((N+1)); MIX+="[$N:a]"; }
done
[ "$N" -eq 0 ] && { echo "no audio in $D/audio or $D/out/sfx.wav"; exit 1; }
"$FF" -y -loglevel error "${IN[@]}" \
  -filter_complex "${MIX}amix=inputs=$N:normalize=0,loudnorm=I=-14:TP=-1:LRA=11[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$D/out/final.mp4"
echo "-> $D/out/final.mp4"
