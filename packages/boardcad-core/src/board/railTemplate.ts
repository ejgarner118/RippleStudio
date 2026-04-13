import type { BezierSpline } from "../model/bezierSpline.js";

/**
 * Adjust rail cross-section shape relative to a centerline anchor (knot 0).
 * Soft: fuller, rounder rail; hard: tucked-in with more vertical bite at the edge.
 */
export function applyRailShapeTemplate(sp: BezierSpline, template: "soft" | "hard"): void {
  const n = sp.getNrOfControlPoints();
  if (n < 2) return;
  const xMul = template === "soft" ? 1.1 : 0.9;
  const yMul = template === "soft" ? 0.92 : 1.1;
  for (let i = 1; i < n; i++) {
    const k = sp.getControlPointOrThrow(i);
    for (let j = 0; j < 3; j++) {
      k.points[j]!.x *= xMul;
      k.points[j]!.y *= yMul;
    }
  }
}
