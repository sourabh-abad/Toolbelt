/**
 * bcrypt hashing and verification on top of the pure-JS `bcryptjs` package.
 * Imported by bcryptWorker.js (and, if a browser somehow has no Web Worker,
 * loaded on demand by the page); the page itself only imports bcrypt.js.
 */
import { hash as bcryptHash, compare as bcryptCompare } from 'bcryptjs'
import { DEFAULT_COST, DEFAULT_VERSION, MIN_COST, MAX_COST, VERSIONS, parseHash, withVersion } from './bcrypt.js'

/** bcrypt hash of `password` with a fresh random salt. */
export async function hashPassword(password, { cost = DEFAULT_COST, version = DEFAULT_VERSION } = {}) {
  if (!Number.isInteger(cost) || cost < MIN_COST || cost > MAX_COST) throw new Error(`Cost must be a whole number from ${MIN_COST} to ${MAX_COST}`)
  if (!VERSIONS.includes(version)) throw new Error(`Unknown bcrypt version ${version}`)
  const out = await bcryptHash(String(password), cost)
  return withVersion(out, version)
}

/**
 * Whether `password` produces `hash`. Resolves to false, never throws, for a
 * string that is not a bcrypt hash — use parseHash to explain why.
 */
export async function verifyPassword(password, hash) {
  const parsed = parseHash(hash)
  if (!parsed.valid) return false
  return bcryptCompare(String(password), parsed.full)
}
