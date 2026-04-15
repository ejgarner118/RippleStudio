import type { BezierBoard } from "../model/bezierBoard.js";
import { BezierBoardCrossSection } from "../model/bezierBoardCrossSection.js";
import { BezierKnot } from "../model/bezierKnot.js";
import { BezierSpline } from "../model/bezierSpline.js";
import { splineGetValueAt } from "./bezierSplineGeom.js";

/** Minimum target width/thickness (mm) when scaling interpolated sections; avoids div-by-zero without inflating tips like Java’s 0.5 mm floor. */
const MIN_INTERP_TARGET_MM = 0.01;
const TAIL_EXTRAP_REF_MM = 40;
const TAIL_EXTRAP_MAX_SCALE = 2.4;

export function getBoardLengthJava(board: BezierBoard): number {
  let maxX = 0;
  const n = board.outline.getNrOfControlPoints();
  for (let i = 0; i < n; i++) {
    maxX = Math.max(maxX, board.outline.getControlPointOrThrow(i).getEndPoint().x);
  }
  return Math.max(maxX, 1e-6);
}

export function getWidthAtPosJava(board: BezierBoard, pos: number): number {
  return splineGetValueAt(board.outline, pos) * 2;
}

export function getRockerAtPosJava(board: BezierBoard, pos: number): number {
  return splineGetValueAt(board.bottom, pos);
}

export function getDeckAtPosJava(board: BezierBoard, pos: number): number {
  return splineGetValueAt(board.deck, pos);
}

export function getThicknessAtPosJava(board: BezierBoard, pos: number): number {
  return getDeckAtPosJava(board, pos) - getRockerAtPosJava(board, pos);
}

function getNearestCrossSectionIndexJava(board: BezierBoard, pos: number): number {
  let nearest = -1;
  let nearestPos = -3e5;
  const list = board.crossSections;
  for (let i = 1; i < list.length - 1; i++) {
    const current = list[i]!;
    if (
      nearest === -1 ||
      Math.abs(nearestPos - pos) > Math.abs(current.getPosition() - pos)
    ) {
      nearest = i;
      nearestPos = current.getPosition();
    }
  }
  return nearest;
}

function splineWidthFromControlPoints(sp: BezierSpline): number {
  let mx = 0;
  const n = sp.getNrOfControlPoints();
  for (let i = 0; i < n; i++) {
    mx = Math.max(mx, Math.abs(sp.getControlPointOrThrow(i).getEndPoint().x));
  }
  return Math.max(mx * 2, 0.1);
}

function splineCenterThickness(sp: BezierSpline): number {
  const n = sp.getNrOfControlPoints();
  if (n < 2) return 0.1;
  const y0 = sp.getControlPointOrThrow(0).getEndPoint().y;
  const y1 = sp.getControlPointOrThrow(n - 1).getEndPoint().y;
  return Math.max(Math.abs(y1 - y0), 0.1);
}

