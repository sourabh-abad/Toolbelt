/**
 * Runs the Regex Tester off the main thread. A pattern such as (a+)+$ can
 * backtrack for minutes; the page terminates this worker after a second and
 * starts a fresh one, so the tab never freezes.
 */
import { findMatches, replaceAll } from './regex.js'

self.onmessage = (e) => {
  const { id, pattern, flags, text, replacement } = e.data
  try {
    const found = findMatches(pattern, flags, text)
    const replaced = replacement === null || found.error ? null : replaceAll(pattern, flags, text, replacement)
    self.postMessage({ id, ...found, replaced: replaced?.text ?? null })
  } catch (err) {
    self.postMessage({ id, error: err?.message || String(err) })
  }
}
