/**
 * Base64 and Base64URL (RFC 4648 §4 and §5) over bytes, so any text — emoji
 * included — goes through UTF-8 first instead of breaking btoa().
 */

const STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const URLSAFE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

export function encodeBytes(bytes, { url = false, pad = !url } = {}) {
  const alphabet = url ? URLSAFE : STD
  let out = ''
  let i = 0
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    out += alphabet[n >> 18] + alphabet[(n >> 12) & 63] + alphabet[(n >> 6) & 63] + alphabet[n & 63]
  }
  const rest = bytes.length - i
  if (rest === 1) {
    const n = bytes[i] << 16
    out += alphabet[n >> 18] + alphabet[(n >> 12) & 63] + (pad ? '==' : '')
  } else if (rest === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8)
    out += alphabet[n >> 18] + alphabet[(n >> 12) & 63] + alphabet[(n >> 6) & 63] + (pad ? '=' : '')
  }
  return out
}

export const encodeText = (text, opts) => encodeBytes(new TextEncoder().encode(text), opts)

export class Base64Error extends Error {
  constructor(message, pos, char) {
    super(message)
    this.pos = pos
    this.char = char
  }
}

const describe = (ch) => {
  const cp = ch.codePointAt(0)
  if (ch === ' ') return 'a space'
  if (cp < 0x20 || cp === 0x7f) return `control character U+${cp.toString(16).toUpperCase().padStart(4, '0')}`
  return `"${ch}"`
}

/**
 * Decodes standard or URL-safe Base64 (either alphabet is accepted; `url`
 * only changes the error wording). Whitespace and line breaks are ignored, as
 * MIME and PEM wrap lines. Padding is optional. Throws Base64Error with the
 * 1-based position of the first bad character.
 */
export function decodeToBytes(input, { url = false } = {}) {
  const values = []
  let padding = 0
  let seenPadAt = -1
  const text = String(input)
  let pos = 0
  for (const ch of text) {
    pos++
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') continue
    if (ch === '=') {
      padding++
      if (seenPadAt < 0) seenPadAt = pos
      continue
    }
    if (seenPadAt >= 0) throw new Base64Error(`"=" padding can only appear at the end (position ${seenPadAt})`, seenPadAt, '=')
    let v = STD.indexOf(ch)
    if (v < 0) v = URLSAFE.indexOf(ch)
    if (v < 0) {
      const hint = url ? 'Base64URL uses A–Z a–z 0–9 - _' : 'Base64 uses A–Z a–z 0–9 + / and = padding'
      throw new Base64Error(`Invalid character ${describe(ch)} at position ${pos}. ${hint}.`, pos, ch)
    }
    values.push(v)
  }
  if (padding > 2) throw new Base64Error('Too much "=" padding — at most two are allowed', seenPadAt, '=')
  if (values.length % 4 === 1) {
    throw new Base64Error(`Truncated input: ${values.length} characters cannot be a whole number of bytes (one character is missing or extra)`, text.length, '')
  }
  const out = new Uint8Array(Math.floor((values.length * 3) / 4))
  let o = 0
  for (let i = 0; i < values.length; i += 4) {
    const n = (values[i] << 18) | (values[i + 1] << 12) | ((values[i + 2] ?? 0) << 6) | (values[i + 3] ?? 0)
    out[o++] = n >> 16
    if (i + 2 < values.length) out[o++] = (n >> 8) & 255
    if (i + 3 < values.length) out[o++] = n & 255
  }
  return out
}

/** UTF-8 text if the bytes are valid UTF-8, otherwise null. */
export function bytesToText(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}

/** Does this look like Base64 someone wants decoded, rather than text to encode? */
export function looksLikeBase64(input) {
  const s = String(input).replace(/\s+/g, '')
  if (s.length < 8 || s.length % 4 === 1) return false
  if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(s)) return false
  // Plain words ("password", "HelloWorld") pass the alphabet test; real
  // Base64 of text almost always mixes cases with digits or symbols.
  if (!/[0-9+/_=-]/.test(s) && !(/[a-z]/.test(s) && /[A-Z]/.test(s) && s.length >= 16)) return false
  try {
    decodeToBytes(s)
    return true
  } catch {
    return false
  }
}

/** Base64URL if it uses - or _, or is unpadded where padding would be due. */
export function looksLikeBase64Url(input) {
  const s = String(input).replace(/\s+/g, '')
  if (/[-_]/.test(s)) return true
  if (/[+/]/.test(s)) return false
  return !s.endsWith('=') && s.length % 4 !== 0
}

const SIGNATURES = [
  { mime: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', ext: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/gif', ext: 'gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46], at8: [0x57, 0x45, 0x42, 0x50] },
  { mime: 'image/bmp', ext: 'bmp', bytes: [0x42, 0x4d] },
  { mime: 'image/x-icon', ext: 'ico', bytes: [0x00, 0x00, 0x01, 0x00] },
  { mime: 'application/pdf', ext: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'application/zip', ext: 'zip', bytes: [0x50, 0x4b, 0x03, 0x04] },
  { mime: 'application/gzip', ext: 'gz', bytes: [0x1f, 0x8b] },
]

/** Identifies common file types by their magic bytes. */
export function sniff(bytes) {
  for (const sig of SIGNATURES) {
    if (sig.bytes.every((b, i) => bytes[i] === b) && (!sig.at8 || sig.at8.every((b, i) => bytes[8 + i] === b))) {
      return { mime: sig.mime, ext: sig.ext, image: sig.mime.startsWith('image/') }
    }
  }
  const head = bytesToText(bytes.slice(0, 256))
  if (head && /^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(head)) return { mime: 'image/svg+xml', ext: 'svg', image: true }
  return null
}

/** Accepts "data:image/png;base64,AAAA" and returns just the payload and its type. */
export function splitDataUri(input) {
  const m = /^\s*data:([^;,]*)(;[^,]*)?,/.exec(input)
  if (!m || !/;base64/i.test(m[2] || '')) return null
  return { mime: m[1] || 'application/octet-stream', data: input.slice(m[0].length) }
}
