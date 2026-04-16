import type { BezierSpline, BBox2D } from "@boardcad/core";
import type { CanvasPalette } from "../styles/themePalettes";

/** Optional `panPx` / `panPy` shift drawing in canvas pixels after scale (2D pan). */
export type FitTransform = {
  s: number;
  ox: number;
  oy: number;
  panPx?: number;
  panPy?: number;
};
export type ControlPointMarkerState = {
  selected?: { index: number; point?: "end" | "prev" | "next" } | null;
  hover?: { index: number; point?: "end" | "prev" | "next" } | null;
};

export function computeFit(
  b: BBox2D,
  cw: number,
  ch: number,
  pad: number,
  zoom = 1,
  opts?: { alignY?: "center" | "top" },
): FitTransform {
  const w = Math.max(b.maxX - b.minX, 1e-6);
  const h = Math.max(b.maxY - b.minY, 1e-6);
  const sx = (cw - 2 * pad) / w;
  const sy = (ch - 2 * pad) / h;
  const z = Math.max(0.2, Math.min(zoom, 12));
  const s = Math.min(sx, sy) * z;
  const innerW = s * w;
  const innerH = s * h;
  const ox = pad + (cw - 2 * pad - innerW) / 2 - s * b.minX;
  const oy = opts?.alignY === "top"
    ? ch - pad - s * b.maxY
    : pad + (ch - 2 * pad - innerH) / 2 - s * b.minY;
  return { s, ox, oy };
}

export function toCanvas(
  x: number,
  y: number,
  tf: FitTransform,
  ch: number,
): [number, number] {
  const px = tf.panPx ?? 0;
  const py = tf.panPy ?? 0;
  const sx = tf.ox + x * tf.s + px;
  const sy = ch - (tf.oy + y * tf.s) + py;
  return [sx, sy];
}

/** Inverse of {@link toCanvas}: canvas pixel coords → board plane (mm). */
export function fromCanvas(
  sx: number,
  sy: number,
  tf: FitTransform,
  ch: number,
): [number, number] {
  const px = tf.panPx ?? 0;
  const py = tf.panPy ?? 0;
  const x = (sx - px - tf.ox) / tf.s;
  const y = (ch - sy + py - tf.oy) / tf.s;
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
  markerState?: ControlPointMarkerState,
  palette?: CanvasPalette,
): void {
  const n = spline.getNrOfControlPoints();
  ctx.strokeStyle = palette?.handleArm ?? "#8f4d00";
  ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const k = spline.getControlPoint(i);
    if (!k) continue;
    const p0 = k.getEndPoint();
    const p1 = k.getTangentToPrev();
    const p2 = k.getTangentToNext();
    const yFactors = [1, -1] as const;
    for (const ySign of yFactors) {
      const [x0, y0] = toCanvas(p0.x, p0.y * ySign, tf, ch);
      const [x1, y1] = toCanvas(p1.x, p1.y * ySign, tf, ch);
      const [x2, y2] = toCanvas(p2.x, p2.y * ySign, tf, ch);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.moveTo(x0, y0);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    const selected = markerState?.selected?.index === i ? markerState.selected : null;
    const hover = markerState?.hover?.index === i ? markerState.hover : null;
    drawMirroredDisks(
      ctx,
      p1.x,
      p1.y,
      tf,
      ch,
      selected?.point === "prev" ? 4 : hover?.point === "prev" ? 3.5 : 2.5,
      selected?.point === "prev"
        ? (palette?.handleSelected ?? "#f59e0b")
        : hover?.point === "prev"
          ? (palette?.handleHover ?? "#fbbf24")
          : (palette?.handle ?? "#f6ad55"),
      true,
    );
    drawMirroredDisks(
      ctx,
      p2.x,
      p2.y,
      tf,
      ch,
      selected?.point === "next" ? 4 : hover?.point === "next" ? 3.5 : 2.5,
      selected?.point === "next"
        ? (palette?.handleSelected ?? "#f59e0b")
        : hover?.point === "next"
          ? (palette?.handleHover ?? "#fbbf24")
          : (palette?.handle ?? "#f6ad55"),
      true,
    );
    drawMirroredDisks(
      ctx,
      p0.x,
      p0.y,
      tf,
      ch,
      selected?.point === "end" ? 6 : hover?.point === "end" ? 5 : 4,
      selected?.point === "end"
        ? (palette?.knotSelected ?? "#2563eb")
        : hover?.point === "end"
          ? (palette?.knotHover ?? "#3b82f6")
          : (palette?.knotPrimary ?? "#c01c28"),
      true,
    );
  }
}

