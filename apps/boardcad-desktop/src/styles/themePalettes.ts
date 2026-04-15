import type { ResolvedTheme } from "../hooks/useDesktopSettings";

type PaletteSource = Record<string, string>;

export type CanvasPalette = {
  planSurface: string;
  profileSurface: string;
  sectionSurface: string;
  grid: string;
  emptyText: string;
  outlineRail: string;
  outlineGhost: string;
  profileDeck: string;
  profileBottom: string;
  sectionRail: string;
  guidePoint: string;
  knotPrimary: string;
  knotSelected: string;
  knotHover: string;
  handle: string;
  handleSelected: string;
  handleHover: string;
  handleArm: string;
  finAccent: string;
};

export type ScenePalette = {
  background: string;
  outline: string;
  gridMajor: string;
  gridMinor: string;
  board: Record<"sage" | "ocean" | "sand" | "charcoal", string>;
};

const FALLBACK_LIGHT = {
  "--canvas-surface-plan": "#f4f4f8",
  "--canvas-surface-profile": "#f8f6ff",
  "--canvas-surface-section": "#faf8f5",
  "--canvas-grid": "#d4d8e2",
  "--canvas-empty-text": "#677389",
  "--canvas-outline-rail": "#1a5fb4",
  "--canvas-outline-ghost": "#9a9aaa",
  "--canvas-profile-deck": "#8b5a2b",
  "--canvas-profile-bottom": "#3d4f63",
  "--canvas-section-rail": "#2d6a4f",
  "--canvas-guide-point": "#3584e4",
  "--canvas-knot-primary": "#c01c28",
  "--canvas-knot-selected": "#2563eb",
  "--canvas-knot-hover": "#3b82f6",
  "--canvas-handle": "#f6ad55",
  "--canvas-handle-selected": "#f59e0b",
  "--canvas-handle-hover": "#fbbf24",
  "--canvas-handle-arm": "#8f4d00",
  "--canvas-fin-accent": "#d97b00",
  "--three-bg": "#e8ecf4",
  "--three-outline": "#1a5fb4",
  "--three-grid-major": "#b0b8c8",
  "--three-grid-minor": "#c8ccd8",
  "--three-board-sage": "#5a8f5a",
  "--three-board-ocean": "#3e7aa5",
  "--three-board-sand": "#b69e73",
  "--three-board-charcoal": "#4f545a",
} as const;

const FALLBACK_DARK = {
  "--canvas-surface-plan": "#1b212b",
  "--canvas-surface-profile": "#1d212c",
  "--canvas-surface-section": "#21252e",
  "--canvas-grid": "#3f4a5e",
  "--canvas-empty-text": "#a3b0c5",
  "--canvas-outline-rail": "#6ab0ff",
  "--canvas-outline-ghost": "#6e7992",
  "--canvas-profile-deck": "#e7b375",
  "--canvas-profile-bottom": "#9cb4cc",
  "--canvas-section-rail": "#72d4a8",
  "--canvas-guide-point": "#7fb6ff",
  "--canvas-knot-primary": "#f0627b",
  "--canvas-knot-selected": "#7fb6ff",
  "--canvas-knot-hover": "#9bcbff",
  "--canvas-handle": "#f6c186",
  "--canvas-handle-selected": "#ffcf72",
  "--canvas-handle-hover": "#ffdca0",
  "--canvas-handle-arm": "#be8f59",
  "--canvas-fin-accent": "#f0ab56",
  "--three-bg": "#1a1f28",
  "--three-outline": "#6ab0ff",
  "--three-grid-major": "#4a5568",
  "--three-grid-minor": "#3d4556",
  "--three-board-sage": "#7eb89a",
  "--three-board-ocean": "#5a9cc9",
  "--three-board-sand": "#ceb48a",
  "--three-board-charcoal": "#8f98a7",
} as const;

function sourceFromTheme(theme: ResolvedTheme): PaletteSource {
  // App theme is intentionally locked to dark. Returning dark fallbacks directly
  // guarantees stable palette resolution and avoids mixed-theme first render.
  if (theme === "dark") {
    return { ...FALLBACK_DARK };
  }
  if (typeof window === "undefined") {
    return { ...FALLBACK_LIGHT };
  }
  const style = getComputedStyle(document.documentElement);
  const fallback = FALLBACK_LIGHT;
  const source: PaletteSource = {};
  for (const [key, value] of Object.entries(fallback)) {
    source[key] = style.getPropertyValue(key).trim() || value;
  }
  return source;
}

export function getCanvasPalette(theme: ResolvedTheme): CanvasPalette {
  const source = sourceFromTheme(theme);
  return {
    planSurface: source["--canvas-surface-plan"],
    profileSurface: source["--canvas-surface-profile"],
    sectionSurface: source["--canvas-surface-section"],
    grid: source["--canvas-grid"],
    emptyText: source["--canvas-empty-text"],
    outlineRail: source["--canvas-outline-rail"],
    outlineGhost: source["--canvas-outline-ghost"],
    profileDeck: source["--canvas-profile-deck"],
    profileBottom: source["--canvas-profile-bottom"],
    sectionRail: source["--canvas-section-rail"],
    guidePoint: source["--canvas-guide-point"],
    knotPrimary: source["--canvas-knot-primary"],
    knotSelected: source["--canvas-knot-selected"],
    knotHover: source["--canvas-knot-hover"],
    handle: source["--canvas-handle"],
    handleSelected: source["--canvas-handle-selected"],
    handleHover: source["--canvas-handle-hover"],
    handleArm: source["--canvas-handle-arm"],
    finAccent: source["--canvas-fin-accent"],
  };
}

function toThreeColorHex(input: string): number {
  return Number.parseInt(input.replace("#", ""), 16);
}

export function getScenePalette(theme: ResolvedTheme): ScenePalette {
  const source = sourceFromTheme(theme);
  return {
    background: source["--three-bg"],
    outline: source["--three-outline"],
    gridMajor: source["--three-grid-major"],
    gridMinor: source["--three-grid-minor"],
    board: {
      sage: source["--three-board-sage"],
      ocean: source["--three-board-ocean"],
      sand: source["--three-board-sand"],
      charcoal: source["--three-board-charcoal"],
    },
  };
}

export function toSceneColorNumber(input: string): number {
  return toThreeColorHex(input);
}
