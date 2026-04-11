import type { BezierBoard, BBox2D } from "@boardcad/core";
import type { OverlayState } from "../types/overlays";
import { PLAN_PAD_PX } from "../constants";
import {
  computeFit,
  drawControlPointsMirroredOutline,
  drawGuidePointsMirrored,
  drawPlanGrid,
  strokePolyline,
} from "./draw";

export function renderPlanView(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  brd: BezierBoard,
  outlineLowerXy: Float32Array,
  outlineUpperXy: Float32Array,
  planBounds: BBox2D | null,
  overlays: OverlayState,
): void {
  ctx.fillStyle = "#f4f4f8";
  ctx.fillRect(0, 0, cw, ch);

  if (overlays.grid) {
    drawPlanGrid(ctx, cw, ch);
  }

  if (!planBounds) return;
  const tf = computeFit(planBounds, cw, ch, PLAN_PAD_PX);

  if (overlays.ghost) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    const ghost = { color: "#9a9aaa", width: 2, dash: [6, 4] as number[] };
    if (outlineLowerXy.length >= 4) {
      strokePolyline(ctx, outlineLowerXy, tf, ch, ghost);
    }
    if (outlineUpperXy.length >= 4) {
      strokePolyline(ctx, outlineUpperXy, tf, ch, ghost);
    }
    ctx.restore();
  }

  const rail = { color: "#1a5fb4", width: 2.5 };
  if (outlineLowerXy.length >= 4) {
    strokePolyline(ctx, outlineLowerXy, tf, ch, rail);
  }
  if (outlineUpperXy.length >= 4) {
    strokePolyline(ctx, outlineUpperXy, tf, ch, rail);
  }

  if (overlays.guidePoints) {
    drawGuidePointsMirrored(ctx, brd.outlineGuidePoints, tf, ch);
  }
  if (overlays.controlPoints) {
    drawControlPointsMirroredOutline(ctx, brd.outline, tf, ch);
  }
}
