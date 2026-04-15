import { useEffect, useRef } from "react";
import type { BoardCadSettings } from "@boardcad/core";
import { APP_DISPLAY_NAME } from "../constants/brand";
import { primaryModifierLabel } from "../lib/keyboardGuards";

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
  onQuickHelp: () => void;
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
  onQuickHelp,
}: AppToolbarProps) {
  const menubarRef = useRef<HTMLElement | null>(null);
  const mod = primaryModifierLabel();

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

  useEffect(() => {
    const nav = menubarRef.current;
    if (!nav) return;
    const triggers = Array.from(nav.querySelectorAll<HTMLElement>("details.menu > summary.menu__trigger"));
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const target = e.target;
      if (!(target instanceof HTMLElement) || target.tagName !== "SUMMARY") return;
      const i = triggers.indexOf(target);
      if (i < 0 || triggers.length < 2) return;
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = (i + dir + triggers.length) % triggers.length;
      triggers[next]?.focus();
    };
    nav.addEventListener("keydown", onKeyDown);
    return () => nav.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="app-toolbar">
      <div className="app-toolbar__brand">
        <img
          className="app-toolbar__logo"
          src="/branding/RS_LogoBoard100.png"
          alt=""
          width={28}
          height={28}
          onError={(e) => {
            e.currentTarget.src = "/app-icon.svg";
          }}
        />
        <span className="app-toolbar__name">{APP_DISPLAY_NAME}</span>
      </div>

      <nav ref={menubarRef} className="menubar" aria-label="Application menu" role="menubar">
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
                aria-keyshortcuts="Control+O Meta+O"
                title="Open a .brd file"
                onClick={() => {
                  closeMenus();
                  onOpen();
                }}
              >
                Import .brd… <span className="menu__kbd">{mod}+O</span>
              </button>
            </li>
            <li className="menu__sep" role="separator" />
            <li className="menu__label" role="none">
              Open recent
            </li>
            {recentFiles.length === 0 ? (
              <li className="menu__hint" role="none">
                No recent session files
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
                aria-keyshortcuts="Control+S Meta+S"
                title="Save the current board"
                onClick={() => {
                  closeMenus();
                  onSave();
                }}
              >
                Download .brd <span className="menu__kbd">{mod}+S</span>
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                aria-keyshortcuts="Control+Shift+S Meta+Shift+S"
                title="Save under a new file name"
                onClick={() => {
                  closeMenus();
                  onSaveAs();
                }}
              >
                Download as… <span className="menu__kbd">{mod}+Shift+S</span>
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
                aria-keyshortcuts="Control+Z Meta+Z"
                onClick={() => {
                  closeMenus();
                  onUndo();
                }}
              >
                Undo <span className="menu__kbd">{mod}+Z</span>
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                disabled={!canRedo}
                aria-keyshortcuts="Control+Y Meta+Y Control+Shift+Z Meta+Shift+Z"
                onClick={() => {
                  closeMenus();
                  onRedo();
                }}
              >
                Redo <span className="menu__kbd">{mod}+Y / {mod}+Shift+Z</span>
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
                Reset 2D framing
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
                Reset all views (2D + 3D)
              </button>
            </li>
            <li className="menu__sep" role="separator" />
            <li className="menu__label" role="none">
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
                BRD format help…
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
      <button
        type="button"
        className="icon-btn app-toolbar__quick-help"
        aria-label="Open keyboard shortcuts"
        title="Keyboard shortcuts and editing help"
        onClick={() => {
          closeMenus();
          onQuickHelp();
        }}
      >
        ?
      </button>
    </header>
  );
}
