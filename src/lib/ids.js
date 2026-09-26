/**
 * Identifier generation and inspection: UUID v4 and v7 (RFC 9562), ULID,
 * Nano ID and the nil/max UUIDs. All randomness comes from
 * crypto.getRandomValues.
 */

const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
const format = (h) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
const random = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n))

export const NIL_UUID = '00000000-0000-0000-0000-000000000000'
export const MAX_UUID = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

export function uuidv4() {
  const b = random(16)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  return format(hex(b))
}

// Monotonic within one millisecond (RFC 9562 §6.2, method 1): rand_a is a
// 12-bit counter seeded randomly each new millisecond and incremented after.
let lastMs = -1
let counter = 0

/** UUID v7: 48-bit Unix milliseconds, version, 12-bit counter, variant, 62 random bits. */
export function uuidv7(nowMs = Date.now()) {
  let ms = nowMs
  if (ms > lastMs) {
    lastMs = ms
    counter = random(2).reduce((a, x) => (a << 8) | x, 0) & 0x7ff // leave headroom
  } else {
    ms = lastMs
    counter++
    if (counter > 0xfff) {
      lastMs = ++ms
      counter = 0
    }
  }
  const b = random(16)
  for (let i = 5; i >= 0; i--) {
    b[i] = ms % 256
    ms = Math.floor(ms / 256)
  }
  b[6] = 0x70 | (counter >> 8)
  b[7] = counter & 0xff
  b[8] = (b[8] & 0x3f) | 0x80
  return format(hex(b))
}

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
let lastUlidMs = -1
let lastUlidRand = null

/** ULID: 10 characters of time, 16 of randomness; monotonic within a millisecond. */
export function ulid(nowMs = Date.now()) {
  let rand
  if (nowMs <= lastUlidMs && lastUlidRand) {
    rand = lastUlidRand.slice()
    for (let i = rand.length - 1; i >= 0; i--) {
      if (rand[i] < 31) {
        rand[i]++
        break
      }
      rand[i] = 0
    }
    nowMs = lastUlidMs
  } else {
    rand = Array.from(random(16), (x) => x & 31)
    lastUlidMs = nowMs
  }
  lastUlidRand = rand
  let t = ''
  let ms = nowMs
  for (let i = 0; i < 10; i++) {
    t = CROCKFORD[ms % 32] + t
    ms = Math.floor(ms / 32)
  }
  return t + rand.map((x) => CROCKFORD[x]).join('')
}

const NANO_ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
export function nanoId(size = 21) {
  const bytes = random(size)
  let out = ''
  for (let i = 0; i < size; i++) out += NANO_ALPHABET[bytes[i] & 63]
  return out
}

// 100-ns intervals between 1582-10-15 (the Gregorian epoch) and 1970-01-01.
const GREGORIAN_OFFSET = 122192928000000000n

const VARIANTS = [
  [0x80, 0xc0, 'RFC 9562 (the standard one)'],
  [0x00, 0x80, 'NCS (reserved, backward compatibility)'],
  [0xc0, 0xe0, 'Microsoft (reserved)'],
  [0xe0, 0xe0, 'Reserved for future definition'],
]

const VERSION_NAMES = {
  1: 'time-based (Gregorian, with node ID)',
  2: 'DCE security',
  3: 'name-based (MD5)',
  4: 'random',
  5: 'name-based (SHA-1)',
  6: 'time-ordered (reordered v1)',
  7: 'time-ordered (Unix milliseconds)',
  8: 'custom',
}

/** What a pasted identifier is: UUID (any version) or ULID, with its time if it has one. */
export function inspectId(raw) {
  const s = raw.trim().replace(/^urn:uuid:/i, '').replace(/^\{(.*)\}$/, '$1')
  if (!s) return null
  if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(s) && !/^[0-9a-f]{26}$/i.test(s)) {
    const up = s.toUpperCase()
    if (CROCKFORD.indexOf(up[0]) > 7) return { valid: false, error: 'Not a valid ULID: the first character must be 0–7 (the timestamp overflows otherwise)' }
    let ms = 0
    for (const c of up.slice(0, 10)) ms = ms * 32 + CROCKFORD.indexOf(c)
    return { valid: true, kind: 'ULID', canonical: up, ms, date: new Date(ms) }
  }
  const h = s.replace(/-/g, '').toLowerCase()
  if (!/^[0-9a-f]{32}$/.test(h)) return { valid: false, error: 'Not a UUID (32 hex digits, usually 8-4-4-4-12) or a ULID (26 Crockford base32 characters)' }
  const canonical = format(h)
  if (h === '0'.repeat(32)) return { valid: true, kind: 'Nil UUID', canonical, version: null, variant: '—' }
  if (h === 'f'.repeat(32)) return { valid: true, kind: 'Max UUID', canonical, version: null, variant: '—' }
  const version = parseInt(h[12], 16)
  const vb = parseInt(h.slice(16, 18), 16)
  const variant = VARIANTS.find(([v, mask]) => (vb & mask) === v)?.[2] || 'Unknown'
  const out = { valid: true, kind: `UUID v${version}`, canonical, version, versionName: VERSION_NAMES[version] || 'unknown version', variant, standard: (vb & 0xc0) === 0x80 }
  if (version === 7) out.ms = parseInt(h.slice(0, 12), 16)
  if (version === 1 || version === 6) {
    const t = version === 1 ? h.slice(13, 16) + h.slice(8, 12) + h.slice(0, 8) : h.slice(0, 12) + h.slice(13, 16)
    const ticks = BigInt('0x' + t)
    out.ms = Number((ticks - GREGORIAN_OFFSET) / 10000n)
  }
  if (out.ms !== undefined) out.date = new Date(out.ms)
  return out
}
