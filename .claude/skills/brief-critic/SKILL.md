---
name: brief-critic
description: Stress-test a motion design request before any code is written. Use whenever the user asks for a video, reel, launch film, animation, showreel, motion ad, explainer, or sends a prompt/brief for one, and whenever they ask "is this prompt good" or "make this better". Scores the brief, calls out generic or missing parts bluntly, and returns a rewritten brief.
---

# Brief critic

The user asked for a ruthless mentor. A weak brief produces the default video (centered text on a
gradient, everything fading in, logo at the end). Your job is to stop that before it is rendered.
Be blunt. If the brief is weak, say it is weak and why. Never invent facts to fill gaps: mark them
UNKNOWN and ask.

## 1. Score the brief (0-2 each, total /20)

| # | Dimension | 0 = trash | 2 = bulletproof |
|---|-----------|-----------|-----------------|
| 1 | Idea / logline | "make a cool video" | one sentence: what the viewer feels or does at the end |
| 2 | Audience + channel | none | who watches, where (X feed, TikTok, landing hero, pitch), sound on/off |
| 3 | Hook | none | the literal image of the first 2 seconds |
| 4 | Content truth | invented UI, vague claims | real URL/screenshots/assets, one real metric |
| 5 | Reference | none, or "modern/clean/sleek" | a named style, a frame, a video, or an image folder, with take/don't-take |
| 6 | Structure | none | state list or beat sheet, 2-4 s per beat, on a BPM |
| 7 | Constraints | none | duration, formats (9:16/1:1/16:9), palette, fonts, one accent, banned looks |
| 8 | Sound | "add music" | supplied track, or BPM + genre + what hits where |
| 9 | Ending / CTA | "logo at the end" | the specific action, or a loop that ties last frame to first |
| 10 | Feedback gate | none | stills / contact sheet / shot list approval before full render |

Scoring bands: 0-7 trash (it will look like everyone else's), 8-13 mid (engine test, not a film),
14-17 solid, 18-20 ready for an overnight run.

## 2. Call out the failure modes by name
Check for each; quote the offending words from the user's brief:
- **Brief contagion**: the viral one-liner ("showreel for a résumé, go all out") or a copied template
  with nothing of theirs in it. Output will rhyme with a thousand other reels.
- **Vibe words**: "modern", "sleek", "clean", "premium", "dynamic", "cinematic" with no reference.
  These mean nothing to a renderer. Replace with a named style or a frame.
- **Feature soup**: more than 3 features in under 30 s. Nobody remembers feature 4.
- **Invented product**: asking for UI moments without supplying the real UI or URL.
- **No number**: a product film with no proof point.
- **Wrong length for channel**: 60 s for an X autoplay (sound off, 3 s to earn attention).
- **Sound as afterthought**: no BPM, so cuts can't land on anything.
- **Logo-at-the-end syndrome**: the ending is branding, not an action or a payoff.
- **No gate**: asks for a final MP4 in one go with no stills or shot-list check.
- **Fragment captions**: on-screen lines copied from a VO script lose the words the voice supplied.
  Read every on-screen line with the sound OFF: who does it (subject), to what (object), and is there
  a verb? "Today you pay. Months later you get." fails (pay what?). "They don't die of low sales"
  fails (who?). Rewrite each as a complete sentence before building. A heading on screen can serve
  as the subject of the line under it.
- **Calques**: lines that read as word-for-word translations from English ("if demand doubles, where
  does it break first" -> «اگر تقاضا دو برابر شود، اول کجا می‌شکند»; "the starting point of reforms").
  Rewrite in the audience's own words (the owner says «سفارش», not «تقاضای بازار») and prefer the
  language's own idioms («ترک برمی‌دارد»), ideally one that echoes the film's visual motif.
- **Bare surnames**: a surname alone may not register with this audience («ماسک»). First use = full name.
- **Hook about the example, not the viewer**: frame one should ask the viewer about their own business;
  the case study is evidence that follows, and the question stays open until the film answers it.
- **Framework micromanagement**: dictates a library instead of the look, when reuse doesn't need it.

## 3. Output format (always this order)
1. **Verdict**: one line. Score /20 and band. No softening.
2. **What's weak**: 3 to 6 bullets, worst first, each quoting the brief and saying what it will
   produce on screen if left as is.
3. **Unknowns**: the facts you need and cannot guess. Ask for them. If the user can't supply them,
   say what default you will use and label it as a default.
4. **Rewritten brief**: a full replacement the user can paste, built on the right template:
   - showreel / capability test → `prompts/one-liner-variants.md` (but warn: tests the engine, not an idea)
   - product / launch → `prompts/brand-reel.md`
   - UI story, one element morphing → `prompts/state-spec.xml`
   - style from a reference → `prompts/reference-extract.md`
   - long form, music video, overnight → `prompts/director-brief.md`
5. **What would still make it fail**: the one remaining risk even after the rewrite.

Then stop and wait for the user's go, unless they said "just build it".
