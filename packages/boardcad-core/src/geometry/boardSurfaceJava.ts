import type { BezierBoard } from "../model/bezierBoard.js";
import {
  getBoardLengthJava,
  getCenterHalfWidthJava,
  getInterpolatedCrossSectionJava,
  getRockerAtPosJava,
} from "./boardInterpolation.js";
import {
  BS_ONE,
  BS_ZERO,
  SURFACE_X_CLAMP_LOW,
} from "./bezierSplineConstants.js";
import { splineGetPointByS, splineGetSByNormalReverse } from "./bezierSplineGeom.js";

const DEG_TO_RAD = Math.PI / 180;

export type Point3Java = { x: number; y: number; z: number };

/**
 * Java `BezierBoardControlPointInterpolationSurfaceModel.getPointAt`
 * (`minAngle`/`maxAngle` in **degrees**, `s` in [0,1] within the window).
 * When `clampAlongLength` is false, samples at the true nose/tail (0 and length) for end caps.
 */
export function getPointAtJava(
  board: BezierBoard,
  xIn: number,
  s: number,
  minAngleDeg: number,
  maxAngleDeg: number,
  useMinimumAngleOnSharpCorners = true,
  clampAlongLength = true,
): Point3Java | null {
  let x = xIn;
  const len = getBoardLengthJava(board);
  if (clampAlongLength) {
    if (x < SURFACE_X_CLAMP_LOW) x = SURFACE_X_CLAMP_LOW;
    if (x > len - SURFACE_X_CLAMP_LOW) x = len - SURFACE_X_CLAMP_LOW;
  }

  const cs = getInterpolatedCrossSectionJava(board, x);
  if (!cs) return null;

  const spline = cs.getBezierSpline();
  let minS = BS_ONE;
  let maxS = BS_ZERO;

  if (minAngleDeg > 0) {
    minS = splineGetSByNormalReverse(
      spline,
      minAngleDeg * DEG_TO_RAD,
      useMinimumAngleOnSharpCorners,
    );
  }

  if (maxAngleDeg < 270) {
    maxS = splineGetSByNormalReverse(
      spline,
      maxAngleDeg * DEG_TO_RAD,
      useMinimumAngleOnSharpCorners,
    );
  }

  if (minS > BS_ONE) minS = BS_ONE;
  if (maxS < BS_ZERO) maxS = BS_ZERO;

  const currentS = (maxS - minS) * s + minS;
  const p2 = splineGetPointByS(spline, currentS);
  const rocker = getRockerAtPosJava(board, x);
  return { x, y: p2.x, z: p2.y + rocker };
}

/** Java `getSurfacePoint(x, sFull)` with full -360..360 degree window. */
export function getSurfacePointFullS(board: BezierBoard, x: number, s: number): Point3Java | null {
  return getPointAtJava(board, x, s, -360, 360, true);
}

/** Java `getSurfacePoint(x, minDeg, maxDeg, split, total)` */
export function getSurfacePointAngled(
  board: BezierBoard,
  x: number,
  minDeg: number,
  maxDeg: number,
  splitIndex: number,
  totalSplits: number,
  clampAlongLength = true,
): Point3Java | null {
  const s = splitIndex / Math.max(totalSplits, 1);
  return getPointAtJava(board, x, s, minDeg, maxDeg, true, clampAlongLength);
}

export type SurfaceMeshJavaOptions = {
  lengthStepMm?: number;
  widthStepMm?: number;
  /** Segments around the perimeter for nose/tail end caps (watertight closure). */
  capSegments?: number;
  /** Optional outline X extents to preserve tail/nose overhang beyond center endpoints. */
  xMinMm?: number;
  xMaxMm?: number;
};

function pushP(pos: number[], p: Point3Java): number {
  const i = pos.length / 3;
  pos.push(p.x, p.y, p.z);
  return i;
}

function triangleArea2(a: Point3Java, b: Point3Java, c: Point3Java): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abz = b.z - a.z;
  const acx = c.x - a.x;
  const acy = c.y - a.y;
  const acz = c.z - a.z;
  const cx = aby * acz - abz * acy;
  const cy = abz * acx - abx * acz;
  const cz = abx * acy - aby * acx;
  return cx * cx + cy * cy + cz * cz;
}

function emitQuad(
  pos: number[],
  idx: number[],
  v0: Point3Java,
  v1: Point3Java,
  v2: Point3Java,
  v3: Point3Java,
): void {
  if (triangleArea2(v0, v1, v2) > 1e-12 && triangleArea2(v0, v2, v3) > 1e-12) {
    const i0 = pushP(pos, v0);
    const i1 = pushP(pos, v1);
    const i2 = pushP(pos, v2);
    const i3 = pushP(pos, v3);
    idx.push(i0, i1, i2, i0, i2, i3);
  }
  const m0 = { x: v3.x, y: -v3.y, z: v3.z };
  const m1 = { x: v2.x, y: -v2.y, z: v2.z };
  const m2 = { x: v1.x, y: -v1.y, z: v1.z };
  const m3 = { x: v0.x, y: -v0.y, z: v0.z };
  if (triangleArea2(m0, m1, m2) > 1e-12 && triangleArea2(m0, m2, m3) > 1e-12) {
    const j0 = pushP(pos, m0);
    const j1 = pushP(pos, m1);
    const j2 = pushP(pos, m2);
    const j3 = pushP(pos, m3);
    idx.push(j0, j1, j2, j0, j2, j3);
  }
}

