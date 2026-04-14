export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const p = navigator.platform || navigator.userAgent || "";
  return /Mac|iPhone|iPad|iPod/i.test(p);
}

export function primaryModifierLabel(): string {
  return isApplePlatform() ? "Cmd" : "Ctrl";
}

export function isTypingContext(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  if (target.isContentEditable) return true;
  if (target.closest("[contenteditable='true']")) return true;
  if (target.closest("[role='textbox']")) return true;
  return false;
}
