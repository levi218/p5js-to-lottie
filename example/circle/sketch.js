let circX = 200;
let circY = 200;
let diam = 50;
let speedX = 3;
let speedY = 4;

function initVar() {
  circX = 200;
  circY = 200;
  diam = 50;
  speedX = 3;
  speedY = 4;
}

function setup() {
  createCanvas(400, 400);
  noStroke();
  initVar();
}

function draw() {
  clear();
  fill(0, 150, 255);
  circle(circX, circY, diam);

  circX += speedX;
  circY += speedY;

  if (circX + diam / 2 > width || circX - diam / 2 <= 0) {
    speedX *= -1;
  }
  if (circY + diam / 2 > height || circY - diam / 2 <= 0) {
    speedY *= -1;
  }
}

function startRecord() {
  initVar();
  window.saveLottie(5, (animation) => {
    const player = document.querySelector("lottie-player");
    player.load(JSON.stringify(animation));
  });
}
