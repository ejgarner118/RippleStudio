import { describe, expect, it } from "vitest";
import {
  CAM_PROFILE_BALANCED,
  buildRasterDeckToolpath,
  previewToolpath,
} from "./index.js";

describe("buildRasterDeckToolpath", () => {
  it("builds deterministic rough+finish path with rapids", () => {
    const samples = Array.from({ length: 21 }, (_, i) => {
      const x = i * 100;
      return { x, width: 520 - Math.abs(i - 10) * 8, thickness: 62 - Math.abs(i - 10) * 2.2, rocker: i * 0.55 };
    });
    const points = buildRasterDeckToolpath(2000, samples, CAM_PROFILE_BALANCED);
    expect(points.length).toBeGreaterThan(500);
    expect(points.some((p) => p.rapid)).toBe(true);
    const preview = previewToolpath(points);
    expect(preview.bounds.max[0]).toBeGreaterThan(1900);
    expect(preview.warnings.length).toBe(0);
  });
});

