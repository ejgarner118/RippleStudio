import type { BezierSpline } from "../model/bezierSpline.js";
import type * as VecMath from "./vecMath.js";

/**
 * Cubic Bezier evaluation (matches typical CAD interpretation of legacy `.brd` knots:
 * P0 = start end point, P1 = start tangent-to-next, P2 = end tangent-to-prev, P3 = end end point).
 */
export function cubicPoint2D(
  p0: VecMath.Point2D,
  p1: VecMath.Point2D,
  p2: VecMath.Point2D,
  p3: VecMath.Point2D,
  t: number,
): VecMath.Point2D {
  const u = 1 - t;
  const u2 = u * u;
  const u3 = u2 * u;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
  };
}

export function cubicTangent2D(
  p0: VecMath.Point2D,
  p1: VecMath.Point2D,
  p2: VecMath.Point2D,
  p3: VecMath.Point2D,
  t: number,
): VecMath.Point2D {
  const u = 1 - t;
  const u2 = u * u;
  const t2 = t * t;
  const dx =
    3 * u2 * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x);
  const dy =
    3 * u2 * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y);
  return { x: dx, y: dy };
}

const DEFAULT_SAMPLES_PER_SEGMENT = 24;

/**
 * Samples all complete cubic spans in document order. Duplicate joints are omitted.
 */
export function sampleBezierSpline2D(
  spline: BezierSpline,
  samplesPerSegment: number = DEFAULT_SAMPLES_PER_SEGMENT,
): Float32Array {
  const nCurves = spline.getNrOfCurves();
  const pts: number[] = [];
  for (let ci = 0; ci < nCurves; ci++) {
    const curve = spline.getCurve(ci);
    const start = curve.getStartKnot();
    const end = curve.getEndKnot();
    if (!end) continue;
    const p0 = start.getEndPoint();
    const p1 = start.getTangentToNext();
    const p2 = end.getTangentToPrev();
    const p3 = end.getEndPoint();
    const steps = Math.max(2, samplesPerSegment);
    for (let i = 0; i <= steps; i++) {
      if (ci > 0 && i === 0) continue;
      const t = i / steps;
      const p = cubicPoint2D(p0, p1, p2, p3, t);
      pts.push(p.x, p.y);
    }
  }
  return Float32Array.from(pts);
}

/**
 * Samples a spline for UI; Java often places 1-control-point “pin” sections at
 * nose/tail — no cubic span, but we still draw a marker segment.
 */
export function sampleSplineForDisplay(
  spline: BezierSpline,
  samplesPerSegment: number = DEFAULT_SAMPLES_PER_SEGMENT,
): Float32Array {
  const sampled = sampleBezierSpline2D(spline, samplesPerSegment);
  if (sampled.length >= 4) return sampled;
  const k0 = spline.getControlPoint(0);
  if (!k0) return new Float32Array();
  const p = k0.getEndPoint();
  const w = Math.max(Math.abs(p.x), Math.abs(p.y), 1) * 1e-4;
  return new Float32Array([p.x - w, p.y, p.x + w, p.y]);
}

/** First cross-section index with drawable geometry (≥2 control points), or 0. */
export function firstDrawableCrossSectionIndex(board: {
  crossSections: { getBezierSpline(): BezierSpline }[];
}): number {
  for (let i = 0; i < board.crossSections.length; i++) {
    const n = board.crossSections[i]!.getBezierSpline().getNrOfControlPoints();
    if (n >= 2) return i;
  }
  return 0;
}

export type BBox2D = { minX: number; maxX: number; minY: number; maxY: number };

/**
 * Second rail for plan view: same X, negated Y, same point order (matches Java
 * `makeBezierPathFromControlPoints(..., flipY=true)` on the stored half-outline).
 */
export function mirrorOutlineHalfToOtherRail(lowerRailXy: Float32Array): Float32Array {
  const n = lowerRailXy.length / 2;
  const out = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    out[i * 2] = lowerRailXy[i * 2]!;
    out[i * 2 + 1] = -lowerRailXy[i * 2 + 1]!;
  }
  return out;
}

export function bounds2D(xy: Float32Array): BBox2D | null {
  if (xy.length < 4) return null;
  let minX = xy[0]!;
  let maxX = xy[0]!;
  let minY = xy[1]!;
  let maxY = xy[1]!;
  for (let i = 2; i < xy.length; i += 2) {
    const x = xy[i]!;
    const y = xy[i + 1]!;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return { minX, maxX, minY, maxY };
}

/** Merge bounds (ignores null). */
export function unionBounds(a: BBox2D | null, b: BBox2D | null): BBox2D | null {
  if (!a) return b;
  if (!b) return a;
  return {
    minX: Math.min(a.minX, b.minX),
    maxX: Math.max(a.maxX, b.maxX),
    minY: Math.min(a.minY, b.minY),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

/**
 * Frame on the outline polyline near a board station coordinate.
 * Finds the closest point on the polyline to (stationX, yRef); yRef defaults to outline midpoint Y.
 */
export function stationFrameNearX(
  outlineXy: Float32Array,
  stationX: number,
  yRef?: number,
): {
  ox: number;
  oy: number;
  tx: number;
  ty: number;
  bx: number;
  by: number;
} | null {
  if (outlineXy.length < 4) return null;
  const b = bounds2D(outlineXy);
  const pyRef = yRef ?? (b ? (b.minY + b.maxY) * 0.5 : 0);
  const n = outlineXy.length / 2;
  let bestD = Infinity;
  let bestPx = outlineXy[0]!;
  let bestPy = outlineXy[1]!;
  let bestTx = 1;
  let bestTy = 0;

  for (let i = 0; i < n - 1; i++) {
    const x0 = outlineXy[i * 2]!;
    const y0 = outlineXy[i * 2 + 1]!;
    const x1 = outlineXy[(i + 1) * 2]!;
    const y1 = outlineXy[(i + 1) * 2 + 1]!;
    const abx = x1 - x0;
    const aby = y1 - y0;
    const apx = stationX - x0;
    const apy = pyRef - y0;
    const ab2 = abx * abx + aby * aby;
    let t = 0;
    if (ab2 > 1e-18) {
      t = (apx * abx + apy * aby) / ab2;
      t = Math.max(0, Math.min(1, t));
    }
    const px = x0 + t * abx;
    const py = y0 + t * aby;
    const d = (stationX - px) ** 2 + (pyRef - py) ** 2;
    if (d < bestD) {
      bestD = d;
      bestPx = px;
      bestPy = py;
      const len = Math.hypot(abx, aby) || 1;
      bestTx = abx / len;
      bestTy = aby / len;
    }
  }

  const bx = -bestTy;
  const by = bestTx;
  return { ox: bestPx, oy: bestPy, tx: bestTx, ty: bestTy, bx, by };
}
