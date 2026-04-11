import { useEffect, useRef } from "react";
import { APP_DISPLAY_NAME } from "../constants/brand";

/**
 * Browser: warn on navigation when the document is dirty.
 * Tauri: confirm before closing when dirty. Requires `core:window:allow-destroy`
 * (and typically `core:window:allow-close` for programmatic close) in capabilities.
 */
export function useWindowCloseGuard(isDirty: boolean) {
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  const dialogOpenRef = useRef(false);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const { ask } = await import("@tauri-apps/plugin-dialog");
        if (cancelled) return;
        const win = getCurrentWindow();

        unlisten = await win.onCloseRequested(async (event) => {
          if (!isDirtyRef.current) return;

          if (dialogOpenRef.current) {
            event.preventDefault();
            return;
          }

          event.preventDefault();
          dialogOpenRef.current = true;
          try {
            let discard = false;
            try {
              discard = await ask(
                "You have unsaved changes. Close without saving?",
                {
                  title: APP_DISPLAY_NAME,
                  kind: "warning",
                  okLabel: "Close without saving",
                  cancelLabel: "Cancel",
                },
              );
            } catch (err) {
              console.error("Close confirmation dialog failed:", err);
              await win.destroy();
              return;
            }
            if (!discard) return;
            await win.destroy();
          } finally {
            dialogOpenRef.current = false;
          }
        });
      } catch {
        /* Vite dev without Tauri */
      }
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);
}
