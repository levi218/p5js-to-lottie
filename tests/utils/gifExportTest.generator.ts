import { test } from "@playwright/test";
import fs from "fs";
import gifFrames from "gif-frames";

export interface GenerateGifTestParams {
  exampleName: string;
  fileStoreLocation: string;
  exportedFrames: number[];
}
export const generateGifExportTest = ({
  exampleName,
  fileStoreLocation,
  exportedFrames,
}: GenerateGifTestParams) =>
  test(`[${exampleName}] Generating GIF from sketch and export frames for reference`, async ({
    page,
  }) => {
    await page.goto(`/example/${exampleName}`);
    await page.waitForLoadState();
    // Same starting point as the Lottie export: at least one draw() has run.
    await page.waitForFunction(() => (window as any).frameCount > 1);

    const downloadPromise = page.waitForEvent("download");
    await page.evaluate(() => {
      (window as any).initVar();
      (window as any).saveGif("mySketch", 5, { silent: true });
    });
    const download = await downloadPromise;
    await download.saveAs(`${fileStoreLocation}/gif.gif`);

    const frameData = await gifFrames({
      url: `${fileStoreLocation}/gif.gif`,
      frames: exportedFrames.join(","),
      outputType: "png",
      cumulative: true,
    });
    // Wait for every frame to hit disk; the diff tests read them next.
    await Promise.all(
      frameData.map(
        (frame: any) =>
          new Promise((resolve, reject) =>
            frame
              .getImage()
              .pipe(
                fs.createWriteStream(
                  `${fileStoreLocation}/gif_${frame.frameIndex}.png`
                )
              )
              .on("finish", resolve)
              .on("error", reject)
          )
      )
    );
  });
