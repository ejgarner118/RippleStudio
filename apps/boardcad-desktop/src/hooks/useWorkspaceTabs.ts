import { useEffect, useMemo, useRef, useState } from "react";
import type { BoardEditMode } from "../types/editMode";
import type { WorkflowFocusArea } from "../types/workflowFocus";

export type WorkspaceTab = "plan" | "profile" | "section" | "three" | "camPreview";

export function useWorkspaceTabs(args: {
  focusArea: WorkflowFocusArea;
  editMode: BoardEditMode;
  camPreviewAvailable: boolean;
}) {
  const { focusArea, editMode, camPreviewAvailable } = args;
  const tabs = useMemo<Array<{ id: WorkspaceTab; label: string }>>(() => {
    const base: Array<{ id: WorkspaceTab; label: string }> = [
      { id: "plan", label: "Plan" },
      { id: "profile", label: "Profile" },
      { id: "section", label: "Section" },
      { id: "three", label: "3D" },
    ];
    if (focusArea === "manufacture") base.push({ id: "camPreview", label: "CAM" });
    return base;
  }, [focusArea]);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("plan");
  const prevFocusAreaRef = useRef<WorkflowFocusArea>(focusArea);

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      const fallback = tabs[0]?.id ?? "plan";
      setActiveTab((prev) => (prev === fallback ? prev : fallback));
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    const prev = prevFocusAreaRef.current;
    const focusChanged = prev !== focusArea;
    if (focusChanged) {
      prevFocusAreaRef.current = focusArea;
      if (focusArea === "inspect" || focusArea === "display") {
        setActiveTab((prev) => (prev === "three" ? prev : "three"));
        return;
      }
      if (focusArea === "manufacture") {
        const next = camPreviewAvailable ? "camPreview" : "three";
        setActiveTab((prev) => (prev === next ? prev : next));
        return;
      }
    }
    if (focusArea === "create" || focusArea === "project") {
      if (editMode === "outline") setActiveTab((prev) => (prev === "plan" ? prev : "plan"));
      else if (editMode === "deck" || editMode === "bottom") {
        setActiveTab((prev) => (prev === "profile" ? prev : "profile"));
      } else {
        setActiveTab((prev) => (prev === "section" ? prev : "section"));
      }
    }
  }, [editMode, focusArea, camPreviewAvailable]);

  return { tabs, activeTab, setActiveTab };
}

