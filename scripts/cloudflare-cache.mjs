/**
 * Cloudflare cache policy for devpocket.in, applied through the API so it is
 * reproducible instead of a list of dashboard clicks.
 *
 *   node scripts/cloudflare-cache.mjs --verify         read the live headers (no token needed)
 *   node scripts/cloudflare-cache.mjs --dry-run        print what apply would send
 *   node scripts/cloudflare-cache.mjs --apply          set the policy, then purge everything
 *   node scripts/cloudflare-cache.mjs --purge          purge everything (the deploy workflow does this)
 *
 * --apply and --purge need CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN in the
 * environment. The token needs, for the devpocket.in zone only:
 *   Zone Settings: Edit · Cache Rules: Edit · Transform Rules: Edit · Cache Purge: Purge
 *
 * What it sets:
 *   1. Browser Cache TTL → "Respect Existing Headers" (the zone default of
 *      4 hours is what put max-age=14400 on every response).
 *   2. Smart Tiered Cache on (free on every plan): a data center that misses
 *      asks a nearby upper-tier Cloudflare data center before GitHub Pages.
 *   3. Cache Rules:
 *        HTML pages     cached at the edge for a day, never a 404 or 5xx.
 *                       Every deploy purges them, so a new release shows at
 *                       once; the day only bounds a purge that failed.
 *        sw.js, manifests   never cached at the edge.
 *        /assets/*      cached for a year at the edge, except 404s.
 *      Serving HTML from the edge is what keeps the first byte fast in every
 *      country: without it each page view goes Cloudflare → GitHub Pages.
 *   4. Response header rules, i.e. what the browser is told:
 *        HTML routes and /sw.js   Cache-Control: no-cache (revalidated with the
 *                                 nearest Cloudflare edge, not GitHub)
 *        /assets/* (200)          Cache-Control: public, max-age=31536000, immutable
 *        any 404                  Cache-Control: no-store
 *   5. Purge everything.
 *
 * Rules it owns are marked with a "devpocket:" description. Re-running
 * replaces those and leaves any other rule in the same phase alone.
 */

const ORIGIN = process.env.SITE_ORIGIN || 'https://devpocket.in'
const API = process.env.CLOUDFLARE_API_BASE || 'https://api.cloudflare.com/client/v4'
const TAG = 'devpocket:'

const PATH = 'http.request.uri.path'
const PAGES = `(${PATH} eq "/" or ends_with(${PATH}, "/") or ends_with(${PATH}, ".html"))`
// Small files that must be current the moment they are asked for: sw.js picks
// the release, keep-previous-assets reads the live manifest.
const NO_EDGE = `${PATH} in {"/sw.js" "/assets-manifest.json" "/site.webmanifest"}`
const HTML = `(${PAGES} or ${NO_EDGE})`
const ASSETS = `starts_with(${PATH}, "/assets/")`
const DAY = 86400
const YEAR = 31536000

const CACHE_RULES = [
  {
    description: `${TAG} HTML pages: cached at the edge for a day, purged on every deploy`,
    expression: PAGES,
    action: 'set_cache_settings',
    action_parameters: {
      cache: true,
      edge_ttl: {
        mode: 'override_origin',
        default: DAY,
        // -1 = no-store: a missing page or an origin hiccup must not stick.
        status_code_ttl: [
          { status_code: 404, value: -1 },
          { status_code_range: { from: 500, to: 599 }, value: -1 },
        ],
      },
      browser_ttl: { mode: 'respect_origin' },
    },
    enabled: true,
  },
  {
    description: `${TAG} service worker and manifests are never cached at the edge`,
    expression: NO_EDGE,
    action: 'set_cache_settings',
    action_parameters: { cache: false },
    enabled: true,
  },
  {
    description: `${TAG} hashed assets: cache for a year, never cache a 404`,
    expression: ASSETS,
    action: 'set_cache_settings',
    action_parameters: {
      cache: true,
      edge_ttl: {
        mode: 'override_origin',
        default: YEAR,
        // -1 = no-store: a chunk that 404s mid-deploy must not stick.
        status_code_ttl: [{ status_code: 404, value: -1 }],
      },
      browser_ttl: { mode: 'respect_origin' },
    },
    enabled: true,
  },
]

const setHeader = (value) => ({ headers: { 'Cache-Control': { operation: 'set', value } } })
const HEADER_RULES = [
  {
    description: `${TAG} HTML and sw.js: always revalidate`,
    expression: `${HTML} and http.response.code ne 404`,
    action: 'rewrite',
    action_parameters: setHeader('no-cache'),
    enabled: true,
  },
  {
    description: `${TAG} hashed assets: immutable for a year`,
    expression: `${ASSETS} and http.response.code eq 200`,
    action: 'rewrite',
    action_parameters: setHeader(`public, max-age=${YEAR}, immutable`),
    enabled: true,
  },
  {
    description: `${TAG} 404s are never stored`,
    expression: 'http.response.code eq 404',
    action: 'rewrite',
    action_parameters: setHeader('no-store'),
    enabled: true,
  },
]

