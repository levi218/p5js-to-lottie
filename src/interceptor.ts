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
  const context = p5Instance._isGlobal ? window : p5Instance;

  const interceptFuncMap: Record<string, (context: any, args: any) => object> = {
    ellipse: (context, args) => ({
      params: args,
      fill: context.drawingContext.fillStyle,
    }),
    rect: (context, args) => ({
      params: args,
      fill: context.drawingContext.fillStyle,
    }),
    background: (context, args) => ({
      params: context.color(...args).toString("#rrggbb"),
    }),
  };

  for (const [key, value] of Object.entries(interceptFuncMap)) {
    originalFunctions[key] = context[key];
    context[key] = function () {
      markInitFrame(context);

      // tracking for ellipse
      if (!objects[`${key}${objectCounter}`])
        objects[`${key}${objectCounter}`] = {
          type: key,
          frames: [],
        };
      objects[`${key}${objectCounter}`].frames.push({
        frame: lottieFrameCount,
        ...value(context, arguments)
      });
      objectCounter++;

      // Now, call the original method
      return originalFunctions[key].apply(this, arguments);
    };
  }
}

export function detachInterceptor(p5Instance: any) {
  console.log("detaching interceptor...", p5Instance);
  const context = p5Instance._isGlobal ? window : p5Instance;
  for (const [key, value] of Object.entries(originalFunctions)) {
    context[key] = value;
  }

  originalFunctions = {};
  const _objects = objects;
  objects = {};
  return _objects;
}
