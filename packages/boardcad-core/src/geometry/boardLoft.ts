import type { BezierBoard } from "../model/bezierBoard.js";
import {
  buildJavaSurfaceMesh,
  javaPointsToThreeYUp,
} from "./boardSurfaceJava.js";

function getOutlineXBounds(outlineXy: Float32Array): { minX: number; maxX: number } | null {
  if (outlineXy.length < 2) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < outlineXy.length; i += 2) {
    const x = outlineXy[i]!;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null;
  return { minX, maxX };
}

/**
 * Java-parity hull mesh (`BezierBoard.update3DModel` deck + bottom + mirror),
 * converted to Y-up Three.js coordinates (X length, Y vertical, Z lateral).
 *
 * `outlineXy` is accepted for API compatibility with the desktop app but is unused;
 * outline width is taken from the board outline spline via `getInterpolatedCrossSection`.
 */
export function buildLoftMesh3D(
  board: BezierBoard,
  outlineXy: Float32Array,
  quality: "draft" | "standard" | "high" = "draft",
): { positions: Float32Array; indices: Uint32Array } | null {
  if (board.crossSections.length < 2) return null;

  const steps =
    quality === "high"
      ? { lengthStepMm: 1.5, widthStepMm: 1.2 }
      : quality === "standard"
        ? { lengthStepMm: 3, widthStepMm: 2.2 }
        : { lengthStepMm: 6, widthStepMm: 4 };

  const bounds = getOutlineXBounds(outlineXy);
  const raw = buildJavaSurfaceMesh(board, {
    lengthStepMm: steps.lengthStepMm,
    widthStepMm: steps.widthStepMm,
    xMinMm: bounds?.minX,
    xMaxMm: bounds?.maxX,
  });
  if (!raw || raw.positions.length < 9) return null;

  return {
    positions: javaPointsToThreeYUp(raw.positions),
    indices: raw.indices,
  };
}
