import React from "react";
import "./SuggestionPalette.scss";

const defaultSuggestions = [
  "Enhance contrast",
  "Add breathing space",
  "Highlight subject",
  "Replace background",
  "Add subtle shadow",
  "Add a title",
  "Warm lighting",
  "Simplify palette",
  "Increase sharpness",
  "Crop tighter",
  "Add gradient",
  "Reduce noise",
];

interface SuggestionPaletteProps {
  onSelect: (suggestion: string) => void;
  onClose: () => void;
  anchorPosition: { x: number; y: number };
  suggestions?: string[];
}

export const SuggestionPalette: React.FC<SuggestionPaletteProps> = ({
  onSelect,
  onClose,
  anchorPosition,
  suggestions = defaultSuggestions,
}) => {
  return (
    <div
      className="chatcanvas-suggestion-palette"
      style={{ left: anchorPosition.x, top: anchorPosition.y }}
    >
      <div className="chatcanvas-suggestion-palette__header">
        Suggestions
        <button
          className="chatcanvas-suggestion-palette__close"
          onClick={onClose}
          title="Close suggestions"
        >
          ✕
        </button>
      </div>
      <div className="chatcanvas-suggestion-palette__chips">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            className="chatcanvas-suggestion-palette__chip"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
      <div className="chatcanvas-suggestion-palette__hint">
        Click a chip to insert into the composer.
      </div>
    </div>
  );
};
