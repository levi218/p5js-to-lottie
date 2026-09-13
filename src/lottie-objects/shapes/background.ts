import { holdProperty, identityTransformItem, rgb } from "../items";
import { LottieShape } from "../shape";

export class LottieShapeBackground extends LottieShape {
  name: string;
  args: any[];

  constructor({ name = "default", args = [] }) {
    super({});
    this.name = name;
    this.args = args;
  }

  toJson() {
    const width = this.layer?.animation?.width ?? 0;
    const height = this.layer?.animation?.height ?? 0;
    return {
      ty: "gr",
      nm: "Background Group",
      it: [
        {
          ty: "rc",
          nm: "Background",
          p: { a: 0, k: [width / 2, height / 2] },
          s: { a: 0, k: [width, height] },
          r: { a: 0, k: 0 },
        },
        {
          ty: "fl",
          nm: "Fill",
          o: { a: 0, k: 100 },
          c: holdProperty(this.args, (e) => rgb(e.params) ?? [0, 0, 0]),
          r: 1,
        },
        identityTransformItem,
      ],
    };
  }
}
