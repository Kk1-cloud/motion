// node tools/sfx.mjs cues.json out/sfx.wav [duration]
// cues: [{"t":0.5,"type":"click","gain":1,"pan":0}, ...]  types: click pop thump whoosh riser tick swell
import { readFileSync } from 'node:fs';
import { SR, writeWav, noiseGen } from './wav.mjs';
const cues = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const dur = Number(process.argv[4]) || Math.max(...cues.map((c) => c.t)) + 2;
const L = new Float32Array(Math.ceil(dur * SR)), R = new Float32Array(L.length);
const noise = noiseGen(7);
const TAU = 2 * Math.PI;
// [length s, fn(t) -> sample]. Keep them short and dry; the score carries the space.
export const VOICES = {
  click:  [0.05, (t) => Math.sin(TAU * 1800 * t) * Math.exp(-t * 90) * 0.5],
  tick:   [0.03, (t) => noise() * Math.exp(-t * 220) * 0.35],
  pop:    [0.15, (t) => Math.sin(TAU * (600 * t + 450 * t * t)) * Math.exp(-t * 30) * 0.4],
  thump:  [0.50, (t) => Math.sin(TAU * (90 * t - 30 * t * t)) * Math.exp(-t * 9) * 0.9],
  whoosh: [0.35, (t) => noise() * Math.sin(Math.PI * Math.min(1, t / 0.35)) * 0.25],
  riser:  [1.00, (t) => noise() * t * t * 0.3 + Math.sin(TAU * (200 * t + 300 * t * t)) * t * 0.08],
  swell:  [1.20, (t) => Math.sin(TAU * 220 * t) * Math.sin(Math.PI * t / 1.2) * 0.15],
};
for (const c of cues) {
  const [len, fn] = VOICES[c.type] || (() => { throw new Error('unknown sfx ' + c.type); })();
  const start = Math.floor(c.t * SR), gain = c.gain ?? 1, pan = c.pan ?? 0;
  for (let i = 0; i < len * SR && start + i < L.length; i++) {
    const s = fn(i / SR) * gain; L[start + i] += s * (1 - Math.max(0, pan)); R[start + i] += s * (1 + Math.min(0, pan));
  }
}
writeWav(process.argv[3], L, R);
console.log(`${cues.length} cues -> ${process.argv[3]}`);
