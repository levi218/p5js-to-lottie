let originalFunctions: Record<string, Function> = {};
let objects: Record<string, any> = {};
let lastFrame = 0;
let objectCounter = 0;
let lottieFrameCount = 0; // this.frameCount is bugged after the first redraw() call

function markInitFrame(p5Instance: any) {
  if (p5Instance.frameCount !== lastFrame) {
    lottieFrameCount++;
    // reset object counter -> kind of like how react rehydrate hooks
    objectCounter = 0;
    // mark that we already init frame
    lastFrame = p5Instance.frameCount;
  }
}

export function attachInterceptor(p5Instance: any) {
  console.log("attaching interceptor...", p5Instance);
  objects = {};
  lottieFrameCount = 0;

  originalFunctions["_renderEllipse"] = p5Instance._renderEllipse;
  p5Instance._renderEllipse = function () {
    markInitFrame(this);

    // tracking for ellipse
    if (!objects[`ellipse${objectCounter}`])
      objects[`ellipse${objectCounter}`] = {
        type: "ellipse",
        frames: [],
      };
    objects[`ellipse${objectCounter}`].frames.push({
      frame: lottieFrameCount,
      params: arguments,
      fill: this.drawingContext.fillStyle,
    });
    objectCounter++;

    // Now, call the original method
    return originalFunctions["_renderEllipse"].apply(this, arguments);
  };

  originalFunctions["_renderRect"] = p5Instance._renderRect;
  p5Instance._renderRect = function () {
    markInitFrame(this);

    // tracking for rect
    if (!objects[`rect${objectCounter}`])
      objects[`rect${objectCounter}`] = {
        type: "rect",
        frames: [],
      };
    objects[`rect${objectCounter}`].frames.push({
      frame: lottieFrameCount,
      params: arguments,
      fill: this.drawingContext.fillStyle,
    });
    objectCounter++;

    // Now, call the original method
    return originalFunctions["_renderRect"].apply(this, arguments);
  };
}

export function detachInterceptor(p5Instance: any) {
  console.log("detaching interceptor...", p5Instance);
  for (const [key, value] of Object.entries(originalFunctions)) {
    p5Instance[key] = value;
  }

  originalFunctions = {};
  const _objects = objects;
  objects = {};
  return _objects;
}
