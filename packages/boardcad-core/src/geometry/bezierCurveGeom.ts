import type { BezierKnot } from "../model/bezierKnot.js";
import {
  BS_LENGTH_TOLERANCE,
  BS_MIN_MAX_SPLITS,
  BS_MIN_MAX_TOLERANCE,
  BS_ONE,
  BS_POS_MAX_ITERATIONS,
  BS_POS_TOLERANCE,
  BS_ZERO,
  BS_ANGLE_MAX_ITERATIONS,
  BS_ANGLE_TOLERANCE,
} from "./bezierSplineConstants.js";

/**
 * Cubic Bezier segment geometry (Java `cadcore.BezierCurve` Lancaster coefficients).
 * One curve: start knot → end knot (both required).
 */
export class CubicBezierGeom {
  private coeff0 = 0;
  private coeff1 = 0;
  private coeff2 = 0;
  private coeff3 = 0;
  private coeff4 = 0;
  private coeff5 = 0;
  private coeff6 = 0;
  private coeff7 = 0;
  private mCoeffDirty = true;
  private mLength = 0;
  private mLengthDirty = true;

  constructor(
    private readonly mStartKnot: BezierKnot,
    private readonly mEndKnot: BezierKnot,
  ) {}

  getStartKnot(): BezierKnot {
    return this.mStartKnot;
  }
  getEndKnot(): BezierKnot {
    return this.mEndKnot;
  }

  private calculateCoeff(): void {
    if (!this.mCoeffDirty) return;
    const p0 = this.mStartKnot.getEndPoint();
    const t1 = this.mStartKnot.getTangentToNext();
    const t2 = this.mEndKnot.getTangentToPrev();
    const p3 = this.mEndKnot.getEndPoint();

    this.coeff0 = p3.x + 3 * (-t2.x + t1.x) - p0.x;
    this.coeff1 = 3 * (t2.x - 2 * t1.x + p0.x);
    this.coeff2 = 3 * (t1.x - p0.x);
    this.coeff3 = p0.x;

    this.coeff4 = p3.y + 3 * (-t2.y + t1.y) - p0.y;
    this.coeff5 = 3 * (t2.y - 2 * t1.y + p0.y);
    this.coeff6 = 3 * (t1.y - p0.y);
    this.coeff7 = p0.y;

    this.mCoeffDirty = false;
    this.mLengthDirty = true;
  }

  invalidateCoeff(): void {
    this.mCoeffDirty = true;
  }

  getXValue(t: number): number {
    this.calculateCoeff();
    return (((this.coeff0 * t + this.coeff1) * t + this.coeff2) * t) + this.coeff3;
  }

  getYValue(t: number): number {
    this.calculateCoeff();
    return (((this.coeff4 * t + this.coeff5) * t + this.coeff6) * t) + this.coeff7;
  }

  private getXDerivate(t: number): number {
    this.calculateCoeff();
    return ((3 * this.coeff0 * t + 2 * this.coeff1) * t) + this.coeff2;
  }

  private getYDerivate(t: number): number {
    this.calculateCoeff();
    return ((3 * this.coeff4 * t + 2 * this.coeff5) * t) + this.coeff6;
  }

  /** Java `getTangent`: atan2(dx, dy). */
  getTangent(t: number): number {
    this.calculateCoeff();
    const dx = this.getXDerivate(t);
    const dy = this.getYDerivate(t);
    return Math.atan2(dx, dy);
  }

  getLength(t0: number, t1: number): number {
    this.calculateCoeff();
    const x0 = this.getXValue(t0);
    const y0 = this.getYValue(t0);
    const x1 = this.getXValue(t1);
    const y1 = this.getYValue(t1);
    const ts = (t1 - t0) / 2 + t0;
    const sx = this.getXValue(ts);
    const sy = this.getYValue(ts);
    const len =
      Math.hypot(sx - x0, sy - y0) + Math.hypot(x1 - sx, y1 - sy);
    const chord = Math.hypot(x1 - x0, y1 - y0);
    if (len - chord > BS_LENGTH_TOLERANCE && t1 - t0 > 0.001) {
      return this.getLength(t0, ts) + this.getLength(ts, t1);
    }
    return len;
  }

  getLengthFull(): number {
    this.calculateCoeff();
    if (this.mLengthDirty) {
      this.mLength = this.getLength(BS_ZERO, BS_ONE);
      this.mLengthDirty = false;
    }
    return this.mLength;
  }

  getTForLength(t0: number, t1: number, lengthLeft: number): number {
    this.calculateCoeff();
    if (Math.abs(t0 - t1) < 0.00001) return t0;
    const ts = (t1 - t0) / 2 + t0;
    const sl = this.getLength(t0, ts);
    if (Math.abs(sl - lengthLeft) > BS_LENGTH_TOLERANCE) {
      if (sl > lengthLeft) {
        return this.getTForLength(t0, ts, lengthLeft);
      }
      return this.getTForLength(ts, t1, lengthLeft - sl);
    }
    return ts;
  }

  getTForLengthFromStart(lengthLeft: number): number {
    return this.getTForLength(BS_ZERO, BS_ONE, lengthLeft);
  }

