export type OverlayState = {
  grid: boolean;
  controlPoints: boolean;
  guidePoints: boolean;
  ghost: boolean;
  profileDeck: boolean;
  profileBottom: boolean;
  loft3d: boolean;
};

export const defaultOverlays = (): OverlayState => ({
  grid: true,
  controlPoints: true,
  guidePoints: false,
  ghost: false,
  profileDeck: true,
  profileBottom: true,
  loft3d: true,
});
