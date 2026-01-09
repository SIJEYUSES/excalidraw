import React, { useEffect, useRef } from "react";
import "./InlineComposer.scss";

interface InlineComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  onOpenSuggestions: () => void;
  anchorPosition: { x: number; y: number };
}

export const InlineComposer: React.FC<InlineComposerProps> = ({
  value,
  onChange,
  onSubmit,
  onClose,
  onOpenSuggestions,
  anchorPosition,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }

    if (event.key === "Tab") {
      event.preventDefault();
      onOpenSuggestions();
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div
      className="chatcanvas-inline-composer"
      style={{ left: anchorPosition.x, top: anchorPosition.y }}
    >
      <div className="chatcanvas-inline-composer__label">Inline note</div>
      <textarea
        ref={inputRef}
        className="chatcanvas-inline-composer__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a directive… (Enter to drop note, Shift+Enter for newline)"
        rows={3}
      />
      <div className="chatcanvas-inline-composer__hint">
        Tab: suggestions · Enter: drop note · Esc: close
      </div>
    </div>
  );
};
