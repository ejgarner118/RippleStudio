import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { BezierBoard } from "@boardcad/core";
import type { HandleMode } from "@boardcad/core";
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
  onDuplicateSection: () => void;
  onInterpolateSection: () => void;
  onMoveSectionEarlier: () => void;
  onMoveSectionLater: () => void;
  onAddSectionTemplate: (template: "current" | "soft" | "hard") => void;
  selectedControlPoint: number | null;
  onAddControlPoint: () => void;
  onRemoveControlPoint: () => void;
  canRemoveControlPoint: boolean;
  onToggleContinuity: () => void;
  selectedHandleMode: HandleMode | null;
  onSetHandleMode: (mode: HandleMode) => void;
  onResetCurrentSpline: () => void;
  validationIssues: string[];
  onFixSectionOrder: () => void;
  onApplyProfileShaping: (v: {
    noseRocker: number;
    tailRocker: number;
    maxThickness: number;
    maxThicknessPosPct: number;
  }) => void;
  onAddPairedProfilePoint: () => void;
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
  onDuplicateSection,
  onInterpolateSection,
  onMoveSectionEarlier,
  onMoveSectionLater,
  onAddSectionTemplate,
  selectedControlPoint,
  onAddControlPoint,
  onRemoveControlPoint,
  canRemoveControlPoint,
  onToggleContinuity,
  selectedHandleMode,
  onSetHandleMode,
  onResetCurrentSpline,
  validationIssues,
  onFixSectionOrder,
  onApplyProfileShaping,
  onAddPairedProfilePoint,
  onMetadataChange,
  onUnitsChange,
}: AppSidebarProps) {
  const cs = brd.crossSections[sectionIndex];
  const unitLabel = boardUnitsLabel(brd);
  const [noseRocker, setNoseRocker] = useState(9);
  const [tailRocker, setTailRocker] = useState(7);
  const [maxThickness, setMaxThickness] = useState(4);
  const [maxThicknessPosPct, setMaxThicknessPosPct] = useState(50);

  return (
    <aside className="sidebar" aria-label="View options and board info">
      <details className="sidebar-section" open>
        <summary className="sidebar-section__summary">Edit</summary>
        <div className="sidebar-section__body">
          <p className="sidebar-hint">
            Pick a spline, select a point in canvas, then apply an action.
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
          <p className="sidebar-hint">
            Selection: {selectedControlPoint == null ? "none" : `#${selectedControlPoint + 1}`}
          </p>
          <div className="sidebar-actions">
            <button type="button" className="btn btn--sm btn--primary" onClick={onAddControlPoint}>
              Insert point
              <span className="shortcut-badge">A</span>
            </button>
            <button
              type="button"
              className="btn btn--sm"
              onClick={onRemoveControlPoint}
              disabled={!canRemoveControlPoint}
            >
              Remove point
              <span className="shortcut-badge">Del</span>
            </button>
            <button type="button" className="btn btn--sm btn--subtle" onClick={onToggleContinuity}>
              Cycle handle mode
              <span className="shortcut-badge">C</span>
            </button>
            <button type="button" className="btn btn--sm btn--subtle" onClick={onResetCurrentSpline}>
              Reset current spline
            </button>
          </div>
          <div className="sidebar-actions">
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => onSetHandleMode("independent")}
            >
              Independent
            </button>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => onSetHandleMode("aligned")}
            >
              Aligned
            </button>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => onSetHandleMode("mirrored")}
            >
              Mirrored
            </button>
          </div>
          <p className="sidebar-hint">
            Handle mode: {selectedHandleMode ?? "none selected"} (Alt+drag temporarily breaks linkage).
          </p>
        </div>
      </details>

      <details className="sidebar-section">
        <summary className="sidebar-section__summary">View</summary>
        <div className="sidebar-section__body">
          <p className="sidebar-hint">Show only what you need while editing.</p>
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

      <details className="sidebar-section">
        <summary className="sidebar-section__summary">Profile view</summary>
        <div className="sidebar-section__body">
          <p className="sidebar-hint">Toggle deck and bottom curves in profile view.</p>
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

      <details className="sidebar-section">
        <summary className="sidebar-section__summary">3D</summary>
        <div className="sidebar-section__body">
          <p className="sidebar-hint">Enable or hide loft mesh.</p>
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
        <summary className="sidebar-section__summary">Sections</summary>
        <div className="sidebar-section__body">
          {brd.crossSections.length === 0 ? (
            <>
              <p className="sidebar-hint">No sections in this file.</p>
                <button type="button" className="btn btn--primary btn--sm" onClick={onAddSection}>
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
                    <span className="sidebar-field__label">Station along board length</span>
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
                <button type="button" className="btn btn--sm btn--primary" onClick={onAddSection}>
                  Add section
                </button>
                <button type="button" className="btn btn--sm btn--subtle" onClick={onDuplicateSection}>
                  Duplicate
                </button>
                <button type="button" className="btn btn--sm btn--subtle" onClick={onInterpolateSection}>
                  Interpolate
                </button>
                <button type="button" className="btn btn--sm btn--subtle" onClick={onRemoveSection}>
                  Remove section
                </button>
                <button type="button" className="btn btn--sm btn--subtle" onClick={onMoveSectionEarlier}>
                  Reorder earlier
                </button>
                <button type="button" className="btn btn--sm btn--subtle" onClick={onMoveSectionLater}>
                  Reorder later
                </button>
              </div>
              <label className="sidebar-field">
                <span className="sidebar-field__label">Add from template</span>
                <div className="sidebar-actions">
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => onAddSectionTemplate("current")}
                  >
                    Current
                  </button>
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => onAddSectionTemplate("soft")}
                  >
                    Soft rail
                  </button>
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => onAddSectionTemplate("hard")}
                  >
                    Hard rail
                  </button>
                </div>
              </label>
            </>
          )}
        </div>
      </details>

      <details className="sidebar-section">
        <summary className="sidebar-section__summary">Validate</summary>
        <div className="sidebar-section__body">
          {validationIssues.length === 0 ? (
            <p className="sidebar-hint">No blocking geometry issues detected.</p>
          ) : (
            <>
              <ul className="help-list">
                {validationIssues.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
              <div className="sidebar-actions">
                <button type="button" className="btn btn--sm btn--primary" onClick={onFixSectionOrder}>
                  Sort sections by station
                </button>
                <button type="button" className="btn btn--sm btn--subtle" onClick={onResetCurrentSpline}>
                  Reset current spline
                </button>
              </div>
            </>
          )}
        </div>
      </details>

      <details className="sidebar-section">
        <summary className="sidebar-section__summary">Profile shaping</summary>
        <div className="sidebar-section__body">
          <p className="sidebar-hint">
            Quick rocker/thickness baseline for profile editing.
          </p>
          <label className="sidebar-field">
            <span className="sidebar-field__label">Nose rocker</span>
            <input
              type="number"
              step="0.5"
              className="sidebar-field__input"
              value={noseRocker}
              onChange={(e) => setNoseRocker(Number(e.target.value))}
            />
          </label>
          <label className="sidebar-field">
            <span className="sidebar-field__label">Tail rocker</span>
            <input
              type="number"
              step="0.5"
              className="sidebar-field__input"
              value={tailRocker}
              onChange={(e) => setTailRocker(Number(e.target.value))}
            />
          </label>
          <label className="sidebar-field">
            <span className="sidebar-field__label">Max thickness</span>
            <input
              type="number"
              step="0.5"
              className="sidebar-field__input"
              value={maxThickness}
              onChange={(e) => setMaxThickness(Number(e.target.value))}
            />
          </label>
          <label className="sidebar-field">
            <span className="sidebar-field__label">Max thickness @ % length</span>
            <input
              type="number"
              min={10}
              max={90}
              step="1"
              className="sidebar-field__input"
              value={maxThicknessPosPct}
              onChange={(e) => setMaxThicknessPosPct(Number(e.target.value))}
            />
          </label>
          <div className="sidebar-actions">
            <button
              type="button"
              className="btn btn--sm btn--primary"
              onClick={() =>
                onApplyProfileShaping({
                  noseRocker,
                  tailRocker,
                  maxThickness,
                  maxThicknessPosPct,
                })
              }
            >
              Apply profile shape
            </button>
            <button type="button" className="btn btn--sm btn--subtle" onClick={onAddPairedProfilePoint}>
              Add paired profile point
            </button>
          </div>
        </div>
      </details>

      <details className="sidebar-section">
        <summary className="sidebar-section__summary">Board settings</summary>
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

      <details className="sidebar-section">
        <summary className="sidebar-section__summary">File units</summary>
        <div className="sidebar-section__body">
          <p className="sidebar-hint" id="units-hint">
            Changing units does not rescale geometry values.
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
