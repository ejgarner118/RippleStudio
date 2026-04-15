import { describe, it, expect } from "vitest";
import { BezierBoard } from "../model/bezierBoard.js";
import { loadBrdFromText } from "../brd/brdReader.js";
import { MINI_BOARD_BRD } from "../defaultBoards.js";
import { applyAutoScale } from "./autoScale.js";

describe("applyAutoScale", () => {
  it("keeps tail width when lockTailWidth enabled", () => {
    const brd = new BezierBoard();
    expect(loadBrdFromText(brd, MINI_BOARD_BRD, "scale-lock.brd")).toBe(0);
    const tailBefore = brd.outline.getControlPointOrThrow(0).getEndPoint().y;
    applyAutoScale(brd, {
      lengthScale: 1.1,
      widthScale: 1.25,
      thicknessScale: 1.05,
      locks: { lockTailWidth: true },
    });
    const tailAfter = brd.outline.getControlPointOrThrow(0).getEndPoint().y;
    expect(Math.abs(tailAfter - tailBefore)).toBeLessThan(1e-6);
  });

  it("keeps nose rocker when lockNoseRocker enabled", () => {
    const brd = new BezierBoard();
    expect(loadBrdFromText(brd, MINI_BOARD_BRD, "scale-rocker.brd")).toBe(0);
    const noseIdx = brd.bottom.getNrOfControlPoints() - 1;
    const before = brd.bottom.getControlPointOrThrow(noseIdx).getEndPoint().y;
    applyAutoScale(brd, {
      lengthScale: 1.08,
      widthScale: 1.02,
      thicknessScale: 1.15,
      locks: { lockNoseRocker: true },
    });
    const after = brd.bottom.getControlPointOrThrow(noseIdx).getEndPoint().y;
    expect(Math.abs(after - before)).toBeLessThan(1e-6);
  });
});

