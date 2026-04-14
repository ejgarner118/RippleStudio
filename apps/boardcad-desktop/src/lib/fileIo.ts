const recentBoardCache = new Map<string, Uint8Array>();

export function formatFsError(e: unknown): string {
  if (e instanceof Error && e.message.trim()) return e.message;
  return String(e);
}

export function rememberRecentBoard(key: string, data: Uint8Array): void {
  recentBoardCache.set(key, data);
}

export function hasRecentBoard(key: string): boolean {
  return recentBoardCache.has(key);
}

export function buildRecentBoardKey(name: string): string {
  const safe = (name || "board").replace(/[^\w.-]+/g, "_");
  return `recent://${safe}-${Date.now()}.brd`;
}

function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.style.display = "none";
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    document.body.appendChild(input);
    input.click();
    window.setTimeout(() => input.remove(), 0);
  });
}

function triggerDownload(filename: string, body: BlobPart, type: string): void {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function openBoardFromPicker(): Promise<{ path: string; data: Uint8Array } | null> {
  const file = await pickFile(".brd");
  if (!file) return null;
  const data = new Uint8Array(await file.arrayBuffer());
  return { path: buildRecentBoardKey(file.name), data };
}

export async function readBoardFileBytes(
  selected: string,
): Promise<{ path: string; data: Uint8Array }> {
  const data = recentBoardCache.get(selected);
  if (!data) throw new Error("Recent board data is no longer available. Re-open the file.");
  return { path: selected, data };
}

export async function readBytesFromPath(path: string): Promise<Uint8Array> {
  const resp = await fetch(path, { cache: "no-store" });
  if (!resp.ok) throw new Error(`Failed to load ${path}: ${resp.status} ${resp.statusText}`);
  return new Uint8Array(await resp.arrayBuffer());
}

export async function writeTextFromDialogPath(
  selected: string,
  body: string,
): Promise<string> {
  triggerDownload(selected, body, "text/plain;charset=utf-8");
  return selected;
}

export async function writeBytesFromDialogPath(
  selected: string,
  body: Uint8Array,
): Promise<string> {
  triggerDownload(selected, body, "application/octet-stream");
  return selected;
}
