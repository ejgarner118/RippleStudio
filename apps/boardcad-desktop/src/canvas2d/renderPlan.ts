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
import type { CanvasPalette } from "../styles/themePalettes";

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
  finBoxes?: Array<{ x: number; y: number; cantDeg: number; toeInDeg: number }>,
  palette?: CanvasPalette,
): void {
  ctx.fillStyle = palette?.planSurface ?? "#f4f4f8";
  ctx.fillRect(0, 0, cw, ch);

  if (!planBounds) return;
  const base = computeFit(planBounds, cw, ch, PLAN_PAD_PX, zoom);
  const tf = { ...base, panPx, panPy };

  if (overlays.grid) {
    drawMetricGrid(ctx, tf, ch, planBounds, gridMajorStepModelUnits(brd.currentUnits), palette?.grid);
  }

  if (planReference?.img && planReference.layer.enabled && planReference.layer.objectUrl) {
    drawReferenceImageUnderlay(ctx, tf, ch, planBounds, planReference.img, planReference.layer);
  }

  if (overlays.ghost) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    const ghost = { color: palette?.outlineGhost ?? "#9a9aaa", width: 2, dash: [6, 4] as number[] };
    if (outlineLowerXy.length >= 4) {
      strokePolyline(ctx, outlineLowerXy, tf, ch, ghost);
    }
    if (outlineUpperXy.length >= 4) {
      strokePolyline(ctx, outlineUpperXy, tf, ch, ghost);
    }
    ctx.restore();
  }

  const rail = { color: palette?.outlineRail ?? "#1a5fb4", width: 2.5 };
  if (outlineLowerXy.length >= 4) {
    strokePolyline(ctx, outlineLowerXy, tf, ch, rail);
  }
  if (outlineUpperXy.length >= 4) {
    strokePolyline(ctx, outlineUpperXy, tf, ch, rail);
  }

  if (overlays.guidePoints) {
    drawGuidePointsMirrored(ctx, brd.outlineGuidePoints, tf, ch, palette);
  }
  if (overlays.controlPoints) {
    drawControlPointsMirroredOutline(ctx, brd.outline, tf, ch, markerState, palette);
  }

  if (finBoxes && finBoxes.length > 0) {
    ctx.save();
    for (const b of finBoxes) {
      const sx = b.x * tf.s + tf.ox + tf.panPx;
      const sy = ch - (b.y * tf.s + tf.oy + tf.panPy);
      const r = Math.max(4, Math.min(8, tf.s * 12));
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.strokeStyle = palette?.finAccent ?? "#d97b00";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      const finColor = palette?.finAccent ?? "#d97b00";
      const alphaHex = finColor.length === 7 ? `${finColor}26` : "rgba(217,123,0,0.15)";
      ctx.fillStyle = alphaHex;
      ctx.fill();
      const toeDir = ((b.y >= 0 ? -1 : 1) * b.toeInDeg * Math.PI) / 180;
      const dx = Math.cos(toeDir) * (r + 8);
      const dy = Math.sin(toeDir) * (r + 8);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + dx, sy - dy);
      ctx.strokeStyle = palette?.finAccent ?? "rgba(217,123,0,0.9)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }
}
