import { BezierKnot } from "./bezierKnot.js";

/** Minimal segment holder (cadcore.BezierCurve structure). */
export class BezierCurve {
  constructor(
    public mStartKnot: BezierKnot,
    public mEndKnot: BezierKnot | null,
  ) {}
  getStartKnot(): BezierKnot {
    return this.mStartKnot;
  }
  getEndKnot(): BezierKnot | null {
    return this.mEndKnot;
  }
  setEndKnot(k: BezierKnot | null): void {
    this.mEndKnot = k;
  }
}
