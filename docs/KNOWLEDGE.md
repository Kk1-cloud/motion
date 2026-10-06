# What this studio knows

Distilled from "How to build a motion design studio with Opus 5.5 (full course)" by @0xmovez,
plus corrections found while building and testing this harness. Where the article is wrong or
overstated, it says so below.

## The core idea
- The model outputs text, never video. Every "AI motion video" in that trend is a program that
  paints frames. The winning shape: one pure function `seek(t)`, a headless browser calling it N times,
  ffmpeg stitching. Deterministic, so a fix is one edit plus a re-render of just those seconds.
- The prompt is ~10% of the result. The harness (renderer, springs, beat grid, sound, critique loop,
  reference) is the other 90%. "One-shot" posts often hid a 10k-character brief, skills and API keys.
- The single biggest lever: the model LOOKING at its own frames and fixing them. Posts that went
  viral had cleanup rounds (one was openly 163 model calls over ~7 hours).

## Prompt ladder (weakest to strongest)
1. **One-liner** ("showreel for a résumé, go all out"). Tests the engine. Contains no idea, so it
   produces "brief contagion": everyone's reel rhymes.
2. **Brand reel**: URL + "use real screenshots, logo, assets" + "must have music". Real assets beat
   imagined UI every time.
3. **Reference**: name a style, attach a frame, or point at a video/library. Ask for a
   `style_guide.md` first. Take the grammar, never the content.
4. **State spec** (XML): inputs to ask for, direction, beat-by-beat state list, build rules, gotchas.
   One element that never cuts, morphing between UI states, cursor-driven, last frame = first.
5. **Director's brief**: logline, references, tools/keys/budget, character bible, beat sheet, text
   rules, workflow gates, critique loop, deliverables. Treat it as hiring a crew.

## Motion craft
- Springs, not easing curves. Closed-form so they stay a pure function of time.
- Multiple targets: sum one spring per change (`track`). Never restart a spring.
- Feel by role: snappy (UI), base (containers, camera), heavy (big type, logos), playful (mascots).
- Stretch: leading and trailing edges on different stiffness.
- Content in a morphing box: in after the morph starts, out before the next one.
- Motion blur: render 4 subframes per frame and average them (`--sub 4`).
- Every 2-4 s something new happens. Hook in 2 s. No technique twice in a row.
- Scene boundaries on beats, not round seconds.

## RTL / Persian / Arabic
- Load fonts explicitly (`M.loadFonts`, assign to `window.FILM_READY`). Canvas never triggers
  @font-face loading, so text silently renders in a fallback font. `render.mjs` awaits it.
- Load both the arabic and latin subsets with unicode ranges: mixed lines ("منبع: Startup Genome")
  need both. Use `M.text(..., {dir: 'rtl', align: 'right'})`; canvas handles shaping and bidi.
- Persian digits and ٪ via `M.faDigits`. Draw arrows, checks and crosses as shapes: most Persian
  fonts lack ↑ ↓ ✅ ❌ glyphs, and emoji break the look.
- Reels/TikTok put action buttons on the RIGHT, exactly where RTL text is anchored. Use
  `M.safeRect(W, H, 'reels')` and preview with `--q safe` if the film draws the overlay.
- "Clean, ease-out, no bounce" = critically damped springs (`calm`, `crisp`), never `snappy`.

## Series and VO-first work
- Put everything reused across episodes (palette, motif, icons, end card, crack positions) in a
  per-series kit file that every episode loads unchanged. Seeded shapes stay identical.
- Keep all scene and word timings in one constants object at the top. When the voice-over arrives,
  retiming is editing that object, not hunting through draw code.

## Sound
- If a track is supplied, measure it (beats, downbeats, onset hits) and cut to it.
- Otherwise synthesize score and SFX on the same timeline as the picture. Sound is where
  "AI video" starts to feel like a film.

## Directing (from Lemo-Opuscar's DIRECTOR.md and TECHNIQUE.md)
Source: github.com/lemomo-ai/lemo-opuscar at `b65efe6`, MIT. 43 styles imported into `styles/`
(see `styles/README.md`). Their order of judgement: **sound, rhythm, camera, directing**. Pretty
frames are the entry ticket, not the score.

- **Benchmark before writing.** Pick 1-2 real works that set the bar for this style AND this topic.
  Write what to learn (composition, pacing, camera grammar, colour logic, score structure) and what not
  to take (characters, designs, melodies, shots, logos, fonts). They claim this lifts quality more than
  any rule. That is their claim; I have not measured it.
- **Treatment before code** (`films/<name>/treatment.md`): three candidate structures (journey,
  before/after, countdown, list that turns...) and why one wins; logline and arc; benchmark; shot list
  with framing, angle, move, duration and WHY; beat sheet; cue map; sound design table; title design.
  The first idea a style suggests is its cliché. Three candidates force a second idea.
- **Story shape**: one subject, one goal, one turn. Hook in 3 s (ours: 2 s). An ending that echoes the
  opening. **One native move** at the emotional peak: a transition only this medium can do (a fold
  that becomes a cut, ink that blooms into the next scene, a grid that snaps into the logo). Each
  `STYLE.md` lists its native moves.
- **Prove the look first**: three style frames (one is the signature shot) rendered with the real
  drawing code, or a model sheet for characters. Not a mock-up.
- **Sound is half the film**: every visible action has a sound matched to its material; three layers
  (ambience, foley, music) with music ducked under voice and key foley; **at least two silences** before
  the turn or peak, and the first sound after the silence is one of the most important; **sound as a
  transition at least twice** (J-cut: next scene's sound early; L-cut: last scene's sound runs over).
  Score in the style's own instruments, not generic piano and strings.
