# Style library (imported from Lemo-Opuscar)

43 film styles from [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar), commit
`b65efe6` (2026-10-05), MIT (`LICENSE.lemo-opuscar`). Imported: each style's `STYLE.md`, `DEMO.md`
and `style.json`. Not imported: demo source, fonts, audio, posters, models (about 88 MB, mostly
third-party assets with their own licences). Fetch one demo when you need its code:
`bash tools/fetch-style.sh <slug>` (goes to `refs/`, ignored by git).

Full list with categories and demo titles: [`CATALOG.md`](CATALOG.md).

## What each file is for

| File | Use it | Never |
|---|---|---|
| `STYLE.md` | The style's invariants: materials, colour logic, type, motion quality, camera vocabulary, sound palette, native moves, pitfalls. Keep all of it. | Bend the user's topic toward it. |
| `DEMO.md` | How their one demo was built. Read AFTER `treatment.md` exists, for techniques only. | Copy its story, arc, shots, props, timings, score shape, or end card. |
| `style.json` | Name, category, typical uses. Use to suggest styles. | - |

## Translating a STYLE.md into this harness

Their films and ours share the idea (a deterministic `render(t)` in a headless browser), but the
contracts differ. House rules in `CLAUDE.md` win. Where a style genuinely needs something the house
rules ban, write it as a named exception in `brief.md` and get the user's OK before building.

| Lemo-Opuscar | This repo |
|---|---|
| `window.render(t)`, `window.DUR`, `window.READY` | `window.seek(t)`, `window.FILM.dur`, `window.FILM_READY` |
| `window.TEXTS(t)` for readcheck | same name and shape; run `node tools/readcheck.mjs` |
| `window.EV` sound events | `films/<name>/cues.json` for `tools/sfx.mjs` |
| 1920x1080, 24 fps by default | 1080x1920, 60 fps, 4 subframes by default. Pixel values in a STYLE.md were written for 1920x1080, where 1u = 10.8 px (so 96 px margin is about 9u). Convert to `u`, then reframe per format. |
| `cubic-bezier(.7,0,.2,1)`, `eo`, `ss` eases, "no overshoot, no spring" | `M.sp(t, 'calm')` or `'crisp'` (critically damped: no overshoot). The style's intent is "no bounce", which these give. |
| "linear" for drawn lines, playheads, plotters | House rule bans linear tweens. A constant-speed mechanical move is a legitimate style trait: list it as an exception in `brief.md`. |
| "Animate on twos" (12 fps stepping) | Quantize the character's time: `const tc = Math.floor(t * 12 + 1e-6) / 12` (the epsilon stops float error from flipping a step). Keep camera and light on smooth `t`. At 60 fps with `--sub 4`, steps of 12, 15, 20 or 30 per second align with frame groups; 24-per-second steps straddle frames and ghost under motion blur. For a true 24 fps film look render `--fps 24` (exception in `brief.md`). |
| Grain added by `mux.sh` (`noise=c0s=N:allf=t`) | Not implemented in `tools/mux.sh` (it stream-copies video). Do not draw grain in the page: every frame becomes incompressible. |
| `TREATMENT.md` | `films/<name>/treatment.md` (see `docs/KNOWLEDGE.md`, Directing) |
| Kokoro / edge-tts voice, faster-whisper check | Not in this repo. Per project, if the brief needs a voice. |
| Sample libraries (VSCO 2 CE, Salamander...) | Not in this repo. `tools/score.mjs` synthesizes. A style's sound palette may need real instruments: say so instead of faking them with sines. |
| three.js demos (backrooms, brick-toy, glass-product, hd-2d, lowpoly-island, paper-lantern, paper-popup, tilt-shift) | No three.js here. These need `npm i three` and a WebGL path through `render.mjs` (it reads the first canvas with `toDataURL`, which needs `preserveDrawingBuffer: true` on a WebGL canvas). Untested in this repo: treat as unsupported until a test film renders. Many 2D demos also use a WebGL2 post pass (paper, ink, CRT); same caveat. |

## Red lines carried over
- Their demos end with a "LemoLab x Claude Opus" sign-off and some are fan films of real events.
  Never carry a sign-off, real names, marks or characters from a demo into a user's film.
  Before delivery: `grep -rniE "lemo ?lab|opuscar" films/<name>` finds nothing outside credits, and you
  have looked at the last seconds (text drawn into the canvas can't be grepped).
- References teach grammar only. The STYLE.md files name real artists and works as references; never
  copy their compositions, characters, typefaces or melodies, and never name them on screen.
