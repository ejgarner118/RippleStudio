import { useEffect, useRef } from "react";
import { APP_DISPLAY_NAME } from "../constants/brand";

type KeyboardShortcutsModalProps = {
  open: boolean;
  onClose: () => void;
};

const ROWS: [string, string][] = [
  ["Open…", "Ctrl+O"],
  ["Save", "Ctrl+S"],
  ["Save as…", "Ctrl+Shift+S"],
  ["Export…", "Alt+E"],
  ["Undo", "Ctrl+Z"],
  ["Redo", "Ctrl+Y"],
  ["Close window", "Ctrl+W"],
];

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kbd-shortcuts-title"
        className="modal-dialog modal-dialog--wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-dialog__header">
          <h2 id="kbd-shortcuts-title" className="modal-dialog__title">
            Keyboard shortcuts
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="modal-dialog__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-dialog__body">
          <p className="modal-dialog__hint">
            Shortcuts for {APP_DISPLAY_NAME}. They are disabled while focus is in a text
            field or select (except Escape in dialogs).
          </p>
          <table className="shortcuts-table">
            <thead>
              <tr>
                <th scope="col">Action</th>
                <th scope="col">Shortcut</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([action, keys]) => (
                <tr key={action}>
                  <td>{action}</td>
                  <td>
                    <kbd className="shortcuts-table__kbd">{keys}</kbd>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-dialog__footer">
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
