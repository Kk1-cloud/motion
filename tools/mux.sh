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
# Two-pass loudnorm: pass 1 measures, pass 2 applies a linear gain. Single-pass (dynamic) mode
# misses the target by 1-2 LU on short, dynamic mixes and can overshoot true peak after AAC.
PRE="${MIX}amix=inputs=$N:normalize=0"
M=$("$FF" -hide_banner "${IN[@]}" -filter_complex "$PRE,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$M" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
LN="loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true"
"$FF" -y -loglevel error "${IN[@]}" \
  -filter_complex "$PRE,$LN,aresample=48000[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart "$D/out/final.mp4"
echo "-> $D/out/final.mp4"
