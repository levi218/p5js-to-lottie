var fitCurve = require("fit-curve");

// Glyph outlines for Lottie "chars". lottie-web's canvas renderer (and the
// native players) draw text only from embedded glyph shapes, and a system
// font's outlines can't be read from the browser, so trace them: rasterize the
// character large, follow its anti-aliased edge, and curve-fit that outline.
// ponytail: traced from the browser's rendering, not the font file; parse the
// font (opentype.js) if exact outlines ever matter.
const SCALE = 4; // traced at 400px, stored in Lottie's 100-unit glyph space

interface Contour {
  v: number[][];
  i: number[][];
  o: number[][];
}

const traced = new Map<string, { w: number; contours: Contour[] }>();
const dilations = new Map<string, number>();
const glyphs = new Map<string, object>();

const r2 = (n: number) => Math.round(n * 100) / 100;

// One Lottie char per character + font, cached so the animation can dedupe by
// identity.
export function glyph(ch: string, family: string, style: string) {
  const key = JSON.stringify([ch, family, style]);
  if (!glyphs.has(key)) {
    const d = dilation(family, style);
    const { w, contours } = trace(ch, family, style);
    const shapes = contours.map((contour) => {
      const { v, i, o } = dilate(contour, d);
      const round = (p: number[]) => p.map(r2);
      return { ty: "sh", ks: { a: 0, k: { i: i.map(round), o: o.map(round), v: v.map(round), c: true } } };
    });
    glyphs.set(key, {
      ch,
      size: 100,
      style,
      fFamily: family,
      w: r2(w),
      data: { shapes: [{ ty: "gr", nm: ch, it: shapes }] },
    });
  }
  return glyphs.get(key)!;
}

// Moves each vertex d units off the ink (outward for outlines, into holes).
// Contours run with the ink on their right, so "outward" is to the left.
function dilate({ v, i, o }: Contour, d: number): Contour {
  if (d === 0) return { v, i, o };
  const n = v.length;
  return {
    i,
    o,
    v: v.map(([x, y], k) => {
      let [tx, ty] = [o[k][0] - i[k][0], o[k][1] - i[k][1]];
      if (Math.hypot(tx, ty) < 1e-6) {
        [tx, ty] = [v[(k + 1) % n][0] - v[(k + n - 1) % n][0], v[(k + 1) % n][1] - v[(k + n - 1) % n][1]];
      }
      const length = Math.hypot(tx, ty) || 1;
      return [x + (d * ty) / length, y - (d * tx) / length];
    }),
  };
}

// Browsers render text a little bolder than a path of the same outline
// (stem darkening, gamma), and by how much depends on the platform. Pick the
// outline offset that gives traced glyphs the same ink as fillText() on a
// sample string.
// ponytail: calibrated once per font at 32px; rendering that thickens
// differently at very small or large sizes will be slightly off there.
function dilation(family: string, style: string) {
  const key = JSON.stringify([family, style]);
  if (!dilations.has(key)) {
    const sample = "Hamburgefonstiv";
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size * sample.length;
    canvas.height = size * 2;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const baseline = size * 1.4;
    const ink = (draw: () => void) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw();
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0;
      for (let k = 3; k < data.length; k += 4) sum += data[k];
      return sum;
    };
    ctx.font = `${style} ${size}px ${family}`;
    const target = ink(() => ctx.fillText(sample, size / 2, baseline));
    const pathInk = (d: number) =>
      ink(() => {
        const s = size / 100;
        const path = new Path2D();
        let pen = size / 2;
        for (const ch of sample) {
          const { w, contours } = trace(ch, family, style);
          for (const contour of contours) {
            const { v, i, o } = dilate(contour, d);
            const X = (x: number) => pen + x * s;
            const Y = (y: number) => baseline + y * s;
            path.moveTo(X(v[0][0]), Y(v[0][1]));
            for (let k = 0; k < v.length; k++) {
              const k2 = (k + 1) % v.length;
              path.bezierCurveTo(
                X(v[k][0] + o[k][0]), Y(v[k][1] + o[k][1]),
                X(v[k2][0] + i[k2][0]), Y(v[k2][1] + i[k2][1]),
                X(v[k2][0]), Y(v[k2][1])
              );
            }
            path.closePath();
          }
          pen += w * s;
        }
        ctx.fill(path);
      });
    // ink grows with d: bisect for the offset that matches
    let [lo, hi] = [-2, 4];
    for (let step = 0; step < 12; step++) {
      const mid = (lo + hi) / 2;
      if (pathInk(mid) < target) lo = mid;
      else hi = mid;
    }
    dilations.set(key, (lo + hi) / 2);
  }
  return dilations.get(key)!;
}

