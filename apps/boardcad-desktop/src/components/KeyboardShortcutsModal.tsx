import { useRef } from "react";
import { APP_DISPLAY_NAME } from "../constants/brand";
import { useModalA11y } from "../hooks/useModalA11y";
import { primaryModifierLabel } from "../lib/keyboardGuards";

type KeyboardShortcutsModalProps = {
  open: boolean;
  onClose: () => void;
};

function rowsForPlatform(): [string, string][] {
  const mod = primaryModifierLabel();
  return [
    ["File", "—"],
    ["Import .brd…", `${mod}+O`],
    ["Download .brd", `${mod}+S`],
    ["Download as…", `${mod}+Shift+S`],
    ["Export…", "Alt+E"],
    ["Views", "—"],
    ["Reset 2D framing", "View menu → Reset 2D framing"],
    ["Reset 3D to frame board", "View menu → Reset 3D view"],
    ["Reset all views", "View menu → Reset all views (2D + 3D)"],
    ["3D orbit / pan / zoom", "Left drag · Right drag pan · Wheel or middle zoom"],
    ["2D pan + zoom", "Wheel zoom · Middle-drag / Alt+drag pan · Arrow keys pan · +/- zoom"],
    ["Editing", "—"],
    ["Insert point after selection", "A"],
    ["Remove control point", "Delete / Backspace"],
    ["Cycle handle mode", "C"],
    ["Duplicate cross-section", "Shift+D"],
    ["Interpolate cross-section", "Shift+I"],
    ["Snap drag to 5-unit grid", "Hold Shift"],
    ["Undo", `${mod}+Z`],
    ["Redo", `${mod}+Y / ${mod}+Shift+Z`],
  ];
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { dialogRef } = useModalA11y({ open, onClose, initialFocusRef: closeBtnRef });
  const rows = rowsForPlatform();

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
              {rows.map(([action, keys]) =>
                keys === "—" ? (
                  <tr key={action}>
                    <td colSpan={2} className="shortcuts-table__section">
                      {action}
                    </td>
                  </tr>
                ) : (
                  <tr key={action}>
                    <td>{action}</td>
                    <td>
                      <kbd className="shortcuts-table__kbd">{keys}</kbd>
                    </td>
                  </tr>
                ),
              )}
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
