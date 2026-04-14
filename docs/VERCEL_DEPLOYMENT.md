# Vercel Deployment and Domain Go-Live

This repository now deploys as a web app from `apps/boardcad-desktop` (workspace name `boardcad-web`).

## 1) Create the Vercel Project

1. Push the repository to GitHub/GitLab/Bitbucket.
2. In Vercel, click **Add New Project** and import this repo.
3. Vercel should detect `vercel.json` at the repo root. Confirm:
   - Install Command: `npm ci`
   - Build Command: `npm run web:build`
   - Output Directory: `apps/boardcad-desktop/dist`
4. Deploy once to produce a preview URL.

## 2) Verify Preview Deployments

- Open any pull request and confirm Vercel creates a Preview deployment.
- Run smoke checks on the preview URL:
  - Open a `.brd` file
  - Edit in plan/profile/section
  - Export STL/OBJ/SVG/BRD
  - Reload page and verify app boots cleanly

## 3) Attach the Purchased Domain

1. In Vercel project settings, open **Domains**.
2. Add the purchased domain.
3. Copy the DNS records Vercel requests and add them at your registrar.
4. Wait for DNS propagation and certificate issuance.

## 4) Canonical Domain and Redirects

- Choose one canonical host (apex or `www`).
- In Vercel domain settings, configure redirect from the secondary host to the canonical host.
- Ensure HTTPS is enabled and default.

## 5) Production Go-Live Checklist

- Confirm latest `main` is green in CI.
- Promote or deploy latest production build in Vercel.
- Validate on custom domain:
  - New board flow
  - File open/import
  - Save/download and export downloads
  - 2D/3D interactions and reset controls
  - Unsaved-change warning on refresh/close
- Validate mobile viewport does not break the UI shell.

## 6) Post-Launch Monitoring

- Watch Vercel deployment logs for build/runtime warnings.
- Track browser console errors in production.
- Keep rollback path: redeploy previous successful Vercel deployment if needed.
