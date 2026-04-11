import { describe, it, expect } from "vitest";
import { BezierBoard } from "../model/bezierBoard.js";
import { loadBrdFromText } from "../brd/brdReader.js";
import { BOARD_WITH_SECTIONS_BRD } from "../defaultBoards.js";
import {
  MoveControlPointsCommand,
  knotSnapshot,
  translateKnotBy,
} from "./boardCommands.js";

describe("boardCommands", () => {
  it("MoveControlPointsCommand undo/redo restores outline knot", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "t.brd")).toBe(0);
    const k = board.outline.getControlPointOrThrow(0);
    const before = knotSnapshot(k);
    translateKnotBy(k, 12, -3);
    const after = knotSnapshot(k);
    const cmd = new MoveControlPointsCommand(board, [
      { target: { kind: "outline", index: 0 }, before, after },
    ]);
    cmd.undo();
    expect(knotSnapshot(k)).toEqual(before);
    cmd.redo();
    expect(knotSnapshot(k)).toEqual(after);
  });
});
