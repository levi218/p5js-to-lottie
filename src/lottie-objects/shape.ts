import type { LottieLayer } from "./layer";

export class LottieShape {
  constructor({}) {}
  layer?: LottieLayer;
  toJson(): object {
    return {
      ty: "gr",
      nm: "Empty Shape Group",
      it: [],
    };
  }
}
