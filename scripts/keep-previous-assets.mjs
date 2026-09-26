/**
 * Deploy step: copy recent releases' /assets/* into dist/ before it is
 * published.
 *
 * GitHub Pages replaces the whole site on every deploy, so every chunk an
 * earlier build produced disappears at once. Any page still running that
 * build — an open tab, or an HTML copy a browser or Cloudflare cached — then
 * asks for a chunk that 404s, and the tool it was opening never loads.
 *
 * Each build's assets-manifest.json lists its own files ("files") and the
 * older files it is still serving ("carried", each with the time it stopped
 * being current). This step reads the live manifest and carries forward:
 *   - every file of the live release, and
 *   - anything the live release was already carrying, for KEEP_DAYS after it
 *     stopped being current.
 * So two deploys in one afternoon still keep the first one's chunks, and old
 * files age out instead of accumulating forever.
 *
 * Never fails the build: if the live site cannot be read, it warns and the
 * deploy goes ahead without the carry-over.
 *
 *   node scripts/keep-previous-assets.mjs https://devpocket.in
 *   DIST=/path/to/dist KEEP_DAYS=7 node scripts/keep-previous-assets.mjs <origin>
 */
import { existsSync, writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const origin = (process.argv[2] || 'https://devpocket.in').replace(/\/$/, '')
const dist = process.env.DIST || join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const KEEP_MS = Number(process.env.KEEP_DAYS || 7) * 24 * 60 * 60 * 1000
// Query string so Cloudflare's cache cannot hand back an old manifest.
const bust = `?deploy=${Date.now()}`
const now = new Date().toISOString()
const SAFE = /^[\w.-]+$/

async function text(url) {
  const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.text()
}

// [{ file, since }] the next release should keep serving.
async function toCarry() {
  let live
  try {
    live = JSON.parse(await text(`${origin}/assets-manifest.json${bust}`))
  } catch {
    // A release from before assets-manifest.json existed: take the /assets/
    // paths its sw.js and index.html name.
    const found = new Set()
    for (const page of ['/sw.js', '/']) {
      try {
        for (const [, f] of (await text(`${origin}${page}${bust}`)).matchAll(/\/assets\/([\w.-]+\.(?:js|css|woff2?))/g)) found.add(f)
      } catch {
        // try the next source
      }
    }
    return [...found].map((file) => ({ file, since: now }))
  }
  const cutoff = Date.now() - KEEP_MS
  const older = (live.carried || []).filter((c) => SAFE.test(c.file) && Date.parse(c.since) > cutoff)
  return [...(live.files || []).map((file) => ({ file, since: now })), ...older]
}

try {
  const manifestPath = join(dist, 'assets-manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const own = new Set(manifest.files)

  const byFile = new Map()
  for (const c of await toCarry()) if (SAFE.test(c.file) && !own.has(c.file) && !byFile.has(c.file)) byFile.set(c.file, c)

  let copied = 0
  const kept = []
  const queue = [...byFile.values()]
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      for (let c = queue.shift(); c; c = queue.shift()) {
        const target = join(dist, 'assets', c.file)
        if (existsSync(target)) {
          kept.push(c)
          continue
        }
        try {
          const res = await fetch(`${origin}/assets/${c.file}`)
          if (!res.ok) continue // already gone from the live site
          writeFileSync(target, Buffer.from(await res.arrayBuffer()))
          kept.push(c)
          copied++
        } catch {
          // one missing file is not worth failing a deploy over
        }
      }
    })
  )

  manifest.carried = kept.sort((a, b) => a.file.localeCompare(b.file))
  writeFileSync(manifestPath, JSON.stringify(manifest) + '\n')
  console.log(`✓ carrying ${kept.length} older assets from ${origin} (${copied} downloaded; this build has ${own.size})`)
} catch (err) {
  console.warn(`! could not carry previous assets forward: ${err.message}`)
}