// The character's advance width and outlines in glyph units (y up is negative,
// baseline at 0).
function trace(ch: string, family: string, style: string) {
  const key = JSON.stringify([ch, family, style]);
  if (traced.has(key)) return traced.get(key)!;

  const font = `${style} ${100 * SCALE}px ${family}`;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.font = font;
  const m = ctx.measureText(ch);
  const pad = 2;
  const left = Math.ceil(m.actualBoundingBoxLeft) + pad;
  const top = Math.ceil(m.actualBoundingBoxAscent) + pad;
  const w = Math.max(1, left + Math.ceil(m.actualBoundingBoxRight) + pad);
  const h = Math.max(1, top + Math.ceil(m.actualBoundingBoxDescent) + pad);
  canvas.width = w;
  canvas.height = h;
  ctx.font = font; // resizing the canvas reset it
  ctx.fillText(ch, left, top);
  const alpha = ctx.getImageData(0, 0, w, h).data;
  const alphaAt = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h ? alpha[(y * w + x) * 4 + 3] : 0;
  const inside = (x: number, y: number) => alphaAt(x, y) >= 128;

  // Directed edges between pixel corners wherever an inside pixel meets an
  // outside one, always with the inside on the right: outer outlines run
  // clockwise and holes counter-clockwise, so a nonzero fill keeps the holes.
  const W = w + 1;
  const next = new Map<number, number[]>();
  const edge = (x0: number, y0: number, x1: number, y1: number) => {
    const k = y0 * W + x0;
    if (!next.has(k)) next.set(k, []);
    next.get(k)!.push(y1 * W + x1);
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) continue;
      if (!inside(x, y - 1)) edge(x, y, x + 1, y);
      if (!inside(x + 1, y)) edge(x + 1, y, x + 1, y + 1);
      if (!inside(x, y + 1)) edge(x + 1, y + 1, x, y + 1);
      if (!inside(x - 1, y)) edge(x, y + 1, x, y);
    }
  }

  const contours: Contour[] = [];
  for (const start of next.keys()) {
    // every corner has as many edges out as in, so a walk always gets back
    while (next.get(start)!.length) {
      const loop = [start];
      for (let at = next.get(start)!.pop()!; at !== start; at = next.get(at)!.pop()!) {
        loop.push(at);
      }
      if (loop.length < 8) continue; // specks
      // One point per edge, where the anti-aliased alpha crosses 50% between
      // the inside pixel's center and the outside one's: a sub-pixel outline
      // instead of the pixel staircase.
      const points = loop.map((k, i) => {
        const k2 = loop[(i + 1) % loop.length];
        const [x0, y0, x1, y1] = [k % W, Math.floor(k / W), k2 % W, Math.floor(k2 / W)];
        const [nx, ny] = [y0 - y1, x1 - x0]; // unit normal pointing inside
        const [mx, my] = [(x0 + x1) / 2, (y0 + y1) / 2];
        const aIn = alphaAt(Math.floor(mx + nx / 2), Math.floor(my + ny / 2));
        const aOut = alphaAt(Math.floor(mx - nx / 2), Math.floor(my - ny / 2));
        const t = (aIn - 127.5) / Math.max(1, aIn - aOut);
        return [mx + (0.5 - t) * nx, my + (0.5 - t) * ny];
      });
      const segments: number[][][] = fitCurve([...points, points[0]], 1);
      const n = segments.length;
      contours.push({
        v: segments.map((s) => [(s[0][0] - left) / SCALE, (s[0][1] - top) / SCALE]),
        o: segments.map((s) => [(s[1][0] - s[0][0]) / SCALE, (s[1][1] - s[0][1]) / SCALE]),
        i: segments.map((_, k) => {
          const prev = segments[(k + n - 1) % n];
          return [(prev[2][0] - prev[3][0]) / SCALE, (prev[2][1] - prev[3][1]) / SCALE];
        }),
      });
    }
  }

  const result = { w: m.width / SCALE, contours };
  traced.set(key, result);
  return result;
}
