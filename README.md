# RenderCanvas (Nano Banana Pro)

RenderCanvas (Nano Banana Pro) is a Lovart-inspired, image-first canvas experience focused on fast visual iteration. The current build ships a front-end-only workflow with mock AI image operations and a floating image toolbar.

## What’s implemented

- ChatCanvas-inspired UI shell with a centered canvas and right-side chat panel.
- Drag & drop images (PNG/JPG/WEBP/SVG → rasterized) directly onto the canvas.
- Hover/selection floating toolbar for image actions.
- Image operations:
  - Crop (front-end)
  - Edit (front-end text/doodle editor with undo/redo)
  - Extend (mock outpaint)
  - Upscale (mock HQ resize)
  - Layers (bring forward/back, lock/unlock)
  - Replace & download
- Image metadata stored in `element.customData` with source jobId, edit history, and version chain.

## Mocked backend adapters

The UI retains adapter endpoints (mocked in the front end):

- `POST /api/image/extend`
- `POST /api/image/upscale`

## Local development

```bash
# install dependencies
npm install

# start the app (ChatCanvas UI)
npm run dev
# open http://localhost:3000/?ui=chatcanvas
```

## Build

```bash
npm run build
npm run preview
```

## License

MIT (see `LICENSE`).
