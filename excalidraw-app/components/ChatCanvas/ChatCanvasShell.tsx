import React, { ReactNode, useCallback, useState } from "react";
import { useAtomValue } from "jotai";
import { isChatPanelOpenAtom, isSidebarOpenAtom } from "./atoms";
import { TopBar } from "./TopBar";
import { ChatPanel } from "./ChatPanel";
import { SidebarDrawer } from "./SidebarDrawer";
import type { AgentAction, SelectionContextPayload } from "./types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { InlineComposerOverlay } from "./composer/InlineComposerOverlay";
import { FloatingImageToolbar } from "./image/FloatingImageToolbar";
import { useImageDrop } from "./dnd/useImageDrop";
import "./ChatCanvasShell.scss";

interface ChatCanvasShellProps {
  children: ReactNode;
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  onSendMessage?: (message: string, context: SelectionContextPayload) => void;
  onApplyActions?: (actions: AgentAction[]) => void;
  onExport?: () => void;
  onSettings?: () => void;
  title?: string;
}

export const ChatCanvasShell: React.FC<ChatCanvasShellProps> = ({
  children,
  excalidrawAPI,
  onSendMessage,
  onApplyActions,
  onExport,
  onSettings,
  title = "RenderCanvas (Nano Banana Pro)",
}) => {
  const isChatPanelOpen = useAtomValue(isChatPanelOpenAtom);
  const isSidebarOpen = useAtomValue(isSidebarOpenAtom);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(
    null,
  );
  const { handleDragOver, handleDragLeave, handleDrop, isDragActive } =
    useImageDrop(excalidrawAPI);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      setPointer({ x: event.clientX, y: event.clientY });
    },
    [],
  );

  const handlePointerLeave = useCallback(() => {
    setPointer(null);
  }, []);

  return (
    <div className="chatcanvas-shell">
      {/* Top Bar */}
      <TopBar title={title} onExport={onExport} onSettings={onSettings} />

      {/* Main Content Area */}
      <div className="chatcanvas-shell__main">
        {/* Left Sidebar */}
        {isSidebarOpen && <SidebarDrawer />}

        {/* Canvas Area */}
        <div
          className={`chatcanvas-shell__canvas-wrapper ${
            isDragActive ? "chatcanvas-shell__canvas-wrapper--drag" : ""
          }`}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {children}
          <InlineComposerOverlay excalidrawAPI={excalidrawAPI} />
          <FloatingImageToolbar excalidrawAPI={excalidrawAPI} pointer={pointer} />
          {isDragActive && (
            <div className="chatcanvas-shell__drop-indicator">
              Drop images to add them to the canvas
            </div>
          )}
        </div>

        {/* Right Chat Panel */}
        {isChatPanelOpen && (
          <ChatPanel
            excalidrawAPI={excalidrawAPI}
            onSendMessage={onSendMessage}
            onApplyActions={onApplyActions}
          />
        )}
      </div>
    </div>
  );
};

export { TopBar, ChatPanel, SidebarDrawer };
export * from "./atoms";
