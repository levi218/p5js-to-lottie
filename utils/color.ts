export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

// Parses what a 2D canvas context hands back for fillStyle/strokeStyle:
// "#rrggbb" when opaque, "rgba(r, g, b, a)" once alpha < 1. Channels come
// back in 0..1. Gradients/patterns (non-strings) aren't representable -> null.
export function parseColor(style: unknown): RGBA | null {
  if (typeof style !== "string") return null;
  const value = style.trim();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, "$&$&") : hex[1];
    return {
      r: parseInt(h.slice(0, 2), 16) / 255,
      g: parseInt(h.slice(2, 4), 16) / 255,
      b: parseInt(h.slice(4, 6), 16) / 255,
      a: 1,
    };
  }

  const fn =
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(
      value
    );
  if (fn) {
    return {
      r: Number(fn[1]) / 255,
      g: Number(fn[2]) / 255,
      b: Number(fn[3]) / 255,
      a: fn[4] === undefined ? 1 : Number(fn[4]),
    };
  }

  return null;
}
