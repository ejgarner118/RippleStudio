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

## Releasing (Windows → GitHub)

CI runs **`npm run verify`** on pushes and pull requests to `main` / `master` (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

To publish installers for download:

1. Bump versions in **`apps/boardcad-desktop/package.json`** and **`apps/boardcad-desktop/src-tauri/tauri.conf.json`** (keep them identical, e.g. `0.1.1`).
2. Commit and push to `main`.
3. Create and push a **git tag** whose name starts with `v` and matches the app version, for example:
   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```
4. GitHub Actions runs [`.github/workflows/release-windows.yml`](.github/workflows/release-windows.yml): it builds the **NSIS `.exe`** and **`.msi`** bundles and creates a **Release** with those files attached.

**Manual try without a tag:** in the repo on GitHub, open **Actions → Release (Windows) → Run workflow**. When finished, download the **artifact** from that run (installers are not attached to a Release until you use a `v*` tag).

**Repository settings:** under **Settings → Actions → General → Workflow permissions**, choose **Read and write permissions** for the default `GITHUB_TOKEN` so the release job can create releases and upload assets.

**Code signing (optional):** unsigned builds work, but Windows SmartScreen may warn until you add an Authenticode certificate and configure Tauri’s Windows signing environment variables ([Tauri: Windows code signing](https://v2.tauri.app/distribute/sign-windows/)).
