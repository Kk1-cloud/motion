---
name: motion-reel
description: Make a product film, showreel, launch video, motion ad, animated explainer, UI morph loop or music video rendered from code in this repo. Use when the user asks for any motion design video or animation, or runs /motion-reel.
---

# Motion reel

The prompt is 10% of the video. The harness is the other 90%. Follow the gates in CLAUDE.md.

## 0. Critique the ask
Run the `brief-critic` skill on the request. Wait for answers to the unknowns unless told "just build it".
Any Persian/Farsi/RTL text on screen: load the `persian-motion` skill too and start from
`npm run new -- <name> --fa`.

## 1. Inputs to have before code
Product + URL (or subject), audience + channel, duration, formats (9:16 / 1:1 / 16:9),
brand colors + fonts + one accent, a reference (frame, video or image folder), music (file or "synthesize"),
the one metric or payoff. Missing ones get a labeled default, never a silent guess.

## 2. Pipeline
1. `npm run new -- <name>`. Write `films/<name>/brief.md` (final brief after critique).
2. Assets: if there is a URL, capture real screenshots, logo, colors, fonts with Playwright into
   `films/<name>/assets/`. List what you found. Never redraw UI from imagination.
3. Style and treatment. If the brief names a library style, read `styles/<slug>/STYLE.md` and
   `styles/README.md` (how their contract maps onto ours). Then, BEFORE opening that style's `DEMO.md`,
   write `films/<name>/treatment.md`: a benchmark (1-2 real works: learn / don't take), three candidate
   structures and why one wins, logline and arc (one subject, one goal, one turn), the native move at the
   peak, a sound design table (ambience / foley / music per section, two silences, two sound
   transitions). Only then read `DEMO.md` and, if you need its code, `bash tools/fetch-style.sh <slug>`.
   Compare with the demo on structure, opening, signature shot, camera path, score shape, ending:
   at least four of six must differ.
   Style frames: render 3 stills of the real drawing code (one is the signature shot) and check them
   against `STYLE.md` before the shot list.
   Reference (non-library): if one exists, extract frames (`ffmpeg -i ref.mp4 -vf fps=2 refs/frames/%03d.png`),
   look at them, write `films/<name>/style_guide.md` (palette hex, type family/weight/tracking, shot
   lengths, transition types, camera moves, texture, how text enters/exits). Take the grammar, never
   the content, logos or characters.
4. Music: supplied → `python3 tools/beats.py track.wav > films/<name>/beats.json` and copy to
   `films/<name>/audio/track.wav`. Otherwise `node tools/score.mjs films/<name> --bpm 120 --bars N`.
5. `films/<name>/shotlist.md` on the beat grid: for every shot, beat range, image, camera, text,
   technique, SFX. Hook in the first 2 s, new payoff every 2-4 s, no technique twice in a row. Show it.
6. Build `index.html` with `window.seek(t)`, springs from `lib/motion.js`, layout units, scene
   boundaries on `G.beat()`. Read `beats.json` if timings come from a measured track. Define
   `window.TEXTS(t)` (see `films/_starter`) and run `node tools/readcheck.mjs films/<name>/index.html`
   (add `--safe reels` etc. for vertical social). Exit 0 before any full render; exit 2 is not a pass.
   Anything that follows a subject goes through one world-to-screen function.
7. Stills → animatic → full render (see CLAUDE.md gates). Then `critique-pass`, 2+ rounds, until 8+.
8. SFX: write `films/<name>/cues.json` from the shot list (clicks on UI actions, thumps on downbeats,
   whooshes on camera moves). `node tools/sfx.mjs films/<name>/cues.json films/<name>/out/sfx.wav <dur>`.
9. `bash tools/mux.sh films/<name>` → `out/final.mp4` at -14 LUFS.
10. Other formats: re-render with `--w/--h`, check each one's contact sheet (reframe, don't crop).
11. Deliver: final.mp4 per format, contact.png, a poster frame (`--stills <t>`), review_log.md,
    and what you would improve next.

## Techniques that read as expensive (pick per shot, never all at once)
- One container that never cuts, morphing size/radius/fill between UI states, content swapped behind
  a short blur (`M.swapAlpha`), cursor driving every change.
- Stretching indicators (`M.indicator`): leading edge stiffer than trailing edge.
- Kinetic type with scale contrast: one huge word, the rest small. Words land on beats.
- Stagger by distance from a focal point, not by index.
- Match cuts: the last shape of shot N becomes the first shape of shot N+1.
- Camera: a slow push (1.00 → 1.06) over a held shot beats a static frame. Never scale text with
  CSS `will-change` (blurry).
- Motion blur via subframes (`--sub 4`) on fast moves; stills for critique use `--sub 1`.
- One signature shot per film: a oner, a scale reveal, or a transition made from the medium itself.
- At least four different camera moves across the film; one acceleration and one held breath.
- Silence before the turn; the first sound after it is one of the most important in the film.

## Hard rules
- Real product UI only. No Math.random, timers or CSS transitions in render mode.
- Banned: corner labels, frame borders, centered title on gradient, everything fading in, particle bursts.
- API keys live in `.env` by name (e.g. `ELEVENLABS_API_KEY`). Never paste a key into a prompt or file.
