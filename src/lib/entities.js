/**
 * HTML entity encoding and decoding.
 *
 * Encoding has three strengths, because "escape for HTML" means different
 * things in a text node, in an attribute, and on the way into an ASCII-only
 * pipeline. Decoding understands every named entity when a DOMParser is
 * available (the browser's own table, all 2,231 of them) and falls back to
 * numeric references plus the common names otherwise.
 */

const COMMON = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', trade: '™',
  hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»',
  bull: '•', middot: '·', deg: '°', plusmn: '±', times: '×', divide: '÷', micro: 'µ', para: '¶', sect: '§',
  euro: '€', pound: '£', yen: '¥', cent: '¢', larr: '←', rarr: '→', uarr: '↑', darr: '↓', harr: '↔',
  le: '≤', ge: '≥', ne: '≠', asymp: '≈', infin: '∞', check: '✓', hearts: '♥', eacute: 'é', egrave: 'è',
  aacute: 'á', agrave: 'à', ouml: 'ö', uuml: 'ü', auml: 'ä', szlig: 'ß', ntilde: 'ñ', ccedil: 'ç', shy: '­',
  ensp: ' ', emsp: ' ', thinsp: ' ', zwj: '‍', zwnj: '‌',
}
const NAME_FOR = Object.fromEntries(Object.entries(COMMON).map(([k, v]) => [v, k]))

export const MODES = [
  { id: 'minimal', label: 'Minimal', hint: 'Escapes & < > " \' — safe in text and quoted attributes.' },
  { id: 'named', label: 'Named', hint: 'Minimal, plus common symbols as named entities (&copy; &mdash; &nbsp;).' },
  { id: 'ascii', label: 'All non-ASCII', hint: 'Every character above U+007F as a numeric reference — output is pure ASCII.' },
]

export function encodeEntities(text, mode = 'minimal') {
  let out = ''
  for (const ch of String(text)) {
    const cp = ch.codePointAt(0)
    if (ch === '&') out += '&amp;'
    else if (ch === '<') out += '&lt;'
    else if (ch === '>') out += '&gt;'
    else if (ch === '"') out += '&quot;'
    else if (ch === "'") out += '&#39;'
    else if (mode === 'named' && NAME_FOR[ch]) out += `&${NAME_FOR[ch]};`
    else if (mode === 'ascii' && cp > 0x7f) out += `&#x${cp.toString(16).toUpperCase()};`
    else out += ch
  }
  return out
}

const REF = /&(#[xX][0-9a-fA-F]+|#[0-9]+|[A-Za-z][A-Za-z0-9]*);?/g

function fromCodePoint(n) {
  // Per the HTML spec, 0, surrogates and out-of-range become U+FFFD.
  if (n === 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) return '�'
  return String.fromCodePoint(n)
}

/** Decodes without a DOM: numeric references and the common named ones. */
export function decodeBasic(text) {
  return String(text).replace(REF, (m, body) => {
    if (body[0] === '#') {
      const n = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      return fromCodePoint(n)
    }
    return Object.prototype.hasOwnProperty.call(COMMON, body) ? COMMON[body] : m
  })
}

/**
 * Decodes with the browser's full entity table. DOMParser builds an inert
 * document: nothing in the text runs, loads or makes a request.
 */
export function decodeEntities(text) {
  if (typeof DOMParser === 'undefined') return decodeBasic(text)
  const doc = new DOMParser().parseFromString(`<!doctype html><textarea>${String(text).replace(/<\/textarea/gi, '&lt;/textarea')}</textarea>`, 'text/html')
  return doc.querySelector('textarea')?.value ?? decodeBasic(text)
}

/** Every entity reference found, for the breakdown table. */
export function findReferences(text) {
  const out = []
  for (const m of String(text).matchAll(REF)) {
    out.push({ ref: m[0], char: decodeEntities(m[0]), terminated: m[0].endsWith(';') })
  }
  return out
}
