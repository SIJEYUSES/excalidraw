import React from "react";
import { useAtomValue } from "jotai";
import { selectionContextAtom, sceneElementsAtom } from "../atoms";
import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import { newElementWith } from "@excalidraw/element";
import type { ExcalidrawElement } from "@excalidraw/element";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "./LayersPanel.scss";

const getElementLabel = (element: ExcalidrawElement) => {
  if (element.customData?.note) {
    return "note";
  }
  return element.type;
};

const moveElement = (
  elements: readonly ExcalidrawElement[],
  id: string,
  direction: "front" | "back",
) => {
  const index = elements.findIndex((el) => el.id === id);
  if (index === -1) return elements;
  const newElements = [...elements];
  const [element] = newElements.splice(index, 1);
  if (direction === "front") {
    newElements.push(element);
  } else {
    newElements.unshift(element);
  }
  return newElements;
};

const toggleHidden = (element: ExcalidrawElement) => {
  const wasHidden = Boolean(element.customData?.hidden);
  const previousOpacity =
    typeof element.customData?.previousOpacity === "number"
      ? element.customData.previousOpacity
      : element.opacity ?? 100;

  return newElementWith(element, {
    opacity: wasHidden ? previousOpacity : 0,
    customData: {
      ...(element.customData ?? {}),
      hidden: !wasHidden,
      previousOpacity,
    },
  });
};

export const LayersPanel = ({
  excalidrawAPI,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}) => {
  const elements = useAtomValue(sceneElementsAtom);
  const selectionContext = useAtomValue(selectionContextAtom);

  const handleUpdate = (updatedElements: readonly ExcalidrawElement[]) => {
    if (!excalidrawAPI) return;
    excalidrawAPI.updateScene({
      elements: updatedElements,
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
  };

  const handleMove = (id: string, direction: "front" | "back") => {
    handleUpdate(moveElement(elements, id, direction));
  };

  const handleToggleLock = (element: ExcalidrawElement) => {
    handleUpdate(
      elements.map((el) =>
        el.id === element.id ? newElementWith(el, { locked: !el.locked }) : el,
      ),
    );
  };

  const handleToggleHidden = (element: ExcalidrawElement) => {
    handleUpdate(
      elements.map((el) => (el.id === element.id ? toggleHidden(el) : el)),
    );
  };

  return (
    <div className="chatcanvas-layers">
      {elements.length === 0 && (
        <div className="chatcanvas-layers__empty">No elements yet.</div>
      )}
      {elements.map((element) => {
        const isSelected = selectionContext.elementIds.includes(element.id);
        const isHidden = Boolean(element.customData?.hidden);
        return (
          <div
            key={element.id}
            className={`chatcanvas-layers__row ${
              isSelected ? "chatcanvas-layers__row--selected" : ""
            }`}
          >
            <div className="chatcanvas-layers__label">
              <span className="chatcanvas-layers__type">
                {getElementLabel(element)}
              </span>
              <span className="chatcanvas-layers__id">{element.id}</span>
            </div>
            <div className="chatcanvas-layers__actions">
              <button
                onClick={() => handleMove(element.id, "front")}
                className="chatcanvas-layers__action"
              >
                Front
              </button>
              <button
                onClick={() => handleMove(element.id, "back")}
                className="chatcanvas-layers__action"
              >
                Back
              </button>
              <button
                onClick={() => handleToggleLock(element)}
                className="chatcanvas-layers__action"
              >
                {element.locked ? "Unlock" : "Lock"}
              </button>
              <button
                onClick={() => handleToggleHidden(element)}
                className="chatcanvas-layers__action"
              >
                {isHidden ? "Show" : "Hide"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
