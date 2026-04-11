import { BezierBoard } from "../model/bezierBoard.js";
import { BezierKnot } from "../model/bezierKnot.js";
import { BezierSpline } from "../model/bezierSpline.js";
import { BezierBoardCrossSection } from "../model/bezierBoardCrossSection.js";
import { setExtension } from "./fileTools.js";
import type * as VecMath from "../geometry/vecMath.js";

function buildId(id: number): string {
  return id < 10 ? `p0${id} : ` : `p${id} : `;
}

function writeStr(id: number, value: string | null | undefined, parts: string[]): void {
  if (value == null || value.length === 0) return;
  const escaped = value.replace(/\n/g, "\\n");
  parts.push(`${buildId(id)}${escaped}\n`);
}

function writeInt(id: number, value: number, parts: string[]): void {
  parts.push(`${buildId(id)}${value}\n`);
}

function writeDouble(id: number, value: number, parts: string[]): void {
  parts.push(`${buildId(id)}${value}\n`);
}

function writeBool(id: number, value: boolean, parts: string[]): void {
  parts.push(`${buildId(id)}${value}\n`);
}

function writeDoubleArr(id: number, values: number[], parts: string[]): void {
  parts.push(`${buildId(id)}[${values.join(",")}]\n`);
}

function writeKnot(knot: BezierKnot, parts: string[]): void {
  const pts = knot.points;
  parts.push(
    `(cp [${pts[0]!.x},${pts[0]!.y},${pts[1]!.x},${pts[1]!.y},${pts[2]!.x},${pts[2]!.y}] ${knot.isContinous()} ${knot.getOther()})\n`,
  );
}

function writeGuide(gp: VecMath.Point2D, parts: string[]): void {
  parts.push(`(gp [${gp.x},${gp.y}])\n`);
}

function writeSplineBlock(
  header: string,
  spline: BezierSpline,
  guidepoints: VecMath.Point2D[],
  parts: string[],
): void {
  parts.push(header);
  const n = spline.getNrOfControlPoints();
  for (let i = 0; i < n; i++) {
    writeKnot(spline.getControlPointOrThrow(i), parts);
  }
  if (guidepoints.length > 0) {
    parts.push("gps : (\n");
    for (const g of guidepoints) writeGuide(g, parts);
    parts.push(")\n");
  }
  parts.push(")\n");
}

function writeCrossSections(sections: BezierBoardCrossSection[], parts: string[]): void {
  parts.push(`${buildId(35)}(\n`);
  for (const cs of sections) {
    parts.push(`(p36 ${cs.getPosition()}\n`);
    writeSplineBlock("", cs.getBezierSpline(), cs.getGuidePoints(), parts);
  }
  parts.push(")\n");
}

