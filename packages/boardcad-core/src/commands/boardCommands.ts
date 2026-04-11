import type { BoardCommand } from "../undo/commandStack.js";
import type { BezierBoard } from "../model/bezierBoard.js";
import { BezierBoardCrossSection } from "../model/bezierBoardCrossSection.js";
import { BezierKnot } from "../model/bezierKnot.js";

export type SplineEditTarget =
  | { kind: "outline"; index: number }
  | { kind: "deck"; index: number }
  | { kind: "bottom"; index: number }
  | { kind: "section"; sectionIndex: number; index: number };

export type KnotMoveEdit = {
  target: SplineEditTarget;
  before: number[];
  after: number[];
};

function knotSnapshot(k: BezierKnot): number[] {
  const s: number[] = [];
  for (let i = 0; i < 3; i++) {
    s.push(k.points[i]!.x, k.points[i]!.y);
  }
  return s;
}

function applyKnotSnapshot(k: BezierKnot, s: number[]): void {
  for (let i = 0; i < 3; i++) {
    k.points[i]!.x = s[i * 2]!;
    k.points[i]!.y = s[i * 2 + 1]!;
  }
}

export function getKnot(board: BezierBoard, t: SplineEditTarget): BezierKnot | null {
  switch (t.kind) {
    case "outline":
      return board.outline.getControlPoint(t.index);
    case "deck":
      return board.deck.getControlPoint(t.index);
    case "bottom":
      return board.bottom.getControlPoint(t.index);
    case "section": {
      const cs = board.crossSections[t.sectionIndex];
      if (!cs) return null;
      return cs.getBezierSpline().getControlPoint(t.index);
    }
    default:
      return null;
  }
}

/** Translate all three Bezier control vectors by (dx, dy). */
export function translateKnotBy(k: BezierKnot, dx: number, dy: number): void {
  for (let i = 0; i < 3; i++) {
    k.points[i]!.x += dx;
    k.points[i]!.y += dy;
  }
}

/** Deck/bottom stringer ends stay aligned (Java slave CPs). */
export function pairedBottomIndexForDeck(board: BezierBoard, deckIndex: number): number | null {
  const nd = board.deck.getNrOfControlPoints();
  const nb = board.bottom.getNrOfControlPoints();
  if (nb < 1 || nd < 1) return null;
  if (deckIndex === 0) return 0;
  if (deckIndex === nd - 1) return nb - 1;
  return null;
}

export function pairedDeckIndexForBottom(board: BezierBoard, bottomIndex: number): number | null {
  const nd = board.deck.getNrOfControlPoints();
  const nb = board.bottom.getNrOfControlPoints();
  if (nb < 1 || nd < 1) return null;
  if (bottomIndex === 0) return 0;
  if (bottomIndex === nb - 1) return nd - 1;
  return null;
}

export function cloneCrossSection(cs: BezierBoardCrossSection): BezierBoardCrossSection {
  const out = new BezierBoardCrossSection();
  out.setPosition(cs.getPosition());
  const dst = out.getBezierSpline();
  const src = cs.getBezierSpline();
  for (let i = 0; i < src.getNrOfControlPoints(); i++) {
    const k = new BezierKnot();
    k.set(src.getControlPointOrThrow(i));
    dst.append(k);
  }
  out.getGuidePoints().length = 0;
  for (const g of cs.getGuidePoints()) {
    out.getGuidePoints().push({ x: g.x, y: g.y });
  }
  return out;
}

export class MoveControlPointsCommand implements BoardCommand {
  readonly label = "Move control point";

  constructor(private readonly board: BezierBoard, private readonly edits: KnotMoveEdit[]) {}

  undo(): void {
    for (const e of this.edits) {
      const k = getKnot(this.board, e.target);
      if (k) applyKnotSnapshot(k, e.before);
    }
    this.board.checkAndFixContinousy(false, true);
    this.board.setLocks();
  }

  redo(): void {
    for (const e of this.edits) {
      const k = getKnot(this.board, e.target);
      if (k) applyKnotSnapshot(k, e.after);
    }
    this.board.checkAndFixContinousy(false, true);
    this.board.setLocks();
  }
}

export class AddCrossSectionCommand implements BoardCommand {
  readonly label = "Add cross-section";

  constructor(
    private readonly board: BezierBoard,
    private readonly insertIndex: number,
    private readonly section: BezierBoardCrossSection,
  ) {}

  undo(): void {
    this.board.crossSections.splice(this.insertIndex, 1);
  }

  redo(): void {
    this.board.crossSections.splice(this.insertIndex, 0, this.section);
  }
}

export class RemoveCrossSectionCommand implements BoardCommand {
  readonly label = "Remove cross-section";

  private readonly removed: BezierBoardCrossSection;

  constructor(
    private readonly board: BezierBoard,
    private readonly index: number,
  ) {
    const cs = board.crossSections[index];
    if (!cs) throw new Error("Invalid section index");
    this.removed = cloneCrossSection(cs);
  }

  undo(): void {
    this.board.crossSections.splice(this.index, 0, this.removed);
  }

  redo(): void {
    this.board.crossSections.splice(this.index, 1);
  }
}

export class SetCrossSectionPositionCommand implements BoardCommand {
  readonly label = "Cross-section station";

  constructor(
    private readonly board: BezierBoard,
    private readonly index: number,
    private readonly before: number,
    private readonly after: number,
  ) {}

  undo(): void {
    const cs = this.board.crossSections[this.index];
    if (cs) cs.setPosition(this.before);
  }

  redo(): void {
    const cs = this.board.crossSections[this.index];
    if (cs) cs.setPosition(this.after);
  }
}

export { knotSnapshot, applyKnotSnapshot };
