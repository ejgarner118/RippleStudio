# BoardCadPort Project Description

## Purpose

`BoardCadPort` is a TypeScript monorepo that brings core BoardCAD-style surfboard design workflows to a modern React application, with a shared geometry/export engine and optional desktop packaging.

Primary goals:
- Provide practical board shaping/editing tools in browser-first UX.
- Preserve as much Java BoardCAD geometry behavior as possible (parity-oriented).
- Support mesh-based visualization and manufacturing/export workflows.
- Keep architecture maintainable with a split between app UI and reusable core engine.

## Repository Overview

Top-level structure:

- `apps/`
  - `boardcad-desktop/`: Main UI application (React + Vite). Despite folder name, this is web-first and can also be desktop-packaged via Tauri.
- `packages/`
  - `boardcad-core/`: Core domain/model/geometry/export/undo logic, used by the app.
- `boardcad-java/`
  - Legacy Java reference implementation used for behavior/parity comparison.
- `BoardTemplates/`
  - Template `.brd` files used as startup/new-board content.
- `docs/`
  - Project documentation and process docs (including this file).
- `.github/workflows/`
  - CI/release automation.

## Tech Stack

### Runtime + Language
- TypeScript (strict typing across app/core)
- Node.js (workspace tooling)
- React 19
- Vite
- Three.js + `@react-three/fiber` for 3D

### Testing + Quality
- Vitest in both app and core packages
- Workspace-level `verify` script for lint/test/build checks
- CI workflows in GitHub Actions

### Packaging + Deployment
- Web deployment pipeline (Vercel-oriented setup in repo)
- Optional Tauri shell for desktop builds (`apps/boardcad-desktop/src-tauri`)

## Monorepo and Build System

The root `package.json` uses npm workspaces:

- Workspaces: `packages/*`, `apps/*`
- Orchestrated scripts:
  - `dev`: starts web app development
  - `build`: builds core then web app
  - `test`: tests core and web app
  - `lint` / `verify`: combined checks for CI/release confidence

This split enables:
- fast local app iteration while importing core as source,
- shared geometry logic between UI flows and export paths,
- independent testing of algorithmic code (`boardcad-core`).

## Core Domain Model (`packages/boardcad-core`)

### Main Entities

- `BezierBoard`
  - Aggregate board object: metadata + principal splines (`outline`, `deck`, `bottom`) + cross-sections.
  - Handles consistency and lock updates (`checkAndFixContinousy`, `setLocks`).

- `BezierSpline`
  - Ordered spline control-point structure with editing helpers.

- `BezierKnot`
  - A knot with endpoint and two tangents; includes continuity/handle mode/mask behavior.

- `BezierBoardCrossSection`
  - Cross-section spline located at a station position.

### Why this matters

The whole shaping system is spline-driven. Most user operations eventually become control-point updates, then stabilization, then re-sampling into 2D/3D outputs.

## Geometry and Mesh Pipeline

### High-level flow

1. Board model + spline edits are maintained in-memory.
2. Spline/interpolation functions sample profile and cross-section geometry.
3. Mesh builders generate strip-based hull surfaces.
4. Mesh is transformed/validated and rendered/exported.

### Key files and responsibilities

- `packages/boardcad-core/src/geometry/boardInterpolation.ts`
  - Computes scalar properties along length (length, width, thickness, rocker usage).
  - Interpolates cross-sections for arbitrary stations.

- `packages/boardcad-core/src/geometry/boardSurfaceJava.ts`
  - Main parity-oriented hull surface mesh generation in Java coordinate convention.
  - Provides `buildJavaSurfaceMesh` and point sampling helpers.
  - Also includes coordinate conversion helper `javaPointsToThreeYUp`.

- `packages/boardcad-core/src/geometry/boardLoft.ts`
  - Orchestrates mesh sampling presets and build parameters used by app/export flows.

- `apps/boardcad-desktop/src/hooks/useBoardGeometry.ts`
  - App-level hook that invokes core sampling and mesh generation for viewport rendering.

### Coordinate conventions

There are Java-style coordinates in core mesh generation and Three.js Y-up coordinates for rendering. Conversion utilities standardize this handoff so rendering/export receives consistent axis orientation.

## Export System

### Export entry and mesh preparation

