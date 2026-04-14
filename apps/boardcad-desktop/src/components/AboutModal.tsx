import { useRef } from "react";
import { APP_DISPLAY_NAME, APP_VERSION_LABEL } from "../constants/brand";
import { useModalA11y } from "../hooks/useModalA11y";

type AboutModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AboutModal({ open, onClose }: AboutModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { dialogRef } = useModalA11y({ open, onClose, initialFocusRef: closeBtnRef });

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        className="modal-dialog"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-dialog__header">
          <h2 id="about-title" className="modal-dialog__title">
            {APP_DISPLAY_NAME}
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
          <p className="modal-dialog__lede">
            Open, inspect, and save surfboard <code>.brd</code> designs in your browser.
            Files stay local unless you choose to upload them elsewhere.
          </p>
          <p className="modal-dialog__meta">
            Version {APP_VERSION_LABEL} · Built with React and the shared TypeScript
            core library in this repository.
          </p>
          <p className="modal-dialog__hint">
            Tip: Use <kbd>Ctrl</kbd>+<kbd>O</kbd> to open, <kbd>Ctrl</kbd>+<kbd>S</kbd>{" "}
            to save, and <kbd>Alt</kbd>+<kbd>E</kbd> for export.
          </p>
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
