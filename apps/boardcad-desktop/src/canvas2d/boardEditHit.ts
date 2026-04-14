import type {
  BezierBoard,
  BezierSpline,
  BBox2D,
  SplineEditTarget,
} from "@boardcad/core";
import { computeFit, fromCanvas, type FitTransform } from "./draw";
import type { BoardEditMode } from "../types/editMode";
import type { OverlayState } from "../types/overlays";

type KnotPointKind = "end" | "prev" | "next";

export function nearestControlPointPoint(
  spline: BezierSpline,
  x: number,
  y: number,
  radiusBoard: number,
  preferHandles = false,
): { index: number; point: KnotPointKind } | null {
  const r2 = radiusBoard * radiusBoard;
  const n = spline.getNrOfControlPoints();
  let best: { index: number; point: KnotPointKind } | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  const pointPriority = (point: KnotPointKind): number => {
    if (preferHandles) return point === "end" ? 1 : 0;
    return point === "end" ? 0 : 1;
  };
  for (let i = 0; i < n; i++) {
    const k = spline.getControlPoint(i);
    if (!k) continue;
    const pts: Array<{ p: { x: number; y: number }; point: KnotPointKind }> = [
      { p: k.getEndPoint(), point: "end" },
      { p: k.getTangentToPrev(), point: "prev" },
      { p: k.getTangentToNext(), point: "next" },
    ];
    for (const cand of pts) {
      const dx = cand.p.x - x;
      const dy = cand.p.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const score = d2 * 10 + pointPriority(cand.point);
      if (score < bestScore) {
        bestScore = score;
        best = { index: i, point: cand.point };
      }
    }
  }
  return best;
}

export function clientToBoardMm(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  bounds: BBox2D,
  padPx: number,
  zoom = 1,
  panPx = 0,
  panPy = 0,
): { x: number; y: number; tf: FitTransform; cw: number; ch: number } | null {
  const cw = canvas.width;
  const ch = canvas.height;
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const px = ((clientX - rect.left) / rect.width) * cw;
  const py = ((clientY - rect.top) / rect.height) * ch;
  const base = computeFit(bounds, cw, ch, padPx, zoom);
  const tf: FitTransform = { ...base, panPx, panPy };
  const [x, y] = fromCanvas(px, py, tf, ch);
  return { x, y, tf, cw, ch };
}

export function hitRadiusBoard(tf: FitTransform): number {
  return Math.max(10 / tf.s, 1.5);
}

function nearestOutlineControlPointPointMirrored(
  spline: BezierSpline,
  x: number,
  y: number,
  radiusBoard: number,
): { index: number; point: KnotPointKind } | null {
  const direct = nearestControlPointPoint(spline, x, y, radiusBoard);
  const mirrored = nearestControlPointPoint(spline, x, -y, radiusBoard);
  if (!direct) return mirrored;
  if (!mirrored) return direct;
  const kd = spline.getControlPoint(direct.index);
  const km = spline.getControlPoint(mirrored.index);
  if (!kd || !km) return direct;
  const pd =
    direct.point === "end"
      ? kd.getEndPoint()
      : direct.point === "prev"
        ? kd.getTangentToPrev()
        : kd.getTangentToNext();
  const pm =
    mirrored.point === "end"
      ? km.getEndPoint()
      : mirrored.point === "prev"
        ? km.getTangentToPrev()
        : km.getTangentToNext();
  const dd = (pd.x - x) * (pd.x - x) + (pd.y - y) * (pd.y - y);
  const dm = (pm.x - x) * (pm.x - x) + (-pm.y - y) * (-pm.y - y);
  return dm < dd ? mirrored : direct;
}

export function pickEditTarget(
  brd: BezierBoard,
  mode: BoardEditMode,
  sectionIndex: number,
  x: number,
  y: number,
  radiusBoard: number,
  _overlays: OverlayState,
): SplineEditTarget | null {
  if (mode === "outline") {
    const hit = nearestOutlineControlPointPointMirrored(brd.outline, x, y, radiusBoard);
    return hit == null ? null : { kind: "outline", index: hit.index, point: hit.point };
  }
  if (mode === "deck") {
    const hit = nearestControlPointPoint(brd.deck, x, y, radiusBoard);
    return hit == null ? null : { kind: "deck", index: hit.index, point: hit.point };
  }
  if (mode === "bottom") {
    const hit = nearestControlPointPoint(brd.bottom, x, y, radiusBoard);
    return hit == null ? null : { kind: "bottom", index: hit.index, point: hit.point };
  }
  if (mode === "section") {
    const cs = brd.crossSections[sectionIndex];
    if (!cs) return null;
    const sp = cs.getBezierSpline();
    // Prefer Bézier handles over anchors when distances are similar (easier to grab tangents).
    const hit = nearestControlPointPoint(sp, x, y, radiusBoard, true);
    return hit == null
      ? null
      : { kind: "section", sectionIndex, index: hit.index, point: hit.point };
  }
  return null;
}
