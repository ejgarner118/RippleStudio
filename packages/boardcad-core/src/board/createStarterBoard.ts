import { loadBrdFromText } from "../brd/brdReader.js";
import {
  BLANK_BOARD_BRD,
  FISH_TEMPLATE_BRD,
  LONGBOARD_TEMPLATE_BRD,
  SHORTBOARD_TEMPLATE_BRD,
  STARTER_BOARD_BRD,
} from "../defaultBoards.js";
import { convertBoardMmToInches } from "../geometry/boardUnitScale.js";
import { BezierBoard } from "../model/bezierBoard.js";

/** New document: starter geometry, clean path, Untitled name. */
export function createStarterBoard(): BezierBoard {
  return createBoardFromTemplate("starter");
}

/** Empty baseline board: valid splines and two sections; user adds all shape. */
export function createBlankBoard(): BezierBoard {
  const b = new BezierBoard();
  loadBrdFromText(b, BLANK_BOARD_BRD, "");
  b.name = "Untitled";
  b.filename = "";
  b.storedScalars = {};
  b.checkAndFixContinousy(false, true);
  b.setLocks();
  convertBoardMmToInches(b);
  return b;
}

export type NewBoardTemplatePreset = "starter" | "shortboard" | "fish" | "longboard";

export function createBoardFromTemplate(preset: NewBoardTemplatePreset): BezierBoard {
  const source =
    preset === "shortboard"
      ? SHORTBOARD_TEMPLATE_BRD
      : preset === "fish"
        ? FISH_TEMPLATE_BRD
        : preset === "longboard"
          ? LONGBOARD_TEMPLATE_BRD
          : STARTER_BOARD_BRD;
  const b = new BezierBoard();
  loadBrdFromText(b, source, "");
  if (preset === "starter") b.name = "Untitled";
  b.filename = "";
  b.storedScalars = {};
  b.checkAndFixContinousy(false, true);
  b.setLocks();
  convertBoardMmToInches(b);
  return b;
}
