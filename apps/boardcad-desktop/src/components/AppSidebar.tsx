import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { BezierBoard } from "@boardcad/core";
import type { HandleMode } from "@boardcad/core";
import type { OverlayState } from "../types/overlays";
import type { BoardEditMode } from "../types/editMode";
import type { ReferenceImageLayer, ReferenceImageState } from "../types/referenceImage";
import { boardUnitsLabel } from "../lib/unitLabel";
import { formatBoardCoordinate } from "../lib/unitDisplay";

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
  onAddSectionFromCurrentTemplate: () => void;
  onSoftenRail: () => void;
  onHardenRail: () => void;
  referenceImages: ReferenceImageState;
  onPickPlanReferenceImage: () => void;
  onPickProfileReferenceImage: () => void;
  onClearPlanReferenceImage: () => void;
  onClearProfileReferenceImage: () => void;
  onPatchPlanReference: (patch: Partial<ReferenceImageLayer>) => void;
  onPatchProfileReference: (patch: Partial<ReferenceImageLayer>) => void;
  selectedControlPoint: number | null;
  selectedControlPointKind: "end" | "prev" | "next" | null;
  selectedPointCoords: { x: number; y: number } | null;
  onSetSelectedPointCoords: (next: { x: number; y: number }) => void;
  onAddControlPoint: () => void;
  onRemoveControlPoint: () => void;
  canRemoveControlPoint: boolean;
  onToggleContinuity: () => void;
  selectedHandleMode: HandleMode | null;
  onSetHandleMode: (mode: HandleMode) => void;
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
  onAddSectionFromCurrentTemplate,
  onSoftenRail,
  onHardenRail,
  referenceImages,
  onPickPlanReferenceImage,
  onPickProfileReferenceImage,
  onClearPlanReferenceImage,
  onClearProfileReferenceImage,
  onPatchPlanReference,
  onPatchProfileReference,
  selectedControlPoint,
  selectedControlPointKind,
  selectedPointCoords,
  onSetSelectedPointCoords,
  onAddControlPoint,
  onRemoveControlPoint,
  canRemoveControlPoint,
  onToggleContinuity,
  selectedHandleMode,
  onSetHandleMode,
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
  const [coordDraft, setCoordDraft] = useState<{ x: string; y: string }>({ x: "", y: "" });

  useEffect(() => {
    setCoordDraft({ x: "", y: "" });
  }, [selectedControlPoint, selectedControlPointKind, editMode, sectionIndex]);

  const scrollToEdit = () => {
    const el = document.getElementById("sidebar-edit") as HTMLDetailsElement | null;
    if (el) el.open = true;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const coordPlaceholder = (v: number) => formatBoardCoordinate(v, brd.currentUnits);

  return (
    <aside className="sidebar" aria-label="View options and board info">
      <div className="sidebar__scroll">
        <div className="sidebar__sticky-head">
          <details className="sidebar-section" id="sidebar-edit" open>
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
                Selection:{" "}
                {selectedControlPoint == null
                  ? "none"
                  : `#${selectedControlPoint + 1} (${selectedControlPointKind ?? "end"})`}
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
              <label className="sidebar-field">
                <span className="sidebar-field__label">
                  Selected point (X, Y) in {unitLabel}
                </span>
                {editMode === "outline" ? (
                  <p className="sidebar-hint">Outline Y is stored on one side and mirrored across centerline.</p>
                ) : null}
                <div className="sidebar-actions">
                  <input
                    className="sidebar-field__input"
                    type="number"
                    step="any"
                    value={coordDraft.x}
                    placeholder={
                      selectedPointCoords ? coordPlaceholder(selectedPointCoords.x) : "X"
                    }
                    disabled={selectedPointCoords == null}
                    aria-label="Selected point X"
                    onChange={(e) => setCoordDraft((d) => ({ ...d, x: e.target.value }))}
                  />
                  <input
                    className="sidebar-field__input"
                    type="number"
                    step="any"
                    value={coordDraft.y}
                    placeholder={
                      selectedPointCoords ? coordPlaceholder(selectedPointCoords.y) : "Y"
                    }
                    disabled={selectedPointCoords == null}
                    aria-label="Selected point Y"
                    onChange={(e) => setCoordDraft((d) => ({ ...d, y: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="btn btn--sm btn--primary"
                    disabled={selectedPointCoords == null}
                    onClick={() => {
                      const fallback = selectedPointCoords ?? { x: 0, y: 0 };
                      const x = coordDraft.x.trim() === "" ? fallback.x : Number(coordDraft.x);
                      const y = coordDraft.y.trim() === "" ? fallback.y : Number(coordDraft.y);
                      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
                      onSetSelectedPointCoords({ x, y });
                      setCoordDraft({ x: "", y: "" });
                    }}
                  >
                    Apply coordinates
                  </button>
                </div>
              </label>
            </div>
          </details>
        </div>

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
              Dim outline trace
            </label>
            <p className="sidebar-hint">
              Reference images sit under splines (tail = smaller X, nose = larger X). Flip if your photo is reversed.
            </p>
            <div className="sidebar-actions">
              <button type="button" className="btn btn--sm btn--primary" onClick={onPickPlanReferenceImage}>
                Plan image…
              </button>
              <button type="button" className="btn btn--sm btn--subtle" onClick={onClearPlanReferenceImage}>
                Clear plan
              </button>
            </div>
            <label className="chk">
              <input
                type="checkbox"
                checked={referenceImages.plan.enabled}
                onChange={(e) => onPatchPlanReference({ enabled: e.target.checked })}
                disabled={!referenceImages.plan.objectUrl}
              />
              Show plan reference
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Plan opacity</span>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.01}
                value={referenceImages.plan.opacity}
                onChange={(e) => onPatchPlanReference({ opacity: Number(e.target.value) })}
                disabled={!referenceImages.plan.objectUrl}
              />
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Plan scale</span>
              <input
                type="range"
                min={0.25}
                max={3}
                step={0.02}
                value={referenceImages.plan.scale}
                onChange={(e) => onPatchPlanReference({ scale: Number(e.target.value) })}
                disabled={!referenceImages.plan.objectUrl}
              />
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Plan offset X</span>
              <input
                type="range"
                min={-0.5}
                max={0.5}
                step={0.01}
                value={referenceImages.plan.offsetNormX}
                onChange={(e) => onPatchPlanReference({ offsetNormX: Number(e.target.value) })}
                disabled={!referenceImages.plan.objectUrl}
              />
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Plan offset Y</span>
              <input
                type="range"
                min={-0.5}
                max={0.5}
                step={0.01}
                value={referenceImages.plan.offsetNormY}
                onChange={(e) => onPatchPlanReference({ offsetNormY: Number(e.target.value) })}
                disabled={!referenceImages.plan.objectUrl}
              />
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Plan rotation (°)</span>
              <input
                type="range"
                min={-180}
                max={180}
                step={0.5}
                value={referenceImages.plan.rotationDeg ?? 0}
                onChange={(e) => onPatchPlanReference({ rotationDeg: Number(e.target.value) })}
                disabled={!referenceImages.plan.objectUrl}
              />
            </label>
            <label className="chk">
              <input
                type="checkbox"
                checked={referenceImages.plan.flipX}
                onChange={(e) => onPatchPlanReference({ flipX: e.target.checked })}
                disabled={!referenceImages.plan.objectUrl}
              />
              Flip plan image (mirror left/right)
            </label>
            <div className="sidebar-actions">
              <button type="button" className="btn btn--sm btn--primary" onClick={onPickProfileReferenceImage}>
                Profile image…
              </button>
              <button type="button" className="btn btn--sm btn--subtle" onClick={onClearProfileReferenceImage}>
                Clear profile
              </button>
            </div>
            <label className="chk">
              <input
                type="checkbox"
                checked={referenceImages.profile.enabled}
                onChange={(e) => onPatchProfileReference({ enabled: e.target.checked })}
                disabled={!referenceImages.profile.objectUrl}
              />
              Show profile reference
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Profile opacity</span>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.01}
                value={referenceImages.profile.opacity}
                onChange={(e) => onPatchProfileReference({ opacity: Number(e.target.value) })}
                disabled={!referenceImages.profile.objectUrl}
              />
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Profile scale</span>
              <input
                type="range"
                min={0.25}
                max={3}
                step={0.02}
                value={referenceImages.profile.scale}
                onChange={(e) => onPatchProfileReference({ scale: Number(e.target.value) })}
                disabled={!referenceImages.profile.objectUrl}
              />
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Profile offset X</span>
              <input
                type="range"
                min={-0.5}
                max={0.5}
                step={0.01}
                value={referenceImages.profile.offsetNormX}
                onChange={(e) => onPatchProfileReference({ offsetNormX: Number(e.target.value) })}
                disabled={!referenceImages.profile.objectUrl}
              />
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Profile offset Y</span>
              <input
                type="range"
                min={-0.5}
                max={0.5}
                step={0.01}
                value={referenceImages.profile.offsetNormY}
                onChange={(e) => onPatchProfileReference({ offsetNormY: Number(e.target.value) })}
                disabled={!referenceImages.profile.objectUrl}
              />
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Profile rotation (°)</span>
              <input
                type="range"
                min={-180}
                max={180}
                step={0.5}
                value={referenceImages.profile.rotationDeg ?? 0}
                onChange={(e) => onPatchProfileReference({ rotationDeg: Number(e.target.value) })}
                disabled={!referenceImages.profile.objectUrl}
              />
            </label>
            <label className="chk">
              <input
                type="checkbox"
                checked={referenceImages.profile.flipX}
                onChange={(e) => onPatchProfileReference({ flipX: e.target.checked })}
                disabled={!referenceImages.profile.objectUrl}
              />
              Flip profile image
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
                <div className="sidebar-actions">
                  <button type="button" className="btn btn--sm" onClick={onAddSectionFromCurrentTemplate}>
                    Add section (from current board)
                  </button>
                </div>
                <p className="sidebar-hint">
                  Refine the selected section rail (undoable).
                </p>
                <div className="sidebar-actions">
                  <button type="button" className="btn btn--sm btn--primary" onClick={onSoftenRail}>
                    Soften rail
                  </button>
                  <button type="button" className="btn btn--sm btn--primary" onClick={onHardenRail}>
                    Harden rail
                  </button>
                </div>
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

        <div className="sidebar__footer-actions">
          <button type="button" className="btn btn--sm btn--subtle" onClick={scrollToEdit}>
            Edit controls
          </button>
        </div>

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
      </div>
    </aside>
  );
}
