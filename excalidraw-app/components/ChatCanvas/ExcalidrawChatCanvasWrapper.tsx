import React, { ReactNode } from "react";
import { ChatCanvasShell } from "./ChatCanvasShell";
import { useAgentResponse } from "./useAgentResponse";
import type { SelectionContextPayload } from "./types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

interface ExcalidrawChatCanvasWrapperProps {
  children: ReactNode;
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

/**
 * This component wraps Excalidraw with ChatCanvas functionality.
 * It should be used inside the Excalidraw component as a child.
 */
export const ExcalidrawChatCanvasWrapper: React.FC<
  ExcalidrawChatCanvasWrapperProps
> = ({
  children,
  excalidrawAPI,
}) => {
  // Handle agent responses
  const { handleAgentResponse, applyAgentActions } =
    useAgentResponse(excalidrawAPI);

  const handleSendMessage = (
    message: string,
    context: SelectionContextPayload,
  ) => {
    handleAgentResponse(message, context);
  };

  return (
    <ChatCanvasShell
      excalidrawAPI={excalidrawAPI}
      onSendMessage={handleSendMessage}
      onApplyActions={applyAgentActions}
    >
      {children}
    </ChatCanvasShell>
  );
};
