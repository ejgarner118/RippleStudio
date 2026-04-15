import { BezierSpline } from "../model/bezierSpline.js";

export type RailDiagnostics = {
  apexX: number;
  apexY: number;
  tuckDepth: number;
  deckToBottomDelta: number;
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function computeRailDiagnostics(sp: BezierSpline): RailDiagnostics {
  const n = sp.getNrOfControlPoints();
  if (n < 2) return { apexX: 0, apexY: 0, tuckDepth: 0, deckToBottomDelta: 0 };
  let apexX = 0;
  let apexY = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    const p = sp.getControlPointOrThrow(i).getEndPoint();
    if (p.y > apexY) {
      apexY = p.y;
      apexX = p.x;
    }
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const deckToBottomDelta = maxY - minY;
  const tuckDepth = apexY - minY;
  return { apexX, apexY, tuckDepth, deckToBottomDelta };
}

/**
 * Adjust section rail shape using apex/tuck controls.
 * - `apexShiftRatio`: positive moves apex outward, negative inward.
 * - `tuckDepthRatio`: positive deepens tuck, negative shallows.
 */
export function applyRailApexTuckAdjust(
  sp: BezierSpline,
  apexShiftRatio: number,
  tuckDepthRatio: number,
): void {
  const n = sp.getNrOfControlPoints();
  if (n < 3) return;
  const diag = computeRailDiagnostics(sp);
  const xSpan = Math.max(1e-6, Math.abs(sp.getControlPointOrThrow(n - 1).getEndPoint().x - sp.getControlPointOrThrow(0).getEndPoint().x));
  const apexShift = xSpan * apexShiftRatio * 0.15;
  const tuckShift = diag.deckToBottomDelta * tuckDepthRatio * 0.2;

  for (let i = 1; i < n - 1; i++) {
    const k = sp.getControlPointOrThrow(i);
    const end = k.getEndPoint();
    const t = n <= 1 ? 0 : i / (n - 1);
    const bell = 1 - Math.pow((t - 0.6) / 0.6, 2);
    const w = clamp01(bell);
    end.x += apexShift * w;
    end.y -= tuckShift * (1 - t) * 0.8;
    // Keep handles near anchor to avoid abrupt kinks.
    const prev = k.getTangentToPrev();
    const next = k.getTangentToNext();
    prev.x += apexShift * w * 0.6;
    next.x += apexShift * w * 0.6;
    prev.y -= tuckShift * (1 - t) * 0.4;
    next.y -= tuckShift * (1 - t) * 0.4;
  }
}

