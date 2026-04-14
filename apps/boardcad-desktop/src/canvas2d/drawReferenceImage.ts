import type { BBox2D } from "@boardcad/core";
import type { FitTransform } from "./draw";
import { toCanvas } from "./draw";
import type { ReferenceImageLayer } from "../types/referenceImage";

/**
 * Draw a reference image under splines. Rectangle is axis-aligned in board space
 * (tail-left / nose-right when image is not flipped).
 */
export function drawReferenceImageUnderlay(
  ctx: CanvasRenderingContext2D,
  tf: FitTransform,
  ch: number,
  bounds: BBox2D,
  img: HTMLImageElement,
  layer: ReferenceImageLayer,
): void {
  if (!layer.objectUrl || layer.opacity <= 0) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (iw <= 0 || ih <= 0) return;

  const bw = Math.max(bounds.maxX - bounds.minX, 1e-6);
  const bh = Math.max(bounds.maxY - bounds.minY, 1e-6);
  const base = Math.min(bw / iw, bh / ih);
  const s = base * Math.max(0.15, Math.min(layer.scale, 8));
  let dw = iw * s;
  let dh = ih * s;

  const cx = (bounds.minX + bounds.maxX) * 0.5 + layer.offsetNormX * bw;
  const cy = (bounds.minY + bounds.maxY) * 0.5 + layer.offsetNormY * bh;

  const xL = cx - dw / 2;
  const xR = cx + dw / 2;
  const yB = cy - dh / 2;
  const yT = cy + dh / 2;

  const leftBoard = layer.flipX ? xR : xL;
  const rightBoard = layer.flipX ? xL : xR;

  const p0 = toCanvas(leftBoard, yB, tf, ch);
  const p1 = toCanvas(rightBoard, yB, tf, ch);
  const p2 = toCanvas(rightBoard, yT, tf, ch);
  const p3 = toCanvas(leftBoard, yT, tf, ch);

  const xs = [p0[0], p1[0], p2[0], p3[0]];
  const ys = [p0[1], p1[1], p2[1], p3[1]];
  const minPx = Math.min(...xs);
  const maxPx = Math.max(...xs);
  const minPy = Math.min(...ys);
  const maxPy = Math.max(...ys);
  const cw = maxPx - minPx;
  const chImg = maxPy - minPy;
  if (cw < 2 || chImg < 2) return;

  const cxPx = (minPx + maxPx) * 0.5;
  const cyPx = (minPy + maxPy) * 0.5;
  const rot = ((layer.rotationDeg ?? 0) * Math.PI) / 180;

  ctx.save();
  ctx.globalAlpha = Math.max(0.05, Math.min(layer.opacity, 1));
  try {
    ctx.translate(cxPx, cyPx);
    ctx.rotate(rot);
    ctx.drawImage(img, 0, 0, iw, ih, -cw / 2, -chImg / 2, cw, chImg);
  } catch {
    // incomplete decode
  }
  ctx.restore();
}
