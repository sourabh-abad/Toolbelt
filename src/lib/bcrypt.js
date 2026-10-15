/**
 * The bcrypt hash format: parsing, relabelling and the numbers around it.
 * Pure functions only — the hashing itself lives in bcryptHash.js (which pulls
 * in bcryptjs) and runs in bcryptWorker.js, so the page chunk stays small and
 * a high cost factor never freezes the tab.
 *
 * A bcrypt string is 60 characters: `$2b$10$` (version, cost) followed by a
 * 22-character salt and a 31-character hash, both in bcrypt's own base64
 * alphabet (./A-Za-z0-9 — not the standard one, so do not decode it with the
 * Base64 tool).
 */
/** The three labels in use. The algorithm behind them is identical. */
export const VERSIONS = ['2a', '2b', '2y']
export const DEFAULT_VERSION = '2b'

export const MIN_COST = 4
export const MAX_COST = 31 // the format's limit; nobody waits for 2^31 rounds
export const DEFAULT_COST = 10
/** Costs above this take seconds in JavaScript; the page warns before running them. */
export const SLOW_ABOVE = 13

/** bcrypt hashes at most this many bytes of the password; the rest is ignored. */
export const MAX_PASSWORD_BYTES = 72

const BCRYPT_RE = /^\$(2[abxy]?)\$(\d{2})\$([./A-Za-z0-9]{22})([./A-Za-z0-9]{31})$/

/** UTF-8 length of a string, which is what bcrypt actually sees. */
export function utf8Length(text) {
  return new TextEncoder().encode(text).length
}

/** True when bcrypt would silently ignore the tail of this password. */
export function truncates(password) {
  return utf8Length(password) > MAX_PASSWORD_BYTES
}

/**
 * Splits a bcrypt string into its parts, or explains why it is not one.
 * Returns { valid: true, version, cost, salt, hash, full } or
 * { valid: false, reason }.
 */
export function parseHash(text) {
  const s = String(text ?? '').trim()
  if (!s) return { valid: false, reason: '' }
  const m = BCRYPT_RE.exec(s)
  if (!m) {
    if (!s.startsWith('$2')) {
      if (/^\$(1|5|6|argon2|pbkdf2|scrypt)/i.test(s)) return { valid: false, reason: 'That is a different hash format (not bcrypt). bcrypt hashes start with $2a$, $2b$ or $2y$.' }
      if (/^[0-9a-f]{32,128}$/i.test(s)) return { valid: false, reason: 'That looks like a hex digest (MD5 / SHA), not a bcrypt hash. bcrypt hashes start with $2a$, $2b$ or $2y$.' }
      return { valid: false, reason: 'Not a bcrypt hash — it should start with $2a$, $2b$ or $2y$.' }
    }
    if (/\s/.test(s)) return { valid: false, reason: 'The hash contains whitespace. A bcrypt hash is one unbroken 60-character string.' }
    if (s.length !== 60) return { valid: false, reason: `The hash is ${s.length} characters long; a bcrypt hash is exactly 60. It has probably been cut off or had characters added.` }
    if (!/^\$2[abxy]?\$\d{2}\$/.test(s)) return { valid: false, reason: 'The prefix is malformed. Expected $2a$, $2b$ or $2y$ followed by a two-digit cost, e.g. $2b$10$.' }
    return { valid: false, reason: 'The salt or hash part contains characters outside bcrypt’s alphabet (. / A–Z a–z 0–9).' }
  }
  const [, version, costText, salt, hash] = m
  const cost = Number(costText)
  if (cost < MIN_COST || cost > MAX_COST) return { valid: false, reason: `Cost ${costText} is out of range; bcrypt allows ${MIN_COST}–${MAX_COST}.` }
  if (version === '2x') return { valid: false, reason: '$2x$ marks a hash produced by the buggy 2011 crypt_blowfish; it cannot be verified reliably.' }
  if (version === '2') return { valid: false, reason: 'The bare $2$ prefix is the obsolete 1999 format, which modern libraries do not accept.' }
  return { valid: true, version, cost, salt, hash, full: s }
}

/** The same hash with a different label — the bytes are unchanged. */
export function withVersion(hash, version) {
  if (!VERSIONS.includes(version)) throw new Error(`Unknown bcrypt version ${version}`)
  return String(hash).replace(/^\$2[abxy]?\$/, `$${version}$`)
}

/** Expected time for `toCost` given a measured `ms` at `fromCost` (each step doubles). */
export function scaleCost(ms, fromCost, toCost) {
  return ms * 2 ** (toCost - fromCost)
}

/** "12 ms", "1.3 s", "2.5 min", "3 h" — rough, for a hint next to the cost selector. */
export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1) return '<1 ms'
  if (ms < 1000) return `${Math.round(ms)} ms`
  const s = ms / 1000
  if (s < 60) return `${s < 10 ? s.toFixed(1) : Math.round(s)} s`
  const min = s / 60
  if (min < 60) return `${min < 10 ? min.toFixed(1) : Math.round(min)} min`
  const h = min / 60
  if (h < 48) return `${h < 10 ? h.toFixed(1) : Math.round(h)} h`
  return `${Math.round(h / 24)} days`
}
