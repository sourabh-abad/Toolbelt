/**
 * Deploy step: copy the currently live release's /assets/* into dist/ before
 * it is published.
 *
 * GitHub Pages replaces the whole site on every deploy, so every chunk the
 * previous build produced disappears at once. Any page still running that
 * build (an open tab, an HTML copy cached by a browser or CDN) then asks for a
 * chunk that 404s. Keeping the previous release's files for one more release
 * closes that gap.
 *
 * Only the live release's *own* files are carried (from its
 * assets-manifest.json), not the ones it had carried itself, so the site keeps
 * exactly one release of history instead of growing forever.
 *
 * Never fails the build: if the live site cannot be read, it logs a warning
 * and the deploy goes ahead without the carry-over.
 *
 *   node scripts/keep-previous-assets.mjs https://devpocket.in
 */
import { existsSync, writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const origin = (process.argv[2] || 'https://devpocket.in').replace(/\/$/, '')
const dist = process.env.DIST || join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const bust = `?deploy=${Date.now()}`

async function text(url) {
  const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.text()
}

// The live list of files: assets-manifest.json when the live build has one,
// otherwise the /assets/ paths named in its sw.js or index.html.
async function liveAssets() {
  try {
    return JSON.parse(await text(`${origin}/assets-manifest.json${bust}`)).files
  } catch {
    const found = new Set()
    for (const page of ['/sw.js', '/']) {
      try {
        for (const [, f] of (await text(`${origin}${page}${bust}`)).matchAll(/\/assets\/([\w.-]+\.(?:js|css|woff2?))/g)) found.add(f)
      } catch {
        // try the next source
      }
    }
    return [...found]
  }
}

try {
  const files = (await liveAssets()).filter((f) => /^[\w.-]+$/.test(f))
  const missing = files.filter((f) => !existsSync(join(dist, 'assets', f)))
  let copied = 0
  const queue = [...missing]
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      for (let f = queue.shift(); f; f = queue.shift()) {
        try {
          const res = await fetch(`${origin}/assets/${f}`)
          if (!res.ok) continue
          writeFileSync(join(dist, 'assets', f), Buffer.from(await res.arrayBuffer()))
          copied++
        } catch {
          // one missing file is not worth failing a deploy over
        }
      }
    })
  )
  const own = JSON.parse(readFileSync(join(dist, 'assets-manifest.json'), 'utf8')).files.length
  console.log(`✓ kept ${copied} of ${missing.length} previous-release assets from ${origin} (this build: ${own} files)`)
} catch (err) {
  console.warn(`! could not carry previous assets forward: ${err.message}`)
}
