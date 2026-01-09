import React, { useState } from "react";
import { ImageModal } from "./ImageModal";

export const CropModal = ({
  onClose,
  onApply,
  imageSize,
}: {
  onClose: () => void;
  onApply: (crop: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }) => void;
  imageSize: { width: number; height: number };
}) => {
  const [crop, setCrop] = useState({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });

  return (
    <ImageModal
      title="Crop image"
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
            onClick={() => onApply(crop)}
          >
            Apply crop
          </button>
        </>
      }
    >
      <p>Trim the image edges by pixel amount.</p>
      <div className="chatcanvas-image-tools__grid">
        {(["left", "top", "right", "bottom"] as const).map((side) => (
          <label key={side} className="chatcanvas-image-tools__field">
            <span>{side}</span>
            <input
              type="number"
              min={0}
              max={side === "left" || side === "right" ? imageSize.width : imageSize.height}
              value={crop[side]}
              onChange={(event) =>
                setCrop((prev) => ({
                  ...prev,
                  [side]: Number(event.target.value),
                }))
              }
            />
          </label>
        ))}
      </div>
      <div className="chatcanvas-image-tools__hint">
        Original size: {imageSize.width}×{imageSize.height}
      </div>
    </ImageModal>
  );
};
