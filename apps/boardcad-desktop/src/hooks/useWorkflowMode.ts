import { useMemo, useState } from "react";
import type { WorkflowFocusArea } from "../types/workflowFocus";

export function useWorkflowMode(initial: WorkflowFocusArea = "create") {
  const [focusArea, setFocusArea] = useState<WorkflowFocusArea>(initial);
  const canMutateBoard = useMemo(
    () => focusArea === "create" || focusArea === "project",
    [focusArea],
  );
  const readOnlyCanvas = !canMutateBoard;
  return {
    focusArea,
    setFocusArea,
    canMutateBoard,
    readOnlyCanvas,
  };
}

