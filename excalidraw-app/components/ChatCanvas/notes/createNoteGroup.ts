import { randomId } from "@excalidraw/common";
import type { ExcalidrawElementSkeleton } from "@excalidraw/element";
import type { SelectionBounds } from "../types";

interface CreateNoteGroupInput {
  text: string;
  selectionBounds: SelectionBounds;
  targetIds: string[];
}

export const createNoteGroup = ({
  text,
  selectionBounds,
  targetIds,
}: CreateNoteGroupInput): ExcalidrawElementSkeleton[] => {
  const noteWidth = 240;
  const noteHeight = 120;
  const offset = 40;

  const noteX = selectionBounds.x + selectionBounds.width + offset;
  const noteY = selectionBounds.y;
  const noteCenterX = noteX + noteWidth / 2;
  const noteCenterY = noteY + noteHeight / 2;
  const targetCenterX = selectionBounds.x + selectionBounds.width / 2;
  const targetCenterY = selectionBounds.y + selectionBounds.height / 2;

  const groupId = randomId();
  const noteMetadata = {
    note: {
      targetIds,
    },
  };

  const rect: ExcalidrawElementSkeleton = {
    type: "rectangle",
    x: noteX,
    y: noteY,
    width: noteWidth,
    height: noteHeight,
    strokeColor: "#2f2f2f",
    backgroundColor: "#fff6d6",
    fillStyle: "solid",
    strokeWidth: 1,
    roughness: 0,
    groupIds: [groupId],
    customData: noteMetadata,
  };

  const textElement: ExcalidrawElementSkeleton = {
    type: "text",
    x: noteX + 12,
    y: noteY + 12,
    width: noteWidth - 24,
    height: noteHeight - 24,
    text,
    fontSize: 16,
    fontFamily: 1,
    textAlign: "left",
    verticalAlign: "top",
    strokeColor: "#1f1f1f",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    groupIds: [groupId],
    customData: noteMetadata,
  };

  const arrow: ExcalidrawElementSkeleton = {
    type: "arrow",
    x: noteCenterX,
    y: noteCenterY,
    width: targetCenterX - noteCenterX,
    height: targetCenterY - noteCenterY,
    points: [
      [0, 0],
      [targetCenterX - noteCenterX, targetCenterY - noteCenterY],
    ],
    strokeColor: "#2f2f2f",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    roughness: 0,
    startArrowhead: null,
    endArrowhead: "arrow",
    groupIds: [groupId],
    customData: noteMetadata,
  };

  return [rect, textElement, arrow];
};
