import { describe, it, expect } from "vitest";
import { CORE_EXPORT_SOURCE_LABEL } from "../brand.js";
import { BezierBoard } from "../model/bezierBoard.js";
import { renderPrintSvg, specSheetToSvg } from "./index.js";

describe("print", () => {
  it("emits spec sheet SVG with dimensions", () => {
    const brd = new BezierBoard();
    brd.name = "TestBoard";
    const svg = specSheetToSvg(brd);
    expect(svg).toContain("<svg");
    expect(svg).toContain("TestBoard");
    expect(svg).toContain("File units");
    expect(svg).toContain(CORE_EXPORT_SOURCE_LABEL);
  });

  it("renders outline and profile SVG", () => {
    const brd = new BezierBoard();
    expect(renderPrintSvg("outline", brd)).toContain("<svg");
    expect(renderPrintSvg("profile", brd)).toContain("<svg");
  });
});
