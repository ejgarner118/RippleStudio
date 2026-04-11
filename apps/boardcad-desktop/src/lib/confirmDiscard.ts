import { APP_DISPLAY_NAME } from "../constants/brand";

/** True if user chose to discard unsaved work (New / Open / recent, etc.). */
export async function confirmDiscardUnsaved(): Promise<boolean> {
  try {
    const { ask } = await import("@tauri-apps/plugin-dialog");
    return await ask("Discard unsaved changes and continue?", {
      title: APP_DISPLAY_NAME,
      kind: "warning",
      okLabel: "Discard",
      cancelLabel: "Cancel",
    });
  } catch {
    return window.confirm("Discard unsaved changes and continue?");
  }
}
