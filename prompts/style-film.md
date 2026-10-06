# Film in a library style

Use when the user wants their topic told in one of the 43 styles in `styles/`. The style is fixed;
everything else comes from the topic. Fill every bracket. An empty bracket is a guess.

```
Make a [DURATION]-second film about [TOPIC: one subject, one goal, one turn] in the
[STYLE NAME] style (styles/[slug]/STYLE.md) for [AUDIENCE] on [CHANNEL, sound on/off].

Facts that must be true on screen: [NAMES, NUMBERS WITH SOURCES, PRODUCTS, LOGOS I HAVE RIGHTS TO].
My material: [voice recording / music file / photos / fonts / none].
Language: [LANGUAGE for text and voice]. Voice: [yes, tone / no].

Direction
- Benchmark: [1-2 REAL WORKS]. Learn [composition / pacing / camera / score structure]; don't take
  [characters / designs / melodies / shots].
- Opening image (first 2 s): [LITERAL IMAGE, about the viewer, not the example].
- Turn: [WHAT CHANGES]. Peak uses one native move of the style: [PICK FROM STYLE.md §8 or "you pick"].
- Ending: [ACTION / echo of the opening / loop to frame 1].
- On-screen words: [MAX N LINES]. Every line must pass tools/readcheck.mjs.

Process
- Write films/<name>/treatment.md first: three candidate structures and why one wins, shot list with
  the reason for each move, cue map, sound design table (ambience / foley / music, two silences,
  two sound transitions). Do not open DEMO.md until it exists. 4 of 6 must differ from the demo.
- Show me 3 style frames from the real drawing code before the shot list.
- Format: [1080x1920 / 1080x1080 / 1920x1080], reframed per format, never cropped.
- Exceptions to house rules this style needs: [e.g. 24 fps stepping, constant-speed pen line / none].
```

What makes this fail even when filled in: picking a style because it looks nice in the gallery, not
because its native moves fit the topic. Ask "which move in STYLE.md §8 is my peak?" If none fits,
the style is wrong.
