import { hexToRgb } from "../utils/hexToRgb";

export class LottieAnimation {
  name: string;
  version: string;
  frameRate: number;
  totalFrame: number;
  firstFrame: number;
  width: number;
  height: number;
  layers: LottieLayer[];

  constructor({
    name = "default",
    version = "5.5.2",
    frameRate = 60,
    totalFrame = 240,
    firstFrame = 0,
    width = 400,
    height = 400,
  }) {
    this.name = name;
    this.version = version;
    this.frameRate = frameRate;
    this.totalFrame = totalFrame;
    this.firstFrame = firstFrame;
    this.width = width;
    this.height = height;
    this.layers = [];
  }

  addLayer(layer: LottieLayer) {
    this.layers.push(layer);
    layer.animation = this;
  }
  toJson() {
    return {
      nm: this.name,
      v: this.version,
      ip: this.firstFrame,
      op: this.totalFrame,
      fr: this.frameRate,
      w: this.width,
      h: this.height,
      layers: this.layers.map((e) => e.toJson()),
    };
  }
}

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

export class LottieShape {
  layer?: LottieLayer;
  toJson(): object {
    return {
      ty: "gr",
      nm: "Empty Shape Group",
      it: [],
    };
  }
}
export class LottieShapeEllipse extends LottieShape {
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
      nm: "Ellipse Group",
      it: [
        // shape definition
        {
          ty: "el",
          nm: "Ellipse",
          // position
          p: {
            a: 0,
            k: [0, 0],
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
            k: [
              ...this.args.map((e, i) => ({
                t: Math.round(e.frame),
                s: [e.params[0], e.params[1]],
                h: 0,
                o: {
                  x: [0, 0],
                  y: [0, 0],
                },
                i: {
                  x: [1, 1],
                  y: [1, 1],
                },
              })),
            ],
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
            k: [
              ...this.args.map((e, i) => ({
                t: Math.round(e.frame),
                s: [e.params[0], e.params[1]],
                h: 0,
                o: {
                  x: [0, 0],
                  y: [0, 0],
                },
                i: {
                  x: [1, 1],
                  y: [1, 1],
                },
              })),
            ],
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
