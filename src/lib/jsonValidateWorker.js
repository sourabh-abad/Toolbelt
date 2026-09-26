/**
 * Runs the JSON Validator's parse, format and stats off the main thread. A
 * multi-megabyte paste used to block the tab for seconds; here the page keeps
 * responding and simply shows "Processing…" until the answer arrives.
 */
import { analyzeJson } from './jsonvalidate.js'

self.onmessage = (e) => {
  const { id, text, options } = e.data
  try {
    self.postMessage({ id, ok: true, result: analyzeJson(text, options) })
  } catch (err) {
    self.postMessage({ id, ok: false, error: err?.message || String(err) })
  }
}
