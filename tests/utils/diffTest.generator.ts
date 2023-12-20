import { test, expect } from "@playwright/test";
import fs from "fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

export interface DiffTestParams {
  exampleName: string;
  fileStoreLocation: string;
  comparingFrameNo: number;
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

    console.log(
      `Frame ${comparingFrameNo}: ${numDiffPixels}/${400 * 400} pixels differ`
    );

    test.expect(numDiffPixels / (400 * 400)).toBeLessThan(0.05);

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
  });
