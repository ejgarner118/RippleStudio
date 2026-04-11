import type { BezierBoard } from "@boardcad/core";
import type { BBox2D } from "@boardcad/core";
import type { OverlayState } from "../types/overlays";
import { PROFILE_PAD_PX } from "../constants";
import {
  computeFit,
  drawControlPoints,
  drawGuidePoints,
  strokePolyline,
} from "./draw";

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
): void {
  ctx.fillStyle = "#faf8f5";
  ctx.fillRect(0, 0, cw, ch);

  if (profileXy.length < 4 || !profileBounds) {
    ctx.fillStyle = "#888";
    ctx.font = "13px system-ui";
    ctx.fillText(sectionEmptyMessage(brd, sectionIndex), 12, 24);
    return;
  }

  const tf = computeFit(profileBounds, cw, ch, PROFILE_PAD_PX);
  strokePolyline(ctx, profileXy, tf, ch, { color: "#2d6a4f", width: 2 });

  const sp = brd.crossSections[sectionIndex]?.getBezierSpline();
  if (sp && overlays.controlPoints) {
    drawControlPoints(ctx, sp, tf, ch);
  }
  if (overlays.guidePoints && brd.crossSections[sectionIndex]) {
    drawGuidePoints(
      ctx,
      brd.crossSections[sectionIndex]!.getGuidePoints(),
      tf,
      ch,
    );
  }
}
