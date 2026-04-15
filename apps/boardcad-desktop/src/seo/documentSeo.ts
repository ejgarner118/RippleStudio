import { absoluteUrl } from "./siteUrl";

export type MarketingRoute = "/" | "/about" | "/contact";

type PageSeo = {
  title: string;
  description: string;
  /** Optional OG/Twitter image path under site root */
  imagePath?: string;
};

const DEFAULT_IMAGE = "/branding/RS_Logo250.png";

const PAGES: Record<MarketingRoute, PageSeo> = {
  "/": {
    title: "Ripple Studio — Cloud surfboard CAD & .brd editor",
    description:
      "Ripple Studio is a web-first surfboard design workspace: edit .brd files, refine rails and rocker, preview in 3D, and export mesh-ready geometry — built for modern shapers.",
    imagePath: DEFAULT_IMAGE,
  },
  "/about": {
    title: "About Ripple Studio — Surfboard design software",
    description:
      "Meet the team behind Ripple Studio: engineering-led surfboard CAD, precision geometry, and a shaping-first workflow for designers and craftspeople.",
    imagePath: "/founder/eric-garner.jpg",
  },
  "/contact": {
    title: "Contact & updates — Ripple Studio",
    description:
      "Join the Ripple Studio waitlist, request beta access, or email support. The full account portal is coming soon.",
    imagePath: DEFAULT_IMAGE,
  },
};

const APP_PAGE: PageSeo = {
  title: "Ripple Studio — Surfboard CAD workspace",
  description:
    "Design and edit surfboards in the browser: plan, profile, cross-sections, 3D loft preview, and export to STL/OBJ — Ripple Studio web app.",
  imagePath: DEFAULT_IMAGE,
};

function upsertMeta(attr: "name" | "property", key: string, content: string): void {
  if (typeof document === "undefined") return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string): void {
  if (typeof document === "undefined") return;
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function setOgImage(path: string): void {
  const url = absoluteUrl(path);
  upsertMeta("property", "og:image", url);
  upsertMeta("property", "og:image:secure_url", url);
  upsertMeta("name", "twitter:image", url);
}

/**
 * Updates title, description, canonical, Open Graph, and Twitter cards for marketing routes.
 */
export function applyMarketingRouteSeo(route: MarketingRoute): void {
  if (typeof document === "undefined") return;
  const page = PAGES[route];
  const canonical = absoluteUrl(route === "/" ? "/" : route);
  const imagePath = page.imagePath ?? DEFAULT_IMAGE;

  document.title = page.title;
  upsertMeta("name", "description", page.description);
  upsertMeta("name", "robots", "index,follow");
  setCanonical(canonical);

  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:site_name", "Ripple Studio");
  upsertMeta("property", "og:locale", "en_US");
  upsertMeta("property", "og:title", page.title);
  upsertMeta("property", "og:description", page.description);
  upsertMeta("property", "og:url", canonical);
  setOgImage(imagePath);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", page.title);
  upsertMeta("name", "twitter:description", page.description);
}

/**
 * Base SEO when the in-browser CAD app is mounted (`/app`). Document title may change when a board is open;
 * call {@link syncAppSocialTitleFromDocument} whenever `document.title` changes.
 */
export function applyAppShellSeo(): void {
  if (typeof document === "undefined") return;
  const page = APP_PAGE;
  const canonical = absoluteUrl("/app");

  upsertMeta("name", "description", page.description);
  upsertMeta("name", "robots", "index,follow");
  setCanonical(canonical);

  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:site_name", "Ripple Studio");
  upsertMeta("property", "og:locale", "en_US");
  upsertMeta("property", "og:title", page.title);
  upsertMeta("property", "og:description", page.description);
  upsertMeta("property", "og:url", canonical);
  setOgImage(page.imagePath ?? DEFAULT_IMAGE);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", page.title);
  upsertMeta("name", "twitter:description", page.description);
}

/** Keeps og/twitter titles aligned with the dynamic window title in the app. */
export function syncAppSocialTitleFromDocument(): void {
  if (typeof document === "undefined") return;
  const t = document.title;
  if (!t) return;
  upsertMeta("property", "og:title", t);
  upsertMeta("name", "twitter:title", t);
}
