/** Plan-view bbox center in file units (mm), used to center the 3D scene. */
export type CenterMm = { x: number; y: number };

export type LoftMeshData = {
  positions: Float32Array;
  indices: Uint32Array;
};
