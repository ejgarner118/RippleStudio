import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("hidden") && el.offsetParent !== null,
  );
}

type UseModalA11yOpts = {
  open: boolean;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

export function useModalA11y({ open, onClose, initialFocusRef }: UseModalA11yOpts) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const inertedRef = useRef<HTMLElement[]>([]);

  const clearInerted = () => {
    for (const el of inertedRef.current) {
      el.removeAttribute("aria-hidden");
      el.inert = false;
    }
    inertedRef.current = [];
  };

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const initial = initialFocusRef?.current ?? dialog;
    initial?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (!dialogRef.current) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      e.stopPropagation();
      const items = focusables(dialogRef.current);
      if (items.length === 0) {
        e.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, initialFocusRef]);

  useEffect(() => {
    if (!open) {
      clearInerted();
      return;
    }
    const dialog = dialogRef.current;
    if (!dialog) return;
    const keep = dialog.closest(".modal-backdrop");
    const bodyChildren = Array.from(document.body.children) as HTMLElement[];
    const changed: HTMLElement[] = [];
    for (const child of bodyChildren) {
      if (keep && keep.contains(child)) continue;
      // If the modal is rendered inside #root, never inert the ancestor containing it.
      if (child.contains(dialog)) continue;
      child.setAttribute("aria-hidden", "true");
      child.inert = true;
      changed.push(child);
    }
    inertedRef.current = changed;
    return () => {
      clearInerted();
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    const restore = restoreFocusRef.current;
    if (restore) restore.focus();
  }, [open]);

  return { dialogRef };
}
