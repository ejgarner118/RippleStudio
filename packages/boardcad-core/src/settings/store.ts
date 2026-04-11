/** Serializable app settings (desktop port; maps legacy Java preference keys where relevant). */
export type BoardCadSettings = {
  theme: "system" | "light" | "dark";
  locale: string;
  recentFiles: string[];
  lookAndFeelIndex: number;
};

const defaultSettings: BoardCadSettings = {
  theme: "system",
  locale: "en",
  recentFiles: [],
  lookAndFeelIndex: 0,
};

export function defaultBoardCadSettings(): BoardCadSettings {
  return { ...defaultSettings, recentFiles: [] };
}

export function loadSettingsJson(raw: string | null): BoardCadSettings {
  if (!raw) return defaultBoardCadSettings();
  try {
    const o = JSON.parse(raw) as Partial<BoardCadSettings>;
    return {
      ...defaultSettings,
      ...o,
      recentFiles: Array.isArray(o.recentFiles) ? o.recentFiles : [],
    };
  } catch {
    return defaultBoardCadSettings();
  }
}

export function saveSettingsJson(s: BoardCadSettings): string {
  return JSON.stringify(s, null, 2);
}
