import { describe, expect, it } from "vitest";
import { BezierKnot } from "./bezierKnot.js";

describe("BezierKnot handle mode transitions", () => {
  it("relinks tangents when returning from independent to aligned", () => {
    const k = new BezierKnot();
    k.points[0]!.x = 100;
    k.points[0]!.y = 20;
    k.points[1]!.x = 80;
    k.points[1]!.y = 35;
    k.points[2]!.x = 126;
    k.points[2]!.y = 6;

    k.setHandleMode("independent");
    k.setHandleMode("aligned");

    const prevV = { x: k.points[0]!.x - k.points[1]!.x, y: k.points[0]!.y - k.points[1]!.y };
    const nextV = { x: k.points[2]!.x - k.points[0]!.x, y: k.points[2]!.y - k.points[0]!.y };
    const cross = prevV.x * nextV.y - prevV.y * nextV.x;
    expect(Math.abs(cross)).toBeLessThan(1e-6);
    expect(k.getHandleMode()).toBe("aligned");
  });

  it("mirrored mode enforces equal tangent lengths", () => {
    const k = new BezierKnot();
    k.points[0]!.x = 0;
    k.points[0]!.y = 0;
    k.points[1]!.x = -30;
    k.points[1]!.y = 10;
    k.points[2]!.x = 5;
    k.points[2]!.y = 2;

    k.setHandleMode("independent");
    k.setHandleMode("mirrored");

    const lenPrev = Math.hypot(k.points[0]!.x - k.points[1]!.x, k.points[0]!.y - k.points[1]!.y);
    const lenNext = Math.hypot(k.points[2]!.x - k.points[0]!.x, k.points[2]!.y - k.points[0]!.y);
    expect(Math.abs(lenPrev - lenNext)).toBeLessThan(1e-6);
    expect(k.getHandleMode()).toBe("mirrored");
  });
});

