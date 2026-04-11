/** Add `path` to the front of `recent`, dedupe, cap length (default 10). */
export function addRecentFilePath(
  recent: string[],
  path: string,
  max = 10,
): string[] {
  const trimmed = path.trim();
  if (!trimmed) return recent;
  const rest = recent.filter((p) => p !== trimmed);
  return [trimmed, ...rest].slice(0, max);
}
