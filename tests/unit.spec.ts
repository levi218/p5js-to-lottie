import { test, expect } from "@playwright/test";
import { parseColor } from "../utils/color";
import {
  applyMatrix,
  decomposeMatrix,
  identityMatrix,
  rotateMatrix,
  translateMatrix,
  unwrapDegrees,
} from "../src/matrix";
import { Optimizer, animatedProperty } from "../src/optimizer";
import { arcPaths, shapePath } from "../src/path";
import { crc32, dotLottie } from "../src/dotlottie";

test("dotLottie: zip entries inflate back to the manifest and animation", async () => {
  const json = JSON.stringify({ v: "5.5.2", layers: [] });
  const bytes = new Uint8Array(await (await dotLottie(json)).arrayBuffer());
  const view = new DataView(bytes.buffer);
  const entries: Record<string, string> = {};
  for (let at = 0; view.getUint32(at, true) === 0x04034b50; ) {
    const size = view.getUint32(at + 18, true);
    const nameLength = view.getUint16(at + 26, true);
    const name = new TextDecoder().decode(bytes.subarray(at + 30, at + 30 + nameLength));
    const data = bytes.subarray(at + 30 + nameLength, at + 30 + nameLength + size);
    const raw = new Uint8Array(
      await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer()
    );
    expect(crc32(raw)).toBe(view.getUint32(at + 14, true));
    entries[name] = new TextDecoder().decode(raw);
    at += 30 + nameLength + size;
  }
  expect(JSON.parse(entries["manifest.json"])).toMatchObject({ version: "2", animations: [{ id: "animation" }] });
  expect(entries["a/animation.json"]).toBe(json);
  expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
});

test("parseColor reads what a canvas context returns", () => {
  expect(parseColor("#ff8000")).toEqual({ r: 1, g: 128 / 255, b: 0, a: 1 });
  expect(parseColor("rgba(255, 0, 0, 0.5)")).toEqual({ r: 1, g: 0, b: 0, a: 0.5 });
  expect(parseColor(null)).toBeNull();
});

test("matrix: translate then rotate decomposes back", () => {
  const m = rotateMatrix(translateMatrix(identityMatrix(), 200, 200), Math.PI / 2);
  const { rotation, scaleX, scaleY } = decomposeMatrix(m);
  expect(rotation).toBeCloseTo(90);
  expect(scaleX).toBeCloseTo(1);
  expect(scaleY).toBeCloseTo(1);
  const [x, y] = applyMatrix(m, 10, 0);
  expect(x).toBeCloseTo(200);
  expect(y).toBeCloseTo(210);
});

test("unwrapDegrees keeps a spinning angle continuous across ±180", () => {
  expect(unwrapDegrees([170, 179, -178, -170])).toEqual([170, 179, 182, 190]);
});

test("Optimizer timeline spans every captured frame for circular motion", () => {
  // orbiting motion breaks into many small segments; each used to lose a frame
  const input = Array.from({ length: 300 }, (_, i) => [
    200 + 100 * Math.cos(i * 0.1),
    200 + 100 * Math.sin(i * 0.1),
  ]);
  const keys = new Optimizer().process(input);
  expect(keys[keys.length - 1].t).toBeGreaterThanOrEqual(296);
});

test("animatedProperty collapses constant values to a static property", () => {
  expect(animatedProperty([[100, 100], [100, 100]])).toEqual({ a: 0, k: [100, 100] });
  expect(animatedProperty([[45], [45]])).toEqual({ a: 0, k: 45 });
  expect(animatedProperty([[0], [10], [20]]).a).toBe(1);
});

test("shapePath: quadraticVertex becomes the equivalent cubic", () => {
  const path = shapePath(
    [
      { kind: "vertex", args: [0, 0] },
      { kind: "quadraticVertex", args: [30, 60, 90, 0] },
    ],
    false,
    0
  );
  expect(path.v).toEqual([[0, 0], [90, 0]]);
  expect(path.o[0]).toEqual([20, 40]); // 2/3 of the way to the control point
  expect(path.i[1][0]).toBeCloseTo(-40);
  expect(path.i[1][1]).toBeCloseTo(40);
});

test("shapePath: closed curveVertex runs back to the first point, then closes", () => {
  const square = [[0, 0], [100, 0], [100, 100], [0, 100]].map((args) => ({
    kind: "curveVertex" as const,
    args,
  }));
  const path = shapePath(square, true, 0);
  // p5 starts at the second point and ends on the first
  expect(path.v[0]).toEqual([100, 0]);
  expect(path.v[path.v.length - 1]).toEqual([0, 0]);
  expect(path.c).toBe(true);
});

test("arcPaths: full circle folds its closing vertex; default mode fills a wedge", () => {
  const circle = arcPaths(0, 0, 100, 100, 0, 2 * Math.PI, "chord");
  expect(circle.fill.v.length).toBe(4);
  expect(circle.stroke.c).toBe(true);

  const wedge = arcPaths(0, 0, 100, 100, 0, Math.PI / 2);
  expect(wedge.fill.v[wedge.fill.v.length - 1]).toEqual([50, 50]);
  expect(wedge.fill.c).toBe(true);
  expect(wedge.stroke.c).toBe(false);
  expect(wedge.stroke.v.length).toBe(2);
});
