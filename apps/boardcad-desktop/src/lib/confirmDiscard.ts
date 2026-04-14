/** True if user chose to discard unsaved work (New / Open / recent, etc.). */
export async function confirmDiscardUnsaved(): Promise<boolean> {
  return window.confirm("Discard unsaved changes and continue?");
}
