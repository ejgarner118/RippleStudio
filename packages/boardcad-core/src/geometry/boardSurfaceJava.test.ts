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

  it("end-cap ring matches strip boundary (no tiny ring / open cap)", () => {
    const brd = new BezierBoard();
    loadBrdFromText(brd, BOARD_WITH_SECTIONS_BRD, "s.brd");
    const mesh = buildJavaSurfaceMesh(brd, { lengthStepMm: 5, widthStepMm: 2 });
    expect(mesh).not.toBeNull();
    expect(mesh!.indices.length).toBeGreaterThan(0);
    const len = getBoardLengthJava(brd);
    const highX = Math.max(0.1, len - 0.1);
    let nearTail = 0;
    for (let i = 0; i < mesh!.positions.length; i += 3) {
      if (Math.abs(mesh!.positions[i]! - highX) < 0.05) nearTail++;
    }
    expect(nearTail).toBeGreaterThan(8);
  });

  it("buildJavaSurfaceMesh avoids degenerate triangles", () => {
    const brd = new BezierBoard();
    loadBrdFromText(brd, BOARD_WITH_SECTIONS_BRD, "s.brd");
    const mesh = buildJavaSurfaceMesh(brd, { lengthStepMm: 5, widthStepMm: 2 });
    expect(mesh).not.toBeNull();
    for (let i = 0; i < mesh!.indices.length; i += 3) {
      const ia = mesh!.indices[i]!;
      const ib = mesh!.indices[i + 1]!;
      const ic = mesh!.indices[i + 2]!;
      const ax = mesh!.positions[ia * 3]!;
      const ay = mesh!.positions[ia * 3 + 1]!;
      const az = mesh!.positions[ia * 3 + 2]!;
      const bx = mesh!.positions[ib * 3]!;
      const by = mesh!.positions[ib * 3 + 1]!;
      const bz = mesh!.positions[ib * 3 + 2]!;
      const cx = mesh!.positions[ic * 3]!;
      const cy = mesh!.positions[ic * 3 + 1]!;
      const cz = mesh!.positions[ic * 3 + 2]!;
      const abx = bx - ax;
      const aby = by - ay;
      const abz = bz - az;
      const acx = cx - ax;
      const acy = cy - ay;
      const acz = cz - az;
      const nx = aby * acz - abz * acy;
      const ny = abz * acx - abx * acz;
      const nz = abx * acy - aby * acx;
      expect(nx * nx + ny * ny + nz * nz).toBeGreaterThan(1e-12);
    }
  });
});
