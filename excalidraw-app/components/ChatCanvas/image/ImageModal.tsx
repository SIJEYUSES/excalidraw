import React from "react";
import "./ImageModal.scss";

export const ImageModal = ({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) => {
  return (
    <div className="chatcanvas-image-modal__backdrop" role="dialog">
      <div className="chatcanvas-image-modal">
        <div className="chatcanvas-image-modal__header">
          <h3>{title}</h3>
          <button
            className="chatcanvas-image-modal__close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="chatcanvas-image-modal__body">{children}</div>
        {footer && (
          <div className="chatcanvas-image-modal__footer">{footer}</div>
        )}
      </div>
    </div>
  );
};
