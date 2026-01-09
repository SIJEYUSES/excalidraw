import React from "react";
import { useAtomValue } from "jotai";
import { sceneElementsAtom, sceneFilesAtom, selectionContextAtom } from "../atoms";
import { exportToBlob, MIME_TYPES } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "./ExportPanel.scss";

const downloadBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

export const ExportPanel = ({
  excalidrawAPI,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}) => {
  const elements = useAtomValue(sceneElementsAtom);
  const files = useAtomValue(sceneFilesAtom);
  const selectionContext = useAtomValue(selectionContextAtom);

  const handleExportSelection = async () => {
    if (!excalidrawAPI) return;
    const selected = elements.filter((el) =>
      selectionContext.elementIds.includes(el.id),
    );
    if (!selected.length) return;
    const blob = await exportToBlob({
      elements: selected,
      appState: {
        ...excalidrawAPI.getAppState(),
        exportBackground: true,
      },
      files,
      mimeType: MIME_TYPES.png,
    });
    downloadBlob(blob, "selection.png");
  };

  const handleExportCanvas = async () => {
    if (!excalidrawAPI) return;
    const blob = await exportToBlob({
      elements,
      appState: {
        ...excalidrawAPI.getAppState(),
        exportBackground: true,
      },
      files,
      mimeType: MIME_TYPES.png,
    });
    downloadBlob(blob, "canvas.png");
  };

  return (
    <div className="chatcanvas-export">
      <button onClick={handleExportSelection} disabled={!selectionContext.count}>
        Export selection
      </button>
      <button onClick={handleExportCanvas}>Export canvas</button>
    </div>
  );
};
