import { useEffect, useRef } from "react";
import type { BoardCadSettings } from "@boardcad/core";
import { APP_DISPLAY_NAME } from "../constants/brand";

export function closeMenus() {
  document
    .querySelectorAll<HTMLDetailsElement>(".menubar details.menu[open]")
    .forEach((d) => {
      d.open = false;
    });
}

type AppToolbarProps = {
  onNew: () => void;
  onOpen: () => void;
  recentFiles: string[];
  onOpenRecent: (path: string) => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onFit2d: () => void;
  onReset3d: () => void;
  onResetAllViews: () => void;
  theme: BoardCadSettings["theme"];
  onThemeChange: (theme: BoardCadSettings["theme"]) => void;
  onKeyboardShortcuts: () => void;
  onBrdFormatHelp: () => void;
  onAbout: () => void;
};

function fileNameFromPath(p: string): string {
  const s = p.replace(/\\/g, "/");
  const i = s.lastIndexOf("/");
  return i >= 0 ? s.slice(i + 1) : s;
}

export function AppToolbar({
  onNew,
  onOpen,
  recentFiles,
  onOpenRecent,
  onSave,
  onSaveAs,
  onExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onFit2d,
  onReset3d,
  onResetAllViews,
  theme,
  onThemeChange,
  onKeyboardShortcuts,
  onBrdFormatHelp,
  onAbout,
}: AppToolbarProps) {
  const menubarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = e.target;
      if (!(el instanceof Node)) return;
      if (menubarRef.current?.contains(el)) return;
      closeMenus();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  useEffect(() => {
    const nav = menubarRef.current;
    if (!nav) return;
    const onToggle = (e: Event) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      const opened = t.closest("details.menu") as HTMLDetailsElement | null;
      if (!opened?.open) return;
      nav.querySelectorAll<HTMLDetailsElement>("details.menu[open]").forEach((d) => {
        if (d !== opened) d.open = false;
      });
    };
    nav.addEventListener("toggle", onToggle, true);
    return () => nav.removeEventListener("toggle", onToggle, true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement
      ) {
        return;
      }
      closeMenus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="app-toolbar">
      <div className="app-toolbar__brand">
        <img
          className="app-toolbar__logo"
          src="/app-icon.svg"
          alt=""
          width={28}
          height={28}
        />
        <span className="app-toolbar__name">{APP_DISPLAY_NAME}</span>
      </div>

      <nav ref={menubarRef} className="menubar" aria-label="Application menu">
        <details className="menu">
          <summary className="menu__trigger">File</summary>
          <ul className="menu__list" role="menu">
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={() => {
                  closeMenus();
                  onNew();
                }}
              >
                New board
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                aria-keyshortcuts="Control+O"
                title="Open a .brd file"
                onClick={() => {
                  closeMenus();
                  onOpen();
                }}
              >
                Open… <span className="menu__kbd">Ctrl+O</span>
              </button>
            </li>
            <li className="menu__sep" role="separator" />
            <li role="none" className="menu__label">
              Open recent
            </li>
            {recentFiles.length === 0 ? (
              <li role="none" className="menu__hint">
                No recent files
              </li>
            ) : (
              recentFiles.map((p) => (
                <li key={p} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className="menu__item menu__item--recent"
                    title={p}
                    onClick={() => {
                      closeMenus();
                      onOpenRecent(p);
                    }}
                  >
                    {fileNameFromPath(p)}
                  </button>
                </li>
              ))
            )}
            <li className="menu__sep" role="separator" />
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                aria-keyshortcuts="Control+S"
                title="Save the current board"
                onClick={() => {
                  closeMenus();
                  onSave();
                }}
              >
                Save <span className="menu__kbd">Ctrl+S</span>
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                aria-keyshortcuts="Control+Shift+S"
                title="Save under a new file name"
                onClick={() => {
                  closeMenus();
                  onSaveAs();
                }}
              >
                Save as… <span className="menu__kbd">Ctrl+Shift+S</span>
              </button>
            </li>
            <li className="menu__sep" role="separator" />
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                aria-keyshortcuts="Alt+E"
                title="STL, OBJ, or SVG export"
                onClick={() => {
                  closeMenus();
                  onExport();
                }}
              >
                Export… <span className="menu__kbd">Alt+E</span>
              </button>
            </li>
          </ul>
        </details>

        <details className="menu">
          <summary className="menu__trigger">Edit</summary>
          <ul className="menu__list" role="menu">
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                disabled={!canUndo}
                aria-keyshortcuts="Control+Z"
                onClick={() => {
                  closeMenus();
                  onUndo();
                }}
              >
                Undo <span className="menu__kbd">Ctrl+Z</span>
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                disabled={!canRedo}
                aria-keyshortcuts="Control+Y"
                onClick={() => {
                  closeMenus();
                  onRedo();
                }}
              >
                Redo <span className="menu__kbd">Ctrl+Y</span>
              </button>
            </li>
          </ul>
        </details>

        <details className="menu">
          <summary className="menu__trigger">View</summary>
          <ul className="menu__list" role="menu">
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={() => {
                  closeMenus();
                  onFit2d();
                }}
              >
                Fit 2D views
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={() => {
                  closeMenus();
                  onReset3d();
                }}
              >
                Reset 3D view
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={() => {
                  closeMenus();
                  onResetAllViews();
                }}
              >
                Reset all views
              </button>
            </li>
            <li className="menu__sep" role="separator" />
            <li role="none" className="menu__label">
              Theme
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={() => {
                  closeMenus();
                  onThemeChange("system");
                }}
              >
                {theme === "system" ? "✓ " : ""}
                Match system
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={() => {
                  closeMenus();
                  onThemeChange("light");
                }}
              >
                {theme === "light" ? "✓ " : ""}
                Light
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={() => {
                  closeMenus();
                  onThemeChange("dark");
                }}
              >
                {theme === "dark" ? "✓ " : ""}
                Dark
              </button>
            </li>
          </ul>
        </details>

        <details className="menu">
          <summary className="menu__trigger">Help</summary>
          <ul className="menu__list" role="menu">
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={() => {
                  closeMenus();
                  onKeyboardShortcuts();
                }}
              >
                Keyboard shortcuts…
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={() => {
                  closeMenus();
                  onBrdFormatHelp();
                }}
              >
                About <code>.brd</code> files…
              </button>
            </li>
            <li className="menu__sep" role="separator" />
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={() => {
                  closeMenus();
                  onAbout();
                }}
              >
                About {APP_DISPLAY_NAME}…
              </button>
            </li>
          </ul>
        </details>
      </nav>
    </header>
  );
}
