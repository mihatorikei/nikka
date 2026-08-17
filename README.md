# Electron + Vite + Vue 3

Modern Electron desktop scaffold using Vue 3 and Vite. Development loads the Vite server in Electron; production is served over `app://` through `electron-serve`, including SPA route fallback.

## Requirements

Node.js 20.19+ (or 22.12+).

## Commands

```bash
npm install
npm run dev       # Vite + Electron, with Vue HMR
npm run build     # Renderer and Electron main/preload output
npm run start     # Run the already-built app
npm run dist      # Create an installer in release/
```

`electron/main.ts` is deliberately the only place that chooses between the Vite URL and `app://`; the renderer stays a conventional Vite/Vue application.

## Adding IPC

Keep `contextIsolation` and `sandbox` enabled. Add a deliberately narrow API in `electron/preload.ts`, then implement its `ipcMain.handle` counterpart in the main process; do not expose Electron or Node APIs directly to the renderer.
