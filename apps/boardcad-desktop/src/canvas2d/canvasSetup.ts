/** Match canvas bitmap size to CSS size and return a 2D context. */
export function prepareCanvas2D(canvas: HTMLCanvasElement | null): {
  ctx: CanvasRenderingContext2D;
  cw: number;
  ch: number;
} | null {
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const cw = canvas.clientWidth || canvas.width;
  const ch = canvas.clientHeight || canvas.height;
  if (canvas.width !== cw) canvas.width = cw;
  if (canvas.height !== ch) canvas.height = ch;
  return { ctx, cw, ch };
}
