export function getExtension(filename: string): string {
  const i = filename.lastIndexOf(".");
  if (i > 0 && i < filename.length - 1) {
    return filename.slice(i + 1).toLowerCase();
  }
  return "";
}

export function setExtension(filename: string, ext: string): string {
  const i = filename.lastIndexOf(".");
  const base = i > 0 ? filename.slice(0, i + 1) : filename + ".";
  return base + ext;
}
