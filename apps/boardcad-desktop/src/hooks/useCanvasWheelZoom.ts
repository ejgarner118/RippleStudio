import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
} from "react";

/**
 * Binds a non-passive `wheel` listener so `preventDefault()` stops the page from scrolling
 * while the pointer is over the canvas (React's `onWheel` is often passive).
 */
export function useCanvasWheelZoom(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  setZoom: Dispatch<SetStateAction<number>>,
  clampZoom: (z: number) => number,
  layoutNonce: number,
): void {
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (Math.abs(e.deltaY) < 0.5) return;
      e.preventDefault();
      e.stopPropagation();
      const intensity = e.ctrlKey ? 0.4 : 1;
      const clamped = Math.max(-3, Math.min(3, (e.deltaY / 120) * intensity));
      const factor = Math.pow(1.12, -clamped);
      setZoom((z) => clampZoom(z * factor));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [canvasRef, setZoom, clampZoom, layoutNonce]);
}
