// Persian / RTL helpers for canvas films. Load after motion.js; adds M.fa.
// Ported from github.com/atmirrr/persian-motion-director (MIT, 5499640): its tools are DOM and
// Remotion, ours draw on a canvas, so joining rules were re-measured in Chromium 141 canvas:
//   «بیشتر» at 100px: whole word 227.1px, letter by letter 409.8px (isolated forms: broken),
//   ZWJ-split letters 227.1px (joined forms kept). g.letterSpacing is ignored inside the word
//   and only widens spaces. So: draw whole words/lines, M.fa.split for per-letter boxes,
//   shaped outlines (tools/shape_persian.py --global) for per-glyph and per-dot motion.
// lint-persian: allow no-rtl  (a library: callers set direction; see M.text)
(function (root) {
  const M = root.M;
  const ZWJ = '‍', ZWNJ = '‌';
  const ARABIC_LETTER = /[ؠ-يٮ-ۓۺ-ۿ]/;
  const RIGHT_JOINING = /[آ-إاةد-زوژۀ]/;
  const MARK = /[ً-ٰٟ]/;

  // ۱۲۳٬۴۵۶٫۷ with Persian separators. Prefer this over M.faDigits for real numbers.
  const num = (x, opts) => new Intl.NumberFormat('fa-IR', opts).format(x);

  // Words in logical order. می‌شود stays one word (ZWNJ is not a boundary).
  const seg = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('fa', { granularity: 'word' }) : null;
  const words = (line) => seg ? [...seg.segment(line)].filter((s) => s.isWordLike).map((s) => s.segment)
                              : line.split(/\s+/).filter(Boolean);

  // Letters that keep their joined form when drawn one by one (ZWJ on each joining side).
  // Keeps لا, vowel marks and ZWNJ together. Measured: the parts sum to the whole word's width.
  function split(word) {
    const base = (s) => s.replace(/[ً-ٰٟ‌]/g, '');
    const fwd = (s) => { const c = base(s).slice(-1); return !s.endsWith(ZWNJ) && ARABIC_LETTER.test(c) && !RIGHT_JOINING.test(c) && c !== 'ء'; };
    const back = (s) => { const c = base(s)[0]; return ARABIC_LETTER.test(c) && c !== 'ء'; };
    const parts = [];
    for (const ch of word) {
      const k = parts.length - 1;
      if (k >= 0 && (MARK.test(ch) || ch === ZWNJ)) parts[k] += ch;
      else if (k >= 0 && /[آأإا]/.test(ch) && /ل[ً-ٰ]*$/.test(parts[k])) parts[k] += ch;
      else parts.push(ch);
    }
    return parts.map((p, i) => (i > 0 && fwd(parts[i - 1]) && back(p) ? ZWJ : '') + p +
                               (i < parts.length - 1 && fwd(p) && back(parts[i + 1]) ? ZWJ : ''));
  }

  // Shaped runs from tools/shape_persian.py --global (window.GLYPHS). Font units, y up,
  // glyphs in VISUAL order (index 0 = leftmost). Path2D objects are built once and cached.
  const cache = {};
  function run(name) {
    if (cache[name]) return cache[name];
    const r = root.GLYPHS && root.GLYPHS[name];
    if (!r) throw new Error(`no shaped run "${name}" in window.GLYPHS (tools/shape_persian.py --global)`);
    const glyphs = r.g.map(([x, y, adv, cluster, body, dots, dotB, group], i) => ({
      i, x, y, adv, cluster, group,
      body: body ? new Path2D(body) : null,
      dots: dots.map((d, j) => ({ j, path: new Path2D(d), b: dotB[j] })),
    }));
    // Words, logical order (rightmost first). A glyph with no ink is a space.
    const ws = []; let cur = [];
    for (let i = glyphs.length - 1; i >= 0; i--) {
      const gl = glyphs[i];
      if (!gl.body && !gl.dots.length) { if (cur.length) ws.push(cur); cur = []; continue; }
      cur.push(i);
    }
    if (cur.length) ws.push(cur);
    const words = ws.map((idx) => ({ idx, x0: Math.min(...idx.map((i) => glyphs[i].x)),
                                      x1: Math.max(...idx.map((i) => glyphs[i].x + glyphs[i].adv)) }));
    return (cache[name] = { name, text: r.t, w: r.w, upem: r.upem, asc: r.asc, desc: r.desc, glyphs, words });
  }

  // Pixel geometry of a run drawn at baseline y with font size `size`, anchored at x.
  // align: 'right' (default for RTL: x is the right edge), 'center' or 'left'.
  function place(R, x, y, size, align = 'right') {
    const s = size / R.upem, w = R.w * s;
    const left = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    return { s, left, y, w, top: y - R.asc * s, bottom: y - R.desc * s,
             px: (fx) => left + fx * s };                       // font-unit x -> canvas x
  }

  // Draw a shaped run. Per-glyph and per-dot motion without breaking joins:
  //   glyph(gl, R) -> {dx, dy, alpha, rot, sx, sy} or null to hide (pivot: baseline centre)
  //   dot(d, gl, R) -> same (pivot: bottom centre of the dot, so squash lands on the letter)
  // dotFill colours the dots apart from the bodies (default: same as fill).
  // dx/dy in canvas px. Bodies and dots are filled separately, so dots can arrive last.
  function draw(g, R, x, y, size, { align = 'right', fill = '#fff', dotFill, glyph, dot } = {}) {
    const P = place(R, x, y, size, align), s = P.s;
    g.save(); g.fillStyle = fill;
    for (const gl of R.glyphs) {
      const T = glyph ? glyph(gl, R) : {};
      if (T === null) continue;
      const a = T.alpha ?? 1;
      if (a <= 0) continue;
      const ox = P.left + (gl.x + gl.adv / 2) * s, oy = y - gl.y * s;
      g.save(); g.globalAlpha *= a;
      g.translate(ox + (T.dx || 0), oy + (T.dy || 0)); g.rotate(T.rot || 0); g.scale(T.sx ?? 1, T.sy ?? 1);
      g.scale(s, -s); g.translate(-gl.adv / 2, 0);
      if (gl.body) g.fill(gl.body);
      for (const d of gl.dots) {
        const D = dot ? dot(d, gl, R) : {};
        if (D === null || (D.alpha ?? 1) <= 0) continue;
        const cx = (d.b[0] + d.b[2]) / 2, by = d.b[1];
        g.save(); g.globalAlpha *= D.alpha ?? 1; if (dotFill) g.fillStyle = dotFill;
        g.translate(cx + (D.dx || 0) / s, by - (D.dy || 0) / s); g.rotate(-(D.rot || 0));
        g.scale(D.sx ?? 1, D.sy ?? 1); g.translate(-cx, -by);
        g.fill(d.path); g.restore();
      }
      g.restore();
    }
    g.restore();
    return P;
  }

  // Right-to-left reveal: clip that opens from the right edge of [x0, x1] as p goes 0 -> 1.
  // Pads 0.6em above and below: Persian reaches far past Latin (dots under پ ی, the top of گ).
  function wipe(g, x0, x1, top, bottom, p, em) {
    const pad = 0.6 * em, w = (x1 - x0) * M.clamp(p);
    g.beginPath(); g.rect(x1 - w, top - pad, w, bottom - top + 2 * pad); g.clip();
  }

  // Box for window.TEXTS / readcheck.
  const box = (id, R, x, y, size, align = 'right') => {
    const P = place(R, x, y, size, align);
    return { id, text: R.text, x0: P.left, y0: P.top, x1: P.left + P.w, y1: P.bottom };
  };

  M.fa = { num, words, split, run, place, draw, wipe, box, ZWJ, ZWNJ };
})(globalThis);
