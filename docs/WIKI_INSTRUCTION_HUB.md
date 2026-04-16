# Ripple Studio Wiki and Instruction Hub

This page is the practical operator guide for shaping, inspection, project iteration, and CNC handoff in Ripple Studio.

It is designed for "scan-to-deep-dive" learning:
- quick-start first
- mode-by-mode workflows second
- geometry and production deep dives last

---

## Quick Start Bento

### 1) First Curve (2-minute flow)
1. Open a board in `Create`.
2. Keep `Edit` expanded in the sidebar.
3. Select `Plan`, `Profile`, or `Section` tab.
4. Click an anchor control point, drag to shape.
5. Use mouse wheel to zoom, middle mouse to zoom in 3D, right mouse to pan in 3D.
6. Generate CAM preview in `Output`.

### 2) Keyboard shortcuts (core)
- `A`: Insert control point
- `Del`: Remove selected point
- `C`: Cycle handle mode
- `+` / `-`: Zoom active 2D panel
- Arrow keys: Pan active 2D panel

### 3) Glossary (shaper -> CAD)
- Nose flip -> Positive rocker rise near nose stations
- Rail tuck -> Cross-section rail depth transition below apex
- Ghosting -> Baseline comparison overlay and delta metrics
- Stepover -> Lateral distance between adjacent CAM passes

---

## Workspace Anatomy

The app uses two primary regions:
- **Sidebar**: mode-specific controls and diagnostics
- **Workspace Tabs**: full-height active view (`Plan`, `Profile`, `Section`, `3D`, `CAM` in Output)

Mode behavior:
- `Create`: editable
- `Project`: editable
- `Inspect`: read-only
- `Output`: read-only
- `Display`: read-only

---

## Mode Workflows

## Create
Primary shaping mode.
- Sidebar first expanded section: `Edit`
- All other sections start collapsed
- Typical flow:
  1. Set spline target (`Outline`, `Deck`, `Bottom`, `Cross-section`)
  2. Shape anchors/tangents in tabbed views
  3. Refine rails/fins/profile as needed
  4. Validate before export

## Inspect
Read-only board analysis mode.
- No geometry editing in canvases
- 3D look controls available for material/lighting inspection
- Use for visual QA and dimensional review

## Project
Editable + project lifecycle mode.
- `Edit` remains the first expanded section
- `Project library` supports snapshots, reopen, and metadata
- Best for versioned shaping sessions

## Output
Read-only production prep mode.
- First expanded section: `CAM preview and QA`
- Includes workspace `CAM` tab with 3D toolpath preview
- Use reset per panel without forced tab switching

## Display
Read-only presentation/overlay control mode.
- First expanded section: `View`
- Good for references and presentation passes

---

## Computational Geometry Fundamentals

Ripple Studio geometry combines:
- spline-based 2D control curves
- sampled board metrics along board length
- lofted 3D preview mesh for shape verification

Practical interpretation:
- `Plan` controls footprint and width distribution
- `Profile` controls rocker line and thickness trend
- `Section` controls rail behavior and apex/tuck character

---

## Iterative Versioning and Ghosting

Use snapshots and baseline comparison to measure improvements:
1. Save project snapshot at key milestones
2. Set baseline for delta review
3. Compare length/width/thickness/volume deltas
4. Iterate intentionally, not by guesswork

Recommended cadence:
- Snapshot before major rail edits
- Snapshot before fin layout template changes
- Snapshot before CAM generation

---

## Production Pipeline (CAM and Export)

Current CAM stack in app:
- deterministic raster deck toolpath generation
- rough + finish pass profiles
- safe-Z rapids and lead-in/out handling
- CAM preview with rough/finish/rapid color separation

Export path:
1. Generate CAM preview
2. Review path continuity and bounds
3. Export `.nc` g-code
4. Validate in machine-side simulator before cutting

---

## CAM Deep Dive: What "Correct" Should Mean

For production-grade confidence, toolpath quality should satisfy:
- deterministic outputs for same board/profile
- configurable rough/finish pass strategy
- stepover and feed linked to cutter/material profile
- safe entry/exit with predictable retract behavior
- envelope checks and warnings before export

Known next-level requirements:
- cutter diameter compensation
- nose/tail edge strategy improvements
- machine profile presets (GRBL/LinuxCNC/Fanuc style posts)
- simulation parity checks (preview vs emitted g-code)

---

## Free/Open References for CAM Strategy

These are strong free references for algorithms, operation modeling, and post processing:

1. **OpenCAMLib** (LGPL)
- C++ CAM kernel (drop-cutter/push-cutter)
- Multiple cutter geometries and robust geometric contact logic
- GitHub: [aewallin/opencamlib](https://github.com/aewallin/opencamlib)

2. **FreeCAD Path Workbench**
- Mature open-source job/operation/controller model
- Roughing + finishing workflows and tool-controller separation
- Good reference for operation graph and user-facing CAM structure

3. **BlenderCAM (Fabex)**
- Open-source surfacing strategies (`Parallel`, `Cross`, `Spiral`, etc.)
- Useful reference for 3-axis surfacing patterns and post handling
- GitHub: [vilemnovak/blendercam](https://github.com/vilemnovak/blendercam)

4. **Kiri:Moto** (MIT)
- Browser-native CAM workflow and preview/animate UX
- Useful UI/interaction reference for web-first CAM environments

Recommended practical path for Ripple Studio:
- Keep in-app deterministic generator for baseline workflow
- Borrow operation model and pass semantics from FreeCAD Path concepts
- Validate geometric strategy against OpenCAMLib-style kernels where needed
- Keep browser-side UX responsive using Kiri:Moto-style stage separation

---

## Instruction Hub Technical Blueprint (UI Spec)

Use a three-pane layout in a dedicated wiki page:
- Pane 1: sticky navigator tree
- Pane 2: knowledge content area
- Pane 3: dynamic "on this page" outline

Suggested CSS variables:

```css
:root {
  --wiki-sidebar-width: 280px;
  --code-bg: rgba(0, 245, 255, 0.05);
  --anchor-hover: #00F5FF;
  --content-max-width: 850px;
}

.instruction-callout {
  border-left: 4px solid var(--ui-accent);
  background: var(--glass-card);
  padding: 24px;
  border-radius: 0 16px 16px 0;
}
```

---

## Best Practices Checklist

- Start in `Create`, finish in `Output`
- Keep only necessary overlays enabled while editing
- Validate geometry before CAM export
- Confirm CAM bounds and warnings every run
- Save snapshots before major changes
- Verify machine-side simulation before production cut

