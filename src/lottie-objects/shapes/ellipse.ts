import { animatedProperty } from "../../optimizer";
import { styleItems, transformItem } from "../items";
import { LottieShape } from "../shape";

export class LottieShapeEllipse extends LottieShape {
  name: string;
  args: any[];

  constructor({ name = "default", args = [] }) {
    super({});
    this.name = name;
    this.args = args;
  }

  toJson() {
    // params arrive normalized as [centerX, centerY, w, h]
    return {
      ty: "gr",
      nm: "Ellipse Group",
      it: [
        {
          ty: "el",
          nm: "Ellipse",
          p: { a: 0, k: [0, 0] },
          s: animatedProperty(this.args.map((e) => [e.params[2], e.params[3]])),
        },
        ...styleItems(this.args, undefined, (e, x, y) => [x - e.params[0], y - e.params[1]]),
        transformItem(this.args, (e) => [e.params[0], e.params[1]]),
      ],
    };
  }
}
