import { describe, it, expect } from "vitest";
import { BezierBoard } from "../model/bezierBoard.js";
import { loadBrdFromText } from "../brd/brdReader.js";
import { BOARD_WITH_SECTIONS_BRD } from "../defaultBoards.js";
import { buildBoardMeshThree, exportBoardObj, exportBoardStlBinary } from "./boardMeshExport.js";

describe("boardMeshExport", () => {
  it("exports non-empty binary STL for board with two sections", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "m.brd")).toBe(0);
    const buf = exportBoardStlBinary(board);
    expect(buf).not.toBeNull();
    expect(buf!.byteLength).toBeGreaterThan(84);
    const dv = new DataView(buf!.buffer, buf!.byteOffset, buf!.byteLength);
    expect(dv.getUint32(80, true)).toBeGreaterThan(0);
  });

  it("builds mesh with finite non-degenerate triangles", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "m.brd")).toBe(0);
    const mesh = buildBoardMeshThree(board);
    expect(mesh.ok).toBe(true);
    if (!mesh.ok) return;
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const ia = mesh.indices[i]!;
      const ib = mesh.indices[i + 1]!;
      const ic = mesh.indices[i + 2]!;
      const ax = mesh.positions[ia * 3]!;
      const ay = mesh.positions[ia * 3 + 1]!;
      const az = mesh.positions[ia * 3 + 2]!;
      const bx = mesh.positions[ib * 3]!;
      const by = mesh.positions[ib * 3 + 1]!;
      const bz = mesh.positions[ib * 3 + 2]!;
      const cx = mesh.positions[ic * 3]!;
      const cy = mesh.positions[ic * 3 + 1]!;
      const cz = mesh.positions[ic * 3 + 2]!;
      expect(Number.isFinite(ax) && Number.isFinite(ay) && Number.isFinite(az)).toBe(true);
      expect(Number.isFinite(bx) && Number.isFinite(by) && Number.isFinite(bz)).toBe(true);
      expect(Number.isFinite(cx) && Number.isFinite(cy) && Number.isFinite(cz)).toBe(true);
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

  it("exports OBJ alongside STL after mesh checks", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "m.brd")).toBe(0);
    const obj = exportBoardObj(board);
    expect(obj).not.toBeNull();
    expect(obj).toContain("\nv ");
    expect(obj).toContain("\nf ");
  });
});
