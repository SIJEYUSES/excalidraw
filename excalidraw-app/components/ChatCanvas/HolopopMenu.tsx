import React, { useCallback, useEffect, useRef, useState } from "react";
import { loadFromBlob } from "@excalidraw/excalidraw/data/blob";
import { CaptureUpdateAction, MIME_TYPES } from "@excalidraw/excalidraw";
import { newImageElement } from "@excalidraw/element";
import { randomId } from "@excalidraw/common";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import {
  buildImageFile,
  getImageSizeFromBlob,
  type ImageEditHistoryEntry,
  type ImageVersionEntry,
} from "./image/ImageOps";
import "./HolopopMenu.scss";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
]);

const normalizeImageBlob = async (file: File) => {
  if (file.type === "image/svg+xml") {
    const svgText = await file.text();
    const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
    const bitmap = await createImageBitmap(svgBlob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context unavailable");
    }
    ctx.drawImage(bitmap, 0, 0);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to generate PNG"));
        }
      }, MIME_TYPES.png);
    });
    return { blob: pngBlob, mimeType: MIME_TYPES.png };
  }
  return { blob: file, mimeType: file.type || MIME_TYPES.png };
};

const getViewportCenter = (excalidrawAPI: ExcalidrawImperativeAPI) => {
  const appState = excalidrawAPI.getAppState();
  const viewportWidth = appState.width || window.innerWidth;
  const viewportHeight = appState.height || window.innerHeight;
  const zoom = appState.zoom.value;
  return {
    x: -appState.scrollX + viewportWidth / 2 / zoom,
    y: -appState.scrollY + viewportHeight / 2 / zoom,
  };
};

interface HolopopMenuProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

export const HolopopMenu: React.FC<HolopopMenuProps> = ({
  excalidrawAPI,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const openInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeMenu, isOpen]);

  const handleNewScene = useCallback(() => {
    if (!excalidrawAPI) return;
    excalidrawAPI.updateScene({
      elements: [],
      appState: {
        selectedElementIds: {},
        selectedGroupIds: {},
        openDialog: null,
      },
      files: {},
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
    closeMenu();
  }, [closeMenu, excalidrawAPI]);

  const handleOpenScene = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!excalidrawAPI) return;
      const file = event.target.files?.[0];
      if (!file) return;
      const data = await loadFromBlob(file, null, null);
      excalidrawAPI.updateScene({
        elements: data.elements || [],
        appState: {
          ...data.appState,
          openDialog: null,
          selectedElementIds: {},
          selectedGroupIds: {},
        },
        files: data.files || {},
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      event.target.value = "";
      closeMenu();
    },
    [closeMenu, excalidrawAPI],
  );

  const handleImportImages = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!excalidrawAPI) return;
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      const existingElements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const dropPoint = getViewportCenter(excalidrawAPI);
      const newElements = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        if (!ACCEPTED_IMAGE_TYPES.has(file.type)) continue;
        const { blob, mimeType } = await normalizeImageBlob(file);
        const binaryFile = await buildImageFile(blob, mimeType);
        const { width, height } = await getImageSizeFromBlob(blob);
        const jobId = `menu-import-${randomId()}`;
        const historyEntry: ImageEditHistoryEntry = {
          id: randomId(),
          op: "import",
          from: null,
          to: binaryFile.id,
          ts: Date.now(),
          jobId,
        };
        const versionEntry: ImageVersionEntry = {
          id: randomId(),
          op: "import",
          from: null,
          to: binaryFile.id,
          ts: Date.now(),
          jobId,
        };

        excalidrawAPI.addFiles([binaryFile]);

        const imageElement = newImageElement({
          type: "image",
          status: "saved",
          fileId: binaryFile.id,
          x: dropPoint.x - width / 2 + index * 24,
          y: dropPoint.y - height / 2 + index * 24,
          width,
          height,
          strokeColor: appState.currentItemStrokeColor,
          backgroundColor: appState.currentItemBackgroundColor,
          fillStyle: appState.currentItemFillStyle,
          strokeWidth: appState.currentItemStrokeWidth,
          strokeStyle: appState.currentItemStrokeStyle,
          roughness: appState.currentItemRoughness,
          opacity: appState.currentItemOpacity,
          locked: false,
          customData: {
            source: { jobId },
            editHistory: [historyEntry],
            versionChain: [versionEntry],
          },
        });
        newElements.push(imageElement);
      }

      if (newElements.length > 0) {
        excalidrawAPI.updateScene({
          elements: [...existingElements, ...newElements],
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      }
      event.target.value = "";
      closeMenu();
    },
    [closeMenu, excalidrawAPI],
  );

  const openDialog = useCallback(
    (name: "imageExport" | "jsonExport") => {
      if (!excalidrawAPI) return;
      excalidrawAPI.updateScene({
        appState: { openDialog: { name } },
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
      closeMenu();
    },
    [closeMenu, excalidrawAPI],
  );

  return (
    <div className="holopop-menu" ref={menuRef}>
      <button
        type="button"
        className="holopop-menu__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Holopop menu"
      >
        <img src="/holopop-logo.svg" alt="Holopop" />
      </button>

      {isOpen && (
        <div className="holopop-menu__popover" role="menu">
          <button type="button" onClick={handleNewScene}>
            New
          </button>
          <button
            type="button"
            onClick={() => {
              openInputRef.current?.click();
              closeMenu();
            }}
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => {
              imageInputRef.current?.click();
              closeMenu();
            }}
          >
            Import Image
          </button>
          <div className="holopop-menu__divider" />
          <div className="holopop-menu__section-title">Export</div>
          <button type="button" onClick={() => openDialog("imageExport")}>
            Export PNG
          </button>
          <button type="button" onClick={() => openDialog("imageExport")}>
            Export SVG
          </button>
          <button type="button" onClick={() => openDialog("jsonExport")}>
            Export JSON
          </button>
          <div className="holopop-menu__divider" />
          <button
            type="button"
            onClick={() => {
              closeMenu();
              window.alert("Settings are coming soon.");
            }}
          >
            Settings
          </button>
          <button
            type="button"
            onClick={() => {
              closeMenu();
              window.alert("Holopop RenderCanvas — about info coming soon.");
            }}
          >
            About
          </button>
        </div>
      )}

      <input
        ref={openInputRef}
        className="holopop-menu__file-input"
        type="file"
        accept=".excalidraw,application/json"
        onChange={handleOpenScene}
      />
      <input
        ref={imageInputRef}
        className="holopop-menu__file-input"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        multiple
        onChange={handleImportImages}
      />
    </div>
  );
};
