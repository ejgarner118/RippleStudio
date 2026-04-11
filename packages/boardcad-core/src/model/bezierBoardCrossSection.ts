import { BezierSpline } from "./bezierSpline.js";
import type * as VecMath from "../geometry/vecMath.js";

export class BezierBoardCrossSection {
  private position = 0;
  readonly bezierSpline = new BezierSpline();
  readonly guidePoints: VecMath.Point2D[] = [];

  getPosition(): number {
    return this.position;
  }
  setPosition(p: number): void {
    this.position = p;
  }

  getBezierSpline(): BezierSpline {
    return this.bezierSpline;
  }

  getGuidePoints(): VecMath.Point2D[] {
    return this.guidePoints;
  }
}
