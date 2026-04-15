import {
  lazy,
  Suspense,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useMemo,
  useState,
} from "react";
import {
  AddCrossSectionCommand,
  BezierBoard,
  CommandStack,
  createBlankBoard,
  createDefaultCrossSection,
  createStarterBoard,
  exportBoardObj,
  exportBoardStlAscii,
  exportBoardStlBinary,
  firstDrawableCrossSectionIndex,
  getBoardLengthJava,
  getInterpolatedCrossSectionJava,
  getKnot,
  getBrdReadError,
  loadBrdFromBytes,
  renderPrintSvg,
  sampleBoardMetrics,
  compareBoardMetrics,
  runBoardQaChecks,
  AutoScaleBoardCommand,
  exportBezierDxf,
  exportNurbsStep,
  exportIgesPlaceholder,
  exportPdfSpecSheet,
  previewToolpath,
  postProcessGcode,
  saveBrdToString,
  addRecentFilePath,
  RemoveCrossSectionCommand,
  RemoveControlPointCommand,
  SetControlPointHandleModeCommand,
  SetCrossSectionPositionCommand,
  InsertControlPointCommand,
  MoveCrossSectionCommand,
  MoveControlPointsCommand,
  RefineCrossSectionRailCommand,
  AdjustCrossSectionRailCommand,
  computeRailDiagnostics,
  cloneCrossSection,
  setLocale,
  stabilizeEditTargetSpline,
  t,
  type SplineEditTarget,
  type SplineTarget,
  type HandleMode,
} from "@boardcad/core";
import {
  safeBoardFileBase,
} from "./constants/fileDialogs";
import type { OrbitControlsApi } from "./board3d/BoardScene3D";
import { prepareCanvas2D } from "./canvas2d/canvasSetup";
import { renderPlanView } from "./canvas2d/renderPlan";
import { renderProfileView } from "./canvas2d/renderProfile";
import { renderSectionView } from "./canvas2d/renderSection";
import { AboutModal } from "./components/AboutModal";
import { AppSidebar } from "./components/AppSidebar";
import { AppToolbar } from "./components/AppToolbar";
import { BrdFormatHelpModal } from "./components/BrdFormatHelpModal";
import { EmptyGuidedBanner } from "./components/EmptyGuidedBanner";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { NewBoardModal, type NewBoardPreset } from "./components/NewBoardModal";
import {
  ExportModal,
  type DesktopExportFormat,
} from "./components/ExportModal";
import { ErrorBanner } from "./components/ErrorBanner";
import { Toast, type ToastTone } from "./components/Toast";
import { WorkspacePanels } from "./components/WorkspacePanels";
import { PLAN_PAD_PX, PROFILE_PAD_PX } from "./constants";
import { useBoardCanvasEditing } from "./hooks/useBoardCanvasEditing";
import { useCanvasWheelZoom } from "./hooks/useCanvasWheelZoom";
import { useBoardGeometry } from "./hooks/useBoardGeometry";
import { useDesktopSettings } from "./hooks/useDesktopSettings";
import { useHotkeys } from "./hooks/useHotkeys";
import { useWindowCloseGuard } from "./hooks/useWindowCloseGuard";
import { confirmDiscardUnsaved } from "./lib/confirmDiscard";
import {
  formatFsError,
  hasRecentBoard,
  openBoardFromPicker,
  readBoardFileBytes,
  readBytesFromPath,
  rememberRecentBoard,
  saveBoardTextAs,
  writeBytesFromDialogPath,
  writeTextFromDialogPath,
} from "./lib/fileIo";
import {
  addProjectSnapshot,
  createProjectRecord,
  getProjectById,
  loadProjectLibrary,
  updateProjectMetadata,
  upsertProject,
  type ProjectRecord,
} from "./lib/projectLibrary";
import { trackUxEvent } from "./lib/uxTelemetry";
import { defaultOverlays, type OverlayState } from "./types/overlays";
import {
  defaultReferenceImageLayer,
  defaultReferenceImageState,
  type ReferenceImageLayer,
  type ReferenceImageState,
} from "./types/referenceImage";
import type { BoardEditMode } from "./types/editMode";
import { APP_WINDOW_TITLE_SUFFIX } from "./constants/brand";
import { getCanvasPalette, getScenePalette } from "./styles/themePalettes";
import { applyAppShellSeo, syncAppSocialTitleFromDocument } from "./seo/documentSeo";
import "./App.css";

type FinBox = {
  x: number;
  y: number;
  cantDeg: number;
  toeInDeg: number;
};

type FinLayout = {
  template: "custom" | "fcs2_thruster" | "futures_thruster";
  boxes: FinBox[];
};

type BoardMaterialColor = "sage" | "ocean" | "sand" | "charcoal";
type MeshPreviewMode = "interactivePreview" | "exportParity";
type RenderDebugSettings = {
  flatShading: boolean;
  frontSideOnly: boolean;
  normalView: boolean;
  highPrecisionDepth: boolean;
};

const BoardScene3D = lazy(async () => {
  const m = await import("./board3d/BoardScene3D");
  return { default: m.BoardScene3D };
});

type TemplateFilePreset = Exclude<NewBoardPreset, "empty_advanced" | "empty_guided">;

const TEMPLATE_FILE_BY_PRESET: Record<TemplateFilePreset, string> = {
  standard: "Standard.brd",
  shortboard: "ShortBoard.brd",
  fish: "Fish.brd",
  longboard: "LongBoard.brd",
};

export function templatePresetForNewBoard(preset: NewBoardPreset): TemplateFilePreset {
  if (preset === "standard" || preset === "shortboard" || preset === "fish" || preset === "longboard") {
    return preset;
  }
  return "standard";
}

const KEYBOARD_PAN_STEP_PX = 24;
const SIDEBAR_WIDTH_STORAGE_KEY = "ripple.desktop.sidebar.width.v1";
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 420;

