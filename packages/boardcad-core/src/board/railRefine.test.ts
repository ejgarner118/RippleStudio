import { describe, it, expect } from "vitest";
import { BezierBoard } from "../model/bezierBoard.js";
import { loadBrdFromText } from "../brd/brdReader.js";
import { BOARD_WITH_SECTIONS_BRD } from "../defaultBoards.js";
import { refineCrossSectionRail } from "./railRefine.js";

function sumEndX(sp: { getNrOfControlPoints: () => number; getControlPointOrThrow: (i: number) => { getEndPoint: () => { x: number } } }) {
  let s = 0;
  const n = sp.getNrOfControlPoints();
  for (let i = 1; i < n; i++) {
    s += sp.getControlPointOrThrow(i).getEndPoint().x;
  }
  return s;
}

describe("refineCrossSectionRail", () => {
  it("leaves stringer anchor (knot 0) end point fixed", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "r.brd")).toBe(0);
    const sp = board.crossSections[0]!.getBezierSpline();
    const ax = sp.getControlPointOrThrow(0).getEndPoint().x;
    const ay = sp.getControlPointOrThrow(0).getEndPoint().y;
    refineCrossSectionRail(sp, "soften");
    expect(sp.getControlPointOrThrow(0).getEndPoint().x).toBe(ax);
    expect(sp.getControlPointOrThrow(0).getEndPoint().y).toBe(ay);
  });

  it("soften vs harden shift rail mass in opposite directions (aggregate X)", () => {
    const softBoard = new BezierBoard();
    expect(loadBrdFromText(softBoard, BOARD_WITH_SECTIONS_BRD, "s.brd")).toBe(0);
    const hardBoard = new BezierBoard();
    expect(loadBrdFromText(hardBoard, BOARD_WITH_SECTIONS_BRD, "h.brd")).toBe(0);
    const spSoft = softBoard.crossSections[0]!.getBezierSpline();
    const spHard = hardBoard.crossSections[0]!.getBezierSpline();
    const base = sumEndX(spSoft);
    refineCrossSectionRail(spSoft, "soften");
    refineCrossSectionRail(spHard, "harden");
    expect(sumEndX(spSoft)).toBeGreaterThan(base);
    expect(sumEndX(spHard)).toBeLessThan(base);
  });

  it("preserves strict X ordering of section end points", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "o.brd")).toBe(0);
    const sp = board.crossSections[0]!.getBezierSpline();
    refineCrossSectionRail(sp, "soften");
    const n = sp.getNrOfControlPoints();
    for (let i = 1; i < n; i++) {
      const xi = sp.getControlPointOrThrow(i).getEndPoint().x;
      const xim = sp.getControlPointOrThrow(i - 1).getEndPoint().x;
      expect(xi).toBeGreaterThanOrEqual(xim);
    }
  });
});
