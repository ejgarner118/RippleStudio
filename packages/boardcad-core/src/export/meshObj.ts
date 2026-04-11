/** Wavefront OBJ (1-based vertex indices, triangular faces). */
export function meshToObj(
  positions: Float32Array,
  indices: Uint32Array,
  name = "board",
): string {
  const lines: string[] = [`o ${name}`];
  const n = positions.length / 3;
  for (let i = 0; i < n; i++) {
    const x = positions[i * 3]!;
    const y = positions[i * 3 + 1]!;
    const z = positions[i * 3 + 2]!;
    lines.push(`v ${x} ${y} ${z}`);
  }
  const triCount = indices.length / 3;
  for (let t = 0; t < triCount; t++) {
    const a = indices[t * 3]! + 1;
    const b = indices[t * 3 + 1]! + 1;
    const c = indices[t * 3 + 2]! + 1;
    lines.push(`f ${a} ${b} ${c}`);
  }
  return lines.join("\n");
}
