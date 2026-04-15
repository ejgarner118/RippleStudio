import type { BezierBoard } from "../model/bezierBoard.js";
import { getBoardLengthJava, getWidthAtPosJava, getDeckAtPosJava, getRockerAtPosJava } from "../geometry/boardInterpolation.js";
import { renderSpecSheetSvg } from "../print/specSheetSvg.js";
import { exportBoardStlAscii } from "./boardMeshExport.js";

export type ExportResult = { ok: true; data: string } | { ok: false; error: string };

/** NURBS → STEP (board_handler.export_board). */
export function exportNurbsStep(_brd: BezierBoard): ExportResult {
  const data = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('Ripple Studio STEP placeholder'),'1');
FILE_NAME('board.step','',('Ripple Studio'),('Ripple Studio'),'','', '');
FILE_SCHEMA(('AUTOMOTIVE_DESIGN'));
ENDSEC;
DATA;
/* Detailed NURBS surface export is planned; this placeholder is intentional and machine-safe to parse as STEP text. */
ENDSEC;
END-ISO-10303-21;`;
  return { ok: true, data };
}

/** NURBS → 3D DXF. */
export function exportNurbsDxf(_brd: BezierBoard): ExportResult {
  const data = "0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n";
  return { ok: true, data };
}

/** NURBS → STL mesh. */
export function exportNurbsStl(brd: BezierBoard): ExportResult {
  const data = exportBoardStlAscii(brd);
  if (!data) return { ok: false, error: "STL export failed: invalid geometry." };
  return { ok: true, data };
}

/** Bezier → DXF spline / polyline variants (legacy export menu parity; not all wired yet). */
export function exportBezierDxf(variant: string, brd: BezierBoard): ExportResult {
  const len = getBoardLengthJava(brd);
  const stations = 64;
  const dxf: string[] = ["0", "SECTION", "2", "ENTITIES"];
  const addPolyline = (layer: string, yFn: (x: number) => number) => {
    dxf.push("0", "LWPOLYLINE", "8", layer, "90", String(stations + 1), "70", "0");
    for (let i = 0; i <= stations; i++) {
      const x = (len * i) / stations;
      dxf.push("10", x.toFixed(4), "20", yFn(x).toFixed(4));
    }
  };
  if (variant === "outline" || variant === "all") {
    addPolyline("outline_top", (x) => getWidthAtPosJava(brd, x) * 0.5);
    addPolyline("outline_bottom", (x) => -getWidthAtPosJava(brd, x) * 0.5);
  }
  if (variant === "profile" || variant === "all") {
    addPolyline("deck", (x) => getDeckAtPosJava(brd, x));
    addPolyline("bottom", (x) => getRockerAtPosJava(brd, x));
  }
  dxf.push("0", "ENDSEC", "0", "EOF");
  return { ok: true, data: dxf.join("\n") };
}

export function exportPdfSpecSheet(brd: BezierBoard): ExportResult {
  // PDF generation path uses print-ready SVG payload for now. Desktop integrations can convert downstream.
  return { ok: true, data: renderSpecSheetSvg(brd) };
}

export function exportIgesPlaceholder(brd: BezierBoard): ExportResult {
  const len = getBoardLengthJava(brd);
  const data = `IGES_PLACEHOLDER\nNAME=${brd.name || "board"}\nLENGTH_MM=${len.toFixed(3)}\n`;
  return { ok: true, data };
}
