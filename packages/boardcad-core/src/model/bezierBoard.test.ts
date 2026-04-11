import { describe, it, expect } from "vitest";
import { BezierBoard } from "./bezierBoard.js";
import { loadBrdFromText } from "../brd/brdReader.js";
import { MINI_BOARD_BRD } from "../defaultBoards.js";

describe("BezierBoard / domain", () => {
  it("setLocks runs without throw after load", () => {
    const brd = new BezierBoard();
    loadBrdFromText(brd, MINI_BOARD_BRD, "x.brd");
    expect(() => brd.setLocks()).not.toThrow();
  });

  it("checkAndFixContinousy is stable", () => {
    const brd = new BezierBoard();
    loadBrdFromText(brd, MINI_BOARD_BRD, "x.brd");
    brd.checkAndFixContinousy(false, true);
    expect(brd.outline.getNrOfControlPoints()).toBeGreaterThan(0);
  });
});
