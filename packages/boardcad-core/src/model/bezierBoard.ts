import { BezierSpline } from "./bezierSpline.js";
import { BezierBoardCrossSection } from "./bezierBoardCrossSection.js";
import { LOCK_X_LESS, LOCK_X_MORE, LOCK_Y_MORE } from "./bezierKnot.js";
import type * as VecMath from "../geometry/vecMath.js";

/** Port of board.BezierBoard (fields + load post-process + locks). */
export class BezierBoard {
  filename = "";
  version = "V4.4";
  name = "";
  author = "";
  designer = "";
  blankFile = "";
  topCuts = 0;
  bottomCuts = 0;
  railCuts = 0;
  cutterDiam = 0;
  blankPivot = 0;
  boardPivot = 0;
  maxAngle = 0;
  noseMargin = 0;
  tailMargin = 0;
  noseLength = 0;
  tailLength = 0;
  deltaXNose = 0;
  deltaXTail = 0;
  deltaXMiddle = 0;
  toTailSpeed = 0;
  stringerSpeed = 0;
  regularSpeed = 0;
  strut1 = [0, 0, 0];
  strut2 = [0, 0, 0];
  cutterStartPos = [0, 0, 0];
  blankTailPos = [0, 0, 0];
  boardStartPos = [0, 0, 0];
  currentUnits = 0;
  noseRockerOneFoot = 0;
  tailRockerOneFoot = 0;
  showOriginalBoard = true;
  stringerSpeedBottom = 0;
  machineFolder = "c:\\machine";
  topShoulderAngle = 0;
  topShoulderCuts = 0;
  bottomRailCuts = 0;
  surfer = "";
  comments = "";
  fins = new Array<number>(9).fill(0);
  finType = "";
  description = "";
  securityLevel = 0;
  model = "";
  aux1 = "";
  aux2 = "";
  aux3 = "";

  readonly outline = new BezierSpline();
  readonly bottom = new BezierSpline();
  readonly deck = new BezierSpline();
  readonly outlineGuidePoints: VecMath.Point2D[] = [];
  readonly bottomGuidePoints: VecMath.Point2D[] = [];
  readonly deckGuidePoints: VecMath.Point2D[] = [];
  readonly crossSections: BezierBoardCrossSection[] = [];
  currentCrossSection = 1;
  centerOfMass = 0;

  /** Java reader ignores p01–p06 but writer emits them; we keep for lossless round-trip. */
  storedScalars: Partial<{
    p1: number;
    p2: number;
    p3: number;
    p4: number;
    p5: number;
    p6: number;
  }> = {};

  reset(): void {
    this.outline.clear();
    this.bottom.clear();
    this.deck.clear();
    this.outlineGuidePoints.length = 0;
    this.bottomGuidePoints.length = 0;
    this.deckGuidePoints.length = 0;
    this.crossSections.length = 0;
    this.currentCrossSection = 1;
    this.filename = "";
    this.version = "V4.4";
    this.name = "";
    this.author = "";
    this.designer = "";
    this.blankFile = "";
    this.topCuts = 0;
    this.bottomCuts = 0;
    this.railCuts = 0;
    this.cutterDiam = 0;
    this.blankPivot = 0;
    this.boardPivot = 0;
    this.maxAngle = 0;
    this.noseMargin = 0;
    this.tailMargin = 0;
    this.noseLength = 0;
    this.tailLength = 0;
    this.deltaXNose = 0;
    this.deltaXTail = 0;
    this.deltaXMiddle = 0;
    this.toTailSpeed = 0;
    this.stringerSpeed = 0;
    this.regularSpeed = 0;
    this.strut1 = [0, 0, 0];
    this.strut2 = [0, 0, 0];
    this.cutterStartPos = [0, 0, 0];
    this.blankTailPos = [0, 0, 0];
    this.boardStartPos = [0, 0, 0];
    this.currentUnits = 0;
    this.noseRockerOneFoot = 0;
    this.tailRockerOneFoot = 0;
    this.showOriginalBoard = true;
    this.stringerSpeedBottom = 0;
    this.machineFolder = "c:\\machine";
    this.topShoulderAngle = 0;
    this.topShoulderCuts = 0;
    this.bottomRailCuts = 0;
    this.surfer = "";
    this.comments = "";
    this.fins = new Array<number>(9).fill(0);
    this.finType = "";
    this.description = "";
    this.securityLevel = 0;
    this.model = "";
    this.aux1 = "";
    this.aux2 = "";
    this.aux3 = "";
    this.centerOfMass = 0;
    this.storedScalars = {};
  }

