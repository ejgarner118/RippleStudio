import * as VecMath from "../geometry/vecMath.js";

/** Port of cadcore.BezierKnot (subset for .brd I/O and continuity checks). */
export const LOCK_X_MORE = 0x0001;
export const LOCK_X_LESS = 0x0010;
export const LOCK_Y_MORE = 0x0100;
export const LOCK_Y_LESS = 0x1000;
export type HandleMode = "independent" | "aligned" | "mirrored";

export class BezierKnot {
  /** [end, tangentPrev, tangentNext] */
  readonly points: VecMath.Point2D[] = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ];
  private continuous = false;
  private mirrored = false;
  private other = false;
  X_mask = 1;
  Y_mask = 1;
  private tangent1Locks = 0;
  private tangent2Locks = 0;
  mSlave: BezierKnot | null = null;

  setContinous(c: boolean): void {
    this.continuous = c;
    // Legacy compatibility: historical continuity was mirrored.
    this.mirrored = c;
  }
  isContinous(): boolean {
    return this.continuous;
  }
  setHandleMode(mode: HandleMode): void {
    if (mode === "independent") {
      this.continuous = false;
      this.mirrored = false;
      return;
    }
    this.relinkTangents(mode);
    this.continuous = true;
    this.mirrored = mode === "mirrored";
  }
  getHandleMode(): HandleMode {
    if (!this.continuous) return "independent";
    return this.mirrored ? "mirrored" : "aligned";
  }

  private relinkTangents(mode: "aligned" | "mirrored"): void {
    const end = this.points[0]!;
    const prev = this.points[1]!;
    const next = this.points[2]!;
    const vxPrev = end.x - prev.x;
    const vyPrev = end.y - prev.y;
    const vxNext = next.x - end.x;
    const vyNext = next.y - end.y;
    const lenPrev = Math.hypot(vxPrev, vyPrev);
    const lenNext = Math.hypot(vxNext, vyNext);

    const hasPrev = lenPrev > 1e-9;
    const hasNext = lenNext > 1e-9;
    const base = hasNext ? { x: vxNext, y: vyNext } : hasPrev ? { x: vxPrev, y: vyPrev } : { x: 10, y: 0 };
    const baseLen = Math.hypot(base.x, base.y) || 1;
    const ux = base.x / baseLen;
    const uy = base.y / baseLen;

    if (mode === "mirrored") {
      const mLen = Math.max(lenPrev, lenNext, 10);
      next.x = end.x + ux * mLen;
      next.y = end.y + uy * mLen;
      prev.x = end.x - ux * mLen;
      prev.y = end.y - uy * mLen;
      return;
    }

    const alignedPrevLen = hasPrev ? lenPrev : hasNext ? lenNext : 10;
    const alignedNextLen = hasNext ? lenNext : hasPrev ? lenPrev : 10;
    next.x = end.x + ux * alignedNextLen;
    next.y = end.y + uy * alignedNextLen;
    prev.x = end.x - ux * alignedPrevLen;
    prev.y = end.y - uy * alignedPrevLen;
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
  getTangentToPrevLocks(): number {
    return this.tangent1Locks;
  }
  setTangentToNextLocks(locks: number): void {
    this.tangent2Locks = locks;
  }
  getTangentToNextLocks(): number {
    return this.tangent2Locks;
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
    this.mirrored = other.mirrored;
    this.other = other.other;
    this.X_mask = other.X_mask;
    this.Y_mask = other.Y_mask;
  }
}
