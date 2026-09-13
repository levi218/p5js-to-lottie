import type { BezierPath } from "../../path";
import {
  holdProperty,
  identityTransformItem,
  round,
  styleItems,
  transformItem,
  type ToLocal,
} from "../items";
import { LottieShape } from "../shape";

// Center of the path's bounding box. The group pivots here, so the path data
// only changes when the shape does, not when it merely moves.
function pivotOf(frame: { path: BezierPath }): [number, number] {
  const xs = frame.path.v.map((p) => p[0]);
  const ys = frame.path.v.map((p) => p[1]);
  return [
    (Math.min(...xs) + Math.max(...xs)) / 2,
    (Math.min(...ys) + Math.max(...ys)) / 2,
  ];
}

const toLocal: ToLocal = (frame, x, y) => {
  const [px, py] = pivotOf(frame);
  return [x - px, y - py];
};

function bezierItem(name: string, frames: any[], pathOf: (frame: any) => BezierPath) {
  return {
    ty: "sh",
    nm: name,
    ks: holdProperty(frames, (frame) => {
      const [px, py] = pivotOf(frame);
      const { v, i, o, c } = pathOf(frame);
      const r = ([x, y]: number[]) => [round(x), round(y)];
      return { i: i.map(r), o: o.map(r), v: v.map(([x, y]) => r([x - px, y - py])), c };
    }),
  };
}

// bezier(), curve(), arc() and beginShape()/endShape(): params arrive as a
// Lottie bezier path in p5 user space.
export class LottieShapePath extends LottieShape {
  name: string;
  args: any[];

  constructor({ name = "default", args = [] }) {
    super({});
    this.name = name;
    this.args = args;
  }

  toJson() {
    const style = styleItems(this.args, undefined, toLocal);
    const transform = transformItem(this.args, pivotOf);
    if (!this.args[0].strokePath) {
      return {
        ty: "gr",
        nm: "Path Group",
        it: [bezierItem("Path", this.args, (e) => e.path), ...style, transform],
      };
    }
    // arc(): the stroked outline and the filled wedge are different paths
    const isStroke = (item: any) => item.ty === "st" || item.ty === "gs";
    return {
      ty: "gr",
      nm: "Arc Group",
      it: [
        {
          ty: "gr",
          nm: "Outline",
          it: [
            bezierItem("Outline", this.args, (e) => e.strokePath),
            ...style.filter(isStroke),
            identityTransformItem,
          ],
        },
        {
          ty: "gr",
          nm: "Wedge",
          it: [
            bezierItem("Wedge", this.args, (e) => e.path),
            ...style.filter((item) => !isStroke(item)),
            identityTransformItem,
          ],
        },
        transform,
      ],
    };
  }
}
