import { useCallback, useEffect, type ReactNode } from "react";
import type { BoardEditMode } from "../types/editMode";
import type { WorkflowFocusArea } from "../types/workflowFocus";
import { useWorkspaceTabs, type WorkspaceTab } from "../hooks/useWorkspaceTabs";
import { SegmentedControl } from "./ui/SegmentedControl";

function PanelChrome({
  title,
  hint,
  onResetView,
  resetLabel = "Reset view",
  headerActions,
  children,
}: {
  title: string;
  hint?: string;
  onResetView?: () => void;
  resetLabel?: string;
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <header className="panel__header">
        <div className="panel__header-main">
          <h2 className="panel__title">{title}</h2>
          {hint ? <p className="panel__hint">{hint}</p> : null}
        </div>
        {onResetView ? (
          <button
            type="button"
            className="btn btn--panel-reset"
            onClick={onResetView}
            title={resetLabel}
          >
            {resetLabel}
          </button>
        ) : null}
        {headerActions}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  );
}

type WorkspacePanelsProps = {
  focusArea: WorkflowFocusArea;
  canMutateBoard: boolean;
  editMode: BoardEditMode;
  onSetEditMode: (mode: BoardEditMode) => void;
  planCanvas: ReactNode;
  profileCanvas: ReactNode;
  sectionCanvas: ReactNode;
  threeCanvas: ReactNode;
  camPreviewCanvas?: ReactNode;
  onResetPlanView?: () => void;
  onResetProfileView?: () => void;
  onResetSectionView?: () => void;
  onReset3dView?: () => void;
  onResetCamPreviewView?: () => void;
  onActiveTabChange?: (tab: WorkspaceTab) => void;
};

export function WorkspacePanels({
  focusArea,
  canMutateBoard,
  editMode,
  onSetEditMode,
  planCanvas,
  profileCanvas,
  sectionCanvas,
  threeCanvas,
  camPreviewCanvas,
  onResetPlanView,
  onResetProfileView,
  onResetSectionView,
  onReset3dView,
  onResetCamPreviewView,
  onActiveTabChange,
}: WorkspacePanelsProps) {
  const { tabs, activeTab, setActiveTab } = useWorkspaceTabs({
    focusArea,
    editMode,
    camPreviewAvailable: Boolean(camPreviewCanvas),
  });

  useEffect(() => {
    onActiveTabChange?.(activeTab);
  }, [activeTab, onActiveTabChange]);

  const onTabChanged = useCallback((tab: WorkspaceTab) => {
    setActiveTab(tab);
    if (!canMutateBoard) return;
    if (tab === "plan") onSetEditMode("outline");
    if (tab === "profile" && editMode !== "deck" && editMode !== "bottom") onSetEditMode("deck");
    if (tab === "section") onSetEditMode("section");
  }, [setActiveTab, canMutateBoard, onSetEditMode, editMode]);

  return (
    <div className="workspace-compact workspace-panels">
      <div className="workspace-compact__switcher">
        <SegmentedControl
          ariaLabel="Workspace panel switcher"
          value={activeTab}
          onChange={onTabChanged}
          options={tabs}
        />
      </div>
      {activeTab === "plan" ? (
        <PanelChrome
          title="Plan"
          hint="Outline footprint."
          onResetView={onResetPlanView}
          resetLabel="Reset panel"
          headerActions={
            canMutateBoard ? (
              <button
                type="button"
                className={`btn btn--sm ${editMode === "outline" ? "btn--primary" : "btn--subtle"}`}
                onClick={() => onSetEditMode("outline")}
              >
                Outline edit
              </button>
            ) : undefined
          }
        >
          {planCanvas}
        </PanelChrome>
      ) : null}
      {activeTab === "profile" ? (
        <PanelChrome
          title="Profile"
          hint="Deck and bottom rocker."
          onResetView={onResetProfileView}
          resetLabel="Reset panel"
          headerActions={
            canMutateBoard ? (
              <div className="panel__header-actions">
                <button
                  type="button"
                  className={`btn btn--sm ${editMode === "deck" ? "btn--primary" : "btn--subtle"}`}
                  onClick={() => onSetEditMode("deck")}
                >
                  Deck
                </button>
                <button
                  type="button"
                  className={`btn btn--sm ${editMode === "bottom" ? "btn--primary" : "btn--subtle"}`}
                  onClick={() => onSetEditMode("bottom")}
                >
                  Bottom
                </button>
              </div>
            ) : undefined
          }
        >
          {profileCanvas}
        </PanelChrome>
      ) : null}
      {activeTab === "section" ? (
        <PanelChrome
          title="Cross-section"
          hint="Rail shape at selected station."
          onResetView={onResetSectionView}
          resetLabel="Reset panel"
          headerActions={
            canMutateBoard ? (
              <button
                type="button"
                className={`btn btn--sm ${editMode === "section" ? "btn--primary" : "btn--subtle"}`}
                onClick={() => onSetEditMode("section")}
              >
                Section edit
              </button>
            ) : undefined
          }
        >
          {sectionCanvas}
        </PanelChrome>
      ) : null}
      {activeTab === "three" ? (
        <PanelChrome
          title="3D preview"
          hint="Orbit, pan, and zoom."
          onResetView={onReset3dView}
          resetLabel="Reset panel"
        >
          {threeCanvas}
        </PanelChrome>
      ) : null}
      {activeTab === "camPreview" ? (
        <PanelChrome
          title="CAM preview"
          hint="Toolpath simulation for output review."
          onResetView={onResetCamPreviewView}
          resetLabel="Reset panel"
        >
          {camPreviewCanvas ?? <div className="three-loading">Generate CAM preview to display toolpath.</div>}
        </PanelChrome>
      ) : null}
    </div>
  );
}
