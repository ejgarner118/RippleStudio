import { useMemo } from "react";
import {
  type BezierBoard,
  type BBox2D,
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

export function useBoardGeometry(
  brd: BezierBoard,
  sectionIndex: number,
  overlays: OverlayState,
  geometryRevision: number,
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
    return unionBounds(bounds2D(outlineLowerXy), bounds2D(outlineUpperXy));
  }, [outlineLowerXy, outlineUpperXy]);

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
    }
    if (overlays.profileBottom && bottomXy.length >= 4) {
      b = unionBounds(b, bounds2D(bottomXy));
    }
    return b;
  }, [deckXy, bottomXy, overlays.profileDeck, overlays.profileBottom]);

  const profileXy = useMemo(() => {
    const cs = brd.crossSections[sectionIndex];
    if (!cs) return new Float32Array();
    return sampleSplineForDisplay(cs.getBezierSpline(), SPLINE_SAMPLES);
  }, [brd, sectionIndex, geometryRevision]);

  const profileBounds = useMemo(() => bounds2D(profileXy), [profileXy]);

  const loftData = useMemo((): LoftMeshData | null => {
    if (!overlays.loft3d || brd.crossSections.length < 2) return null;
    return buildLoftMesh3D(brd, outlineLowerXy);
  }, [brd, outlineLowerXy, overlays.loft3d]);

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
