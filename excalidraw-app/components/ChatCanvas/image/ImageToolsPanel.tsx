import React, { useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import {
  selectionContextAtom,
  sceneElementsAtom,
  sceneFilesAtom,
} from "../atoms";
import {
  cropImage,
  getImageElementFile,
  getImageSizeFromDataURL,
  getSelectedImageElement,
  replaceImageFile,
} from "./ImageOps";
import type { ExcalidrawImageElement } from "@excalidraw/element";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import { newElementWith } from "@excalidraw/element";
import { ImageEditorModal } from "./ImageEditorModal";
import { CropModal } from "./CropModal";
import { ExtendModal } from "./ExtendModal";
import { UpscaleModal } from "./UpscaleModal";
import { runMockExtendJob, runMockUpscaleJob } from "../api/mockImageJobs";
import "./ImageToolsPanel.scss";

type ModalType = "crop" | "edit" | "extend" | "upscale" | null;

export const ImageToolsPanel = ({
  excalidrawAPI,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}) => {
  const elements = useAtomValue(sceneElementsAtom);
  const files = useAtomValue(sceneFilesAtom);
  const selectionContext = useAtomValue(selectionContextAtom);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedImage = useMemo(
    () => getSelectedImageElement(elements, selectionContext.elementIds),
    [elements, selectionContext.elementIds],
  );

  const selectedFile = selectedImage
    ? getImageElementFile(selectedImage, files)
    : undefined;

  const handleReplace = async (
    element: ExcalidrawImageElement,
    blob: Blob,
    action: string,
    meta?: Record<string, unknown>,
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
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevert = async (entryFileId: string) => {
    if (!excalidrawAPI || !selectedImage || !files[entryFileId]) return;
    const file = files[entryFileId];
    const size = await getImageSizeFromDataURL(file.dataURL);
    const centerX = selectedImage.x + selectedImage.width / 2;
    const centerY = selectedImage.y + selectedImage.height / 2;
    const updatedElement = newElementWith(selectedImage, {
      fileId: file.id,
      width: size.width,
      height: size.height,
      x: centerX - size.width / 2,
      y: centerY - size.height / 2,
      customData: {
        ...(selectedImage.customData ?? {}),
        editHistory: [
          ...(selectedImage.customData?.editHistory ?? []),
          {
            id: `revert-${Date.now()}`,
            action: "revert",
            fileId: file.id,
            timestamp: Date.now(),
          },
        ],
      },
    }) as ExcalidrawImageElement;

    const updatedElements = elements.map((el) =>
      el.id === selectedImage.id ? updatedElement : el,
    );

    excalidrawAPI.updateScene({
      elements: updatedElements,
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
  };

  const historyEntries = Array.isArray(selectedImage?.customData?.editHistory)
    ? (selectedImage?.customData?.editHistory as {
        action: string;
        fileId: string;
        timestamp: number;
      }[])
    : [];

  return (
    <div className="chatcanvas-image-tools">
      <div className="chatcanvas-image-tools__header">
        <h3>Image Tools</h3>
        {selectedImage ? (
          <span className="chatcanvas-image-tools__status">
            Selected image
          </span>
        ) : (
          <span className="chatcanvas-image-tools__status">
            Select an image to enable
          </span>
        )}
      </div>

      <div className="chatcanvas-image-tools__actions">
        <button
          onClick={() => setActiveModal("crop")}
          disabled={!selectedImage || !selectedFile || isProcessing}
        >
          Crop
        </button>
        <button
          onClick={() => setActiveModal("edit")}
          disabled={!selectedImage || !selectedFile || isProcessing}
        >
          Edit
        </button>
        <button
          onClick={() => setActiveModal("extend")}
          disabled={!selectedImage || !selectedFile || isProcessing}
        >
          Extend
        </button>
        <button
          onClick={() => setActiveModal("upscale")}
          disabled={!selectedImage || !selectedFile || isProcessing}
        >
          Upscale
        </button>
      </div>

      {selectedImage && (
        <div className="chatcanvas-image-tools__history">
          <h4>Edit History</h4>
          {historyEntries.length === 0 && (
            <div className="chatcanvas-image-tools__hint">
              No edits yet. Use the tools above.
            </div>
          )}
          {historyEntries.map((entry) => (
            <div key={`${entry.fileId}-${entry.timestamp}`} className="chatcanvas-image-tools__history-row">
              <div>
                <div className="chatcanvas-image-tools__history-action">
                  {entry.action}
                </div>
                <div className="chatcanvas-image-tools__history-time">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <button
                className="chatcanvas-image-tools__history-button"
                onClick={() => handleRevert(entry.fileId)}
                disabled={!files[entry.fileId]}
              >
                Revert
              </button>
            </div>
          ))}
        </div>
      )}

      {activeModal === "crop" && selectedImage && selectedFile && (
        <CropModal
          imageSize={{ width: selectedImage.width, height: selectedImage.height }}
          onClose={() => setActiveModal(null)}
          onApply={async (crop) => {
            const blob = await cropImage(selectedImage, selectedFile, crop);
            await handleReplace(selectedImage, blob, "crop", crop);
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === "edit" && selectedFile && (
        <ImageEditorModal
          dataURL={selectedFile.dataURL}
          onClose={() => setActiveModal(null)}
          onApply={async (blob) => {
            if (!selectedImage) return;
            await handleReplace(selectedImage, blob, "edit");
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === "extend" && selectedImage && selectedFile && (
        <ExtendModal
          onClose={() => setActiveModal(null)}
          onApply={async ({ prompt, ...extension }) => {
            const blob = await runMockExtendJob({
              file: selectedFile,
              extension,
              prompt,
            });
            await handleReplace(selectedImage, blob, "extend", {
              prompt,
              ...extension,
            });
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === "upscale" && selectedImage && selectedFile && (
        <UpscaleModal
          onClose={() => setActiveModal(null)}
          onApply={async (scale) => {
            const blob = await runMockUpscaleJob({
              file: selectedFile,
              scale,
            });
            await handleReplace(selectedImage, blob, "upscale", { scale });
            setActiveModal(null);
          }}
        />
      )}
    </div>
  );
};
