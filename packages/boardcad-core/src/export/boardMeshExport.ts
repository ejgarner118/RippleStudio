import type { BezierBoard } from "../model/bezierBoard.js";
import { buildJavaSurfaceMesh } from "../geometry/boardSurfaceJava.js";
import { javaPointsToThreeYUp } from "../geometry/boardSurfaceJava.js";
import { CORE_EXPORT_SOURCE_LABEL } from "../brand.js";
import { meshToStlAscii, meshToStlBinary } from "./meshStl.js";
import { meshToObj } from "./meshObj.js";

export type MeshExportResult =
  | { ok: true; positions: Float32Array; indices: Uint32Array }
  | { ok: false; error: string };

/** Hull mesh in Three Y-up coordinates (matches on-screen 3D). */
export function buildBoardMeshThree(board: BezierBoard): MeshExportResult {
  if (board.crossSections.length < 2) {
    return { ok: false, error: "At least two cross-sections are required for the hull mesh." };
  }
  const raw = buildJavaSurfaceMesh(board, { lengthStepMm: 1.25, widthStepMm: 1 });
  if (!raw || raw.positions.length < 9) {
    return { ok: false, error: "Could not build surface mesh." };
  }
  return {
    ok: true,
    positions: javaPointsToThreeYUp(raw.positions),
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
