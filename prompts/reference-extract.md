# Reference → style guide → shot list

Without a reference the model falls back to its default look. Naming a style beats describing one;
a frame or video beats naming one; your own image library beats all of them (nobody else can copy it).

```
Reference: ./refs/<file>.mp4 (and/or ./refs/frames/*.png, or ./refs/library/)

1. Extract one frame every 0.5 s with ffmpeg. Look at them.
2. Write films/<name>/style_guide.md: palette (hex), type (family, weight, tracking), shot lengths,
   transition types, camera moves, texture/grain, how text enters and exits.
3. Write films/<name>/shotlist.md for a [DURATION]s video about [SUBJECT] in THAT style.
   Take the grammar of the reference, never its content, logos or characters.
4. Show me both files. Wait for my OK before any code.
```
Specify the look and the constraints, not the library. Let the model pick the technique.
Sources: launch films of competitors, Dribbble motion, whatships.com, your own past work.
