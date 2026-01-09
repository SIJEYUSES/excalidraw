import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useAtomValue } from "jotai";
import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import { newElementWith } from "@excalidraw/element";
import type {
  ExcalidrawElement,
  ExcalidrawImageElement,
} from "@excalidraw/element";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { randomId } from "@excalidraw/common";
import {
  selectionContextAtom,
  sceneElementsAtom,
  sceneFilesAtom,
  viewTransformAtom,
} from "../atoms";
import type { ViewTransform } from "../types";
import {
  cropImage,
  getImageElementFile,
  getSelectedImageElement,
  replaceImageFile,
} from "./ImageOps";
import { CropModal } from "./CropModal";
import { ImageEditorModal } from "./ImageEditorModal";
import { ExtendModal } from "./ExtendModal";
import { UpscaleModal } from "./UpscaleModal";
import { runExtendJob, runUpscaleJob } from "../api/imageJobs";
import "./FloatingImageToolbar.scss";

export type PointerCoords = {
  x: number;
  y: number;
} | null;

type ModalType =
  | "crop"
  | "edit"
  | "extend"
  | "upscale"
  | "layers"
  | null;

type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const getImageBoundsInViewport = (
  element: ExcalidrawImageElement,
  viewTransform: ViewTransform,
): Bounds => {
  const width = Math.abs(element.width) * viewTransform.zoom;
  const height = Math.abs(element.height) * viewTransform.zoom;
  const x =
    (element.x + viewTransform.scrollX) * viewTransform.zoom +
    viewTransform.offsetLeft;
  const y =
    (element.y + viewTransform.scrollY) * viewTransform.zoom +
    viewTransform.offsetTop;

  return { x, y, width, height };
};

const findHoveredImage = (
  elements: readonly ExcalidrawElement[],
  pointer: PointerCoords,
  viewTransform: ViewTransform,
) => {
  if (!pointer) return undefined;
  for (let index = elements.length - 1; index >= 0; index -= 1) {
    const element = elements[index];
    if (element.type !== "image") continue;
    const bounds = getImageBoundsInViewport(
      element as ExcalidrawImageElement,
      viewTransform,
    );
    const withinX = pointer.x >= bounds.x && pointer.x <= bounds.x + bounds.width;
    const withinY = pointer.y >= bounds.y && pointer.y <= bounds.y + bounds.height;
    if (withinX && withinY) {
      return element as ExcalidrawImageElement;
    }
  }
  return undefined;
};

const moveElement = (
  elements: readonly ExcalidrawElement[],
  id: string,
  direction: "forward" | "backward" | "front" | "back",
) => {
  const index = elements.findIndex((el) => el.id === id);
  if (index === -1) return elements;
  const nextElements = [...elements];
  const [element] = nextElements.splice(index, 1);
  if (direction === "front") {
    nextElements.push(element);
  } else if (direction === "back") {
    nextElements.unshift(element);
  } else if (direction === "forward") {
    const nextIndex = Math.min(nextElements.length, index + 1);
    nextElements.splice(nextIndex, 0, element);
  } else if (direction === "backward") {
    const nextIndex = Math.max(0, index - 1);
    nextElements.splice(nextIndex, 0, element);
  }
  return nextElements;
};

