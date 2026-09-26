/**
 * Recovery from a stale deploy.
 *
 * Every build renames its chunks (JsonValidatorTool-<hash>.js), so a page
 * loaded from an older index.html can ask for a file the server no longer
 * has. The fix is to reload and pick up the current index.html — once. The
 * timestamp in sessionStorage stops a genuinely missing chunk from turning
 * that into a reload loop.
 */
const KEY = 'devpocket-chunk-reload'
const WINDOW_MS = 60_000

// Chrome, Firefox and Safari word the same failure differently; Vite's own
// preload helper and older webpack-style loaders add two more.
const CHUNK_ERROR = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|ChunkLoadError|Loading chunk [\w-]+ failed/i

export function isChunkLoadError(error) {
  if (!error) return false
  return error.name === 'ChunkLoadError' || CHUNK_ERROR.test(String(error.message || error))
}

/** True if this call triggered a reload; false if one already ran recently. */
export function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0)
    if (Date.now() - last < WINDOW_MS) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    // Storage blocked: reloading without a guard is still better than a blank
    // page, and the error boundary catches a second failure.
  }
  window.location.reload()
  return true
}
