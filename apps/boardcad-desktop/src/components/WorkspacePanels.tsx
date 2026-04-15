import { useEffect, useState, type ReactNode } from "react";
import { Group, Panel, Separator, useDefaultLayout } from "react-resizable-panels";
import type { BoardEditMode } from "../types/editMode";
import { useViewportMode } from "../hooks/useViewportMode";
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

const GROUP_ID = "ripple-studio-workspace";
const PANEL_IDS = ["plan", "profile", "section", "three"] as const;

type WorkspacePanelsProps = {
  editMode: BoardEditMode;
  onSetEditMode: (mode: BoardEditMode) => void;
  planCanvas: ReactNode;
  profileCanvas: ReactNode;
  sectionCanvas: ReactNode;
  threeCanvas: ReactNode;
  onResetPlanView?: () => void;
  onResetProfileView?: () => void;
  onResetSectionView?: () => void;
  onReset3dView?: () => void;
};

export function WorkspacePanels({
  editMode,
  onSetEditMode,
  planCanvas,
  profileCanvas,
  sectionCanvas,
  threeCanvas,
  onResetPlanView,
  onResetProfileView,
  onResetSectionView,
  onReset3dView,
}: WorkspacePanelsProps) {
  const { isCompact } = useViewportMode(960);
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: GROUP_ID,
    storage: localStorage,
    panelIds: [...PANEL_IDS],
  });
  const [activeCompactPanel, setActiveCompactPanel] = useState<"plan" | "profile" | "section" | "three">("plan");

  useEffect(() => {
    if (!isCompact) return;
    if (editMode === "outline") setActiveCompactPanel("plan");
    else if (editMode === "deck" || editMode === "bottom") setActiveCompactPanel("profile");
    else if (editMode === "section") setActiveCompactPanel("section");
  }, [editMode, isCompact]);

  if (isCompact) {
    return (
      <div className="workspace-compact">
        <div className="workspace-compact__switcher">
          <SegmentedControl
            ariaLabel="Workspace panel switcher"
            value={activeCompactPanel}
            onChange={setActiveCompactPanel}
            options={[
              { id: "plan", label: "Plan" },
              { id: "profile", label: "Profile" },
              { id: "section", label: "Section" },
              { id: "three", label: "3D" },
            ]}
          />
        </div>
        {activeCompactPanel === "plan" ? (
          <PanelChrome
            title="Plan"
            hint="Outline footprint."
            onResetView={onResetPlanView}
            resetLabel="Reset panel"
            headerActions={
              <button
                type="button"
                className={`btn btn--sm ${editMode === "outline" ? "btn--primary" : "btn--subtle"}`}
                onClick={() => onSetEditMode("outline")}
              >
                Outline edit
              </button>
            }
          >
            {planCanvas}
          </PanelChrome>
        ) : null}
        {activeCompactPanel === "profile" ? (
          <PanelChrome
            title="Profile"
            hint="Deck and bottom rocker."
            onResetView={onResetProfileView}
            resetLabel="Reset panel"
            headerActions={
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
            }
          >
            {profileCanvas}
          </PanelChrome>
        ) : null}
        {activeCompactPanel === "section" ? (
          <PanelChrome
            title="Cross-section"
            hint="Rail shape at selected station."
            onResetView={onResetSectionView}
            resetLabel="Reset panel"
            headerActions={
              <button
                type="button"
                className={`btn btn--sm ${editMode === "section" ? "btn--primary" : "btn--subtle"}`}
                onClick={() => onSetEditMode("section")}
              >
                Section edit
              </button>
            }
          >
            {sectionCanvas}
          </PanelChrome>
        ) : null}
        {activeCompactPanel === "three" ? (
          <PanelChrome
            title="3D preview"
            hint="Orbit, pan, and zoom."
            onResetView={onReset3dView}
            resetLabel="Reset panel"
          >
            {threeCanvas}
          </PanelChrome>
        ) : null}
      </div>
    );
  }

  return (
    <Group
      id={GROUP_ID}
      orientation="vertical"
      className="workspace-panels"
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
    >
      <Panel
        id="plan"
        className="workspace-panels__panel"
        defaultSize="34%"
        minSize="14%"
      >
        <PanelChrome
          title="Plan"
          hint="Outline footprint."
          onResetView={onResetPlanView}
          resetLabel="Reset panel"
          headerActions={
            <button
              type="button"
              className={`btn btn--sm ${editMode === "outline" ? "btn--primary" : "btn--subtle"}`}
              onClick={() => onSetEditMode("outline")}
            >
              Outline edit
            </button>
          }
        >
          {planCanvas}
        </PanelChrome>
      </Panel>
      <Separator className="resize-handle" />
      <Panel
        id="profile"
        className="workspace-panels__panel"
        defaultSize="18%"
        minSize="10%"
      >
        <PanelChrome
          title="Profile"
          hint="Deck and bottom rocker."
          onResetView={onResetProfileView}
          resetLabel="Reset panel"
          headerActions={
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
          }
        >
          {profileCanvas}
        </PanelChrome>
      </Panel>
      <Separator className="resize-handle" />
      <Panel
        id="section"
        className="workspace-panels__panel"
        defaultSize="18%"
        minSize="10%"
      >
        <PanelChrome
          title="Cross-section"
          hint="Rail shape at selected station."
          onResetView={onResetSectionView}
          resetLabel="Reset panel"
          headerActions={
            <button
              type="button"
              className={`btn btn--sm ${editMode === "section" ? "btn--primary" : "btn--subtle"}`}
              onClick={() => onSetEditMode("section")}
            >
              Section edit
            </button>
          }
        >
          {sectionCanvas}
        </PanelChrome>
      </Panel>
      <Separator className="resize-handle" />
      <Panel
        id="three"
        className="workspace-panels__panel workspace-panels__panel--3d"
        defaultSize="30%"
        minSize="16%"
      >
        <PanelChrome
          title="3D preview"
          hint="Orbit, pan, and zoom."
          onResetView={onReset3dView}
          resetLabel="Reset panel"
        >
          {threeCanvas}
        </PanelChrome>
      </Panel>
    </Group>
  );
}
