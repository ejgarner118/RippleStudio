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
      e.preventDefault();
      e.stopPropagation();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      setZoom((z) => clampZoom(z * factor));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [canvasRef, setZoom, clampZoom, layoutNonce]);
}
