import { describe, it, expect } from "vitest";
import { BezierBoard } from "../model/bezierBoard.js";
import { loadBrdFromText } from "../brd/brdReader.js";
import { MINI_BOARD_BRD } from "../defaultBoards.js";
import {
  bounds2D,
  cubicPoint2D,
  firstDrawableCrossSectionIndex,
  mirrorOutlineHalfToOtherRail,
  sampleBezierSpline2D,
  sampleSplineForDisplay,
  stationFrameNearX,
  unionBounds,
} from "./bezierSample.js";

describe("bezierSample", () => {
  it("cubic endpoints match knot end points", () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 0, y: 1 };
    const p2 = { x: 1, y: 1 };
    const p3 = { x: 1, y: 0 };
    const a = cubicPoint2D(p0, p1, p2, p3, 0);
    const b = cubicPoint2D(p0, p1, p2, p3, 1);
    expect(a.x).toBeCloseTo(0);
    expect(a.y).toBeCloseTo(0);
    expect(b.x).toBeCloseTo(1);
    expect(b.y).toBeCloseTo(0);
  });

  it("samples mini board outline with expected X span", () => {
    const brd = new BezierBoard();
    expect(loadBrdFromText(brd, MINI_BOARD_BRD, "m.brd")).toBe(0);
    const xy = sampleBezierSpline2D(brd.outline, 32);
    const b = bounds2D(xy);
    expect(b).not.toBeNull();
    expect(b!.minX).toBeCloseTo(0, 0);
    expect(b!.maxX).toBeCloseTo(100, 0);
  });

  it("unionBounds merges boxes", () => {
    expect(
      unionBounds(
        { minX: 0, maxX: 1, minY: 0, maxY: 1 },
        { minX: -1, maxX: 2, minY: -2, maxY: 3 },
      ),
    ).toEqual({ minX: -1, maxX: 2, minY: -2, maxY: 3 });
  });

  it("sampleSplineForDisplay yields segment for single control point (deck pin)", () => {
    const brd = new BezierBoard();
    loadBrdFromText(brd, MINI_BOARD_BRD, "m.brd");
    expect(brd.deck.getNrOfControlPoints()).toBe(1);
    const d = sampleSplineForDisplay(brd.deck);
    expect(d.length).toBe(4);
  });

  const BRD_PIN_THEN_FULL = MINI_BOARD_BRD.replace(
    `p35 : (
)`,
    `p35 : (
(p36 0.0
(cp [0,0,1,0,0,1] false false)
)
(p36 50.0
(cp [0,0,1,0,0,1] false false)
(cp [10,5,9,5,11,5] false false)
)
)`,
  );

  it("firstDrawableCrossSectionIndex skips leading pin section", () => {
    const brd = new BezierBoard();
    expect(loadBrdFromText(brd, BRD_PIN_THEN_FULL, "p.brd")).toBe(0);
    expect(brd.crossSections.length).toBe(2);
    expect(brd.crossSections[0]!.getBezierSpline().getNrOfControlPoints()).toBe(1);
    expect(firstDrawableCrossSectionIndex(brd)).toBe(1);
  });

  it("mirrorOutlineHalfToOtherRail negates Y (Java plan mirror)", () => {
    const a = new Float32Array([0, 5, 10, 8]);
    const m = mirrorOutlineHalfToOtherRail(a);
    expect(m[0]).toBe(0);
    expect(m[1]).toBe(-5);
    expect(m[2]).toBe(10);
    expect(m[3]).toBe(-8);
  });

  it("stationFrameNearX returns tangent on mini outline", () => {
    const brd = new BezierBoard();
    loadBrdFromText(brd, MINI_BOARD_BRD, "m.brd");
    const xy = sampleBezierSpline2D(brd.outline, 48);
    const f = stationFrameNearX(xy, 50);
    expect(f).not.toBeNull();
    expect(Math.hypot(f!.tx, f!.ty)).toBeCloseTo(1, 5);
    expect(Math.hypot(f!.bx, f!.by)).toBeCloseTo(1, 5);
  });
});
