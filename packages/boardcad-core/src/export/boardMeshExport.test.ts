import { describe, it, expect } from "vitest";
import { BezierBoard } from "../model/bezierBoard.js";
import { loadBrdFromText } from "../brd/brdReader.js";
import { BOARD_WITH_SECTIONS_BRD } from "../defaultBoards.js";
import { exportBoardStlBinary } from "./boardMeshExport.js";

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
});
