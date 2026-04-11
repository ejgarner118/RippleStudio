import { confirmDiscardUnsaved } from "./confirmDiscard";

/** User-initiated quit (e.g. Ctrl+W). Respects dirty state; requires window close permission in Tauri. */
export async function requestTauriWindowClose(isDirty: boolean): Promise<void> {
  if (isDirty && !(await confirmDiscardUnsaved())) return;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().close();
  } catch {
    /* Vite preview without Tauri */
  }
}
