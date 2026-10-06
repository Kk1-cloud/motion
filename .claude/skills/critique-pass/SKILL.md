---
name: critique-pass
description: Make Claude watch its own rendered frames and fix them like a harsh motion director. Use after every render of a film in this repo, before showing the user anything, and whenever the user says a video looks mid, generic, off, or asks to polish it.
---

# Critique pass

Iteration is the method, not a failure. Clips that go viral had cleanup rounds; clips posted
with "it's a bit mid" skipped this step.

## 1. Build the evidence
```bash
bash tools/critique.sh films/<name> [video] [t-of-fastest-action]
node render.mjs films/<name>/index.html --stills beats      # exact frames, no blur
node tools/readcheck.mjs films/<name>/index.html [--safe reels]   # reading time, exit 0 required
```
`critique.sh` also prints black runs (blackdetect); every one must be intended.
For fast actions, build 0.2 s strips (`--stills 4.0,4.2,4.4,...`) at full size.
Open and actually look at `out/contact.png`, `out/phone.png`, `out/seam.png`, `out/strip.png`
and a handful of `out/stills/*.png` with the Read tool. Do not score from the code.

## 2. Score 1-10, as a harsh director, not a proud author
| Dimension | 8+ means |
|-----------|----------|
| Hook (first 2 s) | frame 1 already has a strong image; nothing fades up from black |
| Readability at 360 px | every word legible in phone.png; nothing under ~3u text height |
| Motion quality | springs, no linear slides, no pops, no dead frames in strip.png |
| Variety | a new thing every 2-4 s; no two consecutive shots use the same technique |
| Composition | uses the whole frame; scale contrast; not everything dead-center |
| Brand accuracy | real UI/logo/colors/fonts; nothing invented |
| Sound sync | cuts and hits on beats.json; checked by timestamp, not by feel |
| Loop / ending | seam.png matches for loops; otherwise the end is an action, not just a logo |
| Rhythm | pace varies: one acceleration, one held breath; not one even speed; readcheck passes |
| Camera | 4+ distinct moves, one signature shot, transitions built from the medium, subject >= 1/3 frame height at key moments |
| Style fidelity | (library styles only) every rule in `STYLE.md` holds; 4 of 6 differ from `DEMO.md` |

## 3. Hunt list (check each explicitly)
Text overlapping during swaps · anything sliding at constant speed · corner labels and frame borders ·
centered-on-gradient shots · blurry scaled text · a beat with nothing happening · a stutter at the
loop seam · text inside a container visible before the container finished growing · two shots in a
row with the same move · colors outside the palette · safe-area violations in 9:16 (top 12u, bottom 12u) · on-screen sentences
missing a subject, object or verb when read with the sound off · a wrapped line that leaves one word
alone (break at the comma or shrink the type instead) · subject too small or jammed against an edge ·
colour on the same colour (red on red) · subtitles covering the subject · a gag too fast to read ·
blank frames in a transition · a spotlight/iris/caption that loses its subject after a camera move ·
a visible action with no sound · no silence anywhere · a sign-off or name carried over from a demo.

## 4. Log, fix, repeat
Append to `films/<name>/review_log.md`:
```
## Round N  (render: <file>)
scores: hook 6 · read 8 · motion 7 · variety 5 · comp 6 · brand 8 · sync 7 · loop 9 · rhythm 6 · camera 5 · style 7
worst 3:
1. 3.0-5.0s  grid shot and title shot both scale-from-center, reads as a repeat → swap grid to a wipe
2. ...
fix plan / done:
```
Fix the 3 worst. Re-render only the affected seconds with `--from/--to`, then rebuild the sheets.
Repeat until every score is 8+ (minimum 2 rounds). If a score will not move, say why (missing asset,
missing track, engine limit) instead of inflating it.

## 5. Report to the user
Show the latest contact sheet, the score table (round 1 vs latest), what changed, and the one thing
you would improve next with more time.
