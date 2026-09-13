import { parseColor } from "../../utils/color";
import { glyph } from "../glyphs";
import { holdKeyframes, holdProperty, rgb, round, transformItem } from "./items";
import { LottieLayer } from "./layer";

// "bold 24px Georgia" -> { style: "bold", size: 24, family: "Georgia" }
function parseFont(font: string) {
  const m = /^(.*?)\s*([\d.]+)px(?:\/\S+)?\s+(.+)$/.exec(font);
  if (!m) return { style: "normal", size: 12, family: "sans-serif" };
  return { style: m[1] || "normal", size: Number(m[2]), family: m[3] };
}

const fontName = (font: { style: string; family: string }) =>
  `${font.family}-${font.style}`.replace(/[^\w-]+/g, "_");

const JUSTIFY: Record<string, number> = { left: 0, start: 0, right: 1, end: 1, center: 2 };

// One text() line as a Lottie text layer anchored at its baseline, with its
// characters embedded as traced glyph outlines (see glyphs.ts).
// lottie-web always strokes text over its fill, while p5 fills over the
// stroke, so stroked text is split into a stroke-only layer under a
// fill-only one (`paint`).
export class LottieTextLayer extends LottieLayer {
  args: any[];
  paint: "fill" | "stroke" | "both";

  constructor({ name = "default", args = [] as any[], paint = "both" as "fill" | "stroke" | "both" }) {
    super({ name });
    this.args = args;
    this.paint = paint;
  }

  get chars() {
    return this.args.flatMap((e) => {
      const font = parseFont(e.font);
      return [...e.text].map((ch) => glyph(ch, font.family, font.style));
    });
  }

  get fonts() {
    return this.args.map((e) => {
      const font = parseFont(e.font);
      // origin 0 / fOrigin "n": a system font lottie-web can use right away
      // instead of polling for a web font to finish loading
      return {
        fName: fontName(font),
        fFamily: font.family,
        fStyle: font.style,
        ascent: 75,
        origin: 0,
        fOrigin: "n",
      };
    });
  }

  toJson(index?: number) {
    const { shapes, ...layer } = super.toJson(index);
    const { ty, ...ks } = transformItem(this.args, (e) => e.params);
    return {
      ...layer,
      ty: 5,
      ks: {
        ...ks,
        // lottie-web drops alpha from text colors; carry it as layer opacity
        o: holdProperty(this.args, (e) =>
          round((parseColor(this.paint === "stroke" ? e.stroke : e.fill ?? e.stroke)?.a ?? 0) * 100)
        ),
      },
      t: {
        d: {
          k: holdKeyframes(this.args, (e) => {
            const font = parseFont(e.font);
            const fill = this.paint !== "stroke" && rgb(e.fill);
            const stroke = this.paint !== "fill" && rgb(e.stroke);
            return {
              s: font.size,
              f: fontName(font),
              t: e.text,
              j: JUSTIFY[e.align] ?? 0,
              tr: 0,
              lh: round(font.size * 1.2),
              ls: 0,
              ...(fill && { fc: fill }),
              ...(stroke && { sc: stroke, sw: e.strokeWeight, of: false }),
            };
          }),
        },
        p: {},
        m: { g: 1, a: { a: 0, k: [0, 0] } },
        a: [],
      },
    };
  }
}
