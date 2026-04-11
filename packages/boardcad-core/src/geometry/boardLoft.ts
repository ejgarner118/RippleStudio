import type { BezierBoard } from "../model/bezierBoard.js";
import {
  buildJavaSurfaceMesh,
  javaPointsToThreeYUp,
} from "./boardSurfaceJava.js";

/**
 * Java-parity hull mesh (`BezierBoard.update3DModel` deck + bottom + mirror),
 * converted to Y-up Three.js coordinates (X length, Y vertical, Z lateral).
 *
 * `outlineXy` is accepted for API compatibility with the desktop app but is unused;
 * outline width is taken from the board outline spline via `getInterpolatedCrossSection`.
 */
export function buildLoftMesh3D(
  board: BezierBoard,
  _outlineXy: Float32Array,
): { positions: Float32Array; indices: Uint32Array } | null {
  void _outlineXy;
  if (board.crossSections.length < 2) return null;

  const raw = buildJavaSurfaceMesh(board, {
    lengthStepMm: 2,
    widthStepMm: 1.5,
  });
  if (!raw || raw.positions.length < 9) return null;

  return {
    positions: javaPointsToThreeYUp(raw.positions),
    indices: raw.indices,
  };
}
