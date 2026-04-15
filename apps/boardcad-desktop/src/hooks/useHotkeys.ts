import { useEffect } from "react";
import { isTypingContext } from "../lib/keyboardGuards";

type UseHotkeysOptions = {
  modalOpen: boolean;
  onOpenExport: () => void;
  onAddControlPoint: () => void;
  onRemoveControlPoint: () => void;
  onToggleContinuity: () => void;
  onDuplicateSection: () => void;
  onInterpolateSection: () => void;
  onOpenBoard: () => Promise<void>;
  onSaveBoard: () => Promise<void>;
  onSaveBoardAs: () => Promise<void>;
  canUndo: () => boolean;
  canRedo: () => boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export function useHotkeys(opts: UseHotkeysOptions) {
  const {
    modalOpen,
    onOpenExport,
    onAddControlPoint,
    onRemoveControlPoint,
    onToggleContinuity,
    onDuplicateSection,
    onInterpolateSection,
    onOpenBoard,
    onSaveBoard,
    onSaveBoardAs,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
  } = opts;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      if (isTypingContext(e.target)) return;
      if (modalOpen) return;
      const k = e.key.toLowerCase();
      if (!e.ctrlKey && !e.metaKey && e.repeat) {
        if (k === "a" || k === "c" || k === "d" || k === "i") return;
        if (e.key === "Delete" || e.key === "Backspace") return;
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey && k === "e") {
        e.preventDefault();
        onOpenExport();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey && k === "a") {
        e.preventDefault();
        onAddControlPoint();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        onRemoveControlPoint();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey && k === "c") {
        e.preventDefault();
        onToggleContinuity();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && e.shiftKey && k === "d") {
        e.preventDefault();
        onDuplicateSection();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && e.shiftKey && k === "i") {
        e.preventDefault();
        onInterpolateSection();
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (k === "o") {
        e.preventDefault();
        void onOpenBoard();
      }
      if (k === "s" && !e.shiftKey) {
        e.preventDefault();
        void onSaveBoard();
      }
      if (k === "s" && e.shiftKey) {
        e.preventDefault();
        void onSaveBoardAs();
      }
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) onUndo();
      }
      if (k === "y" || (k === "z" && e.shiftKey)) {
        e.preventDefault();
        if (canRedo()) onRedo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    modalOpen,
    onOpenExport,
    onAddControlPoint,
    onRemoveControlPoint,
    onToggleContinuity,
    onDuplicateSection,
    onInterpolateSection,
    onOpenBoard,
    onSaveBoard,
    onSaveBoardAs,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
  ]);
}

