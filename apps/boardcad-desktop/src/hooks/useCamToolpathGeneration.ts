import { useCallback, useState } from "react";
import {
  CAM_PROFILE_BALANCED,
  buildRasterDeckToolpath,
  postProcessGcode,
  previewToolpath,
  type BoardMetrics,
  type ToolpathPreview,
} from "@boardcad/core";
import { safeBoardFileBase } from "../constants/fileDialogs";
import { formatFsError, writeTextFromDialogPath } from "../lib/fileIo";
import { trackUxEvent } from "../lib/uxTelemetry";

type UseCamToolpathGenerationArgs = {
  analytics: BoardMetrics;
  boardName: string;
  onFileError: (msg: string) => void;
  onToast: (message: string, tone: "success" | "error") => void;
};

export function useCamToolpathGeneration({
  analytics,
  boardName,
  onFileError,
  onToast,
}: UseCamToolpathGenerationArgs) {
  const [camPreviewSummary, setCamPreviewSummary] = useState<ToolpathPreview | null>(null);

  const buildCamToolpath = useCallback(() => {
    const samples = analytics.samples.map((s) => ({
      x: s.x,
      width: s.width,
      thickness: s.thickness,
      rocker: s.rocker,
    }));
    return buildRasterDeckToolpath(analytics.length, samples, CAM_PROFILE_BALANCED);
  }, [analytics]);

  const generateCamPreview = useCallback(async () => {
    const points = buildCamToolpath();
    const preview = previewToolpath(points);
    setCamPreviewSummary(preview);
    const gcode = postProcessGcode(points, {
      id: "generic_3axis_balanced",
      spindleOn: "M3 S12000",
      spindleOff: "M5",
    });
    try {
      const outPath = await writeTextFromDialogPath(`${safeBoardFileBase(boardName, "board")}.nc`, gcode);
      onToast(`CAM preview generated and G-code saved to ${outPath}`, "success");
    } catch (error) {
      const msg = formatFsError(error);
      onFileError(msg);
      onToast(`CAM preview generated, but G-code export failed: ${msg}`, "error");
    }
    trackUxEvent("cam.preview.generated", { points: points.length, warnings: preview.warnings.length });
  }, [buildCamToolpath, boardName, onFileError, onToast]);

  return {
    camPreviewSummary,
    generateCamPreview,
    buildCamToolpath,
  };
}

