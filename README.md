# 🧰 DevPocket

**Everything a backend dev reaches for.** A local-first toolbox of everyday utilities — formatting payloads, decoding tokens, reading cron expressions, seeding test data.

Everything runs client-side in your browser. Nothing you paste in is ever sent to a server.

## Tools

**Data**
- **JSON / XML** — beautify, minify, validate, and search across keys/attributes/values with JSON-path style results.
- **JSON ⇄ YAML ⇄ CSV** — convert between the config and data formats you juggle daily.
- **JSON → Code** — generate TypeScript, Go, Java, Python or C# models from an API payload (nested types included).
- **YAML Formatter** — format, validate and tidy YAML, or strip every `#` comment without touching the hashes inside quoted strings, URLs and block scalars. Reports the line and column of a syntax error, and warns about tabs in the indentation.
- **SQL Formatter** — pretty-print or minify queries across 11 dialects (Postgres, MySQL, T-SQL, BigQuery, Oracle…).
- **Properties Viewer** — read a `.properties` file the way a parser does: three separator styles, escapes and line continuations decoded, duplicate keys and empty or whitespace-padded values flagged, every `${…}` placeholder checked against the file. Lists every key with its line, rewrites the file sorted or deduplicated without losing comments, and converts to nested YAML or JSON and back.
- **Properties Compare** — diff two `.properties` files by key and value rather than by line, so reordering, separator style and comments never show up as changes. Marks each key differs / only in A / only in B / identical, and copies the entries one side is missing as ready-to-paste `key=value` lines.

**Text**
- **Diff Checker** — line or word-level diff with add/remove stats.
- **Encode / Decode** — Base64, URL encoding, and MD5/SHA-1/256/384/512 hashing.
- **JWT & Color** — decode JWT header/payload (no signature verification), HEX/RGB/HSL conversion, px/rem/em/pt units.

**Time**
- **Time / UUID / Regex** — live multi-zone clocks (Local, **India IST**, **South Africa SAST**, UTC), Unix timestamp ⇄ date conversion shown in every zone, UUID v4 generation, and a live regex tester.
- **Cron Builder** — plain-English description of any cron expression, the next 8 run times (viewable in IST/SAST/UTC/local), and one-click presets.

**Reference**
- **SQL Query Guide** — 117 searchable entries covering SQL syntax, task recipes and the pitfalls that return a wrong answer without an error. Each has a syntax skeleton, a runnable example, the gotchas and dialect notes; every entry is its own link.
- **Docker & Swarm Guide** — 106 searchable entries: images, containers, Dockerfile, volumes, networking, Compose, and the Swarm half — services, rolling updates, stacks, secrets and placement. Command, example, what it does, the gotchas and the related commands.
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


## SEO

Each tool is a real, indexable URL (`/cron`, `/sql`, `/json-xml`…) rather than a hash fragment, so search engines can rank them individually.

`npm run build` runs three steps: the client build, a server build of `src/entry-server.jsx` into `dist-ssr/`, and `scripts/prerender.mjs`, which emits:

- **One static HTML file per route** with its own `<title>`, meta description, canonical URL, Open Graph tags and JSON-LD, and a body that is the real page — header, tool UI, guide, FAQ, related tools and footer — rendered by React at build time. The browser loads the route's chunk first and then renders the same tree, so there is no loading flash and the static and live pages (including the single `<h1>`) are identical.
- **`sitemap.xml`** listing all 13 URLs.
- **`robots.txt`** pointing at the sitemap.
- **`404.html`** so deep links resolve on GitHub Pages.
- **`<link rel="modulepreload">` tags** for each route's own chunks (read from `dist/.vite/manifest.json`), so a tool's code downloads alongside the app shell instead of after it.
- **`sw.js`**, the service worker: every page's HTML, the shell and each tool's chunks are precached, so the site works offline and is installable. It caches the site's own files only. Its cache name is a hash of the precached files, so each deploy replaces the old cache.

Copy for each route lives in one place: `src/lib/seo.js`. Its `heading` is the page's `<h1>` (rendered by `PageHeader`), the JSON-LD name and the breadcrumb, so they always agree; `h1` overrides it where the visible header must differ. Titles should stay within 60 characters and descriptions between 140 and 160.

### Adding a tool

