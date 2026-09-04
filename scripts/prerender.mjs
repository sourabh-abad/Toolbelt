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
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

// Read the route table straight from the app so the two can't drift apart.
const seoSrc = readFileSync(join(root, 'src/lib/seo.js'), 'utf8')
const { SEO, SITE_ORIGIN, canonicalUrl } = await import(
  'data:text/javascript;base64,' + Buffer.from(seoSrc).toString('base64')
)

const template = readFileSync(join(dist, 'index.html'), 'utf8')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

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
      ],
    })
  }

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: seo.heading || seo.title,
        url,
        description: seo.description,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
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
      // Only emitted when the route's SEO entry has an faq array, and the
      // same Q&A pairs are rendered visibly on the page via
      // ToolContentSections — structured data must match visible content.
      ...(seo.faq
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: seo.faq.map(({ q, a }) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: a },
              })),
            },
          ]
        : []),
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
    /\{ to: '([^']+)', label: '([^']*)',[^}]*?group: (?:'([^']*)'|null),[^}]*?description: '([^']*)' \}/g
  ),
].map(([, to, label, group, description]) => ({ to, label, group, description }))
const NAV_GROUPS = JSON.parse(
  navSrc.match(/export const NAV_GROUPS = (\[[^\]]*\])/)[1].replace(/'/g, '"')
)
if (NAV.length < 20) throw new Error(`prerender: parsed only ${NAV.length} nav items from nav.js`)

// Internal hrefs use the trailing-slash form the canonical tags advertise, so
// the crawler follows links to exactly the URLs it is told to index.
const hrefFor = (to) => (to === '/' ? '/' : `${to}/`)

const H2 = 'class="t-main text-base font-semibold tracking-tight"'
const P = 'class="t-muted mt-2 text-sm leading-relaxed"'

// Everything below `render` writes the same copy React renders on mount —
// ToolContentSections and SeoFooter read the same seo.js/nav.js fields. Static
// HTML that differs from the hydrated page is cloaking; this has to stay a
// mirror, not an SEO-only variant.
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

function sectionsHtml(seo) {
  const parts = []

  if (seo.howItWorks) {
    parts.push(
      `<section class="mt-8"><h2 ${H2}>How it works</h2><ol class="mt-3 space-y-2.5">${seo.howItWorks
        .map(
          (step, i) =>
            `<li class="t-muted text-sm leading-relaxed"><span class="t-faint mono">${i + 1}.</span> ${esc(step)}</li>`
        )
        .join('')}</ol></section>`
    )
  }

  if (seo.useCases) {
    parts.push(
      `<section class="mt-8"><h2 ${H2}>Common use cases</h2><ul class="mt-3 space-y-1.5">${seo.useCases
        .map((item) => `<li class="t-muted text-sm leading-relaxed">• ${esc(item)}</li>`)
        .join('')}</ul></section>`
    )
  }

  if (seo.faq) {
    parts.push(
      `<section class="mt-8"><h2 ${H2}>FAQ</h2><div class="mt-3 space-y-4">${seo.faq
        .map(
          ({ q, a }) =>
            `<div><h3 class="t-main text-sm font-medium">${esc(q)}</h3><p ${P}>${esc(a)}</p></div>`
        )
        .join('')}</div></section>`
    )
  }

  if (!parts.length) return ''

  // Mirrors ToolContentSections: a route marked collapsedContent renders the
  // copy inside a closed <details>. It is still in the HTML, which is what a
  // crawler reads, while the page itself stays given over to the tool.
  if (seo.collapsedContent) {
    return `<div class="px-4 pb-6 sm:px-6"><details><summary class="t-muted text-xs font-medium">About ${esc(
      (seo.heading || 'this tool').toLowerCase()
    )}</summary><div class="mt-3 space-y-4">${parts.join('')}</div></details></div>`
  }

  return `<div class="space-y-4 px-4 pb-6 sm:px-6">${parts.join('')}</div>`
}

