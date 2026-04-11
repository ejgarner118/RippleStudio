import type { DialogFilter } from "@tauri-apps/plugin-dialog";

export const FILTER_BRD: DialogFilter = {
  name: "Surfboard board (.brd)",
  extensions: ["brd"],
};

export const FILTER_STL: DialogFilter = {
  name: "STL (binary)",
  extensions: ["stl"],
};

export const FILTER_STL_ASCII: DialogFilter = {
  name: "STL (ASCII)",
  extensions: ["stl"],
};

export const FILTER_OBJ: DialogFilter = {
  name: "Wavefront OBJ",
  extensions: ["obj"],
};

export const FILTER_SVG: DialogFilter = {
  name: "SVG",
  extensions: ["svg"],
};

/** Safe default filename segment from board name. */
export function safeBoardFileBase(name: string | undefined, fallback: string): string {
  const raw = (name ?? "").trim() || fallback;
  return raw.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 120) || fallback;
}
