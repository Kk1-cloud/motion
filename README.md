# motion

A motion design studio where every film is code: `window.seek(t)` paints a frame, a headless browser
renders it, ffmpeg encodes it. Springs, beat grid, synthesized sound, and a critique loop where
Claude has to look at its own frames before it shows you anything.

## Setup
```bash
npm i                      # playwright (uses the preinstalled Chromium if present)
pip install numpy librosa  # only for measuring a supplied track
# ffmpeg: system ffmpeg, $FFMPEG, or `pip install imageio-ffmpeg`
```

## Make a film
In Claude Code: `/motion-reel <what you want>`. It critiques your brief first (`/brief-critic`),
then follows the gates in `CLAUDE.md`.

By hand:
```bash
npm run new -- my-film
node tools/score.mjs films/my-film --bpm 120 --bars 8          # or tools/beats.py on your track
node render.mjs films/my-film/index.html --stills beats         # one still per beat
node render.mjs films/my-film/index.html                        # 1080x1920, 60 fps, motion blur
node render.mjs films/my-film/index.html --w 1080 --h 1080      # same timeline, square
node render.mjs films/my-film/index.html --from 4 --to 6        # re-render a slice
node tools/sfx.mjs films/my-film/cues.json films/my-film/out/sfx.wav 16
bash tools/mux.sh films/my-film                                 # -> out/final.mp4 at -14 LUFS
bash tools/critique.sh films/my-film "" 4.2                     # contact / phone / seam / strip sheets
```
Open `films/_starter/index.html` in a normal browser for a live looping preview.

## Layout
| Path | What |
|------|------|
| `CLAUDE.md` | House rules: render contract, banned looks, gates |
| `docs/KNOWLEDGE.md` | What was learned, and where the source article is wrong |
| `.claude/skills/` | `brief-critic`, `motion-reel`, `critique-pass` |
| `prompts/` | One-liner, brand reel, state spec, reference, director's brief templates |
| `lib/motion.js` | Springs, track, indicator, swapAlpha, seeded rng, beat grid, layout units |
| `render.mjs` | Deterministic renderer (video, slices, stills, any format) |
| `tools/` | score synth, sfx, beat analysis, mux, critique sheets |
| `films/_starter/` | Starter film to copy |
