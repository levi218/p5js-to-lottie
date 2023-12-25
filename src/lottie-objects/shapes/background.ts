import { LottieShape } from "../shape";
import { hexToRgb } from "../../../utils/hexToRgb";
import { Optimizer } from "../../optimizer";

export class LottieShapeBackground extends LottieShape {
  name: string;
  args: any[];

  constructor({ name = "default", args = [] }) {
    super();
    this.name = name;
    console.log(args);
    this.args = args;
  }

  toJson() {
    // ellipse(x, y, w, [h])
    const width = this.layer?.animation?.width ?? 0;
    const height = this.layer?.animation?.height ?? 0;
    const color = hexToRgb(this.args[0].params);
    console.log(color, width, height);
    return {
      ty: "gr",
      nm: "Background Group",
      // ...index!==undefined ? {ind: index} : {},
      it: [
        // shape definition
        {
          ty: "rc",
          nm: "Background",
          // position
          p: {
            a: 0,
            k: [width / 2, height / 2],
          },
          // size
          s: {
            a: 0,
            k: [width, height],
          },
          r: {
            a: 0,
            k: 0,
          },
        },
        // fill definition
        {
          ty: "fl",
          nm: "Fill",
          o: {
            a: 0,
            k: 100,
          },
          c: {
            a: 0,
            k: [color?.r ?? 0, color?.g ?? 0, color?.b ?? 0],
          },
          r: 1,
        },
        {
          ty: "tr",
          a: {
            a: 0,
            k: [0, 0],
          },
          // position
          p: {
            a: 0,
            k: [0,0]
          },
          // scale
          s: { a: 0, k: [100, 100] },
          r: {
            a: 0,
            k: 0,
          },
          o: {
            a: 0,
            k: 100,
          },
        },
      ],
    };
  }
}
