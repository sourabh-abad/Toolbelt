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
- Light / dark theme toggle (remembers your choice), recently-used tools, toast notifications, and drag-to-resize split panes on the input/output tools.


## Deploying to GitHub Pages

The app is a static SPA using `HashRouter` and a relative base path, so it runs from any subpath with no server-side routing config.

**One-time setup**

1. Create an empty repo on GitHub (no README/licence — this project already has one).
2. Point your local repo at it and push:

   ```bash
   git remote add origin https://github.com/<your-username>/toolbelt.git
   git branch -M main
   git push -u origin main
   ```

**Deploy**

```bash
npm install      # first time only, installs gh-pages
npm run deploy   # builds, then pushes dist/ to the gh-pages branch
```

3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, then pick branch `gh-pages` / folder `/ (root)` and save.

Your app goes live at `https://<your-username>.github.io/toolbelt/` (allow a minute on the first deploy). Re-run `npm run deploy` any time to publish changes.

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
