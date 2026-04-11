import { describe, it, expect } from "vitest";
import { BezierBoard } from "../model/bezierBoard.js";
import { loadBrdFromText } from "../brd/brdReader.js";
import { BOARD_WITH_SECTIONS_BRD } from "../defaultBoards.js";
import { buildJavaSurfaceMesh, getPointAtJava, javaPointsToThreeYUp } from "./boardSurfaceJava.js";
import { getBoardLengthJava } from "./boardInterpolation.js";

describe("boardSurfaceJava", () => {
  it("getPointAtJava returns finite deck point", () => {
    const brd = new BezierBoard();
    loadBrdFromText(brd, BOARD_WITH_SECTIONS_BRD, "s.brd");
    const p = getPointAtJava(brd, 50, 0.5, -45, 45);
    expect(p).not.toBeNull();
    expect(Number.isFinite(p!.x)).toBe(true);
    expect(Number.isFinite(p!.y)).toBe(true);
    expect(Number.isFinite(p!.z)).toBe(true);
  });

  it("buildJavaSurfaceMesh spans board length in Java X", () => {
    const brd = new BezierBoard();
    loadBrdFromText(brd, BOARD_WITH_SECTIONS_BRD, "s.brd");
    const mesh = buildJavaSurfaceMesh(brd, { lengthStepMm: 5, widthStepMm: 2 });
    expect(mesh).not.toBeNull();
    const len = getBoardLengthJava(brd);
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < mesh!.positions.length; i += 3) {
      const x = mesh!.positions[i]!;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    expect(maxX - minX).toBeGreaterThan(len * 0.7);
    const three = javaPointsToThreeYUp(mesh!.positions);
    expect(three.length).toBe(mesh!.positions.length);
  });
});