  private getTForXInternal(x: number, startT: number): number {
    let tn = startT;
    let xn = this.getXValue(tn);
    let error = x - xn;
    let n = 0;
    while (Math.abs(error) > BS_POS_TOLERANCE && n++ < BS_POS_MAX_ITERATIONS) {
      const d = this.getXDerivate(tn);
      if (Math.abs(d) < 1e-18) break;
      const currentSlope = 1 / d;
      tn = tn + error * currentSlope;
      if (tn < 0 || tn > 1) break;
      xn = this.getXValue(tn);
      error = x - xn;
    }
    if (
      tn < 0 ||
      tn > 1 ||
      Number.isNaN(tn) ||
      n >= BS_POS_MAX_ITERATIONS ||
      Math.abs(error) > BS_POS_TOLERANCE
    ) {
      tn = this.getTForXGrid(x, 0, 1, BS_MIN_MAX_SPLITS);
    }
    return tn;
  }

  private getTForXGrid(x: number, t0: number, t1: number, nrOfSplits: number): number {
    let bestT = 0;
    let bestError = 1e15;
    const seg = (t1 - t0) / nrOfSplits;
    for (let i = 1; i < nrOfSplits; i++) {
      const currentT = seg * i + t0;
      if (currentT < 0 || currentT > 1) continue;
      const currentValue = this.getXValue(currentT);
      const err = Math.abs(x - currentValue);
      if (err < bestError) {
        bestError = err;
        bestT = currentT;
      }
    }
    if (bestError < BS_POS_TOLERANCE) return bestT;
    if (Math.abs(bestT - (t1 - t0) / 2) < BS_MIN_MAX_TOLERANCE) return bestT;
    if (nrOfSplits <= 2) return bestT;
    return this.getTForXGrid(x, bestT - seg, bestT + seg, Math.floor(nrOfSplits / 2));
  }

  getTForX(x: number, startT?: number): number {
    this.calculateCoeff();
    const end = this.mEndKnot.getEndPoint();
    const start = this.mStartKnot.getEndPoint();
    const guess =
      startT ??
      (x - end.x) / (start.x - end.x || 1e-9);
    return this.getTForXInternal(x, guess);
  }

  getYForX(x: number): number {
    const t = this.getTForXInternal(
      x,
      (x - this.mStartKnot.getEndPoint().x) /
        (this.mEndKnot.getEndPoint().x - this.mStartKnot.getEndPoint().x || 1e-9),
    );
    return this.getYValue(t);
  }

  /** Robust min/max on [0,1] (avoids fragile recursion from Java `getMinMaxNumerical`). */
  private sampleMinMax(xorY: number, minOrMax: number): number {
    this.calculateCoeff();
    let best = minOrMax === 1 ? -1e15 : 1e15;
    const n = BS_MIN_MAX_SPLITS;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const v = xorY === 0 ? this.getXValue(t) : this.getYValue(t);
      if (minOrMax === 1) best = Math.max(best, v);
      else best = Math.min(best, v);
    }
    return best;
  }

  getMaxX(): number {
    return this.sampleMinMax(0, 1);
  }
  getMinX(): number {
    return this.sampleMinMax(0, 0);
  }
  getMaxY(): number {
    return this.sampleMinMax(1, 1);
  }
  getMinY(): number {
    return this.sampleMinMax(1, 0);
  }

  getTForTangent2(targetAngle: number, currentT: number, lastT: number): number {
    this.calculateCoeff();
    let ct = currentT;
    let lt = lastT;
    let currentAngle = this.getTangent(ct);
    let lastAngle = this.getTangent(lt);
    let currentError = targetAngle - currentAngle;
    let n = 0;
    while (
      Math.abs(currentError) > BS_ANGLE_TOLERANCE &&
      n++ < BS_ANGLE_MAX_ITERATIONS &&
      ct > BS_ZERO &&
      ct < BS_ONE
    ) {
      const denom = ct - lt;
      const slope = Math.abs(denom) < 1e-18 ? 0 : (currentAngle - lastAngle) / denom;
      lt = ct;
      ct = ct + currentError * slope;
      lastAngle = currentAngle;
      currentAngle = this.getTangent(ct);
      currentError = targetAngle - currentAngle;
    }
    if (
      Math.abs(this.getTangent(ct) - targetAngle) > BS_ANGLE_TOLERANCE ||
      ct < BS_ZERO ||
      ct > BS_ONE
    ) {
      n = 0;
      let ltBin = 0;
      let ht = 1;
      while (
        Math.abs(currentError) > BS_ANGLE_TOLERANCE &&
        n++ < BS_ANGLE_MAX_ITERATIONS &&
        ht - ltBin > 0.00001
      ) {
        ct = ltBin + (ht - ltBin) / 2;
        currentAngle = this.getTangent(ct);
        currentError = targetAngle - currentAngle;
        if (currentError < 0) ltBin = ct;
        else ht = ct;
      }
    }
    return ct;
  }
}

export function geomForCurve(curve: import("../model/bezierCurve.js").BezierCurve): CubicBezierGeom | null {
  const end = curve.getEndKnot();
  if (!end) return null;
  return new CubicBezierGeom(curve.getStartKnot(), end);
}
