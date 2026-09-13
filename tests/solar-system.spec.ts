import { test } from "@playwright/test";
import { generateGifExportTest } from "./utils/gifExportTest.generator";
import { generateLottieExportTest } from "./utils/lottieExportTest.generator";
import { generateDiffTest } from "./utils/diffTest.generator";

const EXAMPLE_NAME = "solar-system";
const FILESTORE_LOCATION = `./output/${EXAMPLE_NAME}`;
// This sketch's fast circular motion produces a much denser Lottie file than
// the other examples (many curve-fit segments per orbit), so each seek+export
// cycle in the harness is noticeably slower — keep the sample small enough to
// finish within the default test timeout while still covering the full clip.
const DIFF_FRAMES = [0, 50, 100, 150, 200, 250];

test.describe.configure({ mode: "serial" });

generateGifExportTest({
  exampleName: EXAMPLE_NAME,
  exportedFrames: DIFF_FRAMES,
  fileStoreLocation: FILESTORE_LOCATION,
});
generateLottieExportTest({
  exampleName: EXAMPLE_NAME,
  exportedFrames: DIFF_FRAMES,
  fileStoreLocation: FILESTORE_LOCATION,
});
for (const frameNo of DIFF_FRAMES) {
  generateDiffTest({
    exampleName: EXAMPLE_NAME,
    fileStoreLocation: FILESTORE_LOCATION,
    comparingFrameNo: frameNo,
  });
}
