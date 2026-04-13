import type { BoardCommand } from "../undo/commandStack.js";
import type { BezierBoard } from "../model/bezierBoard.js";
import { BezierBoardCrossSection } from "../model/bezierBoardCrossSection.js";
import { BezierKnot } from "../model/bezierKnot.js";
import type { BezierSpline } from "../model/bezierSpline.js";

export type SplineEditTarget =
  | { kind: "outline"; index: number; point?: "end" | "prev" | "next" }
  | { kind: "deck"; index: number; point?: "end" | "prev" | "next" }
  | { kind: "bottom"; index: number; point?: "end" | "prev" | "next" }
  | {
      kind: "section";
      sectionIndex: number;
      index: number;
      point?: "end" | "prev" | "next";
    };

export type KnotMoveEdit = {
  target: SplineEditTarget;
  before: number[];
  after: number[];
};

export type SplineTarget =
  | { kind: "outline" }
  | { kind: "deck" }
  | { kind: "bottom" }
  | { kind: "section"; sectionIndex: number };

type SerializedKnot = {
  p: number[];
  continuous: boolean;
  other: boolean;
  xMask: number;
  yMask: number;
};

const ANCHOR_GAP_EPS = 1e-4;
const MAX_ABS_COORD = 1e5;

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

function splineFromTarget(board: BezierBoard, target: SplineTarget): BezierSpline | null {
  switch (target.kind) {
    case "outline":
      return board.outline;
    case "deck":
      return board.deck;
    case "bottom":
      return board.bottom;
    case "section": {
      const cs = board.crossSections[target.sectionIndex];
      return cs ? cs.getBezierSpline() : null;
    }
    default:
      return null;
  }
}

function splineFromEditTarget(board: BezierBoard, target: SplineEditTarget): BezierSpline | null {
  if (target.kind === "section") {
    const cs = board.crossSections[target.sectionIndex];
    return cs ? cs.getBezierSpline() : null;
  }
  return splineFromTarget(board, { kind: target.kind });
}

function serializeKnot(k: BezierKnot): SerializedKnot {
  return {
    p: knotSnapshot(k),
    continuous: k.isContinous(),
    other: k.getOther(),
    xMask: k.X_mask,
    yMask: k.Y_mask,
  };
}

function materializeKnot(s: SerializedKnot): BezierKnot {
  const k = new BezierKnot();
  applyKnotSnapshot(k, s.p);
  k.setContinous(s.continuous);
  k.setOther(s.other);
  k.setMask(s.xMask, s.yMask);
  return k;
}

function snapshotSpline(sp: BezierSpline): SerializedKnot[] {
  const out: SerializedKnot[] = [];
  const n = sp.getNrOfControlPoints();
  for (let i = 0; i < n; i++) {
    out.push(serializeKnot(sp.getControlPointOrThrow(i)));
  }
  return out;
}

function applySplineSnapshot(sp: BezierSpline, snapshot: SerializedKnot[]): void {
  sp.clear();
  for (const k of snapshot) {
    sp.append(materializeKnot(k));
  }
}

function midpoint(ax: number, ay: number, bx: number, by: number): [number, number] {
  return [(ax + bx) * 0.5, (ay + by) * 0.5];
}

function interpolatedKnot(a: SerializedKnot, b: SerializedKnot): SerializedKnot {
  const [ex, ey] = midpoint(a.p[0]!, a.p[1]!, b.p[0]!, b.p[1]!);
  const [px, py] = midpoint(a.p[0]!, a.p[1]!, a.p[4]!, a.p[5]!);
  const [nx, ny] = midpoint(b.p[0]!, b.p[1]!, b.p[2]!, b.p[3]!);
  return {
    p: [ex, ey, px, py, nx, ny],
    continuous: true,
    other: false,
    xMask: 1,
    yMask: 1,
  };
}

function buildInsertSnapshot(before: SerializedKnot[], selectedIndex: number): SerializedKnot[] {
  if (before.length < 2) return before.slice();
  const left = Math.max(0, Math.min(selectedIndex, before.length - 2));
  const right = left + 1;
  const out = before.slice();
  out.splice(right, 0, interpolatedKnot(before[left]!, before[right]!));
  return out;
}

function buildDeleteSnapshot(before: SerializedKnot[], selectedIndex: number): SerializedKnot[] {
  if (before.length <= 2) return before.slice();
  const i = Math.max(0, Math.min(selectedIndex, before.length - 1));
  const out = before.slice();
  out.splice(i, 1);
  return out;
}

function clampCoord(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(-MAX_ABS_COORD, Math.min(MAX_ABS_COORD, v));
}

function clampSplinePoints(sp: BezierSpline): void {
  const n = sp.getNrOfControlPoints();
  for (let i = 0; i < n; i++) {
    const k = sp.getControlPointOrThrow(i);
    for (let j = 0; j < 3; j++) {
      k.points[j]!.x = clampCoord(k.points[j]!.x);
      k.points[j]!.y = clampCoord(k.points[j]!.y);
    }
  }
}

