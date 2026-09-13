// bezier(), curve(), arc() in every mode, and beginShape() paths built from
// curveVertex(), bezierVertex() and quadraticVertex().
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

  // bezier with a swaying control point
  noFill();
  stroke(30, 90, 200);
  strokeWeight(6);
  bezier(30, 80, 120 + 60 * Math.sin(t * 0.05), 0, 160, 150, 250, 60);

  // Catmull-Rom curve() (always stroke-only in p5)
  stroke(200, 40, 90);
  strokeWeight(4);
  curve(0, 320, 40, 180, 360, 200, 400, 60);

  // arc(): default mode fills a wedge but strokes an open outline
  fill(250, 190, 40);
  stroke(40);
  strokeWeight(3);
  const mouth = 0.3 + 0.25 * Math.sin(t * 0.1);
  arc(80, 260, 100, 100, mouth, TWO_PI - mouth);
  fill(120, 200, 120);
  arc(200, 260, 90, 60, 0, PI + QUARTER_PI, CHORD);
  push();
  translate(320, 260);
  rotate(t * 0.03);
  fill(160, 110, 220);
  arc(0, 0, 90, 90, 0, HALF_PI, PIE);
  pop();

  // closed wobbling blob through curveVertex()
  noStroke();
  fill(20, 170, 190);
  beginShape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TWO_PI;
    const r = 40 + 10 * Math.sin(t * 0.08 + i * 2);
    curveVertex(320 + r * Math.cos(a), 90 + r * Math.sin(a));
  }
  endShape(CLOSE);

  // leaf from bezierVertex() + quadraticVertex(), drifting sideways
  fill(90, 160, 60);
  stroke(30, 80, 20);
  strokeWeight(2);
  const x = 150 + 100 * Math.sin(t * 0.03);
  beginShape();
  vertex(x, 370);
  bezierVertex(x + 20, 320, x + 70, 320, x + 90, 370);
  quadraticVertex(x + 45, 400, x, 370);
  endShape(CLOSE);

  t++;
}

function startRecord() {
  initVar();
  window.saveLottie(5, (animation) => {
    const player = document.querySelector("lottie-player");
    player.load(JSON.stringify(animation));
  });
}