// Mirrors SeoFooter: every tool linked from every page. Before this the static
// HTML carried a single link, so an audit crawler saw 29 orphan pages.
function footerHtml(pathname, seo) {
  const groups = NAV_GROUPS.map((group) => {
    const items = NAV.filter((n) => n.group === group)
    if (!items.length) return ''
    return `<div><h3 class="t-muted text-[11px] font-semibold tracking-wider uppercase">${esc(group)}</h3><ul class="mt-1">${items
      .map((n) =>
        n.to === pathname
          ? `<li><span class="t-faint inline-flex min-h-[32px] items-center text-xs" aria-current="page">${esc(n.label)}</span></li>`
          : `<li><a href="${hrefFor(n.to)}" class="t-muted inline-flex min-h-[32px] items-center text-xs underline-offset-2">${esc(n.label)}</a></li>`
      )
      .join('')}</ul></div>`
  }).join('')

  return `<footer class="bd mt-2 border-t px-4 py-8 sm:px-6"><div class="mx-auto max-w-4xl"><h2 class="t-main text-sm font-semibold">${esc(seo.heading || seo.title)}</h2><p class="t-muted mt-2 max-w-3xl text-sm leading-relaxed">${esc(seo.blurb || seo.description)}</p><nav aria-label="All tools" class="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">${groups}</nav><p class="t-muted mt-6 text-xs">Free · no sign-up · nothing you paste leaves your browser · <a href="/" class="inline-flex min-h-[36px] items-center underline-offset-2">all tools</a> · <a href="/privacy/" class="inline-flex min-h-[36px] items-center underline-offset-2">privacy</a> · <a href="/about/" class="inline-flex min-h-[36px] items-center underline-offset-2">about this project</a></p></div></footer>`
}

function render(pathname, seo) {
  const url = canonicalUrl(pathname)
  let html = template

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(seo.title)}</title>`)
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[\s\S]*?(")/,
    `$1${esc(seo.description)}$2`
  )
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${url}$2`
  )
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
  html = html.replace(
    /(<meta property="og:title" content=")[^"]*(")/,
    `$1${esc(seo.title)}$2`
  )
  html = html.replace(
    /(<meta\s+property="og:description"\s+content=")[\s\S]*?(")/,
    `$1${esc(seo.description)}$2`
  )
  html = html.replace(
    /(<meta name="twitter:title" content=")[^"]*(")/,
    `$1${esc(seo.title)}$2`
  )
  html = html.replace(
    /(<meta\s+name="twitter:description"\s+content=")[\s\S]*?(")/,
    `$1${esc(seo.description)}$2`
  )
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${buildLdJson(pathname, seo)}</script>`
  )

  const body =
    `<div class="app-bg flex min-h-screen flex-col antialiased">` +
    `<header class="bd sidebar-bg border-b"><div class="mx-auto flex h-14 max-w-[1600px] items-center gap-2.5 px-3 sm:px-5">` +
    `<a href="/" class="flex shrink-0 items-center gap-2.5" aria-label="DevPocket home">` +
    `<span class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500 font-bold text-sm">D</span>` +
    `<span class="t-main text-base font-bold tracking-tight">DevPocket</span></a></div></header>` +
    `<main class="mx-auto w-full max-w-[1600px] flex-1">` +
    `<div class="bd border-b px-5 pt-10 pb-8 sm:px-8 sm:pt-14 sm:pb-10">` +
    `<h1 class="t-main text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">${esc(seo.heading || seo.title)}</h1>` +
    `<p class="t-muted mt-3 max-w-xl text-sm leading-relaxed">${esc(seo.blurb || seo.description)}</p></div>` +
    sectionsHtml(seo) +
    footerHtml(pathname, seo) +
    `</main></div>`

  html = replaceRoot(html, body)

  return html
}

const routes = Object.keys(SEO)
for (const pathname of routes) {
  const html = render(pathname, SEO[pathname])
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
writeFileSync(join(dist, '404.html'), render('/', SEO['/']))

// Retired URLs: a static page that redirects, plus a canonical pointing at the
// new location so search engines transfer rather than index a duplicate.
// GitHub Pages cannot issue 301s, so this is the closest equivalent.
const REDIRECTS = { '/jwt-color': '/jwtvalidator' }
for (const [from, to] of Object.entries(REDIRECTS)) {
  const target = canonicalUrl(to)
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
    <meta http-equiv="refresh" content="0; url=${target}" />
    <script>window.location.replace(${JSON.stringify(target)})</script>
  </head>
  <body>
    <p>This tool moved to <a href="${target}">${target}</a>.</p>
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

// Route -> page module, parsed out of App.jsx's LOADERS table so adding a tool
// there can't leave a stale mapping here.
const appSrc = readFileSync(join(root, 'src/App.jsx'), 'utf8')
const ROUTE_SOURCE = { '/': 'src/pages/Home.jsx' }
for (const [, route, mod] of appSrc.matchAll(
  /'(\/[^']*)':\s*\(\)\s*=>\s*import\('\.\/([^']+)'\)/g
)) {
  ROUTE_SOURCE[route] = `src/${mod}.jsx`
}

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

console.log(`✓ prerendered ${routes.length} routes + sitemap.xml, robots.txt, 404.html`)
