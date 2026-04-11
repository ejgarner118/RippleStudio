import { describe, it, expect } from "vitest";
import { BezierBoard } from "../model/bezierBoard.js";
import { BOARD_WITH_SECTIONS_BRD } from "../defaultBoards.js";
import { loadBrdFromText } from "./brdReader.js";
import { saveBrdToString } from "./brdWriter.js";
import { exportBoardStlBinary } from "../export/boardMeshExport.js";
import {
  MoveControlPointsCommand,
  knotSnapshot,
  translateKnotBy,
} from "../commands/boardCommands.js";

describe("workflow smoke (golden board)", () => {
  it("save → reload preserves outline structure", () => {
    const a = new BezierBoard();
    expect(loadBrdFromText(a, BOARD_WITH_SECTIONS_BRD, "a.brd")).toBe(0);
    const text = saveBrdToString(a);
    const b = new BezierBoard();
    expect(loadBrdFromText(b, text, "b.brd")).toBe(0);
    expect(b.outline.getNrOfControlPoints()).toBe(a.outline.getNrOfControlPoints());
    expect(b.crossSections.length).toBe(a.crossSections.length);
    expect(b.name).toBe(a.name);
  });

  it("mesh export is non-empty after one CP move + undo round-trip", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "w.brd")).toBe(0);
    const k = board.outline.getControlPointOrThrow(0);
    const before = knotSnapshot(k);
    translateKnotBy(k, 0.5, -0.25);
    const after = knotSnapshot(k);
    const cmd = new MoveControlPointsCommand(board, [
      { target: { kind: "outline", index: 0 }, before, after },
    ]);
    cmd.undo();
    cmd.redo();
    const stl = exportBoardStlBinary(board);
    expect(stl).not.toBeNull();
    expect(stl!.byteLength).toBeGreaterThan(200);
  });
});
