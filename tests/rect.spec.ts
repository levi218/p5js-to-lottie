import { test, expect } from "@playwright/test";
import fs from "fs";
import gifFrames from "gif-frames";
import { PNG } from "pngjs";
import { generateGifExportTest } from "./utils/gifExportTest.generator";
import { generateLottieExportTest } from "./utils/lottieExportTest.generator";
import { generateDiffTest } from "./utils/diffTest.generator";

const EXAMPLE_NAME = "rect";
const FILESTORE_LOCATION = `./output/${EXAMPLE_NAME}`;
const DIFF_FRAMES = Array(10)
  .fill(0)
  .map((_, i) => i * 5);

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
