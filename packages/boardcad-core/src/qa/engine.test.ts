import { describe, it, expect } from "vitest";
import { BezierBoard } from "../model/bezierBoard.js";
import { loadBrdFromText } from "../brd/brdReader.js";
import { BOARD_WITH_SECTIONS_BRD, MINI_BOARD_BRD } from "../defaultBoards.js";
import { runBoardQaChecks } from "./engine.js";

describe("runBoardQaChecks", () => {
  it("returns section-order error for unsorted stations", () => {
    const brd = new BezierBoard();
    expect(loadBrdFromText(brd, BOARD_WITH_SECTIONS_BRD, "qa-order.brd")).toBe(0);
    expect(brd.crossSections.length).toBeGreaterThanOrEqual(2);
    const a = brd.crossSections[0]!.getPosition();
    const b = brd.crossSections[1]!.getPosition();
    brd.crossSections[0]!.setPosition(b + 10);
    brd.crossSections[1]!.setPosition(a - 10);
    const issues = runBoardQaChecks(brd);
    expect(issues.some((i) => i.id === "section-order" && i.severity === "error")).toBe(true);
  });

  it("flags thin board when threshold is high", () => {
    const brd = new BezierBoard();
    expect(loadBrdFromText(brd, MINI_BOARD_BRD, "qa-thin.brd")).toBe(0);
    const issues = runBoardQaChecks(brd, { minThicknessMm: 100 });
    expect(issues.some((i) => i.id.startsWith("thin-"))).toBe(true);
  });
});

