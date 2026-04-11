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
  createDefaultCrossSection,
  createStarterBoard,
  exportBoardObj,
  exportBoardStlAscii,
  exportBoardStlBinary,
  firstDrawableCrossSectionIndex,
  getBrdReadError,
  loadBrdFromBytes,
  renderPrintSvg,
  saveBrdToString,
  addRecentFilePath,
  RemoveCrossSectionCommand,
  SetCrossSectionPositionCommand,
  setLocale,
  t,
  type LocaleId,
} from "@boardcad/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  FILTER_BRD,
  FILTER_OBJ,
  FILTER_STL,
  FILTER_STL_ASCII,
  FILTER_SVG,
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
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import {
  ExportModal,
  type DesktopExportFormat,
} from "./components/ExportModal";
import { ErrorBanner } from "./components/ErrorBanner";
import { Toast, type ToastTone } from "./components/Toast";
import { WorkspacePanels } from "./components/WorkspacePanels";
import { PLAN_PAD_PX, PROFILE_PAD_PX } from "./constants";
import { useBoardCanvasEditing } from "./hooks/useBoardCanvasEditing";
import { useBoardGeometry } from "./hooks/useBoardGeometry";
import { useDesktopSettings } from "./hooks/useDesktopSettings";
import { useWindowCloseGuard } from "./hooks/useWindowCloseGuard";
import { confirmDiscardUnsaved } from "./lib/confirmDiscard";
import {
  formatFsError,
  readBoardFileBytes,
  writeBytesFromDialogPath,
  writeTextFromDialogPath,
} from "./lib/fileIo";
import { requestTauriWindowClose } from "./lib/requestTauriWindowClose";
import { defaultOverlays, type OverlayState } from "./types/overlays";
import type { BoardEditMode } from "./types/editMode";
import { APP_WINDOW_TITLE_SUFFIX } from "./constants/brand";
import "./App.css";

