export type FileFilter = {
  name: string;
  extensions: string[];
};

export const FILTER_BRD: FileFilter = {
  name: "Surfboard board (.brd)",
  extensions: ["brd"],
};

export const FILTER_STL: FileFilter = {
  name: "STL (binary)",
  extensions: ["stl"],
};

export const FILTER_STL_ASCII: FileFilter = {
  name: "STL (ASCII)",
  extensions: ["stl"],
};

export const FILTER_OBJ: FileFilter = {
  name: "Wavefront OBJ",
  extensions: ["obj"],
};

export const FILTER_SVG: FileFilter = {
  name: "SVG",
  extensions: ["svg"],
};

/** Safe default filename segment from board name. */
export function safeBoardFileBase(name: string | undefined, fallback: string): string {
  const raw = (name ?? "").trim() || fallback;
  return raw.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 120) || fallback;
}
