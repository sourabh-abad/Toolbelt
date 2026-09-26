/**
 * Identifier case conversion. The hard part is splitting: "XMLHttpRequest2FA"
 * has to become xml / http / request / 2fa, and "user_id", "user-id",
 * "userId" and "User ID" all have to become user / id.
 */

// Boundaries: separators; lower→Upper (fooBar); an acronym before a word
// (XMLHttp → XML | Http); letter→digit stays joined (utf8, v2) so version
// numbers and suffixes survive a round trip.
export function splitWords(input) {
  return String(input)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
}

const lower = (w) => w.toLowerCase()
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()

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

/** Converts one identifier or phrase to every case. */
export function convertAll(input) {
  const words = splitWords(input)
  return CASES.map((c) => ({ ...c, value: words.length ? c.fn(words) : '' }))
}

/** Converts each non-empty line separately, keeping blank lines. */
export function convertLines(input, id) {
  const c = CASES.find((x) => x.id === id)
  if (!c) throw new Error(`Unknown case: ${id}`)
  return String(input)
    .split('\n')
    .map((line) => {
      const words = splitWords(line)
      return words.length ? c.fn(words) : ''
    })
    .join('\n')
}

/** Best guess at which convention a string already uses, or null. */
export function detectCase(s) {
  const t = String(s).trim()
  if (!t || /\s/.test(t)) return null
  if (/^[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)+$/.test(t)) return 'camel'
  if (/^[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)*$/.test(t)) return 'pascal'
  if (/^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(t)) return 'snake'
  if (/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(t)) return 'screaming'
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(t)) return 'kebab'
  if (/^[A-Z][a-z0-9]*(?:-[A-Z][a-z0-9]*)+$/.test(t)) return 'train'
  if (/^[a-z0-9]+(?:\.[a-z0-9]+)+$/.test(t)) return 'dot'
  return null
}
