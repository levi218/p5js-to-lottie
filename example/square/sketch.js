let x = 50;
let y = 50;
let size = 50;
let speed = 3;

function initVar() {
  x = 50;
  y = 50;
  size = 50;
  speed = 3;
}

function setup() {
  createCanvas(400, 400);
  noStroke();
  initVar();
}

function draw() {
  clear();
  fill(255, 100, 50);
  square(x, y, size);

  x += speed;
  y += speed;

  if (x + size > width || x < 0) {
    speed *= -1;
  }
}

function startRecord() {
  initVar();
  window.saveLottie(5, (animation) => {
    const player = document.querySelector("lottie-player");
    player.load(JSON.stringify(animation));
  });
}
