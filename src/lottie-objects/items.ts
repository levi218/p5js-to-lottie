import { parseColor } from "../../utils/color";
import type { Gradient } from "../gradient";
import { applyMatrix, decomposeMatrix, unwrapDegrees, type Matrix } from "../matrix";
import { animatedProperty } from "../optimizer";

export const round = (n: number) => Math.round(n * 1000) / 1000;

// Same timeline as Optimizer: the first captured frame is t=0, the second is
// dropped (saveGif doubles its first frame), frame n>=3 lands on t=n-2.
function frameTime(frame: any): number | null {
  if (frame.frame <= 1) return 0;
  if (frame.frame === 2) return null;
  return frame.frame - 2;
}

// One { t, s } keyframe per change in value.
export function holdKeyframes(frames: any[], valueOf: (frame: any) => unknown) {
  const keys: { t: number; s: any }[] = [];
  let lastJson: string | undefined;
  for (const frame of frames) {
    const t = frameTime(frame);
    if (t === null) continue;
    const value = valueOf(frame);
    const json = JSON.stringify(value);
    if (json === lastJson) continue;
    lastJson = json;
    if (keys.length && keys[keys.length - 1].t === t) keys.pop();
    keys.push({ t, s: value });
  }
  return keys;
}

// A property that changes in steps (colors, opacity, stroke width, vertex
// paths): static when it never changes, otherwise a hold keyframe per change.
export function holdProperty(frames: any[], valueOf: (frame: any) => unknown) {
  const keys = holdKeyframes(frames, valueOf);
  if (keys.length === 1) return { a: 0, k: keys[0].s };
  return {
    a: 1,
    k: keys.map(({ t, s }) => ({ t, s: Array.isArray(s) ? s : [s], h: 1 })),
  };
}

export function rgb(style: unknown): number[] | null {
  const c = parseColor(style);
  return c ? [round(c.r), round(c.g), round(c.b)] : null;
}

const LINE_CAP: Record<string, number> = { butt: 1, round: 2, square: 3 };
const LINE_JOIN: Record<string, number> = { miter: 1, round: 2, bevel: 3 };

const isGradient = (style: unknown): style is Gradient =>
  style !== null && typeof style === "object";

// Maps a point in p5's user space (where gradient coordinates live) into the
// shape group's local space.
export type ToLocal = (frame: any, x: number, y: number) => [number, number];

// Gradient fill/stroke properties. Frames with a solid color (or none) keep
// the previous gradient's geometry, flat-colored — Lottie can't switch a style
// item between solid and gradient.
// ponytail: the first gradient's type and stop count win, and a radial
// gradient's focal offset (x0,y0 != x1,y1) is dropped; map it onto "h"/"a" if
// sketches need it.
function gradientProps(frames: any[], key: "fill" | "stroke", toLocal: ToLocal) {
  const first: Gradient = frames.find((frame) => isGradient(frame[key]))[key];
  let last = first;
  const resolved = new Map<any, Gradient>();
  for (const frame of frames) {
    const style = frame[key];
    if (isGradient(style) && style.type === first.type && style.stops.length === first.stops.length) {
      last = style;
    } else if (!isGradient(style)) {
      last = { ...last, stops: last.stops.map(([offset]) => [offset, style]) };
    }
    resolved.set(frame, last);
  }

  const ends = (frame: any) => {
    const { type, args: a } = resolved.get(frame)!;
    return type === "linear"
      ? [toLocal(frame, a[0], a[1]), toLocal(frame, a[2], a[3])]
      : [toLocal(frame, a[3], a[4]), toLocal(frame, a[3] + a[5], a[4])];
  };
  return {
    o: holdProperty(frames, (frame) => (frame[key] == null ? 0 : 100)),
    t: first.type === "linear" ? 1 : 2,
    s: animatedProperty(frames.map((frame) => ends(frame)[0])),
    e: animatedProperty(frames.map((frame) => ends(frame)[1])),
    h: { a: 0, k: 0 },
    a: { a: 0, k: 0 },
    g: {
      p: first.stops.length,
      // [offset, r, g, b] per stop, then [offset, alpha] per stop
      k: holdProperty(frames, (frame) => {
        const { type, args, stops } = resolved.get(frame)!;
        // Lottie radial gradients start at the center; p5/canvas at radius r0.
        const [r0, r1] = type === "radial" ? [args[2], args[5]] : [0, 1];
        const offsetOf = (o: number) => round(r1 > 0 ? (r0 + o * (r1 - r0)) / r1 : o);
        const colors = stops.map(([o, c]) => [offsetOf(o), parseColor(c) ?? { r: 0, g: 0, b: 0, a: 0 }] as const);
        return [
          ...colors.flatMap(([o, c]) => [o, round(c.r), round(c.g), round(c.b)]),
          ...colors.flatMap(([o, c]) => [o, round(c.a)]),
        ];
      }),
    },
  };
}

