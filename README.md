# p5js-to-lottie

> Save p5js sketch as a Lottie file

Convert your favorite creative coding library to your favorite animation format. 

I also created a Visual Studio Code extension, leveraging the `p5js-to-lottie` library to enable direct preview of your P5.js sketches and Lottie animations within VS Code. You can find it on the Marketplace: [P5.js to Lottie](https://marketplace.visualstudio.com/items?itemName=levi218.p5js-to-lottie).

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

For examples, check the `example/` folder.

## TODO

The first checkpoint is to support frequently used 2D primitives, 2D transformations and color settings

### 2D primitives
- [X] ellipse()
- [ ] circle()
- [ ] line()
- [ ] point()
- [X] rect()
- [ ] square()
- [ ] triangle()

### 2D transformation & utilities
- [ ] rotate()
- [ ] scale()
- [ ] translate()

### Color settings
- [X] background()
- [ ] fill()
- [ ] noFill()
- [ ] noStroke()
- [ ] stroke()
  
## Run tests

The tests are written using playwright

For each test, a gif file and a lottie file will be export and then their respective frames will be compared 

```
npm test
```
