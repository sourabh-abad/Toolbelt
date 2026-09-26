/**
 * Build-time audit of the prerendered site. Runs after scripts/prerender.mjs
 * and fails the build when a page breaks one of the SEO / content rules:
 *
 *  - one <h1>, and no <h2> with the same text (case-insensitive)
 *  - a unique <title> and meta description
 *  - an absolute, self-referencing canonical with a trailing slash
 *  - listed in sitemap.xml (and retired stubs are not)
 *  - JSON-LD that parses
 *  - "Related tools" links that resolve to real pages, never to a stub; every
 *    tool page linked from at least 3 others; no two pages with the same list
 *  - no link anywhere to a retired slug, except on its own redirect stub
 *  - every tool in the menu (and so in ⌘K, the header, the footer and the
 *    homepage); pages written in src/content/ also need a guide of 300+
 *    words, a worked example, "Where people get caught", 3–5 FAQs, 1–3
 *    in-text links and 4–6 related tools
 *
 * `--table` also prints one row per prerendered file: path, title, H1 count,
 * whether an H2 repeats the H1, canonical, JSON-LD @types and related links.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const imp = (p) => import(pathToFileURL(join(root, p)).href)
const { SEO, SITE_ORIGIN } = await imp('src/lib/seo.js')
const { REDIRECTS } = await imp('src/lib/redirects.js')
const { navItems } = await imp('src/lib/nav.js')

const errors = []
const warnings = []
const fail = (path, msg) => errors.push(`${path}: ${msg}`)
const warn = (path, msg) => warnings.push(`${path}: ${msg}`)

const decode = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
const slash = (p) => (p === '/' ? '/' : `${p.replace(/\/$/, '')}/`)
const bare = (p) => (p === '/' ? '/' : p.replace(/\/$/, ''))

function htmlFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const f = join(dir, name)
    if (statSync(f).isDirectory()) {
      if (name === 'assets') continue
      out.push(...htmlFiles(f))
    } else if (name === 'index.html') out.push(f)
  }
  return out
}

const sitemapXml = readFileSync(join(dist, 'sitemap.xml'), 'utf8')
const sitemap = new Set([...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
const tools = new Set(navItems.filter((n) => n.group).map((n) => n.to))
const routes = new Set(Object.keys(SEO))
const stubs = new Set(Object.keys(REDIRECTS))

const pages = []
for (const file of htmlFiles(dist).sort()) {
  const rel = '/' + relative(dist, dirname(file)).split('\\').join('/')
  const path = bare(rel === '/' ? '/' : rel)
  const html = readFileSync(file, 'utf8')
  const title = decode(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] || '')
  const description = decode(/<meta\s+name="description"\s+content="([^"]*)"/.exec(html)?.[1] || '')
  const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1] || ''
  const robots = /<meta name="robots" content="([^"]*)"/.exec(html)?.[1] || ''
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => decode(m[1]))
  const h2s = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => decode(m[1]))
  const h2EqualsH1 = h1s.length > 0 && h2s.some((h) => h.toLowerCase() === h1s[0].toLowerCase())
  const ldTypes = []
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const walk = (v) => {
        if (Array.isArray(v)) v.forEach(walk)
        else if (v && typeof v === 'object') {
          if (v['@type']) ldTypes.push(...[].concat(v['@type']))
          Object.values(v).forEach(walk)
        }
      }
      walk(JSON.parse(m[1]))
    } catch (e) {
      fail(path, `JSON-LD does not parse: ${e.message}`)
    }
  }
  let related = []
  const ri = html.indexOf('id="related-tools"')
  if (ri >= 0) {
    const end = html.indexOf('</section>', ri)
    related = [...html.slice(ri, end).matchAll(/href="([^"]+)"/g)].map((m) => m[1])
  }
  const hrefs = [...html.matchAll(/href="(\/[^"#?]*)/g)].map((m) => bare(m[1]))
  pages.push({ file, path, html, title, description, canonical, robots, h1s, h2s, h2EqualsH1, ldTypes: [...new Set(ldTypes)], related, hrefs })
}

/* ------------------------------------------------------------- checks */

const byTitle = new Map()
const byDesc = new Map()
const relatedSig = new Map()
const inbound = new Map()

