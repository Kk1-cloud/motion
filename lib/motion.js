// Motion primitives. Every function is pure in t, so seek(t) stays deterministic:
// frame 812 renders without simulating frames 0..811.
// Loaded as a classic script (works from file:// and over http). Exposes globalThis.M.
(function (root) {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const inv = (a, b, x) => clamp((x - a) / (b - a));

  // Closed-form damped spring from 0 to 1, released at t = 0.
  // k = stiffness, d = damping, unit mass. Handles under, critical and over damping.
  function spring(t, k = 170, d = 26) {
    if (t <= 0) return 0;
    const w0 = Math.sqrt(k), z = d / (2 * w0);
    if (z < 1) {
      const wd = w0 * Math.sqrt(1 - z * z);
      return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t));
    }
    if (z === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
    const s = w0 * Math.sqrt(z * z - 1), r1 = -z * w0 + s, r2 = -z * w0 - s;
    return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
  }

  // Named feels. Pick by what moves, not by taste.
  const FEEL = {
    snappy:  [320, 30],  // buttons, toggles, leading edges (tiny overshoot)
    base:    [170, 26],  // cards, containers, camera (no visible overshoot)
    heavy:   [90, 19],   // big type, 3D objects, logo lockups (critically damped)
    playful: [220, 14],  // mascots, stickers (visible overshoot)
    calm:    [144, 24],  // critically damped: pure ease-out, zero overshoot (serious/corporate briefs)
    crisp:   [400, 40],  // critically damped and fast: "clean, quick, no bounce"
  };
  const sp = (t, feel = 'base') => spring(t, ...FEEL[feel]);

  // A value that changes target many times: sum one spring per change.
  // keys: [[time, value], ...] sorted by time. Continuous, never restarts.
  function track(t, keys, k = 170, d = 26) {
    let v = keys[0][1];
    for (let i = 1; i < keys.length; i++)
      v += (keys[i][1] - keys[i - 1][1]) * spring(t - keys[i][0], k, d);
    return v;
  }
  const trackFeel = (t, keys, feel = 'base') => track(t, keys, ...FEEL[feel]);

  // Tab indicator / pill that stretches: leading edge stiffer than trailing edge.
  function indicator(t, stops, width = 120) {
    const lead = track(t, stops, 320, 30), trail = track(t, stops, 140, 22);
    return { left: Math.min(lead, trail), right: Math.max(lead, trail) + width };
  }

  // Content inside a morphing container: enters after the morph starts, leaves before the next.
  const swapAlpha = (t, tIn, tOut) =>
    Math.min(clamp((t - tIn - 0.08) / 0.12), clamp((tOut - 0.1 - t) / 0.1));

  const loopT = (t, dur) => ((t % dur) + dur) % dur;

  // Seeded PRNG (mulberry32). Never Math.random in a film.
  function rng(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Stateless hash noise: same (i, seed) always gives the same number, any order.
  const hash = (i, seed = 0) => rng((i * 2654435761) ^ seed)();

  // Beat grid. Pass beats.json content (or {bpm, offset}) and ask where you are.
  function grid(b) {
    const bpm = b.bpm, spb = 60 / bpm, off = b.offset ?? (b.beats ? b.beats[0] : 0);
    return {
      bpm, spb,
      beat: (n) => off + n * spb,           // time of beat n
      bar: (n) => off + n * 4 * spb,        // time of bar n (4/4)
      at: (t) => (t - off) / spb,           // fractional beat index at t
      pulse: (t, decay = 8) => {            // 1 on each beat, decays until the next
        const x = (t - off) / spb; return x < 0 ? 0 : Math.exp(-decay * (x - Math.floor(x)) * spb);
      },
    };
  }

  // Layout units so one timeline serves 9:16, 1:1 and 16:9. Design in u, not pixels.
  function layout(W, H) {
    const u = Math.min(W, H) / 100;
    return { W, H, u, cx: W / 2, cy: H / 2, portrait: H > W, landscape: W > H,
             safe: { x: 6 * u, y: (H > W ? 12 : 6) * u } };
  }

  // Platform safe zones in px for 1080x1920 (approximate: platforms move their UI, re-check
  // against a current screenshot). Right side is larger on reels/tiktok: the action buttons live there.
  const SAFE = {
    none:   { top: 0, bottom: 0, left: 0, right: 0 },
    reels:  { top: 250, bottom: 420, left: 60, right: 130 },
    tiktok: { top: 160, bottom: 480, left: 60, right: 140 },
    shorts: { top: 200, bottom: 400, left: 60, right: 130 },
  };
  function safeRect(W, H, preset = 'none') {
    const s = SAFE[preset], k = W / 1080;
    return { x0: s.left * k, x1: W - s.right * k, y0: s.top * k, y1: H - s.bottom * k };
  }

  // Persian / Arabic-Indic digits: faDigits('74%') -> '۷۴٪'
  const faDigits = (x) => String(x).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]).replace(/%/g, '٪');

  // Text. dir 'rtl' for Persian/Arabic/Hebrew: align 'right' anchors the right edge at x.
  // Canvas handles shaping and bidi (Latin inside RTL) as long as the font is LOADED first.
  function text(g, str, x, y, { font, color, align = 'right', dir = 'rtl', base = 'middle', alpha = 1 } = {}) {
    if (alpha <= 0) return;
    g.save(); if (font) g.font = font; if (color) g.fillStyle = color;
    g.direction = dir; g.textAlign = align; g.textBaseline = base; g.globalAlpha *= alpha;
    g.fillText(str, x, y); g.restore();
  }
  // Greedy word wrap by measured width. Set g.font first.
  function wrap(g, str, maxW) {
    const out = []; let line = '';
    for (const w of str.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    if (line) out.push(line); return out;
  }
  // Load web fonts before the first frame. Canvas does not trigger @font-face loading by itself,
  // so text silently falls back to a system font unless you do this. Assign the result to
  // window.FILM_READY; render.mjs awaits it.
  // loadFonts([{family:'Vazirmatn', url:'assets/v-700.woff2', weight:700, range:'U+0600-06FF'}, ...])
  function loadFonts(list) {
    return Promise.all(list.map((f) => new FontFace(f.family, `url(${f.url})`,
      { weight: String(f.weight || 400), unicodeRange: f.range || 'U+0-10FFFF' }).load()
      .then((ff) => document.fonts.add(ff))));
  }

  root.M = { clamp, lerp, inv, spring, sp, FEEL, track, trackFeel, indicator, swapAlpha,
             loopT, rng, hash, grid, layout, SAFE, safeRect, faDigits, text, wrap, loadFonts };
})(globalThis);
