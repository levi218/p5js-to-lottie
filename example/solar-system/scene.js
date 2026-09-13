// The solar system, drawn purely from a frame number so the same scene drives
// example/solar-system (global mode: pass `window`) and landing/index.html
// (instance mode: pass the p5 instance).

const PLANETS = [
  { name: "Mercury", orbit: 36, size: 5, phase: 0.4, colors: ["#e8e2da", "#8c8580"] },
  { name: "Venus", orbit: 52, size: 8, phase: 2.1, colors: ["#fff1c9", "#c99a4b"] },
  { name: "Earth", orbit: 72, size: 9, phase: 4.0, colors: ["#b5e0ff", "#1f5fb8"], moon: true },
  { name: "Mars", orbit: 92, size: 6, phase: 5.5, colors: ["#ffb08a", "#b8421f"] },
  { name: "Jupiter", orbit: 124, size: 20, phase: 1.2, colors: ["#fbe3c0", "#b9855a"] },
  { name: "Saturn", orbit: 154, size: 15, phase: 3.3, colors: ["#fff0c2", "#c9a45c"], rings: true },
  { name: "Uranus", orbit: 182, size: 10, phase: 5.0, colors: ["#e0fcff", "#4fb8c9"] },
];
const EARTH_SPEED = 0.03; // radians per frame
const DAYS_PER_FRAME = 365 / ((2 * Math.PI) / EARTH_SPEED);

// Stars painted once into an offscreen buffer, then blitted with image().
function makeStarfield(p) {
  const g = p.createGraphics(p.width, p.height);
  g.pixelDensity(1);
  let seed = 7; // tiny LCG: the same sky on every run
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 180; i++) {
    g.stroke(255, 255, 255, 80 + rand() * 175);
    g.strokeWeight(0.6 + rand() * 1.4);
    g.point(rand() * p.width, rand() * p.height);
  }
  return g;
}

function drawSolarSystem(p, frame, starfield) {
  const ctx = p.drawingContext;
  const cx = p.width / 2;
  const cy = p.height / 2;

  p.background(5, 7, 18);
  p.image(starfield, 0, 0);

  // orbits and the asteroid belt
  p.noFill();
  p.stroke(255, 255, 255, 28);
  p.strokeWeight(1);
  for (const planet of PLANETS) p.circle(cx, cy, planet.orbit * 2);
  p.stroke(190, 170, 150, 40);
  p.strokeWeight(6);
  p.circle(cx, cy, 216);

  // the sun: a pulsing glow behind a radial-gradient core.
  // fill() re-enables filling after the noFill() above; the gradients then
  // replace its color through drawingContext.
  p.noStroke();
  p.fill(255);
  p.push();
  p.translate(cx, cy);
  p.scale(1 + 0.06 * Math.sin(frame * 0.08));
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
  glow.addColorStop(0, "rgba(255, 200, 80, 0.6)");
  glow.addColorStop(1, "rgba(255, 120, 0, 0)");
  ctx.fillStyle = glow;
  p.circle(0, 0, 100);
  p.pop();

  p.push();
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
  core.addColorStop(0, "#fffbe0");
  core.addColorStop(0.5, "#ffc53a");
  core.addColorStop(1, "#ff7b00");
  ctx.fillStyle = core;
  p.circle(cx, cy, 44);
  p.pop();

  for (const planet of PLANETS) {
    const angle = planet.phase + frame * EARTH_SPEED * Math.pow(72 / planet.orbit, 1.5);
    const size = planet.size;
    p.push();
    p.translate(cx + planet.orbit * Math.cos(angle), cy + planet.orbit * Math.sin(angle));

    // Saturn's rings: the far half behind the planet, the near half in front
    const ring = (start, stop) => {
      p.push();
      p.rotate(-0.35);
      p.noFill();
      p.stroke(225, 205, 160, 210);
      p.strokeWeight(2);
      p.arc(0, 0, size * 2.6, size * 0.9, start, stop);
      p.pop();
    };
    if (planet.rings) ring(p.PI, p.TWO_PI);

    // lit from the sun: the gradient's bright center leans toward it
    p.push();
    p.noStroke();
    const lx = -Math.cos(angle) * size * 0.3;
    const ly = -Math.sin(angle) * size * 0.3;
    const shade = ctx.createRadialGradient(lx, ly, 0, lx, ly, size);
    shade.addColorStop(0, planet.colors[0]);
    shade.addColorStop(1, planet.colors[1]);
    ctx.fillStyle = shade;
    p.circle(0, 0, size);
    p.pop();

    if (planet.rings) ring(0, p.PI);

    if (planet.moon) {
      p.push();
      p.rotate(frame * 0.15);
      p.noStroke();
      p.fill(210);
      p.circle(size, 0, 3);
      p.pop();
    }

    p.noStroke();
    p.fill(255, 255, 255, 150);
    p.textSize(9);
    p.textAlign(p.CENTER, p.TOP);
    p.text(planet.name, 0, size / 2 + (planet.rings ? 6 : 4));
    p.pop();
  }

  // a comet on a long ellipse, its tail pointing away from the sun
  const b = 2.4 + frame * 0.012;
  const hx = cx + 178 * Math.cos(b);
  const hy = cy - 30 + 70 * Math.sin(b);
  const dist = Math.hypot(hx - cx, hy - cy);
  const ux = (hx - cx) / dist;
  const uy = (hy - cy) / dist;
  const tail = 46;
  const ex = hx + ux * tail;
  const ey = hy + uy * tail;
  p.push();
  p.noStroke();
  const fade = ctx.createLinearGradient(hx, hy, ex, ey);
  fade.addColorStop(0, "rgba(200, 235, 255, 0.9)");
  fade.addColorStop(1, "rgba(200, 235, 255, 0)");
  ctx.fillStyle = fade;
  p.beginShape();
  p.vertex(hx - uy * 3, hy + ux * 3);
  p.quadraticVertex(hx + ux * tail * 0.5 - uy * 7, hy + uy * tail * 0.5 + ux * 7, ex, ey);
  p.quadraticVertex(hx + ux * tail * 0.5 + uy * 7, hy + uy * tail * 0.5 - ux * 7, hx + uy * 3, hy - ux * 3);
  p.endShape(p.CLOSE);
  p.pop();
  p.fill(240, 250, 255);
  p.circle(hx, hy, 5);

  p.fill(255);
  p.textSize(15);
  p.textAlign(p.LEFT, p.BASELINE);
  p.text("Solar System", 14, 26);
  p.fill(255, 255, 255, 140);
  p.textSize(10);
  p.text(`Day ${Math.floor(frame * DAYS_PER_FRAME)}`, 14, 42);
}