for (const p of pages) {
  const stub = stubs.has(p.path)
  if (stub) {
    const target = `${SITE_ORIGIN}${slash(REDIRECTS[p.path])}`
    if (p.canonical !== target) fail(p.path, `stub canonical ${p.canonical} should be ${target}`)
    if (!/noindex/.test(p.robots)) fail(p.path, 'stub is missing robots noindex')
    if (!/http-equiv="refresh"/.test(p.html)) fail(p.path, 'stub has no meta refresh')
    if (sitemap.has(`${SITE_ORIGIN}${slash(p.path)}`)) fail(p.path, 'stub is listed in sitemap.xml')
    continue
  }
  if (!routes.has(p.path)) {
    warn(p.path, 'prerendered file with no SEO entry')
    continue
  }
  const url = `${SITE_ORIGIN}${slash(p.path)}`
  if (p.h1s.length !== 1) fail(p.path, `${p.h1s.length} <h1> elements (expected 1)`)
  if (p.h2EqualsH1) fail(p.path, `an <h2> repeats the H1 "${p.h1s[0]}"`)
  if (!p.title) fail(p.path, 'no <title>')
  if (p.title.length > 72) fail(p.path, `title is ${p.title.length} characters`)
  else if (p.title.length > 62) warn(p.path, `title is ${p.title.length} characters`)
  if (!p.description) fail(p.path, 'no meta description')
  else if (p.description.length < 110 || p.description.length > 175) warn(p.path, `description is ${p.description.length} characters`)
  if (p.canonical !== url) fail(p.path, `canonical ${p.canonical || '(none)'} should be ${url}`)
  if (!sitemap.has(url)) fail(p.path, 'not listed in sitemap.xml')
  for (const [map, key] of [[byTitle, p.title], [byDesc, p.description]]) {
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(p.path)
  }
  for (const h of p.hrefs) {
    if (stubs.has(h)) fail(p.path, `links to retired URL ${h}/ (use ${REDIRECTS[h]}/)`)
  }
  if (tools.has(p.path)) {
    const rel = p.related.map(bare)
    if (rel.length < 3) fail(p.path, `only ${rel.length} related tools`)
    for (const r of rel) {
      if (stubs.has(r)) fail(p.path, `related link to redirect stub ${r}/`)
      else if (!routes.has(r)) fail(p.path, `related link to unknown route ${r}/`)
      else if (r === p.path) fail(p.path, 'related link to itself')
      inbound.set(r, (inbound.get(r) || 0) + 1)
    }
    const sig = [...rel].sort().join(' ')
    if (relatedSig.has(sig)) fail(p.path, `same related list as ${relatedSig.get(sig)}`)
    relatedSig.set(sig, p.path)
  }
}

for (const [map, what] of [[byTitle, 'title'], [byDesc, 'description']]) {
  for (const [k, paths] of map) if (paths.length > 1) fail(paths.join(', '), `share the ${what} "${k}"`)
}
for (const t of tools) {
  if (!routes.has(t)) fail(t, 'in the menu but has no SEO entry')
  if (!pages.some((p) => p.path === t)) fail(t, 'in the menu but was not prerendered')
  if ((inbound.get(t) || 0) < 3) fail(t, `linked from only ${inbound.get(t) || 0} other pages' Related tools (need 3)`)
}
const home = pages.find((p) => p.path === '/')
for (const t of tools) if (home && !home.hrefs.includes(t)) fail('/', `homepage does not link to ${t}/`)
for (const s of stubs) if (tools.has(s)) fail(s, 'retired URL is still in the menu / ⌘K')

// Pages whose copy lives in src/content/ are held to the full standard;
// older pages in src/lib/seo.js get the same checks as warnings.
const strict = new Set()
for (const f of readdirSync(join(root, 'src/content'))) {
  if (f.endsWith('.js')) for (const k of Object.keys((await imp(`src/content/${f}`)).default)) strict.add(k)
}
const words = (t) => (t || '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').split(/\s+/).filter(Boolean).length
for (const [path, seo] of Object.entries(SEO)) {
  if (!tools.has(path)) continue
  const dd = seo.deepDive
  const full = Array.isArray(seo.related) && seo.related.length && Array.isArray(seo.related[0])
  if (!full) fail(path, 'related tools need [route, reason] pairs')
  const must = strict.has(path) ? fail : warn
  if (!dd?.gotchas) {
    if (strict.has(path)) fail(path, 'no guide with "Where people get caught"')
    continue
  }
  const guideWords = words([...(dd.body || []), ...dd.gotchas.map((g) => `${g.title} ${g.detail}`)].join(' '))
  if (guideWords < 300) must(path, `guide has ${guideWords} words (need 300)`)
  if (!dd.example?.input || !dd.example?.output) must(path, 'guide has no worked example')
  const faq = seo.faq?.length || 0
  if (faq < 3 || faq > 5) must(path, `${faq} FAQs (need 3–5)`)
  const inText = (dd.body || []).join(' ').match(/\]\(\//g)?.length || 0
  if (inText < 1 || inText > 3) (inText ? warn : must)(path, `${inText} in-text links in the guide (want 1–3)`)
  if (seo.related.length < 4 || seo.related.length > 6) must(path, `${seo.related.length} related tools (want 4–6)`)
}
if (!existsSync(join(root, 'cloudflare-bulk-redirects.csv'))) fail('cloudflare-bulk-redirects.csv', 'missing')

/* -------------------------------------------------------------- output */

if (process.argv.includes('--table')) {
  const rows = pages.map((p) => [
    slash(p.path),
    p.title,
    String(p.h1s.length),
    p.h2EqualsH1 ? 'YES' : 'no',
    p.canonical.replace(SITE_ORIGIN, ''),
    p.ldTypes.join(', ') || '—',
    p.related.join(' ') || '—',
  ])
  console.log('| Path | Title | H1s | H2 = H1 | Canonical | JSON-LD @types | Related links |')
  console.log('|---|---|---|---|---|---|---|')
  for (const r of rows) console.log(`| ${r.map((c) => c.replace(/\|/g, '\\|')).join(' | ')} |`)
}

for (const w of warnings) console.warn(`  warn  ${w}`)
if (errors.length) {
  for (const e of errors) console.error(`  ✗ ${e}`)
  console.error(`✗ site check failed: ${errors.length} problem${errors.length === 1 ? '' : 's'}`)
  process.exit(1)
}
console.log(`✓ site check: ${pages.length} files (${pages.length - stubs.size} pages, ${stubs.size} redirect stubs), ${tools.size} tools, ${warnings.length} warnings`)
