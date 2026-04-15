/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { templatePresetForNewBoard } from "./App";
import {
  BezierBoard,
  BOARD_WITH_SECTIONS_BRD,
  buildLoftMesh3D,
  loadBrdFromText,
  sampleBezierSpline2D,
} from "@boardcad/core";

describe("templatePresetForNewBoard", () => {
  it("maps guided setup to Standard template", () => {
    expect(templatePresetForNewBoard("empty_guided")).toBe("standard");
  });

  it("keeps explicit template presets unchanged", () => {
    expect(templatePresetForNewBoard("shortboard")).toBe("shortboard");
    expect(templatePresetForNewBoard("fish")).toBe("fish");
  });

  it("produces tail overhang mesh usable by app 3D path", () => {
    const brd = new BezierBoard();
    expect(loadBrdFromText(brd, BOARD_WITH_SECTIONS_BRD, "app-tail.brd")).toBe(0);
    const tail = brd.outline.getControlPointOrThrow(0);
    tail.points[1]!.x = -110;
    tail.points[2]!.x = -170;
    tail.points[2]!.y = Math.max(tail.points[2]!.y, 90);
    const outline = sampleBezierSpline2D(brd.outline, 160);
    const mesh = buildLoftMesh3D(brd, outline, "standard");
    expect(mesh).not.toBeNull();
    expect(mesh!.positions.length).toBeGreaterThan(100);
    expect(mesh!.indices.length).toBeGreaterThan(100);
    let finiteCount = 0;
    for (let i = 0; i < mesh!.positions.length; i++) {
      if (Number.isFinite(mesh!.positions[i]!)) finiteCount++;
    }
    expect(finiteCount).toBe(mesh!.positions.length);
  });
});
