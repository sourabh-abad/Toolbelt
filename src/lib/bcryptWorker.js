/**
 * Runs bcrypt off the main thread. Cost 12 takes a few hundred milliseconds in
 * JavaScript and every step doubles it, so on the page itself it would freeze
 * typing and the spinner alike.
 */
import { hashPassword, verifyPassword } from './bcryptHash.js'

self.onmessage = async (e) => {
  const { id, op, password, cost, version, hash } = e.data
  try {
    const started = performance.now()
    const result = op === 'verify' ? await verifyPassword(password, hash) : await hashPassword(password, { cost, version })
    self.postMessage({ id, ok: true, result, ms: performance.now() - started })
  } catch (err) {
    self.postMessage({ id, ok: false, error: err?.message || String(err) })
  }
}
