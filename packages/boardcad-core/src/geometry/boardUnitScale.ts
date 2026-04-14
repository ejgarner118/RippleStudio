import type { BezierBoard } from "../model/bezierBoard.js";
import type { BezierSpline } from "../model/bezierSpline.js";

const MM_PER_INCH = 25.4;

function scaleSplinePoints(sp: BezierSpline, factor: number): void {
  const n = sp.getNrOfControlPoints();
  for (let i = 0; i < n; i++) {
    const k = sp.getControlPointOrThrow(i);
    for (let j = 0; j < 3; j++) {
      const p = k.points[j];
      if (!p) continue;
      p.x *= factor;
      p.y *= factor;
    }
  }
}

/** Scale every 2D geometry value by `factor` (outline, deck, bottom, sections, guide points). */
export function scaleBoardGeometry2D(board: BezierBoard, factor: number): void {
  scaleSplinePoints(board.outline, factor);
  scaleSplinePoints(board.deck, factor);
  scaleSplinePoints(board.bottom, factor);
  for (const p of board.outlineGuidePoints) {
    p.x *= factor;
    p.y *= factor;
  }
  for (const p of board.bottomGuidePoints) {
    p.x *= factor;
    p.y *= factor;
  }
  for (const p of board.deckGuidePoints) {
    p.x *= factor;
    p.y *= factor;
  }
  for (const cs of board.crossSections) {
    cs.setPosition(cs.getPosition() * factor);
    scaleSplinePoints(cs.getBezierSpline(), factor);
    for (const p of cs.getGuidePoints()) {
      p.x *= factor;
      p.y *= factor;
    }
  }
}

/**
 * Convert a board authored in millimetres (`currentUnits === 0`) to inches (`2`),
 * scaling all knot coordinates and section stations by 1/25.4.
 */
export function convertBoardMmToInches(board: BezierBoard): void {
  if (board.currentUnits !== 0) return;
  scaleBoardGeometry2D(board, 1 / MM_PER_INCH);
  board.currentUnits = 2;
}

/** Model length (stored in board file units) → millimetres for internal math. */
export function modelLengthToMm(value: number, currentUnits: number): number {
  switch (currentUnits) {
    case 0:
      return value;
    case 1:
      return value * 10;
    case 2:
      return value * MM_PER_INCH;
    default:
      return value;
  }
}

/** Millimetres → model length in board file units. */
export function mmToModelLength(mm: number, currentUnits: number): number {
  switch (currentUnits) {
    case 0:
      return mm;
    case 1:
      return mm / 10;
    case 2:
      return mm / MM_PER_INCH;
    default:
      return mm;
  }
}

/** Major grid step in model units for canvas grids. */
export function gridMajorStepModelUnits(currentUnits: number): number {
  switch (currentUnits) {
    case 0:
      return 50;
    case 1:
      return 5;
    case 2:
      return 1;
    default:
      return 50;
  }
}
