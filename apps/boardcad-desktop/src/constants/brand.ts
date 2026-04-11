/** Product display name (toolbar, dialogs, window title suffix). */
export const APP_DISPLAY_NAME = "Ripple Studio";

/** Suffix in the window title after the board name, e.g. "MyBoard — Ripple Studio". */
export const APP_WINDOW_TITLE_SUFFIX = APP_DISPLAY_NAME;

/** Kept in sync with `package.json` / `tauri.conf.json` via Vite `define`. */
export const APP_VERSION_LABEL = import.meta.env.VITE_APP_VERSION;