const BoardScene3D = lazy(async () => {
  const m = await import("./board3d/BoardScene3D");
  return { default: m.BoardScene3D };
});

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
  const [overlays, setOverlays] = useState<OverlayState>(defaultOverlays);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [brdHelpOpen, setBrdHelpOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: ToastTone;
  } | null>(null);
  const [fit2dNonce, setFit2dNonce] = useState(0);
  const [viewReset3dNonce, setViewReset3dNonce] = useState(0);

  const orbitRef = useRef<OrbitControlsApi | null>(null);

  const canvasPlanRef = useRef<HTMLCanvasElement>(null);
  const canvasProfileRef = useRef<HTMLCanvasElement>(null);
  const canvasSectionRef = useRef<HTMLCanvasElement>(null);

  const locale = settings.locale as LocaleId;

  useEffect(() => {
    setLocale(locale);
  }, [locale]);

  useEffect(() => {
    if (editMode === "deck") {
      setOverlays((o) => ({ ...o, profileDeck: true }));
    }
    if (editMode === "bottom") {
      setOverlays((o) => ({ ...o, profileBottom: true }));
    }
  }, [editMode]);

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
    bumpBoardRevision,
    bumpCmdNonce,
    setDirty: setIsDirty,
  });

  useWindowCloseGuard(isDirty);

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
    );
  }, [
    brd,
    planBounds,
    outlineLowerXy,
    outlineUpperXy,
    overlays,
    fit2dNonce,
    boardRevision,
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
    );
  }, [
    brd,
    deckXy,
    bottomXy,
    profileStringerBounds,
    overlays,
    fit2dNonce,
    boardRevision,
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
    );
  }, [
    brd,
    sectionIndex,
    profileXy,
    profileBounds,
    overlays,
    fit2dNonce,
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
          stack.clear();
          bumpCmdNonce();
          setBrd(next);
          setPath(path);
          setSectionIndex(firstDrawableCrossSectionIndex(next));
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

  const openBoard = useCallback(async () => {
    if (isDirty && !(await confirmDiscardUnsaved())) return;
    const selected = await open({
      multiple: false,
      filters: [FILTER_BRD],
    });
    if (selected === null || Array.isArray(selected)) return;
    await loadBoardFromPath(selected);
  }, [isDirty, loadBoardFromPath]);

  const openRecentPath = useCallback(
    async (p: string) => {
      if (isDirty && !(await confirmDiscardUnsaved())) return;
      await loadBoardFromPath(p);
    },
    [isDirty, loadBoardFromPath],
  );

  const newBoard = useCallback(async () => {
    if (isDirty && !(await confirmDiscardUnsaved())) return;
    stack.clear();
    bumpCmdNonce();
    setBrd(createStarterBoard());
    setPath(null);
    setSectionIndex(0);
    setIsDirty(false);
    bumpBoardRevision();
    showToast("New board", "success");
  }, [isDirty, showToast, stack]);

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
    const dest = await save({
      filters: [FILTER_BRD],
      defaultPath: `${safeBoardFileBase(brd.name, "board")}.brd`,
    });
    if (!dest) return;
    await saveBoardToPath(dest);
  }, [brd.name, path, saveBoardToPath]);

  const saveBoardAs = useCallback(async () => {
    setFileError(null);
    const dest = await save({
      filters: [FILTER_BRD],
      defaultPath: `${safeBoardFileBase(brd.name, "board")}.brd`,
    });
    if (!dest) return;
    await saveBoardToPath(dest);
  }, [brd.name, saveBoardToPath]);

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
          const dest = await save({
            filters: [FILTER_STL],
            defaultPath: `${base}.stl`,
          });
          if (!dest) return;
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
          const dest = await save({
            filters: [FILTER_STL_ASCII],
            defaultPath: `${base}.stl`,
          });
          if (!dest) return;
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
          const dest = await save({
            filters: [FILTER_OBJ],
            defaultPath: `${base}.obj`,
          });
          if (!dest) return;
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
        const dest = await save({
          filters: [FILTER_SVG],
          defaultPath: `${safeBoardFileBase(brd.name, slug)}.svg`,
        });
        if (!dest) return;
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

  const onLocaleChange = useCallback(
    (loc: LocaleId) => {
      setSettings({ locale: loc });
      setLocale(loc);
    },
    [setSettings],
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        return;
      }
      const k = e.key.toLowerCase();
      if (e.altKey && !e.ctrlKey && !e.metaKey && k === "e") {
        e.preventDefault();
        setExportOpen(true);
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
      if (k === "w") {
        e.preventDefault();
        void requestTauriWindowClose(isDirty);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openBoard, saveBoard, saveBoardAs, stack, doUndo, doRedo, isDirty]);

  const canUndo = stack.canUndo();
  const canRedo = stack.canRedo();

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
        onFit2d={() => setFit2dNonce((n) => n + 1)}
        onReset3d={() => setViewReset3dNonce((n) => n + 1)}
        locale={locale}
        onLocaleChange={onLocaleChange}
        theme={settings.theme}
        onThemeChange={(theme) => setSettings({ theme })}
        onKeyboardShortcuts={() => setShortcutsOpen(true)}
        onBrdFormatHelp={() => setBrdHelpOpen(true)}
        onAbout={() => setAboutOpen(true)}
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
        onMetadataChange={updateMetadata}
        onUnitsChange={setCurrentUnits}
      />

      <main className="workspace">
        <ErrorBanner
          title={t("READBRDFAILEDTITLE_STR")}
          message={fileError}
          onDismiss={() => setFileError(null)}
        />
        <div className="workspace__main">
          <WorkspacePanels
            planCanvas={
              <canvas
                ref={canvasPlanRef}
                className="board-canvas board-canvas--interactive"
                width={640}
                height={260}
                aria-label="Plan view: board outline"
                onPointerDown={canvasPtr.onPlanPointerDown}
                onPointerMove={canvasPtr.onPlanPointerMove}
                onPointerUp={canvasPtr.onPlanPointerUp}
                onPointerCancel={canvasPtr.onPlanPointerCancel}
              />
            }
            profileCanvas={
              <canvas
                ref={canvasProfileRef}
                className="profile-canvas board-canvas--interactive"
                width={640}
                height={140}
                aria-label="Profile view: deck and bottom"
                onPointerDown={canvasPtr.onProfilePointerDown}
                onPointerMove={canvasPtr.onProfilePointerMove}
                onPointerUp={canvasPtr.onProfilePointerUp}
                onPointerCancel={canvasPtr.onProfilePointerCancel}
              />
            }
            sectionCanvas={
              <canvas
                ref={canvasSectionRef}
                className="section-canvas board-canvas--interactive"
                width={640}
                height={140}
                aria-label="Cross-section view"
                onPointerDown={canvasPtr.onSectionPointerDown}
                onPointerMove={canvasPtr.onSectionPointerMove}
                onPointerUp={canvasPtr.onSectionPointerUp}
                onPointerCancel={canvasPtr.onSectionPointerCancel}
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
