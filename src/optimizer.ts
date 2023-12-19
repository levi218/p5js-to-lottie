var fitCurve = require("fit-curve");

type TimeFrame =
  | {
      type: "curve";
      startPoint: {
        t: number;
        x: number[];
      };
      endPoint: {
        t: number;
        x: number[];
      };
      p1: {
        t: number[];
        x: number[];
      };
      p2: {
        t: number[];
        x: number[];
      };
    }
  | {
      type: "point";
      startPoint: {
        t: number;
        x: number[];
      };
    };
export interface OptimizerOptions {
  roundDegree?: number;
  transformOnly?: boolean;
}
export class Optimizer {
  roundDegree: number;
  transformOnly: boolean;

  constructor({ roundDegree, transformOnly }: OptimizerOptions = {}) {
    this.roundDegree = roundDegree ?? 2;
    this.transformOnly = transformOnly ?? false;
  }
  round(num: number) {
    return (
      Math.round((num + Number.EPSILON) * 10 ** this.roundDegree) /
      10 ** this.roundDegree
    );
  }
  segregate(input: number[][]) {
    const segments: { points: number[][]; startTime?: number }[] = [];
    let lastSegEnd = 0;
    // manually split input into segments
    // the fit-curve lib is for aligning the points to a continuous curve
    // so too many sharp turns will decrease the result quality
    for (let frameIndex = 1; frameIndex < input.length; frameIndex++) {
      if (
        frameIndex === input.length - 1 ||
        input[frameIndex].some(
          (_, axisIndex) =>
            Math.sign(
              input[frameIndex - 1][axisIndex] - input[frameIndex][axisIndex]
            ) *
              Math.sign(
                input[frameIndex][axisIndex] - input[frameIndex + 1][axisIndex]
              ) <
            0
        )
      ) {
        // extremum
        segments.push({
          points: input.slice(lastSegEnd, frameIndex + 1),
        });
        lastSegEnd = frameIndex;
      }
    }
    return segments;
  }
  reformAxis(input: number[][]) {
    const numberOfAxis = input?.[0]?.length ?? 0;
    return Array(numberOfAxis)
      .fill(0)
      .map((_, axisIndex) => input.map((e) => e[axisIndex]));
  }
  optimizeSegment(points: number[], baseTime = 0) {
    const error = 1; // The smaller the number - the much closer spline should be

    var bezierCurves = fitCurve(
      points.map((e, i) => [i, e]),
      error
    );
    // console.log("bezierCurves", bezierCurves);
    const arr = bezierCurves.map((segment: number[][]) => {
      const startPoint = {
        t: segment[0][0] + baseTime,
        x: segment[0][1],
      };
      const p1 = {
        t: (segment[1][0] - segment[0][0]) / (segment[3][0] - segment[0][0]),
        x:
          (segment[1][1] - Math.min(segment[0][1], segment[3][1])) /
          (segment[3][1] - segment[0][1]),
      };
      if (Number.isNaN(p1.x)) {
        p1.x = p1.t;
      }
      if (p1.x < 0) {
        p1.x += 1;
      }

      const p2 = {
        t: (segment[2][0] - segment[0][0]) / (segment[3][0] - segment[0][0]),
        x:
          (segment[2][1] - Math.min(segment[0][1], segment[3][1])) /
          (segment[3][1] - segment[0][1]),
      };
      if (Number.isNaN(p2.x)) {
        p2.x = p2.t;
      }
      if (p2.x < 0) {
        p2.x += 1;
      }

      const endPoint = {
        t: segment[3][0] + baseTime,
        x: segment[3][1],
      };
      return {
        startPoint,
        endPoint,
        p1,
        p2,
      };
    });
    return arr;
  }
  process(input: number[][]) {
    const segments = this.segregate(input);
    let baseTime = 0;
    const timeFrames: TimeFrame[] = [];
    for (const segment of segments) {
      segment.startTime = baseTime;

      const curves = this.reformAxis(segment.points).map((e) => {
        return this.optimizeSegment(e, baseTime);
      });
      if (!this.transformOnly && curves.every((e) => e.length === 1)) {
        // combine axes
        const timeFrame = {
          type: "curve" as const,
          startPoint: {
            t: curves[0][0].startPoint.t,
            x: curves.map((e) => e[0].startPoint.x),
          },
          endPoint: {
            t: curves[0][0].endPoint.t,
            x: curves.map((e) => e[0].endPoint.x),
          },
          p1: {
            t: curves.map((e) => e[0].p1.t),
            x: curves.map((e) => e[0].p1.x),
          },
          p2: {
            t: curves.map((e) => e[0].p2.t),
            x: curves.map((e) => e[0].p2.x),
          },
        };
        timeFrames.push(timeFrame);
        baseTime += segment.points.length;
        continue;
      }
      // not optimizable -> each as a timeframe
      segment.points.forEach((pointSet, i) => {
        timeFrames.push({
          type: "point" as const,
          startPoint: {
            t: baseTime + i,
            x: pointSet,
          },
        });
      });
      baseTime += segment.points.length;
    }
    return this.toAnimation(timeFrames);
  }