export function drawGuidePointsMirrored(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  tf: FitTransform,
  ch: number,
  palette?: CanvasPalette,
): void {
  for (const p of pts) {
    drawMirroredDisks(ctx, p.x, p.y, tf, ch, 3, palette?.guidePoint ?? "#3584e4", true);
  }
}

export function drawControlPoints(
  ctx: CanvasRenderingContext2D,
  spline: BezierSpline,
  tf: FitTransform,
  ch: number,
  markerState?: ControlPointMarkerState,
  palette?: CanvasPalette,
): void {
  const n = spline.getNrOfControlPoints();
  ctx.strokeStyle = palette?.handleArm ?? "#8f4d00";
  ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const k = spline.getControlPoint(i);
    if (!k) continue;
    const p0 = k.getEndPoint();
    const p1 = k.getTangentToPrev();
    const p2 = k.getTangentToNext();
    const [x0, y0] = toCanvas(p0.x, p0.y, tf, ch);
    const [x1, y1] = toCanvas(p1.x, p1.y, tf, ch);
    const [x2, y2] = toCanvas(p2.x, p2.y, tf, ch);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.moveTo(x0, y0);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const selected = markerState?.selected?.index === i ? markerState.selected : null;
    const hover = markerState?.hover?.index === i ? markerState.hover : null;
    drawMirroredDisks(
      ctx,
      p1.x,
      p1.y,
      tf,
      ch,
      selected?.point === "prev" ? 4 : hover?.point === "prev" ? 3.5 : 2.5,
      selected?.point === "prev"
        ? (palette?.handleSelected ?? "#f59e0b")
        : hover?.point === "prev"
          ? (palette?.handleHover ?? "#fbbf24")
          : (palette?.handle ?? "#f6ad55"),
      false,
    );
    drawMirroredDisks(
      ctx,
      p2.x,
      p2.y,
      tf,
      ch,
      selected?.point === "next" ? 4 : hover?.point === "next" ? 3.5 : 2.5,
      selected?.point === "next"
        ? (palette?.handleSelected ?? "#f59e0b")
        : hover?.point === "next"
          ? (palette?.handleHover ?? "#fbbf24")
          : (palette?.handle ?? "#f6ad55"),
      false,
    );
    drawMirroredDisks(
      ctx,
      p0.x,
      p0.y,
      tf,
      ch,
      selected?.point === "end" ? 6 : hover?.point === "end" ? 5 : 4,
      selected?.point === "end"
        ? (palette?.knotSelected ?? "#2563eb")
        : hover?.point === "end"
          ? (palette?.knotHover ?? "#3b82f6")
          : (palette?.knotPrimary ?? "#c01c28"),
      false,
    );
  }
}

export function drawGuidePoints(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  tf: FitTransform,
  ch: number,
  palette?: CanvasPalette,
): void {
  for (const p of pts) {
    drawMirroredDisks(ctx, p.x, p.y, tf, ch, 3, palette?.guidePoint ?? "#3584e4", false);
  }
}

/** Grid in board file units (mm, cm, or inch) so screen spacing matches the shape scale. */
export function drawMetricGrid(
  ctx: CanvasRenderingContext2D,
  tf: FitTransform,
  ch: number,
  bounds: BBox2D,
  stepModel = 50,
  color = "#ddd",
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const loX = Math.floor(bounds.minX / stepModel) * stepModel;
  const hiX = Math.ceil(bounds.maxX / stepModel) * stepModel;
  const loY = Math.floor(bounds.minY / stepModel) * stepModel;
  const hiY = Math.ceil(bounds.maxY / stepModel) * stepModel;
  for (let wx = loX; wx <= hiX + 1e-6; wx += stepModel) {
    const [x0, y0] = toCanvas(wx, bounds.minY, tf, ch);
    const [x1, y1] = toCanvas(wx, bounds.maxY, tf, ch);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  for (let wy = loY; wy <= hiY + 1e-6; wy += stepModel) {
    const [x0, y0] = toCanvas(bounds.minX, wy, tf, ch);
    const [x1, y1] = toCanvas(bounds.maxX, wy, tf, ch);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
}
