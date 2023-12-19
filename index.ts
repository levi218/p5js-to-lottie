import { attachInterceptor, detachInterceptor } from "./src/interceptor";
import {
  LottieAnimation,
  LottieLayer,
  LottieShapeEllipse,
  LottieShapeRect,
} from "./src/lottieClasses";

async function _saveLottie(
  this: any,
  duration: number,
  callback: (result: any) => void,
  options = {
    delay: 0,
    units: "seconds",
  }
) {
  // validate parameters
  if (!callback) {
    throw TypeError("callback parameter must be provided");
  }
  if (typeof duration !== "number") {
    throw TypeError("Duration parameter must be a number");
  }

  // extract variables for more comfortable use
  const delay = (options && options.delay) || 0; // in seconds
  const units = (options && options.units) || "seconds"; // either 'seconds' or 'frames'

  // if arguments in the options object are not correct, cancel operation
  if (typeof delay !== "number") {
    throw TypeError("Delay parameter must be a number");
  }
  // if units is not seconds nor frames, throw error
  if (units !== "seconds" && units !== "frames") {
    throw TypeError('Units parameter must be either "frames" or "seconds"');
  }

  this._recording = true;

  // get the project's framerate
  let _frameRate = this._targetFrameRate;
  // if it is undefined or some non useful value, assume it's 60
  if (_frameRate === Infinity || _frameRate === undefined || _frameRate === 0) {
    _frameRate = 60;
  }

  // check the mode we are in and how many frames
  // that duration translates to
  const nFrames = units === "seconds" ? duration * _frameRate : duration;
  const nFramesDelay = units === "seconds" ? delay * _frameRate : delay;
  const totalNumberOfFrames = nFrames + nFramesDelay;

  // initialize variables for the frames processing
  let frameIterator = nFramesDelay;
  if (this._isGlobal) {
    (window as any).frameCount = frameIterator;
  } else {
    this.frameCount = frameIterator;
  }

  // We first take every frame that we are going to use for the animation
  //   let frames = [];

  // stop the loop since we are going to manually redraw
  this.noLoop();

  // Defer execution until the rest of the call stack finishes, allowing the
  // rest of `setup` to be called (and, importantly, canvases hidden in setup
  // to be unhidden.)
  //
  // Waiting on this empty promise means we'll continue as soon as setup
  // finishes without waiting for another frame.
  await Promise.resolve();

  // attach interceptor
  attachInterceptor(this);
  while (frameIterator < totalNumberOfFrames) {
    /*
        we draw the next frame. this is important, since
        busy sketches or low end devices might take longer
        to render some frames. So we just wait for the frame
        to be drawn and immediately save it to a buffer and continue
      */
    this.redraw();
    // TODO: capture everything in this redraw cycle

    // depending on the context we'll extract the pixels one way
    // or another
    // let data = this.drawingContext.getImageData(
    //   0,
    //   0,
    //   this.width,
    //   this.height
    // ).data;

    // frames.push(data);
    frameIterator++;

    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  const recordedData = detachInterceptor(this);
  console.log(recordedData);

  const animation = new LottieAnimation({ frameRate: 60, totalFrame: nFrames });
  const layer = new LottieLayer({});
  animation.addLayer(layer);

  // TODO: wait 2 secs then use the sample object from
  for (const [key, value] of Object.entries(recordedData)) {
    console.log(value);
    switch (value.type) {
      case "ellipse":
        {
          const shape = new LottieShapeEllipse({
            name: key,
            args: value.frames,
          });
          layer.addShape(shape);
        }
        break;
      case "rect":
        {
          const shape = new LottieShapeRect({
            name: key,
            args: value.frames,
          });
          layer.addShape(shape);
        }
        break;
      default:
        break;
    }
  }

  console.log(animation.toJson());
  callback(animation.toJson());
  this._recording = false;
  this.loop();
}

if ((window as any).p5) {
  (window as any).p5.prototype.saveLottie = _saveLottie;
}
