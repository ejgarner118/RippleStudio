import type { BezierBoard } from "../model/bezierBoard.js";
import { getBoardLengthJava, getThicknessAtPosJava, getWidthAtPosJava } from "../geometry/boardInterpolation.js";
import { sampleBoardMetrics } from "../analysis/boardMetrics.js";
import { computeRailDiagnostics } from "../board/railToolkit.js";

export type QaSeverity = "info" | "warn" | "error";
export type QaIssue = {
  id: string;
  severity: QaSeverity;
  message: string;
  hint?: string;
};

export type QaContext = {
  minThicknessMm?: number;
  minWidthMm?: number;
  minSections?: number;
  minVolumeLiters?: number;
  maxVolumeLiters?: number;
};

export function runBoardQaChecks(board: BezierBoard, ctx: QaContext = {}): QaIssue[] {
  const issues: QaIssue[] = [];
  const minThicknessMm = ctx.minThicknessMm ?? 18;
  const minWidthMm = ctx.minWidthMm ?? 120;
  const minSections = ctx.minSections ?? 3;
  const length = getBoardLengthJava(board);
  const metrics = sampleBoardMetrics(board);

  if (board.crossSections.length < minSections) {
    issues.push({
      id: "sections-too-few",
      severity: "warn",
      message: `Only ${board.crossSections.length} cross-sections found.`,
      hint: `Add at least ${minSections} sections for smoother interpolation and CAM output.`,
    });
  }

  const checkpoints = [0.1, 0.25, 0.5, 0.75, 0.9];
  for (const p of checkpoints) {
    const x = length * p;
    const t = getThicknessAtPosJava(board, x);
    const w = getWidthAtPosJava(board, x);
    if (t < minThicknessMm) {
      issues.push({
        id: `thin-${p}`,
        severity: "warn",
        message: `Low thickness at ${(p * 100).toFixed(0)}% length (${t.toFixed(1)} mm).`,
        hint: "Increase deck height or reduce bottom rocker in this region.",
      });
    }
    if (w < minWidthMm) {
      issues.push({
        id: `narrow-${p}`,
        severity: p < 0.2 || p > 0.8 ? "info" : "warn",
        message: `Narrow width at ${(p * 100).toFixed(0)}% length (${w.toFixed(1)} mm).`,
        hint: "Check target rider weight and intended wave conditions.",
      });
    }
  }

  if (ctx.minVolumeLiters != null && metrics.approxVolumeLiters < ctx.minVolumeLiters) {
    issues.push({
      id: "volume-low",
      severity: "warn",
      message: `Estimated volume ${metrics.approxVolumeLiters.toFixed(2)} L is below target.`,
      hint: "Increase thickness distribution around center or widen the template.",
    });
  }
  if (ctx.maxVolumeLiters != null && metrics.approxVolumeLiters > ctx.maxVolumeLiters) {
    issues.push({
      id: "volume-high",
      severity: "warn",
      message: `Estimated volume ${metrics.approxVolumeLiters.toFixed(2)} L exceeds target.`,
      hint: "Reduce thickness or trim width in low-sensitivity regions.",
    });
  }

  for (let i = 1; i < board.crossSections.length; i++) {
    const prev = board.crossSections[i - 1]!.getPosition();
    const cur = board.crossSections[i]!.getPosition();
    if (cur <= prev) {
      issues.push({
        id: "section-order",
        severity: "error",
        message: "Cross-section station order is invalid.",
        hint: "Sort sections by station before exporting or generating toolpaths.",
      });
      break;
    }
  }

  // Rail fairness checks by section diagnostics and slope jumps.
  for (let i = 0; i < board.crossSections.length; i++) {
    const sp = board.crossSections[i]!.getBezierSpline();
    const diag = computeRailDiagnostics(sp);
    if (diag.tuckDepth < 0.5) {
      issues.push({
        id: `rail-tuck-shallow-${i}`,
        severity: "info",
        message: `Section #${i + 1}: rail tuck is very shallow.`,
        hint: "Check if this is intentional for the target wave and rail feel.",
      });
    }
    if (diag.tuckDepth > Math.max(8, diag.deckToBottomDelta * 0.75)) {
      issues.push({
        id: `rail-tuck-deep-${i}`,
        severity: "warn",
        message: `Section #${i + 1}: rail tuck appears unusually deep.`,
        hint: "Reduce tuck or smooth apex transition to avoid grabby rail behavior.",
      });
    }
    const n = sp.getNrOfControlPoints();
    for (let k = 1; k < n - 1; k++) {
      const a = sp.getControlPointOrThrow(k - 1).getEndPoint();
      const b = sp.getControlPointOrThrow(k).getEndPoint();
      const c = sp.getControlPointOrThrow(k + 1).getEndPoint();
      const s1 = (b.y - a.y) / Math.max(1e-6, b.x - a.x);
      const s2 = (c.y - b.y) / Math.max(1e-6, c.x - b.x);
      if (Math.abs(s2 - s1) > 2.8) {
        issues.push({
          id: `rail-kink-${i}-${k}`,
          severity: "warn",
          message: `Section #${i + 1}: possible rail kink near control point #${k + 1}.`,
          hint: "Soften local rail transition or adjust handle alignment.",
        });
        break;
      }
    }
  }

  // Simple tool-clearance proxy: deep concaves + narrow width in center region.
  for (const p of [0.35, 0.5, 0.65]) {
    const x = length * p;
    const t = getThicknessAtPosJava(board, x);
    const w = getWidthAtPosJava(board, x);
    if (t < minThicknessMm * 0.8 && w < minWidthMm * 1.25) {
      issues.push({
        id: `tool-clearance-${p}`,
        severity: "warn",
        message: `Potential tool-clearance risk around ${(p * 100).toFixed(0)}% length.`,
        hint: "Review concave depth and cutter diameter before CAM export.",
      });
    }
  }

  return issues;
}

