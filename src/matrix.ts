// 2D affine matrix [a, b, c, d, e, f] matching the canvas convention:
//   x' = a*x + c*y + e
//   y' = b*x + d*y + f
export type Matrix = [number, number, number, number, number, number];

export function identityMatrix(): Matrix {
  return [1, 0, 0, 1, 0, 0];
}

function multiply(m: Matrix, n: Matrix): Matrix {
  const [a1, b1, c1, d1, e1, f1] = m;
  const [a2, b2, c2, d2, e2, f2] = n;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

export function translateMatrix(m: Matrix, tx: number, ty: number): Matrix {
  return multiply(m, [1, 0, 0, 1, tx, ty]);
}

export function rotateMatrix(m: Matrix, radians: number): Matrix {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return multiply(m, [cos, sin, -sin, cos, 0, 0]);
}

export function scaleMatrix(m: Matrix, sx: number, sy: number): Matrix {
  return multiply(m, [sx, 0, 0, sy, 0, 0]);
}

export function applyMatrix(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

// Decomposes the linear (rotation+scale) part of the matrix. Exact for any
// chain of translate()/rotate()/scale() calls applied in that grouped order
// (the common p5 idiom). A rotate() sandwiched between two non-uniform
// scale() calls introduces shear that this can't represent -
// ponytail: rare in practice, revisit with full QR decomposition if it comes up.
export function decomposeMatrix(m: Matrix) {
  const [a, b, c, d] = m;
  return {
    rotation: (Math.atan2(b, a) * 180) / Math.PI,
    scaleX: Math.hypot(a, b),
    scaleY: Math.hypot(c, d),
  };
}

// atan2 only ever returns a value in (-180, 180], so a continuously-rotating
// shape's per-frame angle sawtooths back to -180 every full turn. Feeding
// that straight into the curve-fitting Optimizer is fatal: it treats the
// jump as just another value to interpolate smoothly *through*, so Lottie
// spins the shape the short way across 360° of open space instead of
// continuing past the wrap — accumulate whole turns instead so the sequence
// is continuous, matching what the animation is actually doing.
export function unwrapDegrees(values: number[]): number[] {
  const unwrapped: number[] = [];
  let offset = 0;
  for (let i = 0; i < values.length; i++) {
    if (i > 0) {
      const jump = values[i] + offset - unwrapped[i - 1];
      if (jump > 180) offset -= 360;
      else if (jump < -180) offset += 360;
    }
    unwrapped.push(values[i] + offset);
  }
  return unwrapped;
}
