/** 2D vector helpers (port of cadcore.VecMath). */

export type Point2D = { x: number; y: number };

export function subVector(p0: Point2D, p1: Point2D): Point2D {
  return { x: p1.x - p0.x, y: p1.y - p0.y };
}

export function getVecLength(p: Point2D): number {
  return Math.sqrt(p.x * p.x + p.y * p.y);
}

export function getVecDot(p0: Point2D, p1: Point2D): number {
  return p0.x * p1.x + p0.y * p1.y;
}

/** Angle between vectors (same semantics as Java VecMath.getVecAngle). */
export function getVecAngle(p0: Point2D, p1: Point2D): number {
  const len = getVecLength(p0) * getVecLength(p1);
  if (len === 0) return 0;
  const v = getVecDot(p0, p1) / len;
  const clamped = Math.min(1, Math.max(-1, v));
  const angle = Math.acos(clamped);
  return Number.isNaN(angle) ? 0 : angle;
}
