import { extendImage, upscaleImage } from "../image/ImageOps";
import type { BinaryFileData } from "@excalidraw/excalidraw/types";

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
  return extendImage(file, extension);
};

export const runMockUpscaleJob = async ({
  file,
  scale,
}: {
  file: BinaryFileData;
  scale: number;
}) => {
  await delay(500);
  return upscaleImage(file, scale);
};
