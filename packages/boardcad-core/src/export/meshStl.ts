/**
 * Binary STL from indexed triangle mesh (positions xyz, indices triangle list).
 * Coordinates are written as-is (caller chooses units / axis convention).
 */

import { CORE_EXPORT_SOURCE_LABEL } from "../brand.js";

function triangleNormal(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  cx: number,
  cy: number,
  cz: number,
): [number, number, number] {
  const ux = bx - ax;
  const uy = by - ay;
  const uz = bz - az;
  const vx = cx - ax;
  const vy = cy - ay;
  const vz = cz - az;
  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  nx /= len;
  ny /= len;
  nz /= len;
  return [nx, ny, nz];
}

function writeFloat32(dv: DataView, off: number, v: number): number {
  dv.setFloat32(off, v, true);
  return off + 4;
}

/** 80-byte header + triangle count + triangles (little-endian). */
export function meshToStlBinary(
  positions: Float32Array,
  indices: Uint32Array,
  headerLabel = CORE_EXPORT_SOURCE_LABEL,
): Uint8Array {
  const triCount = indices.length / 3;
  const buf = new ArrayBuffer(84 + triCount * 50);
  const u8 = new Uint8Array(buf);
  const dv = new DataView(buf);
  const enc = new TextEncoder().encode(headerLabel.slice(0, 80));
  u8.set(enc, 0);
  dv.setUint32(80, triCount, true);
  let off = 84;
  for (let t = 0; t < triCount; t++) {
    const i0 = indices[t * 3]!;
    const i1 = indices[t * 3 + 1]!;
    const i2 = indices[t * 3 + 2]!;
    const ax = positions[i0 * 3]!;
    const ay = positions[i0 * 3 + 1]!;
    const az = positions[i0 * 3 + 2]!;
    const bx = positions[i1 * 3]!;
    const by = positions[i1 * 3 + 1]!;
    const bz = positions[i1 * 3 + 2]!;
    const cx = positions[i2 * 3]!;
    const cy = positions[i2 * 3 + 1]!;
    const cz = positions[i2 * 3 + 2]!;
    const [nx, ny, nz] = triangleNormal(ax, ay, az, bx, by, bz, cx, cy, cz);
    off = writeFloat32(dv, off, nx);
    off = writeFloat32(dv, off, ny);
    off = writeFloat32(dv, off, nz);
    off = writeFloat32(dv, off, ax);
    off = writeFloat32(dv, off, ay);
    off = writeFloat32(dv, off, az);
    off = writeFloat32(dv, off, bx);
    off = writeFloat32(dv, off, by);
    off = writeFloat32(dv, off, bz);
    off = writeFloat32(dv, off, cx);
    off = writeFloat32(dv, off, cy);
    off = writeFloat32(dv, off, cz);
    dv.setUint16(off, 0, true);
    off += 2;
  }
  return u8;
}

export function meshToStlAscii(
  positions: Float32Array,
  indices: Uint32Array,
  name = "board",
): string {
  const triCount = indices.length / 3;
  const lines: string[] = [`solid ${name}`];
  for (let t = 0; t < triCount; t++) {
    const i0 = indices[t * 3]!;
    const i1 = indices[t * 3 + 1]!;
    const i2 = indices[t * 3 + 2]!;
    const ax = positions[i0 * 3]!;
    const ay = positions[i0 * 3 + 1]!;
    const az = positions[i0 * 3 + 2]!;
    const bx = positions[i1 * 3]!;
    const by = positions[i1 * 3 + 1]!;
    const bz = positions[i1 * 3 + 2]!;
    const cx = positions[i2 * 3]!;
    const cy = positions[i2 * 3 + 1]!;
    const cz = positions[i2 * 3 + 2]!;
    const [nx, ny, nz] = triangleNormal(ax, ay, az, bx, by, bz, cx, cy, cz);
    lines.push(`facet normal ${nx} ${ny} ${nz}`);
    lines.push("  outer loop");
    lines.push(`    vertex ${ax} ${ay} ${az}`);
    lines.push(`    vertex ${bx} ${by} ${bz}`);
    lines.push(`    vertex ${cx} ${cy} ${cz}`);
    lines.push("  endloop");
    lines.push("endfacet");
  }
  lines.push(`endsolid ${name}`);
  return lines.join("\n");
}
