// Global-mode wrapper around scene.js (shared with landing/index.html), so the
// solar system runs through the same GIF-vs-Lottie diff harness as the other examples.
let frame = 0;
let starfield;

function initVar() {
  frame = 0;
}

function setup() {
  createCanvas(400, 400);
  starfield = makeStarfield(window);
  initVar();
}

function draw() {
  drawSolarSystem(window, frame, starfield);
  frame++;
}

function startRecord() {
  initVar();
  window.saveLottie(4, (animation) => {
    const player = document.querySelector("lottie-player");
    player.load(JSON.stringify(animation));
  });
}
