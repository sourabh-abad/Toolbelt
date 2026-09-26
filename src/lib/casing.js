/**
 * Identifier case conversion. The hard part is splitting: "XMLHttpRequest2FA"
 * has to become xml / http / request / 2fa, and "user_id", "user-id",
 * "userId" and "User ID" all have to become user / id.
 */

// Boundaries: separators; lower→Upper (fooBar); an acronym before a word
// (XMLHttp → XML | Http); letter→digit stays joined (utf8, v2) so version
// numbers and suffixes survive a round trip.
//
// Unicode-aware throughout: \p{L} is a letter in any script, \p{Lu} / \p{Ll}
// upper / lower case, \p{N} a digit, \p{M} a combining mark (kept with its
// letter). "Ça va déjà" is three words, not "a", "va", "d", "j".
export function splitWords(input) {
  return String(input)
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu}+)(\p{Lu}[\p{Ll}\p{M}])/gu, '$1 $2')
    .split(/[^\p{L}\p{N}\p{M}]+/u)
    .filter(Boolean)
}

/** "déjà" → "deja": decompose, then drop the combining marks. */
export const stripAccents = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC')

const lower = (w) => w.toLowerCase()
// Code points, not UTF-16 units, so an astral first letter is not split.
const cap = (w) => {
  const [first = '', ...rest] = [...w]
  return first.toUpperCase() + rest.join('').toLowerCase()
}

export const CASES = [
  { id: 'camel', label: 'camelCase', fn: (w) => w.map((x, i) => (i ? cap(x) : lower(x))).join('') },
  { id: 'pascal', label: 'PascalCase', fn: (w) => w.map(cap).join('') },
  { id: 'snake', label: 'snake_case', fn: (w) => w.map(lower).join('_') },
  { id: 'screaming', label: 'SCREAMING_SNAKE_CASE', fn: (w) => w.map((x) => x.toUpperCase()).join('_') },
  { id: 'kebab', label: 'kebab-case', fn: (w) => w.map(lower).join('-') },
  { id: 'train', label: 'Train-Case', fn: (w) => w.map(cap).join('-') },
  { id: 'dot', label: 'dot.case', fn: (w) => w.map(lower).join('.') },
  { id: 'path', label: 'path/case', fn: (w) => w.map(lower).join('/') },
  { id: 'title', label: 'Title Case', fn: (w) => w.map(cap).join(' ') },
  { id: 'sentence', label: 'Sentence case', fn: (w) => w.map((x, i) => (i ? lower(x) : cap(x))).join(' ') },
  { id: 'lower', label: 'lower case', fn: (w) => w.map(lower).join(' ') },
  { id: 'upper', label: 'UPPER CASE', fn: (w) => w.map((x) => x.toUpperCase()).join(' ') },
]

const prepare = (s, opts) => splitWords(opts?.stripAccents ? stripAccents(s) : s)

/** Converts one identifier or phrase to every case. */
export function convertAll(input, opts) {
  const words = prepare(input, opts)
  return CASES.map((c) => ({ ...c, value: words.length ? c.fn(words) : '' }))
}

/** Converts each non-empty line separately, keeping blank lines. */
export function convertLines(input, id, opts) {
  const c = CASES.find((x) => x.id === id)
  if (!c) throw new Error(`Unknown case: ${id}`)
  return String(input)
    .split('\n')
    .map((line) => {
      const words = prepare(line, opts)
      return words.length ? c.fn(words) : ''
    })
    .join('\n')
}

/** Best guess at which convention a string already uses, or null. */
export function detectCase(s) {
  const t = String(s).trim()
  if (!t || /\s/.test(t)) return null
  const lo = '[\\p{Ll}\\p{N}\\p{M}]'
  const up = '[\\p{Lu}\\p{N}\\p{M}]'
  const is = (re) => new RegExp(re, 'u').test(t)
  if (is(`^\\p{Ll}${lo}*(?:\\p{Lu}${lo}*)+$`)) return 'camel'
  if (is(`^\\p{Lu}${lo}+(?:\\p{Lu}${lo}*)*$`)) return 'pascal'
  if (is(`^${lo}+(?:_${lo}+)+$`)) return 'snake'
  if (is(`^${up}+(?:_${up}+)+$`)) return 'screaming'
  if (is(`^${lo}+(?:-${lo}+)+$`)) return 'kebab'
  if (is(`^\\p{Lu}${lo}*(?:-\\p{Lu}${lo}*)+$`)) return 'train'
  if (is(`^${lo}+(?:\\.${lo}+)+$`)) return 'dot'
  return null
}
