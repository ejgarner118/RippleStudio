import { useRef, useState } from "react";
import { useModalA11y } from "../hooks/useModalA11y";

export type NewBoardPreset =
  | "standard"
  | "shortboard"
  | "fish"
  | "longboard"
  | "empty_advanced"
  | "empty_guided";

type NewBoardModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (preset: NewBoardPreset) => void | Promise<void>;
};

const TEMPLATE_OPTIONS: { id: NewBoardPreset; label: string; hint: string }[] = [
  { id: "standard", label: "Standard", hint: "Balanced baseline template." },
  { id: "shortboard", label: "Shortboard", hint: "Shorter, narrower, more rocker." },
  { id: "fish", label: "Fish", hint: "Short and wider with fuller middle." },
  { id: "longboard", label: "Longboard", hint: "Longer and flatter glide profile." },
];

const BLANK_OPTIONS: { id: NewBoardPreset; label: string; hint: string }[] = [
  {
    id: "empty_guided",
    label: "Blank — guided setup",
    hint: "Minimal board with step-by-step hints (outline → profile → sections).",
  },
  {
    id: "empty_advanced",
    label: "Blank — advanced",
    hint: "Empty geometry and full tools; no walkthrough.",
  },
];

export function NewBoardModal({ open, onClose, onCreate }: NewBoardModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [preset, setPreset] = useState<NewBoardPreset>("standard");
  const [isBusy, setIsBusy] = useState(false);
  const { dialogRef } = useModalA11y({ open, onClose, initialFocusRef: closeBtnRef });

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => (!isBusy ? onClose() : null)}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-board-title"
        className="modal-dialog modal-dialog--wide"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-dialog__header">
          <h2 id="new-board-title" className="modal-dialog__title">
            New board
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="modal-dialog__close icon-btn"
            onClick={onClose}
            aria-label="Close"
            disabled={isBusy}
          >
            ×
          </button>
        </div>
        <div className="modal-dialog__body">
          <p className="modal-dialog__hint">
            Start from a template, or choose a blank board and build every curve yourself. You can
            always add control points, profiles, and cross-sections from the sidebar.
          </p>
          <p className="modal-dialog__hint modal-dialog__hint--strong">Templates</p>
          <div className="export-format-list" role="radiogroup" aria-label="Board template">
            {TEMPLATE_OPTIONS.map((o) => (
              <label key={o.id} className="export-format-row">
                <input
                  type="radio"
                  name="new-board-preset"
                  checked={preset === o.id}
                  onChange={() => setPreset(o.id)}
                  disabled={isBusy}
                />
                <span className="export-format-row__text">
                  <span className="export-format-row__label">{o.label}</span>
                  <span className="export-format-row__hint">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="modal-dialog__hint modal-dialog__hint--strong">Start from nothing</p>
          <div className="export-format-list" role="radiogroup" aria-label="Blank board options">
            {BLANK_OPTIONS.map((o) => (
              <label key={o.id} className="export-format-row">
                <input
                  type="radio"
                  name="new-board-preset"
                  checked={preset === o.id}
                  onChange={() => setPreset(o.id)}
                  disabled={isBusy}
                />
                <span className="export-format-row__text">
                  <span className="export-format-row__label">{o.label}</span>
                  <span className="export-format-row__hint">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="modal-dialog__footer modal-dialog__footer--split">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={isBusy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={isBusy}
            onClick={async () => {
              setIsBusy(true);
              try {
                await onCreate(preset);
              } finally {
                setIsBusy(false);
              }
            }}
          >
            {isBusy ? "Creating..." : "Create board"}
          </button>
        </div>
      </div>
    </div>
  );
}