/** Serialize board to .brd text (Java BrdWriter field order). */
export function saveBrdToString(brd: BezierBoard): string {
  const parts: string[] = [];
  const s = brd.storedScalars;
  writeDouble(1, s.p1 ?? estimateLength(brd), parts);
  writeDouble(2, s.p2 ?? estimateLengthOverCurve(brd), parts);
  writeDouble(3, s.p3 ?? estimateThickness(brd), parts);
  writeDouble(4, s.p4 ?? estimateCenterWidth(brd), parts);
  if (s.p5 !== undefined) writeDouble(5, s.p5, parts);
  if (s.p6 !== undefined) writeDouble(6, s.p6, parts);
  writeStr(7, brd.version, parts);
  writeStr(8, brd.name, parts);
  writeStr(9, brd.author, parts);
  writeStr(10, brd.blankFile, parts);
  writeStr(45, brd.designer, parts);
  writeStr(54, brd.model, parts);
  writeStr(55, brd.aux1, parts);
  writeStr(56, brd.aux2, parts);
  writeStr(57, brd.aux3, parts);
  writeStr(43, brd.machineFolder, parts);
  writeInt(11, brd.topCuts, parts);
  writeInt(12, brd.bottomCuts, parts);
  writeInt(13, brd.railCuts, parts);
  writeDouble(14, brd.cutterDiam, parts);
  writeDouble(15, brd.blankPivot, parts);
  writeDouble(16, brd.boardPivot, parts);
  writeDouble(17, brd.maxAngle, parts);
  writeDouble(18, brd.noseMargin, parts);
  writeDouble(99, brd.tailMargin, parts);
  writeDouble(19, brd.noseLength, parts);
  writeDouble(20, brd.tailLength, parts);
  writeDouble(21, brd.deltaXNose, parts);
  writeDouble(22, brd.deltaXTail, parts);
  writeDouble(23, brd.deltaXMiddle, parts);
  writeInt(24, brd.toTailSpeed, parts);
  writeInt(25, brd.stringerSpeed, parts);
  writeInt(42, brd.stringerSpeedBottom, parts);
  writeInt(26, brd.regularSpeed, parts);
  writeDouble(44, brd.topShoulderAngle, parts);
  writeInt(46, brd.topShoulderCuts, parts);
  writeInt(47, brd.bottomRailCuts, parts);
  writeInt(38, brd.currentUnits, parts);
  writeDouble(39, brd.noseRockerOneFoot, parts);
  writeDouble(40, brd.tailRockerOneFoot, parts);
  writeInt(53, brd.securityLevel, parts);
  writeBool(41, brd.showOriginalBoard, parts);
  writeStr(48, brd.surfer, parts);
  writeStr(49, brd.comments, parts);
  writeStr(51, brd.finType, parts);
  writeStr(52, brd.description, parts);
  writeDoubleArr(50, [...brd.fins], parts);
  writeDoubleArr(27, [...brd.strut1], parts);
  writeDoubleArr(28, [...brd.strut2], parts);
  writeDoubleArr(29, [...brd.cutterStartPos], parts);
  writeDoubleArr(30, [...brd.blankTailPos], parts);
  writeDoubleArr(31, [...brd.boardStartPos], parts);
  writeSplineBlock(`${buildId(32)}(\n`, brd.outline, brd.outlineGuidePoints, parts);
  writeSplineBlock(`${buildId(33)}(\n`, brd.bottom, brd.bottomGuidePoints, parts);
  writeSplineBlock(`${buildId(34)}(\n`, brd.deck, brd.deckGuidePoints, parts);
  writeCrossSections(brd.crossSections, parts);
  return parts.join("");
}

function estimateLength(brd: BezierBoard): number {
  const o = brd.outline;
  if (o.getNrOfControlPoints() < 2) return 0;
  const a = o.getControlPointOrThrow(0).getEndPoint();
  const b = o.getControlPointOrThrow(o.getNrOfControlPoints() - 1).getEndPoint();
  return Math.abs(b.x - a.x);
}

function estimateLengthOverCurve(_brd: BezierBoard): number {
  return estimateLength(_brd);
}

function estimateThickness(_brd: BezierBoard): number {
  const d = _brd.deck;
  const b = _brd.bottom;
  if (d.getNrOfControlPoints() < 1 || b.getNrOfControlPoints() < 1) return 0;
  return Math.abs(
    d.getControlPointOrThrow(0).getEndPoint().y - b.getControlPointOrThrow(0).getEndPoint().y,
  );
}

function estimateCenterWidth(_brd: BezierBoard): number {
  const o = _brd.outline;
  if (o.getNrOfControlPoints() < 1) return 0;
  let maxY = 0;
  for (let i = 0; i < o.getNrOfControlPoints(); i++) {
    maxY = Math.max(maxY, Math.abs(o.getControlPointOrThrow(i).getEndPoint().y));
  }
  return maxY * 2;
}

export function saveBrdToPath(brd: BezierBoard, path: string): { ok: boolean; text: string } {
  const text = saveBrdToString(brd);
  const _out = setExtension(path, "brd");
  brd.filename = _out;
  return { ok: true, text };
}
