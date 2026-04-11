import { normalize } from "@tauri-apps/api/path";

/**
 * Dialog paths may be `file://` URLs. Plugin-fs expects a normalized OS path.
 */
export async function filePathFromDialog(path: string): Promise<string> {
  const trimmed = path.trim();
  if (!trimmed) return trimmed;

  let candidate = trimmed;
  if (trimmed.startsWith("file:")) {
    try {
      const u = new URL(trimmed);
      let p = decodeURIComponent(u.pathname.replace(/\+/g, "%20"));
      // Windows: file:///C:/Users/... → pathname "/C:/Users/..."
      if (/^\/[A-Za-z]:\//.test(p)) {
        p = p.slice(1);
      }
      candidate = p;
    } catch {
      candidate = trimmed;
    }
  }

  try {
    return await normalize(candidate);
  } catch {
    return candidate;
  }
}
