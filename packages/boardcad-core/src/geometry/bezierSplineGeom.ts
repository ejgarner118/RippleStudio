import { BezierSpline } from "../model/bezierSpline.js";
import { CubicBezierGeom, geomForCurve } from "./bezierCurveGeom.js";
import { BS_ANGLE_TOLERANCE, BS_ONE, BS_ZERO } from "./bezierSplineConstants.js";

export function splineSegments(spline: BezierSpline): CubicBezierGeom[] {
  const out: CubicBezierGeom[] = [];
  const n = spline.getNrOfCurves();
  for (let i = 0; i < n; i++) {
    const g = geomForCurve(spline.getCurve(i));
    if (g) out.push(g);
  }
  return out;
}

export function splineTotalLength(segments: CubicBezierGeom[]): number {
  let sum = 0;
  for (const s of segments) {
    sum += s.getLengthFull();
  }
  return sum;
}

/** Java `getLengthByControlPointIndex`: sum full lengths of curves `[startIndex, endIndex)`. */
export function getLengthByControlPointIndex(
  segments: CubicBezierGeom[],
  startIndex: number,
  endIndex: number,
): number {
  let len = 0;
  for (let j = startIndex; j < endIndex && j < segments.length; j++) {
    len += segments[j]!.getLengthFull();
  }
  return len;
}

function findMatchingSegmentSimple(segments: CubicBezierGeom[], pos: number): number {
  for (let i = 0; i < segments.length; i++) {
    const c = segments[i]!;
    const lx = c.getStartKnot().getEndPoint().x;
    const ux = c.getEndKnot().getEndPoint().x;
    if (lx <= pos && ux >= pos) return i;
  }
  return -1;
}

function findMatchingSegmentMinMax(segments: CubicBezierGeom[], pos: number): number {
  for (let i = 0; i < segments.length; i++) {
    const c = segments[i]!;
    const lx = c.getMinX();
    const ux = c.getMaxX();
    if ((lx <= pos && ux >= pos) || (ux <= pos && lx >= pos)) return i;
  }
  return -1;
}

export function findMatchingBezierSegment(segments: CubicBezierGeom[], pos: number): number {
  let r = findMatchingSegmentSimple(segments, pos);
  if (r < 0) r = findMatchingSegmentMinMax(segments, pos);
  return r;
}

export function splineGetValueAt(spline: BezierSpline, pos: number): number {
  const segs = splineSegments(spline);
  const idx = findMatchingBezierSegment(segs, pos);
  if (idx < 0) return 0;
  return segs[idx]!.getYForX(pos);
}

export function getPointByCurveLength(
  segments: CubicBezierGeom[],
  totalLen: number,
  curveLength: number,
): { x: number; y: number } {
  if (segments.length === 0) {
    return { x: 0, y: 0 };
  }
  if (totalLen <= 0 || curveLength <= 0) {
    const c = segments[0]!;
    return { x: c.getXValue(BS_ZERO), y: c.getYValue(BS_ZERO) };
  }
  if (curveLength >= totalLen) {
    const c = segments[segments.length - 1]!;
    return { x: c.getXValue(BS_ONE), y: c.getYValue(BS_ONE) };
  }
  let l = curveLength;
  for (const curve of segments) {
    const cl = curve.getLengthFull();
    if (l < cl) {
      const t = curve.getTForLengthFromStart(l);
      return { x: curve.getXValue(t), y: curve.getYValue(t) };
    }
    l -= cl;
  }
  const last = segments[segments.length - 1]!;
  return { x: last.getXValue(BS_ONE), y: last.getYValue(BS_ONE) };
}

export function splineGetPointByS(spline: BezierSpline, s: number): { x: number; y: number } {
  const segs = splineSegments(spline);
  if (segs.length === 0) {
    return { x: 0, y: 0 };
  }
  const tl = splineTotalLength(segs);
  return getPointByCurveLength(segs, tl, s * tl);
}