- `packages/boardcad-core/src/export/boardMeshExport.ts`
  - Builds final exportable mesh in Three coordinate space.
  - Acts as mesh integrity gate before format serialization.

### Mesh formats

- `meshStl.ts`: binary and ASCII STL generation.
- `meshObj.ts`: OBJ serialization.

### Non-mesh/print style outputs

- `packages/boardcad-core/src/print/*` and `print/index.ts`
  - SVG/spec sheet style renderers.
- Other placeholder/progressive export utilities are present for CAD/CAM workflow expansion.

## Editing and Undo/Redo Architecture

### Command pattern

- `packages/boardcad-core/src/undo/commandStack.ts`
  - `BoardCommand` contract and stack implementation.
  - Undo/redo behavior is deterministic and centralized.

- `packages/boardcad-core/src/commands/boardCommands.ts`
  - Concrete editing commands:
    - move/insert/remove control points,
    - cross-section add/remove/reorder,
    - continuity and handle mode changes,
    - auto-scale and rail adjustments.

### UI interaction bridge

- `apps/boardcad-desktop/src/hooks/useBoardCanvasEditing.ts`
  - Converts pointer interactions into command operations.
  - Captures before/after snapshots and pushes commands.

- `apps/boardcad-desktop/src/App.tsx`
  - Central app orchestration, including undo/redo invocation and export actions.

## App Structure (`apps/boardcad-desktop`)

Main concerns:
- 2D editing views for board control geometry.
- 3D preview with interactive diagnostics.
- file open/save/import/export UX.
- project state management and user workflow controls.

Important supporting modules:
- `src/lib/fileIo.ts`: browser-safe file handling abstractions.
- diagnostics/settings utilities for controlling mesh/render behavior.
- app tests (`src/App.test.ts` and supporting unit tests).

## Testing Strategy

### Core package tests

`packages/boardcad-core/src/**/*.test.ts` focuses on:
- geometry/mesh correctness and regressions,
- board model and spline behavior,
- command/undo reliability,
- export generation validity,
- BRD workflow parsing/writing confidence.

### App package tests

`apps/boardcad-desktop/src/**/*.test.ts` covers:
- main app behavior/smoke interactions,
- utilities and guard logic.

### CI expectation

CI pipelines run verify-oriented scripts to ensure changes are testable and releasable.

## Relationship to Legacy Java

This project ports and modernizes behavior from Java BoardCAD ideas. The `boardcad-java` folder is a parity reference, while production code executes in TypeScript.

What “parity-oriented” means here:
- naming and algorithm intent often mirror Java,
- behavior may be intentionally adapted for web UX, maintainability, and stability,
- tests are used to lock desired behavior during iterative parity improvements.

## Typical Data/Control Flow

1. User edits control points in 2D.
2. App records command(s) in command stack.
3. Core model stabilizes knot/spline state.
4. Geometry hook re-samples splines and rebuilds mesh.
5. 3D viewport redraws from updated mesh.
6. Export paths reuse core mesh generation + serializers.

## How Components Connect

- UI does **not** implement heavy geometry directly.
- `boardcad-core` provides deterministic algorithms and serialization.
- App layer coordinates state, interaction, and presentation.
- Export and preview both rely on shared core meshing to avoid divergent behavior.

## Current Strengths

- Clear separation between UI and geometry core.
- Strong regression testing footprint in core.
- Workspace structure supports incremental modernization.
- Web-first design with optional desktop packaging.

## Operational Notes for New Engineers

Recommended onboarding order:

1. Read root `README.md` and root `package.json` scripts.
2. Understand `BezierBoard`, `BezierSpline`, `BezierKnot` in `boardcad-core/src/model`.
3. Read `boardInterpolation.ts`, `boardSurfaceJava.ts`, `boardLoft.ts`.
4. Read `boardCommands.ts` and `commandStack.ts`.
5. Trace `useBoardGeometry.ts` and `App.tsx` in app.
6. Run tests in core and app to understand behavior contracts.

Development workflow:

- Implement in `boardcad-core` for algorithmic changes.
- Update app hooks/components only for interaction/presentation integration.
- Add or update tests in the same package where behavior changes.

## Maintenance and Documentation Convention

- Keep algorithmic docs near core geometry/export modules.
- Record project progress in `docs/DAILY_LOG.md`.
- For major behavior shifts, add both:
  - regression tests,
  - short design rationale in docs/changelog sections.

