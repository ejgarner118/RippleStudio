# Ripple Studio (monorepo)

Desktop app for opening, editing, and exporting surfboard **`.brd`** files, built with **Tauri**, **React**, and **`@boardcad/core`**.

## Requirements

- **Node.js** 20+
- **Rust** toolchain (for `cargo` / `tauri build`)
- **Windows**: MSVC C++ build tools (for Tauri); the `ripple-desktop` dev script tries to locate `vcvars64.bat` automatically.

## Install

```bash
npm install
```

## Scripts (repository root)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server for the desktop UI (port 1420). |
| `npm run tauri:dev` | Full Tauri + Vite desktop session. |
| `npm run build` | Production build: core TypeScript + desktop `tsc` + Vite. |
| `npm test` | Core unit tests + desktop smoke tests. |
| `npm run lint` | Core `tsc` build + desktop `tsc --noEmit`. |
| `npm run verify` | Lint, test, and build (recommended before release). |

## Packages

- **`packages/boardcad-core`** — `.brd` I/O, geometry, mesh/SVG export, i18n, settings model.
- **`apps/boardcad-desktop`** — **Ripple Studio** Tauri shell (`ripple-desktop` npm workspace).

## Documentation

- **`docs/BRD_FILE_FORMAT.md`** — `.brd` property reference for implementers.

## Version

Bump **`apps/boardcad-desktop/package.json`** `version` together with **`apps/boardcad-desktop/src-tauri/tauri.conf.json`** `version`. The UI reads the npm version at build time via Vite (`VITE_APP_VERSION`).
