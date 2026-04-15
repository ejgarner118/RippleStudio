# Ripple Studio Alpha Code Audit

This document captures what the current Alpha release can do today, based on code and documentation in this repository.

## Audit Scope and Method

- Scope: `apps/boardcad-desktop` and `packages/boardcad-core` (plus release/CI docs).
- Method: static code audit of user-facing UI, core command paths, file workflows, and tests.
- Goal: distinguish shipped capabilities from partial/stubbed parity items.

## Product and Architecture Snapshot

- Primary Alpha product is the web app in `apps/boardcad-desktop` (branded Ripple Studio).
- Core domain logic sits in `packages/boardcad-core`.
- Tauri desktop scaffolding exists in `apps/boardcad-desktop/src-tauri`, but frontend code is currently guarded to stay web-safe.
- Legacy Java code in `boardcad-java` is present for parity reference, not as current Alpha runtime.

## What Users Can Do in Alpha (Implemented)

## 1) Board authoring and editing

- Edit board splines in multiple targets: outline, deck profile, bottom profile, and cross-section.
- Add/remove control points on active spline.
- Drag control points and tangent handles.
- Toggle/assign handle modes (independent/aligned/mirrored).
- Edit selected control-point coordinates numerically.
- Undo/redo editing operations through command stack.

Primary evidence:
- `apps/boardcad-desktop/src/App.tsx`
- `packages/boardcad-core/src/commands/boardCommands.ts`
- `apps/boardcad-desktop/src/hooks/useBoardCanvasEditing.ts`

## 2) Cross-section workflows

- Add, remove, duplicate, and interpolate cross-sections.
- Move cross-sections earlier/later.
- Edit cross-section station (position).
- Add section from current template behavior.
- Rail refinement tools for active section (soften/harden).

Primary evidence:
- `apps/boardcad-desktop/src/App.tsx`
- `apps/boardcad-desktop/src/components/AppSidebar.tsx`
- `packages/boardcad-core/src/commands/boardCommands.ts`
- `packages/boardcad-core/src/board/railRefine.ts`

## 3) Guided shaping helpers

- Apply profile shaping in one action (nose rocker, tail rocker, thickness, max-thickness position).
- Add paired deck+bottom profile point.
- Guided empty-board flow that walks users through outline/deck/section sequence.

Primary evidence:
- `apps/boardcad-desktop/src/App.tsx`
- `apps/boardcad-desktop/src/components/EmptyGuidedBanner.tsx`
- `apps/boardcad-desktop/src/components/NewBoardModal.tsx`

## 4) New board creation and templates

- New-board presets: standard, shortboard, fish, longboard.
- Template load from public `BoardTemplates/*.brd`.
- Fallback to starter board when template file is unavailable.
- Blank advanced mode for free-form setup.

Primary evidence:
- `apps/boardcad-desktop/src/App.tsx`
- `apps/boardcad-desktop/src/components/NewBoardModal.tsx`
- `apps/boardcad-desktop/public/BoardTemplates/*.brd`
- `packages/boardcad-core/src/defaultBoards.ts`

## 5) 2D/3D visualization and interaction

- Multi-panel workspace with plan/profile/section/3D views.
- Interactive 2D canvases: pointer editing, pan, wheel zoom, keyboard pan/zoom.
- 3D preview with orbit controls and reset framing.
- Overlay toggles for grids, control points, guide points, deck/bottom visibility, and 3D loft.
- View reset controls for individual and all views.

Primary evidence:
- `apps/boardcad-desktop/src/components/WorkspacePanels.tsx`
- `apps/boardcad-desktop/src/board3d/BoardScene3D.tsx`
- `apps/boardcad-desktop/src/hooks/useCanvasWheelZoom.ts`
- `apps/boardcad-desktop/src/App.tsx`

## 6) Reference image overlays

- Load plan reference image and profile reference image.
- Enable/disable and patch reference image layer settings.
- Clear/reload image overlays with object URL lifecycle handling.

Primary evidence:
- `apps/boardcad-desktop/src/App.tsx`
- `apps/boardcad-desktop/src/types/referenceImage.ts`
- `apps/boardcad-desktop/src/canvas2d/drawReferenceImage.ts`

## 7) File workflows (.brd and exports)

- Import/open `.brd` from local picker.
- Save/download `.brd` and Save As.
- Open recent session files (with browser-session caveat, noted below).
- Export mesh formats: STL binary, STL ASCII, OBJ.
- Export SVG outputs: outline, profile, spec sheet.

