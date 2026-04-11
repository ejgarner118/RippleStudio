import type { BezierBoard } from "../model/bezierBoard.js";
import type { BBox2D } from "../geometry/bezierSample.js";
import {
  bounds2D,
  mirrorOutlineHalfToOtherRail,
  sampleBezierSpline2D,
  unionBounds,
} from "../geometry/bezierSample.js";

const SVG_SAMPLES = 48;
const PAD = 8;

/** Board coords → SVG: X right, Y up (relative to bbox). */
function polylinePathSvgRel(xy: Float32Array, b: BBox2D): string {
  if (xy.length < 4) return "";
  let d = `M ${xy[0]! - b.minX} ${b.maxY - xy[1]!}`;
  for (let i = 2; i < xy.length; i += 2) {
    d += ` L ${xy[i]! - b.minX} ${b.maxY - xy[i + 1]!}`;
  }
  return d;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plan view: both rails, Y flipped so outline reads visually “up”. */
export function renderOutlineSvg(brd: BezierBoard): string {
  const lower = sampleBezierSpline2D(brd.outline, SVG_SAMPLES);
  const upper = mirrorOutlineHalfToOtherRail(lower);
  const b = unionBounds(bounds2D(lower), bounds2D(upper));
  if (!b) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"/>`;
  }
  const w = b.maxX - b.minX + 2 * PAD;
  const h = b.maxY - b.minY + 2 * PAD;
  const d0 = polylinePathSvgRel(lower, b);
  const d1 = polylinePathSvgRel(upper, b);
  const title = escapeXml(brd.name || "Outline");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <title>${title}</title>
  <rect x="0" y="0" width="${w}" height="${h}" fill="#f8f9fc"/>
  <g transform="translate(${PAD},${PAD})">
    <path d="${d0}" fill="none" stroke="#1a5fb4" stroke-width="1.5"/>
    <path d="${d1}" fill="none" stroke="#1a5fb4" stroke-width="1.5"/>
  </g>
</svg>`;
}

/** Side view: deck + bottom (length vs rocker). */
export function renderProfileSvg(brd: BezierBoard): string {
  const deck = sampleBezierSpline2D(brd.deck, SVG_SAMPLES);
  const bottom = sampleBezierSpline2D(brd.bottom, SVG_SAMPLES);
  const b = unionBounds(bounds2D(deck), bounds2D(bottom));
  if (!b) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"/>`;
  }
  const w = b.maxX - b.minX + 2 * PAD;
  const h = b.maxY - b.minY + 2 * PAD;
  const dDeck = polylinePathSvgRel(deck, b);
  const dBottom = polylinePathSvgRel(bottom, b);
  const title = escapeXml(`${brd.name || "Board"} profile`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <title>${title}</title>
  <rect x="0" y="0" width="${w}" height="${h}" fill="#faf8ff"/>
  <g transform="translate(${PAD},${PAD})">
    <path d="${dBottom}" fill="none" stroke="#3d4f63" stroke-width="1.5" stroke-dasharray="4 3"/>
    <path d="${dDeck}" fill="none" stroke="#8b5a2b" stroke-width="1.5"/>
  </g>
</svg>`;
}
