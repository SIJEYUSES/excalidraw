import type { BinaryFileData } from "@excalidraw/excalidraw/types";
import { runMockExtendJob, runMockUpscaleJob } from "./mockImageJobs";

export const runExtendJob = async ({
  file,
  extension,
  prompt,
}: {
  file: BinaryFileData;
  extension: { top: number; right: number; bottom: number; left: number };
  prompt?: string;
}) => {
  try {
    await fetch("/api/image/extend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, extension }),
    });
  } catch {
    // keep adapter layer even when backend is mocked
  }

  return runMockExtendJob({ file, extension, prompt });
};

export const runUpscaleJob = async ({
  file,
  scale,
}: {
  file: BinaryFileData;
  scale: number;
}) => {
  try {
    await fetch("/api/image/upscale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scale }),
    });
  } catch {
    // keep adapter layer even when backend is mocked
  }

  return runMockUpscaleJob({ file, scale });
};
