let x1 = 200, y1 = 50;
let x2 = 150, y2 = 350;
let x3 = 250, y3 = 350;
let speed = 2;

function initVar() {
  x1 = 200; y1 = 50;
  x2 = 150; y2 = 350;
  x3 = 250; y3 = 350;
  speed = 2;
}

function setup() {
  createCanvas(400, 400);
  noStroke();
  initVar();
}

function draw() {
  clear();
  fill(50, 200, 100);
  triangle(x1, y1, x2, y2, x3, y3);

  y1 += speed;
  y2 -= speed;
  y3 -= speed;

  if (y1 > height || y2 < 0 || y3 < 0) {
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
  