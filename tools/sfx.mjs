// node tools/sfx.mjs cues.json out/sfx.wav [duration]
// cues: [{"t":0.5,"type":"click","gain":1,"pan":0}, ...]
// types: click pop thump whoosh riser tick swell crack stamp count clock chime coin coin_rev lock ding horn slide print tear beep creak
import { readFileSync } from 'node:fs';
import { SR, writeWav, noiseGen } from './wav.mjs';
const cues = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const dur = Number(process.argv[4]) || Math.max(...cues.map((c) => c.t)) + 2;
const L = new Float32Array(Math.ceil(dur * SR)), R = new Float32Array(L.length);
const noise = noiseGen(7);
const TAU = 2 * Math.PI;
let sz = 0; const soft = () => (sz += (noise() - sz) * 0.12);   // one-pole low-passed noise
// [length s, fn(t) -> sample]. Keep them short and dry; the score carries the space.
export const VOICES = {
  click:  [0.05, (t) => Math.sin(TAU * 1800 * t) * Math.exp(-t * 90) * 0.5],
  tick:   [0.03, (t) => noise() * Math.exp(-t * 220) * 0.35],
  pop:    [0.15, (t) => Math.sin(TAU * (600 * t + 450 * t * t)) * Math.exp(-t * 30) * 0.4],
  thump:  [0.50, (t) => Math.sin(TAU * (90 * t - 30 * t * t)) * Math.exp(-t * 9) * 0.9],
  whoosh: [0.35, (t) => noise() * Math.sin(Math.PI * Math.min(1, t / 0.35)) * 0.25],
  riser:  [1.00, (t) => noise() * t * t * 0.3 + Math.sin(TAU * (200 * t + 300 * t * t)) * t * 0.08],
  swell:  [1.20, (t) => Math.sin(TAU * 220 * t) * Math.sin(Math.PI * t / 1.2) * 0.15],
  // Dry split: noise transient + a few inharmonic partials. Glass/ice crack, not an explosion.
  crack:  [0.35, (t) => (noise() * Math.exp(-t * 70) * 0.6
    + [2130, 3370, 4710].reduce((a, f, i) => a + Math.sin(TAU * f * t) * Math.exp(-t * (40 + 15 * i)), 0) * 0.08
    + noise() * Math.exp(-((t - 0.045) ** 2) * 4e4) * 0.35)],
  // Low stamp: pitched thump plus a short papery slap.
  stamp:  [0.60, (t) => Math.sin(TAU * (70 * t - 18 * t * t)) * Math.exp(-t * 7) * 0.9 + noise() * Math.exp(-t * 45) * 0.25],
  count:  [0.02, (t) => Math.sin(TAU * 2600 * t) * Math.exp(-t * 300) * 0.25],   // counter digit tick
  clock:  [0.04, (t) => (noise() * 0.5 + Math.sin(TAU * 3100 * t)) * Math.exp(-t * 160) * 0.35], // mechanical tick
  chime:  [1.20, (t) => [880, 1320, 1760].reduce((a, f, i) => a + Math.sin(TAU * f * t) / (i + 1), 0) * Math.exp(-t * 4) * 0.12],
  // Coin: short metallic ring (inharmonic partials). coin_rev plays the same ring backwards.
  coin:     [0.45, (t) => coinRing(t)],
  coin_rev: [0.45, (t) => coinRing(0.45 - t) * Math.min(1, (0.45 - t) * 40)],
  // Notification ding: two bell partials. Generic, not any real OS sound.
  ding:   [0.60, (t) => (Math.sin(TAU * 1320 * t) * 0.6 + Math.sin(TAU * 1980 * t) * 0.3) * Math.exp(-t * 9) * Math.min(1, t * 400) * 0.35],
  // Short, tired car horn: two detuned low square-ish tones with a sagging envelope.
  horn:   [0.55, (t) => [311, 392].reduce((a, fr) => a + Math.tanh(3 * Math.sin(TAU * fr * (1 - 0.03 * t) * t)), 0) * Math.min(1, t * 60, (0.55 - t) * 8) * 0.12],
  // Block slide: dry friction noise with a soft stop.
  slide:  [0.40, (t) => noise() * Math.sin(Math.PI * Math.min(1, t / 0.32)) * 0.18 + (t > 0.3 ? Math.sin(TAU * 120 * (t - 0.3)) * Math.exp(-(t - 0.3) * 40) * 0.4 : 0)],
  // Ticket printer: fast mechanical stepping under a short whir.
  print:  [0.90, (t) => (noise() * 0.3 * (Math.sin(TAU * 38 * t) > 0.6 ? 1 : 0.15) + Math.sin(TAU * 180 * t) * 0.1) * Math.min(1, t * 30, (0.9 - t) * 12)],
  // Paper tear: crackling noise bursts that thin out.
  tear:   [0.45, (t) => noise() * (0.5 + 0.5 * Math.sin(TAU * 90 * t + noise())) * Math.exp(-t * 6) * Math.min(1, t * 300) * 0.5],
  // Scanner beep: short clean sine with a soft edge.
  beep:   [0.18, (t) => Math.sin(TAU * 1760 * t) * Math.min(1, t * 200, (0.18 - t) * 60) * 0.22],
  // Creak: slow, low, rasping (a scale settling).
  // Low-passed noise: full-band noise times an FM tone is harsh, and AAC overshoots on it (measured +5 dB).
  creak:  [0.50, (t) => Math.sin(TAU * (140 - 40 * t) * t + 3 * Math.sin(TAU * 23 * t)) * soft() * Math.sin(Math.PI * t / 0.5) * 0.9],
  // Lock: two quick mechanical clicks, low body.
  lock:   [0.20, (t) => [0, 0.07].reduce((a, o) => a + (t >= o ? (noise() * 0.6 + Math.sin(TAU * 1400 * (t - o))) * Math.exp(-(t - o) * 180) : 0), 0) * 0.4
    + Math.sin(TAU * 160 * t) * Math.exp(-t * 30) * 0.3],
};
function coinRing(t) {
  if (t < 0) return 0;
  return [2350, 3890, 5610, 7020].reduce((a, f, i) => a + Math.sin(TAU * f * t) * Math.exp(-t * (9 + 6 * i)) / (i + 1), 0) * 0.22
    + Math.sin(TAU * 1180 * t) * Math.exp(-t * 60) * 0.15;
}
for (const c of cues) {
  const [len, fn] = VOICES[c.type] || (() => { throw new Error('unknown sfx ' + c.type); })();
  const start = Math.floor(c.t * SR), gain = c.gain ?? 1, pan = c.pan ?? 0;
  for (let i = 0; i < len * SR && start + i < L.length; i++) {
    const s = fn(i / SR) * gain; L[start + i] += s * (1 - Math.max(0, pan)); R[start + i] += s * (1 + Math.min(0, pan));
  }
}
writeWav(process.argv[3], L, R);
console.log(`${cues.length} cues -> ${process.argv[3]}`);
