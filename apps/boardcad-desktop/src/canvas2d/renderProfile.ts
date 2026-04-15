import type { BezierBoard } from "@boardcad/core";
import type { BBox2D } from "@boardcad/core";
import { gridMajorStepModelUnits } from "@boardcad/core";
import type { OverlayState } from "../types/overlays";
import type { ReferenceImageLayer } from "../types/referenceImage";
import { drawReferenceImageUnderlay } from "./drawReferenceImage";
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

const EMPTY_HINT = "Enable deck and/or bottom overlays to view and edit profile splines.";

export function renderProfileView(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  brd: BezierBoard,
  deckXy: Float32Array,
  bottomXy: Float32Array,
  profileStringerBounds: BBox2D | null,
  overlays: OverlayState,
  zoom = 1,
  panPx = 0,
  panPy = 0,
  deckMarkers?: ControlPointMarkerState,
  bottomMarkers?: ControlPointMarkerState,
  profileReference?: { layer: ReferenceImageLayer; img: HTMLImageElement | null },
  palette?: CanvasPalette,
): void {
  ctx.fillStyle = palette?.profileSurface ?? "#f8f6ff";
  ctx.fillRect(0, 0, cw, ch);

  if (!profileStringerBounds) {
    ctx.fillStyle = palette?.emptyText ?? "#888";
    ctx.font = "13px system-ui";
    ctx.fillText(EMPTY_HINT, 12, 24);
    return;
  }

  const base = computeFit(profileStringerBounds, cw, ch, PROFILE_PAD_PX, zoom);
  const tf = { ...base, panPx, panPy };

  if (overlays.grid) {
    const step = gridMajorStepModelUnits(brd.currentUnits) * 0.5;
    drawMetricGrid(ctx, tf, ch, profileStringerBounds, step > 0 ? step : 1, palette?.grid);
  }

  if (profileReference?.img && profileReference.layer.enabled && profileReference.layer.objectUrl) {
    drawReferenceImageUnderlay(
      ctx,
      tf,
      ch,
      profileStringerBounds,
      profileReference.img,
      profileReference.layer,
    );
  }

  if (overlays.profileBottom && bottomXy.length >= 4) {
    strokePolyline(ctx, bottomXy, tf, ch, {
      color: palette?.profileBottom ?? "#3d4f63",
      width: 2,
      dash: [5, 4],
    });
  }
  if (overlays.profileDeck && deckXy.length >= 4) {
    strokePolyline(ctx, deckXy, tf, ch, {
      color: palette?.profileDeck ?? "#8b5a2b",
      width: 2,
      dash: [2, 0],
    });
  }

  if (overlays.guidePoints) {
    if (overlays.profileDeck) {
      drawGuidePoints(ctx, brd.deckGuidePoints, tf, ch, palette);
    }
    if (overlays.profileBottom) {
      drawGuidePoints(ctx, brd.bottomGuidePoints, tf, ch, palette);
    }
  }
  if (overlays.controlPoints) {
    if (overlays.profileDeck) {
      drawControlPoints(ctx, brd.deck, tf, ch, deckMarkers, palette);
    }
    if (overlays.profileBottom) {
      drawControlPoints(ctx, brd.bottom, tf, ch, bottomMarkers, palette);
    }
  }
}
