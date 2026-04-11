/** Mirrors `cadcore.BezierSpline` numeric constants from the Java reference sources. */
export const BS_ZERO = 1e-10;
export const BS_ONE = 1 - 1e-10;

export const BS_ANGLE_TOLERANCE = 0.05 * (Math.PI / 180); // ~0.05° in rad (Java uses DEG_TO_RAD)
export const BS_ANGLE_T_TOLERANCE = 0.000002;
export const BS_ANGLE_MAX_ITERATIONS = 50;
export const BS_ANGLE_SPLITS = 112;

export const BS_POS_TOLERANCE = 0.003; // 0.03 mm
export const BS_POS_MAX_ITERATIONS = 30;

export const BS_LENGTH_TOLERANCE = 0.001;

export const BS_MIN_MAX_TOLERANCE = 0.0001;
export const BS_MIN_MAX_SPLITS = 96;

export const BS_X = 0;
export const BS_Y = 1;
export const BS_MIN = 0;
export const BS_MAX = 1;

/** Java clamps X inside surface evaluation. */
export const SURFACE_X_CLAMP_LOW = 0.1;
export const SURFACE_X_OFFSET_NORMAL = 0.1;
export const SURFACE_S_OFFSET_NORMAL = 0.01;
