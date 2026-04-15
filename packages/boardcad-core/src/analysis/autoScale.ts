import type { BezierBoard } from "../model/bezierBoard.js";
import { BezierBoardCrossSection } from "../model/bezierBoardCrossSection.js";
import { BezierKnot } from "../model/bezierKnot.js";
import { BezierSpline } from "../model/bezierSpline.js";
import { getBoardLengthJava } from "../geometry/boardInterpolation.js";

export type AutoScaleLocks = {
  lockTailWidth?: boolean;
  lockNoseRocker?: boolean;
  lockTailRocker?: boolean;
};

export type AutoScaleInput = {
  lengthScale: number;
  widthScale: number;
  thicknessScale: number;
  locks?: AutoScaleLocks;
};

function scaleSpline(sp: BezierSpline, sx: number, sy: number): void {
  const n = sp.getNrOfControlPoints();
  for (let i = 0; i < n; i++) {
    const k = sp.getControlPointOrThrow(i);
    for (let p = 0; p < 3; p++) {
      k.points[p]!.x *= sx;
      k.points[p]!.y *= sy;
    }
  }
}

function cloneSpline(src: BezierSpline): BezierSpline {
  const out = new BezierSpline();
  const n = src.getNrOfControlPoints();
  for (let i = 0; i < n; i++) {
    const k = new BezierKnot();
    k.set(src.getControlPointOrThrow(i));
    out.append(k);
  }
  return out;
}

export function cloneBoardInto(target: BezierBoard, source: BezierBoard): void {
  target.reset();
  Object.assign(target, source);
  target.outline.clear();
  target.deck.clear();
  target.bottom.clear();
  const outline = cloneSpline(source.outline);
  const deck = cloneSpline(source.deck);
  const bottom = cloneSpline(source.bottom);
  for (let i = 0; i < outline.getNrOfControlPoints(); i++) target.outline.append(outline.getControlPointOrThrow(i));
  for (let i = 0; i < deck.getNrOfControlPoints(); i++) target.deck.append(deck.getControlPointOrThrow(i));
  for (let i = 0; i < bottom.getNrOfControlPoints(); i++) target.bottom.append(bottom.getControlPointOrThrow(i));
  target.crossSections.length = 0;
  for (const cs of source.crossSections) {
    const next = new BezierBoardCrossSection();
    next.setPosition(cs.getPosition());
    const srcSp = cs.getBezierSpline();
    const dstSp = next.getBezierSpline();
    for (let i = 0; i < srcSp.getNrOfControlPoints(); i++) {
      const k = new BezierKnot();
      k.set(srcSp.getControlPointOrThrow(i));
      dstSp.append(k);
    }
    next.getGuidePoints().length = 0;
    for (const g of cs.getGuidePoints()) next.getGuidePoints().push({ x: g.x, y: g.y });
    target.crossSections.push(next);
  }
}

export function applyAutoScale(board: BezierBoard, input: AutoScaleInput): void {
  const sx = Math.max(0.1, input.lengthScale);
  const sy = Math.max(0.1, input.widthScale);
  const sz = Math.max(0.1, input.thicknessScale);
  const locks = input.locks ?? {};

  const oldNoseRocker = board.bottom.getControlPointOrThrow(board.bottom.getNrOfControlPoints() - 1)?.getEndPoint().y ?? 0;
  const oldTailRocker = board.bottom.getControlPointOrThrow(0)?.getEndPoint().y ?? 0;
  const oldTailWidth = board.outline.getControlPointOrThrow(0)?.getEndPoint().y ?? 0;

  scaleSpline(board.outline, sx, sy);
  scaleSpline(board.bottom, sx, sz);
  scaleSpline(board.deck, sx, sz);
  for (const cs of board.crossSections) {
    cs.setPosition(cs.getPosition() * sx);
    scaleSpline(cs.getBezierSpline(), sy, sz);
  }

  if (locks.lockTailWidth) {
    const tail = board.outline.getControlPoint(0);
    if (tail) {
      const dy = oldTailWidth - tail.getEndPoint().y;
      for (let i = 0; i < 3; i++) {
        tail.points[i]!.y += dy;
      }
    }
  }
  if (locks.lockNoseRocker) {
    const nose = board.bottom.getControlPoint(board.bottom.getNrOfControlPoints() - 1);
    if (nose) {
      const dy = oldNoseRocker - nose.getEndPoint().y;
      for (let i = 0; i < 3; i++) {
        nose.points[i]!.y += dy;
      }
    }
  }
  if (locks.lockTailRocker) {
    const tail = board.bottom.getControlPoint(0);
    if (tail) {
      const dy = oldTailRocker - tail.getEndPoint().y;
      for (let i = 0; i < 3; i++) {
        tail.points[i]!.y += dy;
      }
    }
  }

  // Keep model constraints coherent after transforms.
  if (getBoardLengthJava(board) > 0) {
    board.checkAndFixContinousy(false, true);
    board.setLocks();
  }
}

