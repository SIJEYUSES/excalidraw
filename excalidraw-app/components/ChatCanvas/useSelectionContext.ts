import { getDefaultStore } from "jotai";
import {
  selectionContextAtom,
  sceneElementsAtom,
  sceneFilesAtom,
  viewTransformAtom,
} from "./atoms";
import { getCommonBounds } from "@excalidraw/element";
import { isTextElement } from "@excalidraw/element";
import type { ExcalidrawElement } from "@excalidraw/element";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import type { ElementContext, SelectionBounds, ViewTransform } from "./types";

const store = getDefaultStore();

const buildSelectionSummary = (elements: readonly ExcalidrawElement[]) => {
  if (elements.length === 0) {
    return "";
  }

  const counts = elements.reduce<Record<string, number>>((acc, el) => {
    acc[el.type] = (acc[el.type] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([type, count]) => `${count} ${type}`)
    .join(", ");
};

const getSelectionBounds = (
  elements: readonly ExcalidrawElement[],
): SelectionBounds | null => {
  if (!elements.length) return null;
  const [minX, minY, maxX, maxY] = getCommonBounds(elements);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

const getViewTransform = (appState: AppState): ViewTransform => ({
  scrollX: appState.scrollX,
  scrollY: appState.scrollY,
  zoom: appState.zoom.value,
  offsetLeft: appState.offsetLeft,
  offsetTop: appState.offsetTop,
});

/**
 * Sync ChatCanvas state from Excalidraw onChange.
 */
export const syncChatCanvasState = (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  files: BinaryFiles,
) => {
  const selectedElementIds = appState.selectedElementIds || {};
  const selectedIds = Object.keys(selectedElementIds).filter(
    (id) => selectedElementIds[id],
  );
  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const bounds = getSelectionBounds(selectedElements);
  const fileIds = selectedElements
    .filter((el) => el.type === "image" && "fileId" in el && el.fileId)
    .map((el) => (el as ExcalidrawElement & { fileId: string }).fileId);

  store.set(sceneElementsAtom, elements);
  store.set(sceneFilesAtom, files);
  store.set(viewTransformAtom, getViewTransform(appState));
  store.set(selectionContextAtom, {
    elementIds: selectedIds,
    count: selectedIds.length,
    bounds,
    fileIds,
    summary: buildSelectionSummary(selectedElements),
  });
};

/**
 * Helper function to extract element details for sending to the agent.
 * This creates a structured payload of the selected elements.
 */
export const extractElementContext = (
  elements: readonly ExcalidrawElement[],
  selectedElementIds: string[],
): ElementContext[] => {
  return selectedElementIds
    .map((id) => {
      const element = elements.find((el) => el.id === id);
      if (!element) return null;

      const baseContext: ElementContext = {
        id: element.id,
        type: element.type,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        angle: element.angle,
        strokeColor: element.strokeColor,
        backgroundColor: element.backgroundColor,
        fillStyle: element.fillStyle,
        strokeWidth: element.strokeWidth,
        frameId: element.frameId,
        groupIds: element.groupIds,
      };

      if (isTextElement(element)) {
        return {
          ...baseContext,
          text: element.text,
          fontSize: element.fontSize,
          fontFamily: element.fontFamily,
          textAlign: element.textAlign,
        };
      }

      if ("text" in element && typeof element.text === "string") {
        return {
          ...baseContext,
          text: element.text,
        };
      }

      return baseContext;
    })
    .filter((context): context is ElementContext => context !== null);
};
