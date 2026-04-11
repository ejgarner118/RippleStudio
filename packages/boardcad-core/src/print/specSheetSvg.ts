import { CORE_EXPORT_SOURCE_LABEL } from "../brand.js";
import type { BezierBoard } from "../model/bezierBoard.js";
import {
  getBoardLengthJava,
  getCenterHalfWidthJava,
  getThicknessAtPosJava,
} from "../geometry/boardInterpolation.js";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function unitsLabel(u: number): string {
  if (u === 0) return "mm";
  if (u === 1) return "cm";
  if (u === 2) return "inch";
  return `code ${u}`;
}

/** One-page summary SVG (name, metadata, key dimensions in file units). */
export function renderSpecSheetSvg(brd: BezierBoard): string {
  const title = escapeXml(brd.name || "Board");
  const len = getBoardLengthJava(brd);
  const halfW = getCenterHalfWidthJava(brd);
  const midT =
    len > 1e-6 ? getThicknessAtPosJava(brd, len / 2) : getThicknessAtPosJava(brd, 0);
  const rows: [string, string][] = [
    ["Designer", brd.designer || "—"],
    ["Author", brd.author || "—"],
    ["Version", brd.version || "—"],
    ["File units", unitsLabel(brd.currentUnits)],
    ["Length (outline max X)", len.toFixed(2)],
    ["Center half-width (outline)", halfW.toFixed(2)],
    ["Thickness @ mid-length", midT.toFixed(2)],
    ["Outline control points", String(brd.outline.getNrOfControlPoints())],
    ["Cross-sections", String(brd.crossSections.length)],
  ];
  const lineH = 22;
  const y0 = 88;
  const w = 520;
  const h = y0 + rows.length * lineH + 48;
  const rowSvg = rows
    .map(([k, v], i) => {
      const y = y0 + i * lineH;
      return `<text x="32" y="${y}" font-size="14" font-family="system-ui,sans-serif" fill="#333"><tspan>${escapeXml(k)}: </tspan><tspan font-weight="600">${escapeXml(v)}</tspan></text>`;
    })
    .join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <title>${title} — spec sheet</title>
  <rect width="${w}" height="${h}" fill="#fafafa"/>
  <text x="32" y="44" font-size="22" font-weight="700" font-family="system-ui,sans-serif" fill="#1a1a1a">${title}</text>
  <text x="32" y="68" font-size="12" font-family="system-ui,sans-serif" fill="#666">${escapeXml(CORE_EXPORT_SOURCE_LABEL)} · dimensions in file units (not auto-converted)</text>
  ${rowSvg}
</svg>`;
}
