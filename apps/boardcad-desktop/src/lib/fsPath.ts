/** Legacy helper retained for compatibility in web mode. */
export async function filePathFromDialog(path: string): Promise<string> {
  return path.trim();
}
