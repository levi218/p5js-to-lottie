import type { LottieLayer } from "./layer";

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
    const unique = <T>(items: T[], key: (item: T) => string) => [
      ...new Map(items.map((item) => [key(item), item])).values(),
    ];
    return {
      assets: unique(this.layers.flatMap((e) => e.assets), (e: any) => e.id),
      fonts: { list: unique(this.layers.flatMap((e) => e.fonts), (e) => e.fName) },
      // glyph objects are cached per character + font, so identity dedupes them
      chars: [...new Set(this.layers.flatMap((e) => e.chars))],
      nm: this.name,
      v: this.version,
      ip: this.firstFrame,
      op: this.totalFrame,
      fr: this.frameRate,
      w: this.width,
      h: this.height,
      layers: this.layers.map((e,i) => e.toJson(i)).reverse(),
    };
  }
}
