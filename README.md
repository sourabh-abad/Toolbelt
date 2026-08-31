# 🧰 Toolbelt

**Everything a backend dev reaches for.** A local-first toolbox of everyday utilities — formatting payloads, decoding tokens, reading cron expressions, seeding test data.

Everything runs client-side in your browser. Nothing you paste in is ever sent to a server.

## Tools

**Data**
- **JSON / XML** — beautify, minify, validate, and search across keys/attributes/values with JSON-path style results.
- **JSON ⇄ YAML ⇄ CSV** — convert between the config and data formats you juggle daily.
- **JSON → Code** — generate TypeScript, Go, Java, Python or C# models from an API payload (nested types included).
- **SQL Formatter** — pretty-print or minify queries across 11 dialects (Postgres, MySQL, T-SQL, BigQuery, Oracle…).

**Text**
- **Diff Checker** — line or word-level diff with add/remove stats.
- **Encode / Decode** — Base64, URL encoding, and MD5/SHA-1/256/384/512 hashing.
- **JWT & Color** — decode JWT header/payload (no signature verification), HEX/RGB/HSL conversion, px/rem/em/pt units.

**Time**
- **Time / UUID / Regex** — live multi-zone clocks (Local, **India IST**, **South Africa SAST**, UTC), Unix timestamp ⇄ date conversion shown in every zone, UUID v4 generation, and a live regex tester.
- **Cron Builder** — plain-English description of any cron expression, the next 8 run times (viewable in IST/SAST/UTC/local), and one-click presets.

**Reference**
- **HTTP Reference** — searchable status codes, methods (safe/idempotent flags) and common headers.
- **Mock Data** — generate fake records from 21 field types, output as JSON, CSV or SQL `INSERT` statements.

## Interface

- **⌘K / Ctrl+K** — command palette to jump to any tool (arrow keys + Enter).
- **⌘\ / Ctrl+\** — collapse the sidebar to icons.
- Light / dark theme toggle (remembers your choice), recently-used tools, toast notifications, and drag-to-resize split panes.
- **Responsive** — the sidebar becomes a slide-out drawer on phones and tablets, panels stack, tap targets grow.
- **Accessible** — full keyboard navigation, visible focus rings, skip-to-content link, ARIA labels on icon-only controls, and `prefers-reduced-motion` respected throughout.
- **Share-ready** — Open Graph and Twitter card metadata plus a generated `og.png`, so links unfurl properly in Slack, WhatsApp, LinkedIn and X. Includes JSON-LD structured data for search engines.

## Made by

**Sourabh Kumar** — Backend Developer

[GitHub](https://github.com/sourabh-abad) · [LinkedIn](https://www.linkedin.com/in/sourabh-kumar-12859374/) · [X](https://x.com/sourabhabad) · [Email](mailto:sourabhabad@gmail.com)

Profile details live in `src/lib/profile.js` — edit that one file and the About page and sidebar update automatically. Links with an empty `url` are hidden rather than rendered broken.

## Deploying to GitHub Pages

Deployment is automated — **GitHub builds and publishes the site itself on every push to `main`.** You never run a build or deploy command locally.

**One-time setup**

1. Create an empty repo on GitHub (no README/licence — this project has them).
2. Push your code:

   ```bash
   git init
   git add .
   git commit -m "Toolbelt — local-first backend dev utilities"
   git remote add origin https://github.com/<your-username>/toolbelt.git
   git branch -M main
   git push -u origin main
   ```

3. In the repo: **Settings → Pages → Build and deployment → Source: `GitHub Actions`**.
   (Select *GitHub Actions*, **not** "Deploy from a branch".)

That's it. The workflow in `.github/workflows/deploy.yml` runs automatically, and your site is live at:

```
https://<your-username>.github.io/toolbelt/
```

**From then on**

```bash
git push        # builds and deploys automatically
```

Watch progress in the repo's **Actions** tab. You can also re-run a deploy by hand there via *Deploy to GitHub Pages → Run workflow*.

> Commit your `package-lock.json` — the workflow uses `npm ci` for reproducible builds (it falls back to `npm install` if the lockfile is missing).

**Optional: manual deploy**

An `npm run deploy` script (via `gh-pages`) is also included if you ever want to publish from your machine instead. It pushes to a `gh-pages` branch, which requires switching the Pages source to that branch — so pick one approach or the other, not both.

## Getting started

```bash
npm install
npm run dev       # http://localhost:7777
npm run build     # production build -> dist/
npm run preview   # preview the production build
```

> **Note:** if you ever see a `Cannot find native binding` error from Vite/rolldown, `node_modules` was installed for a different OS. Fix it with:
> ```bash
> rm -rf node_modules package-lock.json && npm install
> ```

Built with React, React Router and Tailwind CSS v4 on Vite. Routes are code-split, so heavy tools (the SQL formatter, YAML parser) load on demand. The build uses a relative base path and `HashRouter`, so `dist/` can be hosted as static files from any subpath — GitHub Pages, Vercel, Netlify, S3 — with no server-side routing config.
