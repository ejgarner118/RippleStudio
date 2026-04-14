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
          hint="Outline footprint."
          onResetView={onResetPlanView}
          resetLabel="Reset panel"
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
