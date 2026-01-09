import { useCallback, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { CaptureUpdateAction, MIME_TYPES } from "@excalidraw/excalidraw";
import { newImageElement } from "@excalidraw/element";
import { randomId } from "@excalidraw/common";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { viewTransformAtom } from "../atoms";
import {
  buildImageFile,
  getImageSizeFromBlob,
  type ImageEditHistoryEntry,
  type ImageVersionEntry,
} from "../image/ImageOps";
import type { ViewTransform } from "../types";

const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
]);

const toSceneCoords = (
  clientX: number,
  clientY: number,
  transform: ViewTransform,
) => {
  const x = (clientX - transform.offsetLeft) / transform.zoom - transform.scrollX;
  const y = (clientY - transform.offsetTop) / transform.zoom - transform.scrollY;
  return { x, y };
};

const normalizeImageBlob = async (file: File) => {
  if (file.type === "image/svg+xml") {
    const svgText = await file.text();
    const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
    const bitmap = await createImageBitmap(svgBlob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context unavailable");
    }
    ctx.drawImage(bitmap, 0, 0);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to generate PNG"));
        }
      }, MIME_TYPES.png);
    });
    return { blob: pngBlob, mimeType: MIME_TYPES.png };
  }
  return { blob: file, mimeType: file.type || MIME_TYPES.png };
};

export const useImageDrop = (
  excalidrawAPI: ExcalidrawImperativeAPI | null,
) => {
  const viewTransform = useAtomValue(viewTransformAtom);
  const [isDragActive, setIsDragActive] = useState(false);

  const effectiveTransform = useMemo(() => {
    if (viewTransform) return viewTransform;
    if (!excalidrawAPI) return null;
    const appState = excalidrawAPI.getAppState();
    return {
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
      zoom: appState.zoom.value,
      offsetLeft: appState.offsetLeft,
      offsetTop: appState.offsetTop,
    } as ViewTransform;
  }, [excalidrawAPI, viewTransform]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (!event.dataTransfer) return;
    event.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      if (!excalidrawAPI || !effectiveTransform) return;
      event.preventDefault();
      setIsDragActive(false);

      const { files } = event.dataTransfer;
      if (!files || files.length === 0) return;

      const dropPoint = toSceneCoords(
        event.clientX,
        event.clientY,
        effectiveTransform,
      );
      const appState = excalidrawAPI.getAppState();
      const existingElements = excalidrawAPI.getSceneElements();

      const newElements = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        if (!ACCEPTED_TYPES.has(file.type)) continue;
        const { blob, mimeType } = await normalizeImageBlob(file);
        const binaryFile = await buildImageFile(blob, mimeType);
        const { width, height } = await getImageSizeFromBlob(blob);
        const jobId = `local-drop-${randomId()}`;
        const historyEntry: ImageEditHistoryEntry = {
          id: randomId(),
          op: "import",
          from: null,
          to: binaryFile.id,
          ts: Date.now(),
          jobId,
        };
        const versionEntry: ImageVersionEntry = {
          id: randomId(),
          op: "import",
          from: null,
          to: binaryFile.id,
          ts: Date.now(),
          jobId,
        };

        excalidrawAPI.addFiles([binaryFile]);

        const imageElement = newImageElement({
          type: "image",
          status: "saved",
          fileId: binaryFile.id,
          x: dropPoint.x + index * 24,
          y: dropPoint.y + index * 24,
          width,
          height,
          strokeColor: appState.currentItemStrokeColor,
          backgroundColor: appState.currentItemBackgroundColor,
          fillStyle: appState.currentItemFillStyle,
          strokeWidth: appState.currentItemStrokeWidth,
          strokeStyle: appState.currentItemStrokeStyle,
          roughness: appState.currentItemRoughness,
          opacity: appState.currentItemOpacity,
          locked: false,
          customData: {
            source: { jobId },
            editHistory: [historyEntry],
            versionChain: [versionEntry],
          },
        });

        newElements.push(imageElement);
      }

      if (newElements.length > 0) {
        excalidrawAPI.updateScene({
          elements: [...existingElements, ...newElements],
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      }
    },
    [effectiveTransform, excalidrawAPI],
  );

  return {
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragActive,
  };
};
