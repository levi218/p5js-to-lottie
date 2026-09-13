// Lottie bezier path: vertices, plus in/out tangents relative to each vertex.
export interface BezierPath {
  v: number[][];
  i: number[][];
  o: number[][];
  c: boolean;
}

// One p5 vertex call, in beginShape() order.
export interface VertexCall {
  kind: "vertex" | "bezierVertex" | "quadraticVertex" | "curveVertex";
  args: number[];
}

function pathBuilder(closed: boolean) {
  const path: BezierPath = { v: [], i: [], o: [], c: closed };
  return {
    last: () => path.v[path.v.length - 1],
    lineTo(x: number, y: number) {
      path.v.push([x, y]);
      path.i.push([0, 0]);
      path.o.push([0, 0]);
    },
    cubicTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) {
      const last = path.v.length - 1;
      path.o[last] = [c1x - path.v[last][0], c1y - path.v[last][1]];
      path.v.push([x, y]);
      path.i.push([c2x - x, c2y - y]);
      path.o.push([0, 0]);
    },
    done() {
      // A closed path that curves back onto its start would otherwise get a
      // zero-length closing segment; fold the last vertex into the first.
      const n = path.v.length;
      if (
        path.c &&
        n > 1 &&
        Math.abs(path.v[n - 1][0] - path.v[0][0]) < 1e-6 &&
        Math.abs(path.v[n - 1][1] - path.v[0][1]) < 1e-6
      ) {
        path.i[0] = path.i[n - 1];
        path.v.pop();
        path.i.pop();
        path.o.pop();
      }
      return path;
    },
  };
}

// Mirrors p5's Renderer2D.endShape() for the default (POLYGON) shape kind.
export function shapePath(calls: VertexCall[], closed: boolean, tightness: number) {
  const b = pathBuilder(closed);
  if (calls.some((call) => call.kind === "curveVertex")) {
    // Catmull-Rom through every vertex; the first and last only steer. p5
    // appends the first vertex twice when closing (once in p5.endShape, once
    // in the renderer), so the curve runs back to it before the closing line.
    const p = calls.map((call) => call.args);
    if (closed) p.push(p[0], p[0]);
    if (p.length > 3) {
      const s = 1 - tightness;
      b.lineTo(p[1][0], p[1][1]);
      for (let i = 1; i + 2 < p.length; i++) {
        b.cubicTo(
          p[i][0] + (s * (p[i + 1][0] - p[i - 1][0])) / 6,
          p[i][1] + (s * (p[i + 1][1] - p[i - 1][1])) / 6,
          p[i + 1][0] + (s * (p[i][0] - p[i + 2][0])) / 6,
          p[i + 1][1] + (s * (p[i][1] - p[i + 2][1])) / 6,
          p[i + 1][0],
          p[i + 1][1]
        );
      }
    }
    return b.done();
  }
  for (const { kind, args: a } of calls) {
    if (kind === "bezierVertex") {
      b.cubicTo(a[0], a[1], a[2], a[3], a[4], a[5]);
    } else if (kind === "quadraticVertex") {
      // exact cubic form of a quadratic: controls 2/3 of the way to the pivot
      const [px, py] = b.last();
      b.cubicTo(
        px + (2 / 3) * (a[0] - px),
        py + (2 / 3) * (a[1] - py),
        a[2] + (2 / 3) * (a[0] - a[2]),
        a[3] + (2 / 3) * (a[1] - a[3]),
        a[2],
        a[3]
      );
    } else {
      b.lineTo(a[0], a[1]);
    }
  }
  return b.done();
}

// Mirrors p5's Renderer2D.arc(): (x, y, w, h) is the corner box and the angles
// are already normalized. p5 fills a closed wedge (unless CHORD/OPEN) but
// strokes an open outline (unless PIE/CHORD), so the two paths differ.
export function arcPaths(
  x: number,
  y: number,
  w: number,
  h: number,
  start: number,
  stop: number,
  mode?: string
) {
  const rx = w / 2;
  const ry = h / 2;
  const cx = x + rx;
  const cy = y + ry;
  const outline = (closed: boolean) => {
    const b = pathBuilder(closed);
    b.lineTo(cx + rx * Math.cos(start), cy + ry * Math.sin(start));
    for (let a = start; stop - a >= 0.00001; ) {
      const size = Math.min(stop - a, Math.PI / 2);
      const k = (4 / 3) * Math.tan(size / 4);
      const e = a + size;
      b.cubicTo(
        cx + rx * (Math.cos(a) - k * Math.sin(a)),
        cy + ry * (Math.sin(a) + k * Math.cos(a)),
        cx + rx * (Math.cos(e) + k * Math.sin(e)),
        cy + ry * (Math.sin(e) - k * Math.cos(e)),
        cx + rx * Math.cos(e),
        cy + ry * Math.sin(e)
      );
      a = e;
    }
    return b;
  };
  const pie = mode === "pie" || mode == null;
  const fill = outline(true);
  if (pie) fill.lineTo(cx, cy);
  const stroke = outline(mode === "pie" || mode === "chord");
  if (mode === "pie") stroke.lineTo(cx, cy);
  return { fill: fill.done(), stroke: stroke.done() };
}
