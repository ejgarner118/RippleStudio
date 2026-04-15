import { describe, it, expect } from "vitest";
import { BezierBoard } from "../model/bezierBoard.js";
import { loadBrdFromText } from "../brd/brdReader.js";
import { BOARD_WITH_SECTIONS_BRD, MINI_BOARD_BRD } from "../defaultBoards.js";
import { sampleBezierSpline2D } from "./bezierSample.js";
import { buildLoftMesh3D } from "./boardLoft.js";

describe("boardLoft", () => {
  it("builds mesh from board with two cross-sections", () => {
    const brd = new BezierBoard();
    expect(loadBrdFromText(brd, BOARD_WITH_SECTIONS_BRD, "s.brd")).toBe(0);
    expect(brd.crossSections.length).toBe(2);
    const outline = sampleBezierSpline2D(brd.outline, 40);
    const mesh = buildLoftMesh3D(brd, outline);
    expect(mesh).not.toBeNull();
    expect(mesh!.positions.length).toBeGreaterThan(0);
    expect(mesh!.indices.length).toBeGreaterThan(0);
  });

  it("mesh spans most of board length (Java-style grid along X)", () => {
    const brd = new BezierBoard();
    loadBrdFromText(brd, BOARD_WITH_SECTIONS_BRD, "s.brd");
    const outline = sampleBezierSpline2D(brd.outline, 40);
    const mesh = buildLoftMesh3D(brd, outline)!;
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < mesh.positions.length; i += 3) {
      const x = mesh.positions[i]!;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    const outlineLen = brd.outline.getControlPointOrThrow(1).getEndPoint().x;
    expect(maxX - minX).toBeGreaterThan(outlineLen * 0.85);
  });

  it("returns null without drawable cross-sections", () => {
    const brd = new BezierBoard();
    loadBrdFromText(brd, MINI_BOARD_BRD, "m.brd");
    const outline = sampleBezierSpline2D(brd.outline, 8);
    expect(buildLoftMesh3D(brd, outline)).toBeNull();
  });

  it("preserves outline tail overhang in loft X span", () => {
    const brd = new BezierBoard();
    expect(loadBrdFromText(brd, BOARD_WITH_SECTIONS_BRD, "s.brd")).toBe(0);
    const tail = brd.outline.getControlPointOrThrow(0);
    tail.points[1]!.x = -90;
    tail.points[2]!.x = -140;
    tail.points[2]!.y = Math.max(tail.points[2]!.y, 70);
    const outline = sampleBezierSpline2D(brd.outline, 120);
    const mesh = buildLoftMesh3D(brd, outline);
    expect(mesh).not.toBeNull();

    let minX = Infinity;
    for (let i = 0; i < mesh!.positions.length; i += 3) {
      minX = Math.min(minX, mesh!.positions[i]!);
    }
    expect(minX).toBeLessThan(-40);
  });
});
