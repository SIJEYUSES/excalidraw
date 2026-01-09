import React, { useState } from "react";
import { ImageModal } from "./ImageModal";

export const ExtendModal = ({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (extension: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    prompt: string;
  }) => void;
}) => {
  const [extension, setExtension] = useState({
    top: 64,
    right: 64,
    bottom: 64,
    left: 64,
    prompt: "",
  });

  return (
    <ImageModal
      title="Extend canvas"
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
            onClick={() => onApply(extension)}
          >
            Run extend
          </button>
        </>
      }
    >
      <p>Mock outpaint job. Expands the canvas and fills new area.</p>
      <div className="chatcanvas-image-tools__grid">
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <label key={side} className="chatcanvas-image-tools__field">
            <span>{side}</span>
            <input
              type="number"
              min={0}
              value={extension[side]}
              onChange={(event) =>
                setExtension((prev) => ({
                  ...prev,
                  [side]: Number(event.target.value),
                }))
              }
            />
          </label>
        ))}
      </div>
      <label className="chatcanvas-image-tools__field">
        <span>Prompt</span>
        <input
          type="text"
          value={extension.prompt}
          onChange={(event) =>
            setExtension((prev) => ({
              ...prev,
              prompt: event.target.value,
            }))
          }
          placeholder="Optional guidance"
        />
      </label>
    </ImageModal>
  );
};
