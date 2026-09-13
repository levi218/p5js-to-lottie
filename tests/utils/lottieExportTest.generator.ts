import { test, expect } from "@playwright/test";
import fs from "fs";
import { PNG } from "pngjs";

export interface GenerateLottieTestParams {
  exampleName: string;
  fileStoreLocation: string;
  exportedFrames: number[];
}
export const generateLottieExportTest = ({
  exampleName,
  fileStoreLocation,
  exportedFrames,
}: GenerateLottieTestParams) =>
  test(`[${exampleName}] Generating Lottie from sketch and export frames`, async ({
    page,
  }) => {
    await page.goto(`/example/${exampleName}`);
    await page.waitForLoadState();
    // Let draw() run before recording, as the GIF export does. p5 keeps
    // fill/stroke between frames, so the first recorded frame inherits the
    // previous draw's style — without this, whether one had run is a race.
    await page.waitForFunction(() => (window as any).frameCount > 1);

    const lottieJson = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        try {
          (window as any).initVar();
          (window as any).saveLottie(5, (animation: any) => {
            const player = document.querySelector("lottie-player");
            (player as any).load(JSON.stringify(animation));
            (player as any).pause();
            resolve(animation);
          });
        } catch (ex) {
          reject(ex);
        }
      });
    });
    expect(lottieJson).toBeDefined();
    fs.mkdirSync(fileStoreLocation, { recursive: true });
    fs.writeFileSync(
      `${fileStoreLocation}/lottie.json`,
      JSON.stringify(lottieJson, null, 2),
      "utf8"
    );

    // Text layers and image assets load asynchronously; a seek before then
    // renders an empty canvas.
    await page.waitForFunction(
      () => (document.querySelector("lottie-player") as any)?._lottie?.isLoaded
    );

    for (const frameNo of exportedFrames) {
      const downloadPromise = page.waitForEvent("download");
      await page.evaluate(async (frameNo) => {
        const player = document.querySelector("lottie-player");
        (player as any).pause();
        (player as any).seek(frameNo);
        (window as any).saveCanvas(
          document
            .querySelector("lottie-player")
            ?.shadowRoot?.querySelector("#animation > canvas")
        );
        await new Promise((resolve) => setTimeout(resolve, 0));
      }, frameNo);
      const download = await downloadPromise;

      // Flatten onto black to match the GIF frames (p5's GIF has no transparency).
      // Written synchronously: the next test reads this file, and the page
      // must not close while a download is still being streamed.
      const png = PNG.sync.read(fs.readFileSync(await download.path()));
      fs.writeFileSync(
        `${fileStoreLocation}/lottie_${frameNo}.png`,
        PNG.sync.write(png, {
          colorType: 2,
          bgColor: { red: 0, green: 0, blue: 0 },
        })
      );
    }
  });
