import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { selectionContextAtom, viewTransformAtom } from "../atoms";
import { sceneCoordsToViewportCoords } from "@excalidraw/common";
import { convertToExcalidrawElements, CaptureUpdateAction } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { InlineComposer } from "./InlineComposer";
import { SuggestionPalette } from "./SuggestionPalette";
import { createNoteGroup } from "../notes/createNoteGroup";

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    target.isContentEditable
  );
};

export const InlineComposerOverlay = ({
  excalidrawAPI,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}) => {
  const selectionContext = useAtomValue(selectionContextAtom);
  const viewTransform = useAtomValue(viewTransformAtom);
  const [isOpen, setIsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [value, setValue] = useState("");

  const closeComposer = useCallback(() => {
    setIsOpen(false);
    setShowSuggestions(false);
  }, []);

  useEffect(() => {
    if (selectionContext.count === 0) {
      closeComposer();
    }
  }, [closeComposer, selectionContext.count]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      if (selectionContext.count === 0) {
        return;
      }

      event.preventDefault();

      if (!isOpen) {
        setIsOpen(true);
        setShowSuggestions(false);
        return;
      }

      setShowSuggestions(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectionContext.count]);

  const anchorPosition = useMemo(() => {
    if (!selectionContext.bounds || !viewTransform) {
      return null;
    }

    const anchor = sceneCoordsToViewportCoords(
      {
        sceneX: selectionContext.bounds.x + selectionContext.bounds.width + 20,
        sceneY: selectionContext.bounds.y,
      },
      {
        zoom: { value: viewTransform.zoom },
        scrollX: viewTransform.scrollX,
        scrollY: viewTransform.scrollY,
        offsetLeft: viewTransform.offsetLeft,
        offsetTop: viewTransform.offsetTop,
      },
    );

    return {
      x: anchor.x,
      y: anchor.y,
    };
  }, [selectionContext.bounds, viewTransform]);

  const handleSubmit = useCallback(() => {
    if (!excalidrawAPI || !selectionContext.bounds || !value.trim()) {
      return;
    }

    const noteElements = createNoteGroup({
      text: value.trim(),
      selectionBounds: selectionContext.bounds,
      targetIds: selectionContext.elementIds,
    });

    const hydrated = convertToExcalidrawElements(noteElements, {
      regenerateIds: true,
    });

    const elements = excalidrawAPI.getSceneElements();
    excalidrawAPI.updateScene({
      elements: [...elements, ...hydrated],
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });

    setValue("");
    closeComposer();
  }, [closeComposer, excalidrawAPI, selectionContext.bounds, selectionContext.elementIds, value]);

  const handleSelectSuggestion = (suggestion: string) => {
    setValue((prev) => (prev ? `${prev}\n${suggestion}` : suggestion));
    setShowSuggestions(false);
  };

  if (!isOpen || !anchorPosition) {
    return null;
  }

  return (
    <>
      <InlineComposer
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        onClose={closeComposer}
        onOpenSuggestions={() => setShowSuggestions(true)}
        anchorPosition={anchorPosition}
      />
      {showSuggestions && (
        <SuggestionPalette
          anchorPosition={{
            x: anchorPosition.x,
            y: anchorPosition.y + 180,
          }}
          onSelect={handleSelectSuggestion}
          onClose={() => setShowSuggestions(false)}
        />
      )}
    </>
  );
};
