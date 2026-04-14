import { useRef } from "react";
import { APP_DISPLAY_NAME } from "../constants/brand";
import { useModalA11y } from "../hooks/useModalA11y";

type KeyboardShortcutsModalProps = {
  open: boolean;
  onClose: () => void;
};

const ROWS: [string, string][] = [
  ["Open…", "Ctrl+O"],
  ["Save", "Ctrl+S"],
  ["Save as…", "Ctrl+Shift+S"],
  ["Export…", "Alt+E"],
  ["Fit all 2D views (plan / profile / section)", "View menu → Fit 2D views"],
  ["Reset 3D to frame board", "View menu → Reset 3D view"],
  ["Reset every workspace view", "View menu → Reset all views"],
  ["3D preview: orbit / pan / zoom", "Left drag · Right drag pan · Wheel or middle zoom"],
  [
    "2D views (plan / profile / section)",
    "Wheel zooms (does not scroll the page) · Middle-drag or Alt+drag pan",
  ],
  ["Insert point after selection", "A"],
  ["Remove control point", "Delete / Backspace"],
  ["Toggle smooth corner", "C"],
  ["Duplicate section", "Shift+D"],
  ["Interpolate section", "Shift+I"],
  ["Snap drag to 5-unit grid", "Hold Shift"],
  ["Undo", "Ctrl+Z"],
  ["Redo", "Ctrl+Y"],
  ["Close window", "Ctrl+W"],
];

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { dialogRef } = useModalA11y({ open, onClose, initialFocusRef: closeBtnRef });

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kbd-shortcuts-title"
        className="modal-dialog modal-dialog--wide"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-dialog__header">
          <h2 id="kbd-shortcuts-title" className="modal-dialog__title">
            Keyboard shortcuts
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="modal-dialog__close icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-dialog__body">
          <p className="modal-dialog__hint">
            Shortcuts for {APP_DISPLAY_NAME}. Editing shortcuts act on the current editing
            target and selected point. Shortcuts are disabled while focus is in a text field
            or select (except Escape in dialogs).
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
