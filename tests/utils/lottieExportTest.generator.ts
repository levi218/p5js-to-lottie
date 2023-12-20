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

    // DOWNLOAD LOTTIE
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
    console.log(lottieJson);
    expect(lottieJson).toBeDefined();
    fs.mkdirSync(fileStoreLocation, { recursive: true });
    fs.writeFileSync(
      `${fileStoreLocation}/lottie.json`,
      JSON.stringify(lottieJson, null, 2),
      "utf8"
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

      // currently need to flat png from lottie because the gif frames from p5js has a black background (solution not found yet)
      // TODO: if possible, make the frame background from gif transparent

      // ALT: without flattening png
      // await download.saveAs(`${FILESTORE_LOCATION}/rect_lottie_${frameNo}.png`);
      const png = new PNG({
        colorType: 2,
        bgColor: {
          red: 0,
          green: 0,
          blue: 0,
        },
      });
      (await download.createReadStream()).pipe(png).on("parsed", function () {
        png
          .pack()
          .pipe(
            fs.createWriteStream(
              `${fileStoreLocation}/lottie_${frameNo}.png`
            )
          );
      });
    }
  });
