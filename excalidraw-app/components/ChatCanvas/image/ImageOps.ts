import {
  CaptureUpdateAction,
  MIME_TYPES,
} from "@excalidraw/excalidraw";
import { getDataURL } from "@excalidraw/excalidraw/data/blob";
import { newElementWith } from "@excalidraw/element";
import { randomId } from "@excalidraw/common";
import type { BinaryFileData } from "@excalidraw/excalidraw/types";
import type {
  ExcalidrawElement,
  ExcalidrawImageElement,
} from "@excalidraw/element";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export type ImageEditHistoryEntry = {
  id: string;
  action: string;
  fileId: string;
  timestamp: number;
  meta?: Record<string, unknown>;
};

export type ImageEditResult = {
  element: ExcalidrawImageElement;
  file: BinaryFileData;
};

const dataURLToBlob = async (dataURL: string) => {
  const response = await fetch(dataURL);
  return response.blob();
};

const getImageSizeFromBlob = async (blob: Blob) => {
  const imageBitmap = await createImageBitmap(blob);
  return { width: imageBitmap.width, height: imageBitmap.height };
};

const getCanvasBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to generate image"));
      }
    }, MIME_TYPES.png);
  });

const buildImageFile = async (blob: Blob): Promise<BinaryFileData> => {
  const dataURL = await getDataURL(blob);
  return {
    id: randomId(),
    dataURL,
    mimeType: MIME_TYPES.png,
    created: Date.now(),
  };
};

export const getImageSizeFromDataURL = async (dataURL: string) => {
  const blob = await dataURLToBlob(dataURL);
  return getImageSizeFromBlob(blob);
};

export const replaceImageFile = async ({
  excalidrawAPI,
  element,
  blob,
  action,
  meta,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI;
  element: ExcalidrawImageElement;
  blob: Blob;
  action: string;
  meta?: Record<string, unknown>;
}): Promise<ImageEditResult> => {
  const file = await buildImageFile(blob);
  const { width, height } = await getImageSizeFromBlob(blob);
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;

  excalidrawAPI.addFiles([file]);

  const existingHistory = Array.isArray(element.customData?.editHistory)
    ? (element.customData?.editHistory as ImageEditHistoryEntry[])
    : [];
  const nextHistory: ImageEditHistoryEntry = {
    id: randomId(),
    action,
    fileId: file.id,
    timestamp: Date.now(),
    meta,
  };

  const updatedElement = newElementWith(element, {
    fileId: file.id,
    width,
    height,
    x: centerX - width / 2,
    y: centerY - height / 2,
    customData: {
      ...(element.customData ?? {}),
      editHistory: [...existingHistory, nextHistory],
    },
  }) as ExcalidrawImageElement;

  const elements = excalidrawAPI
    .getSceneElements()
    .map((el) => (el.id === element.id ? updatedElement : el));

  excalidrawAPI.updateScene({
    elements,
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });

  return { element: updatedElement, file };
};

export const cropImage = async (
  element: ExcalidrawImageElement,
  file: BinaryFileData,
  crop: { left: number; top: number; right: number; bottom: number },
): Promise<Blob> => {
  const blob = await dataURLToBlob(file.dataURL);
  const imageBitmap = await createImageBitmap(blob);
  const width = Math.max(1, imageBitmap.width - crop.left - crop.right);
  const height = Math.max(1, imageBitmap.height - crop.top - crop.bottom);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context unavailable");
  }
  ctx.drawImage(
    imageBitmap,
    crop.left,
    crop.top,
    width,
    height,
    0,
    0,
    width,
    height,
  );

  return getCanvasBlob(canvas);
};

export const extendImage = async (
  file: BinaryFileData,
  extension: { top: number; right: number; bottom: number; left: number },
): Promise<Blob> => {
  const blob = await dataURLToBlob(file.dataURL);
  const imageBitmap = await createImageBitmap(blob);
  const width =
    imageBitmap.width + Math.max(0, extension.left + extension.right);
  const height =
    imageBitmap.height + Math.max(0, extension.top + extension.bottom);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context unavailable");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(imageBitmap, extension.left, extension.top);

  return getCanvasBlob(canvas);
};

export const upscaleImage = async (
  file: BinaryFileData,
  scale: number,
): Promise<Blob> => {
  const blob = await dataURLToBlob(file.dataURL);
  const imageBitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(imageBitmap.width * scale));
  canvas.height = Math.max(1, Math.floor(imageBitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context unavailable");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
  return getCanvasBlob(canvas);
};

export const getImageElementFile = (
  element: ExcalidrawImageElement,
  files: Record<string, BinaryFileData>,
) => files[element.fileId];

export const getSelectedImageElement = (
  elements: readonly ExcalidrawElement[],
  selectedIds: string[],
) =>
  elements.find(
    (el) => el.type === "image" && selectedIds.includes(el.id),
  ) as ExcalidrawImageElement | undefined;