function enforceAnchorOrdering(sp: BezierSpline): void {
  const n = sp.getNrOfControlPoints();
  if (n < 2) return;
  for (let i = 1; i < n; i++) {
    const prev = sp.getControlPointOrThrow(i - 1).getEndPoint();
    const cur = sp.getControlPointOrThrow(i).getEndPoint();
    if (cur.x <= prev.x + ANCHOR_GAP_EPS) {
      cur.x = prev.x + ANCHOR_GAP_EPS;
    }
  }
}

function enforceTangentDirection(sp: BezierSpline): void {
  const n = sp.getNrOfControlPoints();
  for (let i = 0; i < n; i++) {
    const k = sp.getControlPointOrThrow(i);
    const ex = k.getEndPoint().x;
    const prev = k.getTangentToPrev();
    const next = k.getTangentToNext();
    if (prev.x > ex) prev.x = ex;
    if (next.x < ex) next.x = ex;
  }
}

function enforceHalfSpace(sp: BezierSpline, minX: number, minY: number): void {
  const n = sp.getNrOfControlPoints();
  for (let i = 0; i < n; i++) {
    const k = sp.getControlPointOrThrow(i);
    for (let j = 0; j < 3; j++) {
      if (k.points[j]!.x < minX) k.points[j]!.x = minX;
      if (k.points[j]!.y < minY) k.points[j]!.y = minY;
    }
  }
}

function stabilizeSpline(targetKind: SplineTarget["kind"], sp: BezierSpline): void {
  clampSplinePoints(sp);
  enforceAnchorOrdering(sp);
  enforceTangentDirection(sp);
  if (targetKind === "outline") {
    enforceHalfSpace(sp, -MAX_ABS_COORD, 0);
  }
  if (targetKind === "section") {
    enforceHalfSpace(sp, 0, -MAX_ABS_COORD);
  }
}

export function stabilizeTargetSpline(board: BezierBoard, target: SplineTarget): void {
  const sp = splineFromTarget(board, target);
  if (!sp) return;
  stabilizeSpline(target.kind, sp);
  board.checkAndFixContinousy(false, true);
  board.setLocks();
}

