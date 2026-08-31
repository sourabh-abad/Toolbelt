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

const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((p) => {
    const url = canonicalUrl(p)
    const priority = p === '/' ? '1.0' : p === '/about' ? '0.5' : '0.8'
    return `  <url>\n    <loc>${url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
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
