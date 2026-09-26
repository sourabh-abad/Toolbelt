# 🧰 DevPocket

**Everything a backend dev reaches for.** A local-first toolbox of everyday utilities — formatting payloads, decoding tokens, reading cron expressions, seeding test data.

Everything runs client-side in your browser. Nothing you paste in is ever sent to a server.

## Tools

**Encoding & tokens**
- **JWT Decoder** — decode a token (or a whole `Authorization: Bearer …` header), live expiry countdown, every claim explained, and local signature verification with Web Crypto: HS256/384/512 (plain or Base64 secret), RS/PS, ES and EdDSA from a PEM, certificate, JWK or pasted JWKS picked by `kid`. It never fetches a key URL.
- **JWT Encoder** — build and sign a token locally, with iat/exp quick-add and throwaway test keys.
- **Base64** — live encode/decode, Base64URL auto-detected, UTF-8 safe, files to Base64 and data: URIs, decoded bytes identified by magic bytes and downloadable.
- **URL Encode / Decode** — component or full-URI mode, space as `%20` or `+`, double-encoding detected.
- **Hash Generator** — MD5, SHA-1/256/384/512 of text or files, hex/HEX/Base64, checksum match and HMAC.
- **URL Parser** and **HTML Entities**.

**Formatters**
- **JSON Formatter** — output-first beautify/minify/sort, tree and search, and a lenient mode for JSONC (comments, trailing commas).
- **XML Formatter** — pretty-print/minify, well-formedness errors with line and column, collapsible tree, XPath and attribute search.
- **YAML Formatter** and **SQL Formatter** (11 dialects).

**Data & formats**
- **JSON ⇄ CSV** and **JSON ⇄ YAML** — four converter pages from one component, with swap direction, uploads, downloads and line/column errors.
- **Properties ⇄ YAML** — Spring Boot `application.properties` ⇄ `application.yml`, including `#---` profile documents, `[0]` lists, placeholders, comments and `\uXXXX` escapes.
- **JSON → Code**, **Properties Viewer**, **Properties Compare** and the **JSON Toolkit** (validator, viewer, sort, flatten, merge, JSONPath, schema generator and more).

**Text & time**
- **Regex Tester** — live highlighting, capture groups with positions (d flag), replace, cheat sheet; patterns run in a Web Worker that is stopped after 1 s.
- **Unix Timestamp Converter** — s/ms/µs/ns detected, any IANA zone (your list is remembered), ISO 8601 and RFC 2822, relative time, batch mode with CSV, code snippets.
- **Cron Builder**, **Diff Checker**, **Color & CSS Units**, **Case Converter**, **Number Base**, **Markdown Preview**.

**Generators & reference**
- **UUID Generator** (v4, v7, ULID, Nano ID, nil/max; up to 1,000; .txt/.csv/.json; inspector) and **UUID v7 Generator** (bit layout, v4 vs v7).
- **Mock Data**, **Password**, **Lorem Ipsum**, **SQL Query Guide**, **Docker & Swarm Guide**, **HTTP Reference**.

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

Each tool is a real, indexable URL (`/cron/`, `/sql/`, `/json-formatter/`…) rather than a hash fragment, so search engines can rank them individually.

`npm run build` runs four steps: the client build, a server build of `src/entry-server.jsx` into `dist-ssr/`, `scripts/prerender.mjs`, and `scripts/check-site.mjs`. The prerender emits:

- **One static HTML file per route** with its own `<title>`, meta description, canonical URL, Open Graph tags and JSON-LD, and a body that is the real page — header, tool UI, guide, FAQ, related tools and footer — rendered by React at build time. The browser loads the route's chunk first and then renders the same tree, so there is no loading flash and the static and live pages (including the single `<h1>`) are identical.
- **`sitemap.xml`** listing every page (redirect stubs excluded).
- **`robots.txt`** pointing at the sitemap.
- **`404.html`** so deep links resolve on GitHub Pages.
- **`<link rel="modulepreload">` tags** for each route's own chunks (read from `dist/.vite/manifest.json`), so a tool's code downloads alongside the app shell instead of after it.
- **`sw.js`**, the service worker: every page's HTML, the shell and each tool's chunks are precached, so the site works offline and is installable. It caches the site's own files only. Its cache name is a hash of the precached files, so each deploy replaces the old cache.

Copy for each route lives in `src/lib/seo.js`, or for newer pages in a module under `src/content/` that `seo.js` spreads in. Its `heading` is the page's `<h1>` (rendered by `PageHeader`), the JSON-LD name and the breadcrumb, so they always agree; `h1` overrides it where the visible header must differ. Titles should stay within 60 characters and descriptions between 140 and 160.

### Adding a tool

