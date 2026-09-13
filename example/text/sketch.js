// text() with textSize, textAlign (both axes), textLeading, changing content,
// transforms, and a stroke.
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
  noStroke();

  fill(30);
  textSize(32);
  textAlign(LEFT, BASELINE);
  text("p5js-to-lottie", 20, 50);

  fill(200, 40, 90);
  textSize(20);
  textAlign(CENTER, CENTER);
  text("centered", 200, 100);

  fill(30, 90, 200);
  textAlign(RIGHT, TOP);
  text("right / top", 380, 130);

  // content that changes every frame
  fill(40);
  textSize(24);
  textAlign(LEFT, BOTTOM);
  text(`frame ${t}`, 20, 220);

  // two lines, spinning around their center
  push();
  translate(200, 290);
  rotate(t * 0.02);
  fill(20, 150, 90);
  textSize(22);
  textLeading(28);
  textAlign(CENTER, CENTER);
  text("spinning\ntwo lines", 0, 0);
  pop();

  // outlined text
  textSize(48);
  textAlign(LEFT, BASELINE);
  stroke(0);
  strokeWeight(2);
  fill(250, 190, 40);
  text("Aa", 290, 380);

  t++;
}

function startRecord() {
  initVar();
  window.saveLottie(5, (animation) => {
    const player = document.querySelector("lottie-player");
    player.load(JSON.stringify(animation));
  });
}