  toAnimation(timeFrames: TimeFrame[]) {
    const that = this;
    console.log(timeFrames);
    return timeFrames.flatMap((frame, index) => {
      const arr = [];
      if (frame.type === "curve") {
        arr.push({
          t: that.round(frame.startPoint.t),
          s: frame.startPoint.x.map((e) => that.round(e)), // start position value
          h: 0,
          o: {
            x: frame.p1.t.map((e) => that.round(e)),
            y: frame.p1.x.map((e) => that.round(e)),
          },
          i: {
            x: frame.p2.t.map((e) => that.round(e)),
            y: frame.p2.x.map((e) => that.round(e)),
          },
        });
      } else {
        arr.push({
          t: that.round(frame.startPoint.t),
          s: frame.startPoint.x.map((e) => that.round(e)), // start position value
          h: 0,
          o: {
            x: [0, 0],
            y: [0, 0],
          },
          i: {
            x: [1, 1],
            y: [1, 1],
          },
        });
      }
      if (index === timeFrames.length - 1 && frame.type === "curve") {
        arr.push({
          t: that.round(frame.endPoint.t),
          s: frame.endPoint.x.map((e) => that.round(e)), // start position value
        });
      }
      return arr;
    });
  }
}

// const output = {
//   nm: "Bouncy Ball",
//   v: "5.5.2",
//   fr: 30,
//   ip: 0,
//   op: 1200,
//   w: 512,
//   h: 512,
//   ddd: 0,
//   assets: [],
//   comps: [],
//   markers: [],
//   layers: [
//     {
//       nm: "Layer",
//       ddd: 0,
//       hd: false,
//       ind: 0,
//       ip: 0,
//       op: 1200,
//       st: 0,
//       ks: {
//         a: {
//           a: 0,
//           k: [0, 0],
//         },
//         p: {
//           a: 0,
//           k: [0, 0],
//         },
//         r: {
//           a: 0,
//           k: 0,
//         },
//         s: {
//           a: 0,
//           k: [100, 100],
//         },
//         o: {
//           a: 0,
//           k: 100,
//         },
//       },
//       ao: 0,
//       td: 0,
//       hasMask: false,
//       masksProperties: [],
//       ef: [],
//       mb: false,
//       sy: [],
//       cp: false,
//       ct: 0,
//       ty: 4,
//       shapes: [
//         {
//           nm: "Ellipse Group",
//           hd: false,
//           ty: "gr",
//           it: [
//             {
//               nm: "Ellipse",
//               hd: false,
//               ty: "el",
//               p: {
//                 a: 0,
//                 k: [0, 0],
//               },
//               s: {
//                 a: 0,
//                 k: [30, 30],
//               },
//             },
//             {
//               nm: "Fill",
//               hd: false,
//               ty: "fl",
//               o: {
//                 a: 0,
//                 k: 100,
//               },
//               c: {
//                 a: 0,
//                 k: [0.71, 0.192, 0.278],
//               },
//               r: 1,
//             },
//             {
//               hd: false,
//               ty: "tr",
//               a: {
//                 a: 0,
//                 k: [0, 0],
//               },
//               p: {
//                 a: 1,
//                 k: new Optimizer().process(points.map((e) => [0, e])),
//               },
//               o: {
//                 a: 0,
//                 k: 100,
//               },
//             },
//           ],
//         },
//       ],
//     },
//   ],
// };

// console.log(JSON.stringify(output));
