import { confirmDiscardUnsaved } from "./confirmDiscard";

/** Browser variant for Ctrl+W: we can prompt, but actual tab close remains browser-controlled. */
export async function requestTauriWindowClose(isDirty: boolean): Promise<void> {
  if (isDirty && !(await confirmDiscardUnsaved())) return;
  window.close();
}
