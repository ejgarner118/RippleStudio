import { useMemo } from "react";
import {
  type BezierBoard,
  type BBox2D,
  buildBoardMeshThree,
  bounds2D,
  buildLoftMesh3D,
  mirrorOutlineHalfToOtherRail,
  sampleBezierSpline2D,
  sampleSplineForDisplay,
  unionBounds,
} from "@boardcad/core";
import { SPLINE_SAMPLES } from "../constants";
import type { OverlayState } from "../types/overlays";
import type { CenterMm, LoftMeshData } from "../types/view";

function splineControlBounds(sp: BezierBoard["outline"]): BBox2D | null {
  const n = sp.getNrOfControlPoints();
  if (n === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < n; i++) {
    const k = sp.getControlPoint(i);
    if (!k) continue;
    const pts = [k.getEndPoint(), k.getTangentToPrev(), k.getTangentToNext()];
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, maxX, minY, maxY };
}

export function useBoardGeometry(
  brd: BezierBoard,
  sectionIndex: number,
  overlays: OverlayState,
  geometryRevision: number,
  meshPreviewMode: "interactivePreview" | "exportParity",
) {
  const outlineLowerXy = useMemo(
    () => sampleBezierSpline2D(brd.outline, SPLINE_SAMPLES),
    [brd, geometryRevision],
  );

  const outlineUpperXy = useMemo(
    () => mirrorOutlineHalfToOtherRail(outlineLowerXy),
    [outlineLowerXy],
  );

  const deckXy = useMemo(
    () => sampleBezierSpline2D(brd.deck, SPLINE_SAMPLES),
    [brd, geometryRevision],
  );

  const bottomXy = useMemo(
    () => sampleBezierSpline2D(brd.bottom, SPLINE_SAMPLES),
    [brd, geometryRevision],
  );

  const planBounds = useMemo((): BBox2D | null => {
    const sampled = unionBounds(bounds2D(outlineLowerXy), bounds2D(outlineUpperXy));
    const cp = splineControlBounds(brd.outline);
    const mirroredCp =
      cp == null
        ? null
        : {
            minX: cp.minX,
            maxX: cp.maxX,
            minY: Math.min(cp.minY, -cp.maxY),
            maxY: Math.max(cp.maxY, -cp.minY),
          };
    return unionBounds(sampled, mirroredCp);
  }, [outlineLowerXy, outlineUpperXy, brd, geometryRevision]);

  const centerMm = useMemo((): CenterMm => {
    if (!planBounds) return { x: 0, y: 0 };
    return {
      x: (planBounds.minX + planBounds.maxX) / 2,
      y: (planBounds.minY + planBounds.maxY) / 2,
    };
  }, [planBounds]);

  const profileStringerBounds = useMemo((): BBox2D | null => {
    let b: BBox2D | null = null;
    if (overlays.profileDeck && deckXy.length >= 4) {
      b = unionBounds(b, bounds2D(deckXy));
      b = unionBounds(b, splineControlBounds(brd.deck));
    }
    if (overlays.profileBottom && bottomXy.length >= 4) {
      b = unionBounds(b, bounds2D(bottomXy));
      b = unionBounds(b, splineControlBounds(brd.bottom));
    }
    return b;
  }, [deckXy, bottomXy, overlays.profileDeck, overlays.profileBottom, brd, geometryRevision]);

  const profileXy = useMemo(() => {
    const cs = brd.crossSections[sectionIndex];
    if (!cs) return new Float32Array();
    return sampleSplineForDisplay(cs.getBezierSpline(), SPLINE_SAMPLES);
  }, [brd, sectionIndex, geometryRevision]);

  const profileBounds = useMemo(() => {
    const sampled = bounds2D(profileXy);
    const cs = brd.crossSections[sectionIndex];
    if (!cs) return sampled;
    return unionBounds(sampled, splineControlBounds(cs.getBezierSpline()));
  }, [profileXy, brd, sectionIndex, geometryRevision]);

  const loftData = useMemo((): LoftMeshData | null => {
    if (!overlays.loft3d || brd.crossSections.length < 2) return null;
    if (meshPreviewMode === "exportParity") {
      const mesh = buildBoardMeshThree(brd);
      return mesh.ok ? { positions: mesh.positions, indices: mesh.indices } : null;
    }
    return buildLoftMesh3D(brd, outlineLowerXy, "standard");
  }, [brd, outlineLowerXy, overlays.loft3d, geometryRevision, meshPreviewMode]);

  return {
    outlineLowerXy,
    outlineUpperXy,
    deckXy,
    bottomXy,
    planBounds,
    centerMm,
    profileStringerBounds,
    profileXy,
    profileBounds,
    loftData,
  };
}
