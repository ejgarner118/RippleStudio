import { useRef } from "react";
import { useModalA11y } from "../hooks/useModalA11y";

type BrdFormatHelpModalProps = {
  open: boolean;
  onClose: () => void;
};

export function BrdFormatHelpModal({ open, onClose }: BrdFormatHelpModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { dialogRef } = useModalA11y({ open, onClose, initialFocusRef: closeBtnRef });

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="brd-help-title"
        className="modal-dialog modal-dialog--wide"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-dialog__header">
          <h2 id="brd-help-title" className="modal-dialog__title">
            About <code>.brd</code> files
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
            A <code>.brd</code> file is a mostly text, line-oriented surfboard design. It
            stores outline, deck and bottom profiles, cross-sections along the length,
            and metadata such as name, author, and unit code.
          </p>
          <ul className="help-list">
            <li>
              Lines look like <code>p08 : MyBoard</code> — a two-digit property id and
              a value (see the full property index in the repo).
            </li>
            <li>
              Some files start with an encrypted header (<code>%BRD-1.01</code> or{" "}
              <code>%BRD-1.02</code>); this app decrypts them the same way as the legacy
              Java reader.
            </li>
            <li>
              Changing &quot;File units&quot; in the sidebar does not rescale numbers in
              the file — it only changes how values are labeled, matching classic{" "}
              <code>.brd</code> semantics.
            </li>
          </ul>
          <p className="modal-dialog__hint">
            For implementers: the complete field reference lives at{" "}
            <code>docs/BRD_FILE_FORMAT.md</code> in the project checkout.
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
