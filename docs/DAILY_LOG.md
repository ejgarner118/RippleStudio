# BoardCadPort Daily Log

This log tracks day-by-day project status, notable changes, and direction.

## How to use this file

- Add a new dated section each day.
- Summarize meaningful changes (features, fixes, architecture, UX, CI/release work).
- Include blockers/risks and next priorities.
- Keep commit-level details concise; use links/refs in PRs as needed.

---

## 2026-04-15 (initialized from git history)

### Summary
High-volume stabilization and modernization day focused on mesh reliability, editing workflow integrity, and web UX polish.

### Commit timeline (newest first)

- `059d9f9` — Modernize web 3D rendering with export-parity mesh mode and improved diagnostic controls.
- `090b6d3` — Realign tail meshing to BoardCAD Java strip/cap flow and remove singular fallback poles.
- `b1f2416` — Eliminate tail singularity collapse by adding non-zero tail patch closure and stronger overhang safeguards.
- `ccdff1b` — Fix tail mesh generation pipeline and split nose-vs-tail endpoint constraints.
- `3d098cf` — Fix multi-point control selection persistence and restore tail overhang in loft meshes.
- `e60923f` — Improve shaping reliability and workflow ergonomics across editing, analysis, and UI.
- `f3548a4` — Polish web pages with stronger visual hierarchy and refined navigation UX.
- `d24a674` — Fix modal click lock and add Home/About/Contact web pages.
- `e75d53f` — Fix New Board menu click handling and add project snapshot open workflow.
- `280838f` — Fix handle mode relinking when leaving independent mode.
- `58b3178` — Stabilize UI/UX overhaul interactions and ship production-ready workflow fixes.

### Themes for the day

- Mesh pipeline hardening around nose/tail behavior and parity alignment.
- UI interaction reliability and command/edit flow fixes.
- Navigation and page-level web UX improvements.
- Export/view consistency enhancements in 3D workflow.

### End-of-day status

- Active development velocity is high with rapid mesh- and UX-focused iteration.
- Mesh reliability remains a central area of change and validation.
- Core and app continue to evolve together under parity + usability goals.

### Suggested next-day checklist

- Re-validate critical board presets for nose/tail mesh integrity.
- Confirm export parity across STL/OBJ for complex outlines.
- Capture any regressions from interaction changes in targeted tests.
- Keep commit scopes focused (mesh vs UI vs workflow) for easier rollback/debug.

### Same-day update: live push — app shell, dark theme lock, deployment

**Summary (this session)**

- **App visual parity:** Expanded shared tokens (`tokens.css`), added `themePalettes.ts` for 2D canvas and 3D scene colors from semantic CSS variables; wired plan/profile/section renderers and `BoardScene3D` to shared palettes.
- **Site vs app CSS:** Namespaced marketing vs app primitives (e.g. `.site-shell` buttons vs `.app-shell` buttons) to prevent style collisions; `site.css` imports shared tokens and uses site semantic aliases.
- **Dark-only UX:** Removed View menu theme switching; `useDesktopSettings` forces `theme: "dark"` and `resolvedTheme: "dark"` so UI matches the marketing site without half-light/half-dark states.
- **Work areas:** Fixed light-tinted canvases/panels by stabilizing dark palette resolution (avoid first-paint light fallback) and aligning surfaces to dark tokens.
- **Sidebar:** Draggable resize handle between sidebar and workspace; width persisted in `localStorage` (clamped min/max); hidden on compact layout.
- **Buttons:** Default `.app-shell .btn` base styles aligned with dark surfaces (border, hover, text contrast) so plain `btn` + `btn--sm` variants match the theme.
- **Quality:** Lint, `boardcad-web` tests, and production build verified before push.

**Deployment**

- Commit `91139f9` pushed to `origin/main` (GitHub: `ejgarner118/RippleStudio`).
- Vercel production deployment succeeded; alias live at `https://www.ripplestudio.app` (inspect: Vercel project `eric-garners-projects/ripple-studio`).

### End-of-day: SEO optimization

- **Meta & social:** Rich `index.html` defaults (description, keywords, canonical, Open Graph, Twitter cards, theme-color, apple-touch-icon).
- **Structured data:** JSON-LD (`WebSite`, `Organization`, `SoftwareApplication`) for search engines.
- **Discovery:** `public/robots.txt` and `public/sitemap.xml` pointing at `https://www.ripplestudio.app`.
- **Runtime SEO:** `seo/siteUrl.ts` + `seo/documentSeo.ts` — per-route title/description/OG/Twitter/canonical updates for `/`, `/about`, `/contact`; app shell sets `/app` meta and syncs social titles when the board title changes. Optional `VITE_SITE_URL` in `.env.example`.
- **Accessibility:** Marketing header logo `alt` text set to “Ripple Studio”.
- Commit `0698899` pushed to `origin/main`; Vercel production redeployed after verification.

---

## 2026-04-14 (initialized from git history)

### Summary
Web-first migration and structural polish day, including templates/default-board updates and hull cap sealing work.

### Commit timeline (newest first)

- `505c4d7` — BoardCAD: inches UX, reference images, rail refine, editor fixes.
- `cb36e45` — Seal hull mesh tail/nose caps to strip boundary, add board-only branding, and ship web polish.
- `e4f09a8` — Polish UI/UX hierarchy and standardize 2D handle editing.
- `32f3321` — Update web templates and default startup board.
- `c44f8b6` — Migrate Ripple Studio to web-first Vercel deployment.

### Themes for the day

- Transition toward web-first operation and deployment.
- Refinement of shaping/editor interactions and units UX.
- Mesh closure improvements at hull caps.

### End-of-day status

- Platform direction (web-first) is established.
- Foundation set for rapid UX + mesh iteration seen on 2026-04-15.

---

## 2026-04-13 (initialized from git history)

### Summary
Release-oriented stabilization and 3D/navigation quality improvements.

### Commit timeline

- `c846c62` — chore(3d): keep computeWorldContentBox module-private.
- `49a1e19` — Release 0.1.3: workspace view resets, 3D navigation, templates, core fixes.

### End-of-day status

- Release 0.1.3 landed with meaningful UX and core fixes.

---

## 2026-04-10 (initialized from git history)

### Summary
Project setup and release automation foundation day.

### Commit timeline

- `f7a9bc2` — chore(release): v0.1.2
- `73b8c10` — ci: add Windows release workflow, CI verify, and release docs
- `d1ce011` — Initial commit: Ripple Studio monorepo

### End-of-day status

- Monorepo established.
- CI/release pathways established early, enabling rapid iteration cadence.

