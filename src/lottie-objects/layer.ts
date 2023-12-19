import type { LottieAnimation } from "./animation";
import type { LottieShape } from "./shape";

export class LottieLayer {
  name: string;
  shapes: LottieShape[];
  animation?: LottieAnimation;
  constructor({ name = "default" }) {
    this.name = name;
    this.shapes = [];
    this.animation = undefined;
  }
  addShape(shape: LottieShape) {
    this.shapes.push(shape);
    shape.layer = this;
  }
  toJson() {
    return {
      ddd: 0,
      ty: 4, // shape layer
      ind: 0,
      st: 0,
      ip: this.animation?.firstFrame ?? 0,
      op: this.animation?.totalFrame ?? 60,
      nm: this.name,
      // can be omit
      ks: {
        a: {
          a: 0,
          k: [0, 0],
        },
        p: {
          a: 0,
          k: [0, 0],
        },
        s: {
          a: 0,
          k: [100, 100],
        },
        r: {
          a: 0,
          k: 0,
        },
        o: {
          a: 0,
          k: 100,
        },
      },
      shapes: this.shapes.map((e) => e.toJson()),
    };
  }
}
