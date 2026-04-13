import { useCallback, useRef } from "react";
import type { BezierBoard, BBox2D, CommandStack } from "@boardcad/core";
import {
  MoveControlPointsCommand,
  applyKnotSnapshot,
  getKnot,
  isProfileStringerEndPair,
  knotSnapshot,
  pairedBottomIndexForDeck,
  pairedDeckIndexForBottom,
  stabilizeEditTargetSpline,
  syncStringerSlaveFromMaster,
  translateKnotBy,
  translateKnotByMasked,
  type KnotMoveEdit,
  type SplineEditTarget,
} from "@boardcad/core";
import {
  clientToBoardMm,
  hitRadiusBoard,
  pickEditTarget,
} from "../canvas2d/boardEditHit";
import type { BoardEditMode } from "../types/editMode";
import type { OverlayState } from "../types/overlays";

type DragEdit = { target: SplineEditTarget; before: number[] };

function buildDragEdits(board: BezierBoard, target: SplineEditTarget): DragEdit[] {
  const out: DragEdit[] = [];
  const push = (t: SplineEditTarget) => {
    const k = getKnot(board, t);
    if (!k) return;
    out.push({ target: t, before: knotSnapshot(k) });
  };
  push(target);
  const isEndAnchor = (target.point ?? "end") === "end";
  if (isEndAnchor && target.kind === "deck") {
    const j = pairedBottomIndexForDeck(board, target.index);
    if (j != null) push({ kind: "bottom", index: j, point: "end" });
  }
  if (isEndAnchor && target.kind === "bottom") {
    const j = pairedDeckIndexForBottom(board, target.index);
    if (j != null) push({ kind: "deck", index: j, point: "end" });
  }
  return out;
}

function stabilizeKeysForTargets(targets: SplineEditTarget[], brd: BezierBoard): void {
  const stabilized = new Set<string>();
  for (const target of targets) {
    const key =
      target.kind === "section" ? `section:${target.sectionIndex}` : target.kind;
    if (!stabilized.has(key)) {
      stabilizeEditTargetSpline(brd, target);
      stabilized.add(key);
    }
  }
}

/**
 * Profile stringer (deck/bottom): Java uses masked deltas on tips and mates the opposite stringer.
 * Outline / sections: full translation (masks on outline ends are 0,0 — would block moves; those
 * splines are edited without masked translation here).
 */
function applyDragDelta(
  brd: BezierBoard,
  edits: DragEdit[],
  dx: number,
  dy: number,
): void {
  for (const { target, before } of edits) {
    const k = getKnot(brd, target);
    if (k) applyKnotSnapshot(k, before);
  }

  if (edits.length === 0) return;

  const targets = edits.map((e) => e.target);
  if (isProfileStringerEndPair(brd, targets)) {
    const primary = edits[0]!;
    const secondary = edits[1]!;
    const k = getKnot(brd, primary.target);
    const sk = getKnot(brd, secondary.target);
    if (!k || !sk) return;
    const { xDiff, yDiff } = translateKnotByMasked(k, dx, dy);
    syncStringerSlaveFromMaster(k, sk, xDiff, yDiff);
    stabilizeKeysForTargets([primary.target, secondary.target], brd);
    return;
  }

  for (const { target } of edits) {
    const k = getKnot(brd, target);
    if (!k) continue;
    const pointKind = target.point ?? "end";
    if (pointKind === "end") {
      if (target.kind === "deck" || target.kind === "bottom") {
        translateKnotByMasked(k, dx, dy);
      } else {
        translateKnotBy(k, dx, dy);
      }
    } else {
      const pi = pointKind === "prev" ? 1 : 2;
      const oi = pointKind === "prev" ? 2 : 1;
      k.points[pi]!.x += dx;
      k.points[pi]!.y += dy;
      if (k.isContinous()) {
        const ex = k.points[0]!.x;
        const ey = k.points[0]!.y;
        k.points[oi]!.x = ex - (k.points[pi]!.x - ex);
        k.points[oi]!.y = ey - (k.points[pi]!.y - ey);
      }
    }
    stabilizeEditTargetSpline(brd, target);
  }
}

function restoreDragEdits(brd: BezierBoard, edits: DragEdit[]): void {
  for (const { target, before } of edits) {
    const k = getKnot(brd, target);
    if (k) applyKnotSnapshot(k, before);
  }
  brd.checkAndFixContinousy(false, true);
  brd.setLocks();
}

function snapshotsDiffer(a: number[], b: number[]): boolean {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (Math.abs((a[i] ?? 0) - (b[i] ?? 0)) > 1e-9) return true;
  }
  return false;
}

type DragRef = {
  pointerId: number;
  edits: DragEdit[];
  originX: number;
  originY: number;
} | null;

