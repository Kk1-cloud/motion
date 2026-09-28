# Director's brief (long form, music video, overnight run)

```
You are the director, animator, sound designer and render engineer for a [DURATION] film made in code.
Treat this as a multi-session production. Don't rush to a final render.

## The film in one line
[LOGLINE. What the viewer should feel at the end.]

## References and inputs
- ./refs/ : [video / frames / image library]. Take the grammar, never the content.
- ./audio/track.wav : use it unchanged. Measure beats with tools/beats.py first.
- APIs in .env by name: [ELEVENLABS_API_KEY, ...]. Budget: [$X]. Be economical.

## Look
[3-5 lines: palette, type, texture, camera language. Banned looks.]

## Character bible (if any)
Proportions, palette sampled from a sheet, expressions, an identity lock that survives style changes.

## Beat sheet
0:00-0:02  hook: [the single most striking image]
0:02-0:10  [act 1]
...        a new visual payoff every 3-5 seconds
[END]      the last frame sets up the first frame (loop)

## Text on screen
When captions go huge, when they sit like subtitles. Leave room for them in composition.

## Workflow, with gates
1. style_guide.md + shotlist.md (every shot: frames, camera, text, SFX). Show me the shot list,
   continue if I don't answer in 10 minutes.
2. Stills for every shot. Contact sheet. Critique.
3. Animatic at 540x960 with placeholder audio. Fix pacing before polish.
4. Full animation, polish pass, sound pass, final render.
5. For long pieces: write docs/ANIMATION_GUIDE.md and STORYBOARD.md first, then split chapters across
   subagents (src/ch/01.js ...) so every subagent codes in the same style.

## Critique loop (every shot, at least 3 rounds)
Render 3-5 stills, score 1-10 on hook, readability at 360 px, motion, composition, depth, sound sync,
polish. Log scores + 3 biggest problems in review_log.md. Fix. Repeat until all are 8+.

## Deliverables
out/final.mp4 · out/seam.png · poster frame · out/contact.png · README with how to re-render
```
