import { describe, it, expect } from "vitest";
import { BezierKnot } from "../model/bezierKnot.js";
import { CubicBezierGeom } from "./bezierCurveGeom.js";

function lineLikeSegment(): CubicBezierGeom {
  const a = new BezierKnot();
  a.points[0] = { x: 0, y: 0 };
  a.points[1] = { x: 3, y: 0 };
  a.points[2] = { x: 7, y: 0 };
  const b = new BezierKnot();
  b.points[0] = { x: 10, y: 0 };
  b.points[1] = { x: 7, y: 0 };
  b.points[2] = { x: 3, y: 0 };
  return new CubicBezierGeom(a, b);
}

describe("CubicBezierGeom", () => {
  it("arc length of nearly straight horizontal cubic is ~ chord", () => {
    const c = lineLikeSegment();
    const L = c.getLengthFull();
    expect(L).toBeGreaterThan(9.5);
    expect(L).toBeLessThan(10.5);
  });

  it("getPointByS endpoints", () => {
    const c = lineLikeSegment();
    const p0 = { x: c.getXValue(0), y: c.getYValue(0) };
    const p1 = { x: c.getXValue(1), y: c.getYValue(1) };
    expect(p0.x).toBeCloseTo(0, 5);
    expect(p1.x).toBeCloseTo(10, 5);
  });
});
