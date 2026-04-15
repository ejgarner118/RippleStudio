# Competitor Feature Research and Top 20 Opportunity List

This document summarizes notable capabilities from AKUShaper, Shape3d, and BoardCAD, then proposes the top 20 features worth evaluating for Ripple Studio after Alpha.

## Sources Used

- AKUShaper product and plan pages:
  - <https://akushaper.com/software>
  - <https://help.akushaper.com/article/70-plans-pricing>
- Shape3d product/features pages:
  - <http://www.shape3d.com/PRODUCTS/Features.aspx>
  - <https://www.shape3d.com/products/Design.aspx>
  - <https://www.shape3d.com/products/DesignPro.aspx>
- BoardCAD public docs/wiki/project pages:
  - <https://havardnj.github.io/boardcad-le/user_guide.html>
  - <https://sourceforge.net/p/boardcad/wiki/Home/>
  - <https://sourceforge.net/projects/boardcad/>

Note: competitor marketing pages can change over time, and some listed capabilities vary by pricing tier.

## Competitor Highlights by Platform

## AKUShaper (commonly highlighted)

- Board manager/project organization at scale.
- Automated scaling and rocker adjustment tools.
- Advanced print packs (outline/rocker/slices).
- Ghost board overlay and comparative analysis.
- Rail analysis and rail curve refinement.
- Volume section and center-of-mass style analysis.
- Multiple manufacturing/export targets (tier-dependent, e.g., OBJ/STL/IGES/DXF).
- Toolpath preview and protected distribution formats (tier-dependent).

## Shape3d (commonly highlighted)

- Wide model/file compatibility (`.s3d`, `.s3dx`, `.brd`, etc.).
- Ghost board and image superposition.
- Advanced 3D layer operations (add/subtract detail volumes).
- Multi-curve editing for rail/apex/stringer relationships.
- Asymmetric design workflows.
- Plug/fin-system positioning workflows.
- Full-scale print plans and manufacturing-oriented exports.
- Hydrofoil/fin profile and analysis tools in advanced tiers.

## BoardCAD (commonly highlighted)

- Open-source CAD/CAM workflow.
- CNC g-code generation capabilities (including multi-axis scenarios).
- CAD exports and interoperability goals.
- Broad import ambitions from other shaping ecosystems.
- 3D scanning and scripting/customization concepts in ecosystem docs.

## Top 20 Features to Consider Incorporating

Prioritized list based on strategic value, implementation leverage vs current codebase, and expected user impact.

1. **True persistent recent-files and project library**  
   Move from session cache to robust project/file history with metadata, thumbnails, and recovery.

2. **Board comparison mode (ghost overlays + delta metrics)**  
   Overlay two boards and show quantified differences for rocker, width, thickness, and volume distribution.

3. **Auto-scaling wizard with constraint locks**  
   Scale length/width/thickness while preserving user-selected design constraints and curve intent.

4. **Volume and buoyancy analytics panel**  
   Add center of buoyancy, distributed volume slices, and "where the foam is" visual tooling.

5. **Mass/center-of-mass estimator with material presets**  
   Estimate board weight and balance from laminate/core presets.

6. **Advanced rail design toolkit**  
   Add rail apex/tuck visualization and editable rail curve families beyond soften/harden.

7. **3D curvature/contour heatmap views**  
   Improve concave/convex and fairness diagnosis with contour lines and curvature maps.

8. **Plug/fin-box placement module**  
   Fin-system templates (FCS/Futures/US box) with mirrored placement, offsets, and printable drilling guides.

9. **Asymmetric board workflow support**  
   Explicit controls for left/right asymmetry in outline and rocker.

10. **2D CAD export expansion (DXF/PDF with production templates)**  
    Expand from SVG to manufacturing-friendly outputs and print layouts.

11. **3D CAD export expansion (STEP/IGES)**
    Complete professional interoperability pipeline for CNC/CAD ecosystems.

12. **Importers for common external board formats**  
    Prioritize S3D/S3DX and other common competitor formats where legally/technically feasible.

13. **CAM toolpath preview and machine profile presets**  
    Surface path simulation before export and include common machine/post presets.

14. **G-code post-processor framework**  
    Pluggable post-processing to support different CNC controllers and axis conventions.

15. **Template and shape marketplace ingestion**  
    Curated template packs with metadata tags, style filters, and version tracking.

16. **Version history and design snapshots**  
    Built-in "milestones" for iterative design branching and easy rollback.

17. **Image superposition calibration enhancements**  
    Better reference image alignment/calibration tools for tracing and reverse engineering.

18. **Manufacturing documentation bundle export**  
    One-click package including spec sheet, templates, rocker/section slices, and machine notes.

19. **Scriptable automation layer**  
    Lightweight scripting/plugin hooks for repetitive shaping operations and custom analysis.

20. **Shaper workflow QA checks**  
    Rule-based validation (e.g., minimum thickness zones, rail continuity limits, tool clearance warnings).

## Suggested Priority Bands

- **Near-term (high leverage with existing architecture):** 1, 2, 3, 4, 10, 16, 18, 20  
- **Mid-term (deeper geometry/model work):** 5, 6, 7, 8, 9, 17  
- **Longer-term (interoperability and CAM complexity):** 11, 12, 13, 14, 19, 15

## Mapping Against Current Alpha Gaps

- Existing stubs in `packages/boardcad-core/src/loaders/index.ts` and `packages/boardcad-core/src/export/index.ts` align directly with opportunities 11 and 12.
- Existing CAM groundwork in `packages/boardcad-core/src/cam/index.ts` aligns with opportunities 13 and 14.
- Existing reference-image system in `apps/boardcad-desktop/src/types/referenceImage.ts` provides a base for opportunity 17.
- Existing geometry warning hooks in `apps/boardcad-desktop/src/App.tsx` provide a base for opportunity 20.

