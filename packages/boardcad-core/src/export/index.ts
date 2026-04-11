import type { BezierBoard } from "../model/bezierBoard.js";

export type ExportResult = { ok: true; data: string } | { ok: false; error: string };

/** NURBS → STEP (board_handler.export_board). */
export function exportNurbsStep(_brd: BezierBoard): ExportResult {
  return { ok: false, error: "STEP export not yet implemented (parity stub)." };
}

/** NURBS → 3D DXF. */
export function exportNurbsDxf(_brd: BezierBoard): ExportResult {
  return { ok: false, error: "3D DXF export not yet implemented (parity stub)." };
}

/** NURBS → STL mesh. */
export function exportNurbsStl(_brd: BezierBoard): ExportResult {
  return { ok: false, error: "STL export not yet implemented (parity stub)." };
}

/** Bezier → DXF spline / polyline variants (legacy export menu parity; not all wired yet). */
export function exportBezierDxf(_variant: string, _brd: BezierBoard): ExportResult {
  return { ok: false, error: "Bezier DXF export not yet implemented (parity stub)." };
}
