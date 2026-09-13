import { applyMatrix } from "../../matrix";
import {
  identityTransformItem,
  matrixStrokeScale,
  matrixToLocal,
  pathItem,
  styleItems,
} from "../items";
import { LottieShape } from "../shape";

export class LottieShapeTriangle extends LottieShape {
  name: string;
  args: any[];

  constructor({ name = "default", args = [] }) {
    super({});
    this.name = name;
    this.args = args;
  }

  toJson() {
    return {
      ty: "gr",
      nm: "Triangle Group",
      it: [
        pathItem(
          "Triangle",
          this.args,
          (e) => [
            applyMatrix(e.matrix, e.params[0], e.params[1]),
            applyMatrix(e.matrix, e.params[2], e.params[3]),
            applyMatrix(e.matrix, e.params[4], e.params[5]),
          ],
          true
        ),
        ...styleItems(this.args, matrixStrokeScale, matrixToLocal),
        identityTransformItem,
      ],
    };
  }
}
