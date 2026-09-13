import { styleValue } from "./gradient";
import {
  identityMatrix,
  rotateMatrix,
  scaleMatrix,
  translateMatrix,
  type Matrix,
} from "./matrix";
import { arcPaths, shapePath, type BezierPath, type VertexCall } from "./path";

let originalFunctions: [any, string, Function][] = [];
let objects: Record<string, any> = {};
let lastFrame = 0;
let objectCounter = 0;
let lottieFrameCount = 0; // this.frameCount is bugged after the first redraw() call
// stack of accumulated translate()/rotate()/scale() transforms, mirroring p5's push()/pop()
let matrixStack: Matrix[] = [identityMatrix()];
// vertex calls since the last beginShape()
let shape: { kind: unknown; calls: VertexCall[] } | null = null;
// >0 while inside a wrapped p5 call: p5 implements some calls with others
// (bezier() runs beginShape/vertex/endShape), which mustn't record twice.
let depth = 0;

function markInitFrame(p5Instance: any) {
  if (p5Instance.frameCount !== lastFrame) {
    lottieFrameCount++;
    // reset object counter -> kind of like how react rehydrate hooks
    objectCounter = 0;
    lastFrame = p5Instance.frameCount;
    // p5 resets the transform matrix at the start of every draw() call
    matrixStack = [identityMatrix()];
  }
}

// p5's modeAdjust(): turns rectMode()/ellipseMode() arguments into a corner box.
function modeAdjust(a: number, b: number, c: number, d: number, mode: string) {
  switch (mode) {
    case "corners":
      return { x: a, y: b, w: c - a, h: d - b };
    case "radius":
      return { x: a - c, y: b - d, w: 2 * c, h: 2 * d };
    case "center":
      return { x: a - c / 2, y: b - d / 2, w: c, h: d };
    default:
      return { x: a, y: b, w: c, h: d };
  }
}

// [x, y, w, h] corner box with a non-negative size, as the 2D renderer draws it.
function rectBox(p5: any, x: number, y: number, w: number, h: number) {
  const box = modeAdjust(x, y, w, h, p5._renderer._rectMode);
  if (box.w < 0) {
    box.x += box.w;
    box.w = -box.w;
  }
  if (box.h < 0) {
    box.y += box.h;
    box.h = -box.h;
  }
  return [box.x, box.y, box.w, box.h];
}

// [centerX, centerY, w, h]; p5 takes |w| and |h| before applying ellipseMode.
function ellipseBox(p5: any, x: number, y: number, w: number, h: number) {
  const box = modeAdjust(x, y, Math.abs(w), Math.abs(h), p5._renderer._ellipseMode);
  return [box.x + box.w / 2, box.y + box.h / 2, box.w, box.h];
}

function style(p5: any) {
  const renderer = p5._renderer;
  const ctx = p5.drawingContext;
  return {
    fill: renderer._doFill ? styleValue(ctx.fillStyle) : null,
    stroke: renderer._doStroke ? styleValue(ctx.strokeStyle) : null,
    strokeWeight: ctx.lineWidth,
    strokeCap: ctx.lineCap,
    strokeJoin: ctx.lineJoin,
  };
}

const pathCapture = (p5: any, path: BezierPath, extra = {}) =>
  path.v.length ? { path, ...style(p5), ...extra } : null;

// A cropped (and tinted) copy of an image as a data-URL Lottie asset, made
// once per image + crop + tint.
// ponytail: the pixels are read on first draw, so a p5.Graphics that keeps
// being redrawn exports its first state; hash the pixels if that matters.
const assetCache = new WeakMap<object, Map<string, object | null>>();
let assetCounter = 0;
function imageAsset(renderer: any, img: any, sx: number, sy: number, sw: number, sh: number) {
  const tinted = renderer._tint && img.canvas;
  const key = [sx, sy, sw, sh, tinted ? renderer._tint : ""].join();
  let cache = assetCache.get(img);
  if (!cache) assetCache.set(img, (cache = new Map()));
  if (!cache.has(key)) {
    // same source and pixel-density scale p5's Renderer2D.image() uses
    const source = tinted ? renderer._getTintedImageCanvas(img) : img.canvas || img.elt;
    const s = img.width > 0 ? source.width / img.width : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(s * sw));
    canvas.height = Math.max(1, Math.round(s * sh));
    canvas
      .getContext("2d")!
      .drawImage(source, s * sx, s * sy, s * sw, s * sh, 0, 0, canvas.width, canvas.height);
    try {
      const p = canvas.toDataURL();
      cache.set(key, { id: `image_${assetCounter++}`, w: canvas.width, h: canvas.height, u: "", p, e: 1 });
    } catch {
      console.warn("p5js-to-lottie: skipped an image that can't be read back (cross-origin?)");
      cache.set(key, null);
    }
  }
  return cache.get(key);
}

