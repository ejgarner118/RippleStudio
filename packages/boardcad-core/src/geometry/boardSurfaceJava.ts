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
 */
export function getPointAtJava(
  board: BezierBoard,
  xIn: number,
  s: number,
  minAngleDeg: number,
  maxAngleDeg: number,
  useMinimumAngleOnSharpCorners = true,
): Point3Java | null {
  let x = xIn;
  if (x < SURFACE_X_CLAMP_LOW) x = SURFACE_X_CLAMP_LOW;
  const len = getBoardLengthJava(board);
  if (x > len - SURFACE_X_CLAMP_LOW) x = len - SURFACE_X_CLAMP_LOW;

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
): Point3Java | null {
  const s = splitIndex / Math.max(totalSplits, 1);
  return getPointAtJava(board, x, s, minDeg, maxDeg, true);
}

export type SurfaceMeshJavaOptions = {
  lengthStepMm?: number;
  widthStepMm?: number;
};

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

  const length = getBoardLengthJava(board);
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
  const quads: P[] = [];

  const emitQuad = (v0: P, v1: P, v2: P, v3: P) => {
    quads.push(v0, v1, v2, v3);
    quads.push(
      { x: v3.x, y: -v3.y, z: v3.z },
      { x: v2.x, y: -v2.y, z: v2.z },
      { x: v1.x, y: -v1.y, z: v1.z },
      { x: v0.x, y: -v0.y, z: v0.z },
    );
  };

  for (let i = 0; i < deckSteps; i++) {
    let xPos = 0;
    let v0: P;
    let v3: P;
    if (i === 0) {
      v0 = getSurfacePointFullS(board, xPos, 0) ?? { x: xPos, y: 0, z: 0 };
    } else {
      v0 = getSurfacePointAngled(board, xPos, deckMin, deckMax, i, deckSteps) ?? {
        x: xPos,
        y: 0,
        z: 0,
      };
    }
    v3 =
      getSurfacePointAngled(board, xPos, deckMin, deckMax, i + 1, deckSteps) ?? {
        x: xPos,
        y: 0,
        z: 0,
      };
    xPos += lengthStep;
    for (let j = 1; j <= lengthSteps; j++) {
      let v1: P;
      if (i === 0) {
        v1 = getSurfacePointFullS(board, xPos, 0) ?? { x: xPos, y: 0, z: 0 };
      } else {
        v1 = getSurfacePointAngled(board, xPos, deckMin, deckMax, i, deckSteps) ?? {
          x: xPos,
          y: 0,
          z: 0,
        };
      }
      const v2 =
        getSurfacePointAngled(board, xPos, deckMin, deckMax, i + 1, deckSteps) ?? {
          x: xPos,
          y: 0,
          z: 0,
        };
      emitQuad(v0, v1, v2, v3);
      v0 = v1;
      v3 = v2;
      xPos += lengthStep;
    }
  }

  for (let i = 0; i < bottomSteps; i++) {
    let xPos = 0;
    let v0 = getSurfacePointAngled(board, xPos, bottomMin, bottomMax, i, bottomSteps) ?? {
      x: xPos,
      y: 0,
      z: 0,
    };
    let v3 =
      getSurfacePointAngled(board, xPos, bottomMin, bottomMax, i + 1, bottomSteps) ?? {
        x: xPos,
        y: 0,
        z: 0,
      };
    xPos += lengthStep;
    for (let j = 1; j <= lengthSteps; j++) {
      const v1 = getSurfacePointAngled(board, xPos, bottomMin, bottomMax, i, bottomSteps) ?? {
        x: xPos,
        y: 0,
        z: 0,
      };
      const v2 =
        getSurfacePointAngled(board, xPos, bottomMin, bottomMax, i + 1, bottomSteps) ?? {
          x: xPos,
          y: 0,
          z: 0,
        };
      emitQuad(v0, v1, v2, v3);
      v0 = v1;
      v3 = v2;
      xPos += lengthStep;
    }
  }

  const vCount = quads.length;
  const positions = new Float32Array(vCount * 3);
  for (let i = 0; i < vCount; i++) {
    const p = quads[i]!;
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  }

  const nQuad = vCount / 4;
  const indices = new Uint32Array(nQuad * 6);
  let w = 0;
  for (let q = 0; q < nQuad; q++) {
    const b = q * 4;
    const a0 = b;
    const a1 = b + 1;
    const a2 = b + 2;
    const a3 = b + 3;
    indices[w++] = a0;
    indices[w++] = a1;
    indices[w++] = a2;
    indices[w++] = a0;
    indices[w++] = a2;
    indices[w++] = a3;
  }

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
