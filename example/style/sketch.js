// Color/stroke state the exporter has to carry over: the default outline,
// strokeWeight, noFill, alpha, rectMode/ellipseMode, rounded corners,
// angleMode(DEGREES), and fill color / size that change over time.
let t = 0;

function initVar() {
  t = 0;
}

function setup() {
  createCanvas(400, 400);
  initVar();
}

function draw() {
  background(250);

  // p5 defaults: white fill with a 1px black outline
  rect(20, 20, 80, 60);

  // thick outline only, centered, rounded corners
  push();
  rectMode(CENTER);
  noFill();
  stroke(30, 90, 200);
  strokeWeight(8);
  rect(200, 60, 120, 70, 16);
  pop();

  // semi-transparent fill over another shape
  noStroke();
  fill(240, 60, 60);
  circle(330, 60, 80);
  fill(40, 160, 90, 128);
  rect(290, 40, 90, 60);

  // ellipseMode(CORNER) with a size that pulses
  push();
  ellipseMode(CORNER);
  fill(250, 180, 30);
  stroke(0);
  strokeWeight(3);
  const d = 60 + 30 * Math.sin(t * 0.1);
  ellipse(40, 150, d, d);
  pop();

  // fill color that switches every 20 frames
  noStroke();
  fill(t % 40 < 20 ? color(120, 60, 200) : color(20, 200, 220));
  square(190, 160, 70);

  // outlined triangle rotating in degrees
  push();
  angleMode(DEGREES);
  translate(310, 290);
  rotate(t * 3);
  fill(255, 220, 220);
  stroke(180, 20, 60);
  strokeWeight(4);
  triangle(0, -50, 45, 35, -45, 35);
  pop();
  angleMode(RADIANS);

  // thick line and a large point
  stroke(20);
  strokeWeight(10);
  line(40, 360, 150 + 60 * Math.sin(t * 0.05), 320);
  stroke(200, 0, 120);
  strokeWeight(18);
  point(120, 250);

  t++;
}

function startRecord() {
  initVar();
  window.saveLottie(5, (animation) => {
    const player = document.querySelector("lottie-player");
    player.load(JSON.stringify(animation));
  });
}
