// Reading-time check: can a viewer read every on-screen text before it leaves?
//   node tools/readcheck.mjs films/<name>/index.html [--w --h --q] [--step 0.04] [--safe reels]
//                            [--latin-cps 15] [--cjk-cps 4.5] [--pad 1.5] [--min 1.5]
// Contract: the film defines window.TEXTS(t) -> [{id, text, x0, y0, x1, y1}], every text visible at t
// with its box in canvas pixels. Report the FULL text from its first visible frame (a typewriter that
// reports only typed letters fails). A new text under the same id starts a new piece.
// Rule (ported from lemo-opuscar readcheck.mjs, MIT): each piece must stay fully in frame for at least
//   CJK chars / cjk-cps + other non-space chars / latin-cps + pad seconds, and never less than --min.
// Persian/Arabic count at the latin rate. That rate is unmeasured for RTL scripts: treat it as a floor.
// --safe reels|tiktok|shorts also requires every box inside M.safeRect (platform buttons).
// Exit: 0 all pass, 1 some fail, 2 not checked (no TEXTS, or no text at all). 2 is not a pass.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';

const argv = process.argv.slice(2);
const film = argv[0];
if (!film || film.startsWith('--')) { console.error('usage: node tools/readcheck.mjs <film.html> [flags]'); process.exit(2); }
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const STEP = +opt('step', 0.04), LATIN = +opt('latin-cps', 15), CJK = +opt('cjk-cps', 4.5);
const PAD = +opt('pad', 1.5), MIN = +opt('min', 1.5), SAFE = opt('safe', 'none');
if (![STEP, LATIN, CJK, PAD, MIN].every(Number.isFinite) || STEP <= 0 || LATIN <= 0 || CJK <= 0) {
  console.error('bad option value (step and cps must be > 0)'); process.exit(2);
}

const ROOT = process.cwd();
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.otf': 'font/otf', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  const p = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p)); }
  catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const q = new URLSearchParams();
if (opt('w')) q.set('w', opt('w'));
if (opt('h')) q.set('h', opt('h'));
for (const p of (opt('q') || '').split('&').filter(Boolean)) { const [k, v = ''] = p.split('='); q.set(k, v); }
const url = `http://127.0.0.1:${server.address().port}/` + relative(ROOT, resolve(film)).split('\\').join('/') + (q.size ? '?' + q : '');

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('page error:', e.message); process.exitCode = 1; });
await page.goto(url);
await page.evaluate(async () => { await window.FILM_READY; await document.fonts.ready; });

const res = await page.evaluate(({ STEP, SAFE }) => {
  if (typeof window.TEXTS !== 'function') return { why: 'the film has no window.TEXTS(t)' };
  const dur = window.FILM && window.FILM.dur;
  if (!(dur > 0)) return { why: 'window.FILM.dur is not a positive number' };
  const c = document.querySelector('canvas'), W = c.width, H = c.height;
  const R = SAFE !== 'none' && window.M ? M.safeRect(W, H, SAFE) : { x0: 0, y0: 0, x1: W, y1: H };
  const seen = {}, partial = {};
  for (let t = 0; t <= dur; t += STEP) {
    window.seek(t);
    const vis = new Set();
    for (const b of window.TEXTS(t) || []) {
      const id = String(b.id), key = id + '\u0000' + b.text;
      if (!(b.x0 >= R.x0 && b.y0 >= R.y0 && b.x1 <= R.x1 && b.y1 <= R.y1)) { partial[key] ??= { id, text: b.text, t0: t }; continue; }
      vis.add(key);
      const s = seen[key] ??= { id, text: b.text, t0: t, run: 0, done: false };
      if (!s.done) s.run = t - s.t0 + STEP;
    }
    for (const k in seen) if (!vis.has(k)) seen[k].done = true;   // only the first continuous run counts
  }
  for (const k in partial) if (seen[k]) delete partial[k];
  return { seen: Object.values(seen), partial: Object.values(partial) };
}, { STEP, SAFE });
await browser.close(); server.close();

if (res.why || (!res.seen.length && !res.partial.length)) {
  console.error('readcheck: NOT CHECKED: ' + (res.why || 'TEXTS(t) never returned any text') + '. This is not a pass.');
  process.exit(2);
}
const isCJK = (ch) => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(ch);
const need = (text) => { let cjk = 0, other = 0; for (const ch of text) { if (/\s/.test(ch)) continue; isCJK(ch) ? cjk++ : other++; }
  return Math.max(MIN, cjk / CJK + other / LATIN + PAD); };
let bad = 0;
for (const s of res.seen) {
  const n = need(s.text), ok = s.run >= n - 1e-6; if (!ok) bad++;
  console.log(`${ok ? 'OK ' : 'BAD'} ${s.id.padEnd(14)} at ${s.t0.toFixed(2)}s  need ${n.toFixed(2)}s  got ${s.run.toFixed(2)}s  ${JSON.stringify(s.text.slice(0, 32))}`);
}
const where = SAFE === 'none' ? 'the frame' : `the ${SAFE} safe area`;
for (const s of res.partial) { bad++; console.log(`BAD ${s.id.padEnd(14)} at ${s.t0.toFixed(2)}s  never fully inside ${where}  ${JSON.stringify(s.text.slice(0, 32))}`); }
process.exit(bad ? 1 : process.exitCode || 0);
