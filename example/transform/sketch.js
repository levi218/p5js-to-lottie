// actual sketch
let angle = 0;
const cx = 200;
const cy = 200;
const orbitRadius = 120;

function initVar() {
  angle = 0;
}

function setup() {
  createCanvas(400, 400);
  noStroke();
  angleMode(RADIANS);
  rectMode(CORNER);
  initVar();
}

function draw() {
  clear();

  // a square spinning in place around its own center
  push();
  translate(cx, cy);
  rotate(angle);
  fill(245, 10, 20);
  rect(-30, -30, 60, 60);
  pop();

  // a circle orbiting the center, carried by the same rotation
  push();
  translate(cx, cy);
  rotate(-angle * 1.5);
  translate(orbitRadius, 0);
  fill(20, 120, 245);
  ellipse(0, 0, 30, 30);
  pop();

  // a square pulsing in size in the corner, driven purely by scale()
  push();
  translate(60, 60);
  scale(1 + 0.5 * Math.sin(angle * 2));
  fill(40, 200, 90);
  rect(-15, -15, 30, 30);
  pop();

  angle += 0.05;
}

function startRecord() {
  initVar();
  window.saveLottie(5, (animation) => {
    const player = document.querySelector("lottie-player");
    player.load(JSON.stringify(animation));
  });
}
