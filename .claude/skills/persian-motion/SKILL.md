---
name: persian-motion
description: Direct and build motion design with Persian / Farsi / RTL text in this repo's canvas seek(t) films. Use whenever a film, reel, kinetic type, title, explainer or social clip contains Persian, Farsi, Arabic-script or RTL text (any request written in Persian about a video counts: «موشن»، «ویدیو»، «ریلز»، «انیمیشن»، «تیتر متحرک»), when the user runs /persian-motion, and when the user says the Persian looks broken, disconnected or "off", or a piece looks like a slideshow, default or AI-made. Adds Persian typography rules re-measured for canvas, HarfBuzz-shaped outlines for per-letter and per-dot motion, kashida instead of letter-spacing, a Persian copy linter, and eight anti-slideshow techniques. Runs alongside motion-reel, brief-critic and critique-pass, not instead of them.
---

# Persian motion

Imported from [atmirrr/persian-motion-director](https://github.com/atmirrr/persian-motion-director)
(MIT, commit `5499640`, licence in this folder). The original targets DOM and Remotion. This repo
draws on a canvas through `window.seek(t)`, so every Persian rule below was re-checked in
Chromium 141 canvas; measured numbers are marked **measured**.

Most generated Persian motion fails in two ways: it plays like a slideshow (fades between scenes,
one ease on everything, everything arriving at once) and its Persian is broken (isolated letter
forms, clipped dots, Arabic ي ك and digits, missing half-spaces, left-to-right reveals). Fix both.

## 0. Order of work (inside the CLAUDE.md gates, not instead of them)
1. `brief-critic` first. Persian-specific unknowns: the FINAL Persian copy, the register (formal
   شما or warm تو), which Latin brand names stay Latin, platform (Reels/TikTok put buttons on the
   RIGHT, where RTL text anchors). Never write the copy yourself and ship it unseen.
2. Pick 1-2 techniques from §3 that fit the brief. One or two used consistently read as a system;
   all eight read as a reel. Name the one at the emotional peak in `treatment.md`.
3. Music first: lock BPM and a bar map before animating. No track: `tools/score.mjs`, or
   `python3 tools/compose_shur_pulse.py <dir>` (an 82 s, 120 BPM piece in Dastgah Shur written in
   numpy, with `beats.json`; its section layout is fixed to the original's demo, so edit `SECTIONS`
   and `BARS` for your film; I have not listened to it).
4. `npm run new -- <name> --fa` (copies `films/_fa-starter`: Vazirmatn loaded, live RTL caption,
   shaped title with dots landing on beats, `TEXTS`, reels-safe right edge).
5. Copy table for the user (line, timing, Persian, English gloss) and an explicit yes from a native
   reader. Then `python3 tools/lint_persian.py copy "<line>" ...` until clean.
6. Build. `python3 tools/lint_persian.py code films/<name>` and
   `node tools/readcheck.mjs films/<name>/index.html --safe reels` before any full render.
7. Stills at full size: look for isolated forms, seams at joins, clipped dots and the top of گ,
   Arabic digits, reveals running the wrong way. Then the normal critique-pass rounds.

## 1. Persian non-negotiables, canvas edition
Full rules and sources: `references/persian-typography.md`, `references/persian-copy.md`.

1. **Never draw Persian letter by letter.** Canvas shapes each `fillText` call on its own.
   **Measured:** «بیشتر» at 100 px = 227.1 px whole, 409.8 px drawn per letter (every letter isolated).
   Draw whole words or lines (`M.text`). For per-letter boxes use `M.fa.split(word)` (zero-width
   joiners: **measured** parts sum to 227.1 px, joins kept). For per-glyph or per-dot motion use
   shaped outlines (§2).
2. **Fade words, not letters.** Joined letters overlap; per-letter alpha leaves a seam at each join.
   Bodies of one word share one alpha.
3. **Masks need slack.** Pad clips 0.6em above and below (`M.fa.wipe` does). Line spacing at least
   1.6 x size for Naskh-style faces, 2.4 for Nastaliq. **Measured** in Vazirmatn 100 px: گ reaches
   83 px above the baseline, پ 34 px below.
4. **Direction.** `g.direction = 'rtl'` with `textAlign = 'right'` (`M.text` defaults). Latin
   inside Persian goes between FSI/PDI: `'از ⁨C++⁩ و ...'`. **Measured:** unwrapped
   «از C++» renders `++C`; wrapped renders `C++`. Reveals and staggers start on the right, the next
   scene is to the left, the camera travels left. Mirror back/next arrows yourself; never mirror
   play buttons, clocks or numbers.
5. **Characters.** Persian ی (U+06CC) and ک (U+06A9), never ي ك. Persian digits via `M.fa.num(x)`
   (Intl fa-IR: ۱٬۲۳۴٫۵) or `M.faDigits`. Half-space ZWNJ (U+200C) in می‌، ‑ها، ‑تر، ‑ترین, never
   U+200B. Punctuation ، ؛ ؟ « ». The linter catches these.
6. **No letter-spacing.** **Measured:** `g.letterSpacing = '30px'` leaves a Persian word at 227.1 px
   and only widens spaces (Latin grew 233 to 353 px). "Tracking in" does not exist in Persian.
   Stretch with kashida (ـ) after a letter that joins forward, one per word (technique 08).
7. **Load the font.** `M.loadFonts([{family: 'Vazirmatn', url: '../../lib/fonts/Vazirmatn-VF.woff2',
   weight: '100 900'}])` into `window.FILM_READY`. **Measured:** the fallback renders silently at a
   different width (232.6 vs 227.1 px). Arabic-made Naskh/Kufi faces draw ی ه and digits in Arabic
   shapes: Persian readers notice. Commercial Fontiran faces (IRANSans, Yekan Bakh, Dana...) need a
   licence that covers embedding in a render pipeline: ask, don't assume.
8. **Copy.** One register for the whole piece. Translate meaning, not words (`brief-critic` already
   flags calques). 1-4 words per beat for kinetic type. Brand names stay Latin unless they have an
   official Persian name.

## 2. Shaped outlines (per-glyph, per-dot, per-group motion)
```bash
pip install uharfbuzz fonttools
# lines.tsv: name<TAB>weight<TAB>text   (the linter flags the weight column as "latin-digit": lint the copy, not the TSV)
python3 tools/shape_persian.py lib/fonts/Vazirmatn-VF.ttf --lines films/<name>/lines.tsv --global films/<name>/glyphs.js
```
Load `lib/persian.js` after `lib/motion.js`, then `glyphs.js`. In the film:
- `const R = M.fa.run('title')`: glyphs in VISUAL order (index 0 = leftmost), each with
  `body` and `dots` as `Path2D`, its connected letter `group`, and `R.words` in logical order.
- `M.fa.draw(g, R, xRight, baseline, size, {fill, dotFill, glyph: (gl) => ({dx, dy, alpha, rot, sx, sy}) | null, dot: (d, gl) => ... })`.
  Bodies and dots draw separately, so dots can arrive last without breaking a join.
- `M.fa.place(...)` for pixel geometry, `M.fa.wipe(...)` for RTL reveals, `M.fa.box(...)` for `TEXTS`.
- Re-shape after any copy change. Glyph data is a snapshot of the text.

## 3. Techniques
Recipes with numbers and the posts they come from: `references/techniques/`. Original DOM/SVG code
(a pure function of time, readable as a porting reference, not runnable here as is):
`references/sketches/sketches.js`. Their gallery runs with `python3 -m http.server` inside
`references/sketches/` and opening `gallery.html`.

| # | Technique | Use it for | Status in this repo |
|---|---|---|---|
| 01 | One camera, no cuts | spine of a film: scenes on one strip, whip pans, parallax | port from sketch; RTL: camera travels left |
| 02 | One shape carries the story | the full stop becomes a bubble, then the next full stop | port; the full stop is glyph 0 of a shaped RTL line |
| 03 | The real UI, directed | product beats | house rule already: capture the real UI, never redraw it |
| 04 | Cut on the beat | kinetic type, feature runs | port; 1-4 words per beat, whole words |
| 05 | On twos, with line boil | hand-drawn layer over clean UI | port; step with `Math.floor(t * 12 + 1e-6) / 12`; see `styles/README.md` on 12 vs 24 steps |
| 06 | Paper cut-out letters | warm title cards | port; pieces = `gl.group` from shaped data |
| 07 | Dots last | wordmarks, reveals | **built**: `films/_fa-starter`, verified frame by frame |
| 08 | Kashida, not letter-spacing | emphasis on a held note | port; shape once with ـ and once without |

## 4. Where the original and this repo disagree (house rules win)
| Original | Here |
|---|---|
| `cubic-bezier(.16,1,.3,1)` entrance over ~20 frames | `M.sp(t, 'crisp')`: **measured** 0% overshoot, settles to 1% in 0.33 s (20 frames at 60 fps) |
| `cubic-bezier(.7,0,.84,0)` exit over ~8 frames, 70% of the travel | `M.spOut(t, tGone, 'crisp')`: a time-reversed spring that accelerates away and ends exactly at `tGone` |
| Remotion spring 100/16 (~1.5% overshoot) for UI, none on text | **measured** here: `snappy` 0.8% (UI only), `base` `calm` `crisp` `heavy` 0%, `playful` **18.6%**: never on Persian text (the linter flags it) |
| 8 motion-blur subframes; "4 leaves visible ghosts" | Their claim (cited from an X post), not tested here. Default stays `--sub 4`; on a whip pan render that slice with `--sub 8` and compare strips |
| "Grain, halftone, ASCII as a finish are the AI default" | Agreed as a finish. As a medium (styles `halftone-dossier`, `ascii-crt`, `risograph`) they are the point, not a finish |
| DOM: `inline-block`, `<bdi>`, `dir="rtl"`, `overflow-clip-margin` | canvas: one `fillText` per word or line, FSI/PDI, `g.direction`, `M.fa.wipe` padding |
| Remotion project, `render-stills.mjs` | `render.mjs --stills`, `tools/critique.sh`, `tools/readcheck.mjs` |
| X delivery: 1920x1080, burned captions | X autoplays muted: carry the message in type. Default here is 9:16; reframe per format |

## 5. Quick piece
Even for "just build it": no letter-by-letter Persian, no scene-to-scene fades, timing on the beat
grid, Vazirmatn loaded, `lint_persian.py copy` clean, `readcheck --safe reels` exit 0, and one look
at a full-size still for clipped dots before the render.