const captureMap: Record<string, (p5: any, args: any) => object | null> = {
  ellipse: (p5, a) => ({
    params: ellipseBox(p5, a[0], a[1], a[2], a[3] ?? a[2]),
    ...style(p5),
  }),
  circle: (p5, a) => ({ params: ellipseBox(p5, a[0], a[1], a[2], a[2]), ...style(p5) }),
  rect: (p5, a) => ({
    params: rectBox(p5, a[0], a[1], a[2], a[3] ?? a[2]),
    radius: a[4] ?? 0,
    ...style(p5),
  }),
  square: (p5, a) => ({
    params: rectBox(p5, a[0], a[1], a[2], a[2]),
    radius: a[3] ?? 0,
    ...style(p5),
  }),
  background: (p5, a) => ({ params: p5.color(...a).toString("#rrggbb") }),
  line: (p5, a) => ({ params: [a[0], a[1], a[2], a[3]], ...style(p5), fill: null }),
  // point() is a filled dot, strokeWeight in diameter, in the stroke color.
  point: (p5, a) => {
    const s = style(p5);
    const [x, y] = typeof a[0] === "object" ? [a[0].x, a[0].y] : [a[0], a[1]];
    return {
      params: [x, y, s.strokeWeight, s.strokeWeight],
      fill: s.stroke,
      stroke: null,
      strokeWeight: 0,
    };
  },
  triangle: (p5, a) => ({
    params: [a[0], a[1], a[2], a[3], a[4], a[5]],
    ...style(p5),
  }),
  bezier: (p5, a) =>
    pathCapture(
      p5,
      shapePath(
        [
          { kind: "vertex", args: [a[0], a[1]] },
          { kind: "bezierVertex", args: [a[2], a[3], a[4], a[5], a[6], a[7]] },
        ],
        false,
        0
      )
    ),
  // p5's curve() is stroke-only
  curve: (p5, a) =>
    pathCapture(
      p5,
      shapePath(
        [0, 2, 4, 6].map((i) => ({ kind: "curveVertex", args: [a[i], a[i + 1]] })),
        false,
        p5._renderer._curveTightness
      ),
      { fill: null }
    ),
  arc: (p5, a) => {
    const start = p5._toRadians(a[4]);
    const stop = p5._toRadians(a[5]);
    if (start === stop) return null;
    const box = modeAdjust(a[0], a[1], Math.abs(a[2]), Math.abs(a[3]), p5._renderer._ellipseMode);
    const angles = p5._normalizeArcAngles(start, stop, box.w, box.h, true);
    const { fill, stroke } = angles.correspondToSamePoint
      ? arcPaths(box.x, box.y, box.w, box.h, 0, 2 * Math.PI, "chord")
      : arcPaths(box.x, box.y, box.w, box.h, angles.start, angles.stop, a[6]);
    return pathCapture(p5, fill, { strokePath: stroke });
  },
  // ponytail: only the default POLYGON kind and no beginContour(); POINTS,
  // LINES, TRIANGLES etc. are skipped.
  endShape: (p5, a) => {
    const current = shape;
    shape = null;
    if (!current || current.kind != null) return null;
    return pathCapture(
      p5,
      shapePath(current.calls, a[0] === "close", p5._renderer._curveTightness)
    );
  },
};

