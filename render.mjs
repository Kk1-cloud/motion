// Deterministic frame renderer: walks time, calls window.seek(t), pipes frames to ffmpeg.
//
//   node render.mjs films/demo/index.html                     full film, FILM defaults
//   node render.mjs films/demo/index.html --w 1080 --h 1080   another format, same timeline
//   node render.mjs films/demo/index.html --from 4 --to 6     re-render only a slice
//   node render.mjs films/demo/index.html --stills beats      one PNG per beat (critique input)
//   node render.mjs films/demo/index.html --stills 0,1.5,3    PNGs at given times
//
// Flags: --fps --sub (subframes blended for motion blur) --dur --w --h --out --crf
//        --q 'safe&debug=1'  extra query params passed to the film (e.g. a safe-zone overlay)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, extname, dirname, join, basename } from 'node:path';
import { ffmpegPath } from './tools/ff.mjs';

const argv = process.argv.slice(2);
const film = argv.find((a) => !a.startsWith('--') && !argv[argv.indexOf(a) - 1]?.startsWith('--'));
if (!film) { console.error('usage: node render.mjs <film.html> [--fps --sub --w --h --from --to --out --stills]'); process.exit(1); }
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const num = (k, d) => (opt(k) === undefined ? d : Number(opt(k)));

// Serve the repo root over http so films can load ../../lib/motion.js, fonts and assets.
const ROOT = process.cwd();
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.otf': 'font/otf', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  const p = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p)); }
  catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const q = new URLSearchParams();
if (opt('w')) q.set('w', opt('w'));
if (opt('h')) q.set('h', opt('h'));
for (const p of (opt('q') || '').split('&').filter(Boolean)) { const [k, v = ''] = p.split('='); q.set(k, v); }
const url = base + relative(ROOT, resolve(film)).split('\\').join('/') + (q.size ? '?' + q : '');

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('page error:', e.message); process.exitCode = 1; });
await page.goto(url);
await page.evaluate(async () => { await window.FILM_READY; await document.fonts.ready; });
const F = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  return { ...(window.FILM || {}), w: c.width, h: c.height, hasSeek: typeof window.seek === 'function' };
});
if (!F.hasSeek) throw new Error('film has no window.seek(t)');
await page.setViewportSize({ width: F.w, height: F.h });

const FPS = num('fps', F.fps || 60), SUB = num('sub', 4), DUR = num('dur', F.dur || 15);
const FROM = num('from', 0), TO = num('to', DUR);
const outDir = join(dirname(resolve(film)), 'out');
await mkdir(outDir, { recursive: true });

const frame = async (t) => {
  await page.evaluate((t) => window.seek(t), t);
  const b64 = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/png').split(',')[1]);
  return Buffer.from(b64, 'base64');
};

const stills = opt('stills');
if (stills) {
  // Critique input: exact frames, no motion blur, named by time.
  const spb = 60 / (F.bpm || 120);
  const times = stills === 'beats'
    ? Array.from({ length: Math.floor(DUR / spb) }, (_, i) => +(i * spb + spb * 0.5).toFixed(3))
    : stills.split(',').map(Number);
  const dir = join(outDir, 'stills'); await mkdir(dir, { recursive: true });
  for (const t of times) await writeFile(join(dir, `t${t.toFixed(2).padStart(6, '0')}.png`), await frame(t));
  console.log(`${times.length} stills -> ${relative(ROOT, dir)}`);
} else {
  const tag = `${F.w}x${F.h}` + (opt('from') || opt('to') ? `_${FROM}-${TO}` : '');
  const out = opt('out') || join(outDir, `silent_${tag}.mp4`);
  // tmix averages SUB consecutive subframes; select keeps the last of each group.
  const vf = SUB > 1 ? ['-vf', `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/${FPS}/TB`] : [];
  const ff = spawn(ffmpegPath(), ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS * SUB), '-i', '-',
    ...vf, '-r', String(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', opt('crf', '16'), '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((r) => ff.on('close', r));
  const i0 = Math.round(FROM * FPS * SUB), i1 = Math.round(TO * FPS * SUB);
  for (let i = i0; i < i1; i++) {
    const png = await frame(i / (FPS * SUB));
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((i - i0) % (FPS * SUB) === 0) process.stdout.write(`\r${basename(film)} ${(i / (FPS * SUB)).toFixed(0)}s / ${TO}s`);
  }
  ff.stdin.end();
  const code = await done;
  console.log(code === 0 ? `\n-> ${relative(ROOT, out)}` : `\nffmpeg exited ${code}`);
  if (code !== 0) process.exitCode = 1;
}
await browser.close();
server.close();
