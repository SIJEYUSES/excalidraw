import React, { useCallback, useEffect, useRef, useState } from "react";
import { ImageModal } from "./ImageModal";
import { randomId } from "@excalidraw/common";

type TextItem = {
  id: string;
  text: string;
  x: number;
  y: number;
};

type HistorySnapshot = {
  imageData: ImageData;
  textItems: TextItem[];
};

export const ImageEditorModal = ({
  dataURL,
  onClose,
  onApply,
}: {
  dataURL: string;
  onClose: () => void;
  onApply: (blob: Blob) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [textInput, setTextInput] = useState("Add label");
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [displayScale, setDisplayScale] = useState(1);

  const syncDisplayScale = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
      setDisplayScale(rect.width / canvas.width);
    }
  }, []);

  useEffect(() => {
    syncDisplayScale();
    window.addEventListener("resize", syncDisplayScale);
    return () => window.removeEventListener("resize", syncDisplayScale);
  }, [syncDisplayScale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([{ imageData: snapshot, textItems: [] }]);
      setHistoryIndex(0);
      setTextItems([]);
      setSelectedTextId(null);
      syncDisplayScale();
    };
    image.src = dataURL;
  }, [dataURL, syncDisplayScale]);

  const pushHistory = useCallback(
    (imageData: ImageData, nextTextItems: TextItem[]) => {
      setHistory((prev) => {
        const trimmed = prev.slice(0, historyIndex + 1);
        return [...trimmed, { imageData, textItems: nextTextItems }];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  const renderImageData = useCallback((imageData: ImageData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(imageData, 0, 0);
  }, []);

  const getPointerPosition = useCallback(
    (event: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / displayScale;
      const y = (event.clientY - rect.top) / displayScale;
      return { x, y };
    },
    [displayScale],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const position = getPointerPosition(event);
    if (!position) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#ff4d4d";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    setIsDrawing(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const position = getPointerPosition(event);
    if (!position) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(position.x, position.y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    pushHistory(snapshot, textItems);
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    const snapshot = history[nextIndex];
    if (!snapshot) return;
    renderImageData(snapshot.imageData);
    setTextItems(snapshot.textItems);
    setHistoryIndex(nextIndex);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const snapshot = history[nextIndex];
    if (!snapshot) return;
    renderImageData(snapshot.imageData);
    setTextItems(snapshot.textItems);
    setHistoryIndex(nextIndex);
  };

  const handleAddText = () => {
    if (!textInput.trim()) return;
    const nextItem: TextItem = {
      id: randomId(),
      text: textInput.trim(),
      x: 40,
      y: 60 + textItems.length * 32,
    };
    const nextItems = [...textItems, nextItem];
    setTextItems(nextItems);
    setSelectedTextId(nextItem.id);

    const snapshot = history[historyIndex];
    if (snapshot) {
      pushHistory(snapshot.imageData, nextItems);
    }
  };

  const handleDeleteText = () => {
    if (!selectedTextId) return;
    const nextItems = textItems.filter((item) => item.id !== selectedTextId);
    setTextItems(nextItems);
    setSelectedTextId(null);

    const snapshot = history[historyIndex];
    if (snapshot) {
      pushHistory(snapshot.imageData, nextItems);
    }
  };

  const handleTextPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    item: TextItem,
  ) => {
    const position = getPointerPosition(event);
    if (!position) return;
    setSelectedTextId(item.id);
    setDragState({
      id: item.id,
      offsetX: position.x - item.x,
      offsetY: position.y - item.y,
    });
  };

  const handleWrapperPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!dragState) return;
    const position = getPointerPosition(event);
    if (!position) return;
    setTextItems((prev) =>
      prev.map((item) =>
        item.id === dragState.id
          ? {
              ...item,
              x: Math.max(0, position.x - dragState.offsetX),
              y: Math.max(0, position.y - dragState.offsetY),
            }
          : item,
      ),
    );
  };

  const handleWrapperPointerUp = () => {
    if (!dragState) return;
    setDragState(null);
    const snapshot = history[historyIndex];
    if (snapshot) {
      pushHistory(snapshot.imageData, textItems);
    }
  };

  const handleAddRectangle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1f1f1f";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 60, 160, 80);
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    pushHistory(snapshot, textItems);
  };

  const drawTextItemsToCanvas = (
    ctx: CanvasRenderingContext2D,
    items: TextItem[],
  ) => {
    ctx.fillStyle = "#1f1f1f";
    ctx.font = "24px sans-serif";
    items.forEach((item) => {
      ctx.fillText(item.text, item.x, item.y);
    });
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snapshot = history[historyIndex];
    if (snapshot) {
      renderImageData(snapshot.imageData);
      drawTextItemsToCanvas(ctx, textItems);
    }
    canvas.toBlob((blob) => {
      if (blob) {
        onApply(blob);
      }
    }, "image/png");
  };

  return (
    <ImageModal
      title="Edit image"
      onClose={onClose}
      footer={
        <>
          <button
            className="chatcanvas-image-modal__button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="chatcanvas-image-modal__button chatcanvas-image-modal__button--primary"
            onClick={handleApply}
          >
            Save edits
          </button>
        </>
      }
    >
      <div className="chatcanvas-image-tools__row">
        <button
          className="chatcanvas-image-modal__button"
          onClick={handleUndo}
        >
          Undo
        </button>
        <button
          className="chatcanvas-image-modal__button"
          onClick={handleRedo}
        >
          Redo
        </button>
        <button
          className="chatcanvas-image-modal__button"
          onClick={handleAddRectangle}
        >
          Add shape
        </button>
        <input
          className="chatcanvas-image-tools__text"
          value={textInput}
          onChange={(event) => setTextInput(event.target.value)}
        />
        <button
          className="chatcanvas-image-modal__button"
          onClick={handleAddText}
        >
          Add text
        </button>
        <button
          className="chatcanvas-image-modal__button"
          onClick={handleDeleteText}
          disabled={!selectedTextId}
        >
          Delete text
        </button>
      </div>
      <div
        className="chatcanvas-image-tools__canvas-wrapper"
        onPointerMove={handleWrapperPointerMove}
        onPointerUp={handleWrapperPointerUp}
        onPointerLeave={handleWrapperPointerUp}
      >
        <canvas
          ref={canvasRef}
          className="chatcanvas-image-tools__canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        {textItems.map((item) => (
          <div
            key={item.id}
            className={`chatcanvas-image-tools__text-item ${
              selectedTextId === item.id
                ? "chatcanvas-image-tools__text-item--active"
                : ""
            }`}
            style={{
              left: item.x * displayScale,
              top: item.y * displayScale,
            }}
            onPointerDown={(event) => handleTextPointerDown(event, item)}
          >
            {item.text}
          </div>
        ))}
      </div>
      <div className="chatcanvas-image-tools__hint">
        Draw to doodle. Drag text labels to reposition them.
      </div>
    </ImageModal>
  );
};
