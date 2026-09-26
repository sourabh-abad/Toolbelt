/**
 * Strict JSON parsing with two things JSON.parse does not give you:
 *
 * 1. Lossless numbers. JSON.parse turns every number into a double, so
 *    12345678901234567890 silently becomes 12345678901234567000, a common way
 *    to corrupt 64-bit IDs. Numbers a double cannot hold exactly are kept as
 *    a LosslessNumber that carries the original digits, and stringify() writes
 *    those digits back out unchanged.
 *
 * 2. Errors that say where and why. Browser messages differ by engine, some
 *    have no position, and none of them say "trailing comma". The
 *    hand-written parser here reports a line, a column and a plain-language
 *    reason that matches the guide on the validator page.
 *
 * The native parser still does the work whenever it can, because it is several
 * times faster. The hand-written one runs only when the text failed to parse
 * (to explain why) or contains a number long enough to lose precision.
 */

export class LosslessNumber {
  constructor(raw) {
    this.raw = raw
  }
  valueOf() {
    return Number(this.raw)
  }
  toString() {
    return this.raw
  }
}

export const isLossless = (v) => v instanceof LosslessNumber

export class JsonSyntaxError extends Error {
  constructor(reason, pos, text, tip = '') {
    const { line, col } = lineCol(text, pos)
    super(`Line ${line}, column ${col}: ${reason}`)
    this.name = 'JsonSyntaxError'
    this.reason = reason
    this.tip = tip
    this.pos = pos
    this.line = line
    this.col = col
  }
}

/** 1-based line and column of a character offset. */
export function lineCol(text, pos) {
  let line = 1
  let lastNl = -1
  const end = Math.min(pos, text.length)
  for (let i = 0; i < end; i++) {
    if (text.charCodeAt(i) === 10) {
      line++
      lastNl = i
    }
  }
  return { line, col: pos - lastNl }
}

// Canonical "digits e exponent" form, so 1.50, 15e-1 and 1.5 compare equal.
function canon(str) {
  const s = str.toLowerCase().replace(/^[-+]/, '')
  const [m, e = '0'] = s.split('e')
  const [ip, fp = ''] = m.split('.')
  let digits = ip + fp
  let exp = Number(e) + ip.length
  const lead = digits.length - digits.replace(/^0+/, '').length
  digits = digits.slice(lead)
  exp -= lead
  digits = digits.replace(/0+$/, '')
  return digits ? `${digits}e${exp}` : '0'
}

/** True when converting `raw` to a double would change its value. */
export function isLossyNumber(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n)) return true
  if (/^-?\d+$/.test(raw)) return !Number.isSafeInteger(n)
  return canon(raw) !== canon(String(n))
}

// Anything that could be a number with more significant digits than a double
// holds, or an exponent big enough to overflow. False positives (a long digit
// run inside a string) only cost a slower parse, never a wrong answer.
const MAYBE_LOSSY = /\d[\d.]{15,}|[eE][+-]?\d{3,}/

const WS = new Set([0x20, 0x09, 0x0a, 0x0d])
const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y

/**
 * The hand-written strict parser. Returns { value, bigNumbers, duplicates }
 * or throws a JsonSyntaxError.
 */
