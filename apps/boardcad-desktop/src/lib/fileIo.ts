import { readFile, writeFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { filePathFromDialog } from "./fsPath";

export function formatFsError(e: unknown): string {
  if (e instanceof Error && e.message.trim()) return e.message;
  return String(e);
}

export async function readBoardFileBytes(
  selected: string,
): Promise<{ path: string; data: Uint8Array }> {
  const path = await filePathFromDialog(selected);
  const data = await readFile(path);
  return { path, data };
}

export async function writeTextFromDialogPath(
  selected: string,
  body: string,
): Promise<string> {
  const p = await filePathFromDialog(selected);
  await writeTextFile(p, body);
  return p;
}

export async function writeBytesFromDialogPath(
  selected: string,
  body: Uint8Array,
): Promise<string> {
  const p = await filePathFromDialog(selected);
  await writeFile(p, body);
  return p;
}
