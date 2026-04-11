import { BezierBoard } from "../model/bezierBoard.js";
import { BezierKnot } from "../model/bezierKnot.js";
import { BezierSpline } from "../model/bezierSpline.js";
import { BezierBoardCrossSection } from "../model/bezierBoardCrossSection.js";
import {
  brdEncryptionPasswordForHeader,
  decryptBrdFile,
} from "./brdDecrypt.js";
import type * as VecMath from "../geometry/vecMath.js";

let lastError = "";

export function getBrdReadError(): string {
  return lastError;
}

function setError(msg: string): void {
  lastError = msg;
}

function readDoubleArray(input: string, returnValues: number[]): void {
  const inner = input.slice(1, -1);
  const values = inner.split(",");
  for (let i = 0; i < values.length; i++) {
    returnValues[i] = Number(values[i]);
  }
}

export function readControlPointFromLine(line: string): BezierKnot | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("(cp")) return null;
  const inner = trimmed.slice(1, -1);
  const parts = inner.split(" ");
  const valuesStr = parts[1]!.slice(1, -1);
  const values = valuesStr.split(",").map((v) => Number(v.trim()));
  const cp = new BezierKnot();
  for (let i = 0; i < 3; i++) {
    cp.points[i]!.x = values[i * 2]!;
    cp.points[i]!.y = values[(i * 2 + 1) as number]!;
  }
  cp.setContinous(parts[2] === "true");
  cp.setOther(parts[3] === "true");
  return cp;
}

function readArrayOfControlPointsAndGuidepoints(
  lines: string[],
  startIndex: { i: number },
  spline: BezierSpline,
  guidepointArray: VecMath.Point2D[] | null,
): void {
  let strLine = lines[startIndex.i]?.trim() ?? "";
  startIndex.i++;
  while (strLine.startsWith("(cp")) {
    const cp = readControlPointFromLine(strLine);
    if (cp) spline.append(cp);
    strLine = lines[startIndex.i]?.trim() ?? "";
    startIndex.i++;
  }
  if (strLine.startsWith("gps")) {
    if (guidepointArray) {
      strLine = lines[startIndex.i]?.trim() ?? "";
      startIndex.i++;
      while (strLine.startsWith("(gp")) {
        const splitString = strLine.split(" ");
        const valuesStr = splitString[1]!.slice(1, -2);
        const values = valuesStr.split(",");
        guidepointArray.push({
          x: Number(values[0]),
          y: Number(values[1]),
        });
        strLine = lines[startIndex.i]?.trim() ?? "";
        startIndex.i++;
      }
      startIndex.i++;
    }
  }
}

function parseLineMeta(line: string): { id: number; val: string } | null {
  const strLine = line.trim();
  if (strLine.length < 3 || !strLine.includes(":") || !strLine.startsWith("p")) {
    return null;
  }
  const id = Number(strLine.substring(1, 3).trim());
  const val = strLine.substring(6, strLine.length).trim();
  return { id, val };
}

