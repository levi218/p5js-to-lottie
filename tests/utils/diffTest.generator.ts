import { test, expect } from "@playwright/test";
import fs from "fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

export interface DiffTestParams {
  exampleName: string;
  fileStoreLocation: string;
  comparingFrameNo: number;
}

// Most of a 400x400 frame is background — a shape that's badly misplaced or
// misrotated still only disturbs a few thousand of the 160000 total pixels,
// so a percentage-of-the-whole-canvas threshold stays "under 5%" even when
// the drawn content is visibly wrong. Compare against the drawn content
// instead: find the dominant (background) color and only count pixels that
// depart from it as something a real bug could actually get wrong.
function dominantColor(img: PNG): [number, number, number] {
  const counts = new Map<string, number>();
  for (let i = 0; i < img.data.length; i += 4) {
    const key = `${img.data[i]},${img.data[i + 1]},${img.data[i + 2]}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let bestKey = "255,255,255";
  let bestCount = -1;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }
  return bestKey.split(",").map(Number) as [number, number, number];
}

function countContentPixels(img: PNG, background: [number, number, number]) {
  const tolerance = 10;
  let count = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    if (
      Math.abs(img.data[i] - background[0]) > tolerance ||
      Math.abs(img.data[i + 1] - background[1]) > tolerance ||
      Math.abs(img.data[i + 2] - background[2]) > tolerance
    ) {
      count++;
    }
  }
  return count;
}

export const generateDiffTest = ({
  exampleName,
  fileStoreLocation,
  comparingFrameNo,
}: DiffTestParams) =>
  test(`[${exampleName}] Comparing GIF frame ${comparingFrameNo} and Lottie frame ${comparingFrameNo}`, async ({}, testInfo) => {
    const gifPath = `${fileStoreLocation}/gif_${comparingFrameNo}.png`;
    const lottiePath = `${fileStoreLocation}/lottie_${comparingFrameNo}.png`;

    const img1 = PNG.sync.read(fs.readFileSync(gifPath));
    const img2 = PNG.sync.read(fs.readFileSync(lottiePath));
    const { width, height } = img1;
    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
      img1.data,
      img2.data,
      diff.data,
      width,
      height,
      {
        threshold: 0.1,
      }
    );

    const background = dominantColor(img1);
    const contentPixels = Math.max(
      countContentPixels(img1, background),
      countContentPixels(img2, background),
      1
    );

    console.log(
      `Frame ${comparingFrameNo}: ${numDiffPixels}/${contentPixels} content pixels differ (${(
        (numDiffPixels / contentPixels) *
        100
      ).toFixed(1)}%), ${numDiffPixels}/${width * height} of the full frame`
    );

    // Write and attach before asserting so a failing frame still leaves its
    // evidence behind.
    const diffPath = `${fileStoreLocation}/diff_${comparingFrameNo}.png`;
    fs.writeFileSync(diffPath, PNG.sync.write(diff));

    await testInfo.attach("gif", {
      contentType: "image/png",
      path: gifPath,
    });
    await testInfo.attach("lottie", {
      contentType: "image/png",
      path: lottiePath,
    });
    await testInfo.attach("diff", {
      contentType: "image/png",
      path: diffPath,
    });

    // Fail only when off by >=5% of the drawn content AND >=100 pixels.
    // Canvas and lottie-web anti-alias edges differently: a correctly placed
    // 2px line still leaves ~60 speckle pixels (>5% of its tiny footprint),
    // while shifting any shape by 2px costs hundreds.
    const offBy = numDiffPixels / contentPixels;
    test.expect(offBy < 0.05 || numDiffPixels < 100).toBe(true);
  });
