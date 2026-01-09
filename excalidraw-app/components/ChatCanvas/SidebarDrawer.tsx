import React, { useState } from "react";
import { useAtom } from "jotai";
import { isSidebarOpenAtom, sidebarWidthAtom } from "./atoms";
import "./SidebarDrawer.scss";

export const SidebarDrawer: React.FC = () => {
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
    <div
      className="chatcanvas-sidebar chatcanvas-sidebar--empty"
      style={{ width: `${sidebarWidth}px` }}
    >
      <button
        className="chatcanvas-sidebar__close"
        onClick={() => setIsSidebarOpen(false)}
        title="Close sidebar"
      >
        ✕
      </button>
      <div
        className="chatcanvas-sidebar__resizer"
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />
    </div>
  );
};
