import * as VecMath from "../geometry/vecMath.js";

/** Port of cadcore.BezierKnot (subset for .brd I/O and continuity checks). */
export const LOCK_X_MORE = 0x0001;
export const LOCK_X_LESS = 0x0010;
export const LOCK_Y_MORE = 0x0100;
export const LOCK_Y_LESS = 0x1000;

export class BezierKnot {
  /** [end, tangentPrev, tangentNext] */
  readonly points: VecMath.Point2D[] = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ];
  private continuous = false;
  private other = false;
  X_mask = 1;
  Y_mask = 1;
  private tangent1Locks = 0;
  private tangent2Locks = 0;
  mSlave: BezierKnot | null = null;

  setContinous(c: boolean): void {
    this.continuous = c;
  }
  isContinous(): boolean {
    return this.continuous;
  }
  setOther(o: boolean): void {
    this.other = o;
  }
  getOther(): boolean {
    return this.other;
  }

  getEndPoint(): VecMath.Point2D {
    return this.points[0];
  }
  getTangentToPrev(): VecMath.Point2D {
    return this.points[1];
  }
  getTangentToNext(): VecMath.Point2D {
    return this.points[2];
  }

  setMask(x: number, y: number): void {
    this.X_mask = x;
    this.Y_mask = y;
  }

  setTangentToPrevLocks(locks: number): void {
    this.tangent1Locks = locks;
  }
  setTangentToNextLocks(locks: number): void {
    this.tangent2Locks = locks;
  }
  addTangentToNextLocks(locks: number): void {
    this.tangent2Locks |= locks;
  }
  addTangentToPrevLocks(locks: number): void {
    this.tangent1Locks |= locks;
  }

  setSlave(slave: BezierKnot | null): void {
    this.mSlave = slave;
  }

  getTangentToPrevAngle(): number {
    const u = { x: 0, y: 1 };
    const vec = VecMath.subVector(this.getEndPoint(), this.getTangentToPrev());
    return VecMath.getVecAngle(u, vec);
  }

  getTangentToNextAngle(): number {
    const u = { x: 0, y: 1 };
    const vec = VecMath.subVector(this.getEndPoint(), this.getTangentToNext());
    return VecMath.getVecAngle(u, vec);
  }

  set(other: BezierKnot): void {
    for (let i = 0; i < 3; i++) {
      this.points[i].x = other.points[i].x;
      this.points[i].y = other.points[i].y;
    }
    this.continuous = other.continuous;
    this.other = other.other;
    this.X_mask = other.X_mask;
    this.Y_mask = other.Y_mask;
  }
}
