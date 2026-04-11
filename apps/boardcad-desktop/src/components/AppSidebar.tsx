import type { Dispatch, SetStateAction } from "react";
import type { BezierBoard } from "@boardcad/core";
import type { OverlayState } from "../types/overlays";
import type { BoardEditMode } from "../types/editMode";
import { boardUnitsLabel } from "../lib/unitLabel";

type AppSidebarProps = {
  brd: BezierBoard;
  overlays: OverlayState;
  setOverlays: Dispatch<SetStateAction<OverlayState>>;
  sectionIndex: number;
  setSectionIndex: (i: number) => void;
  editMode: BoardEditMode;
  setEditMode: (m: BoardEditMode) => void;
  onAddSection: () => void;
  onRemoveSection: () => void;
  onSetSectionStation: (pos: number) => void;
  onMetadataChange: (
    patch: Partial<Pick<BezierBoard, "name" | "designer" | "comments" | "author">>,
  ) => void;
  onUnitsChange: (units: number) => void;
};

export function AppSidebar({
  brd,
  overlays,
  setOverlays,
  sectionIndex,
  setSectionIndex,
  editMode,
  setEditMode,
  onAddSection,
  onRemoveSection,
  onSetSectionStation,
  onMetadataChange,
  onUnitsChange,
}: AppSidebarProps) {
  const cs = brd.crossSections[sectionIndex];
  const unitLabel = boardUnitsLabel(brd);

  return (
    <aside className="sidebar" aria-label="View options and board info">
      <details className="sidebar-section" open>
        <summary className="sidebar-section__summary">Edit</summary>
        <div className="sidebar-section__body">
          <p className="sidebar-hint">
            Choose which spline responds to dragging control points on the 2D
            canvases (outline on plan, deck/bottom on profile, section on
            cross-section view).
          </p>
          <label className="sidebar-field">
            <span className="sidebar-field__label">Spline</span>
            <select
              value={editMode}
              onChange={(e) => setEditMode(e.target.value as BoardEditMode)}
              aria-label="Spline edit target"
            >
              <option value="outline">Outline (plan)</option>
              <option value="deck">Deck (profile)</option>
              <option value="bottom">Bottom (profile)</option>
              <option value="section">Cross-section</option>
            </select>
          </label>
        </div>
      </details>

      <details className="sidebar-section" open>
        <summary className="sidebar-section__summary">Plan view</summary>
        <div className="sidebar-section__body">
          <p className="sidebar-hint">
            Half-outline from the file plus mirrored rail (classic outline print); guide
            points are optional aids from the file.
          </p>
          <label className="chk">
            <input
              type="checkbox"
              checked={overlays.grid}
              onChange={(e) =>
                setOverlays((o) => ({ ...o, grid: e.target.checked }))
              }
            />
            Grid
          </label>
          <label className="chk">
            <input
              type="checkbox"
              checked={overlays.controlPoints}
              onChange={(e) =>
                setOverlays((o) => ({ ...o, controlPoints: e.target.checked }))
              }
            />
            Control points
          </label>
          <label className="chk">
            <input
              type="checkbox"
              checked={overlays.guidePoints}
              onChange={(e) =>
                setOverlays((o) => ({ ...o, guidePoints: e.target.checked }))
              }
            />
            Guide points
          </label>
          <label className="chk">
            <input
              type="checkbox"
              checked={overlays.ghost}
              onChange={(e) =>
                setOverlays((o) => ({ ...o, ghost: e.target.checked }))
              }
            />
            Ghost outline
          </label>
        </div>
      </details>

      <details className="sidebar-section" open>
        <summary className="sidebar-section__summary">Profile (rocker)</summary>
        <div className="sidebar-section__body">
          <p className="sidebar-hint">
            Deck and bottom curves use board length on the horizontal axis and
            rocker height on the vertical axis (side view), not the plan view.
          </p>
          <label className="chk">
            <input
              type="checkbox"
              checked={overlays.profileDeck}
              onChange={(e) =>
                setOverlays((o) => ({ ...o, profileDeck: e.target.checked }))
              }
            />
            Deck
          </label>
          <label className="chk">
            <input
              type="checkbox"
              checked={overlays.profileBottom}
              onChange={(e) =>
                setOverlays((o) => ({ ...o, profileBottom: e.target.checked }))
              }
            />
            Bottom
          </label>
        </div>
      </details>

      <details className="sidebar-section" open>
        <summary className="sidebar-section__summary">3D</summary>
        <div className="sidebar-section__body">
          <p className="sidebar-hint">
            Loft needs at least two drawable cross-sections. Geometry uses real
            file units with a uniform scene scale.
          </p>
          <label className="chk">
            <input
              type="checkbox"
              checked={overlays.loft3d}
              onChange={(e) =>
                setOverlays((o) => ({ ...o, loft3d: e.target.checked }))
              }
            />
            Show loft mesh
          </label>
        </div>
      </details>

      <details className="sidebar-section" open>
        <summary className="sidebar-section__summary">Cross-section</summary>
        <div className="sidebar-section__body">
          {brd.crossSections.length === 0 ? (
            <>
              <p className="sidebar-hint">No sections in this file.</p>
              <button type="button" className="btn btn--ghost btn--sm" onClick={onAddSection}>
                Add section
              </button>
            </>
          ) : (
            <>
              <label className="visually-hidden" htmlFor="secsel">
                Station
              </label>
              <select
                id="secsel"
                value={sectionIndex}
                onChange={(e) => setSectionIndex(Number(e.target.value))}
                aria-label="Cross-section station"
              >
                {brd.crossSections.map((c, i) => (
                  <option key={i} value={i}>
                    #{i + 1} @ {c.getPosition()}
                  </option>
                ))}
              </select>
              {cs ? (
                <>
                  <p className="sidebar-hint">
                    {cs.getBezierSpline().getNrOfControlPoints()} control points in
                    this section.
                  </p>
                  <label className="sidebar-field">
                    <span className="sidebar-field__label">Station (length)</span>
                    <input
                      key={`${sectionIndex}-${cs.getPosition()}`}
                      type="number"
                      step="any"
                      className="sidebar-field__input"
                      defaultValue={cs.getPosition()}
                      aria-label="Cross-section station along length"
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isFinite(v)) return;
                        onSetSectionStation(v);
                      }}
                    />
                  </label>
                </>
              ) : null}
              <div className="sidebar-actions">
                <button type="button" className="btn btn--sm" onClick={onAddSection}>
                  Add section
                </button>
                <button type="button" className="btn btn--sm" onClick={onRemoveSection}>
                  Remove section
                </button>
              </div>
            </>
          )}
        </div>
      </details>

      <details className="sidebar-section" open>
        <summary className="sidebar-section__summary">Board metadata</summary>
        <div className="sidebar-section__body">
          <label className="sidebar-field">
            <span className="sidebar-field__label">Name</span>
            <input
              className="sidebar-field__input"
              value={brd.name}
              onChange={(e) => onMetadataChange({ name: e.target.value })}
              aria-label="Board name"
            />
          </label>
          <label className="sidebar-field">
            <span className="sidebar-field__label">Designer</span>
            <input
              className="sidebar-field__input"
              value={brd.designer}
              onChange={(e) => onMetadataChange({ designer: e.target.value })}
              aria-label="Designer"
            />
          </label>
          <label className="sidebar-field">
            <span className="sidebar-field__label">Author</span>
            <input
              className="sidebar-field__input"
              value={brd.author}
              onChange={(e) => onMetadataChange({ author: e.target.value })}
              aria-label="Author"
            />
          </label>
          <label className="sidebar-field">
            <span className="sidebar-field__label">Comments</span>
            <textarea
              className="sidebar-field__textarea"
              rows={3}
              value={brd.comments}
              onChange={(e) => onMetadataChange({ comments: e.target.value })}
              aria-label="Comments"
            />
          </label>
        </div>
      </details>

      <details className="sidebar-section" open>
        <summary className="sidebar-section__summary">Units</summary>
        <div className="sidebar-section__body">
          <p className="sidebar-hint" id="units-hint">
            Stored as a unit code in the .brd file. Changing this does not scale
            existing numbers—classic <code>.brd</code> semantics. Exports and dimensions use
            these file units as-is.
          </p>
          <label className="sidebar-field">
            <span className="sidebar-field__label">File units</span>
            <select
              value={brd.currentUnits}
              onChange={(e) => onUnitsChange(Number(e.target.value))}
              aria-label="File units"
              aria-describedby="units-hint"
            >
              <option value={0}>Millimeters</option>
              <option value={1}>Centimeters</option>
              <option value={2}>Inches</option>
            </select>
          </label>
        </div>
      </details>

      <dl className="meta">
        <dt>Name</dt>
        <dd>{brd.name || "—"}</dd>
        <dt>Units</dt>
        <dd>{unitLabel}</dd>
        <dt>Outline CPs</dt>
        <dd>{brd.outline.getNrOfControlPoints()}</dd>
        <dt>Cross-sections</dt>
        <dd>{brd.crossSections.length}</dd>
      </dl>
    </aside>
  );
}
