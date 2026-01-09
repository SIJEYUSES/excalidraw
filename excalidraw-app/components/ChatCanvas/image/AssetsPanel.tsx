import React from "react";
import { useAtomValue } from "jotai";
import {
  sceneElementsAtom,
  sceneFilesAtom,
  selectionContextAtom,
} from "../atoms";
import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "./AssetsPanel.scss";

export const AssetsPanel = ({
  excalidrawAPI,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}) => {
  const elements = useAtomValue(sceneElementsAtom);
  const files = useAtomValue(sceneFilesAtom);
  const selectionContext = useAtomValue(selectionContextAtom);

  const imageElements = elements.filter((el) => el.type === "image");

  const handleSelect = (elementId: string) => {
    if (!excalidrawAPI) return;
    excalidrawAPI.updateScene({
      appState: {
        selectedElementIds: {
          [elementId]: true,
        },
      },
      captureUpdate: CaptureUpdateAction.NEVER,
    });

    const element = elements.find((el) => el.id === elementId);
    if (element) {
      excalidrawAPI.scrollToContent(element, { animate: true });
    }
  };

  return (
    <div className="chatcanvas-assets">
      {imageElements.length === 0 && (
        <div className="chatcanvas-assets__empty">No image assets yet.</div>
      )}
      <div className="chatcanvas-assets__grid">
        {imageElements.map((element) => {
          const file =
            "fileId" in element ? files[element.fileId] : undefined;
          const isSelected = selectionContext.elementIds.includes(element.id);
          return (
            <button
              key={element.id}
              className={`chatcanvas-assets__item ${
                isSelected ? "chatcanvas-assets__item--selected" : ""
              }`}
              onClick={() => handleSelect(element.id)}
            >
              {file ? (
                <img src={file.dataURL} alt="asset" />
              ) : (
                <div className="chatcanvas-assets__placeholder">Image</div>
              )}
              <span>{element.id.slice(0, 6)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
