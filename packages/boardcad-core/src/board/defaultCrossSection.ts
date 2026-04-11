import { getBoardLengthJava } from "../geometry/boardInterpolation.js";
import { BezierBoard } from "../model/bezierBoard.js";
import { BezierBoardCrossSection } from "../model/bezierBoardCrossSection.js";
import { BezierKnot } from "../model/bezierKnot.js";
import { cloneCrossSection } from "../commands/boardCommands.js";

/** New section: clone template from board or minimal two-point rail. */
export function createDefaultCrossSection(board: BezierBoard): BezierBoardCrossSection {
  const len = getBoardLengthJava(board);
  const pos = len > 1e-6 ? len * 0.5 : 50;
  for (const cs of board.crossSections) {
    if (cs.getBezierSpline().getNrOfControlPoints() >= 2) {
      const c = cloneCrossSection(cs);
      c.setPosition(pos);
      return c;
    }
  }
  const out = new BezierBoardCrossSection();
  out.setPosition(pos);
  const k0 = new BezierKnot();
  k0.points[0] = { x: 0, y: 0 };
  k0.points[1] = { x: 1, y: 0 };
  k0.points[2] = { x: 0, y: 1 };
  const k1 = new BezierKnot();
  k1.points[0] = { x: 15, y: 20 };
  k1.points[1] = { x: 14, y: 20 };
  k1.points[2] = { x: 16, y: 20 };
  out.getBezierSpline().append(k0);
  out.getBezierSpline().append(k1);
  return out;
}