1. Write the page in `src/pages/` and add its loader to `LOADERS` in `src/App.jsx` (the route is generated from it).
2. Add a one-line entry to `navItems` in `src/lib/nav.js`, and search words to `KEYWORDS` there.
3. Add its `src/lib/seo.js` entry: `title`, `description`, `heading`, `blurb`, a `deepDive` guide with a worked `example`, `howItWorks`, `useCases`, 3–5 `faq` entries, and `related` (4–6 routes). Without `related`, the page links to tools in its own menu group.

The build fails if a route is missing from any of the three tables.

### After deploying

1. Add the site at [Google Search Console](https://search.google.com/search-console) (verify via the DNS TXT record).
2. Submit `https://devpocket.in/sitemap.xml` under **Sitemaps**.
3. Use **URL Inspection → Request indexing** for the homepage to speed up first discovery.

Indexing typically takes a few days to a few weeks; ranking for competitive terms takes longer and depends on links from other sites.

## Caching (Cloudflare in front of GitHub Pages)

Every build renames its chunks (`JsonValidatorTool-<hash>.js`). If a browser or
Cloudflare keeps serving an old `index.html` or `sw.js`, that page asks for
chunks the new deploy no longer has, and you get a blank page. Cloudflare's
default Browser Cache TTL (4 hours, `max-age=14400`) overrides GitHub Pages'
own headers, which is exactly what went wrong. Set these once in the Cloudflare
dashboard for devpocket.in:

1. **Caching → Configuration → Browser Cache TTL:** *Respect Existing Headers*.
2. **Rules → Cache Rules → Create rule** "HTML and service worker":
   - When: `(http.request.uri.path eq "/") or ends_with(http.request.uri.path, "/") or ends_with(http.request.uri.path, ".html") or http.request.uri.path in {"/sw.js" "/assets-manifest.json" "/site.webmanifest"}`
   - Then: Cache eligibility *Bypass cache*.
3. **Rules → Cache Rules → Create rule** "Hashed assets":
   - When: `starts_with(http.request.uri.path, "/assets/")`
   - Then: *Eligible for cache*. Edge TTL: *Ignore cache-control header and use this TTL*, 1 year. Under *Status code TTL*, add 404 → *No cache* (a chunk that 404s during a deploy must not stay cached). Browser TTL: *Respect origin* (rule 4 sets the header).
4. **Rules → Transform Rules → Modify Response Header**, two rules (these set the header the browser sees):
   - Same match as rule 2 → *Set* `Cache-Control` = `no-cache`.
   - `starts_with(http.request.uri.path, "/assets/") and http.response.code eq 200` → *Set* `Cache-Control` = `public, max-age=31536000, immutable`.

`public/_headers` holds the same policy in the format Cloudflare Pages reads,
in case the site moves there. GitHub Pages ignores it.

The deploy workflow then does the rest on every push:

- **Keeps the previous release's chunks.** `scripts/keep-previous-assets.mjs`
  reads the live site's `assets-manifest.json` and copies its files into the
  new build, so a tab opened before the deploy still finds its chunks.
- **Purges Cloudflare.** The `purge-cloudflare` job calls the purge API. Add two
  repository secrets (Settings → Secrets and variables → Actions):
  `CLOUDFLARE_ZONE_ID` (on the zone's Overview page) and
  `CLOUDFLARE_API_TOKEN` (My Profile → API Tokens, permission *Zone → Cache
  Purge → Purge*, limited to devpocket.in). Without them the job only logs a
  warning.

In the app, a chunk that still fails to load triggers one automatic reload.
If that has already happened in the last minute, the page shows "A new version
is available — Reload" instead of going blank (`src/lib/reload.js`,
`src/components/ErrorBoundary.jsx`, and the inline script in `index.html` for
the entry chunk).

## Deploying to GitHub Pages

Deployment is automated — **GitHub builds and publishes the site itself on every push to `main`.** You never run a build or deploy command locally.

**One-time setup**

1. Create an empty repo on GitHub (no README/licence — this project has them).
2. Push your code:

   ```bash
   git init
   git add .
   git commit -m "DevPocket — local-first backend dev utilities"
   git remote add origin https://github.com/<your-username>/devpocket.git
   git branch -M main
   git push -u origin main
   ```

3. In the repo: **Settings → Pages → Build and deployment → Source: `GitHub Actions`**.
   (Select *GitHub Actions*, **not** "Deploy from a branch".)

That's it. The workflow in `.github/workflows/deploy.yml` runs automatically, and your site is live at:

```
https://<your-username>.github.io/devpocket/
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