export const FloatingImageToolbar = ({
  excalidrawAPI,
  pointer,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  pointer: PointerCoords;
}) => {
  const elements = useAtomValue(sceneElementsAtom);
  const files = useAtomValue(sceneFilesAtom);
  const selectionContext = useAtomValue(selectionContextAtom);
  const viewTransform = useAtomValue(viewTransformAtom);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedImage = useMemo(
    () => getSelectedImageElement(elements, selectionContext.elementIds),
    [elements, selectionContext.elementIds],
  );

  const hoveredImage = useMemo(() => {
    if (!viewTransform) return undefined;
    return findHoveredImage(elements, pointer, viewTransform);
  }, [elements, pointer, viewTransform]);

  const activeImage = selectedImage ?? hoveredImage;
  const activeFile = activeImage
    ? getImageElementFile(activeImage, files)
    : undefined;

  const bounds = useMemo(() => {
    if (!activeImage || !viewTransform) return null;
    return getImageBoundsInViewport(activeImage, viewTransform);
  }, [activeImage, viewTransform]);

  const [position, setPosition] = useState<{ left: number; top: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!bounds || !toolbarRef.current) {
      setPosition(null);
      return;
    }
    const rect = toolbarRef.current.getBoundingClientRect();
    const left = bounds.x + bounds.width / 2 - rect.width / 2;
    const top = bounds.y - rect.height - 10;
    setPosition({
      left: Math.max(8, left),
      top: Math.max(8, top),
    });
  }, [bounds, activeImage]);

  const handleReplace = useCallback(
    async (
      element: ExcalidrawImageElement,
      blob: Blob,
      action: string,
      meta?: Record<string, unknown>,
      jobIdOverride?: string,
    ) => {
      if (!excalidrawAPI) return;
      setIsProcessing(true);
      try {
        await replaceImageFile({
          excalidrawAPI,
          element,
          blob,
          action,
          meta,
          jobId: jobIdOverride ?? `local-${action}-${randomId()}`,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [excalidrawAPI],
  );

  const handleLayerUpdate = useCallback(
    (updatedElements: readonly ExcalidrawElement[]) => {
      if (!excalidrawAPI) return;
      excalidrawAPI.updateScene({
        elements: updatedElements,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
    },
    [excalidrawAPI],
  );

  const handleDownload = useCallback(() => {
    if (!activeImage || !activeFile) return;
    const link = document.createElement("a");
    link.href = activeFile.dataURL;
    link.download = `rendercanvas-image-${activeImage.id}.png`;
    link.click();
  }, [activeFile, activeImage]);

  const handleReplaceFilePick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || !activeImage) return;
      await handleReplace(activeImage, file, "replace", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
    },
    [activeImage, handleReplace],
  );

  if (!activeImage || !activeFile || !bounds || !position) {
    return null;
  }

  const toolbar = (
    <div
      className="chatcanvas-floating-toolbar"
      ref={toolbarRef}
      style={{ left: position.left, top: position.top }}
    >
      <div className="chatcanvas-floating-toolbar__actions">
        <button
          onClick={() => setActiveModal("crop")}
          disabled={isProcessing}
        >
          Crop
        </button>
        <button
          onClick={() => setActiveModal("edit")}
          disabled={isProcessing}
        >
          Edit
        </button>
        <button
          onClick={() => setActiveModal("extend")}
          disabled={isProcessing}
        >
          Extend
        </button>
        <button
          onClick={() => setActiveModal("upscale")}
          disabled={isProcessing}
        >
          Upscale
        </button>
        <button
          onClick={() => setActiveModal("layers")}
          disabled={isProcessing}
        >
          Layers
        </button>
        <button onClick={handleReplaceFilePick} disabled={isProcessing}>
          Replace
        </button>
        <button onClick={handleDownload} disabled={isProcessing}>
          Download
        </button>
      </div>

      {activeModal === "layers" && (
        <div className="chatcanvas-floating-toolbar__layers">
          <button
            onClick={() =>
              handleLayerUpdate(moveElement(elements, activeImage.id, "forward"))
            }
          >
            Bring forward
          </button>
          <button
            onClick={() =>
              handleLayerUpdate(moveElement(elements, activeImage.id, "backward"))
            }
          >
            Send backward
          </button>
          <button
            onClick={() =>
              handleLayerUpdate(moveElement(elements, activeImage.id, "front"))
            }
          >
            To front
          </button>
          <button
            onClick={() =>
              handleLayerUpdate(moveElement(elements, activeImage.id, "back"))
            }
          >
            To back
          </button>
          <button
            onClick={() =>
              handleLayerUpdate(
                elements.map((el) =>
                  el.id === activeImage.id
                    ? newElementWith(el, { locked: !el.locked })
                    : el,
                ),
              )
            }
          >
            {activeImage.locked ? "Unlock" : "Lock"}
          </button>
          <button onClick={() => setActiveModal(null)}>Close</button>
        </div>
      )}

      {activeModal === "crop" && (
        <CropModal
          imageSize={{ width: activeImage.width, height: activeImage.height }}
          onClose={() => setActiveModal(null)}
          onApply={async (crop) => {
            const blob = await cropImage(activeImage, activeFile, crop);
            await handleReplace(activeImage, blob, "crop", crop);
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === "edit" && (
        <ImageEditorModal
          dataURL={activeFile.dataURL}
          onClose={() => setActiveModal(null)}
          onApply={async (blob) => {
            await handleReplace(activeImage, blob, "edit");
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === "extend" && (
        <ExtendModal
          onClose={() => setActiveModal(null)}
          onApply={async ({ prompt, ...extension }) => {
            setIsProcessing(true);
            try {
              const { blob, jobId } = await runExtendJob({
                file: activeFile,
                extension,
                prompt,
              });
              await handleReplace(
                activeImage,
                blob,
                "extend",
                {
                  prompt,
                  ...extension,
                  jobId,
                  mode: "mock",
                },
                jobId,
              );
            } finally {
              setIsProcessing(false);
            }
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === "upscale" && (
        <UpscaleModal
          onClose={() => setActiveModal(null)}
          onApply={async (scale) => {
            setIsProcessing(true);
            try {
              const { blob, jobId, mode } = await runUpscaleJob({
                file: activeFile,
                scale,
              });
              await handleReplace(
                activeImage,
                blob,
                "upscale",
                {
                  scale,
                  jobId,
                  mode,
                },
                jobId,
              );
            } finally {
              setIsProcessing(false);
            }
            setActiveModal(null);
          }}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="chatcanvas-floating-toolbar__file-input"
        onChange={handleFileChange}
      />
    </div>
  );

  return createPortal(toolbar, document.body);
};