- **Rhythm**: the cue map comes before animation. Vary pace: one clear acceleration or deceleration and
  one breath (a held shot). One even speed = failed. One action, one sound, one cut, but do not cut on
  every beat. Our "something new every 2-4 s" can be met by a camera move or a sound, not only by
  swapping text.
- **Reading time** (enforced by `tools/readcheck.mjs`): after text finishes entering, hold it
  `chars / 15 + 1.5 s` (Latin), `chars / 4.5 + 1.5 s` (Chinese); subtitles at least 1.8 s and spoken
  line + 0.6 s; title cards 4 s. Fast = fewer words per screen, never cutting before people finish.
  Persian/Arabic: no measured rate in their repo or ours. The tool uses the Latin rate as a floor.
- **Camera**: at least four different moves and real changes of framing; 2D has a camera too (push,
  pull, parallax, focus pull, frame within frame). One signature shot (a oner, a scale reveal, a
  transition built from the medium). Transitions inside the medium, one consistent grammar, no default
  fades. At key moments the subject fills at least a third of frame height.
- **One world-to-screen function.** Anything that follows a subject (iris, spotlight, zoom, caption
  pointer) goes through it, never hand-typed screen coordinates. Otherwise it drifts when the camera moves.
- **Performance** (code-rigged characters): anticipation, action, follow-through; blend poses, never
  switch inside an `if`; held props sit between the palms; a rolling object turns by distance / radius;
  shoulder rotation is abduction then flexion (the reverse crosses raised arms into an X). Check
  expressions at final size: "worried" and "angry" are one eyebrow flip apart.
- **The failures they saw most**: subject too small or jammed against the edge; too dark, or colour on
  the same colour; subtitles covering the subject; a gag too fast to read; blank frames in
  transitions; a tracked effect that loses its subject after a camera move.
- **Not the demo again**: compare against the style's `DEMO.md` on structure, opening, signature shot,
  camera path, score shape, ending. At least four of six must differ.
- **Low end**: synthetic scores turn bass-heavy. Keep 20-120 Hz around -3 dB relative to the rest, skip
  pad notes below MIDI 48, give the bass 2nd/3rd harmonics so it speaks on phone speakers.
- **Voice before mix**: TTS has a high peak-to-average ratio. Compress it first, then balance by RMS,
  voice about 10 dB over music. Spell numbers out in TTS text, write digits in subtitles. Transcribe
  every generated line back (speech-to-text) before trusting it.
- **Capture speed**: they screenshot JPEGs with several browser workers and add grain in ffmpeg (grain
  drawn in the page makes every frame incompressible). Our renderer is one page and PNG via `toDataURL`.
  I have not benchmarked theirs against ours.

## Where the article is wrong or thin (fixed here)
- **Its spring treats overdamped (z > 1) as critical.** That settles faster than the stiffness and
  damping you asked for. `lib/motion.js` implements the real overdamped solution.
- **Its `lib/motion.js` uses `export` but its `index.html` is a classic script loaded over `file://`.**
  Chromium blocks ES module imports from `file://`, so the pieces as written don't connect.
  Here, `render.mjs` serves the repo over a local http server and the lib is a classic script.
- **Per-frame locator screenshots** go through the compositor. This harness reads the canvas
  directly (`toDataURL`). Measured here: 360 frames at 1080x1920 in about 9 s. I did not benchmark
  the article's method, so I can't give a speed ratio.
- **`downbeats = beats[::4]`** assumes the first detected beat is a downbeat. Often false (pickups,
  intros). Check by ear or shift the offset.
- **"-14 LUFS" appears in its rules but no step does it.** `tools/mux.sh` applies loudnorm.
- **Its SFX writer is mono and never normalizes.** Summed cues clip. `tools/wav.mjs` writes stereo
  and peak-normalizes.
- **Its determinism check hashes the MP4.** That tests the encoder too. Hash stills instead (done
  here: identical across runs).
- **A 2 fps contact sheet can't see anything shorter than 0.5 s.** Pops and one-frame overlaps hide
  between samples. Use the strip around fast actions.
- **View counts are not quality.** The examples are survivorship: we see the hits, not the hundreds
  of mid attempts from the same one-liner.
- I could not open the X posts themselves, so the view counts, prompt lengths and hour counts quoted
  above are the article's claims, not things I verified.

## Where Lemo-Opuscar and this repo disagree
- **Eases vs springs.** Their STYLE.md files specify cubic-bezier eases and "no spring". What they mean
  is "no overshoot". Critically damped springs (`calm`, `crisp`) give that and stay in our contract.
- **24 fps vs 60 fps.** Their films are 24 fps, and several styles (cel, pixel, stop-motion) are
  defined by stepping. Ours default to 60 fps with motion blur, which can make those styles look like
  smooth Flash. For a stepped style, render 24 fps or step on 12/15/20/30 (see `styles/README.md`).
- **Ask once vs critique.** They ask one round of questions then fill gaps with defaults. Ours
  critiques the brief first and refuses to guess facts. Ours wins for facts; their defaults list
  (length, format, language, loudness) is fine for everything else.
- **16:9 vs 9:16.** Their pixel numbers assume 1920x1080. Convert to `u` and reframe; do not crop.

## Not included (on purpose)
- Remotion / HyperFrames (route B). Add them if you need templated series or a React team to reuse
  components. Route A has zero dependencies and is what the model picks by default.
- Generate-then-trace with a video model. Costs money per shot and raises rights questions about the
  base footage. Add it per project with a budget and a key in `.env`.
- Voice (ElevenLabs etc.). Same: per project, key by name in `.env`.