// Captured on the renderer, after p5 has resolved the sketch-level arguments:
// imageMode/crop/fit for images; wrapping, alignment and leading for text,
// which arrives one line at a time.
const rendererCaptureMap: Record<string, [string, (p5: any, args: any) => object | null]> = {
  image: [
    "image",
    (p5, [img, sx, sy, sw, sh, dx, dy, dw, dh]) => {
      const asset = imageAsset(p5._renderer, img, sx, sy, sw, sh);
      return asset ? { asset, params: [dx, dy, dw, dh] } : null;
    },
  ],
  _renderText: [
    "text",
    (p5, [, line, x, y, maxY, minY]) => {
      if (y < minY || y >= maxY) return null;
      const renderer = p5._renderer;
      const ctx = p5.drawingContext;
      // Lottie places text by its alphabetic baseline; shift y there from
      // whichever textBaseline p5 set.
      const baseline = ctx.textBaseline;
      const ascent = ctx.measureText(line).fontBoundingBoxAscent;
      ctx.textBaseline = "alphabetic";
      const alphabeticAscent = ctx.measureText(line).fontBoundingBoxAscent;
      ctx.textBaseline = baseline;
      return {
        params: [x, y + alphabeticAscent - ascent],
        text: line,
        font: ctx.font,
        align: ctx.textAlign,
        // _renderText falls back to black when fill() was never called
        fill: renderer._doFill ? (renderer._fillSet ? ctx.fillStyle : "#000000") : null,
        stroke: renderer._doStroke && renderer._strokeSet ? ctx.strokeStyle : null,
        strokeWeight: ctx.lineWidth,
      };
    },
  ],
};

export function attachInterceptor(p5Instance: any) {
  objects = {};
  lottieFrameCount = 0;
  matrixStack = [identityMatrix()];
  shape = null;
  depth = 0;
  const context = p5Instance._isGlobal ? window : p5Instance;

  const wrap = (target: any, key: string, hook: (args: any[]) => void) => {
    const original = target[key];
    originalFunctions.push([target, key, original]);
    target[key] = function (this: any, ...args: any[]) {
      markInitFrame(context);
      if (depth === 0) hook(args);
      depth++;
      try {
        return original.apply(this, args);
      } finally {
        depth--;
      }
    };
  };

  const record = (type: string, capture: (p5: any, args: any) => object | null) => (args: any[]) => {
    const data = capture(p5Instance, args);
    if (!data) return;
    const id = `${type}${objectCounter}`;
    if (!objects[id]) objects[id] = { type, frames: [] };
    objects[id].frames.push({
      frame: lottieFrameCount,
      matrix: matrixStack[matrixStack.length - 1],
      ...data,
    });
    objectCounter++;
  };

  for (const [key, capture] of Object.entries(captureMap)) {
    wrap(context, key, record(key, capture));
  }
  for (const [key, [type, capture]] of Object.entries(rendererCaptureMap)) {
    wrap(p5Instance._renderer, key, record(type, capture));
  }

  wrap(context, "beginShape", (args) => {
    shape = { kind: args[0], calls: [] };
  });
  for (const kind of ["vertex", "bezierVertex", "quadraticVertex", "curveVertex"] as const) {
    wrap(context, kind, (args) => shape?.calls.push({ kind, args }));
  }

  // 2D transformations: replace the top-of-stack matrix so shapes drawn after
  // pick up the accumulated translate/rotate/scale.
  const transformFuncMap: Record<string, (args: any) => void> = {
    push: () => {
      matrixStack.push(matrixStack[matrixStack.length - 1]);
    },
    pop: () => {
      if (matrixStack.length > 1) matrixStack.pop();
    },
    translate: (args) => {
      const top = matrixStack.length - 1;
      matrixStack[top] = translateMatrix(matrixStack[top], args[0], args[1] ?? 0);
    },
    rotate: (args) => {
      // Read the instance, not window: global mode doesn't mirror _angleMode.
      const radians =
        p5Instance._angleMode === "degrees" ? (args[0] * Math.PI) / 180 : args[0];
      const top = matrixStack.length - 1;
      matrixStack[top] = rotateMatrix(matrixStack[top], radians);
    },
    scale: (args) => {
      const sx = args[0];
      const sy = args[1] ?? sx;
      const top = matrixStack.length - 1;
      matrixStack[top] = scaleMatrix(matrixStack[top], sx, sy);
    },
  };

  for (const [key, applyTransform] of Object.entries(transformFuncMap)) {
    wrap(context, key, applyTransform);
  }
}

export function detachInterceptor(p5Instance: any) {
  // reverse order, so a function wrapped twice ends up back at its original
  for (const [target, key, original] of originalFunctions.reverse()) {
    target[key] = original;
  }

  originalFunctions = [];
  const _objects = objects;
  objects = {};
  return _objects;
}
