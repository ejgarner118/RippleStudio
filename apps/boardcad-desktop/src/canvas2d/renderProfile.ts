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

const EMPTY_HINT =
  "Enable deck and/or bottom, or add profile splines (Java: printProfile).";

export function renderProfileView(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  brd: BezierBoard,
  deckXy: Float32Array,
  bottomXy: Float32Array,
  profileStringerBounds: BBox2D | null,
  overlays: OverlayState,
): void {
  ctx.fillStyle = "#f8f6ff";
  ctx.fillRect(0, 0, cw, ch);

  if (!profileStringerBounds) {
    ctx.fillStyle = "#888";
    ctx.font = "13px system-ui";
    ctx.fillText(EMPTY_HINT, 12, 24);
    return;
  }

  const tf = computeFit(profileStringerBounds, cw, ch, PROFILE_PAD_PX);

  if (overlays.profileBottom && bottomXy.length >= 4) {
    strokePolyline(ctx, bottomXy, tf, ch, {
      color: "#3d4f63",
      width: 2,
      dash: [5, 4],
    });
  }
  if (overlays.profileDeck && deckXy.length >= 4) {
    strokePolyline(ctx, deckXy, tf, ch, {
      color: "#8b5a2b",
      width: 2,
      dash: [2, 0],
    });
  }

  if (overlays.guidePoints) {
    if (overlays.profileDeck) {
      drawGuidePoints(ctx, brd.deckGuidePoints, tf, ch);
    }
    if (overlays.profileBottom) {
      drawGuidePoints(ctx, brd.bottomGuidePoints, tf, ch);
    }
  }
  if (overlays.controlPoints) {
    if (overlays.profileDeck) {
      drawControlPoints(ctx, brd.deck, tf, ch);
    }
    if (overlays.profileBottom) {
      drawControlPoints(ctx, brd.bottom, tf, ch);
    }
  }
}
