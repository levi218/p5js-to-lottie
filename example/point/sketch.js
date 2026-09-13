let x = 0;
let y = 200;
let speed = 5;

function initVar() {
  x = 0;
  y = 200;
  speed = 5;
}

function setup() {
  createCanvas(400, 400);
  strokeWeight(5);
  initVar();
}

function draw() {
  clear();
  stroke(0, 255, 0);
  point(x, y);

  x += speed;

  if (x > width || x < 0) {
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
  