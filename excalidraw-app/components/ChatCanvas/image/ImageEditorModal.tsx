import React, { useEffect, useRef, useState } from "react";
import { ImageModal } from "./ImageModal";

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
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [text, setText] = useState("Add label");

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
      setHistory([snapshot]);
      setHistoryIndex(0);
    };
    image.src = dataURL;
  }, [dataURL]);

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), snapshot]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#ff4d4d";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    pushHistory();
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const nextIndex = historyIndex - 1;
    ctx.putImageData(history[nextIndex], 0, 0);
    setHistoryIndex(nextIndex);
  };

  const handleAddText = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#1f1f1f";
    ctx.font = "24px sans-serif";
    ctx.fillText(text, 24, 48);
    pushHistory();
  };

  const handleAddRectangle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1f1f1f";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 60, 160, 80);
    pushHistory();
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
          onClick={handleAddRectangle}
        >
          Add shape
        </button>
        <input
          className="chatcanvas-image-tools__text"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button
          className="chatcanvas-image-modal__button"
          onClick={handleAddText}
        >
          Add text
        </button>
      </div>
      <div className="chatcanvas-image-tools__canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="chatcanvas-image-tools__canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
      <div className="chatcanvas-image-tools__hint">
        Draw directly on the canvas to doodle.
      </div>
    </ImageModal>
  );
};
