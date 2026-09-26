/**
 * Writes cloudflare-bulk-redirects.csv from src/lib/redirects.js, for
 * Cloudflare → Bulk Redirects → upload CSV. Each retired URL gets two rows
 * (with and without the trailing slash), 301, query string preserved.
 *
 * Cloudflare's format: no header row; columns source, target, status,
 * preserve_query_string, include_subdomains, subpath_matching,
 * preserve_path_suffix. A source without a scheme matches http and https.
 *
 *   node scripts/redirects-csv.mjs          write the file
 *   node scripts/redirects-csv.mjs --check  exit 1 if the file is out of date
 *                                           (prerender.mjs runs this check)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(join(root, 'src/lib/redirects.js'), 'utf8')
const { REDIRECTS } = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))

const HOST = 'devpocket.in'
export function csvFor(redirects) {
  const rows = []
  for (const [from, to] of Object.entries(redirects)) {
    const target = `https://${HOST}${to}/`
    for (const source of [`${HOST}${from}/`, `${HOST}${from}`]) rows.push(`${source},${target},301,TRUE,FALSE,FALSE,FALSE`)
  }
  return rows.join('\n') + '\n'
}

const file = join(root, 'cloudflare-bulk-redirects.csv')
const want = csvFor(REDIRECTS)
if (process.argv.includes('--check')) {
  if (!existsSync(file) || readFileSync(file, 'utf8') !== want) {
    console.error('cloudflare-bulk-redirects.csv is out of date: run node scripts/redirects-csv.mjs')
    process.exit(1)
  }
} else {
  writeFileSync(file, want)
  console.log(`✓ wrote cloudflare-bulk-redirects.csv (${Object.keys(REDIRECTS).length * 2} rows)`)
}
