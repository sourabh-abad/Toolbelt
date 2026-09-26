/**
 * Retired tool URLs and where each one lives now. The single table behind:
 *   - the static stub written at each old path (scripts/prerender.mjs),
 *   - cloudflare-bulk-redirects.csv (scripts/redirects-csv.mjs) for real 301s,
 *   - client-side <Navigate> routes in App.jsx,
 *   - migrating favorites and recently used tools saved under an old path.
 *
 * Plain data with no imports: prerender.mjs loads this file as a data: URL.
 * Always point at the final URL — never at another retired one.
 */
export const REDIRECTS = {
  '/encode-decode': '/base64',
  '/json-xml': '/json-formatter',
  '/convert': '/json-to-yaml',
  '/jwtvalidator': '/jwt-decoder',
  '/jsonvalidator': '/json-validator',
  '/json-tree': '/json-viewer',
  '/json-schema': '/json-schema-generator',
  '/jwt-color': '/jwt-decoder',
}

/** The current path for a route key, following the table (no trailing slash). */
export function currentPath(path) {
  let p = path
  for (let i = 0; i < 5 && REDIRECTS[p]; i++) p = REDIRECTS[p]
  return p
}
