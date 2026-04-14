import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useReducer,
  useRef,
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
import { useWindowCloseGuard } from "./hooks/useWindowCloseGuard";
import { confirmDiscardUnsaved } from "./lib/confirmDiscard";
import { isTypingContext } from "./lib/keyboardGuards";
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
import { defaultOverlays, type OverlayState } from "./types/overlays";
import {
  defaultReferenceImageLayer,
  defaultReferenceImageState,
  type ReferenceImageLayer,
  type ReferenceImageState,
} from "./types/referenceImage";
import type { BoardEditMode } from "./types/editMode";
import { APP_WINDOW_TITLE_SUFFIX } from "./constants/brand";
import "./App.css";

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
  const [planRefImg, setPlanRefImg] = useState<HTMLImageElement | null>(null);
  const [profileRefImg, setProfileRefImg] = useState<HTMLImageElement | null>(null);

  const orbitRef = useRef<OrbitControlsApi | null>(null);

  const canvasPlanRef = useRef<HTMLCanvasElement>(null);
  const canvasProfileRef = useRef<HTMLCanvasElement>(null);
  const canvasSectionRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setLocale("en");
  }, []);

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
  } = useBoardGeometry(brd, sectionIndex, overlays, boardRevision);

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
  }, [brd.name, isDirty]);

  useEffect(() => {
    setSectionIndex((i) => {
      const n = brd.crossSections.length;
      if (n === 0) return 0;
      return Math.min(i, n - 1);
    });
  }, [brd.crossSections.length]);

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
    [brd, showToast, pushRecent],
  );

  const saveBoard = useCallback(async () => {
    setFileError(null);
    if (path) {
      await saveBoardToPath(path);
      return;
    }
    const dest = `${safeBoardFileBase(brd.name, "board")}.brd`;
    await saveBoardToPath(dest);
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
      pushRecent(saved.path);
      showToast(
        saved.method === "picker" ? `Saved via file picker: ${saved.path}` : `Downloaded ${saved.path}`,
        "success",
      );
    } catch (e) {
      const msg = formatFsError(e);
      setFileError(msg);
      showToast(msg, "error");
    }
  }, [brd, pushRecent, showToast]);

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
          2,
          q(x, 0, 2, xPeak, Math.max(v.maxThickness, 5), len, 2),
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      if (isTypingContext(e.target)) return;
      if (modalOpen) return;
      const k = e.key.toLowerCase();
      if (!e.ctrlKey && !e.metaKey && e.repeat) {
        if (k === "a" || k === "c" || k === "d" || k === "i") return;
        if (e.key === "Delete" || e.key === "Backspace") return;
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey && k === "e") {
        e.preventDefault();
        setExportOpen(true);
        return;
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey && k === "a") {
        e.preventDefault();
        addControlPoint();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        removeControlPoint();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey && k === "c") {
        e.preventDefault();
        toggleContinuity();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && e.shiftKey && k === "d") {
        e.preventDefault();
        duplicateSection();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && e.shiftKey && k === "i") {
        e.preventDefault();
        interpolateSection();
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (k === "o") {
        e.preventDefault();
        void openBoard();
      }
      if (k === "s" && !e.shiftKey) {
        e.preventDefault();
        void saveBoard();
      }
      if (k === "s" && e.shiftKey) {
        e.preventDefault();
        void saveBoardAs();
      }
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        if (stack.canUndo()) doUndo();
      }
      if (k === "y" || (k === "z" && e.shiftKey)) {
        e.preventDefault();
        if (stack.canRedo()) doRedo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    openBoard,
    saveBoard,
    saveBoardAs,
    stack,
    doUndo,
    doRedo,
    isDirty,
    addControlPoint,
    removeControlPoint,
    toggleContinuity,
    duplicateSection,
    interpolateSection,
    modalOpen,
  ]);

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

  return (
    <div className="app-shell">
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
        theme={settings.theme}
        onThemeChange={(theme) => setSettings({ theme })}
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
