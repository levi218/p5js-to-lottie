import { transformItem } from "./items";
import { LottieLayer } from "./layer";

// image() as a Lottie image layer over an embedded data-URL asset.
// ponytail: one asset per layer (the first frame's); a slot that swaps images
// mid-clip keeps showing the first one.
export class LottieImageLayer extends LottieLayer {
  args: any[];

  constructor({ name = "default", args = [] as any[] }) {
    super({ name });
    this.args = args;
  }

  get assets() {
    return [this.args[0].asset];
  }

  toJson(index?: number) {
    const { shapes, ...layer } = super.toJson(index);
    const asset = this.args[0].asset;
    // params: [dx, dy, dw, dh]; pivot on the drawn center, anchored at the
    // asset's center, stretched from asset pixels to the drawn size
    const { ty, ...ks } = transformItem(
      this.args,
      (e) => [e.params[0] + e.params[2] / 2, e.params[1] + e.params[3] / 2],
      (e) => [e.params[2] / asset.w, e.params[3] / asset.h]
    );
    return {
      ...layer,
      ty: 2,
      refId: asset.id,
      ks: { ...ks, a: { a: 0, k: [asset.w / 2, asset.h / 2] } },
    };
  }
}
