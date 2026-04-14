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
  quality: "draft" | "standard" | "high" = "draft",
): { positions: Float32Array; indices: Uint32Array } | null {
  void _outlineXy;
  if (board.crossSections.length < 2) return null;

  const steps =
    quality === "high"
      ? { lengthStepMm: 1.5, widthStepMm: 1.2 }
      : quality === "standard"
        ? { lengthStepMm: 3, widthStepMm: 2.2 }
        : { lengthStepMm: 6, widthStepMm: 4 };

  const raw = buildJavaSurfaceMesh(board, {
    lengthStepMm: steps.lengthStepMm,
    widthStepMm: steps.widthStepMm,
  });
  if (!raw || raw.positions.length < 9) return null;

  return {
    positions: javaPointsToThreeYUp(raw.positions),
    indices: raw.indices,
  };
}
