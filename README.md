# Ripple Studio (monorepo)

Web app for opening, editing, and exporting surfboard **`.brd`** files, built with **React**, **Vite**, and **`@boardcad/core`**.

## Requirements

- **Node.js** 20+

## Install

```bash
npm install
```

## Scripts (repository root)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server for the web UI. |
| `npm run build` | Production build: core TypeScript + web `tsc` + Vite. |
| `npm test` | Core unit tests + web smoke tests. |
| `npm run lint` | Core `tsc` build + web typecheck + no-Tauri import guard. |
| `npm run verify` | Lint, test, and build (recommended before release). |

## Packages

- **`packages/boardcad-core`** — `.brd` I/O, geometry, mesh/SVG export, i18n, settings model.
- **`apps/boardcad-desktop`** — **Ripple Studio Web** app (`boardcad-web` npm workspace).

## Authoring features (current)

- Spline control-point authoring: add/remove points, tangent-handle drag, continuity toggle.
- Section suite: add/duplicate/interpolate/reorder sections, station editing, quick templates.
- New-board wizard presets: standard, shortboard, fish, and longboard.
- Presets are loaded from `/BoardTemplates/*.brd` when provided, with fallback to starter board.
- Validation + recovery: geometry warnings, section-order fix, and reset-current-spline fallback.
- Surf-specific shaping: rocker/thickness profile shaping panel, paired deck+bottom point insertion, and Shift-drag snap for controlled shaping.

## Documentation

- **`docs/BRD_FILE_FORMAT.md`** — `.brd` property reference for implementers.

## Version

Bump **`apps/boardcad-desktop/package.json`** `version`. The UI reads the npm version at build time via Vite (`VITE_APP_VERSION`).

## Deployment (Vercel)

CI runs **`npm run verify`** on pushes and pull requests to `main` / `master` (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

For deploy and domain cutover steps, use [`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md).
