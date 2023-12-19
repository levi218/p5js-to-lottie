import { LottieShape } from "../shape";
import { hexToRgb } from "../../../utils/hexToRgb";
import { Optimizer } from "../../optimizer";

export class LottieShapeRect extends LottieShape {
  name: string;
  args: any[];

  constructor({ name = "default", args = [] }) {
    super();
    this.name = name;
    this.args = args;
  }
  toJson() {
    // ellipse(x, y, w, [h])
    const color = hexToRgb(this.args[0].fill);
    return {
      ty: "gr",
      nm: "Rectangle Group",
      it: [
        // shape definition
        {
          ty: "rc",
          nm: "Rectangle",
          // position
          p: {
            a: 0,
            k: [
              // 0, 0,
              this.args[0].params[2] / 2,
              (this.args[0].params[3] ?? this.args[0].params[2]) / 2,
            ],
          },
          // size
          s: {
            a: 0,
            k: [
              // 50, 50,
              this.args[0].params[2],
              this.args[0].params[3] ?? this.args[0].params[2],
            ], // take width, height of first frame
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
        // transform definition
        {
          ty: "tr",
          a: {
            a: 0,
            k: [0, 0],
          },
          // position
          p: {
            a: 1,
            k: new Optimizer().process(
              this.args.map((e) => [e.params[0], e.params[1]])
            ),
            // k: [
            //   ...this.args.map((e, i) => ({
            //     t: Math.round(e.frame),
            //     s: [e.params[0], e.params[1]],
            //     h: 0,
            //     o: {
            //       x: [0, 0],
            //       y: [0, 0],
            //     },
            //     i: {
            //       x: [1, 1],
            //       y: [1, 1],
            //     },
            //   })),
            // ],
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
