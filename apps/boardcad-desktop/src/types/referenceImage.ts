/** Underlay reference image for plan or profile canvas (tail = smaller board X, nose = larger X). */
export type ReferenceImageLayer = {
  enabled: boolean;
  opacity: number;
  /** `blob:` or `data:` URL from file picker; revoked when replaced. */
  objectUrl: string | null;
  flipX: boolean;
  /** Offset as fraction of view bounds width (roughly -0.5..0.5). */
  offsetNormX: number;
  /** Offset as fraction of view bounds height. */
  offsetNormY: number;
  /** Extra scale on top of "fit inside bounds". */
  scale: number;
  /** Rotation in degrees (CCW in canvas; 0 = image up matches board Y-up half-plane). */
  rotationDeg: number;
};

export function defaultReferenceImageLayer(): ReferenceImageLayer {
  return {
    enabled: true,
    opacity: 0.38,
    objectUrl: null,
    flipX: false,
    offsetNormX: 0,
    offsetNormY: 0,
    scale: 1,
    rotationDeg: 0,
  };
}

export type ReferenceImageState = {
  plan: ReferenceImageLayer;
  profile: ReferenceImageLayer;
};

export function defaultReferenceImageState(): ReferenceImageState {
  return {
    plan: defaultReferenceImageLayer(),
    profile: defaultReferenceImageLayer(),
  };
}