export function parseStrict(text) {
  const len = text.length
  const bigNumbers = []
  const duplicates = []
  let i = 0

  const fail = (reason, pos = i, tip = '') => {
    throw new JsonSyntaxError(reason, pos, text, tip)
  }

  const skipWs = () => {
    for (;;) {
      while (i < len && WS.has(text.charCodeAt(i))) i++
      // Comments are not JSON, but name them rather than calling "/" unexpected.
      if (text[i] === '/' && (text[i + 1] === '/' || text[i + 1] === '*')) {
        fail('Comments not allowed', i, 'JSON has no comment syntax. Remove the // or /* */ comment.')
      }
      return
    }
  }

  const describe = (pos) => {
    if (pos >= len) return 'end of input'
    const c = text[pos]
    if (c === '\n') return 'a line break'
    return `'${c}'`
  }

  function parseString() {
    const start = i
    i++ // opening quote
    let escaped = false
    for (;;) {
      if (i >= len) fail('Unterminated string', start, 'A string is missing its closing double quote.')
      const code = text.charCodeAt(i)
      if (code === 0x22) break
      if (code === 0x5c) {
        escaped = true
        const n = text[i + 1]
        if (n === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) {
            fail('Invalid \\u escape in string', i, 'A \\u escape needs exactly four hex digits, e.g. \\u00e9.')
          }
          i += 6
          continue
        }
        if (n === undefined || !'"\\/bfnrt'.includes(n)) {
          fail(`Invalid escape \\${n ?? ''} in string`, i, 'Valid escapes are \\" \\\\ \\/ \\b \\f \\n \\r \\t and \\uXXXX. Write a literal backslash as \\\\.')
        }
        i += 2
        continue
      }
      if (code < 0x20) {
        if (code === 0x0a || code === 0x0d) {
          fail('Line break inside a string', i, 'Strings cannot span lines. Write the line break as \\n, or check for a missing closing quote.')
        }
        fail('Unescaped control character in string', i, 'Tabs and other control characters must be escaped, e.g. \\t.')
      }
      i++
    }
    i++ // closing quote
    const raw = text.slice(start + 1, i - 1)
    return escaped ? JSON.parse(text.slice(start, i)) : raw
  }

  function parseNumber(path) {
    const start = i
    const c = text[i]
    if (c === '+') fail('A leading + is not allowed', i, 'Write the number without the plus sign.')
    if (c === '.') fail('Numbers need a digit before the decimal point', i, 'Write .5 as 0.5.')
    NUMBER.lastIndex = i
    const m = NUMBER.exec(text)
    if (!m || m[0] === '-') {
      if (text.startsWith('-Infinity', i)) fail('-Infinity is not a JSON value', i, 'JSON has no Infinity. Use null or a very large number.')
      fail('Invalid number', i)
    }
    const raw = m[0]
    i += raw.length
    const next = text[i]
    if (next !== undefined && /[0-9xX.eE]/.test(next)) {
      if (/^-?0\d/.test(text.slice(start, i + 1))) fail('Leading zeros are not allowed', start, 'Write 007 as 7, or quote it as a string if the zeros matter.')
      if (/^-?0[xX]/.test(text.slice(start, i + 1))) fail('Hex numbers are not allowed', start, 'Convert the value to decimal, or quote it as a string.')
      if (next === '.') fail('Expected a digit after the decimal point', i + 1, 'Write 1. as 1 or 1.0.')
      fail('Invalid number', start)
    }
    if (raw.endsWith('.') || /[eE][+-]?$/.test(raw)) fail('Invalid number', start)
    if (isLossyNumber(raw)) {
      bigNumbers.push({ path: [...path], raw, pos: start })
      return new LosslessNumber(raw)
    }
    return Number(raw)
  }

  function parseLiteral() {
    const rest = text.slice(i, i + 9)
    for (const [word, value] of [['true', true], ['false', false], ['null', null]]) {
      if (rest.startsWith(word) && !/[A-Za-z0-9_$]/.test(text[i + word.length] ?? '')) {
        i += word.length
        return value
      }
    }
    const word = /^[A-Za-z_$][\w$]*/.exec(text.slice(i, i + 40))?.[0]
    if (word === 'NaN' || word === 'Infinity' || word === 'undefined') {
      fail(`${word} is not a JSON value`, i, 'JSON has no NaN, Infinity or undefined. Use null, or quote it as a string.')
    }
    if (word && /^(true|false|null|none)$/i.test(word)) {
      fail(`Invalid literal ${word}`, i, 'JSON literals are lowercase: true, false and null.')
    }
    if (word) fail(`Unexpected word ${word}`, i, 'Text values must be in double quotes.')
    return undefined
  }

  function parseValue(path, context) {
    skipWs()
    if (i >= len) {
      fail(context === 'root' ? 'No JSON value found' : 'Unexpected end of input', i, 'A bracket, brace or quote was opened but never closed.')
    }
    const c = text[i]
    if (c === '{') return parseObject(path)
    if (c === '[') return parseArray(path)
    if (c === '"') return parseString()
    if (c === "'") fail('Single quotes not allowed', i, 'JSON strings use double quotes: "text".')
    if (c === '-' || c === '+' || c === '.' || (c >= '0' && c <= '9')) return parseNumber(path)
    const lit = parseLiteral()
    if (lit !== undefined) return lit
    fail(`Unexpected character ${describe(i)}`, i, 'Expected a value: an object, array, string, number, true, false or null.')
  }

  function parseObject(path) {
    const open = i
    i++ // {
    const obj = {}
    const seen = new Set()
    skipWs()
    if (text[i] === '}') {
      i++
      return obj
    }
    for (;;) {
      skipWs()
      const c = text[i]
      if (i >= len) fail('Unclosed object', open, 'This { has no matching }.')
      if (c === '}') fail('Trailing comma in object', i, 'Remove the comma after the last property.')
      if (c === "'") fail('Single quotes not allowed', i, 'Keys and strings use double quotes: "key".')
      if (c !== '"') {
        if (/[A-Za-z_$]/.test(c)) fail('Keys must be in double quotes', i, 'Write key: 1 as "key": 1.')
        fail(`Expected a key, found ${describe(i)}`, i, 'Object keys are double-quoted strings.')
      }
      const keyPos = i
      const key = parseString()
      if (seen.has(key)) {
        const { line, col } = lineCol(text, keyPos)
        duplicates.push({ key, path: [...path, key], line, col })
      }
      seen.add(key)
      skipWs()
      if (text[i] !== ':') {
        if (i >= len) fail('Unclosed object', open, 'This { has no matching }.')
        fail('Missing colon after key', i, 'Each key is followed by a colon: "key": value.')
      }
      i++
      path.push(key)
      const value = parseValue(path, 'value')
      path.pop()
      // A "__proto__" key is an ordinary property in JSON; plain assignment
      // would set the object's prototype instead.
      if (key === '__proto__') Object.defineProperty(obj, key, { value, enumerable: true, writable: true, configurable: true })
      else obj[key] = value
      skipWs()
      const n = text[i]
      if (n === ',') {
        i++
        continue
      }
      if (n === '}') {
        i++
        return obj
      }
      if (i >= len) fail('Unclosed object', open, 'This { has no matching }.')
      if (n === ']') fail('Mismatched bracket: expected } but found ]', i, `The { on line ${lineCol(text, open).line} is closed with ].`)
      if (n === '"' || /[A-Za-z_$']/.test(n)) fail('Missing comma between properties', i, 'Separate properties with a comma.')
      fail(`Expected , or } but found ${describe(i)}`, i)
    }
  }

  function parseArray(path) {
    const open = i
    i++ // [
    const arr = []
    skipWs()
    if (text[i] === ']') {
      i++
      return arr
    }
    for (;;) {
      skipWs()
      if (text[i] === ']') fail('Trailing comma in array', i, 'Remove the comma after the last item.')
      if (text[i] === ',') fail('Empty item in array', i, 'Two commas in a row leave a hole. Remove one.')
      if (i >= len) fail('Unclosed array', open, 'This [ has no matching ].')
      path.push(arr.length)
      arr.push(parseValue(path, 'value'))
      path.pop()
      skipWs()
      const n = text[i]
      if (n === ',') {
        i++
        continue
      }
      if (n === ']') {
        i++
        return arr
      }
      if (i >= len) fail('Unclosed array', open, 'This [ has no matching ].')
      if (n === '}') fail('Mismatched bracket: expected ] but found }', i, `The [ on line ${lineCol(text, open).line} is closed with }.`)
      fail('Missing comma between items', i, 'Separate array items with a comma.')
    }
  }

  const value = parseValue([], 'root')
  skipWs()
  if (i < len) {
    fail('Unexpected content after the JSON value', i, 'A document holds exactly one value. Wrap several values in an array, or remove the extra text.')
  }
  return { value, bigNumbers, duplicates }
}

/** Formats a JSONPath-style label from path segments: $.a[0].b */
export function pathLabel(segments) {
  let out = '$'
  for (const s of segments) {
    if (typeof s === 'number') out += `[${s}]`
    else if (/^[A-Za-z_$][\w$]*$/.test(s)) out += `.${s}`
    else out += `[${JSON.stringify(s)}]`
  }
  return out
}

/**
 * Parses JSON text for the validator.
 *
 * Returns { ok: true, value, bomRemoved, bigNumbers } or
 * { ok: false, error: { message, reason, tip, line, col, pos }, bomRemoved }.
 */
export function parseJson(input) {
  let text = input
  let bomRemoved = false
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
    bomRemoved = true
  }

  let nativeValue
  let nativeError = null
  try {
    nativeValue = JSON.parse(text)
  } catch (e) {
    nativeError = e
  }

  if (!nativeError && !MAYBE_LOSSY.test(text)) {
    return { ok: true, value: nativeValue, bomRemoved, bigNumbers: [], text }
  }

  try {
    const { value, bigNumbers } = parseStrict(text)
    if (nativeError) {
      // The two parsers disagree. Trust the engine, but still give a location.
      return { ok: false, bomRemoved, text, error: fromNative(text, nativeError) }
    }
    return { ok: true, value, bomRemoved, bigNumbers, text }
  } catch (e) {
    if (e instanceof JsonSyntaxError) {
      if (!nativeError) {
        // Should not happen; never reject what the engine accepts.
        return { ok: true, value: nativeValue, bomRemoved, bigNumbers: [], text }
      }
      return {
        ok: false,
        bomRemoved,
        text,
        error: { message: e.message, reason: e.reason, tip: e.tip, line: e.line, col: e.col, pos: e.pos },
      }
    }
    // Stack overflow on absurdly deep nesting, and the like.
    if (nativeError) return { ok: false, bomRemoved, text, error: fromNative(text, nativeError) }
    return { ok: true, value: nativeValue, bomRemoved, bigNumbers: [], text }
  }
}