export function useBoardCanvasEditing(opts: {
  brd: BezierBoard;
  stack: CommandStack;
  editMode: BoardEditMode;
  sectionIndex: number;
  overlays: OverlayState;
  planBounds: BBox2D | null;
  profileStringerBounds: BBox2D | null;
  profileBounds: BBox2D | null;
  planPadPx: number;
  profilePadPx: number;
  bumpBoardRevision: () => void;
  bumpCmdNonce: () => void;
  setDirty: (v: boolean) => void;
  onSelectTarget: (t: SplineEditTarget | null) => void;
  onHoverTarget: (t: SplineEditTarget | null) => void;
}) {
  const {
    brd,
    stack,
    editMode,
    sectionIndex,
    overlays,
    planBounds,
    profileStringerBounds,
    profileBounds,
    planPadPx,
    profilePadPx,
    bumpBoardRevision,
    bumpCmdNonce,
    setDirty,
    onSelectTarget,
    onHoverTarget,
  } = opts;

  const dragRef = useRef<DragRef>(null);

  const finishDrag = useCallback(
    (canvas: HTMLCanvasElement, pointerId: number, pushCommand: boolean) => {
      const d = dragRef.current;
      dragRef.current = null;
      try {
        canvas.releasePointerCapture(pointerId);
      } catch {
        /* already released */
      }
      if (!d || d.pointerId !== pointerId) return;
      if (pushCommand) {
        const editsFull: KnotMoveEdit[] = [];
        for (const { target, before } of d.edits) {
          const k = getKnot(brd, target);
          if (!k) continue;
          const after = knotSnapshot(k);
          if (snapshotsDiffer(before, after)) {
            editsFull.push({ target, before, after });
          }
        }
        if (editsFull.length > 0) {
          stack.push(new MoveControlPointsCommand(brd, editsFull));
          bumpCmdNonce();
          setDirty(true);
        } else {
          restoreDragEdits(brd, d.edits);
          bumpBoardRevision();
        }
      } else {
        restoreDragEdits(brd, d.edits);
        bumpBoardRevision();
      }
    },
    [brd, stack, bumpBoardRevision, bumpCmdNonce, setDirty],
  );

  const onPlanPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (editMode !== "outline" || !planBounds) return;
      const canvas = e.currentTarget;
      const c = clientToBoardMm(e.clientX, e.clientY, canvas, planBounds, planPadPx);
      if (!c) return;
      const t = pickEditTarget(
        brd,
        editMode,
        sectionIndex,
        c.x,
        c.y,
        hitRadiusBoard(c.tf),
        overlays,
      );
      if (!t) {
        onSelectTarget(null);
        onHoverTarget(null);
        return;
      }
      onSelectTarget(t);
      onHoverTarget(t);
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        edits: buildDragEdits(brd, t),
        originX: c.x,
        originY: c.y,
      };
    },
    [brd, editMode, sectionIndex, overlays, planBounds, planPadPx, onSelectTarget, onHoverTarget],
  );

  const onPlanPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = dragRef.current;
      if (!planBounds) return;
      if (!d) {
        if (editMode !== "outline") return;
        const c = clientToBoardMm(
          e.clientX,
          e.clientY,
          e.currentTarget,
          planBounds,
          planPadPx,
        );
        if (!c) return;
        onHoverTarget(
          pickEditTarget(
            brd,
            editMode,
            sectionIndex,
            c.x,
            c.y,
            hitRadiusBoard(c.tf),
            overlays,
          ),
        );
        return;
      }
      if (d.pointerId !== e.pointerId) return;
      const c = clientToBoardMm(
        e.clientX,
        e.clientY,
        e.currentTarget,
        planBounds,
        planPadPx,
      );
      if (!c) return;
      const gx = e.shiftKey ? Math.round(c.x / 5) * 5 : c.x;
      const gy = e.shiftKey ? Math.round(c.y / 5) * 5 : c.y;
      applyDragDelta(brd, d.edits, gx - d.originX, gy - d.originY);
      bumpBoardRevision();
    },
    [brd, editMode, sectionIndex, overlays, planBounds, planPadPx, bumpBoardRevision, onHoverTarget],
  );

  const onPlanPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      finishDrag(e.currentTarget, e.pointerId, true);
    },
    [finishDrag],
  );

  const onPlanPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      finishDrag(e.currentTarget, e.pointerId, false);
    },
    [finishDrag],
  );

  const onProfilePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (editMode !== "deck" && editMode !== "bottom") return;
      if (!profileStringerBounds) return;
      const canvas = e.currentTarget;
      const c = clientToBoardMm(
        e.clientX,
        e.clientY,
        canvas,
        profileStringerBounds,
        profilePadPx,
      );
      if (!c) return;
      const t = pickEditTarget(
        brd,
        editMode,
        sectionIndex,
        c.x,
        c.y,
        hitRadiusBoard(c.tf),
        overlays,
      );
      if (!t) {
        onSelectTarget(null);
        onHoverTarget(null);
        return;
      }
      onSelectTarget(t);
      onHoverTarget(t);
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        edits: buildDragEdits(brd, t),
        originX: c.x,
        originY: c.y,
      };
    },
    [
      brd,
      editMode,
      sectionIndex,
      overlays,
      profileStringerBounds,
      profilePadPx,
      onSelectTarget,
      onHoverTarget,
    ],
  );

  const onProfilePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = dragRef.current;
      if (!profileStringerBounds) return;
      if (!d) {
        if (editMode !== "deck" && editMode !== "bottom") return;
        const c = clientToBoardMm(
          e.clientX,
          e.clientY,
          e.currentTarget,
          profileStringerBounds,
          profilePadPx,
        );
        if (!c) return;
        onHoverTarget(
          pickEditTarget(
            brd,
            editMode,
            sectionIndex,
            c.x,
            c.y,
            hitRadiusBoard(c.tf),
            overlays,
          ),
        );
        return;
      }
      if (d.pointerId !== e.pointerId) return;
      const c = clientToBoardMm(
        e.clientX,
        e.clientY,
        e.currentTarget,
        profileStringerBounds,
        profilePadPx,
      );
      if (!c) return;
      const gx = e.shiftKey ? Math.round(c.x / 5) * 5 : c.x;
      const gy = e.shiftKey ? Math.round(c.y / 5) * 5 : c.y;
      applyDragDelta(brd, d.edits, gx - d.originX, gy - d.originY);
      bumpBoardRevision();
    },
    [brd, editMode, sectionIndex, overlays, profileStringerBounds, profilePadPx, bumpBoardRevision, onHoverTarget],
  );

  const onProfilePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      finishDrag(e.currentTarget, e.pointerId, true);
    },
    [finishDrag],
  );

  const onProfilePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      finishDrag(e.currentTarget, e.pointerId, false);
    },
    [finishDrag],
  );

  const onSectionPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (editMode !== "section" || !profileBounds) return;
      const canvas = e.currentTarget;
      const c = clientToBoardMm(
        e.clientX,
        e.clientY,
        canvas,
        profileBounds,
        profilePadPx,
      );
      if (!c) return;
      const t = pickEditTarget(
        brd,
        editMode,
        sectionIndex,
        c.x,
        c.y,
        hitRadiusBoard(c.tf),
        overlays,
      );
      if (!t) {
        onSelectTarget(null);
        onHoverTarget(null);
        return;
      }
      onSelectTarget(t);
      onHoverTarget(t);
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        edits: buildDragEdits(brd, t),
        originX: c.x,
        originY: c.y,
      };
    },
    [
      brd,
      editMode,
      sectionIndex,
      overlays,
      profileBounds,
      profilePadPx,
      onSelectTarget,
      onHoverTarget,
    ],
  );

  const onSectionPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = dragRef.current;
      if (!profileBounds) return;
      if (!d) {
        if (editMode !== "section") return;
        const c = clientToBoardMm(
          e.clientX,
          e.clientY,
          e.currentTarget,
          profileBounds,
          profilePadPx,
        );
        if (!c) return;
        onHoverTarget(
          pickEditTarget(
            brd,
            editMode,
            sectionIndex,
            c.x,
            c.y,
            hitRadiusBoard(c.tf),
            overlays,
          ),
        );
        return;
      }
      if (d.pointerId !== e.pointerId) return;
      const c = clientToBoardMm(
        e.clientX,
        e.clientY,
        e.currentTarget,
        profileBounds,
        profilePadPx,
      );
      if (!c) return;
      const gx = e.shiftKey ? Math.round(c.x / 5) * 5 : c.x;
      const gy = e.shiftKey ? Math.round(c.y / 5) * 5 : c.y;
      applyDragDelta(brd, d.edits, gx - d.originX, gy - d.originY);
      bumpBoardRevision();
    },
    [brd, editMode, sectionIndex, overlays, profileBounds, profilePadPx, bumpBoardRevision, onHoverTarget],
  );

  const onSectionPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      finishDrag(e.currentTarget, e.pointerId, true);
    },
    [finishDrag],
  );

  const onSectionPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      finishDrag(e.currentTarget, e.pointerId, false);
    },
    [finishDrag],
  );

  return {
    onPlanPointerDown,
    onPlanPointerMove,
    onPlanPointerUp,
    onPlanPointerCancel,
    onProfilePointerDown,
    onProfilePointerMove,
    onProfilePointerUp,
    onProfilePointerCancel,
    onSectionPointerDown,
    onSectionPointerMove,
    onSectionPointerUp,
    onSectionPointerCancel,
  };
}
