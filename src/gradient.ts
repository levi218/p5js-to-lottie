// A CanvasGradient can't be read back once created, so record how each one
// was built. Patched at load time: sketches often build gradients in setup(),
// before saveLottie() is ever called.
export interface Gradient {
  type: "linear" | "radial";
  args: number[];
  stops: [number, string][];
}

const gradients = new WeakMap<object, Gradient>();

if (typeof CanvasRenderingContext2D !== "undefined") {
  const proto: any = CanvasRenderingContext2D.prototype;
  for (const [method, type] of [
    ["createLinearGradient", "linear"],
    ["createRadialGradient", "radial"],
  ] as const) {
    const original = proto[method];
    proto[method] = function (...args: number[]) {
      const gradient = original.apply(this, args);
      gradients.set(gradient, { type, args, stops: [] });
      return gradient;
    };
  }

  // Let the browser normalize any CSS color ("red", "hsl(...)") into the
  // "#rrggbb" / "rgba()" forms parseColor reads.
  const normalizer = document.createElement("canvas").getContext("2d")!;
  const addColorStop = CanvasGradient.prototype.addColorStop;
  CanvasGradient.prototype.addColorStop = function (offset, color) {
    addColorStop.call(this, offset, color);
    normalizer.fillStyle = color;
    gradients.get(this)?.stops.push([offset, normalizer.fillStyle as string]);
  };
}

// fillStyle/strokeStyle as capturable data: a color string, a gradient
// snapshot (later addColorStop calls mustn't rewrite captured frames), or null
// for patterns.
export function styleValue(style: unknown): string | Gradient | null {
  if (typeof style === "string") return style;
  const gradient = gradients.get(style as object);
  if (!gradient) return null;
  return { ...gradient, stops: [...gradient.stops].sort((a, b) => a[0] - b[0]) };
}