Primary evidence:
- `apps/boardcad-desktop/src/components/AppToolbar.tsx`
- `apps/boardcad-desktop/src/components/ExportModal.tsx`
- `apps/boardcad-desktop/src/App.tsx`
- `packages/boardcad-core/src/brd/brdReader.ts`
- `packages/boardcad-core/src/brd/brdWriter.ts`
- `packages/boardcad-core/src/export/boardMeshExport.ts`
- `packages/boardcad-core/src/print/index.ts`

## 8) Validation, recovery, and safety

- Geometry issue detection (invalid/non-monotonic control-point progression, section ordering issues).
- One-click section-order repair (sort by station).
- Unsaved-change navigation protection (`beforeunload` guard).
- Error boundary and user-visible error banners/toasts.

Primary evidence:
- `apps/boardcad-desktop/src/App.tsx`
- `apps/boardcad-desktop/src/hooks/useWindowCloseGuard.ts`
- `apps/boardcad-desktop/src/components/ErrorBoundary.tsx`

## 9) UX, settings, and help

- Menu bar with File/Edit/View/Help actions.
- Keyboard shortcut support for major actions.
- Theme settings (system/light/dark) persisted in local storage.
- About, keyboard shortcuts, and BRD help dialogs.

Primary evidence:
- `apps/boardcad-desktop/src/components/AppToolbar.tsx`
- `apps/boardcad-desktop/src/components/KeyboardShortcutsModal.tsx`
- `apps/boardcad-desktop/src/hooks/useDesktopSettings.ts`
- `apps/boardcad-desktop/src/components/AboutModal.tsx`
- `apps/boardcad-desktop/src/components/BrdFormatHelpModal.tsx`

## 10) Test-backed confidence areas

- `.brd` parsing/writing and workflow tests.
- Mesh export tests for STL/OBJ.
- Print SVG tests.
- Command and geometry utility tests.
- Desktop file I/O behavior tests.

Primary evidence:
- `packages/boardcad-core/src/brd/*.test.ts`
- `packages/boardcad-core/src/export/*.test.ts`
- `packages/boardcad-core/src/print/*.test.ts`
- `packages/boardcad-core/src/commands/*.test.ts`
- `apps/boardcad-desktop/src/lib/fileIo.test.ts`

## Partial / In-Progress / Stubbed Areas

These areas are present but not fully implemented in Alpha:

- Loader stubs for non-BRD formats (`S3D`, `SRF`, `STEP`, generic CAD).
  - Evidence: `packages/boardcad-core/src/loaders/index.ts`
- Export stubs for CAD/NURBS/advanced outputs (e.g., some STEP/DXF/NURBS paths).
  - Evidence: `packages/boardcad-core/src/export/index.ts`
- Print mode surface is broader than current implementation; only outline/profile/spec sheet are wired.
  - Evidence: `packages/boardcad-core/src/print/index.ts`
- CAM/toolpath support is present as groundwork with partial behavior.
  - Evidence: `packages/boardcad-core/src/cam/index.ts`

## Known Alpha Constraints

- Open Recent is session-fragile in browser context when raw bytes are no longer cached.
  - Evidence: `apps/boardcad-desktop/src/lib/fileIo.ts`
- Desktop packaging exists but active app UX is currently optimized for web workflows.
  - Evidence: `apps/boardcad-desktop/scripts/check-no-tauri-imports.mjs`, `apps/boardcad-desktop/src-tauri/*`
- Some documentation mentions broad parity ambitions, while current UI intentionally focuses on core BRD editing + practical exports.

## Release Ops and Quality Gates

- CI runs lint/test/build verification on PRs and pushes.
  - Evidence: `.github/workflows/ci.yml`
- Bundle-size and tauri-import guard scripts are included in project checks.
  - Evidence: `apps/boardcad-desktop/scripts/check-bundle-size.mjs`, `apps/boardcad-desktop/scripts/check-no-tauri-imports.mjs`
- Windows release pipeline exists for tagged releases.
  - Evidence: `.github/workflows/release-windows.yml`

## Alpha Readiness Snapshot

Strengths:
- Core board editing loop is solid and coherent (2D/3D + command stack + practical exports).
- BRD handling appears mature relative to other file formats.
- Feature set is focused enough for alpha feedback cycles.

Primary risks:
- Non-BRD parity and advanced manufacturing outputs are still incomplete.
- Browser-first file persistence has usability edge cases compared to full native desktop.
- End-to-end integration coverage can be expanded as feature breadth grows.

