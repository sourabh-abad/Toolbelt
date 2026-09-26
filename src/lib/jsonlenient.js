/**
 * Lenient mode for the JSON Formatter: blanks out // and /* *\/ comments and
 * trailing commas so JSONC (tsconfig.json, VS Code settings) and simple JSON5
 * parse as JSON. Removed characters become spaces and newlines are kept, so
 * every line and column in an error message still points at the original.
 */
export function stripJsonc(text) {
  const out = text.split('')
  let comments = 0
  let trailingCommas = 0
  let inString = false
  let lastComma = -1 // index of a comma not yet followed by a value
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (ch === '\\') i++
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      lastComma = -1
    } else if (ch === '/' && text[i + 1] === '/') {
      comments++
      while (i < text.length && text[i] !== '\n') out[i++] = ' '
    } else if (ch === '/' && text[i + 1] === '*') {
      comments++
      const end = text.indexOf('*/', i + 2)
      const stop = end < 0 ? text.length : end + 2
      for (; i < stop; i++) if (text[i] !== '\n') out[i] = ' '
      i--
    } else if (ch === ',') {
      lastComma = i
    } else if (ch === '}' || ch === ']') {
      if (lastComma >= 0) {
        out[lastComma] = ' '
        trailingCommas++
      }
      lastComma = -1
    } else if (!/\s/.test(ch)) {
      lastComma = -1
    }
  }
  return { text: out.join(''), comments, trailingCommas }
}
