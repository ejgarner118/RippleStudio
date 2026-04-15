import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { BezierBoard } from "@boardcad/core";
import type { HandleMode } from "@boardcad/core";
import type { OverlayState } from "../types/overlays";
import type { BoardEditMode } from "../types/editMode";
import type { ReferenceImageLayer, ReferenceImageState } from "../types/referenceImage";
import { boardUnitsLabel } from "../lib/unitLabel";
import { formatBoardCoordinate } from "../lib/unitDisplay";
import type { BoardDeltaMetrics, BoardMetrics, QaIssue, ToolpathPreview } from "@boardcad/core";
import type { ProjectRecord } from "../lib/projectLibrary";
import { SegmentedControl } from "./ui/SegmentedControl";

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
  comparisonDelta: BoardDeltaMetrics | null;
  analytics: BoardMetrics | null;
  onSetComparisonBaseline: () => void;
  onClearComparisonBaseline: () => void;
  onApplyAutoScale: (v: {
    lengthScale: number;
    widthScale: number;
    thicknessScale: number;
    lockTailWidth: boolean;
    lockNoseRocker: boolean;
    lockTailRocker: boolean;
  }) => void;
  projectLibrary: ProjectRecord[];
  activeProjectId: string | null;
  activeProject: ProjectRecord | null;
  onCreateProject: (name: string) => void;
  onAttachCurrentBoardToProject: (projectId: string) => void;
  onCreateSnapshot: (title: string) => void;
  onOpenProjectSnapshot: (projectId: string, snapshotId: string) => void;
  onProjectMetadataChange: (
    patch: { rider?: string; waveType?: string; autosaveEnabled?: boolean; autosaveIntervalSec?: number },
  ) => void;
  qaIssues: QaIssue[];
  finLayoutSummary: string;
  onApplyFinTemplate: (templateId: "fcs2_thruster" | "futures_thruster") => void;
  onMirrorFinLayout: () => void;
  onApplyFinAngles: (cantDeg: number, toeInDeg: number) => void;
  curvatureScore: number;
  railDiagnosticsText: string;
  onApplyRailApexTuck: (apexShiftRatio: number, tuckDepthRatio: number) => void;
  camPreview: ToolpathPreview | null;
  onGenerateCamPreview: () => void;
  boardMaterialColor: "sage" | "ocean" | "sand" | "charcoal";
  onBoardMaterialColorChange: (color: "sage" | "ocean" | "sand" | "charcoal") => void;
  meshPreviewMode: "interactivePreview" | "exportParity";
  onMeshPreviewModeChange: (mode: "interactivePreview" | "exportParity") => void;
  renderDebug: {
    flatShading: boolean;
    frontSideOnly: boolean;
    normalView: boolean;
    highPrecisionDepth: boolean;
  };
  onRenderDebugChange: (patch: Partial<{
    flatShading: boolean;
    frontSideOnly: boolean;
    normalView: boolean;
    highPrecisionDepth: boolean;
  }>) => void;
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
  comparisonDelta,
  analytics,
  onSetComparisonBaseline,
  onClearComparisonBaseline,
  onApplyAutoScale,
  projectLibrary,
  activeProjectId,
  activeProject,
  onCreateProject,
  onAttachCurrentBoardToProject,
  onCreateSnapshot,
  onOpenProjectSnapshot,
  onProjectMetadataChange,
  qaIssues,
  finLayoutSummary,
  onApplyFinTemplate,
  onMirrorFinLayout,
  onApplyFinAngles,
  curvatureScore,
  railDiagnosticsText,
  onApplyRailApexTuck,
  camPreview,
  onGenerateCamPreview,
  boardMaterialColor,
  onBoardMaterialColorChange,
  meshPreviewMode,
  onMeshPreviewModeChange,
  renderDebug,
  onRenderDebugChange,
}: AppSidebarProps) {
  const cs = brd.crossSections[sectionIndex];
  const unitLabel = boardUnitsLabel(brd);
  const [noseRocker, setNoseRocker] = useState(9);
  const [tailRocker, setTailRocker] = useState(7);
  const [maxThickness, setMaxThickness] = useState(4);
  const [maxThicknessPosPct, setMaxThicknessPosPct] = useState(50);
  const [coordDraft, setCoordDraft] = useState<{ x: string; y: string }>({ x: "", y: "" });
  const [projectNameDraft, setProjectNameDraft] = useState("");
  const [snapshotTitle, setSnapshotTitle] = useState("");
  const [projectRiderDraft, setProjectRiderDraft] = useState("");
  const [projectWaveDraft, setProjectWaveDraft] = useState("");
  const [openProjectIdDraft, setOpenProjectIdDraft] = useState("");
  const [openSnapshotIdDraft, setOpenSnapshotIdDraft] = useState("");
  const [scaleDraft, setScaleDraft] = useState({
    lengthScale: 1.08,
    widthScale: 1.04,
    thicknessScale: 1.03,
    lockTailWidth: false,
    lockNoseRocker: false,
    lockTailRocker: false,
  });
  const [finCantDraft, setFinCantDraft] = useState(6);
  const [finToeDraft, setFinToeDraft] = useState(2.5);
  const [apexShiftDraft, setApexShiftDraft] = useState(0);
  const [tuckDepthDraft, setTuckDepthDraft] = useState(0);
  const [focusArea, setFocusArea] = useState<"create" | "inspect" | "project" | "manufacture" | "display">("create");
  const [detailMode, setDetailMode] = useState<"basic" | "advanced">("basic");
  const scaleHasInvalidValue =
    !Number.isFinite(scaleDraft.lengthScale) ||
    !Number.isFinite(scaleDraft.widthScale) ||
    !Number.isFinite(scaleDraft.thicknessScale) ||
    scaleDraft.lengthScale <= 0 ||
    scaleDraft.widthScale <= 0 ||
    scaleDraft.thicknessScale <= 0;
  const qaErrorCount = qaIssues.filter((q) => q.severity === "error").length;
  const qaWarnCount = qaIssues.filter((q) => q.severity === "warn").length;
  const hasSectionSelected = Boolean(cs);

  useEffect(() => {
    setCoordDraft({ x: "", y: "" });
  }, [selectedControlPoint, selectedControlPointKind, editMode, sectionIndex]);

  useEffect(() => {
    setProjectRiderDraft(activeProject?.rider ?? "");
    setProjectWaveDraft(activeProject?.waveType ?? "");
  }, [activeProject?.id, activeProject?.rider, activeProject?.waveType]);

  useEffect(() => {
    if (!openProjectIdDraft && activeProject?.id) {
      setOpenProjectIdDraft(activeProject.id);
    }
  }, [activeProject?.id, openProjectIdDraft]);

  const openProject = projectLibrary.find((p) => p.id === openProjectIdDraft) ?? null;

  const coordPlaceholder = (v: number) => formatBoardCoordinate(v, brd.currentUnits);

  return (
    <aside className="sidebar" aria-label="View options and board info">
      <div className="sidebar__scroll">
        <div className="sidebar-ia-toolbar">
          <SegmentedControl
            ariaLabel="Workflow focus"
            value={focusArea}
            onChange={setFocusArea}
            options={[
              { id: "create", label: "Create" },
              { id: "inspect", label: "Inspect" },
              { id: "project", label: "Project" },
              { id: "manufacture", label: "Output" },
              { id: "display", label: "Display" },
            ]}
          />
          <SegmentedControl
            ariaLabel="Detail level"
            value={detailMode}
            onChange={setDetailMode}
            options={[
              { id: "basic", label: "Basic" },
              { id: "advanced", label: "Advanced" },
            ]}
          />
          <div className="sidebar-status-row" aria-live="polite">
            <span className={`sidebar-status-badge ${qaErrorCount > 0 ? "sidebar-status-badge--error" : "sidebar-status-badge--ok"}`}>
              QA {qaErrorCount > 0 ? `${qaErrorCount} errors` : "clear"}
            </span>
            <span className="sidebar-status-badge">
              {activeProject?.autosaveEnabled ? "Autosave on" : "Autosave off"}
            </span>
            {qaWarnCount > 0 ? <span className="sidebar-status-badge">Warnings {qaWarnCount}</span> : null}
          </div>
        </div>
        <div className="sidebar__sticky-head">
          {(focusArea === "create" || focusArea === "display") ? (
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
          ) : null}
        </div>

        {focusArea === "project" ? (
        <details className="sidebar-section">
          <summary className="sidebar-section__summary">Project library</summary>
          <div className="sidebar-section__body">
            <p className="sidebar-hint">Persistent projects, milestones, and snapshot history.</p>
            <p className="sidebar-hint">
              {activeProject
                ? `Active: ${activeProject.name} · ${activeProject.snapshots.length} snapshots`
                : "No active project selected."}
            </p>
            <label className="sidebar-field">
              <span className="sidebar-field__label">New project name</span>
              <input
                className="sidebar-field__input"
                value={projectNameDraft}
                onChange={(e) => setProjectNameDraft(e.target.value)}
              />
            </label>
            <div className="sidebar-actions">
              <button
                type="button"
                className="btn btn--sm btn--primary"
                onClick={() => {
                  onCreateProject(projectNameDraft);
                  setProjectNameDraft("");
                }}
              >
                Create project
              </button>
            </div>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Attach board to project</span>
              <select
                value={activeProjectId ?? ""}
                onChange={(e) => {
                  if (e.target.value) onAttachCurrentBoardToProject(e.target.value);
                }}
              >
                <option value="">Select project…</option>
                {projectLibrary.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.snapshots.length} snapshots)
                  </option>
                ))}
              </select>
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Snapshot title</span>
              <input
                className="sidebar-field__input"
                value={snapshotTitle}
                onChange={(e) => setSnapshotTitle(e.target.value)}
                placeholder="e.g. Step-up v2 rails"
              />
            </label>
            <button
              type="button"
              className="btn btn--sm btn--subtle"
              onClick={() => {
                onCreateSnapshot(snapshotTitle);
                setSnapshotTitle("");
              }}
              disabled={!activeProjectId}
            >
              Save snapshot
            </button>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Open project</span>
              <select
                value={openProjectIdDraft}
                onChange={(e) => {
                  setOpenProjectIdDraft(e.target.value);
                  setOpenSnapshotIdDraft("");
                }}
              >
                <option value="">Select project…</option>
                {projectLibrary.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Open snapshot</span>
              <select
                value={openSnapshotIdDraft}
                onChange={(e) => setOpenSnapshotIdDraft(e.target.value)}
                disabled={!openProject}
              >
                <option value="">Select snapshot…</option>
                {(openProject?.snapshots ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({new Date(s.createdAt).toLocaleString()})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn--sm btn--primary"
              disabled={!openProjectIdDraft || !openSnapshotIdDraft}
              onClick={() => {
                if (!openProjectIdDraft || !openSnapshotIdDraft) return;
                onOpenProjectSnapshot(openProjectIdDraft, openSnapshotIdDraft);
              }}
            >
              Open selected snapshot
            </button>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Rider</span>
              <input
                className="sidebar-field__input"
                value={projectRiderDraft}
                onChange={(e) => setProjectRiderDraft(e.target.value)}
                onBlur={() => onProjectMetadataChange({ rider: projectRiderDraft })}
                placeholder="Rider name"
              />
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Wave type</span>
              <input
                className="sidebar-field__input"
                value={projectWaveDraft}
                onChange={(e) => setProjectWaveDraft(e.target.value)}
                onBlur={() => onProjectMetadataChange({ waveType: projectWaveDraft })}
                placeholder="Beach break, point, etc."
              />
            </label>
            <div className="sidebar-actions">
              <label className="chk">
                <input
                  type="checkbox"
                  checked={activeProject?.autosaveEnabled ?? true}
                  onChange={(e) => onProjectMetadataChange({ autosaveEnabled: e.target.checked })}
                  disabled={!activeProject}
                />
                Autosave enabled
              </label>
              <input
                type="number"
                min={5}
                max={600}
                step={5}
                className="sidebar-field__input"
                value={activeProject?.autosaveIntervalSec ?? 30}
                disabled={!activeProject}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) onProjectMetadataChange({ autosaveIntervalSec: v });
                }}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) onProjectMetadataChange({ autosaveIntervalSec: v });
                }}
                aria-label="Autosave interval seconds"
              />
            </div>
            {activeProject?.lastAutosaveAt ? (
              <p className="sidebar-hint">
                Last autosave: {new Date(activeProject.lastAutosaveAt).toLocaleString()}
              </p>
            ) : null}
          </div>
        </details>
        ) : null}

        {(focusArea === "create" || (focusArea === "inspect" && detailMode === "advanced")) ? (
        <details className="sidebar-section">
          <summary className="sidebar-section__summary">Auto scaling</summary>
          <div className="sidebar-section__body">
            <p className="sidebar-hint">Scale with optional shape-preserving locks.</p>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Length scale</span>
              <input
                type="number"
                step="0.01"
                className="sidebar-field__input"
                value={scaleDraft.lengthScale}
                onChange={(e) => setScaleDraft((d) => ({ ...d, lengthScale: Number(e.target.value) }))}
              />
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Width scale</span>
              <input
                type="number"
                step="0.01"
                className="sidebar-field__input"
                value={scaleDraft.widthScale}
                onChange={(e) => setScaleDraft((d) => ({ ...d, widthScale: Number(e.target.value) }))}
              />
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Thickness scale</span>
              <input
                type="number"
                step="0.01"
                className="sidebar-field__input"
                value={scaleDraft.thicknessScale}
                onChange={(e) => setScaleDraft((d) => ({ ...d, thicknessScale: Number(e.target.value) }))}
              />
            </label>
            {scaleHasInvalidValue ? (
              <p className="sidebar-hint sidebar-hint--error">
                Scale values must be positive numbers greater than zero.
              </p>
            ) : (
              <p className="sidebar-hint">Tip: Start with 1.01-1.05 for subtle, production-safe adjustments.</p>
            )}
            <label className="chk">
              <input
                type="checkbox"
                checked={scaleDraft.lockTailWidth}
                onChange={(e) => setScaleDraft((d) => ({ ...d, lockTailWidth: e.target.checked }))}
              />
              Lock tail width
            </label>
            <label className="chk">
              <input
                type="checkbox"
                checked={scaleDraft.lockNoseRocker}
                onChange={(e) => setScaleDraft((d) => ({ ...d, lockNoseRocker: e.target.checked }))}
              />
              Lock nose rocker
            </label>
            <label className="chk">
              <input
                type="checkbox"
                checked={scaleDraft.lockTailRocker}
                onChange={(e) => setScaleDraft((d) => ({ ...d, lockTailRocker: e.target.checked }))}
              />
              Lock tail rocker
            </label>
            <button
              type="button"
              className="btn btn--sm btn--primary"
              onClick={() => onApplyAutoScale(scaleDraft)}
              disabled={scaleHasInvalidValue}
            >
              Apply auto-scale
            </button>
          </div>
        </details>
        ) : null}

        {focusArea === "inspect" ? (
        <details className="sidebar-section">
          <summary className="sidebar-section__summary">Compare and analytics</summary>
          <div className="sidebar-section__body">
            <div className="sidebar-actions">
              <button type="button" className="btn btn--sm btn--primary" onClick={onSetComparisonBaseline}>
                Set baseline
              </button>
              <button type="button" className="btn btn--sm btn--subtle" onClick={onClearComparisonBaseline}>
                Clear baseline
              </button>
            </div>
            {comparisonDelta ? (
              <ul className="help-list">
                <li>Length delta: {comparisonDelta.lengthDelta.toFixed(2)} mm</li>
                <li>Max width delta: {comparisonDelta.maxWidthDelta.toFixed(2)} mm</li>
                <li>Max thickness delta: {comparisonDelta.maxThicknessDelta.toFixed(2)} mm</li>
                <li>Volume delta: {comparisonDelta.volumeDeltaLiters.toFixed(3)} L</li>
              </ul>
            ) : (
              <p className="sidebar-hint">Set a baseline board to see ghost-style deltas.</p>
            )}
            {analytics ? (
              <ul className="help-list">
                <li>Approx volume: {analytics.approxVolumeLiters.toFixed(3)} L</li>
                <li>Center of buoyancy: X {analytics.centerOfBuoyancyX.toFixed(1)} mm</li>
                <li>Max width: {analytics.maxWidth.toFixed(1)} mm</li>
                <li>Max thickness: {analytics.maxThickness.toFixed(1)} mm</li>
              </ul>
            ) : null}
          </div>
        </details>
        ) : null}

        {(focusArea === "create" || (focusArea === "inspect" && detailMode === "advanced")) ? (
        <details className="sidebar-section">
          <summary className="sidebar-section__summary">Rail, fins, curvature</summary>
          <div className="sidebar-section__body">
            <p className="sidebar-hint">Advanced rail and placement helpers.</p>
            <p className="sidebar-hint">Curvature score: {curvatureScore.toFixed(3)}</p>
            <p className="sidebar-hint">{railDiagnosticsText}</p>
            <p className="sidebar-hint">Fin layout: {finLayoutSummary}</p>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Rail apex shift</span>
              <input
                type="number"
                step="0.05"
                min={-1}
                max={1}
                className="sidebar-field__input"
                value={apexShiftDraft}
                onChange={(e) => setApexShiftDraft(Number(e.target.value))}
              />
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Rail tuck depth adjust</span>
              <input
                type="number"
                step="0.05"
                min={-1}
                max={1}
                className="sidebar-field__input"
                value={tuckDepthDraft}
                onChange={(e) => setTuckDepthDraft(Number(e.target.value))}
              />
            </label>
            <div className="sidebar-actions">
              <button
                type="button"
                className="btn btn--sm btn--primary"
                onClick={() => onApplyRailApexTuck(apexShiftDraft, tuckDepthDraft)}
                disabled={!hasSectionSelected}
              >
                Apply rail apex/tuck
              </button>
              <button
                type="button"
                className="btn btn--sm btn--subtle"
                onClick={() => {
                  setApexShiftDraft(0);
                  setTuckDepthDraft(0);
                }}
              >
                Reset rail values
              </button>
            </div>
            {!hasSectionSelected ? (
              <p className="sidebar-hint sidebar-hint--error">
                Select a cross-section first to edit rail apex/tuck.
              </p>
            ) : null}
            <div className="sidebar-actions">
              <button
                type="button"
                className="btn btn--sm btn--subtle"
                onClick={() => onApplyFinTemplate("fcs2_thruster")}
              >
                FCS II thruster
              </button>
              <button
                type="button"
                className="btn btn--sm btn--subtle"
                onClick={() => onApplyFinTemplate("futures_thruster")}
              >
                Futures thruster
              </button>
              <button type="button" className="btn btn--sm btn--primary" onClick={onMirrorFinLayout}>
                Mirror fins
              </button>
            </div>
            <div className="sidebar-actions">
              <input
                type="number"
                step="0.1"
                className="sidebar-field__input"
                value={finCantDraft}
                onChange={(e) => setFinCantDraft(Number(e.target.value))}
                aria-label="Fin cant angle"
              />
              <input
                type="number"
                step="0.1"
                className="sidebar-field__input"
                value={finToeDraft}
                onChange={(e) => setFinToeDraft(Number(e.target.value))}
                aria-label="Fin toe-in angle"
              />
              <button
                type="button"
                className="btn btn--sm btn--subtle"
                onClick={() => onApplyFinAngles(finCantDraft, finToeDraft)}
              >
                Apply cant/toe-in
              </button>
              <button
                type="button"
                className="btn btn--sm btn--subtle"
                onClick={() => {
                  setFinCantDraft(6);
                  setFinToeDraft(2.5);
                }}
              >
                Reset fin angles
              </button>
            </div>
          </div>
        </details>
        ) : null}

        {(focusArea === "manufacture" || focusArea === "inspect") ? (
        <details className="sidebar-section">
          <summary className="sidebar-section__summary">CAM preview and QA</summary>
          <div className="sidebar-section__body">
            <div className="sidebar-actions">
              <button type="button" className="btn btn--sm btn--primary" onClick={onGenerateCamPreview}>
                Generate CAM preview
              </button>
            </div>
            {camPreview ? (
              <ul className="help-list">
                <li>Points: {camPreview.points.length}</li>
                <li>
                  Bounds X/Y/Z min: {camPreview.bounds.min.map((v) => v.toFixed(1)).join(", ")}
                </li>
                <li>
                  Bounds X/Y/Z max: {camPreview.bounds.max.map((v) => v.toFixed(1)).join(", ")}
                </li>
              </ul>
            ) : null}
            {qaIssues.length > 0 ? (
              <ul className="help-list">
                {qaIssues.map((q) => (
                  <li key={q.id}>
                    <strong>[{q.severity.toUpperCase()}]</strong> {q.message}
                    {q.hint ? <span> - {q.hint}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sidebar-hint">No QA issues detected by rule checks.</p>
            )}
          </div>
        </details>
        ) : null}

        {(focusArea === "display" || detailMode === "advanced") ? (
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
                max={8}
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
            <div className="sidebar-actions">
              {[-180, -90, 0, 90, 180].map((deg) => (
                <button
                  key={`plan-rot-${deg}`}
                  type="button"
                  className="btn btn--sm btn--subtle"
                  disabled={!referenceImages.plan.objectUrl}
                  onClick={() => onPatchPlanReference({ rotationDeg: deg })}
                >
                  {deg}°
                </button>
              ))}
            </div>
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
                max={8}
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
            <div className="sidebar-actions">
              {[-180, -90, 0, 90, 180].map((deg) => (
                <button
                  key={`profile-rot-${deg}`}
                  type="button"
                  className="btn btn--sm btn--subtle"
                  disabled={!referenceImages.profile.objectUrl}
                  onClick={() => onPatchProfileReference({ rotationDeg: deg })}
                >
                  {deg}°
                </button>
              ))}
            </div>
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
        ) : null}

        {(focusArea === "display" || detailMode === "advanced") ? (
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
        ) : null}

        {(focusArea === "display" || detailMode === "advanced") ? (
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
            <label className="sidebar-field">
              <span className="sidebar-field__label">Mesh preview mode</span>
              <select
                value={meshPreviewMode}
                onChange={(e) =>
                  onMeshPreviewModeChange(
                    e.target.value as "interactivePreview" | "exportParity",
                  )
                }
              >
                <option value="exportParity">Export parity</option>
                <option value="interactivePreview">Interactive preview</option>
              </select>
            </label>
            <label className="sidebar-field">
              <span className="sidebar-field__label">Board material color</span>
              <select
                value={boardMaterialColor}
                onChange={(e) =>
                  onBoardMaterialColorChange(e.target.value as "sage" | "ocean" | "sand" | "charcoal")
                }
              >
                <option value="sage">Sage</option>
                <option value="ocean">Ocean</option>
                <option value="sand">Sand</option>
                <option value="charcoal">Charcoal</option>
              </select>
            </label>
            <label className="chk">
              <input
                type="checkbox"
                checked={renderDebug.flatShading}
                onChange={(e) => onRenderDebugChange({ flatShading: e.target.checked })}
              />
              Flat shading
            </label>
            <label className="chk">
              <input
                type="checkbox"
                checked={renderDebug.frontSideOnly}
                onChange={(e) => onRenderDebugChange({ frontSideOnly: e.target.checked })}
              />
              Front faces only
            </label>
            <label className="chk">
              <input
                type="checkbox"
                checked={renderDebug.normalView}
                onChange={(e) => onRenderDebugChange({ normalView: e.target.checked })}
              />
              Normal debug material
            </label>
            <label className="chk">
              <input
                type="checkbox"
                checked={renderDebug.highPrecisionDepth}
                onChange={(e) =>
                  onRenderDebugChange({ highPrecisionDepth: e.target.checked })
                }
              />
              High precision depth buffer
            </label>
          </div>
        </details>
        ) : null}

        {(focusArea === "create" || detailMode === "advanced") ? (
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
        ) : null}

        {(focusArea === "inspect" || focusArea === "manufacture") ? (
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
        ) : null}

        {(focusArea === "create" || detailMode === "advanced") ? (
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
        ) : null}

        {(focusArea === "project" || detailMode === "advanced") ? (
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
        ) : null}

        {(focusArea === "project" || detailMode === "advanced") ? (
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
        ) : null}

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
