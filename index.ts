import { dotLottie } from "./src/dotlottie";
import { attachInterceptor, detachInterceptor } from "./src/interceptor";
import { LottieAnimation } from "./src/lottie-objects/animation";
import { LottieLayer } from "./src/lottie-objects/layer";
import { LottieShape } from "./src/lottie-objects/shape";
import { LottieShapeBackground } from "./src/lottie-objects/shapes/background";
import { LottieShapeEllipse } from "./src/lottie-objects/shapes/ellipse";
import { LottieImageLayer } from "./src/lottie-objects/image";
import { LottieShapeLine } from "./src/lottie-objects/shapes/line";
import { LottieShapePath } from "./src/lottie-objects/shapes/path";
import { LottieShapeRect } from "./src/lottie-objects/shapes/rect";
import { LottieShapeTriangle } from "./src/lottie-objects/shapes/triangle";
import { LottieTextLayer } from "./src/lottie-objects/text";

const lottieClassTypeMap: Record<string, typeof LottieShape> = {
  ellipse: LottieShapeEllipse,
  rect: LottieShapeRect,
  background: LottieShapeBackground,
  line: LottieShapeLine,
  point: LottieShapeEllipse,
  circle: LottieShapeEllipse,
  square: LottieShapeRect,
  triangle: LottieShapeTriangle,
  bezier: LottieShapePath,
  curve: LottieShapePath,
  arc: LottieShapePath,
  endShape: LottieShapePath,
};

// captured types that are whole layers rather than shapes
const lottieLayerTypeMap: Record<string, typeof LottieTextLayer | typeof LottieImageLayer> = {
  text: LottieTextLayer,
  image: LottieImageLayer,
};

async function _saveLottie(
  this: any,
  duration: number,
  callback: (result: any, file: Blob) => void,
  options: {
    delay?: number;
    units?: "seconds" | "frames";
    minify?: boolean;
    format?: "json" | "dotlottie";
  } = {}
) {
  if (!callback) {
    throw TypeError("callback parameter must be provided");
  }
  if (typeof duration !== "number") {
    throw TypeError("Duration parameter must be a number");
  }

  const delay = (options && options.delay) || 0;
  const units = (options && options.units) || "seconds";

  if (typeof delay !== "number") {
    throw TypeError("Delay parameter must be a number");
  }
  if (units !== "seconds" && units !== "frames") {
    throw TypeError('Units parameter must be either "frames" or "seconds"');
  }
  const minify = options?.minify ?? true;
  const format = options?.format ?? "json";
  if (typeof minify !== "boolean") {
    throw TypeError("Minify parameter must be a boolean");
  }
  if (format !== "json" && format !== "dotlottie") {
    throw TypeError('Format parameter must be either "json" or "dotlottie"');
  }

  let frameRate = this._targetFrameRate;
  if (frameRate === Infinity || frameRate === undefined || frameRate === 0) {
    frameRate = 60;
  }

  const nFrames = units === "seconds" ? duration * frameRate : duration;
  const nFramesDelay = units === "seconds" ? delay * frameRate : delay;
  const totalNumberOfFrames = nFrames + nFramesDelay;

  let frameIterator = nFramesDelay;
  if (this._isGlobal) {
    (window as any).frameCount = frameIterator;
  } else {
    this.frameCount = frameIterator;
  }

  this._recording = true;
  this.noLoop();

  // Let the rest of setup() finish (and hidden canvases unhide) before redrawing.
  await Promise.resolve();

  attachInterceptor(this);
  let recordedData: Record<string, any>;
  try {
    while (frameIterator < totalNumberOfFrames) {
      this.redraw();
      frameIterator++;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    // Always restore the sketch's own draw functions and loop, even if draw() threw.
    recordedData = detachInterceptor(this);
    this._recording = false;
    this.loop();
  }

  const animation = new LottieAnimation({
    frameRate,
    totalFrame: nFrames,
    width: this.width,
    height: this.height,
  });

  for (const [key, value] of Object.entries(recordedData)) {
    if (value.type === "text" && value.frames.some((e: any) => e.stroke)) {
      // stroke layer first: layers added earlier paint underneath
      animation.addLayer(new LottieTextLayer({ name: `${key}_stroke`, args: value.frames, paint: "stroke" }));
      animation.addLayer(new LottieTextLayer({ name: key, args: value.frames, paint: "fill" }));
      continue;
    }
    const LayerClass = lottieLayerTypeMap[value.type];
    if (LayerClass) {
      animation.addLayer(new LayerClass({ name: key, args: value.frames }));
      continue;
    }
    const layer = new LottieLayer({});
    animation.addLayer(layer);
    layer.addShape(
      new lottieClassTypeMap[value.type]({
        name: key,
        args: value.frames,
      })
    );
  }

  const json = animation.toJson();
  const text = minify ? JSON.stringify(json) : JSON.stringify(json, null, 2);
  const file =
    format === "dotlottie"
      ? await dotLottie(text)
      : new Blob([text], { type: "application/json" });
  callback(json, file);
}

if ((window as any).p5) {
  (window as any).p5.prototype.saveLottie = _saveLottie;
}
