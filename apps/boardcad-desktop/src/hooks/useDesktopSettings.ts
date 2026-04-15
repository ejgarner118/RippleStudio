import { useCallback, useEffect, useMemo, useState } from "react";
import {
  defaultBoardCadSettings,
  loadSettingsJson,
  saveSettingsJson,
  type BoardCadSettings,
} from "@boardcad/core";

const STORAGE_KEY = "ripple.desktop.settings.v1";
const LEGACY_STORAGE_KEYS = [
  "boardcadport.desktop.settings.v1",
  "boardcad.desktop.settings.v1",
] as const;

function readStored(): BoardCadSettings {
  if (typeof localStorage === "undefined") return defaultBoardCadSettings();
  const next = localStorage.getItem(STORAGE_KEY);
  let raw: string | null = next;
  if (!raw) {
    for (const k of LEGACY_STORAGE_KEYS) {
      const v = localStorage.getItem(k);
      if (v) {
        raw = v;
        break;
      }
    }
  }
  const s = loadSettingsJson(raw);
  if (!next && raw) {
    localStorage.setItem(STORAGE_KEY, saveSettingsJson(s));
  }
  return s;
}

function writeStored(s: BoardCadSettings): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, saveSettingsJson(s));
}

export type ResolvedTheme = "light" | "dark";

export function useDesktopSettings() {
  const [settings, setSettingsState] = useState<BoardCadSettings>(() => ({
    ...readStored(),
    theme: "dark" as const,
  }));

  const setSettings = useCallback((patch: Partial<BoardCadSettings>) => {
    setSettingsState((prev) => {
      // Theme switching is intentionally locked to dark for site/app parity.
      const next: BoardCadSettings = { ...prev, ...patch, theme: "dark" };
      writeStored(next);
      return next;
    });
  }, []);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    return "dark";
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  return { settings, setSettings, resolvedTheme };
}
