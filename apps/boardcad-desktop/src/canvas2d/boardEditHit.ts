import type {
  BezierBoard,
  BezierSpline,
  BBox2D,
  SplineEditTarget,
} from "@boardcad/core";
import { computeFit, fromCanvas, type FitTransform } from "./draw";
import type { BoardEditMode } from "../types/editMode";
import type { OverlayState } from "../types/overlays";

export function nearestControlPointEndIndex(
  spline: BezierSpline,
  x: number,
  y: number,
  radiusBoard: number,
): number | null {
  const r2 = radiusBoard * radiusBoard;
  const n = spline.getNrOfControlPoints();
  let bestI: number | null = null;
  let bestD2 = r2;
  for (let i = 0; i < n; i++) {
    const k = spline.getControlPoint(i);
    if (!k) continue;
    const p = k.getEndPoint();
    const dx = p.x - x;
    const dy = p.y - y;
    const d2 = dx * dx + dy * dy;
    if (d2 <= bestD2) {
      bestD2 = d2;
      bestI = i;
    }
  }
  return bestI;
}

export function clientToBoardMm(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  bounds: BBox2D,
  padPx: number,
): { x: number; y: number; tf: FitTransform; cw: number; ch: number } | null {
  const cw = canvas.width;
  const ch = canvas.height;
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const px = ((clientX - rect.left) / rect.width) * cw;
  const py = ((clientY - rect.top) / rect.height) * ch;
  const tf = computeFit(bounds, cw, ch, padPx);
  const [x, y] = fromCanvas(px, py, tf, ch);
  return { x, y, tf, cw, ch };
}

export function hitRadiusBoard(tf: FitTransform): number {
  return Math.max(3 / tf.s, 1);
}

export function pickEditTarget(
  brd: BezierBoard,
  mode: BoardEditMode,
  sectionIndex: number,
  x: number,
  y: number,
  radiusBoard: number,
  overlays: OverlayState,
): SplineEditTarget | null {
  if (mode === "outline") {
    const i = nearestControlPointEndIndex(brd.outline, x, y, radiusBoard);
    return i == null ? null : { kind: "outline", index: i };
  }
  if (mode === "deck" && overlays.profileDeck) {
    const i = nearestControlPointEndIndex(brd.deck, x, y, radiusBoard);
    return i == null ? null : { kind: "deck", index: i };
  }
  if (mode === "bottom" && overlays.profileBottom) {
    const i = nearestControlPointEndIndex(brd.bottom, x, y, radiusBoard);
    return i == null ? null : { kind: "bottom", index: i };
  }
  if (mode === "section") {
    const cs = brd.crossSections[sectionIndex];
    if (!cs) return null;
    const sp = cs.getBezierSpline();
    const i = nearestControlPointEndIndex(sp, x, y, radiusBoard);
    return i == null ? null : { kind: "section", sectionIndex, index: i };
  }
  return null;
}
