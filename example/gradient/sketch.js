// Canvas gradients via drawingContext: linear and radial fills, a gradient
// stroke, one built in setup(), and ones in rotated/moving coordinates.
// push()/pop() around each: p5 caches its last fill() and won't re-apply it
// after drawingContext.fillStyle was set behind its back.
let t = 0;
let sky;

function initVar() {
  t = 0;
}

function setup() {
  createCanvas(400, 400);
  sky = drawingContext.createLinearGradient(0, 0, 0, 220);
  sky.addColorStop(0, "#1e3c72");
  sky.addColorStop(1, "#ff9966");
  initVar();
}

function draw() {
  background(255);
  noStroke();

  push();
  drawingContext.fillStyle = sky;
  rect(0, 0, 400, 220);
  pop();

  // rising sun, fading out at its edge
  push();
  const y = 170 - 60 * Math.sin(t * 0.02);
  const sun = drawingContext.createRadialGradient(200, y, 0, 200, y, 60);
  sun.addColorStop(0, "rgb(255, 255, 220)");
  sun.addColorStop(0.4, "#ffd34d");
  sun.addColorStop(1, "rgba(255, 140, 0, 0)");
  drawingContext.fillStyle = sun;
  circle(200, y, 120);
  pop();

  push();
  const ground = drawingContext.createLinearGradient(0, 220, 400, 400);
  ground.addColorStop(0, "#2d5016");
  ground.addColorStop(1, "#86b049");
  drawingContext.fillStyle = ground;
  rect(0, 220, 400, 180);
  pop();

  // gradient in the square's own rotating coordinates
  push();
  translate(100, 310);
  rotate(t * 0.03);
  const spin = drawingContext.createLinearGradient(-40, -40, 40, 40);
  spin.addColorStop(0, "#ff0066");
  spin.addColorStop(1, "#4488ff");
  drawingContext.fillStyle = spin;
  rect(-40, -40, 80, 80);
  pop();

  // gradient stroke, and a radial ring whose inner radius isn't 0
  push();
  noFill();
  strokeWeight(12);
  const outline = drawingContext.createLinearGradient(260, 250, 360, 350);
  outline.addColorStop(0, "#00cc99");
  outline.addColorStop(1, "#cc00ff");
  drawingContext.strokeStyle = outline;
  circle(310, 300, 90);
  pop();

  push();
  const ring = drawingContext.createRadialGradient(310, 300, 20, 310, 300, 36);
  ring.addColorStop(0, "#ffffff");
  ring.addColorStop(1, "#222222");
  drawingContext.fillStyle = ring;
  circle(310, 300, 72);
  pop();

  t++;
}

function startRecord() {
  initVar();
  window.saveLottie(5, (animation) => {
    const player = document.querySelector("lottie-player");
    player.load(JSON.stringify(animation));
  });
}
