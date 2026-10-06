# How to get a better film out of this studio

Written for you, the person asking for films. Blunt version: the model is not the bottleneck. Your
brief, your assets and how many review rounds you allow are. A one-liner gets you the same reel as
everyone else's.

## 1. The five things that move quality most (in order)
1. **Real material.** Your URL, real screenshots, logo, fonts, a real number with its source. Invented
   UI and vague claims are the fastest route to generic. If you don't have it, say "none" so nobody guesses.
2. **A style plus a benchmark.** Pick a style from `styles/CATALOG.md` (43 of them, each with rules for
   look, motion, camera and sound). Then name one or two real works that set the bar, and say what to
   learn from them and what not to take. "Modern, clean, premium" is not a style. It is a shrug.
3. **One subject, one goal, one turn.** A film about three features is a slideshow. A film where
   something changes is a story. If you can't say the turn in one sentence, you are not ready to brief.
4. **Sound decided up front.** A track you own (it gets measured and cut to), or "synthesize at N BPM
   in the style's instruments". Sound and rhythm are judged before pretty frames.
5. **Review gates you actually use.** Approve the treatment, the 3 style frames and the shot list.
   Each costs you two minutes and saves a full re-render.

## 2. How to ask
| You want | Say | Template |
|---|---|---|
| A product or launch film | `/motion-reel` + URL + audience + channel + one metric | `prompts/brand-reel.md` |
| Your topic in a specific look | `/motion-reel` + style slug + topic | `prompts/style-film.md` |
| A UI story, one element morphing | state list | `prompts/state-spec.xml` |
| To copy the grammar of a reference video | the file or link | `prompts/reference-extract.md` |
| Long form or music video | full director's brief | `prompts/director-brief.md` |
| To know if your brief is good | `/brief-critic` + your brief | - |

Don't know which style? Ask: "suggest 3 styles from the library for <topic>, and which native move
each would use at the peak." If the answer can't name a native move that fits, the style is wrong.

## 3. What happens after you ask
1. Your brief gets scored out of 20 and torn apart. Answer the unknowns; don't skip them.
2. `treatment.md`: three possible structures, the chosen one, why, and a sound plan.
3. Three style frames, then a shot list on the beat grid. Approve or redirect here, not after the render.
4. Stills, low-res animatic, full render, then critique rounds until every score is 8+ (at least 2
   rounds, all logged in `review_log.md`).
5. Reading-time check (`tools/readcheck.mjs`): every text stays long enough to read. Black-frame check.
6. Sound, mix at -14 LUFS, delivery per format.

## 4. Mistakes that ruin films (seen repeatedly)
- **Too many words.** A Latin line needs chars / 15 + 1.5 s on screen: 30 characters = 3.5 s. Even with
  text on screen the whole time, a 30 s film holds about 8 such lines; with picture-only beats, fewer.
  Cut words, not hold time.
- **Choosing a style as a costume.** Describing the style's demo (its story, its props) instead of your
  topic. You get their film with your logo on it.
- **Asking for the final MP4 in one go.** No gate, no fix. You will get round-one quality.
- **"Logo at the end"** as the ending. End on an action or an echo of the opening.
- **Frame one about the example, not the viewer.** Ask about their problem first; the case study is evidence.
- **Vertical text under the platform buttons.** Tell us the platform (Reels, TikTok, Shorts) so
  `--safe` can be checked.

## 5. Known limits (so you don't ask for the impossible)
- 3D styles (brick-toy, glass-product, paper-popup, tilt-shift, lowpoly-island, hd-2d, backrooms,
  paper-lantern) and styles with a WebGL post pass are untested in this harness. Expect engineering
  work first, not a film.
- No voice engine or sampled instruments are installed. Voice needs a key or a local TTS added per
  project; orchestral or folk palettes need real samples, or they'll sound like sine waves.
- Film grain is not in the mux step yet.
- Reading speed for Persian/Arabic is not measured anywhere; the check uses the Latin rate as a floor.
  Read your Persian lines aloud at speed and tell us if the hold feels short.
- The `_starter` film currently fails `readcheck` (its words flash for under a second). It shows the
  `TEXTS` pattern, not pacing to copy.