const mode = process.argv[2]
const zone = process.env.CLOUDFLARE_ZONE_ID
const token = process.env.CLOUDFLARE_API_TOKEN

async function cf(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) {
    const err = new Error(`${method} ${path}: ${res.status} ${(json.errors || []).map((e) => `${e.code} ${e.message}`).join('; ')}`)
    err.status = res.status
    throw err
  }
  return json.result
}

// Replace this script's rules in a phase, keep everyone else's.
async function mergePhase(phase, ours) {
  let existing = []
  try {
    existing = (await cf('GET', `/zones/${zone}/rulesets/phases/${phase}/entrypoint`)).rules || []
  } catch (e) {
    if (e.status !== 404) throw e // 404: no rules in this phase yet
  }
  const others = existing
    .filter((r) => !(r.description || '').startsWith(TAG))
    .map(({ id, ref, expression, action, action_parameters, description, enabled }) => ({ id, ref, expression, action, action_parameters, description, enabled }))
  await cf('PUT', `/zones/${zone}/rulesets/phases/${phase}/entrypoint`, { rules: [...others, ...ours] })
  console.log(`✓ ${phase}: ${ours.length} DevPocket rules${others.length ? `, ${others.length} other rules kept` : ''}`)
}

async function purge() {
  await cf('POST', `/zones/${zone}/purge_cache`, { purge_everything: true })
  console.log('✓ purged everything')
}

async function verify() {
  const manifest = await fetch(`${ORIGIN}/assets-manifest.json?check=${Date.now()}`).then((r) => r.json()).catch(() => null)
  const asset = manifest?.files?.find((f) => f.endsWith('.js'))
  const checks = [
    ['/', 'no-cache'],
    ['/jsonvalidator/', 'no-cache'],
    ['/sw.js', 'no-cache'],
    ...(asset ? [[`/assets/${asset}`, 'immutable']] : []),
    ['/assets/this-file-does-not-exist.js', 'no-store'],
  ]
  let ok = true
  // HTML should be answered by the edge: HIT, or MISS/EXPIRED right after a purge.
  // DYNAMIC or BYPASS means every page view still travels to GitHub Pages.
  const home = await fetch(ORIGIN + '/', { method: 'HEAD' })
  const edge = home.headers.get('cf-cache-status') || '-'
  const edgeOk = ['HIT', 'MISS', 'EXPIRED', 'REVALIDATED', 'UPDATING', 'STALE'].includes(edge)
  ok &&= edgeOk
  console.log(`${edgeOk ? '✓' : '✗'} edge cache for HTML: ${edge}${edgeOk ? '' : ' (expected HIT or MISS; run --apply)'}`)
  for (const [path, want] of checks) {
    const res = await fetch(ORIGIN + path, { method: 'HEAD', redirect: 'manual' })
    const cc = res.headers.get('cache-control') || '(none)'
    const pass = cc.includes(want)
    ok &&= pass
    console.log(`${pass ? '✓' : '✗'} ${String(res.status).padEnd(4)} ${path.padEnd(42)} ${cc}   [${res.headers.get('cf-cache-status') || '-'}]`)
  }
  if (!asset) console.log('! could not read /assets-manifest.json, so no /assets/ file was checked')
  if (!ok) process.exitCode = 1
}

try {
if (mode === '--verify') {
  await verify()
} else if (mode === '--dry-run') {
  console.log(JSON.stringify({ browser_cache_ttl: 0, tiered_cache_smart_topology_enable: 'on', http_request_cache_settings: CACHE_RULES, http_response_headers_transform: HEADER_RULES }, null, 2))
} else if (mode === '--apply' || mode === '--purge') {
  if (!zone || !token) {
    console.error('Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN first.')
    process.exit(1)
  }
  if (mode === '--apply') {
    await cf('PATCH', `/zones/${zone}/settings/browser_cache_ttl`, { value: 0 })
    console.log('✓ Browser Cache TTL: Respect Existing Headers')
    await cf('PATCH', `/zones/${zone}/cache/tiered_cache_smart_topology_enable`, { value: 'on' })
    console.log('✓ Smart Tiered Cache: on')
    await mergePhase('http_request_cache_settings', CACHE_RULES)
    await mergePhase('http_response_headers_transform', HEADER_RULES)
  }
  await purge()
  if (mode === '--apply') console.log('\nGive it a minute, then run: node scripts/cloudflare-cache.mjs --verify')
} else {
  console.log('Usage: node scripts/cloudflare-cache.mjs --verify | --dry-run | --apply | --purge')
  process.exit(1)
}
} catch (err) {
  console.error(`✗ ${err.message}`)
  if (err.status === 403 || err.status === 401) console.error('  Check the token: it needs Zone Settings, Cache Rules and Transform Rules (Edit) and Cache Purge for this zone.')
  process.exitCode = 1
}
