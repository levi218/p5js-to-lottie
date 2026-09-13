# p5js-to-lottie

[![Live demo](https://img.shields.io/badge/demo-live-6be18a)](https://levi218.github.io/p5js-to-lottie/)
[![npm version](https://img.shields.io/npm/v/p5js-to-lottie)](https://www.npmjs.com/package/p5js-to-lottie)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

> Record a p5.js sketch straight to a Lottie animation — no screen recorder, no dedicated animation tool.

**[View the live demo →](https://levi218.github.io/p5js-to-lottie/)**

`p5js-to-lottie` hooks into your existing p5.js sketch and exports it as a Lottie JSON (or [dotLottie](https://dotlottie.io/spec/2.0/)) file — small, scalable, and playable anywhere lottie-web runs.

There's also a companion VS Code extension that previews your p5.js sketches and their exported Lottie animations side by side: [P5.js to Lottie on the Marketplace](https://marketplace.visualstudio.com/items?itemName=levi218.p5js-to-lottie).

### Motivation

- **Current Limitations**: P5.js currently only supports generating GIFs from sketches.
- **File Size**: GIFs are large, while Lottie files are small and efficient.
- **Developer-Friendly**: Lottie animations are typically created with dedicated animation tools, but as a developer, I prefer coding my animations.
- **Enhanced Workflow**: This extension streamlines the process of converting and previewing animations directly within your development environment.

## Getting started.

Import the lib bundle after importing p5.js bundle

```
<head>
...
    <script src="https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/p5.js"></script>
    
    <script src="https://unpkg.com/p5js-to-lottie@0.0.2/dist/bundle.js"></script>
    <!-- OR -->
    <script src="https://cdn.jsdelivr.net/npm/p5js-to-lottie@0.0.2/dist/bundle.js"></script>

...
</head>
```

Import the sketch and work on it like you normally do

```
# index.html

<script src="sketch.js"></script>
```
```
# sketch.js

let circX = 200;
let circY = 200;
let diam = 50;
let speedX = 5;
let speedY = 7;
function initVar() {
  circX = 200;
  circY = 200;
  diam = 50;
  speedX = 5;
  speedY = 7;
}
function setup() {
  createCanvas(400, 400);
  noStroke();
  initVar();
}

function draw() {
  clear();

  // draw the circle on the screen
  fill(245, 10, 20);
  ellipse(circX, circY, diam);

  // increment the x and y with their respective speeds
  circX = circX + speedX;
  circY = circY + speedY;

  // if the circle goes off the left or right sides of the screen, turn it around
  if (circX + diam / 2 > width || circX - diam / 2 <= 0) {
    speedX = speedX * -1;
  }

  // if the circle goes off the top or bottom sides of the screen, turn it around
  if (circY + diam / 2 > width || circY - diam / 2 <= 0) {
    speedY = speedY * -1;
  }
}
```

Add a button to save and download the Lottie file
```
# index.html

<button onclick="startRecord()">Record</button>
```
```
# sketch.js

function startRecord() {
  initVar();
  window.saveLottie(5, (animation) => {
    const player = document.querySelector("lottie-player");
    player.load(JSON.stringify(animation));
  });
}
```

## Examples.

For examples, check the `example/` folder. `example/transform` covers translate()/rotate()/scale()/push()/pop(); `example/curve`, `example/text`, `example/image` and `example/gradient` cover the rest.

For a richer demo — a solar system with seven gradient-shaded planets, Saturn's rings, a comet, text labels and an image starfield (`example/solar-system/scene.js`), with the live sketch and its exported Lottie side by side — open `landing/index.html` (run `yarn start` first so `dist/bundle.js` exists).

## API

```
saveLottie(duration, callback, { delay = 0, units = "seconds", minify = true, format = "json" })
```

- `duration` — how much of the sketch to record, in `units` (`"seconds"` or `"frames"`).
- `callback(animation, file)` — receives the Lottie JSON object and the serialized file as a `Blob`.
- `delay` — frames/seconds to skip before recording starts.
- `minify` — strip whitespace and line endings from the file; `false` pretty-prints it.
- `format` — `"json"` for a plain `.json` file, `"dotlottie"` for a [dotLottie 2.0](https://dotlottie.io/spec/2.0/) `.lottie` zip (smaller still).

The sketch is re-run frame by frame (it doesn't need to play in real time), and the output uses the sketch's canvas size and `frameRate()`. The sketch's own draw functions and loop are restored afterwards, even if `draw()` throws.

## Supported p5.js API

### 2D primitives
- [X] ellipse()
- [X] circle()
- [X] line()
- [X] point()
- [X] rect() — including a single corner radius
- [X] square()
- [X] triangle()
- [X] arc() — `OPEN`, `CHORD`, `PIE` and the default mode

### Curves & vertex shapes
- [X] bezier()
- [X] curve() / curveTightness()
- [X] beginShape() / endShape(CLOSE) with vertex(), bezierVertex(), quadraticVertex(), curveVertex()

### Typography
- [X] text() — as Lottie text layers, including textSize(), textAlign() (both axes), textLeading(), wrapped box text, and text that changes over time

### Image
- [X] image() — embedded as data-URL assets, including resizing, cropping, imageMode() and tint()

### 2D transformation & utilities
- [X] rotate() — `RADIANS` and `DEGREES`
- [X] scale()
- [X] translate()
- [X] push() / pop()
- [X] rectMode() / ellipseMode() — `CORNER`, `CORNERS`, `CENTER`, `RADIUS`

### Color settings
- [X] background()
- [X] fill() / noFill()
- [X] stroke() / noStroke()
- [X] strokeWeight(), strokeCap(), strokeJoin()
- [X] alpha (e.g. `fill(0, 128)`)
- [X] gradients — `drawingContext.createLinearGradient()` / `createRadialGradient()` assigned to `drawingContext.fillStyle` or `strokeStyle`

Position, rotation, scale and size are exported as animated properties (curve-fitted, or static when they never change); colors, opacity, stroke width, paths and text content switch as hold keyframes when they change.

Gradients are plain canvas gradients:

```
push(); // p5 caches its last fill(), so restore it with pop() afterwards
const g = drawingContext.createRadialGradient(200, 200, 0, 200, 200, 50);
g.addColorStop(0, "#fffbe0");
g.addColorStop(1, "#ff7b00");
drawingContext.fillStyle = g;
circle(200, 200, 100);
pop();
```

### Not supported yet
- `quad()`, `beginShape(POINTS | LINES | TRIANGLES | ...)`, `beginContour()`, `WEBGL`, `blendMode()`/`erase()`, `drawingContext` patterns.
- Text glyphs are embedded as outlines traced from the browser's rendering of the font (Lottie players draw text from glyph shapes), so they're a close approximation rather than the font's exact curves, and letters are laid out without kerning.
- An image's pixels are read the first time it's drawn, so a `p5.Graphics` that keeps being redrawn exports its first state. Cross-origin images that can't be read back are skipped.
- A radial gradient's focal offset (different start and end circle centers) is dropped; gradient type and stop count are taken from the first frame that uses one.
- Shapes are matched across frames by draw order per shape type, so a sketch should draw the same shapes in the same order every frame. A shape that only appears partway through is visible for the whole clip.
- A `rotate()` sandwiched between two non-uniform `scale()` calls produces shear, which isn't representable.

## Build

```
yarn build        # minified dist/bundle.js
yarn dev          # unminified watch build + static server
```

## Run tests

The tests are written using playwright.

For each example, a GIF (via p5's own `saveGif`) and a Lottie are exported and their frames compared pixel by pixel. The diff is measured against the drawn content rather than the whole canvas, so a few misplaced shapes can't hide behind a mostly-empty background: a frame fails when it's off by at least 5% of the drawn pixels and at least 100 pixels (the floor absorbs the anti-aliasing speckle that canvas and lottie-web leave on very thin or tiny shapes; a 2px shift of anything larger than a dot costs hundreds). Both exports wait for the sketch to have drawn at least once, since p5 carries fill/stroke over from the previous frame. `tests/unit.spec.ts` covers the color parsing, matrix math and keyframe timeline directly.

```
yarn playwright-install
npm test
```
