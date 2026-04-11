import type { BezierBoard } from "../model/bezierBoard.js";
import { renderOutlineSvg, renderProfileSvg } from "./svgBoard.js";
import { renderSpecSheetSvg } from "./specSheetSvg.js";

export type PrintKind =
  | "outline"
  | "spinTemplate"
  | "profile"
  | "crossSections"
  | "sandwichProfile"
  | "sandwichRail"
  | "sandwichDeckSkin"
  | "sandwichBottomSkin"
  | "hwsStringer"
  | "hwsRibs"
  | "hwsRail"
  | "hwsNose"
  | "hwsTail"
  | "hwsDeck"
  | "hwsBottom"
  | "chamberedWood"
  | "specSheet";

/** SVG print pipeline; outline, profile, and spec sheet implemented; others stub. */
export function renderPrintSvg(kind: PrintKind, brd: BezierBoard): string {
  if (kind === "outline") return renderOutlineSvg(brd);
  if (kind === "profile") return renderProfileSvg(brd);
  if (kind === "specSheet") return renderSpecSheetSvg(brd);
  return `<!-- print not implemented: ${kind} --><svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`;
}

export function specSheetToSvg(brd: BezierBoard): string {
  return renderPrintSvg("specSheet", brd);
}

export { renderOutlineSvg, renderProfileSvg } from "./svgBoard.js";
export { renderSpecSheetSvg } from "./specSheetSvg.js";
