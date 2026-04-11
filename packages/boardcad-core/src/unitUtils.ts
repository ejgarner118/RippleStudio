/** Port subset of cadcore.UnitUtils (mm/cm/in constants for UI + CAM). */
export const MILLIMETER_PR_CENTIMETER = 10;
export const INCH = 2.54;
export const INCHES_PR_FOOT = 12;
export const FOOT = INCH * INCHES_PR_FOOT;

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
