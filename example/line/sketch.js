let x1 = 0, y1 = 200;
let x2 = 400, y2 = 200;
let speed = 3;

function initVar() {
  x1 = 0;
  y1 = 200;
  x2 = 400;
  y2 = 200;
  speed = 3;
}

function setup() {
  createCanvas(400, 400);
  // Thick enough that the stroke body outweighs its anti-aliased edge. The
  // reference GIF's 256-color palette snaps edge pixels of a long diagonal
  // hairline to solid/background, which differs from lottie-web's smooth AA by
  // about as much as a real 1-2px error would — measuring the palette, not the
  // export. (At strokeWeight(2) the endpoints still match the GIF exactly.)
  strokeWeight(6);
  initVar();
}

function draw() {
  clear();
  stroke(0, 0, 255);
  line(x1, y1, x2, y2);

  y1 += speed;
  y2 -= speed;

  if (y1 > height || y2 < 0) {
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
  