import React, { useState } from "react";
import { ImageModal } from "./ImageModal";

export const UpscaleModal = ({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (scale: number) => void;
}) => {
  const [scale, setScale] = useState(2);

  return (
    <ImageModal
      title="Upscale image"
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
            onClick={() => onApply(scale)}
          >
            Upscale
          </button>
        </>
      }
    >
      <p>HQ resize (mock). Choose a scaling factor (not true SR).</p>
      <div className="chatcanvas-image-tools__row">
        {[2, 4].map((value) => (
          <button
            key={value}
            className={`chatcanvas-image-tools__chip ${
              scale === value ? "chatcanvas-image-tools__chip--active" : ""
            }`}
            onClick={() => setScale(value)}
          >
            {value}×
          </button>
        ))}
      </div>
    </ImageModal>
  );
};
