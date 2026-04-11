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
  const [settings, setSettingsState] = useState<BoardCadSettings>(() => readStored());

  const setSettings = useCallback((patch: Partial<BoardCadSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      writeStored(next);
      return next;
    });
  }, []);

  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (settings.theme === "light") return "light";
    if (settings.theme === "dark") return "dark";
    return systemDark ? "dark" : "light";
  }, [settings.theme, systemDark]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  return { settings, setSettings, resolvedTheme };
}
