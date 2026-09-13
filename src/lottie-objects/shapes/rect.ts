import { animatedProperty } from "../../optimizer";
import { styleItems, transformItem } from "../items";
import { LottieShape } from "../shape";

export class LottieShapeRect extends LottieShape {
  name: string;
  args: any[];

  constructor({ name = "default", args = [] }) {
    super({});
    this.name = name;
    this.args = args;
  }

  toJson() {
    // params arrive normalized as a corner box: [x, y, w, h]
    return {
      ty: "gr",
      nm: "Rectangle Group",
      it: [
        {
          ty: "rc",
          nm: "Rectangle",
          p: { a: 0, k: [0, 0] },
          s: animatedProperty(this.args.map((e) => [e.params[2], e.params[3]])),
          r: animatedProperty(this.args.map((e) => [e.radius ?? 0])),
        },
        ...styleItems(this.args, undefined, (e, x, y) => [
          x - e.params[0] - e.params[2] / 2,
          y - e.params[1] - e.params[3] / 2,
        ]),
        transformItem(this.args, (e) => [
          e.params[0] + e.params[2] / 2,
          e.params[1] + e.params[3] / 2,
        ]),
      ],
    };
  }
}