/** Load plaintext .brd body (after optional decrypt). */
export function loadBrdPlaintext(brd: BezierBoard, text: string): number {
  brd.reset();
  lastError = "";
  const lines = text.split(/\r?\n/);
  const idx = { i: 0 };
  try {
    while (idx.i < lines.length) {
      const raw = lines[idx.i];
      idx.i++;
      if (raw === undefined) break;
      const strLine = raw.trimEnd();
      if (strLine.length < 3) continue;
      if (!strLine.includes(":")) continue;
      if (!strLine.startsWith("p")) continue;

      const meta = parseLineMeta(strLine);
      if (!meta) continue;
      const { id, val } = meta;

      switch (id) {
        case 1:
          brd.storedScalars.p1 = Number(val);
          break;
        case 2:
          brd.storedScalars.p2 = Number(val);
          break;
        case 3:
          brd.storedScalars.p3 = Number(val);
          break;
        case 4:
          brd.storedScalars.p4 = Number(val);
          break;
        case 5:
          brd.storedScalars.p5 = Number(val);
          break;
        case 6:
          brd.storedScalars.p6 = Number(val);
          break;
        case 7:
          brd.version = val;
          break;
        case 8:
          brd.name = val;
          break;
        case 9:
          brd.author = val;
          break;
        case 10:
          brd.blankFile = val;
          break;
        case 11:
          brd.topCuts = Number(val);
          break;
        case 12:
          brd.bottomCuts = Number(val);
          break;
        case 13:
          brd.railCuts = Number(val);
          break;
        case 14:
          brd.cutterDiam = Number(val);
          break;
        case 15:
          brd.blankPivot = Number(val);
          break;
        case 16:
          brd.boardPivot = Number(val);
          break;
        case 17:
          brd.maxAngle = Number(val);
          break;
        case 18:
          brd.noseMargin = Number(val);
          break;
        case 19:
          brd.noseLength = Number(val);
          break;
        case 20:
          brd.tailLength = Number(val);
          break;
        case 21:
          brd.deltaXNose = Number(val);
          break;
        case 22:
          brd.deltaXTail = Number(val);
          break;
        case 23:
          brd.deltaXMiddle = Number(val);
          break;
        case 24:
          brd.toTailSpeed = Number(val);
          break;
        case 25:
          brd.stringerSpeed = Number(val);
          break;
        case 26:
          brd.regularSpeed = Number(val);
          break;
        case 27:
          readDoubleArray(val, brd.strut1);
          break;
        case 28:
          readDoubleArray(val, brd.strut2);
          break;
        case 29:
          readDoubleArray(val, brd.cutterStartPos);
          break;
        case 30:
          readDoubleArray(val, brd.blankTailPos);
          break;
        case 31:
          readDoubleArray(val, brd.boardStartPos);
          break;
        case 32:
          readArrayOfControlPointsAndGuidepoints(
            lines,
            idx,
            brd.outline,
            brd.outlineGuidePoints,
          );
          break;
        case 33:
          readArrayOfControlPointsAndGuidepoints(
            lines,
            idx,
            brd.bottom,
            brd.bottomGuidePoints,
          );
          break;
        case 34:
          readArrayOfControlPointsAndGuidepoints(
            lines,
            idx,
            brd.deck,
            brd.deckGuidePoints,
          );
          break;
        case 35: {
          let inner = lines[idx.i]?.trim() ?? "";
          idx.i++;
          while (inner.startsWith("(p36")) {
            const cs = new BezierBoardCrossSection();
            brd.crossSections.push(cs);
            const a = inner.indexOf(" ");
            let b = inner.indexOf(" ", a + 1);
            if (b < 0) b = inner.length;
            const value = inner.substring(a, b).trim();
            cs.setPosition(Number(value));
            readArrayOfControlPointsAndGuidepoints(
              lines,
              idx,
              cs.getBezierSpline(),
              cs.getGuidePoints(),
            );
            inner = lines[idx.i]?.trim() ?? "";
            idx.i++;
          }
          idx.i--;
          break;
        }
        case 38:
          brd.currentUnits = Number(val);
          break;
        case 39:
          brd.noseRockerOneFoot = Number(val);
          break;
        case 40:
          brd.tailRockerOneFoot = Number(val);
          break;
        case 41:
          brd.showOriginalBoard = val === "true";
          break;
        case 42:
          brd.stringerSpeedBottom = Number(val);
          break;
        case 43:
          brd.machineFolder = val;
          break;
        case 44:
          brd.topShoulderAngle = Number(val);
          break;
        case 45:
          brd.designer = val;
          break;
        case 46:
          brd.topShoulderCuts = Number(val);
          break;
        case 47:
          brd.bottomRailCuts = Number(val);
          break;
        case 48:
          brd.surfer = val;
          break;
        case 49:
          brd.comments = val.replace(/\\n/g, "\n");
          break;
        case 50:
          readDoubleArray(val, brd.fins);
          break;
        case 51:
          brd.finType = val;
          break;
        case 52:
          brd.description = val;
          break;
        case 53:
          brd.securityLevel = Number(val);
          break;
        case 54:
          brd.model = val;
          break;
        case 55:
          brd.aux1 = val;
          break;
        case 56:
          brd.aux2 = val;
          break;
        case 57:
          brd.aux3 = val;
          break;
        case 99:
          brd.tailMargin = Number(val);
          break;
        default:
          break;
      }
    }
    brd.checkAndFixContinousy(false, true);
    brd.setLocks();
    return 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    setError(`Failed to read .brd: ${msg}`);
    return -1;
  }
}

/** Load from UTF-8 plaintext only (no %BRD encrypted header). */
export function loadBrdFromText(brd: BezierBoard, text: string, filename: string): number {
  const r = loadBrdPlaintext(brd, text);
  if (r === 0) brd.filename = filename;
  return r;
}

export function loadBrdFromBytes(brd: BezierBoard, data: Uint8Array, filename: string): number {
  const firstLineEnd = data.indexOf(10);
  const header =
    firstLineEnd >= 0
      ? new TextDecoder("utf-8").decode(data.subarray(0, firstLineEnd)).trim()
      : "";
  if (header.startsWith("%BRD-1.0")) {
    const pw = brdEncryptionPasswordForHeader(header);
    if (!pw) {
      setError("Unknown encrypted .brd header");
      return -1;
    }
    try {
      const body = decryptBrdFile(data, pw);
      const r = loadBrdPlaintext(brd, body);
      if (r === 0) brd.filename = filename;
      return r;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Decrypt failed: ${msg}`);
      return -1;
    }
  }
  const text = new TextDecoder("utf-8").decode(data);
  return loadBrdFromText(brd, text, filename);
}