1. Write the page in `src/pages/` and add its loader to `LOADERS` in `src/App.jsx` (the route is generated from it).
2. Add a one-line entry to `navItems` in `src/lib/nav.js`, and search words to `KEYWORDS` there. That puts it in the header menu, ⌘K, the homepage and the footer.
3. Add its copy to a file in `src/content/`: `title`, `description`, `heading`, `blurb`, a `deepDive` guide (300+ words with 1–3 `[anchor](/route/)` links, a worked `example`, `gotchas`), `howItWorks`, `useCases`, 3–5 `faq` entries, and `related` as 4–6 `[route, reason]` pairs.

The build fails if a route is missing from any of the three tables, and `scripts/check-site.mjs` then fails it for: more or fewer than one `<h1>`, an `<h2>` repeating the `<h1>`, a duplicate title or description, a wrong canonical, a page missing from the sitemap, JSON-LD that does not parse, a related link to a missing page or a redirect stub, a tool linked from fewer than three other pages, two pages with the same related list, or any link to a retired URL. `node scripts/check-site.mjs --table` prints every page's title, H1 count, canonical, JSON-LD types and related links.

### Moved URLs

Retired slugs are listed once, in `src/lib/redirects.js` (old → new). From that one table:

- the app redirects old routes client-side, and saved favorites and recents are rewritten to the new paths in `localStorage`;
- the prerender writes a small stub at each old URL (canonical to the new page, `noindex, follow`, meta refresh and a visible link), kept out of the sitemap and ⌘K;
- `scripts/redirects-csv.mjs` writes **`cloudflare-bulk-redirects.csv`**, and the build fails if it is out of date.

GitHub Pages cannot send a 301, so import the CSV into Cloudflare once (it is already in Cloudflare's format: no header row, sources without a scheme so both http and https match): **Account → Bulk Redirects → Create Bulk Redirect List → Upload CSV**, then **Create Bulk Redirect Rule** using that list. Cloudflare then answers the old URLs with a real 301 before the request reaches Pages; the stubs remain as a fallback. Re-upload the file whenever `redirects.js` changes (`node scripts/redirects-csv.mjs` regenerates it).

### After deploying

1. Add the site at [Google Search Console](https://search.google.com/search-console) (verify via the DNS TXT record).
2. Submit `https://devpocket.in/sitemap.xml` under **Sitemaps**.
3. Use **URL Inspection → Request indexing** for the homepage to speed up first discovery.

Indexing typically takes a few days to a few weeks; ranking for competitive terms takes longer and depends on links from other sites.

## Caching (Cloudflare in front of GitHub Pages)

Every build renames its chunks (`JsonValidatorTool-<hash>.js`). If a browser or
Cloudflare keeps an old `index.html` or `sw.js`, that page asks for chunks the
new deploy no longer has and the tool never loads. Cloudflare's default Browser
Cache TTL (4 hours) overrides GitHub Pages' headers with `max-age=14400`, which
is what caused it.

The policy lives in `scripts/cloudflare-cache.mjs` and is applied through the
Cloudflare API — run it once from your machine:

```sh
export CLOUDFLARE_ZONE_ID=…      # devpocket.in → Overview → API → Zone ID
export CLOUDFLARE_API_TOKEN=…    # My Profile → API Tokens, limited to devpocket.in:
                                 # Zone Settings Edit, Cache Rules Edit,
                                 # Transform Rules Edit, Cache Purge Purge
node scripts/cloudflare-cache.mjs --dry-run   # see exactly what will be sent
node scripts/cloudflare-cache.mjs --apply     # apply it, then purge everything
node scripts/cloudflare-cache.mjs --verify    # check the live headers (no token needed)
```

It sets Browser Cache TTL to *Respect Existing Headers* and adds Cache Rules
and response-header rules so that:

| Response | Cache-Control | Cloudflare edge |
|---|---|---|
| HTML routes, `/sw.js`, manifests | `no-cache` | not cached |
| `/assets/*` (200) | `public, max-age=31536000, immutable` | cached 1 year |
| any 404 | `no-store` | not cached |

Its rules are tagged `devpocket:`; re-running replaces them and leaves any other
rule alone. `public/_headers` holds the same policy for Cloudflare Pages, in
case the site moves there (GitHub Pages ignores it).

The deploy workflow then does the rest on every push:

- **Keeps older chunks.** `scripts/keep-previous-assets.mjs` reads the live
  `assets-manifest.json` and copies the live release's files, plus anything it
  was still carrying from the last 7 days, into the new build. Two deploys in
  one afternoon still leave the first one's chunks in place.
- **Purges Cloudflare** and then checks the live headers. Add two repository
  secrets (Settings → Secrets and variables → Actions): `CLOUDFLARE_ZONE_ID`
  and `CLOUDFLARE_API_TOKEN` (for CI, *Cache Purge* is the only permission it
  needs). Without them the job logs a warning and skips.

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
