import React, { useState } from "react";
import { useAtom } from "jotai";
import { isSidebarOpenAtom, sidebarWidthAtom } from "./atoms";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { ImageToolsPanel } from "./image/ImageToolsPanel";
import { AssetsPanel } from "./image/AssetsPanel";
import { ExportPanel } from "./image/ExportPanel";
import { LayersPanel } from "./layers/LayersPanel";
import "./SidebarDrawer.scss";

interface SidebarDrawerProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  excalidrawAPI,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(isSidebarOpenAtom);
  const [sidebarWidth, setSidebarWidth] = useAtom(sidebarWidthAtom);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = Math.max(200, Math.min(400, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, setSidebarWidth]);

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <div className="chatcanvas-sidebar" style={{ width: `${sidebarWidth}px` }}>
      <div className="chatcanvas-sidebar__header">
        <h2 className="chatcanvas-sidebar__title">Studio</h2>
        <button
          className="chatcanvas-sidebar__close"
          onClick={() => setIsSidebarOpen(false)}
          title="Close sidebar"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="chatcanvas-sidebar__content">
        <section className="chatcanvas-sidebar__section">
          <div className="chatcanvas-sidebar__section-header">
            <h3>Image Tools</h3>
            <span>Crop, edit, extend, upscale</span>
          </div>
          <ImageToolsPanel excalidrawAPI={excalidrawAPI} />
          <div className="chatcanvas-sidebar__section-subheader">
            <h4>Layers</h4>
            <span>Arrange and lock elements</span>
          </div>
          <LayersPanel excalidrawAPI={excalidrawAPI} />
        </section>

        <section className="chatcanvas-sidebar__section">
          <div className="chatcanvas-sidebar__section-header">
            <h3>Assets</h3>
            <span>Image files on canvas</span>
          </div>
          <AssetsPanel excalidrawAPI={excalidrawAPI} />
        </section>

        <section className="chatcanvas-sidebar__section">
          <div className="chatcanvas-sidebar__section-header">
            <h3>Export</h3>
            <span>Selection or full canvas</span>
          </div>
          <ExportPanel excalidrawAPI={excalidrawAPI} />
        </section>
      </div>

      {/* Resize Handle */}
      <div
        className="chatcanvas-sidebar__resizer"
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />
    </div>
  );
};