function centroid3(ring: Point3Java[]): Point3Java {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of ring) {
    x += p.x;
    y += p.y;
    z += p.z;
  }
  const n = ring.length;
  return { x: x / n, y: y / n, z: z / n };
}

function distSq3(a: Point3Java, b: Point3Java): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

/** Collapse consecutive duplicates so end-cap fans stay stable. */
function dedupeRingPoints(ring: Point3Java[], epsSq = 1e-10): Point3Java[] {
  const out: Point3Java[] = [];
  for (const p of ring) {
    if (out.length === 0 || distSq3(out[out.length - 1]!, p) > epsSq) out.push(p);
  }
  if (out.length >= 2 && distSq3(out[0]!, out[out.length - 1]!) <= epsSq) out.pop();
  return out;
}

/**
 * Half-hull perimeter at station `x` (y ≥ 0 side) using the **same** angular splits as
 * deck/bottom strips. This matches the strip boundary so end caps seal without a visible
 * seam/hole at the nose or tail.
 */
function halfHullRingAtStripBoundary(
  board: BezierBoard,
  x: number,
  deckSteps: number,
  bottomSteps: number,
  deckMin: number,
  deckMax: number,
  bottomMin: number,
  bottomMax: number,
): Point3Java[] {
  const ring: Point3Java[] = [];
  for (let i = 0; i < deckSteps; i++) {
    const p =
      i === 0
        ? getPointAtJava(board, x, 0, -360, 360, true, false)
        : getSurfacePointAngled(board, x, deckMin, deckMax, i, deckSteps);
    if (p) ring.push(p);
  }
  const deckRail = getSurfacePointAngled(board, x, deckMin, deckMax, deckSteps, deckSteps);
  if (deckRail) ring.push(deckRail);
  for (let k = 1; k <= bottomSteps; k++) {
    const p = getSurfacePointAngled(board, x, bottomMin, bottomMax, k, bottomSteps);
    if (p) ring.push(p);
  }
  return dedupeRingPoints(ring);
}

/** Fan + mirrored fan so caps match the mirrored half-hull topology. */
function appendEndCapFromRing(
  pos: number[],
  idx: number[],
  ring: Point3Java[],
  outwardPlusX: boolean,
): void {
  if (ring.length < 3) return;

  const c = centroid3(ring);
  const cIdx = pushP(pos, c);
  const ringIdx: number[] = [];
  for (const p of ring) {
    ringIdx.push(pushP(pos, p));
  }
  const n = ringIdx.length;
  for (let i = 0; i < n; i++) {
    const a = ringIdx[i]!;
    const b = ringIdx[(i + 1) % n]!;
    const pa = ring[i]!;
    const pb = ring[(i + 1) % n]!;
    if (triangleArea2(c, pa, pb) > 1e-12) {
      if (outwardPlusX) idx.push(cIdx, b, a);
      else idx.push(cIdx, a, b);
    }
  }

  const cM = pushP(pos, { x: c.x, y: -c.y, z: c.z });
  const mRing: number[] = [];
  for (const p of ring) {
    mRing.push(pushP(pos, { x: p.x, y: -p.y, z: p.z }));
  }
  for (let i = 0; i < n; i++) {
    const a = mRing[i]!;
    const b = mRing[(i + 1) % n]!;
    const pa = { x: ring[i]!.x, y: -ring[i]!.y, z: ring[i]!.z };
    const pb = { x: ring[(i + 1) % n]!.x, y: -ring[(i + 1) % n]!.y, z: ring[(i + 1) % n]!.z };
    const cm = { x: c.x, y: -c.y, z: c.z };
    if (triangleArea2(cm, pa, pb) > 1e-12) {
      if (outwardPlusX) idx.push(cM, a, b);
      else idx.push(cM, b, a);
    }
  }
}

/**
 * Java `BezierBoard.update3DModel` deck + bottom strips (quad topology), then mirror Y.
 * Positions in Java coords: X length, Y lateral, Z vertical.
 */