// Stroke then fill: in a Lottie group earlier items paint on top, and p5
// strokes over its fill. A style that's null (noFill/noStroke) or transparent
// for a frame is carried as 0 opacity; one never visible is omitted.
export function styleItems(
  frames: any[],
  strokeScale: (frame: any) => number = () => 1,
  toLocal: ToLocal = (_, x, y) => [x, y]
): any[] {
  const colorOf = (key: "fill" | "stroke") => {
    let last = [0, 0, 0];
    return (frame: any) => (last = rgb(frame[key]) ?? last);
  };
  const paint = (key: "fill" | "stroke") =>
    frames.some((frame) => isGradient(frame[key]))
      ? gradientProps(frames, key, toLocal)
      : {
          c: holdProperty(frames, colorOf(key)),
          o: holdProperty(frames, (frame) => round((parseColor(frame[key])?.a ?? 0) * 100)),
        };
  const visible = (key: "fill" | "stroke") =>
    frames.some(
      (frame) => isGradient(frame[key]) || (parseColor(frame[key])?.a ?? 0) > 0
    );

  const items: any[] = [];
  if (visible("stroke")) {
    const props = paint("stroke");
    items.push({
      ty: "g" in props ? "gs" : "st",
      nm: "Stroke",
      ...props,
      w: holdProperty(frames, (frame) =>
        round(frame.strokeWeight * strokeScale(frame))
      ),
      lc: LINE_CAP[frames[0].strokeCap] ?? 2,
      lj: LINE_JOIN[frames[0].strokeJoin] ?? 1,
      ml: 4,
    });
  }
  if (visible("fill")) {
    const props = paint("fill");
    items.push({ ty: "g" in props ? "gf" : "fl", nm: "Fill", ...props, r: 1 });
  }
  return items;
}

// Group transform for shapes drawn around a pivot. "p" transforms the pivot
// (the shape's center) through the matrix so position alone places it, and
// "r"/"s" only spin/scale it in place. Driving "p" from a corner instead
// needs "p" and "r"/"s" to cancel exactly, which independent curve-fitting of
// each property doesn't preserve — the shape drifts off its pivot.
// sizeScale stretches the content first (e.g. an image asset to its drawn size).
export function transformItem(
  frames: any[],
  pivotOf: (frame: any) => [number, number],
  sizeScale: (frame: any) => [number, number] = () => [1, 1]
) {
  return {
    ty: "tr",
    a: { a: 0, k: [0, 0] },
    p: animatedProperty(
      frames.map((frame) => applyMatrix(frame.matrix, ...pivotOf(frame)))
    ),
    s: animatedProperty(
      frames.map((frame) => {
        const { scaleX, scaleY } = decomposeMatrix(frame.matrix);
        const [kx, ky] = sizeScale(frame);
        return [scaleX * kx * 100, scaleY * ky * 100];
      })
    ),
    r: animatedProperty(
      unwrapDegrees(
        frames.map((frame) => decomposeMatrix(frame.matrix).rotation)
      ).map((deg) => [deg])
    ),
    o: { a: 0, k: 100 },
  };
}

export const identityTransformItem = {
  ty: "tr",
  a: { a: 0, k: [0, 0] },
  p: { a: 0, k: [0, 0] },
  s: { a: 0, k: [100, 100] },
  r: { a: 0, k: 0 },
  o: { a: 0, k: 100 },
};

// Straight-edged path whose vertices are already in canvas space.
export function pathItem(
  name: string,
  frames: any[],
  pointsOf: (frame: any) => [number, number][],
  closed: boolean
) {
  return {
    ty: "sh",
    nm: name,
    ks: holdProperty(frames, (frame) => {
      const v = pointsOf(frame).map(([x, y]) => [round(x), round(y)]);
      return { i: v.map(() => [0, 0]), o: v.map(() => [0, 0]), v, c: closed };
    }),
  };
}

// Vertex shapes bake the matrix into their points, so their stroke width has
// to pick up the matrix's area scale that a group transform would have applied.
export const matrixStrokeScale = (frame: { matrix: Matrix }) => {
  const [a, b, c, d] = frame.matrix;
  return Math.sqrt(Math.abs(a * d - b * c));
};

// ...and their gradients live in canvas space too.
export const matrixToLocal: ToLocal = (frame, x, y) => applyMatrix(frame.matrix, x, y);
