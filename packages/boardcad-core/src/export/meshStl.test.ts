import { describe, it, expect } from "vitest";
import { meshToStlAscii, meshToStlBinary } from "./meshStl.js";

describe("meshStl", () => {
  it("binary STL has correct header triangle count and no NaN in vertices", () => {
    const positions = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
    ]);
    const indices = new Uint32Array([0, 1, 2]);
    const buf = meshToStlBinary(positions, indices, "test");
    expect(buf.byteLength).toBe(84 + 50);
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    expect(dv.getUint32(80, true)).toBe(1);
    const ax = dv.getFloat32(84 + 12, true);
    const ay = dv.getFloat32(84 + 16, true);
    const az = dv.getFloat32(84 + 20, true);
    expect(Number.isFinite(ax) && Number.isFinite(ay) && Number.isFinite(az)).toBe(true);
  });

  it("ASCII STL ends with endsolid and lists one facet", () => {
    const positions = new Float32Array([0, 0, 0, 2, 0, 0, 0, 3, 0]);
    const indices = new Uint32Array([0, 1, 2]);
    const s = meshToStlAscii(positions, indices, "tri");
    expect(s).toContain("solid tri");
    expect(s).toContain("facet normal");
    expect(s).toContain("vertex");
    expect(s.trim().endsWith("endsolid tri")).toBe(true);
  });
});
