/**
 * Parses and transforms JSON off the main thread. A multi-megabyte payload
 * can block the UI for seconds if parsed inline; here the tab stays
 * responsive and the page just waits for a message.
 */
import * as ops from './jsonops'

const TRANSFORMS = {
  format: (v, o) => JSON.stringify(v, null, o.indent ?? 2),
  minify: (v) => JSON.stringify(v),
  sortKeys: (v, o) => JSON.stringify(ops.sortKeys(v, o.direction), null, 2),
  flatten: (v, o) => JSON.stringify(ops.flatten(v, o.delimiter), null, 2),
  unflatten: (v, o) => JSON.stringify(ops.unflatten(v, o.delimiter), null, 2),
  removeNulls: (v) => JSON.stringify(ops.removeNulls(v), null, 2),
  removeEmpty: (v) => JSON.stringify(ops.removeEmpty(v), null, 2),
  schema: (v) => JSON.stringify(ops.inferSchema(v), null, 2),
  stats: (v) => ops.analyse(v),
  jsonPath: (v, o) => JSON.stringify(ops.jsonPath(v, o.expression), null, 2),
}

self.onmessage = (e) => {
  const { id, text, op, options = {} } = e.data
  try {
    const parsed = JSON.parse(text)
    const fn = TRANSFORMS[op]
    if (!fn) throw new Error(`Unknown operation: ${op}`)
    self.postMessage({ id, ok: true, result: fn(parsed, options) })
  } catch (err) {
    self.postMessage({ id, ok: false, error: err.message })
  }
}
