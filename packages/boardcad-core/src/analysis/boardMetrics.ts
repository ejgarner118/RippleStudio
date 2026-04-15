import type { BezierBoard } from "../model/bezierBoard.js";
import {
  getBoardLengthJava,
  getDeckAtPosJava,
  getRockerAtPosJava,
  getThicknessAtPosJava,
  getWidthAtPosJava,
} from "../geometry/boardInterpolation.js";

export type SampleMetric = {
  x: number;
  width: number;
  thickness: number;
  rocker: number;
  deck: number;
};

export type BoardMetrics = {
  length: number;
  maxWidth: number;
  maxThickness: number;
  approxVolumeLiters: number;
  centerOfBuoyancyX: number;
  samples: SampleMetric[];
};

export type BoardDeltaMetrics = {
  lengthDelta: number;
  maxWidthDelta: number;
  maxThicknessDelta: number;
  volumeDeltaLiters: number;
  avgWidthDelta: number;
  avgThicknessDelta: number;
  avgRockerDelta: number;
};

function safeNum(v: number): number {
  return Number.isFinite(v) ? v : 0;
}

function trapz(values: number[], step: number): number {
  if (values.length < 2) return 0;
  let area = 0;
  for (let i = 1; i < values.length; i++) {
    area += (values[i - 1]! + values[i]!) * 0.5 * step;
  }
  return area;
}

export function sampleBoardMetrics(board: BezierBoard, stations = 41): BoardMetrics {
  const length = Math.max(1e-6, getBoardLengthJava(board));
  const n = Math.max(5, stations | 0);
  const step = length / (n - 1);
  const samples: SampleMetric[] = [];
  let maxWidth = 0;
  let maxThickness = 0;
  const sectionAreas: number[] = [];
  const weightedVolumeTerms: number[] = [];

  for (let i = 0; i < n; i++) {
    const x = step * i;
    const width = Math.max(0, safeNum(getWidthAtPosJava(board, x)));
    const thickness = Math.max(0, safeNum(getThicknessAtPosJava(board, x)));
    const rocker = safeNum(getRockerAtPosJava(board, x));
    const deck = safeNum(getDeckAtPosJava(board, x));
    maxWidth = Math.max(maxWidth, width);
    maxThickness = Math.max(maxThickness, thickness);
    // Empirical section factor. Keeps estimate conservative but useful for comparisons.
    const sectionAreaMm2 = width * thickness * 0.62;
    sectionAreas.push(sectionAreaMm2);
    weightedVolumeTerms.push(sectionAreaMm2 * x);
    samples.push({ x, width, thickness, rocker, deck });
  }

  const volumeMm3 = trapz(sectionAreas, step);
  const volumeLiters = volumeMm3 / 1_000_000;
  const weightedIntegral = trapz(weightedVolumeTerms, step);
  const centerOfBuoyancyX = volumeMm3 > 1e-9 ? weightedIntegral / Math.max(1e-9, volumeMm3) : length * 0.5;

  return {
    length,
    maxWidth,
    maxThickness,
    approxVolumeLiters: volumeLiters,
    centerOfBuoyancyX,
    samples,
  };
}

export function compareBoardMetrics(current: BezierBoard, reference: BezierBoard): BoardDeltaMetrics {
  const a = sampleBoardMetrics(current);
  const b = sampleBoardMetrics(reference, a.samples.length);
  const n = Math.min(a.samples.length, b.samples.length);
  let sumWidth = 0;
  let sumThickness = 0;
  let sumRocker = 0;
  for (let i = 0; i < n; i++) {
    sumWidth += a.samples[i]!.width - b.samples[i]!.width;
    sumThickness += a.samples[i]!.thickness - b.samples[i]!.thickness;
    sumRocker += a.samples[i]!.rocker - b.samples[i]!.rocker;
  }
  const denom = Math.max(1, n);
  return {
    lengthDelta: a.length - b.length,
    maxWidthDelta: a.maxWidth - b.maxWidth,
    maxThicknessDelta: a.maxThickness - b.maxThickness,
    volumeDeltaLiters: a.approxVolumeLiters - b.approxVolumeLiters,
    avgWidthDelta: sumWidth / denom,
    avgThicknessDelta: sumThickness / denom,
    avgRockerDelta: sumRocker / denom,
  };
}

