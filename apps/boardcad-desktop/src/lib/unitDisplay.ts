/** Format a stored model coordinate for display (values are already in file units). */
export function formatBoardCoordinate(value: number, currentUnits: number): string {
  if (!Number.isFinite(value)) return "";
  const decimals = currentUnits === 2 ? 4 : currentUnits === 1 ? 2 : 2;
  return value.toFixed(decimals);
}