function scaleSplineXY(sp: BezierSpline, horizScale: number, vertScale: number): void {
  const n = sp.getNrOfControlPoints();
  for (let i = 0; i < n; i++) {
    const k = sp.getControlPointOrThrow(i);
    for (let j = 0; j < 3; j++) {
      k.points[j].x *= horizScale;
      k.points[j].y *= vertScale;
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

function cloneSplineLerp(a: BezierSpline, b: BezierSpline, t: number): BezierSpline | null {
  const n = a.getNrOfControlPoints();
  if (n !== b.getNrOfControlPoints() || n < 2) return null;
  const out = new BezierSpline();
  for (let i = 0; i < n; i++) {
    const ka = a.getControlPointOrThrow(i);
    const kb = b.getControlPointOrThrow(i);
    const k = new BezierKnot();
    for (let j = 0; j < 3; j++) {
      k.points[j].x = ka.points[j].x * (1 - t) + kb.points[j].x * t;
      k.points[j].y = ka.points[j].y * (1 - t) + kb.points[j].y * t;
    }
    out.append(k);
  }
  return out;
}

function copySplineInto(dst: BezierSpline, src: BezierSpline): void {
  dst.clear();
  const n = src.getNrOfControlPoints();
  for (let i = 0; i < n; i++) {
    const k = new BezierKnot();
    k.set(src.getControlPointOrThrow(i));
    dst.append(k);
  }
}

/**
 * Java `BezierBoard.getInterpolatedCrossSection`. MVP: same control-point count only;
 * otherwise uses the lower-index section of the pair.
 */
export function getInterpolatedCrossSectionJava(
  board: BezierBoard,
  x: number,
): BezierBoardCrossSection | null {
  const list = board.crossSections;
  if (list.length < 2) return null;
  const len = getBoardLengthJava(board);
  const xForSections = Math.max(0, Math.min(x, len));

  let index: number;
  let nextIndex: number;
  if (list.length === 2) {
    index = 0;
    nextIndex = 1;
  } else {
    index = getNearestCrossSectionIndexJava(board, xForSections);
    if (index < 0) index = 1;
    if (list[index]!.getPosition() > xForSections) {
      index -= 1;
    }
    nextIndex = index + 1;
    if (index < 1) {
      index = 1;
    }
    if (nextIndex > list.length - 2) {
      index = list.length - 2;
      nextIndex = list.length - 1;
    }
  }

  const firstPos = list[index]!.getPosition();
  const secondPos = list[nextIndex]!.getPosition();
  const span = secondPos - firstPos;
  let t = span !== 0 ? (xForSections - firstPos) / span : 0;
  if (!Number.isFinite(t)) t = 0;
  if (t < 0) t = 0;
  if (t > 1) t = 1;

  const c1 = list[index]!;
  const c2 = list[nextIndex]!;
  const sp1 = c1.getBezierSpline();
  const sp2 = c2.getBezierSpline();
  let merged: BezierSpline | null = cloneSplineLerp(sp1, sp2, t);
  if (!merged) {
    merged = cloneSpline(sp1);
  }

  let thickness = getThicknessAtPosJava(board, xForSections);
  let width = getWidthAtPosJava(board, xForSections);
  if (x < 0) {
    const refX = Math.min(TAIL_EXTRAP_REF_MM, Math.max(len * 0.1, 5));
    const refWidth = getWidthAtPosJava(board, refX);
    const refThickness = getThicknessAtPosJava(board, refX);
    const tailDx = -x;
    const widthSlope = Math.max(0, (refWidth - width) / Math.max(refX, 1e-6));
    const thicknessSlope = Math.max(0, (refThickness - thickness) / Math.max(refX, 1e-6));
    const maxWidth = Math.max(refWidth * TAIL_EXTRAP_MAX_SCALE, MIN_INTERP_TARGET_MM);
    const maxThickness = Math.max(refThickness * TAIL_EXTRAP_MAX_SCALE, MIN_INTERP_TARGET_MM);
    width = Math.min(maxWidth, width + widthSlope * tailDx);
    thickness = Math.min(maxThickness, thickness + thicknessSlope * tailDx);
  }
  if (thickness < MIN_INTERP_TARGET_MM) thickness = MIN_INTERP_TARGET_MM;
  if (width < MIN_INTERP_TARGET_MM) width = MIN_INTERP_TARGET_MM;

  const oldW = splineWidthFromControlPoints(merged);
  const oldT = splineCenterThickness(merged);
  scaleSplineXY(merged, width / oldW, thickness / oldT);

  const out = new BezierBoardCrossSection();
  out.setPosition(x);
  copySplineInto(out.getBezierSpline(), merged);
  return out;
}

/** Half of outline width at mid-length (Java `getCenterWidth()/2` for mesh steps). */
export function getCenterHalfWidthJava(board: BezierBoard): number {
  const len = getBoardLengthJava(board);
  return getWidthAtPosJava(board, len / 2) / 2;
}
