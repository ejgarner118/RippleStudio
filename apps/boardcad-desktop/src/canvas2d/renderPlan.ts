import type { BezierBoard, BBox2D } from "@boardcad/core";
import { gridMajorStepModelUnits } from "@boardcad/core";
import type { OverlayState } from "../types/overlays";
import type { ReferenceImageLayer } from "../types/referenceImage";
import { drawReferenceImageUnderlay } from "./drawReferenceImage";
import { PLAN_PAD_PX } from "../constants";
import {
  type ControlPointMarkerState,
  computeFit,
  drawControlPointsMirroredOutline,
  drawGuidePointsMirrored,
  drawMetricGrid,
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
  zoom = 1,
  panPx = 0,
  panPy = 0,
  markerState?: ControlPointMarkerState,
  planReference?: { layer: ReferenceImageLayer; img: HTMLImageElement | null },
): void {
  ctx.fillStyle = "#f4f4f8";
  ctx.fillRect(0, 0, cw, ch);

  if (!planBounds) return;
  const base = computeFit(planBounds, cw, ch, PLAN_PAD_PX, zoom);
  const tf = { ...base, panPx, panPy };

  if (overlays.grid) {
    drawMetricGrid(ctx, tf, ch, planBounds, gridMajorStepModelUnits(brd.currentUnits));
  }

  if (planReference?.img && planReference.layer.enabled && planReference.layer.objectUrl) {
    drawReferenceImageUnderlay(ctx, tf, ch, planBounds, planReference.img, planReference.layer);
  }

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
    drawControlPointsMirroredOutline(ctx, brd.outline, tf, ch, markerState);
  }
}
