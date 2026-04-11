import type { BezierSpline, BBox2D } from "@boardcad/core";

export type FitTransform = { s: number; ox: number; oy: number };

export function computeFit(
  b: BBox2D,
  cw: number,
  ch: number,
  pad: number,
): FitTransform {
  const w = Math.max(b.maxX - b.minX, 1e-6);
  const h = Math.max(b.maxY - b.minY, 1e-6);
  const sx = (cw - 2 * pad) / w;
  const sy = (ch - 2 * pad) / h;
  const s = Math.min(sx, sy);
  const innerW = s * w;
  const innerH = s * h;
  const ox = pad + (cw - 2 * pad - innerW) / 2 - s * b.minX;
  const oy = pad + (ch - 2 * pad - innerH) / 2 - s * b.minY;
  return { s, ox, oy };
}

export function toCanvas(
  x: number,
  y: number,
  tf: FitTransform,
  ch: number,
): [number, number] {
  const sx = tf.ox + x * tf.s;
  const sy = ch - (tf.oy + y * tf.s);
  return [sx, sy];
}

/** Inverse of {@link toCanvas}: canvas pixel coords → board plane (mm). */
export function fromCanvas(
  sx: number,
  sy: number,
  tf: FitTransform,
  ch: number,
): [number, number] {
  const x = (sx - tf.ox) / tf.s;
  const y = (ch - sy - tf.oy) / tf.s;
  return [x, y];
}

export type StrokeStyle = { color: string; width: number; dash?: number[] };

export function strokePolyline(
  ctx: CanvasRenderingContext2D,
  xy: Float32Array,
  tf: FitTransform,
  ch: number,
  style: StrokeStyle,
): void {
  if (xy.length < 4) return;
  ctx.beginPath();
  for (let i = 0; i < xy.length; i += 2) {
    const [px, py] = toCanvas(xy[i]!, xy[i + 1]!, tf, ch);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.setLineDash(style.dash ?? []);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawMirroredDisks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tf: FitTransform,
  ch: number,
  radius: number,
  fill: string,
  mirrorY: boolean,
): void {
  ctx.fillStyle = fill;
  const yFactors = mirrorY ? ([1, -1] as const) : ([1] as const);
  for (const ySign of yFactors) {
    const [sx, sy] = toCanvas(x, y * ySign, tf, ch);
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawControlPointsMirroredOutline(
  ctx: CanvasRenderingContext2D,
  spline: BezierSpline,
  tf: FitTransform,
  ch: number,
): void {
  const n = spline.getNrOfControlPoints();
  for (let i = 0; i < n; i++) {
    const k = spline.getControlPoint(i);
    if (!k) continue;
    const p = k.getEndPoint();
    drawMirroredDisks(ctx, p.x, p.y, tf, ch, 4, "#c01c28", true);
  }
}

export function drawGuidePointsMirrored(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  tf: FitTransform,
  ch: number,
): void {
  for (const p of pts) {
    drawMirroredDisks(ctx, p.x, p.y, tf, ch, 3, "#3584e4", true);
  }
}

export function drawControlPoints(
  ctx: CanvasRenderingContext2D,
  spline: BezierSpline,
  tf: FitTransform,
  ch: number,
): void {
  const n = spline.getNrOfControlPoints();
  for (let i = 0; i < n; i++) {
    const k = spline.getControlPoint(i);
    if (!k) continue;
    const p = k.getEndPoint();
    drawMirroredDisks(ctx, p.x, p.y, tf, ch, 4, "#c01c28", false);
  }
}

export function drawGuidePoints(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  tf: FitTransform,
  ch: number,
): void {
  for (const p of pts) {
    drawMirroredDisks(ctx, p.x, p.y, tf, ch, 3, "#3584e4", false);
  }
}

export function drawPlanGrid(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  step = 40,
): void {
  ctx.strokeStyle = "#ddd";
  for (let x = 0; x < cw; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ch);
    ctx.stroke();
  }
  for (let y = 0; y < ch; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cw, y);
    ctx.stroke();
  }
}
