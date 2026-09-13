// actual sketch
let rectX = 200;
let rectY = 200;
let w = 50;
let speedX = 5;
let speedY = 7;
function initVar() {
  rectX = 200;
  rectY = 200;
  w = 50;
  speedX = 5;
  speedY = 7;
}
function setup() {
  createCanvas(400, 400);
  noStroke();
  initVar();
}

function draw() {
  // draw a slowly fading background to make a trail effect
  background(30, 240, 220);

  // draw the circle on the screen
  fill(245, 10, 20);
  rect(rectX, rectY, w, w);

  // increment the x and y with their respective speeds
  rectX = rectX + speedX;
  rectY = rectY + speedY;

  // if the circle goes off the left or right sides of the screen, turn it around
  if (rectX + w > width || rectX <= 0) {
    speedX = speedX * -1;
  }

  // if the circle goes off the top or bottom sides of the screen, turn it around
  if (rectY + w > width || rectY <= 0) {
    speedY = speedY * -1;
  }
}

function startRecord() {
  initVar();
  window.saveLottie(5, (animation) => {
    const player = document.querySelector("lottie-player");
    player.load(JSON.stringify(animation));
  });
}
