import { describe, it, expect } from "vitest";
import { BezierBoard } from "../model/bezierBoard.js";
import { loadBrdFromText } from "../brd/brdReader.js";
import { BOARD_WITH_SECTIONS_BRD, MINI_BOARD_BRD } from "../defaultBoards.js";
import {
  convertBoardMmToInches,
  gridMajorStepModelUnits,
  mmToModelLength,
  modelLengthToMm,
  scaleBoardGeometry2D,
} from "./boardUnitScale.js";

describe("boardUnitScale", () => {
  it("modelLengthToMm / mmToModelLength round-trip for each unit", () => {
    expect(modelLengthToMm(25.4, 2)).toBeCloseTo(25.4 * 25.4);
    expect(mmToModelLength(25.4, 2)).toBeCloseTo(1);
    expect(modelLengthToMm(10, 1)).toBe(100);
    expect(mmToModelLength(100, 1)).toBe(10);
    expect(modelLengthToMm(12, 0)).toBe(12);
    expect(mmToModelLength(12, 0)).toBe(12);
  });

  it("gridMajorStepModelUnits returns sensible majors", () => {
    expect(gridMajorStepModelUnits(0)).toBe(50);
    expect(gridMajorStepModelUnits(1)).toBe(5);
    expect(gridMajorStepModelUnits(2)).toBe(1);
  });

  it("convertBoardMmToInches scales geometry and sets inches", () => {
    const b = new BezierBoard();
    expect(loadBrdFromText(b, BOARD_WITH_SECTIONS_BRD, "mm.brd")).toBe(0);
    b.currentUnits = 0;
    const n = b.outline.getNrOfControlPoints();
    let refI = -1;
    let ref = 0;
    for (let i = 0; i < n; i++) {
      const x = b.outline.getControlPointOrThrow(i).getEndPoint().x;
      if (x !== 0) {
        refI = i;
        ref = x;
        break;
      }
    }
    expect(refI).toBeGreaterThanOrEqual(0);
    convertBoardMmToInches(b);
    expect(b.currentUnits).toBe(2);
    const after = b.outline.getControlPointOrThrow(refI).getEndPoint().x;
    expect(after).toBeCloseTo(ref / 25.4, 5);
  });

  it("convertBoardMmToInches is a no-op when not millimetres", () => {
    const b = new BezierBoard();
    expect(loadBrdFromText(b, MINI_BOARD_BRD, "in.brd")).toBe(0);
    b.currentUnits = 2;
    const x0 = b.outline.getControlPointOrThrow(0).getEndPoint().x;
    convertBoardMmToInches(b);
    expect(b.currentUnits).toBe(2);
    expect(b.outline.getControlPointOrThrow(0).getEndPoint().x).toBe(x0);
  });

  it("scaleBoardGeometry2D scales section stations", () => {
    const b = new BezierBoard();
    expect(loadBrdFromText(b, BOARD_WITH_SECTIONS_BRD, "scale.brd")).toBe(0);
    const p0 = b.crossSections[0]!.getPosition();
    scaleBoardGeometry2D(b, 2);
    expect(b.crossSections[0]!.getPosition()).toBeCloseTo(p0 * 2);
  });
});
