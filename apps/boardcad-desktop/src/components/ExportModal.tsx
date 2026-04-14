import { useRef, useState } from "react";
import { useModalA11y } from "../hooks/useModalA11y";

export type DesktopExportFormat =
  | "stl-binary"
  | "stl-ascii"
  | "obj"
  | "svg-outline"
  | "svg-profile"
  | "svg-spec";

type ExportModalProps = {
  open: boolean;
  onClose: () => void;
  onExport: (format: DesktopExportFormat) => void | Promise<void>;
};

const FORMATS: { id: DesktopExportFormat; label: string; hint: string }[] = [
  { id: "stl-binary", label: "STL (binary)", hint: "3D mesh, compact" },
  { id: "stl-ascii", label: "STL (ASCII)", hint: "3D mesh, human-readable" },
  { id: "obj", label: "Wavefront OBJ", hint: "3D mesh with vertices and faces" },
  { id: "svg-outline", label: "SVG — outline", hint: "Plan half-outline print" },
  { id: "svg-profile", label: "SVG — profile", hint: "Deck / bottom side view" },
  { id: "svg-spec", label: "SVG — spec sheet", hint: "Summary dimensions (file units)" },
];

export function ExportModal({ open, onClose, onExport }: ExportModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [format, setFormat] = useState<DesktopExportFormat>("stl-binary");
  const [isBusy, setIsBusy] = useState(false);
  const { dialogRef } = useModalA11y({ open, onClose, initialFocusRef: closeBtnRef });

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => (!isBusy ? onClose() : null)}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        className="modal-dialog modal-dialog--wide"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-dialog__header">
          <h2 id="export-title" className="modal-dialog__title">
            Export
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
          <p className="modal-dialog__hint" id="export-units-hint">
            Mesh and dimension values use the board&apos;s file units (see sidebar
            &quot;File units&quot;). STL/OBJ use the same axis convention as the 3D
            loft preview.
          </p>
          <fieldset className="export-fieldset" aria-describedby="export-units-hint">
            <legend className="visually-hidden">Export format</legend>
            <div className="export-format-list" role="radiogroup" aria-label="Format">
              {FORMATS.map((f) => (
                <label key={f.id} className="export-format-row">
                  <input
                    type="radio"
                    name="export-format"
                    value={f.id}
                    checked={format === f.id}
                    onChange={() => setFormat(f.id)}
                    disabled={isBusy}
                  />
                  <span className="export-format-row__text">
                    <span className="export-format-row__label">{f.label}</span>
                    <span className="export-format-row__hint">{f.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
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
                await onExport(format);
              } finally {
                setIsBusy(false);
              }
            }}
          >
            {isBusy ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}
