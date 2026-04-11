import type { BezierBoard } from "@boardcad/core";

export function boardUnitsLabel(brd: BezierBoard): string {
  switch (brd.currentUnits) {
    case 0:
      return "mm";
    case 1:
      return "cm";
    case 2:
      return "inch";
    default:
      return `code ${brd.currentUnits}`;
  }
}
