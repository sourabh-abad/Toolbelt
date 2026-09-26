/**
 * Post-build SEO step.
 *
 * Vite emits a single index.html. Search engines need one indexable URL per
 * tool, each with its own <title>, description and canonical tag — so this
 * writes a static HTML file per route (dist/cron/index.html, …) that shares
 * the same JS bundle but carries route-specific metadata. It also emits
 * sitemap.xml, robots.txt and the 404.html fallback GitHub Pages needs for
 * client-side routing.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

// Read the route table straight from the app so the two can't drift apart.
// Imported as real modules (seo.js pulls page copy in from src/content/).
const { SEO, SITE_ORIGIN, canonicalUrl } = await import(pathToFileURL(join(root, 'src/lib/seo.js')).href)
const { REDIRECTS } = await import(pathToFileURL(join(root, 'src/lib/redirects.js')).href)

const template = readFileSync(join(dist, 'index.html'), 'utf8')

// Route -> page module, parsed out of App.jsx's LOADERS table so adding a tool
// there can't leave a stale mapping here.
const appSrc = readFileSync(join(root, 'src/App.jsx'), 'utf8')
const ROUTE_SOURCE = { '/': 'src/pages/Home.jsx' }
for (const [, route, mod] of appSrc.matchAll(
  /'(\/[^']*)':\s*\(\)\s*=>\s*import\('\.\/([^']+)'\)/g
)) {
  ROUTE_SOURCE[route] = `src/${mod}.jsx`
}

// --- Route chunk preloads ----------------------------------------------
// The static HTML loads the app shell, and the shell then discovers it needs,
// say, JsonValidatorTool-*.js plus its helpers: a second round trip spent
// looking at a spinner. Listing the route's own chunks as modulepreload lets
// the browser fetch them in parallel with the shell.
const manifestPath = join(dist, '.vite/manifest.json')
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null
if (!manifest) console.warn('prerender: no .vite/manifest.json — skipping route modulepreload and service worker precache')

function chunkClosure(key, into = new Set()) {
  const entry = manifest?.[key]
  if (!entry || into.has(entry.file)) return into
  into.add(entry.file)
  for (const dep of entry.imports || []) chunkClosure(dep, into)
  return into
}
const entryKey = manifest && Object.keys(manifest).find((k) => manifest[k].isEntry)
const shellChunks = entryKey ? chunkClosure(entryKey) : new Set()

function routeAssets(pathname) {
  const src = ROUTE_SOURCE[pathname]
  if (!manifest || !src || !manifest[src]) return { js: [], css: [] }
  const js = [...chunkClosure(src)].filter((f) => !shellChunks.has(f))
  const css = (manifest[src].css || []).filter((f) => !(manifest[entryKey]?.css || []).includes(f))
  return { js, css }
}

function preloadTags(pathname) {
  const { js, css } = routeAssets(pathname)
  return [
    ...css.map((f) => `<link rel="stylesheet" crossorigin href="/${f}">`),
    ...js.map((f) => `<link rel="modulepreload" crossorigin href="/${f}">`),
  ].join('\n    ')
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

function faqLd(seo) {
  if (!seo.faq) return []
  return [
    {
      '@type': 'FAQPage',
      mainEntity: seo.faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ]
}

function buildLdJson(pathname, seo) {
  const url = canonicalUrl(pathname)
  if (pathname === '/') {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${SITE_ORIGIN}/#website`,
          url: `${SITE_ORIGIN}/`,
          name: 'DevPocket',
          description: seo.description,
        },
        {
          '@type': 'WebApplication',
          '@id': `${SITE_ORIGIN}/#app`,
          name: 'DevPocket',
          url: `${SITE_ORIGIN}/`,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          author: { '@type': 'Person', name: 'Sourabh Kumar', url: `${SITE_ORIGIN}/about/` },
        },
        ...faqLd(seo),
      ],
    })
  }

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        // WebApplication is schema.org's subtype of SoftwareApplication; both
        // are listed so parsers that only know the parent still match.
        '@type': ['WebApplication', 'SoftwareApplication'],
        name: seo.heading || seo.title,
        url,
        description: seo.description,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript. Runs entirely in the browser.',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author: { '@type': 'Person', name: 'Sourabh Kumar', url: `${SITE_ORIGIN}/about/` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_ORIGIN}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: seo.heading || seo.title,
            item: url,
          },
        ],
      },
      // Only when the route has an faq array. The same Q&A pairs are rendered
      // visibly by ToolContentSections — structured data must match the page.
      ...faqLd(seo),
    ],
  })
}

// The nav table lives in nav.js next to lucide icon imports, which can't be
// evaluated here — so the fields this file needs are read off the source text.
// One item per line is the format nav.js is written in and the assertion below
// fails the build if that ever stops holding.
const navSrc = readFileSync(join(root, 'src/lib/nav.js'), 'utf8')
const NAV = [
  ...navSrc.matchAll(
    /\{ to: '([^']+)', label: '([^']*)',[^}]*?group: (?:'([^']*)'|null), accent: '([^']*)', description: '([^']*)' \}/g
  ),
].map(([, to, label, group, accent, description]) => ({ to, label, group, accent, description }))
if (NAV.length < 20) throw new Error(`prerender: parsed only ${NAV.length} nav items from nav.js`)

// Routes live in three tables — App.jsx LOADERS (code), nav.js (menu, search)
// and seo.js (metadata and copy). A page missing from one of them is either
// unreachable, unlisted or unindexed, so fail the build instead of shipping it.
{
  const pages = Object.keys(ROUTE_SOURCE).filter((p) => p !== '/')
  const menu = new Set(NAV.map((n) => n.to))
  const OUTSIDE_MENU = new Set(['/about', '/privacy'])
  const problems = [
    ...pages.filter((p) => !SEO[p]).map((p) => `${p} has a page module but no seo.js entry`),
    ...Object.keys(SEO).filter((p) => p !== '/' && !ROUTE_SOURCE[p]).map((p) => `${p} has a seo.js entry but no route in App.jsx`),
    ...pages.filter((p) => !menu.has(p) && !OUTSIDE_MENU.has(p)).map((p) => `${p} is not in the nav.js menu`),
    ...[...menu].filter((p) => p !== '/' && !ROUTE_SOURCE[p]).map((p) => `${p} is in the menu but has no route`),
    ...Object.keys(REDIRECTS).filter((p) => ROUTE_SOURCE[p] || SEO[p]).map((p) => `${p} is retired in redirects.js but still a route`),
    ...Object.values(REDIRECTS).filter((p) => !ROUTE_SOURCE[p]).map((p) => `redirects.js points at ${p}, which is not a route`),
  ]
  try {
    execFileSync('node', [join(root, 'scripts/redirects-csv.mjs'), '--check'], { stdio: 'pipe' })
  } catch (e) {
    problems.push(String(e.stderr || e.message).trim())
  }
  if (problems.length) throw new Error(`prerender: route tables disagree:\n  ${problems.join('\n  ')}`)
}

// Internal hrefs use the trailing-slash form the canonical tags advertise, so
// the crawler follows links to exactly the URLs it is told to index.
const hrefFor = (to) => (to === '/' ? '/' : `${to}/`)

// Replaces whatever sits inside <div id="root"> — an empty div straight out of
// Vite, or a previously prerendered body. Matching the real closing tag rather
// than the literal `<div id="root"></div>` keeps `node scripts/prerender.mjs`
// safe to re-run without a rebuild in between.
function replaceRoot(html, inner) {
  const openTag = '<div id="root">'
  const start = html.indexOf(openTag)
  if (start === -1) throw new Error('prerender: <div id="root"> not found in dist/index.html')
  const from = start + openTag.length
  const tag = /<(\/?)div\b/gi
  tag.lastIndex = from
  let depth = 1
  let m
  while ((m = tag.exec(html)) !== null) {
    depth += m[1] ? -1 : 1
    if (depth === 0) return html.slice(0, from) + inner + html.slice(m.index)
  }
  throw new Error('prerender: unbalanced <div id="root">')
}

// The body of each page is the app itself, rendered at build time by
// src/entry-server.jsx (built to dist-ssr/ by `vite build --ssr`). Header,
// tool UI, guide, FAQ and footer are exactly what the browser renders, so
// the static page cannot drift from the live one.
const { render: renderApp } = await import(pathToFileURL(join(root, 'dist-ssr/entry-server.js')).href)

async function render(pathname, seo, { noindex = false, appUrl } = {}) {
  const url = canonicalUrl(pathname)
  let html = template

  html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(seo.title)}</title>`)
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[\s\S]*?(")/,
    (_m, a, b) => a + esc(seo.description) + b
  )
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    (_m, a, b) => a + url + b
  )
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, (_m, a, b) => a + url + b)

  // GitHub Pages serves this file under every unknown path, so without a robots
  // tag the same body is reachable at an unbounded number of URLs. The 404
  // status already keeps them out of the index; this makes it explicit for any
  // crawler that fetches the file directly.
  if (noindex) {
    html = html.replace(
      /(<link rel="canonical" href=")[^"]*(" \/>)/,
      '<meta name="robots" content="noindex, follow" />'
    )
  }
  html = html.replace(
    /(<meta property="og:title" content=")[^"]*(")/,
    (_m, a, b) => a + esc(seo.title) + b
  )
  html = html.replace(
    /(<meta\s+property="og:description"\s+content=")[\s\S]*?(")/,
    (_m, a, b) => a + esc(seo.description) + b
  )
  html = html.replace(
    /(<meta name="twitter:title" content=")[^"]*(")/,
    (_m, a, b) => a + esc(seo.title) + b
  )
  html = html.replace(
    /(<meta\s+name="twitter:description"\s+content=")[\s\S]*?(")/,
    (_m, a, b) => a + esc(seo.description) + b
  )
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    // A function, not a string: FAQ answers contain $& and $$, which a
    // replacement string would expand.
    () => `<script type="application/ld+json">${buildLdJson(pathname, seo).replace(/</g, '\\u003c')}</script>`
  )

  const body = await renderApp(appUrl || hrefFor(pathname))

  html = replaceRoot(html, body)

  const preloads = preloadTags(pathname)
  if (preloads) html = html.replace('</head>', () => `    ${preloads}
  </head>`)

  return html
}

const routes = Object.keys(SEO)
for (const pathname of routes) {
  const html = await render(pathname, SEO[pathname])
  if (pathname === '/') {
    writeFileSync(join(dist, 'index.html'), html)
  } else {
    const dir = join(dist, pathname.replace(/^\//, ''))
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), html)
  }
}

// GitHub Pages serves 404.html for unknown paths; handing it the app lets
// deep links work even before the per-route files are hit.
writeFileSync(
  join(dist, '404.html'),
  await render('/', { ...SEO['/'], title: 'Page not found — DevPocket' }, { noindex: true, appUrl: '/404/' })
)

// Retired URLs: a static page that redirects, plus a canonical pointing at the
// new location so search engines transfer rather than index a duplicate.
// GitHub Pages cannot issue 301s, so this is the closest equivalent.
// The table lives in src/lib/redirects.js; cloudflare-bulk-redirects.csv is
// generated from it for real 301s once imported into Cloudflare.
for (const [from, to] of Object.entries(REDIRECTS)) {
  const target = canonicalUrl(to)
  // Relative for the redirect itself, so it also works on a preview host;
  // the script keeps the query string and hash, as the 301 rules do.
  const local = hrefFor(to)
  const dir = join(dist, from.replace(/^\//, ''))
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'index.html'),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Moved — ${esc(SEO[to].title)}</title>
    <link rel="canonical" href="${target}" />
    <meta name="robots" content="noindex, follow" />
    <meta http-equiv="refresh" content="0; url=${local}" />
    <script>window.location.replace(${JSON.stringify(local)} + location.search + location.hash)</script>
  </head>
  <body>
    <p>This tool moved to <a href="${local}">${esc(SEO[to].heading || SEO[to].title)}</a>.</p>
  </body>
</html>
`
  )
}

// --- sitemap <lastmod> ------------------------------------------------
// One shared build date on all 29 URLs tells a crawler nothing: it either
// refetches every page or trusts none of them. Each page's date instead comes
// from git — the last commit touching the component that renders it, or the
// SEO copy printed above the fold, whichever is newer.
const buildDate = new Date().toISOString().slice(0, 10)

// Returns a YYYY-MM-DD date, or null when git can't answer — an unbuilt
// checkout, a tarball, or a shallow CI clone that doesn't reach the commit.
function gitDate(args) {
  try {
    const out = execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const first = out.split('\n', 1)[0].trim()
    return /^\d{4}-\d{2}-\d{2}$/.test(first) ? first : null
  } catch {
    return null
  }
}

// `git log -L` limits history to one line range, letting a route pick up edits
// to its own SEO block without every other route inheriting the same date.
// The range regex has to match seo.js as it stands now, hence the literal
// two-space indent the table is written with.
function seoEntryDate(pathname) {
  const key = pathname.replace(/\//g, '\\/')
  return gitDate(['log', '-1', '--format=%cs', '-L', `/^  '${key}': {/,/^  },$/:src/lib/seo.js`])
}

const lastmodCache = new Map()
function lastmodFor(pathname) {
  if (lastmodCache.has(pathname)) return lastmodCache.get(pathname)
  const file = ROUTE_SOURCE[pathname]
  const dates = [
    file ? gitDate(['log', '-1', '--format=%cs', '--', file]) : null,
    seoEntryDate(pathname),
  ].filter(Boolean)
  // ISO dates sort lexically, so the last one is the newest.
  const value = dates.length ? dates.sort()[dates.length - 1] : buildDate
  lastmodCache.set(pathname, value)
  return value
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((p) => {
    const url = canonicalUrl(p)
    const priority = p === '/' ? '1.0' : p === '/about' ? '0.5' : '0.8'
    return `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmodFor(p)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  })
  .join('\n')}
</urlset>
`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)

writeFileSync(
  join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`
)


// --- Service worker -----------------------------------------------------
// Offline support without a plugin: every page's HTML, the app shell and each
// tool's own chunks are precached on install, so once a tool has been opened
// with a connection it keeps working without one. Lazily loaded extras (the
// Mermaid renderer and its diagram types) are cached the first time they are
// used. The cache name is a hash of the precached files, so a deploy installs
// a fresh cache. The previous version's cache is kept (one release back), so a
// tab still running the old build can load its old chunks after the new
// worker takes over; anything older is deleted.
const precacheFiles = new Set(['/', '/404.html', '/site.webmanifest', '/favicon.svg', '/favicon.ico', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'])
for (const p of routes) if (p !== '/') precacheFiles.add(hrefFor(p))
for (const f of shellChunks) precacheFiles.add(`/${f}`)
for (const f of manifest?.[entryKey]?.css || []) precacheFiles.add(`/${f}`)
for (const p of routes) {
  const { js, css } = routeAssets(p)
  for (const f of [...js, ...css]) precacheFiles.add(`/${f}`)
}
// Workers are chunks too, referenced by URL rather than import.
for (const f of readdirSync(join(dist, 'assets'))) if (/Worker-[\w-]+\.js$/.test(f)) precacheFiles.add(`/assets/${f}`)

const fileFor = (url) => join(dist, url === '/' ? 'index.html' : url.endsWith('/') ? `${url.slice(1)}index.html` : url.slice(1))
const hash = createHash('sha256')
const precache = [...precacheFiles].filter((u) => existsSync(fileFor(u))).sort()
for (const u of precache) hash.update(u).update(readFileSync(fileFor(u)))
const version = hash.digest('hex').slice(0, 12)

writeFileSync(
  join(dist, 'sw.js'),
  `/* DevPocket service worker — generated by scripts/prerender.mjs. */
