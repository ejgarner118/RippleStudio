import { describe, it, expect } from "vitest";
import { BezierBoard } from "../model/bezierBoard.js";
import { loadBrdFromText } from "../brd/brdReader.js";
import { BOARD_WITH_SECTIONS_BRD } from "../defaultBoards.js";
import {
  InsertControlPointCommand,
  MoveCrossSectionCommand,
  MoveControlPointsCommand,
  RefineCrossSectionRailCommand,
  RemoveControlPointCommand,
  SetControlPointHandleModeCommand,
  SetControlPointContinuityCommand,
  isProfileStringerEndPair,
  knotSnapshot,
  stabilizeEditTargetSpline,
  syncStringerSlaveFromMaster,
  translateKnotBy,
  translateKnotByMasked,
} from "./boardCommands.js";

describe("boardCommands", () => {
  it("MoveControlPointsCommand undo/redo restores outline knot", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "t.brd")).toBe(0);
    const k = board.outline.getControlPointOrThrow(0);
    const before = knotSnapshot(k);
    translateKnotBy(k, 12, -3);
    const after = knotSnapshot(k);
    const cmd = new MoveControlPointsCommand(board, [
      { target: { kind: "outline", index: 0 }, before, after },
    ]);
    cmd.undo();
    expect(knotSnapshot(k)).toEqual(before);
    cmd.redo();
    expect(knotSnapshot(k)).toEqual(after);
  });

  it("InsertControlPointCommand grows spline and supports undo/redo", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "ins.brd")).toBe(0);
    const before = board.outline.getNrOfControlPoints();
    const cmd = new InsertControlPointCommand(board, { kind: "outline" }, 0);
    cmd.redo();
    expect(board.outline.getNrOfControlPoints()).toBe(before + 1);
    cmd.undo();
    expect(board.outline.getNrOfControlPoints()).toBe(before);
  });

  it("RemoveControlPointCommand shrinks spline and supports undo/redo", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "del.brd")).toBe(0);
    new InsertControlPointCommand(board, { kind: "outline" }, 0).redo();
    const before = board.outline.getNrOfControlPoints();
    const cmd = new RemoveControlPointCommand(board, { kind: "outline" }, 1);
    cmd.redo();
    expect(board.outline.getNrOfControlPoints()).toBe(before - 1);
    cmd.undo();
    expect(board.outline.getNrOfControlPoints()).toBe(before);
  });

  it("SetControlPointContinuityCommand toggles and restores continuity", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "cont.brd")).toBe(0);
    const k = board.outline.getControlPointOrThrow(1);
    const before = k.isContinous();
    const cmd = new SetControlPointContinuityCommand(board, [
      { kind: "outline", index: 1 },
    ]);
    cmd.redo();
    expect(k.isContinous()).toBe(!before);
    cmd.undo();
    expect(k.isContinous()).toBe(before);
  });

  it("SetControlPointHandleModeCommand applies and undoes mode", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "mode.brd")).toBe(0);
    const k = board.outline.getControlPointOrThrow(1);
    k.setHandleMode("aligned");
    const cmd = new SetControlPointHandleModeCommand(
      board,
      [{ kind: "outline", index: 1 }],
      "mirrored",
    );
    cmd.redo();
    expect(k.getHandleMode()).toBe("mirrored");
    cmd.undo();
    expect(k.getHandleMode()).toBe("aligned");
  });

  it("translateKnotByMasked respects stringer end masks (X locked, Y free)", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "m.brd")).toBe(0);
    board.setLocks();
    const deckNose = board.deck.getControlPointOrThrow(0);
    const x0 = deckNose.points[0]!.x;
    const y0 = deckNose.points[0]!.y;
    const { xDiff, yDiff } = translateKnotByMasked(deckNose, 50, -12);
    expect(xDiff).toBe(0);
    expect(yDiff).toBe(-12);
    expect(deckNose.points[0]!.x).toBe(x0);
    expect(deckNose.points[0]!.y).toBe(y0 - 12);
  });

  it("syncStringerSlaveFromMaster mates anchor and shifts slave tangents", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "syn.brd")).toBe(0);
    const master = board.deck.getControlPointOrThrow(0);
    const slave = board.bottom.getControlPointOrThrow(0);
    master.points[0]!.x = 1;
    master.points[0]!.y = 2;
    master.points[1]!.x = 0;
    master.points[1]!.y = 2;
    master.points[2]!.x = 2;
    master.points[2]!.y = 2;
    slave.points[0]!.x = 10;
    slave.points[0]!.y = 20;
    slave.points[1]!.x = 9;
    slave.points[1]!.y = 21;
    slave.points[2]!.x = 11;
    slave.points[2]!.y = 19;
    syncStringerSlaveFromMaster(master, slave, 0, -3);
    expect(slave.points[0]!.x).toBe(1);
    expect(slave.points[0]!.y).toBe(2);
    expect(slave.points[1]!.y).toBe(18);
    expect(slave.points[2]!.y).toBe(16);
  });

  it("isProfileStringerEndPair detects deck+bottom stringer tips", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "pair.brd")).toBe(0);
    expect(
      isProfileStringerEndPair(board, [
        { kind: "deck", index: 0, point: "end" },
        { kind: "bottom", index: 0, point: "end" },
      ]),
    ).toBe(true);
    expect(
      isProfileStringerEndPair(board, [
        { kind: "deck", index: 1, point: "end" },
        { kind: "bottom", index: 0, point: "end" },
      ]),
    ).toBe(false);
  });

  it("MoveCrossSectionCommand reorders sections with undo/redo", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "ord.brd")).toBe(0);
    expect(board.crossSections.length).toBeGreaterThan(1);
    const a = board.crossSections[0]!.getPosition();
    const b = board.crossSections[1]!.getPosition();
    const cmd = new MoveCrossSectionCommand(board, 0, 1);
    cmd.redo();
    expect(board.crossSections[0]!.getPosition()).toBe(b);
    expect(board.crossSections[1]!.getPosition()).toBe(a);
    cmd.undo();
    expect(board.crossSections[0]!.getPosition()).toBe(a);
    expect(board.crossSections[1]!.getPosition()).toBe(b);
  });

  it("section stabilization does not force anchor ordering", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "section-stable.brd")).toBe(0);
    const cs = board.crossSections[0]!;
    const sp = cs.getBezierSpline();
    expect(sp.getNrOfControlPoints()).toBeGreaterThan(1);
    const a0 = sp.getControlPointOrThrow(0).getEndPoint();
    const a1 = sp.getControlPointOrThrow(1).getEndPoint();
    const movedX = a0.x;
    a1.x = movedX;
    stabilizeEditTargetSpline(board, { kind: "section", sectionIndex: 0, index: 1 });
    expect(sp.getControlPointOrThrow(1).getEndPoint().x).toBe(movedX);
  });

  it("outline tail tangent can overhang behind anchor while nose remains clamped", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "tail-locks.brd")).toBe(0);
    const tail = board.outline.getControlPointOrThrow(0);
    const tailX = tail.getEndPoint().x;
    tail.getTangentToNext().x = tailX - 40;
    stabilizeEditTargetSpline(board, { kind: "outline", index: 0 });
    expect(board.outline.getControlPointOrThrow(0).getTangentToNext().x).toBeLessThan(tailX - 30);

    const noseIdx = board.outline.getNrOfControlPoints() - 1;
    const nose = board.outline.getControlPointOrThrow(noseIdx);
    const noseX = nose.getEndPoint().x;
    nose.getTangentToPrev().x = noseX + 40;
    stabilizeEditTargetSpline(board, { kind: "outline", index: noseIdx });
    expect(board.outline.getControlPointOrThrow(noseIdx).getTangentToPrev().x).toBeLessThanOrEqual(noseX);
  });

  it("tail overhang tangent persists across stabilize calls", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "tail-persist.brd")).toBe(0);
    const tail = board.outline.getControlPointOrThrow(0);
    const anchorX = tail.getEndPoint().x;
    tail.getTangentToNext().x = anchorX - 55;
    stabilizeEditTargetSpline(board, { kind: "outline", index: 0 });
    stabilizeEditTargetSpline(board, { kind: "outline", index: 0 });
    expect(board.outline.getControlPointOrThrow(0).getTangentToNext().x).toBeLessThan(anchorX - 40);
  });

  it("RefineCrossSectionRailCommand undo restores section spline", () => {
    const board = new BezierBoard();
    expect(loadBrdFromText(board, BOARD_WITH_SECTIONS_BRD, "rail-ref.brd")).toBe(0);
    const sp = board.crossSections[0]!.getBezierSpline();
    const before = knotSnapshot(sp.getControlPointOrThrow(1));
    const cmd = new RefineCrossSectionRailCommand(board, 0, "soften");
    cmd.redo();
    expect(knotSnapshot(sp.getControlPointOrThrow(1))).not.toEqual(before);
    cmd.undo();
    expect(knotSnapshot(sp.getControlPointOrThrow(1))).toEqual(before);
  });
});