export function getTangentByCurveLength(
  segments: CubicBezierGeom[],
  curveLength: number,
): number {
  if (segments.length === 0) {
    return 0;
  }
  let l = curveLength;
  for (const curve of segments) {
    const cl = curve.getLengthFull();
    if (l < cl || curve === segments[segments.length - 1]!) {
      const t = l < cl ? curve.getTForLengthFromStart(l) : BS_ONE;
      return curve.getTangent(t);
    }
    l -= cl;
  }
  return segments[segments.length - 1]!.getTangent(BS_ONE);
}

export function splineGetTangentByS(spline: BezierSpline, s: number): number {
  const segs = splineSegments(spline);
  if (segs.length === 0) {
    return 0;
  }
  const tl = splineTotalLength(segs);
  return getTangentByCurveLength(segs, s * tl);
}

/**
 * Java `BezierSpline.getLengthByTangentReverse` (iterates curves from end to start).
 */
export function getLengthByTangentReverse(
  segments: CubicBezierGeom[],
  targetAngle: number,
  useMinimumAngleOnSharpCorners: boolean,
): number {
  if (segments.length === 0) {
    return 0;
  }
  let length = 0;
  let t = 0;
  let minAngleError = 1e15;
  let minErrorT = -1;
  let minAngleErrorSection = -1;
  let targetFound = false;

  let i: number;
  for (i = segments.length - 1; i >= 0; i--) {
    const curve = segments[i]!;
    const startAngle = curve.getTangent(BS_ZERO);
    const endAngle = curve.getTangent(BS_ONE);

    if (endAngle > targetAngle) {
      if (useMinimumAngleOnSharpCorners) {
        i += 1;
      } else {
        length = curve.getLength(BS_ZERO, BS_ONE - 0.05);
      }
      targetFound = true;
      break;
    }

    let initialT = (targetAngle - startAngle) / (endAngle - startAngle || 1e-18);
    if (initialT < 0) initialT = 0;
    if (initialT > 1) initialT = 1;
    let lastT = initialT + 0.1;
    if (lastT > 1) lastT -= 0.2;

    t = curve.getTForTangent2(targetAngle, initialT, lastT);
    const tAngle = curve.getTangent(t);
    const angleError = Math.abs(tAngle - targetAngle);
    if (minAngleError > angleError) {
      minAngleError = angleError;
      minErrorT = t;
      minAngleErrorSection = i;
    }
    if (angleError <= BS_ANGLE_TOLERANCE) {
      length = curve.getLength(BS_ZERO, t);
      targetFound = true;
      break;
    } else if (startAngle >= targetAngle && endAngle <= targetAngle) {
      t = curve.getTForTangent2(targetAngle, initialT, lastT);
    }
  }

  if (!targetFound && minAngleErrorSection !== -1) {
    const curve = segments[minAngleErrorSection]!;
    length = curve.getLength(BS_ZERO, minErrorT);
  }

  length += getLengthByControlPointIndex(segments, 0, i);
  return length;
}

export function splineGetSByNormalReverse(
  spline: BezierSpline,
  angleRad: number,
  useMinimumAngleOnSharpCorners: boolean,
): number {
  const segs = splineSegments(spline);
  const tl = splineTotalLength(segs);
  if (tl < 1e-12) return BS_ZERO;
  const tangentAngle = angleRad - Math.PI / 2;
  const len = getLengthByTangentReverse(segs, tangentAngle, useMinimumAngleOnSharpCorners);
  let s = len / tl;
  if (s < BS_ZERO) s = BS_ZERO;
  if (s > BS_ONE) s = BS_ONE;
  return s;
}

export function splineGetMaxX(spline: BezierSpline): number {
  let max = -1e15;
  for (const g of splineSegments(spline)) {
    max = Math.max(max, g.getMaxX());
  }
  return max;
}

export function splineGetLengthByX(spline: BezierSpline, pos: number): number {
  const segs = splineSegments(spline);
  const idx = findMatchingBezierSegment(segs, pos);
  if (idx < 0) return 0;
  const curve = segs[idx]!;
  const t = curve.getTForX(pos, BS_ONE);
  let length = curve.getLength(BS_ZERO, t);
  for (let j = 0; j < idx; j++) {
    length += segs[j]!.getLengthFull();
  }
  return length;
}
