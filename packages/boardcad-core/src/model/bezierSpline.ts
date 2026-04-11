import { BezierKnot } from "./bezierKnot.js";
import { BezierCurve } from "./bezierCurve.js";

/** Port of cadcore.BezierSpline — curve list + control point indexing. */
export class BezierSpline {
  private readonly mCurves: BezierCurve[] = [];

  clear(): void {
    this.mCurves.length = 0;
  }

  isLastControlPointNull(): boolean {
    if (this.mCurves.length === 0) return true;
    return this.mCurves[this.mCurves.length - 1]!.getEndKnot() === null;
  }

  getNrOfControlPoints(): number {
    return this.mCurves.length + (this.isLastControlPointNull() ? 0 : 1);
  }

  append(controlPoint: BezierKnot): void {
    if (this.mCurves.length === 0) {
      this.mCurves.push(new BezierCurve(controlPoint, null));
    } else if (this.mCurves.length === 1 && this.mCurves[0]!.getEndKnot() === null) {
      this.mCurves[0]!.setEndKnot(controlPoint);
    } else {
      const prevEnd = this.mCurves[this.mCurves.length - 1]!.getEndKnot()!;
      this.mCurves.push(new BezierCurve(prevEnd, controlPoint));
    }
  }

  getControlPoint(i: number): BezierKnot | null {
    if (this.mCurves.length === 0 || this.mCurves.length < i - 1) {
      return null;
    }
    if (i === 0) {
      return this.mCurves[0]!.getStartKnot();
    }
    return this.mCurves[i - 1]!.getEndKnot();
  }

  getControlPointOrThrow(i: number): BezierKnot {
    const k = this.getControlPoint(i);
    if (!k) throw new Error(`Missing control point ${i}`);
    return k;
  }

  getCurve(i: number): BezierCurve {
    return this.mCurves[i]!;
  }

  getNrOfCurves(): number {
    return this.mCurves.length;
  }
}
