import { describe, it, expect } from "vitest";
import { BezierBoard } from "../model/bezierBoard.js";
import { loadBrdFromText } from "../brd/brdReader.js";
import { BOARD_WITH_SECTIONS_BRD, BOARD_WITH_THREE_SECTIONS_BRD } from "../defaultBoards.js";
import { getInterpolatedCrossSectionJava } from "./boardInterpolation.js";

describe("getInterpolatedCrossSectionJava", () => {
  it("uses two distinct section indices when three cross-sections are present", () => {
    const brd = new BezierBoard();
    expect(loadBrdFromText(brd, BOARD_WITH_THREE_SECTIONS_BRD, "3.brd")).toBe(0);
    expect(brd.crossSections.length).toBe(3);
    const x = 35;
    const cs = getInterpolatedCrossSectionJava(brd, x);
    expect(cs).not.toBeNull();
    const sp = cs!.getBezierSpline();
    expect(sp.getNrOfControlPoints()).toBeGreaterThanOrEqual(2);
  });

  it("returns valid cross-section for two-section boards", () => {
    const brd = new BezierBoard();
    loadBrdFromText(brd, BOARD_WITH_SECTIONS_BRD, "s.brd");
    const len =
      brd.outline.getControlPointOrThrow(brd.outline.getNrOfControlPoints() - 1).getEndPoint().x;
    const cs = getInterpolatedCrossSectionJava(brd, len * 0.55);
    expect(cs).not.toBeNull();
  });
});
