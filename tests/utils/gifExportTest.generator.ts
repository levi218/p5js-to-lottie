import { test, expect } from "@playwright/test";
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

    // DOWNLOAD GIF
    const downloadPromise = page.waitForEvent("download");
    await page.evaluate(() => {
      (window as any).initVar();
      (window as any).saveGif("mySketch", 5, { silent: true });
    });
    const download = await downloadPromise;

    // Wait for the download process to complete and save the downloaded file somewhere.
    await download.saveAs(`${fileStoreLocation}/gif.gif`);

    const frameData = await gifFrames({
      url: `${fileStoreLocation}/gif.gif`,
      frames: exportedFrames.join(","),
      outputType: "png",
      cumulative: true,
    });
    for (const frame of frameData) {
      frame
        .getImage()
        .pipe(
          fs.createWriteStream(
            `${fileStoreLocation}/gif_${frame.frameIndex}.png`
          )
        );
    }
  });
