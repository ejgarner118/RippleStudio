import type { BezierBoard } from "../model/bezierBoard.js";
import { buildJavaSurfaceMesh } from "../geometry/boardSurfaceJava.js";
import { javaPointsToThreeYUp } from "../geometry/boardSurfaceJava.js";
import { CORE_EXPORT_SOURCE_LABEL } from "../brand.js";
import { meshToStlAscii, meshToStlBinary } from "./meshStl.js";
import { meshToObj } from "./meshObj.js";

export type MeshExportResult =
  | { ok: true; positions: Float32Array; indices: Uint32Array }
  | { ok: false; error: string };

function validateMesh(positions: Float32Array, indices: Uint32Array): string | null {
  if (indices.length % 3 !== 0) return "Mesh indices are not triangular.";
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i]!;
    const b = indices[i + 1]!;
    const c = indices[i + 2]!;
    const ax = positions[a * 3]!;
    const ay = positions[a * 3 + 1]!;
    const az = positions[a * 3 + 2]!;
    const bx = positions[b * 3]!;
    const by = positions[b * 3 + 1]!;
    const bz = positions[b * 3 + 2]!;
    const cx = positions[c * 3]!;
    const cy = positions[c * 3 + 1]!;
    const cz = positions[c * 3 + 2]!;
    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;
    const acx = cx - ax;
    const acy = cy - ay;
    const acz = cz - az;
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;
    if (nx * nx + ny * ny + nz * nz <= 1e-12) return "Mesh has degenerate triangles.";
    if (
      !Number.isFinite(ax) ||
      !Number.isFinite(ay) ||
      !Number.isFinite(az) ||
      !Number.isFinite(bx) ||
      !Number.isFinite(by) ||
      !Number.isFinite(bz) ||
      !Number.isFinite(cx) ||
      !Number.isFinite(cy) ||
      !Number.isFinite(cz)
    ) {
      return "Mesh has non-finite vertices.";
    }
  }
  return null;
}

/** Hull mesh in Three Y-up coordinates (matches on-screen 3D). */
export function buildBoardMeshThree(board: BezierBoard): MeshExportResult {
  if (board.crossSections.length < 2) {
    return { ok: false, error: "At least two cross-sections are required for the hull mesh." };
  }
  const raw = buildJavaSurfaceMesh(board, { lengthStepMm: 1.25, widthStepMm: 1 });
  if (!raw || raw.positions.length < 9) {
    return { ok: false, error: "Could not build surface mesh." };
  }
  const positions = javaPointsToThreeYUp(raw.positions);
  const integrityError = validateMesh(positions, raw.indices);
  if (integrityError) return { ok: false, error: integrityError };
  return {
    ok: true,
    positions,
    indices: raw.indices,
  };
}

export function exportBoardStlBinary(board: BezierBoard): Uint8Array | null {
  const m = buildBoardMeshThree(board);
  if (!m.ok) return null;
  return meshToStlBinary(m.positions, m.indices, CORE_EXPORT_SOURCE_LABEL);
}

export function exportBoardStlAscii(board: BezierBoard): string | null {
  const m = buildBoardMeshThree(board);
  if (!m.ok) return null;
  return meshToStlAscii(m.positions, m.indices, board.name || "board");
}

export function exportBoardObj(board: BezierBoard): string | null {
  const m = buildBoardMeshThree(board);
  if (!m.ok) return null;
  return meshToObj(m.positions, m.indices, board.name || "board");
}
