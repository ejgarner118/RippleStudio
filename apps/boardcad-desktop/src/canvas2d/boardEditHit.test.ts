import { describe, expect, it } from "vitest";
import { BezierKnot, BezierSpline } from "@boardcad/core";
import { nearestControlPointPoint } from "./boardEditHit";

function buildSingleKnotSpline(): BezierSpline {
  const sp = new BezierSpline();
  const k = new BezierKnot();
  k.points[0]!.x = 10;
  k.points[0]!.y = 10;
  k.points[1]!.x = 12;
  k.points[1]!.y = 10;
  k.points[2]!.x = 10;
  k.points[2]!.y = 12;
  sp.append(k);
  return sp;
}

describe("nearestControlPointPoint", () => {
  it("prefers endpoint over handle when distances are tied", () => {
    const sp = buildSingleKnotSpline();
    const hit = nearestControlPointPoint(sp, 11, 10, 5);
    expect(hit).toEqual({ index: 0, point: "end" });
  });

  it("can prefer handles with explicit opt-in", () => {
    const sp = buildSingleKnotSpline();
    const hit = nearestControlPointPoint(sp, 11, 10, 5, true);
    expect(hit).toEqual({ index: 0, point: "prev" });
  });
});
