/** Canonical production origin for SEO, OG URLs, and JSON-LD. Override with `VITE_SITE_URL` in `.env`. */
export function getSiteUrl(): string {
  const raw = import.meta.env.VITE_SITE_URL as string | undefined;
  const trimmed = raw?.trim().replace(/\/+$/, "");
  return trimmed || "https://www.ripplestudio.app";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
