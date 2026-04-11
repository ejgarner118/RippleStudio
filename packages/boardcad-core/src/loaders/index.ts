import type { BezierBoard } from "../model/bezierBoard.js";

export type LoaderResult = { ok: true } | { ok: false; error: string };

/** `.s3d` — port of [S3dReader](boardcad-java/board/readers/S3dReader.java). */
export function loadS3d(_brd: BezierBoard, _path: string): LoaderResult {
  return { ok: false, error: "S3D loader not yet implemented (parity stub)." };
}

/** `.srf` — port of SrfReader. */
export function loadSrf(_brd: BezierBoard, _path: string): LoaderResult {
  return { ok: false, error: "SRF loader not yet implemented (parity stub)." };
}

/** `.stp` / `.step` — STEP NURBS import (BoardHandler.open_board). */
export function loadStep(_brd: BezierBoard, _path: string): LoaderResult {
  return { ok: false, error: "STEP import not yet implemented (parity stub)." };
}

/** `.cad` — native CAD board format. */
export function loadCad(_path: string): LoaderResult {
  return { ok: false, error: "CAD loader not yet implemented (parity stub)." };
}

export function loadByExtension(
  brd: BezierBoard,
  path: string,
  ext: string,
): LoaderResult {
  const e = ext.toLowerCase();
  if (e === "s3d") return loadS3d(brd, path);
  if (e === "srf") return loadSrf(brd, path);
  if (e === "stp" || e === "step") return loadStep(brd, path);
  if (e === "cad") return loadCad(path);
  return { ok: false, error: `Unknown extension: ${ext}` };
}