export function buildJavaSurfaceMesh(
  board: BezierBoard,
  opts: SurfaceMeshJavaOptions = {},
): { positions: Float32Array; indices: Uint32Array } | null {
  const lengthAcc = opts.lengthStepMm ?? 1;
  const widthAcc = opts.widthStepMm ?? 1;

  const baseLength = getBoardLengthJava(board);
  const hasCustomBounds = Number.isFinite(opts.xMinMm) && Number.isFinite(opts.xMaxMm);
  const minX = hasCustomBounds ? (opts.xMinMm as number) : SURFACE_X_CLAMP_LOW;
  const maxX = hasCustomBounds
    ? (opts.xMaxMm as number)
    : Math.max(SURFACE_X_CLAMP_LOW, baseLength - SURFACE_X_CLAMP_LOW);
  const lowX = Math.min(minX, maxX);
  const highX = Math.max(minX, maxX);
  const length = Math.max(highX - lowX, 1e-6);
  if (length < 1e-3) return null;

  const halfWidth = Math.max(getCenterHalfWidthJava(board), 1e-3);
  const lengthSteps = Math.max(2, Math.min(400, Math.floor(length / lengthAcc) + 1));
  const deckSteps = Math.max(2, Math.min(200, Math.floor(halfWidth / widthAcc) + 1));
  const bottomSteps = Math.max(2, Math.min(200, Math.floor(halfWidth / widthAcc) + 1));
  const lengthStep = length / lengthSteps;

  const deckMin = -45;
  const deckMax = 45;
  const bottomMin = 45;
  const bottomMax = 360;

  type P = Point3Java;
  const pos: number[] = [];
  const idx: number[] = [];

  for (let i = 0; i < deckSteps; i++) {
    let xPos = lowX;
    let v0: P;
    let v3: P;
    if (i === 0) {
      v0 = getPointAtJava(board, xPos, 0, -360, 360, true, false) ?? { x: xPos, y: 0, z: 0 };
    } else {
      v0 = getSurfacePointAngled(board, xPos, deckMin, deckMax, i, deckSteps, false) ?? {
        x: xPos,
        y: 0,
        z: 0,
      };
    }
    v3 =
      getSurfacePointAngled(board, xPos, deckMin, deckMax, i + 1, deckSteps, false) ?? {
        x: xPos,
        y: 0,
        z: 0,
      };
    xPos += lengthStep;
    for (let j = 1; j <= lengthSteps; j++) {
      let v1: P;
      if (i === 0) {
        v1 = getPointAtJava(board, xPos, 0, -360, 360, true, false) ?? { x: xPos, y: 0, z: 0 };
      } else {
        v1 = getSurfacePointAngled(board, xPos, deckMin, deckMax, i, deckSteps, false) ?? {
          x: xPos,
          y: 0,
          z: 0,
        };
      }
      const v2 =
        getSurfacePointAngled(board, xPos, deckMin, deckMax, i + 1, deckSteps, false) ?? {
          x: xPos,
          y: 0,
          z: 0,
        };
      emitQuad(pos, idx, v0, v1, v2, v3);
      v0 = v1;
      v3 = v2;
      xPos += lengthStep;
    }
  }

  for (let i = 0; i < bottomSteps; i++) {
    let xPos = lowX;
    let v0 = getSurfacePointAngled(board, xPos, bottomMin, bottomMax, i, bottomSteps, false) ?? {
      x: xPos,
      y: 0,
      z: 0,
    };
    let v3 =
      getSurfacePointAngled(board, xPos, bottomMin, bottomMax, i + 1, bottomSteps, false) ?? {
        x: xPos,
        y: 0,
        z: 0,
      };
    xPos += lengthStep;
    for (let j = 1; j <= lengthSteps; j++) {
      const v1 = getSurfacePointAngled(board, xPos, bottomMin, bottomMax, i, bottomSteps, false) ?? {
        x: xPos,
        y: 0,
        z: 0,
      };
      const v2 =
        getSurfacePointAngled(board, xPos, bottomMin, bottomMax, i + 1, bottomSteps, false) ?? {
          x: xPos,
          y: 0,
          z: 0,
        };
      emitQuad(pos, idx, v0, v1, v2, v3);
      v0 = v1;
      v3 = v2;
      xPos += lengthStep;
    }
  }

  const capLowX = lowX;
  const capHighX = highX;
  const noseRing = halfHullRingAtStripBoundary(
    board,
    capLowX,
    deckSteps,
    bottomSteps,
    deckMin,
    deckMax,
    bottomMin,
    bottomMax,
  );
  const tailRing = halfHullRingAtStripBoundary(
    board,
    capHighX,
    deckSteps,
    bottomSteps,
    deckMin,
    deckMax,
    bottomMin,
    bottomMax,
  );
  appendEndCapFromRing(pos, idx, noseRing, false);
  appendEndCapFromRing(pos, idx, tailRing, true);

  const positions = new Float32Array(pos);
  const indices = new Uint32Array(idx);
  return { positions, indices };
}

/** Three.js Y-up: X=length, Y=Java Z, Z=Java Y. */
export function javaPointsToThreeYUp(positionsJava: Float32Array): Float32Array {
  const n = positionsJava.length / 3;
  const out = new Float32Array(positionsJava.length);
  for (let i = 0; i < n; i++) {
    const jx = positionsJava[i * 3]!;
    const jy = positionsJava[i * 3 + 1]!;
    const jz = positionsJava[i * 3 + 2]!;
    out[i * 3] = jx;
    out[i * 3 + 1] = jz;
    out[i * 3 + 2] = jy;
  }
  return out;
}