  checkAndFixContinousy(fixShouldBeCont: boolean, fixShouldNotBeCont: boolean): void {
    this.checkAndFixContinousyOnSpline(this.outline, fixShouldBeCont, fixShouldNotBeCont);
    this.checkAndFixContinousyOnSpline(this.bottom, fixShouldBeCont, fixShouldNotBeCont);
    this.checkAndFixContinousyOnSpline(this.deck, fixShouldBeCont, fixShouldNotBeCont);
    for (const cs of this.crossSections) {
      this.checkAndFixContinousyOnSpline(cs.getBezierSpline(), fixShouldBeCont, fixShouldNotBeCont);
    }
  }

  private checkAndFixContinousyOnSpline(
    patch: BezierSpline,
    fixShouldBeCont: boolean,
    fixShouldNotBeCont: boolean,
  ): void {
    const n = patch.getNrOfControlPoints();
    for (let i = 0; i < n; i++) {
      const cp = patch.getControlPoint(i);
      if (!cp) continue;
      const pta = cp.getTangentToPrevAngle();
      const nta = cp.getTangentToNextAngle();
      const cont = Math.abs(Math.abs(Math.PI - pta) - nta) < 0.02;
      if (cont && fixShouldBeCont) cp.setContinous(cont);
      if (!cont && fixShouldNotBeCont) cp.setContinous(cont);
    }
  }

  setLocks(): void {
    if (this.outline.getNrOfControlPoints() < 2) return;

    this.outline.getControlPointOrThrow(0).setMask(0, 0);
    this.outline
      .getControlPointOrThrow(this.outline.getNrOfControlPoints() - 1)
      .setMask(0, 0);

    const nd = this.deck.getNrOfControlPoints();
    const nb = this.bottom.getNrOfControlPoints();
    if (nd >= 1) {
      this.deck.getControlPointOrThrow(0).setMask(0, 1);
    }
    if (nd >= 2) {
      this.deck.getControlPointOrThrow(nd - 1).setMask(0, 1);
    }
    if (nb >= 1) {
      this.bottom.getControlPointOrThrow(0).setMask(0, 1);
    }
    if (nb >= 2) {
      this.bottom.getControlPointOrThrow(nb - 1).setMask(0, 1);
    }

    for (const cs of this.crossSections) {
      const sp = cs.getBezierSpline();
      const ns = sp.getNrOfControlPoints();
      if (ns < 2) continue;
      sp.getControlPointOrThrow(0).setMask(0, 0);
      sp.getControlPointOrThrow(ns - 1).setMask(0, 0);
    }

    if (nd >= 1 && nb >= 1) {
      this.deck.getControlPointOrThrow(0).setSlave(this.bottom.getControlPointOrThrow(0));
      this.bottom.getControlPointOrThrow(0).setSlave(this.deck.getControlPointOrThrow(0));
    }
    if (nd >= 2 && nb >= 2) {
      this.deck.getControlPointOrThrow(nd - 1).setSlave(this.bottom.getControlPointOrThrow(nb - 1));
      this.bottom.getControlPointOrThrow(nb - 1).setSlave(this.deck.getControlPointOrThrow(nd - 1));
    }

    for (let i = 0; i < this.outline.getNrOfControlPoints(); i++) {
      this.outline.getControlPointOrThrow(i).setTangentToPrevLocks(LOCK_X_LESS);
      this.outline.getControlPointOrThrow(i).setTangentToNextLocks(LOCK_X_MORE);
    }
    this.outline.getControlPointOrThrow(0).addTangentToNextLocks(LOCK_Y_MORE);
    this.outline
      .getControlPointOrThrow(this.outline.getNrOfControlPoints() - 1)
      .addTangentToPrevLocks(LOCK_Y_MORE);

    for (let i = 0; i < nd; i++) {
      this.deck.getControlPointOrThrow(i).setTangentToPrevLocks(LOCK_X_LESS);
      this.deck.getControlPointOrThrow(i).setTangentToNextLocks(LOCK_X_MORE);
    }

    for (let i = 0; i < nb; i++) {
      this.bottom.getControlPointOrThrow(i).setTangentToPrevLocks(LOCK_X_LESS);
      this.bottom.getControlPointOrThrow(i).setTangentToNextLocks(LOCK_X_MORE);
    }

    for (const cs of this.crossSections) {
      const sp = cs.getBezierSpline();
      const ns = sp.getNrOfControlPoints();
      if (ns < 2) continue;
      sp.getControlPointOrThrow(0).setTangentToNextLocks(LOCK_X_MORE);
      sp.getControlPointOrThrow(ns - 1).setTangentToPrevLocks(LOCK_X_MORE);
    }
  }
}
