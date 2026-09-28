// Synthesize an original score on the film's grid, plus beats.json the film can read.
// node tools/score.mjs films/<name> [--bpm 120] [--bars 8] [--key 57] [--seed 1]
// Writes films/<name>/audio/score.wav and films/<name>/beats.json. Deterministic.
// This is a competent bed, not a composer. For flagship pieces supply a real track.
import { mkdirSync, writeFileSync } from 'node:fs';
import { SR, writeWav, noiseGen } from './wav.mjs';
const argv = process.argv.slice(2), dir = argv[0];
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? Number(argv[i + 1]) : d; };
if (!dir) { console.error('usage: node tools/score.mjs films/<name> [--bpm --bars --key --seed]'); process.exit(1); }
const BPM = opt('bpm', 120), BARS = opt('bars', 8), ROOT = opt('key', 57), noise = noiseGen(opt('seed', 1));
const spb = 60 / BPM, dur = BARS * 4 * spb + 2;
const L = new Float32Array(Math.ceil(dur * SR)), R = new Float32Array(L.length);
const TAU = 2 * Math.PI, hz = (m) => 440 * 2 ** ((m - 69) / 12);
const add = (t0, len, fn, pan = 0, gain = 1) => {
  const s0 = Math.floor(t0 * SR);
  for (let i = 0; i < len * SR && s0 + i < L.length; i++) {
    const v = fn(i / SR) * gain; L[s0 + i] += v * (1 - Math.max(0, pan)); R[s0 + i] += v * (1 + Math.min(0, pan));
  }
};
const kick = (t) => Math.sin(TAU * (50 * t + 60 * (1 - Math.exp(-t * 30)) / 30)) * Math.exp(-t * 7);
const hat = (t) => noise() * Math.exp(-t * 60) * 0.18;
const clap = (t) => noise() * (Math.exp(-t * 25) + 0.5 * Math.exp(-((t - 0.012) ** 2) * 1e6)) * 0.35;
const pluck = (f) => (t) => (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t) + 0.12 * Math.sin(TAU * 3 * f * t)) * Math.exp(-t * 5) * 0.16;
const bass = (f, len) => (t) => Math.tanh(2 * Math.sin(TAU * f * t)) * Math.min(1, t * 200) * Math.min(1, (len - t) * 40) * 0.28;
const pad = (fs, len) => (t) => fs.reduce((a, f, j) => a + Math.sin(TAU * f * t + j) + 0.5 * Math.sin(TAU * f * 1.003 * t), 0)
  * Math.min(1, t / 0.4) * Math.min(1, (len - t) / 0.4) * 0.035;
// i - VI - III - VII in minor, one chord per bar.
const PROG = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]];
const beats = [];
for (let bar = 0; bar < BARS; bar++) {
  const chord = PROG[bar % 4].map((x) => ROOT + x), t0 = bar * 4 * spb, intro = bar < 1, drop = bar >= BARS / 2;
  add(t0, 4 * spb, pad(chord.map(hz), 4 * spb), 0, 1);
  add(t0, 4 * spb, bass(hz(chord[0] - 24), 4 * spb * 0.95), 0, intro ? 0 : 1);
  for (let b = 0; b < 4; b++) {
    const tb = t0 + b * spb; beats.push(+tb.toFixed(3));
    if (!intro || b === 0) add(tb, 0.6, kick, 0, 1);
    if (!intro && (b === 1 || b === 3)) add(tb, 0.25, clap, 0, 0.9);
    for (let h = 0; h < (drop ? 4 : 2); h++) add(tb + h * spb / (drop ? 4 : 2), 0.08, hat, h % 2 ? 0.4 : -0.4);
    const arp = chord[(b + bar) % 3] + 12 * (b % 2);
    add(tb + spb / 2, 0.6, pluck(hz(arp)), b % 2 ? 0.3 : -0.3, drop ? 1 : 0.6);
  }
}
const n = BARS * 4;
add(n * spb, 1.5, kick, 0, 1);                                   // final hit lands on the lockup
mkdirSync(`${dir}/audio`, { recursive: true });
writeWav(`${dir}/audio/score.wav`, L, R);
writeFileSync(`${dir}/beats.json`, JSON.stringify({ bpm: BPM, offset: 0, duration: +dur.toFixed(3),
  beats, downbeats: beats.filter((_, i) => i % 4 === 0), hits: [] }, null, 1));
console.log(`${BARS} bars @ ${BPM} BPM -> ${dir}/audio/score.wav + beats.json`);
