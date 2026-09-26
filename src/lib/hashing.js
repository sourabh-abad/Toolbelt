/**
 * Digests and HMACs over bytes. SHA-* and HMAC use the browser's Web Crypto
 * API (crypto.subtle); MD5, which Web Crypto deliberately leaves out, comes
 * from the small `md5` package, loaded only when it is needed.
 */
import { encodeBytes, decodeToBytes } from './base64.js'

export const ALGORITHMS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']
export const HMAC_ALGORITHMS = ['SHA-256', 'SHA-384', 'SHA-512']

const hexToBytes = (hex) => Uint8Array.from(hex.match(/../g) || [], (h) => parseInt(h, 16))
export const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

let md5Promise
async function md5(bytes) {
  md5Promise ||= import('md5').then((m) => m.default || m)
  const fn = await md5Promise
  return hexToBytes(fn(bytes))
}

export async function digest(algorithm, bytes) {
  if (algorithm === 'MD5') return md5(bytes)
  return new Uint8Array(await crypto.subtle.digest(algorithm, bytes))
}

/** { 'SHA-256': Uint8Array, … } for every algorithm. */
export async function digestAll(bytes, algorithms = ALGORITHMS) {
  const entries = await Promise.all(algorithms.map(async (a) => [a, await digest(a, bytes)]))
  return Object.fromEntries(entries)
}

export async function hmac(algorithm, keyBytes, bytes) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: algorithm }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, bytes))
}

export function formatDigest(bytes, format = 'hex') {
  if (format === 'base64') return encodeBytes(bytes)
  const hex = toHex(bytes)
  return format === 'HEX' ? hex.toUpperCase() : hex
}

/**
 * Normalises a pasted checksum — "sha256:abc…", "abc…  file.zip" (sha256sum
 * output), upper case, Base64 — to bytes, or null if it is neither hex nor
 * Base64.
 */
export function parseChecksum(text) {
  let s = String(text).trim()
  if (!s) return null
  s = s.replace(/^(md5|sha-?1|sha-?256|sha-?384|sha-?512)\s*[:=]\s*/i, '')
  s = s.split(/\s+/)[0]
  if (/^[0-9a-f]+$/i.test(s) && s.length % 2 === 0) return hexToBytes(s.toLowerCase())
  if (!/^[A-Za-z0-9+/_-]{16,}={0,2}$/.test(s)) return null
  try {
    return decodeToBytes(s)
  } catch {
    return null
  }
}

/** Which algorithm's digest equals the expected checksum, if any. */
export function matchChecksum(expected, digests) {
  const want = parseChecksum(expected)
  if (!want) return { valid: false, match: null }
  for (const [alg, bytes] of Object.entries(digests)) {
    if (bytes.length === want.length && bytes.every((b, i) => b === want[i])) return { valid: true, match: alg }
  }
  return { valid: true, match: null, length: want.length }
}
