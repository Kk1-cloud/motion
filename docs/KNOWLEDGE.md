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

## Not included (on purpose)
- Remotion / HyperFrames (route B). Add them if you need templated series or a React team to reuse
  components. Route A has zero dependencies and is what the model picks by default.
- Generate-then-trace with a video model. Costs money per shot and raises rights questions about the
  base footage. Add it per project with a budget and a key in `.env`.
- Voice (ElevenLabs etc.). Same: per project, key by name in `.env`.