const CACHE = 'devpocket-${version}'
const PRECACHE = ${JSON.stringify(precache)}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim()
      // caches.keys() lists caches oldest first. Keep this version and the one
      // before it: open tabs from the previous deploy still need its chunks.
      const versions = (await caches.keys()).filter((k) => /^devpocket-[0-9a-f]{12}$/.test(k) && k !== CACHE)
      await Promise.all(versions.slice(0, -1).map((k) => caches.delete(k)))
    })()
  )
})

// Pages: network first so a deploy shows up straight away, cache when offline.
async function page(request) {
  const cache = await caches.open(CACHE)
  try {
    // no-cache: always revalidate with the server, never take the browser's
    // HTTP-cached copy of an HTML page that may point at deleted chunks.
    const response = await fetch(request, { cache: 'no-cache' })
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const url = new URL(request.url)
    const withSlash = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/'
    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match(withSlash)) ||
      (await cache.match('/404.html')) ||
      Response.error()
    )
  }
}

// Hashed assets never change under the same name: cache first, forever.
// caches.match looks in every cache, so the previous version's chunks are
// still served to a tab that loaded before the deploy. A 404 is passed through
// but never stored.
async function asset(request) {
  const hit = await caches.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone())
  return response
}

// Everything else from this origin (icons, manifest): serve cached, refresh behind.
async function staleWhileRevalidate(request, cacheName = CACHE) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
      return response
    })
    .catch(() => hit)
  return hit || refresh
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin === self.location.origin) {
    if (request.mode === 'navigate') return event.respondWith(page(request))
    if (url.pathname.startsWith('/assets/')) return event.respondWith(asset(request))
    return event.respondWith(staleWhileRevalidate(request))
  }
  // The Inter webfont, so the offline app looks like the online one.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    return event.respondWith(staleWhileRevalidate(request, 'devpocket-fonts'))
  }
})
`
)

// This build's own hashed files. scripts/keep-previous-assets.mjs reads the
// live copy at deploy time to carry the previous release's chunks forward.
const ownAssets = readdirSync(join(dist, 'assets')).sort()
writeFileSync(
  join(dist, 'assets-manifest.json'),
  JSON.stringify({ version, builtAt: new Date().toISOString(), files: ownAssets, carried: [] }) + '\n'
)

console.log(`✓ prerendered ${routes.length} routes + sitemap.xml, robots.txt, 404.html, sw.js (${precache.length} files precached)`)