export function stabilizeEditTargetSpline(board: BezierBoard, target: SplineEditTarget): void {
  const sp = splineFromEditTarget(board, target);
  if (!sp) return;
  stabilizeSpline(target.kind, sp);
  board.checkAndFixContinousy(false, true);
  board.setLocks();
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

/**
 * Java `BezierKnot.setControlPointLocation`: delta is scaled by X_mask / Y_mask
 * (stringer ends use mask 0,1 so length-wise X stays fixed while Y / rocker moves).
 */
export function translateKnotByMasked(k: BezierKnot, dx: number, dy: number): { xDiff: number; yDiff: number } {
  const xDiff = dx * k.X_mask;
  const yDiff = dy * k.Y_mask;
  translateKnotBy(k, xDiff, yDiff);
  return { xDiff, yDiff };
}

/**
 * Java `BezierKnot.updateSlave`: mate stringer tip — slave anchor matches master;
 * slave tangents pick up the same (masked) translation as the master knot.
 */
export function syncStringerSlaveFromMaster(master: BezierKnot, slave: BezierKnot, xDiff: number, yDiff: number): void {
  slave.points[0]!.x = master.points[0]!.x;
  slave.points[0]!.y = master.points[0]!.y;
  slave.points[1]!.x += xDiff;
  slave.points[1]!.y += yDiff;
  slave.points[2]!.x += xDiff;
  slave.points[2]!.y += yDiff;
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

/** True when edits are deck+bottom stringer ends paired for one drag (primary first). */
export function isProfileStringerEndPair(board: BezierBoard, targets: SplineEditTarget[]): boolean {
  if (targets.length !== 2) return false;
  const a = targets[0]!;
  const b = targets[1]!;
  if ((a.point ?? "end") !== "end" || (b.point ?? "end") !== "end") return false;
  if (a.kind === "deck" && b.kind === "bottom") {
    return pairedBottomIndexForDeck(board, a.index) === b.index;
  }
  if (a.kind === "bottom" && b.kind === "deck") {
    return pairedDeckIndexForBottom(board, a.index) === b.index;
  }
  return false;
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
    this.board.setLocks();
  }

  redo(): void {
    for (const e of this.edits) {
      const k = getKnot(this.board, e.target);
      if (k) applyKnotSnapshot(k, e.after);
    }
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

export class MoveCrossSectionCommand implements BoardCommand {
  readonly label = "Reorder cross-section";

  constructor(
    private readonly board: BezierBoard,
    private readonly fromIndex: number,
    private readonly toIndex: number,
  ) {}

  undo(): void {
    this.move(this.toIndex, this.fromIndex);
  }

  redo(): void {
    this.move(this.fromIndex, this.toIndex);
  }

  private move(from: number, to: number): void {
    if (from === to) return;
    if (from < 0 || from >= this.board.crossSections.length) return;
    if (to < 0 || to >= this.board.crossSections.length) return;
    const [cs] = this.board.crossSections.splice(from, 1);
    if (!cs) return;
    this.board.crossSections.splice(to, 0, cs);
  }
}

export class InsertControlPointCommand implements BoardCommand {
  readonly label = "Add control point";

  private readonly before: SerializedKnot[];
  private readonly after: SerializedKnot[];

  constructor(
    private readonly board: BezierBoard,
    private readonly target: SplineTarget,
    selectedIndex: number,
  ) {
    const sp = splineFromTarget(board, target);
    if (!sp) throw new Error("Invalid spline target");
    this.before = snapshotSpline(sp);
    this.after = buildInsertSnapshot(this.before, selectedIndex);
  }

  undo(): void {
    const sp = splineFromTarget(this.board, this.target);
    if (!sp) return;
    applySplineSnapshot(sp, this.before);
    stabilizeTargetSpline(this.board, this.target);
  }

  redo(): void {
    const sp = splineFromTarget(this.board, this.target);
    if (!sp) return;
    applySplineSnapshot(sp, this.after);
    stabilizeTargetSpline(this.board, this.target);
  }
}

export class RemoveControlPointCommand implements BoardCommand {
  readonly label = "Remove control point";

  private readonly before: SerializedKnot[];
  private readonly after: SerializedKnot[];

  constructor(
    private readonly board: BezierBoard,
    private readonly target: SplineTarget,
    selectedIndex: number,
  ) {
    const sp = splineFromTarget(board, target);
    if (!sp) throw new Error("Invalid spline target");
    this.before = snapshotSpline(sp);
    this.after = buildDeleteSnapshot(this.before, selectedIndex);
  }

  undo(): void {
    const sp = splineFromTarget(this.board, this.target);
    if (!sp) return;
    applySplineSnapshot(sp, this.before);
    stabilizeTargetSpline(this.board, this.target);
  }

  redo(): void {
    const sp = splineFromTarget(this.board, this.target);
    if (!sp) return;
    applySplineSnapshot(sp, this.after);
    stabilizeTargetSpline(this.board, this.target);
  }
}

export class SetControlPointContinuityCommand implements BoardCommand {
  readonly label = "Toggle control-point continuity";

  private readonly before: boolean[] = [];
  private readonly after: boolean[] = [];

  constructor(
    private readonly board: BezierBoard,
    private readonly targets: SplineEditTarget[],
  ) {
    for (const t of targets) {
      const k = getKnot(board, t);
      if (!k) continue;
      this.before.push(k.isContinous());
      this.after.push(!k.isContinous());
    }
  }

  undo(): void {
    let i = 0;
    for (const t of this.targets) {
      const k = getKnot(this.board, t);
      if (!k) continue;
      k.setContinous(this.before[i] ?? false);
      i++;
    }
    this.board.checkAndFixContinousy(false, true);
    this.board.setLocks();
  }

  redo(): void {
    let i = 0;
    for (const t of this.targets) {
      const k = getKnot(this.board, t);
      if (!k) continue;
      k.setContinous(this.after[i] ?? false);
      i++;
    }
    this.board.checkAndFixContinousy(false, true);
    this.board.setLocks();
  }
}

export class ResetSplineToLineCommand implements BoardCommand {
  readonly label = "Reset spline to line";

  private readonly before: SerializedKnot[];
  private readonly after: SerializedKnot[];

  constructor(
    private readonly board: BezierBoard,
    private readonly target: SplineTarget,
  ) {
    const sp = splineFromTarget(board, target);
    if (!sp) throw new Error("Invalid spline target");
    this.before = snapshotSpline(sp);
    this.after = this.buildLinearSnapshot(this.before);
  }

  private buildLinearSnapshot(before: SerializedKnot[]): SerializedKnot[] {
    if (before.length < 2) return before.slice();
    const first = before[0]!;
    const last = before[before.length - 1]!;
    const out: SerializedKnot[] = [];
    for (let i = 0; i < before.length; i++) {
      const t = before.length <= 1 ? 0 : i / (before.length - 1);
      const ex = first.p[0]! * (1 - t) + last.p[0]! * t;
      const ey = first.p[1]! * (1 - t) + last.p[1]! * t;
      const dx = (last.p[0]! - first.p[0]!) / Math.max(before.length - 1, 1) / 3;
      const dy = (last.p[1]! - first.p[1]!) / Math.max(before.length - 1, 1) / 3;
      out.push({
        p: [ex, ey, ex - dx, ey - dy, ex + dx, ey + dy],
        continuous: true,
        other: false,
        xMask: 1,
        yMask: 1,
      });
    }
    return out;
  }

  undo(): void {
    const sp = splineFromTarget(this.board, this.target);
    if (!sp) return;
    applySplineSnapshot(sp, this.before);
    stabilizeTargetSpline(this.board, this.target);
  }

  redo(): void {
    const sp = splineFromTarget(this.board, this.target);
    if (!sp) return;
    applySplineSnapshot(sp, this.after);
    stabilizeTargetSpline(this.board, this.target);
  }
}

export { knotSnapshot, applyKnotSnapshot };
