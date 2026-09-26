/**
 * Percent-encoding (RFC 3986). Two scopes:
 *   component — encodeURIComponent: for one query value or path segment;
 *               everything except A–Z a–z 0–9 - _ . ! ~ * ' ( ) is encoded.
 *   uri       — encodeURI: for a whole URL; keeps : / ? # [ ] @ & = + $ , ;
 * Space can be written as %20 (RFC 3986) or + (HTML form encoding).
 */

export function encode(text, { mode = 'component', space = '%20' } = {}) {
  let out = mode === 'uri' ? encodeURI(text) : encodeURIComponent(text)
  if (space === '+') out = out.replace(/%20/g, '+')
  return out
}

/** Decodes, reporting the first malformed %-sequence by position. */
export function decode(text, { mode = 'component', plusAsSpace = false } = {}) {
  const src = plusAsSpace ? text.replace(/\+/g, ' ') : text
  try {
    return mode === 'uri' ? decodeURI(src) : decodeURIComponent(src)
  } catch {
    const bad = findMalformed(src)
    throw new Error(bad ? `Malformed percent-encoding at position ${bad.pos}: "${bad.seq}" ${bad.why}` : 'Malformed percent-encoding')
  }
}

function findMalformed(s) {
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '%') continue
    const hex = s.slice(i + 1, i + 3)
    if (!/^[0-9a-fA-F]{2}$/.test(hex)) return { pos: i + 1, seq: s.slice(i, i + 3), why: 'is not % followed by two hex digits (a literal % is written %25)' }
    // Collect the whole UTF-8 run and see whether it decodes.
    let j = i
    while (s[j] === '%' && /^[0-9a-fA-F]{2}$/.test(s.slice(j + 1, j + 3))) j += 3
    try {
      decodeURIComponent(s.slice(i, j))
    } catch {
      return { pos: i + 1, seq: s.slice(i, j), why: 'is not valid UTF-8' }
    }
    i = j - 1
  }
  return null
}

/** %25 followed by hex — a percent sign that was itself percent-encoded. */
export const looksDoubleEncoded = (text) => /%25[0-9a-fA-F]{2}/.test(text)

/** Characters that encodeURIComponent would change, for the explanation table. */
export function encodedCharacters(text) {
  const seen = new Map()
  for (const ch of text) {
    const enc = encodeURIComponent(ch)
    if (enc !== ch && !seen.has(ch)) seen.set(ch, enc)
  }
  return [...seen]
}