export default function App() {
  const { settings, setSettings, resolvedTheme } = useDesktopSettings();
  const isDark = resolvedTheme === "dark";

  const [brd, setBrd] = useState(() => createStarterBoard());
  const [path, setPath] = useState<string | null>(null);
  const [stack] = useState(() => new CommandStack());
  const [, bumpCmdNonce] = useReducer((n: number) => n + 1, 0);
  const [boardRevision, bumpBoardRevision] = useReducer((n: number) => n + 1, 0);
  const [isDirty, setIsDirty] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [editMode, setEditMode] = useState<BoardEditMode>("outline");
  const [selectedControlPoint, setSelectedControlPoint] = useState<number | null>(null);
  const [selectedControlPointsMulti, setSelectedControlPointsMulti] = useState<number[]>([]);
  const [selectedControlPointKind, setSelectedControlPointKind] = useState<
    "end" | "prev" | "next" | null
  >(null);
  const [hoveredTarget, setHoveredTarget] = useState<SplineEditTarget | null>(null);
  const [overlays, setOverlays] = useState<OverlayState>(defaultOverlays);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [newBoardOpen, setNewBoardOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [brdHelpOpen, setBrdHelpOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [geometryWarning, setGeometryWarning] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: ToastTone;
  } | null>(null);
  const [resetViewPlanNonce, setResetViewPlanNonce] = useState(0);
  const [resetViewProfileNonce, setResetViewProfileNonce] = useState(0);
  const [resetViewSectionNonce, setResetViewSectionNonce] = useState(0);
  const [planZoom, setPlanZoom] = useState(1);
  const [profileZoom, setProfileZoom] = useState(1);
  const [sectionZoom, setSectionZoom] = useState(1);
  const [planPan, setPlanPan] = useState({ x: 0, y: 0 });
  const [profilePan, setProfilePan] = useState({ x: 0, y: 0 });
  const [sectionPan, setSectionPan] = useState({ x: 0, y: 0 });
  const [canvasLayoutNonce, setCanvasLayoutNonce] = useState(0);
  const [viewReset3dNonce, setViewReset3dNonce] = useState(0);
  const [emptyGuidedStep, setEmptyGuidedStep] = useState<number | null>(null);
  const [referenceImages, setReferenceImages] = useState<ReferenceImageState>(() =>
    defaultReferenceImageState(),
  );
  const [projectLibrary, setProjectLibrary] = useState<ProjectRecord[]>(() => loadProjectLibrary());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [lastAutosaveRevision, setLastAutosaveRevision] = useState<number | null>(null);
  const [comparisonBaseline, setComparisonBaseline] = useState<BezierBoard | null>(null);
  const [finLayout, setFinLayout] = useState<FinLayout>({ template: "custom", boxes: [] });
  const [boardMaterialColor, setBoardMaterialColor] = useState<BoardMaterialColor>("sage");
  const [meshPreviewMode, setMeshPreviewMode] = useState<MeshPreviewMode>("exportParity");
  const [renderDebug, setRenderDebug] = useState<RenderDebugSettings>({
    flatShading: false,
    frontSideOnly: false,
    normalView: false,
    highPrecisionDepth: false,
  });
  const [camPreviewSummary, setCamPreviewSummary] = useState<ReturnType<typeof previewToolpath> | null>(null);
  const [planRefImg, setPlanRefImg] = useState<HTMLImageElement | null>(null);
  const [profileRefImg, setProfileRefImg] = useState<HTMLImageElement | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") return 280;
    const stored = Number(window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
    return Number.isFinite(stored)
      ? Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, stored))
      : 280;
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const orbitRef = useRef<OrbitControlsApi | null>(null);
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const canvasPalette = useMemo(() => getCanvasPalette(resolvedTheme), [resolvedTheme]);
  const scenePalette = useMemo(() => getScenePalette(resolvedTheme), [resolvedTheme]);

  const canvasPlanRef = useRef<HTMLCanvasElement>(null);
  const canvasProfileRef = useRef<HTMLCanvasElement>(null);
  const canvasSectionRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setLocale("en");
  }, []);

  useEffect(() => {
    applyAppShellSeo();
  }, []);

  useEffect(() => {
    trackUxEvent("app.session.started", { theme: resolvedTheme });
  }, [resolvedTheme]);

  useEffect(() => {
    const url = referenceImages.plan.objectUrl;
    if (!url) {
      setPlanRefImg(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setPlanRefImg(img);
      bumpBoardRevision();
    };
    img.onerror = () => setPlanRefImg(null);
    img.src = url;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [referenceImages.plan.objectUrl]);

  useEffect(() => {
    const url = referenceImages.profile.objectUrl;
    if (!url) {
      setProfileRefImg(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setProfileRefImg(img);
      bumpBoardRevision();
    };
    img.onerror = () => setProfileRefImg(null);
    img.src = url;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [referenceImages.profile.objectUrl]);

  useEffect(() => {
    if (editMode === "deck") {
      setOverlays((o) => ({ ...o, profileDeck: true }));
    }
    if (editMode === "bottom") {
      setOverlays((o) => ({ ...o, profileBottom: true }));
    }
  }, [editMode]);

  useEffect(() => {
    setSelectedControlPoint(null);
    setSelectedControlPointKind(null);
    setHoveredTarget(null);
  }, [editMode, sectionIndex, brd]);

  useEffect(() => {
    if (emptyGuidedStep === null) return;
    if (emptyGuidedStep === 0) setEditMode("outline");
    if (emptyGuidedStep === 1) setEditMode("deck");
    if (emptyGuidedStep === 2) setEditMode("section");
  }, [emptyGuidedStep]);

  useEffect(() => {
    const ro = new ResizeObserver(() => setCanvasLayoutNonce((n) => n + 1));
    const observe = () => {
      for (const ref of [canvasPlanRef, canvasProfileRef, canvasSectionRef]) {
        const el = ref.current;
        if (el) ro.observe(el);
      }
    };
    observe();
    const id = requestAnimationFrame(observe);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, []);

  const {
    outlineLowerXy,
    outlineUpperXy,
    deckXy,
    bottomXy,
    planBounds,
    centerMm,
    profileStringerBounds,
    profileXy,
    profileBounds,
    loftData,
  } = useBoardGeometry(brd, sectionIndex, overlays, boardRevision, meshPreviewMode);
  const analytics = sampleBoardMetrics(brd);
  const comparisonDelta = comparisonBaseline ? compareBoardMetrics(brd, comparisonBaseline) : null;
  const qaIssues = runBoardQaChecks(brd, {
    minSections: 4,
    minThicknessMm: 18,
    minWidthMm: 120,
  }).sort((a, b) => {
    const rank: Record<string, number> = { error: 0, warn: 1, info: 2 };
    return (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9);
  });
  const curvatureScore =
    analytics.samples.reduce((acc, s) => acc + Math.abs(s.rocker - s.deck), 0) /
    Math.max(1, analytics.samples.length);
  const railDiag = brd.crossSections[sectionIndex]
    ? computeRailDiagnostics(brd.crossSections[sectionIndex]!.getBezierSpline())
    : null;
  const railDiagnosticsText = railDiag
    ? `Rail apex X ${railDiag.apexX.toFixed(1)} mm, apex Y ${railDiag.apexY.toFixed(1)} mm, tuck ${railDiag.tuckDepth.toFixed(1)} mm`
    : "Rail diagnostics unavailable for current section.";
  const activeProject = useMemo(
    () => getProjectById(activeProjectId, projectLibrary),
    [activeProjectId, projectLibrary],
  );

  const canvasPtr = useBoardCanvasEditing({
    brd,
    stack,
    editMode,
    sectionIndex,
    overlays,
    planBounds,
    profileStringerBounds,
    profileBounds,
    planPadPx: PLAN_PAD_PX,
    profilePadPx: PROFILE_PAD_PX,
    planZoom,
    profileZoom,
    sectionZoom,
    planPan,
    profilePan,
    sectionPan,
    setPlanPan,
    setProfilePan,
    setSectionPan,
    bumpBoardRevision,
    bumpCmdNonce,
    setDirty: setIsDirty,
    onSelectTarget: (t) => {
      setSelectedControlPoint(t?.index ?? null);
      setSelectedControlPointKind(t?.point ?? "end");
    },
    onHoverTarget: (t) => setHoveredTarget(t),
    selectedIndices: selectedControlPointsMulti,
    onSetSelectedIndices: (indices) => {
      setSelectedControlPointsMulti(indices);
      setSelectedControlPoint(indices.length > 0 ? indices[0]! : null);
      setSelectedControlPointKind(indices.length > 0 ? "end" : null);
    },
  });

  const clampZoom = useCallback((z: number) => Math.max(0.5, Math.min(z, 12)), []);

  useCanvasWheelZoom(canvasPlanRef, setPlanZoom, clampZoom, canvasLayoutNonce);
  useCanvasWheelZoom(canvasProfileRef, setProfileZoom, clampZoom, canvasLayoutNonce);
  useCanvasWheelZoom(canvasSectionRef, setSectionZoom, clampZoom, canvasLayoutNonce);

  useWindowCloseGuard(isDirty);

  const markerStateFor = useCallback(
    (kind: "outline" | "deck" | "bottom" | "section") => {
      const selected =
        selectedControlPoint == null
          ? null
          : kind === "section"
            ? editMode === "section"
              ? { index: selectedControlPoint, point: selectedControlPointKind ?? "end" }
              : null
            : editMode === kind
              ? { index: selectedControlPoint, point: selectedControlPointKind ?? "end" }
              : null;
      const hover =
        hoveredTarget &&
        hoveredTarget.kind === kind &&
        (hoveredTarget.kind !== "section" || hoveredTarget.sectionIndex === sectionIndex)
          ? { index: hoveredTarget.index, point: hoveredTarget.point ?? "end" }
          : null;
      return { selected, hover };
    },
    [selectedControlPoint, selectedControlPointKind, hoveredTarget, editMode, sectionIndex],
  );

  useEffect(() => {
    const dirtyMark = isDirty ? "• " : "";
    const name = brd.name?.trim() || "Untitled";
    document.title = `${dirtyMark}${name} — ${APP_WINDOW_TITLE_SUFFIX}`;
    syncAppSocialTitleFromDocument();
  }, [brd.name, isDirty]);

  useEffect(() => {
    setSectionIndex((i) => {
      const n = brd.crossSections.length;
      if (n === 0) return 0;
      return Math.min(i, n - 1);
    });
  }, [brd.crossSections.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(Math.round(sidebarWidth)));
  }, [sidebarWidth]);

  useEffect(() => {
    const prep = prepareCanvas2D(canvasPlanRef.current);
    if (!prep) return;
    const { ctx, cw, ch } = prep;
    renderPlanView(
      ctx,
      cw,
      ch,
      brd,
      outlineLowerXy,
      outlineUpperXy,
      planBounds,
      overlays,
      planZoom,
      planPan.x,
      planPan.y,
      markerStateFor("outline"),
      { layer: referenceImages.plan, img: planRefImg },
      finLayout.boxes,
      canvasPalette,
    );
  }, [
    brd,
    planBounds,
    outlineLowerXy,
    outlineUpperXy,
    overlays,
    markerStateFor,
    planZoom,
    planPan.x,
    planPan.y,
    resetViewPlanNonce,
    canvasLayoutNonce,
    boardRevision,
    referenceImages.plan,
    planRefImg,
    finLayout.boxes,
    canvasPalette,
  ]);

  useEffect(() => {
    const prep = prepareCanvas2D(canvasProfileRef.current);
    if (!prep) return;
    const { ctx, cw, ch } = prep;
    renderProfileView(
      ctx,
      cw,
      ch,
      brd,
      deckXy,
      bottomXy,
      profileStringerBounds,
      overlays,
      profileZoom,
      profilePan.x,
      profilePan.y,
      markerStateFor("deck"),
      markerStateFor("bottom"),
      { layer: referenceImages.profile, img: profileRefImg },
      canvasPalette,
    );
  }, [
    brd,
    deckXy,
    bottomXy,
    profileStringerBounds,
    overlays,
    markerStateFor,
    profileZoom,
    profilePan.x,
    profilePan.y,
    resetViewProfileNonce,
    canvasLayoutNonce,
    boardRevision,
    referenceImages.profile,
    profileRefImg,
    canvasPalette,
  ]);

  useEffect(() => {
    const prep = prepareCanvas2D(canvasSectionRef.current);
    if (!prep) return;
    const { ctx, cw, ch } = prep;
    renderSectionView(
      ctx,
      cw,
      ch,
      brd,
      sectionIndex,
      profileXy,
      profileBounds,
      overlays,
      sectionZoom,
      sectionPan.x,
      sectionPan.y,
      markerStateFor("section"),
      canvasPalette,
    );
  }, [
    brd,
    sectionIndex,
    profileXy,
    profileBounds,
    overlays,
    markerStateFor,
    sectionZoom,
    sectionPan.x,
    sectionPan.y,
    resetViewSectionNonce,
    canvasLayoutNonce,
    boardRevision,
    canvasPalette,
  ]);

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    setToast({ message, tone });
  }, []);

  const pushRecent = useCallback(
    (p: string) => {
      setSettings({
        recentFiles: addRecentFilePath(settings.recentFiles, p),
      });
    },
    [setSettings, settings.recentFiles],
  );

  const loadBoardFromPath = useCallback(
    async (selected: string) => {
      setFileError(null);
      try {
        const { path, data } = await readBoardFileBytes(selected);
        const next = new BezierBoard();
        const r = loadBrdFromBytes(next, data, path);
        if (r === 0) {
          rememberRecentBoard(path, data);
          stack.clear();
          bumpCmdNonce();
          setBrd(next);
          setPath(path);
          setSectionIndex(firstDrawableCrossSectionIndex(next));
          setEmptyGuidedStep(null);
          setIsDirty(false);
          pushRecent(path);
          showToast(`Opened ${next.name || path}`, "success");
        } else {
          const detail = getBrdReadError() || "Unknown error";
          setFileError(detail);
        }
      } catch (e) {
        const msg = formatFsError(e);
        setFileError(msg);
        showToast(msg, "error");
      }
    },
    [showToast, stack, pushRecent, bumpCmdNonce],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (isDirty || path !== null || emptyGuidedStep !== null) return;
      try {
        const source = "/BoardTemplates/Standard.brd";
        const bytes = await readBytesFromPath(source);
        const loaded = new BezierBoard();
        const r = loadBrdFromBytes(loaded, bytes, source);
        if (cancelled || r !== 0) return;
        stack.clear();
        bumpCmdNonce();
        setBrd(loaded);
        setSectionIndex(firstDrawableCrossSectionIndex(loaded));
        setIsDirty(false);
        setPath(null);
      } catch {
        // Keep starter board fallback if template can't be loaded.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isDirty, path, emptyGuidedStep, stack, bumpCmdNonce]);

  const openBoard = useCallback(async () => {
    if (isDirty && !(await confirmDiscardUnsaved())) return;
    const picked = await openBoardFromPicker();
    if (!picked) return;
    rememberRecentBoard(picked.path, picked.data);
    await loadBoardFromPath(picked.path);
    trackUxEvent("file.open", { source: "picker" });
  }, [isDirty, loadBoardFromPath]);

  const openRecentPath = useCallback(
    async (p: string) => {
      if (isDirty && !(await confirmDiscardUnsaved())) return;
      if (!hasRecentBoard(p)) {
        showToast("Recent file is no longer available in this browser session.", "error");
        return;
      }
      await loadBoardFromPath(p);
    },
    [isDirty, loadBoardFromPath, showToast],
  );

  const newBoard = useCallback(async () => {
    if (isDirty && !(await confirmDiscardUnsaved())) return;
    setNewBoardOpen(true);
    trackUxEvent("file.new.modal.opened");
  }, [isDirty]);

  const createNewBoardFromPreset = useCallback(
    async (preset: NewBoardPreset) => {
      if (preset === "empty_advanced") {
        const nextBoard = createBlankBoard();
        stack.clear();
        bumpCmdNonce();
        setBrd(nextBoard);
        setPath(null);
        setSectionIndex(firstDrawableCrossSectionIndex(nextBoard));
        setSelectedControlPoint(null);
        setSelectedControlPointKind(null);
        setIsDirty(true);
        setOverlays((o) => ({
          ...o,
          grid: true,
          controlPoints: true,
          guidePoints: false,
          profileDeck: true,
          profileBottom: true,
        }));
        setEmptyGuidedStep(null);
        setEditMode("deck");
        setNewBoardOpen(false);
        bumpBoardRevision();
        showToast("Blank board ready", "success");
        trackUxEvent("board.created", { preset });
        return;
      }

      const guidedFromStandard = preset === "empty_guided";
      const templatePreset = templatePresetForNewBoard(preset);
      const templateFile = TEMPLATE_FILE_BY_PRESET[templatePreset];
      const publicUrl = `/BoardTemplates/${templateFile}`;
      let nextBoard: BezierBoard | null = null;
      try {
        const response = await fetch(publicUrl, { cache: "no-store" });
        if (response.ok) {
          const bytes = new Uint8Array(await response.arrayBuffer());
          const loaded = new BezierBoard();
          const result = loadBrdFromBytes(loaded, bytes, publicUrl);
          if (result === 0) {
            nextBoard = loaded;
          }
        }
      } catch {
        // Continue with additional candidate paths below.
      }

      if (!nextBoard) {
        const candidatePaths = [
          `BoardTemplates/${templateFile}`,
          `../BoardTemplates/${templateFile}`,
          `../../BoardTemplates/${templateFile}`,
        ];
        for (const candidate of candidatePaths) {
          try {
            const bytes = await readBytesFromPath(candidate);
            const loaded = new BezierBoard();
            const result = loadBrdFromBytes(loaded, bytes, candidate);
            if (result === 0) {
              nextBoard = loaded;
              break;
            }
          } catch {
            // Keep trying other candidate template locations.
          }
        }
      }

      if (!nextBoard) {
        nextBoard = createStarterBoard();
        showToast(`Template ${templateFile} not found. Loaded starter board instead.`, "info");
      }

      stack.clear();
      bumpCmdNonce();
      setBrd(nextBoard);
      setPath(null);
      setSectionIndex(firstDrawableCrossSectionIndex(nextBoard));
      setSelectedControlPoint(null);
      setSelectedControlPointKind(null);
      setIsDirty(true);
      if (guidedFromStandard) {
        setEmptyGuidedStep(0);
        setEditMode("outline");
      } else {
        setEmptyGuidedStep(null);
        setEditMode("deck");
      }
      setOverlays((o) => ({ ...o, profileDeck: true, profileBottom: true }));
      setNewBoardOpen(false);
      bumpBoardRevision();
      showToast(guidedFromStandard ? "Guided setup started from Standard template" : `New ${preset} board`, "success");
      trackUxEvent("board.created", { preset, guided: guidedFromStandard });
    },
    [stack, showToast, bumpCmdNonce, bumpBoardRevision],
  );

  const saveBoardToPath = useCallback(
    async (dest: string): Promise<boolean> => {
      setFileError(null);
      try {
        const body = saveBrdToString(brd);
        const p = await writeTextFromDialogPath(dest, body);
        setPath(p);
        setIsDirty(false);
        setLastAutosaveRevision(boardRevision);
        pushRecent(p);
        showToast(`Saved ${p}`, "success");
        return true;
      } catch (e) {
        const msg = formatFsError(e);
        setFileError(msg);
        showToast(msg, "error");
        return false;
      }
    },
    [brd, showToast, pushRecent, boardRevision],
  );

  const saveBoard = useCallback(async () => {
    setFileError(null);
    if (path) {
      await saveBoardToPath(path);
      return;
    }
    const dest = `${safeBoardFileBase(brd.name, "board")}.brd`;
    await saveBoardToPath(dest);
    trackUxEvent("file.save", { mode: path ? "existing" : "new" });
  }, [brd.name, path, saveBoardToPath]);

  const saveBoardAs = useCallback(async () => {
    setFileError(null);
    try {
      const dest = `${safeBoardFileBase(brd.name, "board")}.brd`;
      const body = saveBrdToString(brd);
      const saved = await saveBoardTextAs(dest, body);
      if (!saved) return;
      setPath(saved.path);
      setIsDirty(false);
      setLastAutosaveRevision(boardRevision);
      pushRecent(saved.path);
      showToast(
        saved.method === "picker" ? `Saved via file picker: ${saved.path}` : `Downloaded ${saved.path}`,
        "success",
      );
      trackUxEvent("file.save_as", { method: saved.method });
    } catch (e) {
      const msg = formatFsError(e);
      setFileError(msg);
      showToast(msg, "error");
    }
  }, [brd, pushRecent, showToast, boardRevision]);

  const meshExportBlockedMsg =
    "Could not export mesh (need at least two cross-sections and valid geometry).";

  const performExport = useCallback(
    async (format: DesktopExportFormat) => {
      setExportOpen(false);
      setFileError(null);
      const base = safeBoardFileBase(brd.name, "board");
      try {
        if (format === "stl-binary") {
          const buf = exportBoardStlBinary(brd);
          if (!buf) {
            showToast(meshExportBlockedMsg, "error");
            return;
          }
          const dest = `${base}.stl`;
          const p = await writeBytesFromDialogPath(dest, buf);
          showToast(`Exported ${p}`, "success");
          return;
        }
        if (format === "stl-ascii") {
          const text = exportBoardStlAscii(brd);
          if (!text) {
            showToast(meshExportBlockedMsg, "error");
            return;
          }
          const dest = `${base}.stl`;
          const p = await writeTextFromDialogPath(dest, text);
          showToast(`Exported ${p}`, "success");
          return;
        }
        if (format === "obj") {
          const text = exportBoardObj(brd);
          if (!text) {
            showToast(meshExportBlockedMsg, "error");
            return;
          }
          const dest = `${base}.obj`;
          const p = await writeTextFromDialogPath(dest, text);
          showToast(`Exported ${p}`, "success");
          return;
        }
        const svgKind =
          format === "svg-outline"
            ? "outline"
            : format === "svg-profile"
              ? "profile"
              : "specSheet";
        const slug =
          format === "svg-outline"
            ? "outline"
            : format === "svg-profile"
              ? "profile"
              : "spec";
        const svg = renderPrintSvg(svgKind, brd);
        const dest = `${safeBoardFileBase(brd.name, slug)}.svg`;
        const p = await writeTextFromDialogPath(dest, svg);
        showToast(`Exported ${p}`, "success");
        const dxf = exportBezierDxf("all", brd);
        if (dxf.ok) await writeTextFromDialogPath(`${base}.dxf`, dxf.data);
        const pdf = exportPdfSpecSheet(brd);
        if (pdf.ok) await writeTextFromDialogPath(`${base}.pdf.svg`, pdf.data);
        const step = exportNurbsStep(brd);
        if (step.ok) await writeTextFromDialogPath(`${base}.step`, step.data);
        const iges = exportIgesPlaceholder(brd);
        if (iges.ok) await writeTextFromDialogPath(`${base}.iges`, iges.data);
      } catch (e) {
        const msg = formatFsError(e);
        setFileError(msg);
        showToast(msg, "error");
      }
    },
    [brd, showToast],
  );

  const doUndo = useCallback(() => {
    stack.undo();
    bumpCmdNonce();
    bumpBoardRevision();
  }, [stack]);

  const doRedo = useCallback(() => {
    stack.redo();
    bumpCmdNonce();
    bumpBoardRevision();
  }, [stack]);

  const addSection = useCallback(() => {
    const cs = createDefaultCrossSection(brd);
    const insertAt = Math.min(sectionIndex + 1, brd.crossSections.length);
    stack.push(new AddCrossSectionCommand(brd, insertAt, cs));
    bumpCmdNonce();
    setSectionIndex(insertAt);
    setIsDirty(true);
    bumpBoardRevision();
    showToast("Cross-section added", "success");
  }, [brd, sectionIndex, stack, showToast]);

  const removeSection = useCallback(() => {
    if (brd.crossSections.length <= 1) {
      showToast("Keep at least one cross-section.", "error");
      return;
    }
    stack.push(new RemoveCrossSectionCommand(brd, sectionIndex));
    bumpCmdNonce();
    setIsDirty(true);
    bumpBoardRevision();
    showToast("Cross-section removed", "success");
  }, [brd, sectionIndex, stack, showToast]);

  const setSectionStation = useCallback(
    (newPos: number) => {
      const cs = brd.crossSections[sectionIndex];
      if (!cs) return;
      const before = cs.getPosition();
      if (Math.abs(before - newPos) < 1e-9) return;
      stack.push(
        new SetCrossSectionPositionCommand(brd, sectionIndex, before, newPos),
      );
      bumpCmdNonce();
      setIsDirty(true);
      bumpBoardRevision();
    },
    [brd, sectionIndex, stack],
  );

  const duplicateSection = useCallback(() => {
    const cs = brd.crossSections[sectionIndex];
    if (!cs) return;
    const dup = cloneCrossSection(cs);
    dup.setPosition(cs.getPosition() + 20);
    const at = Math.min(sectionIndex + 1, brd.crossSections.length);
    stack.push(new AddCrossSectionCommand(brd, at, dup));
    bumpCmdNonce();
    setSectionIndex(at);
    setIsDirty(true);
    bumpBoardRevision();
    showToast("Section duplicated", "success");
  }, [brd, sectionIndex, stack, showToast]);

  const interpolateSection = useCallback(() => {
    const a = brd.crossSections[sectionIndex];
    const b = brd.crossSections[sectionIndex + 1];
    if (!a || !b) {
      showToast("Select a section with a following neighbor to interpolate.", "error");
      return;
    }
    const pos = (a.getPosition() + b.getPosition()) * 0.5;
    const inter = getInterpolatedCrossSectionJava(brd, pos);
    if (!inter) {
      showToast("Could not interpolate section at this station.", "error");
      return;
    }
    const at = sectionIndex + 1;
    stack.push(new AddCrossSectionCommand(brd, at, inter));
    bumpCmdNonce();
    setSectionIndex(at);
    setIsDirty(true);
    bumpBoardRevision();
    showToast("Interpolated section inserted", "success");
  }, [brd, sectionIndex, stack, showToast]);

  const applyProfileShaping = useCallback(
    (v: {
      noseRocker: number;
      tailRocker: number;
      maxThickness: number;
      maxThicknessPosPct: number;
    }) => {
      const len = getBoardLengthJava(brd);
      if (!Number.isFinite(len) || len <= 1e-6) {
        showToast("Outline length is invalid; cannot apply profile shaping.", "error");
        return;
      }
      const xr = Math.max(0.1, Math.min(0.9, v.maxThicknessPosPct / 100));
      const xPeak = len * xr;
      const q = (x: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) => {
        const d01 = (x0 - x1) * (x0 - x2);
        const d11 = (x1 - x0) * (x1 - x2);
        const d21 = (x2 - x0) * (x2 - x1);
        if (Math.abs(d01) < 1e-9 || Math.abs(d11) < 1e-9 || Math.abs(d21) < 1e-9) return y0;
        return (
          y0 * ((x - x1) * (x - x2)) / d01 +
          y1 * ((x - x0) * (x - x2)) / d11 +
          y2 * ((x - x0) * (x - x1)) / d21
        );
      };
      const bottomY = (x: number) => q(x, 0, v.tailRocker, len * 0.5, 0, len, v.noseRocker);
      const thicknessY = (x: number) =>
        Math.max(
          0.1,
          q(x, 0, 0.1, xPeak, Math.max(v.maxThickness, 5), len, 0.1),
        );

      const applySplineY = (
        sp: BezierBoard["deck"] | BezierBoard["bottom"],
        fn: (x: number) => number,
      ) => {
        for (let i = 0; i < sp.getNrOfControlPoints(); i++) {
          const k = sp.getControlPointOrThrow(i);
          const target = fn(k.getEndPoint().x);
          const dy = target - k.getEndPoint().y;
          for (let j = 0; j < 3; j++) {
            k.points[j]!.y += dy;
          }
        }
      };
      applySplineY(brd.bottom, bottomY);
      applySplineY(brd.deck, (x) => bottomY(x) + thicknessY(x));
      // Keep nose/tail coupled so deck and bottom remain connected at tips.
      const bCount = brd.bottom.getNrOfControlPoints();
      const dCount = brd.deck.getNrOfControlPoints();
      if (bCount > 0 && dCount > 0) {
        const pairs: Array<[number, number]> = [
          [0, 0],
          [dCount - 1, bCount - 1],
        ];
        for (const [di, bi] of pairs) {
          const dk = brd.deck.getControlPoint(di);
          const bk = brd.bottom.getControlPoint(bi);
          if (!dk || !bk) continue;
          const tipX = (dk.points[0]!.x + bk.points[0]!.x) * 0.5;
          const tipY = (dk.points[0]!.y + bk.points[0]!.y) * 0.5;
          for (let j = 0; j < 3; j++) {
            dk.points[j]!.x += tipX - dk.points[0]!.x;
            dk.points[j]!.y += tipY - dk.points[0]!.y;
            bk.points[j]!.x += tipX - bk.points[0]!.x;
            bk.points[j]!.y += tipY - bk.points[0]!.y;
          }
        }
      }
      brd.checkAndFixContinousy(false, true);
      brd.setLocks();
      setOverlays((o) => ({ ...o, profileDeck: true, profileBottom: true }));
      setEditMode("deck");
      setIsDirty(true);
      bumpBoardRevision();
      showToast("Profile/rocker shaping applied", "success");
    },
    [brd, showToast],
  );

  const addPairedProfilePoint = useCallback(() => {
    const nd = brd.deck.getNrOfControlPoints();
    const nb = brd.bottom.getNrOfControlPoints();
    if (nd < 2 || nb < 2) {
      showToast("Deck and bottom need at least two points.", "error");
      return;
    }
    const i = Math.max(
      0,
      Math.min(selectedControlPoint ?? Math.min(nd, nb) - 2, Math.min(nd, nb) - 2),
    );
    stack.push(new InsertControlPointCommand(brd, { kind: "deck" }, i));
    stack.push(new InsertControlPointCommand(brd, { kind: "bottom" }, i));
    setOverlays((o) => ({ ...o, profileDeck: true, profileBottom: true }));
    setEditMode("deck");
    setSelectedControlPoint(i + 1);
    setIsDirty(true);
    bumpCmdNonce();
    bumpBoardRevision();
    showToast("Paired deck/bottom point added", "success");
  }, [brd, selectedControlPoint, stack, showToast]);

  const moveSectionEarlier = useCallback(() => {
    if (sectionIndex <= 0) return;
    stack.push(new MoveCrossSectionCommand(brd, sectionIndex, sectionIndex - 1));
    bumpCmdNonce();
    setSectionIndex(sectionIndex - 1);
    setIsDirty(true);
    bumpBoardRevision();
  }, [brd, sectionIndex, stack]);

  const moveSectionLater = useCallback(() => {
    if (sectionIndex >= brd.crossSections.length - 1) return;
    stack.push(new MoveCrossSectionCommand(brd, sectionIndex, sectionIndex + 1));
    bumpCmdNonce();
    setSectionIndex(sectionIndex + 1);
    setIsDirty(true);
    bumpBoardRevision();
  }, [brd, sectionIndex, stack]);

  const addSectionFromCurrentTemplate = useCallback(() => {
    const cs = createDefaultCrossSection(brd);
    const insertAt = Math.min(sectionIndex + 1, brd.crossSections.length);
    stack.push(new AddCrossSectionCommand(brd, insertAt, cs));
    bumpCmdNonce();
    setSectionIndex(insertAt);
    setIsDirty(true);
    bumpBoardRevision();
    showToast("Section added from current board", "success");
  }, [brd, sectionIndex, stack, showToast]);

  const refineActiveSectionRail = useCallback(
    (kind: "soften" | "harden") => {
      const cs = brd.crossSections[sectionIndex];
      if (!cs || cs.getBezierSpline().getNrOfControlPoints() < 2) {
        showToast("Select a section with at least two control points.", "error");
        return;
      }
      stack.push(new RefineCrossSectionRailCommand(brd, sectionIndex, kind));
      bumpCmdNonce();
      setIsDirty(true);
      bumpBoardRevision();
      showToast(kind === "soften" ? "Rail softened" : "Rail hardened", "success");
    },
    [brd, sectionIndex, stack, showToast],
  );

  const pickPlanReferenceImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return;
      setReferenceImages((prev) => {
        if (prev.plan.objectUrl) URL.revokeObjectURL(prev.plan.objectUrl);
        return {
          ...prev,
          plan: { ...prev.plan, objectUrl: URL.createObjectURL(f), enabled: true },
        };
      });
      bumpBoardRevision();
    };
    input.click();
  }, []);

  const pickProfileReferenceImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return;
      setReferenceImages((prev) => {
        if (prev.profile.objectUrl) URL.revokeObjectURL(prev.profile.objectUrl);
        return {
          ...prev,
          profile: { ...prev.profile, objectUrl: URL.createObjectURL(f), enabled: true },
        };
      });
      bumpBoardRevision();
    };
    input.click();
  }, []);

  const clearPlanReferenceImage = useCallback(() => {
    setReferenceImages((prev) => {
      if (prev.plan.objectUrl) URL.revokeObjectURL(prev.plan.objectUrl);
      return { ...prev, plan: defaultReferenceImageLayer() };
    });
    setPlanRefImg(null);
    bumpBoardRevision();
  }, []);

  const clearProfileReferenceImage = useCallback(() => {
    setReferenceImages((prev) => {
      if (prev.profile.objectUrl) URL.revokeObjectURL(prev.profile.objectUrl);
      return { ...prev, profile: defaultReferenceImageLayer() };
    });
    setProfileRefImg(null);
    bumpBoardRevision();
  }, []);

  const patchPlanReference = useCallback((patch: Partial<ReferenceImageLayer>) => {
    setReferenceImages((prev) => ({ ...prev, plan: { ...prev.plan, ...patch } }));
    bumpBoardRevision();
  }, []);

  const patchProfileReference = useCallback((patch: Partial<ReferenceImageLayer>) => {
    setReferenceImages((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
    bumpBoardRevision();
  }, []);

  const currentSplineTarget = useCallback((): SplineTarget => {
    if (editMode === "outline") return { kind: "outline" };
    if (editMode === "deck") return { kind: "deck" };
    if (editMode === "bottom") return { kind: "bottom" };
    return { kind: "section", sectionIndex };
  }, [editMode, sectionIndex]);

  const currentSplinePointCount = useCallback((): number => {
    const t = currentSplineTarget();
    if (t.kind === "outline") return brd.outline.getNrOfControlPoints();
    if (t.kind === "deck") return brd.deck.getNrOfControlPoints();
    if (t.kind === "bottom") return brd.bottom.getNrOfControlPoints();
    const cs = brd.crossSections[t.sectionIndex];
    return cs ? cs.getBezierSpline().getNrOfControlPoints() : 0;
  }, [brd, currentSplineTarget]);

  const selectedTarget = useCallback((): SplineEditTarget | null => {
    const i = selectedControlPoint;
    if (i == null) return null;
    const t = currentSplineTarget();
    if (t.kind === "section") return { kind: "section", sectionIndex: t.sectionIndex, index: i };
    return { kind: t.kind, index: i };
  }, [selectedControlPoint, currentSplineTarget]);

  const selectedTargetWithPoint = useCallback((): SplineEditTarget | null => {
    const t = selectedTarget();
    if (!t) return null;
    return { ...t, point: selectedControlPointKind ?? "end" };
  }, [selectedTarget, selectedControlPointKind]);

  const addControlPoint = useCallback(() => {
    const n = currentSplinePointCount();
    if (n < 2) {
      showToast("Need at least two points in the spline to insert a new point.", "error");
      return;
    }
    const selected = selectedControlPoint ?? 0;
    const i = Math.max(0, Math.min(selected, n - 2));
    stack.push(new InsertControlPointCommand(brd, currentSplineTarget(), i));
    bumpCmdNonce();
    setSelectedControlPoint(i + 1);
    setIsDirty(true);
    bumpBoardRevision();
    showToast("Control point added", "success");
  }, [
    brd,
    currentSplinePointCount,
    currentSplineTarget,
    selectedControlPoint,
    stack,
    showToast,
  ]);

  const removeControlPoint = useCallback(() => {
    const n = currentSplinePointCount();
    if (n <= 2) {
      showToast("Keep at least two control points in each spline.", "error");
      return;
    }
    const selected = selectedControlPoint ?? n - 1;
    const i = Math.max(0, Math.min(selected, n - 1));
    const t = currentSplineTarget();
    if ((t.kind === "outline" || t.kind === "deck" || t.kind === "bottom") && (i === 0 || i === n - 1)) {
      showToast("Nose and tail points are fixed. Select an interior point to remove.", "error");
      return;
    }
    stack.push(new RemoveControlPointCommand(brd, currentSplineTarget(), i));
    bumpCmdNonce();
    setSelectedControlPoint(Math.max(0, Math.min(i - 1, n - 2)));
    setIsDirty(true);
    bumpBoardRevision();
    showToast("Control point removed", "success");
  }, [
    brd,
    currentSplinePointCount,
    currentSplineTarget,
    selectedControlPoint,
    stack,
    showToast,
  ]);

  const toggleContinuity = useCallback(() => {
    const t = selectedTarget();
    if (!t) {
      showToast("Select a control point first.", "error");
      return;
    }
    const k = getKnot(brd, t);
    if (!k) return;
    const current = k.getHandleMode();
    const next: HandleMode =
      current === "independent" ? "aligned" : current === "aligned" ? "mirrored" : "independent";
    stack.push(new SetControlPointHandleModeCommand(brd, [t], next));
    bumpCmdNonce();
    setIsDirty(true);
    bumpBoardRevision();
    showToast(`Handle mode: ${next}`, "success");
  }, [selectedTarget, stack, brd, showToast]);

  const setHandleMode = useCallback(
    (mode: HandleMode) => {
      const t = selectedTarget();
      if (!t) {
        showToast("Select a control point first.", "error");
        return;
      }
      stack.push(new SetControlPointHandleModeCommand(brd, [t], mode));
      bumpCmdNonce();
      setIsDirty(true);
      bumpBoardRevision();
      showToast(`Handle mode: ${mode}`, "success");
    },
    [selectedTarget, stack, brd, showToast],
  );

  const selectedHandleMode = (() => {
    const t = selectedTarget();
    if (!t) return null;
    const k = getKnot(brd, t);
    return k ? k.getHandleMode() : null;
  })();

  const selectedPointCoords = (() => {
    const t = selectedTargetWithPoint();
    if (!t) return null;
    const k = getKnot(brd, t);
    if (!k) return null;
    const pointKind = t.point ?? "end";
    const p =
      pointKind === "end"
        ? k.points[0]!
        : pointKind === "prev"
          ? k.points[1]!
          : k.points[2]!;
    return { x: p.x, y: p.y };
  })();

  const setSelectedPointCoords = useCallback(
    (next: { x: number; y: number }) => {
      const t = selectedTargetWithPoint();
      if (!t) {
        showToast("Select a control point first.", "error");
        return;
      }
      const k = getKnot(brd, t);
      if (!k) return;
      const before = [k.points[0]!.x, k.points[0]!.y, k.points[1]!.x, k.points[1]!.y, k.points[2]!.x, k.points[2]!.y];
      const pointKind = t.point ?? "end";
      const pi = pointKind === "end" ? 0 : pointKind === "prev" ? 1 : 2;
      if (pointKind === "end") {
        const dx = next.x - k.points[0]!.x;
        const dy = next.y - k.points[0]!.y;
        for (let i = 0; i < 3; i++) {
          k.points[i]!.x += dx;
          k.points[i]!.y += dy;
        }
      } else {
        k.points[pi]!.x = next.x;
        k.points[pi]!.y = next.y;
      }
      stabilizeEditTargetSpline(brd, t);
      const after = [k.points[0]!.x, k.points[0]!.y, k.points[1]!.x, k.points[1]!.y, k.points[2]!.x, k.points[2]!.y];
      stack.push(new MoveControlPointsCommand(brd, [{ target: t, before, after }]));
      bumpCmdNonce();
      setIsDirty(true);
      bumpBoardRevision();
      showToast("Point coordinates updated", "success");
    },
    [selectedTargetWithPoint, brd, stack, showToast],
  );

  const computeGeometryIssues = useCallback((): string[] => {
    const issues: string[] = [];
    const checks: Array<{ name: string; xs: number[] }> = [];
    const collectX = (n: number, getX: (i: number) => number): number[] =>
      Array.from({ length: n }, (_, i) => getX(i));
    checks.push({
      name: "outline",
      xs: collectX(brd.outline.getNrOfControlPoints(), (i) =>
        brd.outline.getControlPointOrThrow(i).getEndPoint().x,
      ),
    });
    checks.push({
      name: "deck",
      xs: collectX(brd.deck.getNrOfControlPoints(), (i) =>
        brd.deck.getControlPointOrThrow(i).getEndPoint().x,
      ),
    });
    checks.push({
      name: "bottom",
      xs: collectX(brd.bottom.getNrOfControlPoints(), (i) =>
        brd.bottom.getControlPointOrThrow(i).getEndPoint().x,
      ),
    });
    for (let si = 0; si < brd.crossSections.length; si++) {
      const sp = brd.crossSections[si]!.getBezierSpline();
      checks.push({
        name: `section #${si + 1}`,
        xs: collectX(sp.getNrOfControlPoints(), (i) => sp.getControlPointOrThrow(i).getEndPoint().x),
      });
    }
    for (const c of checks) {
      for (let i = 0; i < c.xs.length; i++) {
        const v = c.xs[i]!;
        if (!Number.isFinite(v)) {
          issues.push(`${c.name}: non-finite coordinate at point #${i + 1}.`);
        }
        if (i > 0 && v <= c.xs[i - 1]!) {
          issues.push(`${c.name}: point #${i} and #${i + 1} are not strictly increasing along X.`);
        }
      }
    }
    for (let i = 1; i < brd.crossSections.length; i++) {
      if (brd.crossSections[i]!.getPosition() <= brd.crossSections[i - 1]!.getPosition()) {
        issues.push("Cross-sections are out of station order.");
        break;
      }
    }
    return Array.from(new Set(issues));
  }, [brd]);

  const fixSectionOrder = useCallback(() => {
    brd.crossSections.sort((a, b) => a.getPosition() - b.getPosition());
    setSectionIndex((i) => Math.max(0, Math.min(i, brd.crossSections.length - 1)));
    setIsDirty(true);
    bumpBoardRevision();
    showToast("Sections sorted by station", "success");
  }, [brd, showToast]);

  useEffect(() => {
    const issues = computeGeometryIssues();
    setGeometryWarning(issues.length > 0 ? issues[0]! : null);
  }, [computeGeometryIssues, boardRevision]);

  const updateMetadata = useCallback(
    (patch: Partial<Pick<BezierBoard, "name" | "designer" | "comments" | "author">>) => {
      let changed = false;
      if (patch.name !== undefined && patch.name !== brd.name) {
        brd.name = patch.name;
        changed = true;
      }
      if (patch.designer !== undefined && patch.designer !== brd.designer) {
        brd.designer = patch.designer;
        changed = true;
      }
      if (patch.comments !== undefined && patch.comments !== brd.comments) {
        brd.comments = patch.comments;
        changed = true;
      }
      if (patch.author !== undefined && patch.author !== brd.author) {
        brd.author = patch.author;
        changed = true;
      }
      if (!changed) return;
      setIsDirty(true);
      bumpBoardRevision();
    },
    [brd, bumpBoardRevision],
  );

  const setCurrentUnits = useCallback(
    (u: number) => {
      if (brd.currentUnits === u) return;
      brd.currentUnits = u;
      setIsDirty(true);
      bumpBoardRevision();
    },
    [brd, bumpBoardRevision],
  );

  const modalOpen = aboutOpen || newBoardOpen || shortcutsOpen || brdHelpOpen || exportOpen;

  const setComparisonAsCurrent = useCallback(() => {
    // Use BRD round-trip text to keep this lightweight and consistent.
    const body = saveBrdToString(brd);
    const next = new BezierBoard();
    const bytes = new TextEncoder().encode(body);
    loadBrdFromBytes(next, bytes, "baseline://current");
    setComparisonBaseline(next);
    showToast("Comparison baseline set from current board", "success");
  }, [brd, showToast]);

  const applyAutoScale = useCallback(
    (v: {
      lengthScale: number;
      widthScale: number;
      thicknessScale: number;
      lockTailWidth: boolean;
      lockNoseRocker: boolean;
      lockTailRocker: boolean;
    }) => {
      const beforeLength = getBoardLengthJava(brd);
      if (
        !Number.isFinite(v.lengthScale) ||
        !Number.isFinite(v.widthScale) ||
        !Number.isFinite(v.thicknessScale) ||
        v.lengthScale <= 0 ||
        v.widthScale <= 0 ||
        v.thicknessScale <= 0
      ) {
        showToast("Scale factors must be positive numbers.", "error");
        return;
      }
      stack.push(
        new AutoScaleBoardCommand(brd, {
          lengthScale: v.lengthScale,
          widthScale: v.widthScale,
          thicknessScale: v.thicknessScale,
          locks: {
            lockTailWidth: v.lockTailWidth,
            lockNoseRocker: v.lockNoseRocker,
            lockTailRocker: v.lockTailRocker,
          },
        }),
      );
      bumpCmdNonce();
      setIsDirty(true);
      bumpBoardRevision();
      const afterLength = getBoardLengthJava(brd);
      showToast(
        `Auto scaling applied (${beforeLength.toFixed(1)} -> ${afterLength.toFixed(1)} mm length)`,
        "success",
      );
      trackUxEvent("board.autoscale.applied", {
        length: v.lengthScale,
        width: v.widthScale,
        thickness: v.thicknessScale,
        lockTailWidth: v.lockTailWidth,
        lockNoseRocker: v.lockNoseRocker,
        lockTailRocker: v.lockTailRocker,
      });
    },
    [brd, stack, showToast],
  );

  const createProject = useCallback((name: string) => {
    const created = createProjectRecord(name || brd.name || "Untitled project");
    const next = upsertProject(created);
    setProjectLibrary(next);
    setActiveProjectId(created.id);
  }, [brd.name]);

  const attachCurrentBoardToProject = useCallback((projectId: string) => {
    setActiveProjectId(projectId);
    const next = addProjectSnapshot(
      projectId,
      brd.name ? `${brd.name} (attached)` : "Attached board",
      saveBrdToString(brd),
    );
    setProjectLibrary(next);
    showToast("Board attached to project library", "success");
  }, [brd, showToast]);

  const createProjectSnapshot = useCallback((title: string) => {
    if (!activeProjectId) {
      showToast("Select a project before saving a snapshot.", "error");
      return;
    }
    const next = addProjectSnapshot(activeProjectId, title || brd.name || "Snapshot", saveBrdToString(brd));
    setProjectLibrary(next);
    setLastAutosaveRevision(boardRevision);
    showToast("Snapshot saved", "success");
  }, [activeProjectId, brd, boardRevision, showToast]);

  const openProjectSnapshot = useCallback((projectId: string, snapshotId: string) => {
    const project = projectLibrary.find((p) => p.id === projectId);
    if (!project) {
      showToast("Project not found.", "error");
      return;
    }
    const snapshot = project.snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) {
      showToast("Snapshot not found.", "error");
      return;
    }
    const next = new BezierBoard();
    const bytes = new TextEncoder().encode(snapshot.brdText);
    const result = loadBrdFromBytes(next, bytes, `project://${project.id}/${snapshot.id}`);
    if (result !== 0) {
      showToast("Could not open project snapshot.", "error");
      return;
    }
    stack.clear();
    bumpCmdNonce();
    setBrd(next);
    setPath(null);
    setSectionIndex(firstDrawableCrossSectionIndex(next));
    setSelectedControlPoint(null);
    setSelectedControlPointKind(null);
    setActiveProjectId(project.id);
    setIsDirty(false);
    setLastAutosaveRevision(boardRevision);
    setEmptyGuidedStep(null);
    bumpBoardRevision();
    showToast(`Opened project snapshot: ${snapshot.title}`, "success");
  }, [projectLibrary, showToast, stack, boardRevision]);

  const patchActiveProjectMetadata = useCallback((patch: {
    rider?: string;
    waveType?: string;
    autosaveEnabled?: boolean;
    autosaveIntervalSec?: number;
  }) => {
    if (!activeProjectId) return;
    const next = updateProjectMetadata(activeProjectId, patch);
    setProjectLibrary(next);
  }, [activeProjectId]);

  const applyFinTemplate = useCallback((templateId: "fcs2_thruster" | "futures_thruster") => {
    const len = Math.max(100, analytics.length);
    const rearOffset = templateId === "fcs2_thruster" ? 460 : 445;
    const centerOffset = 165;
    const baseY = templateId === "fcs2_thruster" ? 55 : 58;
    const sideX = Math.max(40, len - rearOffset);
    const centerX = Math.max(30, len - centerOffset);
    setFinLayout({
      template: templateId,
      boxes: [
        { x: sideX, y: baseY, cantDeg: 6, toeInDeg: 2.5 },
        { x: sideX, y: -baseY, cantDeg: 6, toeInDeg: 2.5 },
        { x: centerX, y: 0, cantDeg: 0, toeInDeg: 0 },
      ],
    });
    showToast(`Applied ${templateId === "fcs2_thruster" ? "FCS II" : "Futures"} fin template`, "success");
  }, [showToast, analytics.length]);

  const mirrorFinLayout = useCallback(() => {
    setFinLayout((prev) => ({
      ...prev,
      boxes: prev.boxes.map((b) => ({ ...b, y: -b.y })),
    }));
    showToast("Mirrored fin layout", "success");
  }, [showToast]);

  const applyFinAngles = useCallback((cantDeg: number, toeInDeg: number) => {
    setFinLayout((prev) => ({
      ...prev,
      boxes: prev.boxes.map((b) => ({ ...b, cantDeg, toeInDeg })),
    }));
    showToast("Applied cant/toe-in angles to all fin boxes", "success");
  }, [showToast]);

  const applyRailApexTuck = useCallback((apexShiftRatio: number, tuckDepthRatio: number) => {
    const cs = brd.crossSections[sectionIndex];
    if (!cs) {
      showToast("Select a valid cross-section first.", "error");
      return;
    }
    stack.push(new AdjustCrossSectionRailCommand(brd, sectionIndex, apexShiftRatio, tuckDepthRatio));
    bumpCmdNonce();
    setIsDirty(true);
    bumpBoardRevision();
    showToast("Rail apex/tuck adjustment applied", "success");
  }, [brd, sectionIndex, stack, showToast]);

  const generateCamPreview = useCallback(async () => {
    const len = Math.max(1, analytics.length);
    const points = Array.from({ length: 60 }, (_, i) => {
      const t = i / 59;
      const x = t * len;
      const z = analytics.samples[Math.min(analytics.samples.length - 1, Math.floor(t * (analytics.samples.length - 1)))]?.rocker ?? 0;
      return { x, y: 0, z, feed: 2200, rapid: i === 0 };
    });
    const preview = previewToolpath(points);
    setCamPreviewSummary(preview);
    const gcode = postProcessGcode(points, { id: "generic_3axis", spindleOn: "M3 S12000", spindleOff: "M5" });
    try {
      const outPath = await writeTextFromDialogPath(`${safeBoardFileBase(brd.name, "board")}.nc`, gcode);
      showToast(`CAM preview generated and G-code saved to ${outPath}`, "success");
    } catch (error) {
      const msg = formatFsError(error);
      setFileError(msg);
      showToast(`CAM preview generated, but G-code export failed: ${msg}`, "error");
    }
    trackUxEvent("cam.preview.generated", { points: points.length, warnings: preview.warnings.length });
  }, [analytics, brd.name, showToast]);

  useEffect(() => {
    if (!isDirty || !activeProjectId || !activeProject?.autosaveEnabled) return;
    if (lastAutosaveRevision === boardRevision) return;
    const intervalSec = Math.max(5, activeProject.autosaveIntervalSec ?? 30);
    const timer = window.setInterval(() => {
      if (lastAutosaveRevision === boardRevision) return;
      const title = `Autosave ${new Date().toLocaleTimeString()}`;
      const next = addProjectSnapshot(activeProjectId, title, saveBrdToString(brd));
      const marked = updateProjectMetadata(activeProjectId, { lastAutosaveAt: Date.now() });
      // marked already persisted; prefer it for state to include latest metadata.
      setProjectLibrary(marked.length > 0 ? marked : next);
      setLastAutosaveRevision(boardRevision);
    }, intervalSec * 1000);
    return () => window.clearInterval(timer);
  }, [
    isDirty,
    activeProjectId,
    activeProject?.autosaveEnabled,
    activeProject?.autosaveIntervalSec,
    boardRevision,
    lastAutosaveRevision,
    brd,
  ]);

  useHotkeys({
    modalOpen,
    onOpenExport: () => setExportOpen(true),
    onAddControlPoint: addControlPoint,
    onRemoveControlPoint: removeControlPoint,
    onToggleContinuity: toggleContinuity,
    onDuplicateSection: duplicateSection,
    onInterpolateSection: interpolateSection,
    onOpenBoard: openBoard,
    onSaveBoard: saveBoard,
    onSaveBoardAs: saveBoardAs,
    canUndo: () => stack.canUndo(),
    canRedo: () => stack.canRedo(),
    onUndo: doUndo,
    onRedo: doRedo,
  });

  const handleCanvasKeyPanZoom = useCallback(
    (
      e: React.KeyboardEvent<HTMLCanvasElement>,
      setZoom: React.Dispatch<React.SetStateAction<number>>,
      setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>,
    ) => {
      if (e.nativeEvent.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
      const key = e.key;
      if (key === "+" || key === "=") {
        e.preventDefault();
        setZoom((z) => clampZoom(z * 1.12));
        return;
      }
      if (key === "-" || key === "_") {
        e.preventDefault();
        setZoom((z) => clampZoom(z / 1.12));
        return;
      }
      if (key === "ArrowUp") {
        e.preventDefault();
        setPan((p) => ({ ...p, y: p.y + KEYBOARD_PAN_STEP_PX }));
        return;
      }
      if (key === "ArrowDown") {
        e.preventDefault();
        setPan((p) => ({ ...p, y: p.y - KEYBOARD_PAN_STEP_PX }));
        return;
      }
      if (key === "ArrowLeft") {
        e.preventDefault();
        setPan((p) => ({ ...p, x: p.x + KEYBOARD_PAN_STEP_PX }));
        return;
      }
      if (key === "ArrowRight") {
        e.preventDefault();
        setPan((p) => ({ ...p, x: p.x - KEYBOARD_PAN_STEP_PX }));
      }
    },
    [clampZoom],
  );

  const resetPlanView = useCallback(() => {
    setPlanZoom(1);
    setPlanPan({ x: 0, y: 0 });
    setResetViewPlanNonce((n) => n + 1);
  }, []);

  const resetProfileView = useCallback(() => {
    setProfileZoom(1);
    setProfilePan({ x: 0, y: 0 });
    setResetViewProfileNonce((n) => n + 1);
  }, []);

  const resetSectionView = useCallback(() => {
    setSectionZoom(1);
    setSectionPan({ x: 0, y: 0 });
    setResetViewSectionNonce((n) => n + 1);
  }, []);

  const reset2dViews = useCallback(() => {
    resetPlanView();
    resetProfileView();
    resetSectionView();
  }, [resetPlanView, resetProfileView, resetSectionView]);

  const reset3dView = useCallback(() => {
    setViewReset3dNonce((n) => n + 1);
  }, []);

  const resetAllViews = useCallback(() => {
    reset2dViews();
    reset3dView();
  }, [reset2dViews, reset3dView]);

  const canUndo = stack.canUndo();
  const canRedo = stack.canRedo();
  const editModeLabel =
    editMode === "outline"
      ? "Outline"
      : editMode === "deck"
        ? "Deck profile"
        : editMode === "bottom"
          ? "Bottom profile"
          : `Section #${sectionIndex + 1}`;
  const selectedPointLabel =
    selectedControlPoint == null
      ? "None"
      : `#${selectedControlPoint + 1}${
          selectedControlPointKind ? ` (${selectedControlPointKind})` : ""
        }`;
  const geometryIssues = computeGeometryIssues();
  const appShellStyle = {
    "--app-sidebar-width": `${sidebarWidth}px`,
  } as CSSProperties;

  const onSidebarResizeStart = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const root = appShellRef.current;
    if (!root) return;
    e.preventDefault();
    const pointerId = e.pointerId;
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    setIsResizingSidebar(true);
    e.currentTarget.setPointerCapture(pointerId);

    const onMove = (ev: PointerEvent) => {
      const delta = ev.clientX - startX;
      const next = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, startWidth + delta));
      setSidebarWidth(next);
    };
    const onUp = () => {
      setIsResizingSidebar(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }, [sidebarWidth]);

  return (
    <div className="app-shell" ref={appShellRef} style={appShellStyle}>
      <AppToolbar
        onNew={() => void newBoard()}
        onOpen={() => void openBoard()}
        recentFiles={settings.recentFiles}
        onOpenRecent={(p) => void openRecentPath(p)}
        onSave={() => void saveBoard()}
        onSaveAs={() => void saveBoardAs()}
        onExport={() => setExportOpen(true)}
        onUndo={doUndo}
        onRedo={doRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onFit2d={reset2dViews}
        onReset3d={reset3dView}
        onResetAllViews={resetAllViews}
        onKeyboardShortcuts={() => setShortcutsOpen(true)}
        onBrdFormatHelp={() => setBrdHelpOpen(true)}
        onAbout={() => setAboutOpen(true)}
        onQuickHelp={() => setShortcutsOpen(true)}
      />

      <AppSidebar
        brd={brd}
        overlays={overlays}
        setOverlays={setOverlays}
        sectionIndex={sectionIndex}
        setSectionIndex={setSectionIndex}
        editMode={editMode}
        setEditMode={setEditMode}
        onAddSection={addSection}
        onRemoveSection={removeSection}
        onSetSectionStation={setSectionStation}
        onDuplicateSection={duplicateSection}
        onInterpolateSection={interpolateSection}
        onMoveSectionEarlier={moveSectionEarlier}
        onMoveSectionLater={moveSectionLater}
        onAddSectionFromCurrentTemplate={addSectionFromCurrentTemplate}
        onSoftenRail={() => refineActiveSectionRail("soften")}
        onHardenRail={() => refineActiveSectionRail("harden")}
        referenceImages={referenceImages}
        onPickPlanReferenceImage={pickPlanReferenceImage}
        onPickProfileReferenceImage={pickProfileReferenceImage}
        onClearPlanReferenceImage={clearPlanReferenceImage}
        onClearProfileReferenceImage={clearProfileReferenceImage}
        onPatchPlanReference={patchPlanReference}
        onPatchProfileReference={patchProfileReference}
        selectedControlPoint={selectedControlPoint}
        selectedControlPointKind={selectedControlPointKind}
        selectedPointCoords={selectedPointCoords}
        onSetSelectedPointCoords={setSelectedPointCoords}
        onAddControlPoint={addControlPoint}
        onRemoveControlPoint={removeControlPoint}
        canRemoveControlPoint={currentSplinePointCount() > 2}
        onToggleContinuity={toggleContinuity}
        selectedHandleMode={selectedHandleMode}
        onSetHandleMode={setHandleMode}
        validationIssues={geometryIssues}
        onFixSectionOrder={fixSectionOrder}
        onApplyProfileShaping={applyProfileShaping}
        onAddPairedProfilePoint={addPairedProfilePoint}
        onMetadataChange={updateMetadata}
        onUnitsChange={setCurrentUnits}
        comparisonDelta={comparisonDelta}
        analytics={analytics}
        onSetComparisonBaseline={setComparisonAsCurrent}
        onClearComparisonBaseline={() => setComparisonBaseline(null)}
        onApplyAutoScale={applyAutoScale}
        projectLibrary={projectLibrary}
        activeProjectId={activeProjectId}
        activeProject={activeProject}
        onCreateProject={createProject}
        onAttachCurrentBoardToProject={attachCurrentBoardToProject}
        onCreateSnapshot={createProjectSnapshot}
        onOpenProjectSnapshot={openProjectSnapshot}
        onProjectMetadataChange={patchActiveProjectMetadata}
        qaIssues={qaIssues}
        finLayoutSummary={`${finLayout.template}, ${finLayout.boxes.length} boxes`}
        onApplyFinTemplate={applyFinTemplate}
        onMirrorFinLayout={mirrorFinLayout}
        onApplyFinAngles={applyFinAngles}
        curvatureScore={curvatureScore}
        railDiagnosticsText={railDiagnosticsText}
        onApplyRailApexTuck={applyRailApexTuck}
        camPreview={camPreviewSummary}
        onGenerateCamPreview={generateCamPreview}
        boardMaterialColor={boardMaterialColor}
        onBoardMaterialColorChange={setBoardMaterialColor}
        meshPreviewMode={meshPreviewMode}
        onMeshPreviewModeChange={setMeshPreviewMode}
        renderDebug={renderDebug}
        onRenderDebugChange={(patch) =>
          setRenderDebug((prev) => ({ ...prev, ...patch }))
        }
      />
      <div
        className="app-shell__sidebar-resize"
        role="separator"
        aria-label="Resize sidebar"
        aria-orientation="vertical"
        data-dragging={isResizingSidebar ? "true" : "false"}
        onPointerDown={onSidebarResizeStart}
      />

      <main className="workspace">
        <section className="workspace-context" aria-label="Current editing context">
          <span className="context-chip context-chip--active">
            Editing target: <strong>{editModeLabel}</strong>
          </span>
          <span className="context-chip">
            Selection: <strong>{selectedPointLabel}</strong>
          </span>
          <span className="context-chip">
            Status: <strong>{isDirty ? "Unsaved changes" : "Saved"}</strong>
          </span>
        </section>
        <ErrorBanner
          title={t("READBRDFAILEDTITLE_STR")}
          message={fileError}
          onDismiss={() => setFileError(null)}
        />
        <ErrorBanner
          title="Geometry warning"
          message={geometryWarning}
          tone="warning"
          onDismiss={() => setGeometryWarning(null)}
        />
        {emptyGuidedStep !== null ? (
          <EmptyGuidedBanner
            step={emptyGuidedStep}
            onNext={() => setEmptyGuidedStep((s) => (s === null ? s : Math.min(s + 1, 2)))}
            onDismiss={() => setEmptyGuidedStep(null)}
          />
        ) : null}
        <p id="plan-canvas-hint" className="visually-hidden">
          Plan canvas: drag points to edit. Pan with middle drag, alt drag, or touch drag.
          Use arrow keys to pan and plus/minus to zoom when focused.
        </p>
        <p id="profile-canvas-hint" className="visually-hidden">
          Profile canvas: drag points to edit. Pan with middle drag, alt drag, or touch drag.
          Use arrow keys to pan and plus/minus to zoom when focused.
        </p>
        <p id="section-canvas-hint" className="visually-hidden">
          Section canvas: drag points to edit. Pan with middle drag, alt drag, or touch drag.
          Use arrow keys to pan and plus/minus to zoom when focused.
        </p>
        <div className="workspace__main">
          <WorkspacePanels
            editMode={editMode}
            onSetEditMode={setEditMode}
            onResetPlanView={() => {
              resetPlanView();
            }}
            onResetProfileView={() => {
              resetProfileView();
            }}
            onResetSectionView={() => {
              resetSectionView();
            }}
            onReset3dView={() => reset3dView()}
            planCanvas={
              <canvas
                ref={canvasPlanRef}
                className="board-canvas board-canvas--interactive"
                width={640}
                height={260}
                aria-label="Plan view: board outline"
                aria-describedby="plan-canvas-hint"
                tabIndex={0}
                onPointerDown={canvasPtr.onPlanPointerDown}
                onPointerMove={canvasPtr.onPlanPointerMove}
                onPointerUp={canvasPtr.onPlanPointerUp}
                onPointerCancel={canvasPtr.onPlanPointerCancel}
                onLostPointerCapture={canvasPtr.onCanvasLostPointerCapture}
                onKeyDown={(e) => handleCanvasKeyPanZoom(e, setPlanZoom, setPlanPan)}
              />
            }
            profileCanvas={
              <canvas
                ref={canvasProfileRef}
                className="profile-canvas board-canvas--interactive"
                width={640}
                height={140}
                aria-label="Profile view: deck and bottom"
                aria-describedby="profile-canvas-hint"
                tabIndex={0}
                onPointerDown={canvasPtr.onProfilePointerDown}
                onPointerMove={canvasPtr.onProfilePointerMove}
                onPointerUp={canvasPtr.onProfilePointerUp}
                onPointerCancel={canvasPtr.onProfilePointerCancel}
                onLostPointerCapture={canvasPtr.onCanvasLostPointerCapture}
                onKeyDown={(e) => handleCanvasKeyPanZoom(e, setProfileZoom, setProfilePan)}
              />
            }
            sectionCanvas={
              <canvas
                ref={canvasSectionRef}
                className="section-canvas board-canvas--interactive"
                width={640}
                height={140}
                aria-label="Cross-section view"
                aria-describedby="section-canvas-hint"
                tabIndex={0}
                onPointerDown={canvasPtr.onSectionPointerDown}
                onPointerMove={canvasPtr.onSectionPointerMove}
                onPointerUp={canvasPtr.onSectionPointerUp}
                onPointerCancel={canvasPtr.onSectionPointerCancel}
                onLostPointerCapture={canvasPtr.onCanvasLostPointerCapture}
                onKeyDown={(e) => handleCanvasKeyPanZoom(e, setSectionZoom, setSectionPan)}
              />
            }
            threeCanvas={
              <div className="three-wrap">
                <Suspense
                  fallback={<div className="three-loading">Loading 3D…</div>}
                >
                  <BoardScene3D
                    outlineLowerXy={outlineLowerXy}
                    outlineUpperXy={outlineUpperXy}
                    loft={loftData}
                    showLoft={overlays.loft3d}
                    centerMm={centerMm}
                    isDark={isDark}
                    orbitRef={orbitRef}
                    viewResetNonce={viewReset3dNonce}
                    boardColor={boardMaterialColor}
                    scenePalette={scenePalette}
                    meshPreviewMode={meshPreviewMode}
                    renderDebug={renderDebug}
                  />
                </Suspense>
              </div>
            }
          />
        </div>
      </main>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />

      <NewBoardModal
        open={newBoardOpen}
        onClose={() => setNewBoardOpen(false)}
        onCreate={createNewBoardFromPreset}
      />

      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <BrdFormatHelpModal open={brdHelpOpen} onClose={() => setBrdHelpOpen(false)} />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={(f) => void performExport(f)}
      />

      <div className="toast-stack" aria-live="polite">
        {toast ? (
          <Toast
            message={toast.message}
            tone={toast.tone}
            onDismiss={() => setToast(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
