import { loadBrdFromText } from "../brd/brdReader.js";
import { STARTER_BOARD_BRD } from "../defaultBoards.js";
import { BezierBoard } from "../model/bezierBoard.js";

/** New document: starter geometry, clean path, Untitled name. */
export function createStarterBoard(): BezierBoard {
  const b = new BezierBoard();
  loadBrdFromText(b, STARTER_BOARD_BRD, "");
  b.name = "Untitled";
  b.filename = "";
  b.storedScalars = {};
  return b;
}
