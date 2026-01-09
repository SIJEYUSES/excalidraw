import { extendImage, upscaleImage } from "../image/ImageOps";
import type { BinaryFileData } from "@excalidraw/excalidraw/types";
import { randomId } from "@excalidraw/common";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const runMockExtendJob = async ({
  file,
  extension,
  prompt,
}: {
  file: BinaryFileData;
  extension: { top: number; right: number; bottom: number; left: number };
  prompt?: string;
}) => {
  await delay(600);
  return {
    blob: await extendImage(file, extension),
    jobId: `mock-extend-${randomId()}`,
    mode: "mock" as const,
    prompt,
  };
};

export const runMockUpscaleJob = async ({
  file,
  scale,
}: {
  file: BinaryFileData;
  scale: number;
}) => {
  await delay(500);
  return {
    blob: await upscaleImage(file, scale),
    jobId: `mock-upscale-${randomId()}`,
    mode: "hq-resize" as const,
  };
};
