import type { ReactNode } from "react";
import { Group, Panel, Separator, useDefaultLayout } from "react-resizable-panels";

function PanelChrome({
  title,
  hint,
  onResetView,
  resetLabel = "Reset view",
  children,
}: {
  title: string;
  hint?: string;
  onResetView?: () => void;
  resetLabel?: string;
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
      </header>
      <div className="panel__body">{children}</div>
    </section>
  );
}

const GROUP_ID = "ripple-studio-workspace";
const PANEL_IDS = ["plan", "profile", "section", "three"] as const;

type WorkspacePanelsProps = {
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
  planCanvas,
  profileCanvas,
  sectionCanvas,
  threeCanvas,
  onResetPlanView,
  onResetProfileView,
  onResetSectionView,
  onReset3dView,
}: WorkspacePanelsProps) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: GROUP_ID,
    storage: localStorage,
    panelIds: [...PANEL_IDS],
  });

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
          hint="Half-outline from the file and mirrored rail (full board footprint)."
          onResetView={onResetPlanView}
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
          hint="Deck and bottom: length versus rocker (side view)."
          onResetView={onResetProfileView}
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
          hint="Rail shape at the selected station along the board."
          onResetView={onResetSectionView}
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
          hint="Left drag: orbit · Right drag: pan · Middle or wheel: zoom · Loft when enabled in sidebar."
          onResetView={onReset3dView}
        >
          {threeCanvas}
        </PanelChrome>
      </Panel>
    </Group>
  );
}
