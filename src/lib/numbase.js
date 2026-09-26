/**
 * Number base conversion on BigInt, so a 64-bit ID or a 256-bit hash converts
 * exactly instead of being rounded to the nearest double.
 */

export const BASES = [
  { base: 2, label: 'Binary', prefix: '0b', digits: /^[01]+$/ },
  { base: 8, label: 'Octal', prefix: '0o', digits: /^[0-7]+$/ },
  { base: 10, label: 'Decimal', prefix: '', digits: /^[0-9]+$/ },
  { base: 16, label: 'Hexadecimal', prefix: '0x', digits: /^[0-9a-f]+$/i },
]

const PREFIX = { '0b': 2, '0o': 8, '0x': 16 }

/**
 * Parses text in `base` (or the base its 0x / 0b / 0o prefix names). Accepts
 * a leading minus and ignores _ , spaces and apostrophes used as digit
 * separators. Returns { value: BigInt, base } or throws with a readable reason.
 */
export function parseInBase(text, base = 10) {
  let s = String(text).trim().replace(/[_\s',]/g, '')
  if (!s) throw new Error('Enter a number')
  let negative = false
  if (s[0] === '-' || s[0] === '+') {
    negative = s[0] === '-'
    s = s.slice(1)
  }
  const p = s.slice(0, 2).toLowerCase()
  if (PREFIX[p]) {
    base = PREFIX[p]
    s = s.slice(2)
  } else if (base === 16 && /^h/i.test(s.slice(-1))) {
    s = s.slice(0, -1) // 1Fh assembler style
  }
  const spec = BASES.find((b) => b.base === base)
  if (!spec) throw new Error(`Unsupported base ${base}`)
  if (!s) throw new Error('Enter digits after the prefix')
  if (!spec.digits.test(s)) {
    const bad = [...s].find((ch) => !spec.digits.test(ch))
    throw new Error(`"${bad}" is not a ${spec.label.toLowerCase()} digit`)
  }
  let value = 0n
  const b = BigInt(base)
  for (const ch of s.toLowerCase()) value = value * b + BigInt(parseInt(ch, 36))
  return { value: negative ? -value : value, base }
}

/** Groups digits from the right: 11110000 → 1111 0000. */
export function group(digits, size, sep = ' ') {
  if (size <= 0) return digits
  const out = []
  for (let i = digits.length; i > 0; i -= size) out.unshift(digits.slice(Math.max(0, i - size), i))
  return out.join(sep)
}

export function toBase(value, base) {
  const neg = value < 0n
  const s = (neg ? -value : value).toString(base)
  return (neg ? '-' : '') + (base === 16 ? s.toUpperCase() : s)
}

/** Bits needed for the magnitude (0 → 1). */
export const bitLength = (value) => (value < 0n ? -value : value).toString(2).length

/**
 * Two's complement views of `value` at fixed widths: the unsigned and signed
 * readings of the same bit pattern, or null where it does not fit.
 */
export function fixedWidths(value, widths = [8, 16, 32, 64]) {
  return widths.map((bits) => {
    const w = BigInt(bits)
    const min = -(1n << (w - 1n))
    const max = (1n << w) - 1n
    if (value < min || value > max) return { bits, fits: false }
    const pattern = value < 0n ? (1n << w) + value : value
    const signed = pattern >= 1n << (w - 1n) ? pattern - (1n << w) : pattern
    return {
      bits,
      fits: true,
      unsigned: pattern,
      signed,
      hex: pattern.toString(16).toUpperCase().padStart(bits / 4, '0'),
      binary: pattern.toString(2).padStart(bits, '0'),
    }
  })
}

/** Everything the page shows for one input. */
export function convert(text, base) {
  const { value, base: detected } = parseInBase(text, base)
  return {
    value,
    detected,
    bits: bitLength(value),
    bases: BASES.map((b) => ({ ...b, digits: toBase(value, b.base) })),
    widths: fixedWidths(value),
  }
}
