import type { BezierBoard } from "@boardcad/core";
import type { BBox2D } from "@boardcad/core";
import { gridMajorStepModelUnits } from "@boardcad/core";
import type { OverlayState } from "../types/overlays";
import { PROFILE_PAD_PX } from "../constants";
import {
  type ControlPointMarkerState,
  computeFit,
  drawControlPoints,
  drawGuidePoints,
  drawMetricGrid,
  strokePolyline,
} from "./draw";
import type { CanvasPalette } from "../styles/themePalettes";

function sectionEmptyMessage(brd: BezierBoard, sectionIndex: number): string {
  if (brd.crossSections.length === 0) {
    return "No cross-sections in this .brd";
  }
  const cs0 = brd.crossSections[sectionIndex];
  if (!cs0) return "No section selected";
  if (cs0.getBezierSpline().getNrOfControlPoints() === 0) {
    return "Section has no control points";
  }
  return "Nothing to draw for this section";
}

export function renderSectionView(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  brd: BezierBoard,
  sectionIndex: number,
  profileXy: Float32Array,
  profileBounds: BBox2D | null,
  overlays: OverlayState,
  zoom = 1,
  panPx = 0,
  panPy = 0,
  markerState?: ControlPointMarkerState,
  palette?: CanvasPalette,
): void {
  ctx.fillStyle = palette?.sectionSurface ?? "#faf8f5";
  ctx.fillRect(0, 0, cw, ch);

  if (profileXy.length < 4 || !profileBounds) {
    ctx.fillStyle = palette?.emptyText ?? "#888";
    ctx.font = "13px system-ui";
    ctx.fillText(sectionEmptyMessage(brd, sectionIndex), 12, 24);
    return;
  }

  const base = computeFit(profileBounds, cw, ch, PROFILE_PAD_PX, zoom, { alignY: "top" });
  const tf = { ...base, panPx, panPy };

  if (overlays.grid) {
    const g = gridMajorStepModelUnits(brd.currentUnits);
    const sectionStep = brd.currentUnits === 2 ? Math.max(0.25, g * 0.25) : brd.currentUnits === 1 ? Math.max(1, g * 0.2) : Math.max(5, g * 0.2);
    drawMetricGrid(ctx, tf, ch, profileBounds, sectionStep, palette?.grid);
  }

  strokePolyline(ctx, profileXy, tf, ch, {
    color: palette?.sectionRail ?? "#2d6a4f",
    width: 2,
  });

  const sp = brd.crossSections[sectionIndex]?.getBezierSpline();
  if (sp && overlays.controlPoints) {
    drawControlPoints(ctx, sp, tf, ch, markerState, palette);
  }
  if (overlays.guidePoints && brd.crossSections[sectionIndex]) {
    drawGuidePoints(
      ctx,
      brd.crossSections[sectionIndex]!.getGuidePoints(),
      tf,
      ch,
      palette,
    );
  }
}
