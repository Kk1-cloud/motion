// Tiny WAV writer + peak normalizer shared by score.mjs and sfx.mjs. Stereo 16-bit.
import { writeFileSync } from 'node:fs';
export const SR = 48000;
export function writeWav(path, L, R = L, peak = 0.89) {
  let m = 1e-9; for (let i = 0; i < L.length; i++) m = Math.max(m, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak / m, n = L.length, b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  const q = (x) => Math.round(Math.max(-1, Math.min(1, x * g)) * 32767);
  for (let i = 0; i < n; i++) { b.writeInt16LE(q(L[i]), 44 + i * 4); b.writeInt16LE(q(R[i]), 46 + i * 4); }
  writeFileSync(path, b);
}
// Deterministic noise (LCG), never Math.random.
export const noiseGen = (s = 42) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 2147483648 - 1;
