// image(): natural size, stretched, cropped, tinted, and under imageMode(CENTER)
// with rotate()/scale(). The image is drawn procedurally so no asset file is needed.
let t = 0;
let img;

function initVar() {
  t = 0;
}

function setup() {
  createCanvas(400, 400);
  img = createGraphics(64, 64);
  img.pixelDensity(1);
  img.background(40, 60, 120);
  img.noStroke();
  img.fill(250, 190, 40);
  img.circle(32, 32, 40);
  img.fill(200, 40, 90);
  img.rect(0, 0, 16, 16);
  initVar();
}

function draw() {
  // Black, for the test harness: with a full 256-color palette, p5 1.9's
  // saveGif() swaps one real color for its random transparent entry, and
  // those pixels decode as black.
  background(0);

  image(img, 20, 20);
  image(img, 110, 20, 128, 64);
  image(img, 280, 20, 96, 96, 16, 16, 32, 32);

  push();
  imageMode(CENTER);
  translate(200, 250);
  rotate(t * 0.03);
  scale(1 + 0.3 * Math.sin(t * 0.05));
  image(img, 0, 0, 120, 120);
  pop();

  tint(255, 120, 120);
  image(img, 20, 300, 80, 80);
  noTint();

  t++;
}

function startRecord() {
  initVar();
  window.saveLottie(5, (animation) => {
    const player = document.querySelector("lottie-player");
    player.load(JSON.stringify(animation));
  });
}