function fromNative(text, err) {
  const m = /position (\d+)/i.exec(err.message)
  const pos = m ? Number(m[1]) : text.length
  const { line, col } = lineCol(text, pos)
  // Engines append their own "(line 7 column 1)"; strip it so the location
  // appears once, in our format.
  const reason = err.message
    .replace(/\s*\(line \d+ column \d+\)/i, '')
    .replace(/\s*at position \d+/i, '')
    .replace(/^JSON\.parse: /, '')
  return { message: `Line ${line}, column ${col}: ${reason}`, reason, tip: '', line, col, pos }
}

/**
 * JSON.stringify that writes LosslessNumber values back as their original
 * digits. Falls through to the native serialiser when there are none.
 */
export function stringify(value, space, hasLossless = true) {
  if (!hasLossless) return JSON.stringify(value, null, space)
  const nonce = Math.random().toString(36).slice(2)
  const raws = []
  const json = JSON.stringify(
    value,
    (_k, v) => {
      if (v instanceof LosslessNumber) {
        raws.push(v.raw)
        return `@@ln${nonce}#${raws.length - 1}@@`
      }
      return v
    },
    space
  )
  if (!raws.length) return json
  const re = new RegExp(`"@@ln${nonce}#(\\d+)@@"`, 'g')
  return json.replace(re, (_m, idx) => raws[Number(idx)])
}

/**
 * Re-creates LosslessNumber instances after a value has crossed a worker
 * boundary (structured clone keeps the data but drops the class).
 */
export function reviveLossless(value, bigNumbers) {
  if (!bigNumbers?.length) return value
  let root = value
  for (const { path, raw } of bigNumbers) {
    if (!path.length) {
      root = new LosslessNumber(raw)
      continue
    }
    let parent = root
    for (let k = 0; k < path.length - 1 && parent != null; k++) parent = parent[path[k]]
    if (parent != null) parent[path[path.length - 1]] = new LosslessNumber(raw)
  }
  return root
}
