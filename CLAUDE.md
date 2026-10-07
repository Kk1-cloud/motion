# Motion studio rules

This repo is a motion design studio where every film is a program. Claude writes `films/<name>/index.html`,
`render.mjs` turns it into frames, ffmpeg turns frames into MP4. Read `docs/KNOWLEDGE.md` once per session.
`styles/` holds 43 imported film styles (Lemo-Opuscar, MIT); `styles/README.md` maps their contract onto ours.
Any film with Persian/Farsi/RTL text: also run the `persian-motion` skill (`lib/persian.js`, `tools/lint_persian.py`).

## 0. Critique the ask before building anything
The user wants a harsh motion director, not a yes-man. On every new film request, run the
`brief-critic` skill FIRST: score the brief, name what is missing or generic, and propose a sharper
version. Never guess missing facts (product, audience, metric, assets). Ask for them or say "I don't know".
Only skip the critique if the user says "just build it", and even then list the gaps in one line.

## 1. Render contract
- Every film is a pure function of time: `window.seek(t)` paints frame t. `window.FILM = {dur, fps, bpm}`.
- No CSS transitions, no setTimeout, no requestAnimationFrame in render mode, no state carried between
  frames. Seeded randomness only (`M.rng`, `M.hash`), never `Math.random`.
- Motion comes from `lib/motion.js` springs (`M.sp`, `M.trackFeel`). No linear tweens, no CSS easings.
  A value with more than one target uses `track()`, never a restarted spring.
- Design in layout units (`M.layout(W, H).u`), not pixels, so 9:16, 1:1 and 16:9 share one timeline.
  Reframe per format; never crop a 16:9 render to vertical.
- Scene boundaries sit on the beat grid (`G.beat(n)`), never on round seconds.
- Render: `node render.mjs films/<name>/index.html` (H.264 yuv420p, CRF 16, 60 fps, 4 subframes).

## 2. Look
- Banned defaults: centered title on gradient, everything fading in, corner labels, frame borders,
  glow on UI chrome, generic particle bursts, lens flares, "AI shimmer", stock gradient meshes.
- One display face, one UI face. One accent color unless the brief says otherwise.
- Something new happens every 2 to 4 seconds. A hook lands in the first 2 seconds.
- Use the whole frame. Dead-center-everything in 9:16 is a smell: use thirds, bleed, scale contrast.
- Never redraw a real product UI from imagination. Capture it (Playwright) and animate the real thing.

## 3. Sound
- Score and SFX are synthesized in code (`tools/score.mjs`, `tools/sfx.mjs`) unless a track is supplied.
- Supplied track: measure it with `tools/beats.py` into `films/<name>/beats.json` and cut on it.
- Hits land on measured beats. Final mix is -14 LUFS (`tools/mux.sh`).

## 4. Gates (do not skip)
1. `films/<name>/brief.md` (after brief-critic), `treatment.md` (benchmark, 3 candidate structures,
   sound design table; written before reading any style's `DEMO.md`), and `shotlist.md` on the beat grid.
   Show the shot list. Library style: 3 style frames from the real drawing code first.
2. Stills: `node render.mjs films/<name>/index.html --stills beats`. LOOK at them.
3. Low-res animatic (`--w 540 --h 960 --fps 30 --sub 1`) to fix pacing before polish.
   `node tools/readcheck.mjs films/<name>/index.html` exits 0 (films define `window.TEXTS(t)`).
   Persian: `python3 tools/lint_persian.py copy` on every line and `code films/<name>` both clean.
4. Full render, then `bash tools/critique.sh films/<name>` and run the `critique-pass` skill.
5. Fix the 3 worst problems, re-render only the affected seconds (`--from --to`). Repeat until every
   score is 8+. Minimum 2 rounds. Log every round in `films/<name>/review_log.md`.
6. Only then: sound, mux, deliver.

## 5. Honesty
- Report real scores, not flattering ones. If a round did not improve a score, say so.
- If a tool is missing (ffmpeg, librosa, fonts), say what failed. Do not claim a render you did not look at.
- Effort: medium for small fixes, xhigh for new films, max when the first 3 seconds carry a launch.
