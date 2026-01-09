import React from "react";
import "./TopBar.scss";

interface TopBarProps {
  title?: string;
  onExport?: () => void;
  onSettings?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title = "RenderCanvas (Nano Banana Pro)",
  onExport,
  onSettings,
}) => {
  return (
    <div className="chatcanvas-topbar">
      <div className="chatcanvas-topbar__left">
        <div className="chatcanvas-topbar__brand">
          <img
            className="chatcanvas-topbar__logo"
            src="/holopop-logo.svg"
            alt="Holopop logo"
          />
          <h1 className="chatcanvas-topbar__title">{title}</h1>
        </div>
      </div>
      <div className="chatcanvas-topbar__right">
        {onExport && (
          <button
            className="chatcanvas-topbar__button"
            onClick={onExport}
            title="Export"
          >
            Export
          </button>
        )}
        {onSettings && (
          <button
            className="chatcanvas-topbar__button"
            onClick={onSettings}
            title="Settings"
          >
            ⚙️
          </button>
        )}
      </div>
    </div>
  );
};
