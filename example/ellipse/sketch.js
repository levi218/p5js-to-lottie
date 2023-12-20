// actual sketch
let circX = 200;
let circY = 200;
let diam = 50;
let speedX = 5;
let speedY = 7;
function initVar() {
  circX = 200;
  circY = 200;
  diam = 50;
  speedX = 5;
  speedY = 7;
}
function setup() {
  createCanvas(400, 400);
  noStroke();
  initVar();
}

function draw() {
  clear();

  // draw the circle on the screen
  fill(245, 10, 20);
  ellipse(circX, circY, diam);

  // increment the x and y with their respective speeds
  circX = circX + speedX;
  circY = circY + speedY;

  // if the circle goes off the left or right sides of the screen, turn it around
  if (circX + diam / 2 > width || circX - diam / 2 <= 0) {
    speedX = speedX * -1;
  }

  // if the circle goes off the top or bottom sides of the screen, turn it around
  if (circY + diam / 2 > width || circY - diam / 2 <= 0) {
    speedY = speedY * -1;
  }
}
// setInterval(()=>{
//   initVar()
// }, 4000)
// window.addEventListener('load', () => {
// window.saveLottie()
// console.log('document loaded');
// const animation = new LottieAnimation({});
// const layer = new LottieLayer({});
// animation.addLayer(layer);

// // TODO: wait 2 secs then use the sample object from
// for (const [key, value] of Object.entries(sampleObject)) {
//   const shape = new LottieShapeEllipse({ name: key, args: value });
//   layer.addShape(shape);
// }

// console.log(animation.toJson());

// const player = document.querySelector('lottie-player');
// // player.load("https://assets3.lottiefiles.com/packages/lf20_UJNc2t.json");

// // or load via a Bodymovin JSON string/object
// player.load(JSON.stringify(animation.toJson()));
// });

function startRecord() {
  initVar();
  window.saveLottie(5, (animation) => {
    const player = document.querySelector("lottie-player");
    player.load(JSON.stringify(animation));
  });
}
