import type { BezierSpline } from "../model/bezierSpline.js";

export type RailRefineKind = "soften" | "harden";

/**
 * Heuristic rail refinement on the active cross-section spline (knot 0 = stringer anchor).
 * Soften: slightly fuller mid-rail band, slightly eased tuck. Harden: slightly tucked rail, slightly pulled-in fullness.
 */
export function refineCrossSectionRail(sp: BezierSpline, kind: RailRefineKind): void {
  const n = sp.getNrOfControlPoints();
  if (n < 2) return;
  for (let i = 1; i < n; i++) {
    /** Center samples in (0,1) so two-point rails still get a mid-rail bell (avoid t stuck at 0 when n === 2). */
    const t = n <= 1 ? 0 : (i - 0.5) / (n - 1);
    const bell = Math.sin(Math.PI * t);
    const tuckPhase = Math.cos((t * Math.PI) / 2);
    const k = sp.getControlPointOrThrow(i);
    for (let j = 0; j < 3; j++) {
      const p = k.points[j]!;
      if (kind === "soften") {
        const lateral = 1 + 0.045 * bell;
        const tuckEase = 1 - 0.032 * tuckPhase;
        p.x *= lateral;
        p.y *= tuckEase;
      } else {
        const lateral = 1 - 0.04 * bell;
        const tuck = 1 + 0.038 * tuckPhase;
        p.x *= lateral;
        p.y *= tuck;
      }
    }
  }
}
