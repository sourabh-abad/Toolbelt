import yaml from 'js-yaml'

/**
 * Operations on Java `.properties` files.
 *
 * The format is deceptively fiddly, and every function here is built on one
 * parser so the viewer, the comparer and the converters can never disagree
 * about what a file says:
 *
 * - three separators — `key=value`, `key:value` and `key value` — with any
 *   whitespace around them ignored;
 * - `#` and `!` comments, but only at the start of a line;
 * - backslash escapes (`\n`, `\t`, `\uXXXX`, `\=`, `\:`, `\ `), which is how a
 *   key can legally contain a space or a colon;
 * - line continuations: a line ending in an odd number of backslashes joins
 *   the next one, with the continuation's leading whitespace dropped.
 *
 * Nothing here throws on malformed input — a `.properties` file has no syntax
 * errors, only surprises — so the inspection functions report them instead.
 */

/* --------------------------------------------------------------- escaping */

/** Resolves backslash escapes, including `\uXXXX`. Unknown escapes drop the backslash, as Java does. */
export function unescape(text) {
  if (!text.includes('\\')) return text
  let out = ''
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '\\') {
      out += text[i]
      continue
    }
    const next = text[++i]
    if (next === undefined) break
    switch (next) {
      case 'n': out += '\n'; break
      case 't': out += '\t'; break
      case 'r': out += '\r'; break
      case 'f': out += '\f'; break
      case 'u': {
        const hex = text.slice(i + 1, i + 5)
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          out += String.fromCharCode(parseInt(hex, 16))
          i += 4
        } else {
          out += 'u'
        }
        break
      }
      default: out += next
    }
  }
  return out
}

function escapeText(text, isKey) {
  let out = ''
  for (const ch of text) {
    switch (ch) {
      case '\\': out += '\\\\'; break
      case '\n': out += '\\n'; break
      case '\r': out += '\\r'; break
      case '\t': out += '\\t'; break
      case '\f': out += '\\f'; break
      case ' ': out += isKey ? '\\ ' : ' '; break
      case '=':
      case ':':
      case '#':
      case '!': out += isKey ? '\\' + ch : ch; break
      default: out += ch
    }
  }
  return out
}

/** Escapes a key so it survives a round trip — spaces, separators and comment markers included. */
export const escapeKey = (key) => escapeText(key, true)

/** Escapes a value. Only a *leading* space needs escaping; the rest is kept readable. */
export const escapeValue = (value) => escapeText(value, false).replace(/^ /, '\\ ')

/* ---------------------------------------------------------------- parsing */

const isSpace = (ch) => ch === ' ' || ch === '\t' || ch === '\f'

/** A line continues only when it ends in an ODD number of backslashes — `a\\` is a literal backslash. */
function continues(line) {
  let n = 0
  for (let i = line.length - 1; i >= 0 && line[i] === '\\'; i--) n++
  return n % 2 === 1
}

/** Splits one logical line into its key, value and the separator that divided them. */
export function splitEntry(line) {
  let i = 0
  while (i < line.length && isSpace(line[i])) i++

  let end = i
  let sepAt = -1
  let sep = ''

  while (end < line.length) {
    const ch = line[end]
    if (ch === '\\') {
      end += 2
      continue
    }
    if (ch === '=' || ch === ':') {
      sepAt = end
      sep = ch
      break
    }
    if (isSpace(ch)) {
      let j = end
      while (j < line.length && isSpace(line[j])) j++
      // `key = value` and `key : value` still use = and : as the separator;
      // whitespace only becomes one when nothing else follows it.
      if (line[j] === '=' || line[j] === ':') {
        sepAt = j
        sep = line[j]
      } else {
        sepAt = end
        sep = ' '
      }
      break
    }
    end++
  }

  if (sepAt === -1) return { rawKey: line.slice(i), rawValue: '', sep: '' }

  const rawKey = line.slice(i, Math.min(end, sepAt))
  const rest = line.slice(sep === ' ' ? sepAt : sepAt + 1)
  return { rawKey, rawValue: rest.replace(/^[ \t\f]+/, ''), sep }
}

/**
 * Every line of the file in order, joined across continuations, tagged as an
 * entry, a comment or a blank. Comments and blanks are kept so the formatter
 * can put a file back together without losing its commentary.
 */
export function readRecords(text) {
  const lines = text.split(/\r\n|\n|\r/)
  // A file ending in a newline is not a file with a blank last line.
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
  const records = []

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const trimmed = raw.trimStart()

    if (trimmed === '') {
      records.push({ kind: 'blank', line: i + 1, endLine: i + 1, text: '' })
      continue
    }
    if (trimmed[0] === '#' || trimmed[0] === '!') {
      records.push({ kind: 'comment', line: i + 1, endLine: i + 1, text: trimmed })
      continue
    }

    const start = i
    let joined = raw
    while (continues(joined) && i + 1 < lines.length) {
      joined = joined.slice(0, -1) + lines[i + 1].replace(/^[ \t\f]+/, '')
      i++
    }

    const { rawKey, rawValue, sep } = splitEntry(joined)
    records.push({
      kind: 'entry',
      line: start + 1,
      endLine: i + 1,
      text: joined,
      rawKey,
      rawValue,
      sep: sep || '=',
      key: unescape(rawKey),
      value: unescape(rawValue),
    })
  }

  return records
}

/**
 * The whole file, read once.
 *
 * `entries` is every assignment in file order, `map` is what a program loading
 * the file would see (last occurrence wins, the way java.util.Properties does)
 * and `duplicates` is what that quietly threw away.
 */
export function parse(text) {
  const records = readRecords(text)
  const entries = records.filter((r) => r.kind === 'entry')

  const seen = new Map()
  for (const entry of entries) {
    const list = seen.get(entry.key)
    if (list) list.push(entry)
    else seen.set(entry.key, [entry])
  }

  const map = new Map()
  for (const [key, list] of seen) map.set(key, list[list.length - 1].value)

  const duplicates = []
  for (const [key, list] of seen) {
    if (list.length < 2) continue
    duplicates.push({
      key,
      count: list.length,
      lines: list.map((e) => e.line),
      values: list.map((e) => e.value),
      // Two identical lines are a tidy-up; two different values are a bug.
      conflicting: new Set(list.map((e) => e.value)).size > 1,
    })
  }

  return { records, entries, map, duplicates, keyCount: seen.size }
}

/** `${...}` references inside a value, with whether this file defines them. */
export function placeholdersIn(value, map) {
  const found = []
  const re = /\$\{([^}:]+)(?::([^}]*))?\}/g
  let m
  while ((m = re.exec(value)) !== null) {
    const ref = m[1].trim()
    found.push({
      ref,
      raw: m[0],
      fallback: m[2] ?? null,
      defined: map ? map.has(ref) : false,
    })
  }
  return found
}

/* ------------------------------------------------------------- inspection */

/**
 * Every key in the file with the context you need to judge it: where it is,
 * whether it is a duplicate, whether its value is empty, wrapped or hiding
 * whitespace, and which `${...}` references it makes.
 */
export function listKeys(text, { sort = 'file', unique = false } = {}) {
  const { entries, map } = parse(text)
  const counts = new Map()
  for (const e of entries) counts.set(e.key, (counts.get(e.key) || 0) + 1)

  let rows = entries.map((e) => ({
    key: e.key,
    value: e.value,
    line: e.line,
    sep: e.sep,
    occurrences: counts.get(e.key),
    duplicate: counts.get(e.key) > 1,
    winner: map.get(e.key) === e.value,
    empty: e.value === '',
    multiline: e.endLine > e.line,
    padded: e.value !== e.value.trim() && e.value.trim() !== '',
    placeholders: placeholdersIn(e.value, map),
  }))

  if (unique) {
    const kept = new Map()
    for (const row of rows) kept.set(row.key, row.duplicate ? { ...row, value: map.get(row.key) } : row)
    rows = [...kept.values()]
  }

  if (sort === 'asc') rows.sort((a, b) => a.key.localeCompare(b.key))
  else if (sort === 'desc') rows.sort((a, b) => b.key.localeCompare(a.key))

  return rows
}

/** Just the names — for pasting into a ticket, a test or another file. */
export function keyNames(text, options) {
  return listKeys(text, { unique: true, ...options }).map((r) => r.key)
}

/** The top-level counts shown under the editor. */
export function stats(text) {
  const { records, entries, map, duplicates } = parse(text)
  let empty = 0
  let multiline = 0
  let placeholders = 0
  let nonAscii = 0

  for (const e of entries) {
    if (e.value === '') empty++
    if (e.endLine > e.line) multiline++
    placeholders += placeholdersIn(e.value, map).length
    // Checked on the decoded text: \\u00e9 in the file is a non-ASCII value.
    // eslint-disable-next-line no-control-regex
    if (/[^\x00-\x7F]/.test(e.key + e.value)) nonAscii++
  }

  const prefixes = new Set()
  for (const key of map.keys()) {
    const dot = key.indexOf('.')
    if (dot > 0) prefixes.add(key.slice(0, dot))
  }

  return {
    entries: entries.length,
    keys: map.size,
    duplicates: duplicates.length,
    comments: records.filter((r) => r.kind === 'comment').length,
    blanks: records.filter((r) => r.kind === 'blank').length,
    empty,
    multiline,
    placeholders,
    nonAscii,
    prefixes: prefixes.size,
    longestKey: [...map.keys()].reduce((n, k) => Math.max(n, k.length), 0),
  }
}

/** Everything worth warning about, as a flat list the page can render in order. */
export function problems(text) {
  const { entries, map, duplicates } = parse(text)
  const out = []

  for (const dup of duplicates) {
    out.push({
      level: dup.conflicting ? 'error' : 'warn',
      line: dup.lines[dup.lines.length - 1],
      key: dup.key,
      message: dup.conflicting
        ? `Defined ${dup.count} times with different values (lines ${dup.lines.join(', ')}) — the last one wins.`
        : `Defined ${dup.count} times with the same value (lines ${dup.lines.join(', ')}).`,
    })
  }

  for (const e of entries) {
    if (e.sep === ' ') {
      out.push({ level: 'info', line: e.line, key: e.key, message: 'Separated by a space — legal, but easy to misread. = is safer.' })
    }
    if (e.value !== e.value.trimEnd() && e.value.trim() !== '') {
      out.push({ level: 'warn', line: e.line, key: e.key, message: 'Value ends in whitespace, which is kept on load and invisible in most editors.' })
    }
    for (const p of placeholdersIn(e.value, map)) {
      if (!p.defined && p.fallback === null) {
        out.push({ level: 'warn', line: e.line, key: e.key, message: `References ${p.raw}, which this file does not define and which has no default.` })
      }
    }
  }

  return out.sort((a, b) => a.line - b.line)
}

/* -------------------------------------------------------------- comparing */

/** Which keys each side has, and which they share. */
export function compareKeys(aText, bText) {
  const a = parse(aText).map
  const b = parse(bText).map
  const onlyInA = []
  const onlyInB = []
  const inBoth = []

  for (const key of a.keys()) (b.has(key) ? inBoth : onlyInA).push(key)
  for (const key of b.keys()) if (!a.has(key)) onlyInB.push(key)

  return {
    onlyInA: onlyInA.sort(),
    onlyInB: onlyInB.sort(),
    inBoth: inBoth.sort(),
    countA: a.size,
    countB: b.size,
  }
}

const STATUS_ORDER = { different: 0, 'only-a': 1, 'only-b': 2, same: 3 }

/**
 * The full picture: one row per key across both files, marked `same`,
 * `different`, `only-a` or `only-b`, ordered so the rows you care about are
 * at the top.
 */
export function compareValues(aText, bText, { trim = false, ignoreCase = false } = {}) {
  const a = parse(aText).map
  const b = parse(bText).map
  const normalise = (v) => {
    if (v === undefined) return undefined
    let out = trim ? v.trim() : v
    return ignoreCase ? out.toLowerCase() : out
  }

  const rows = []
  for (const [key, value] of a) {
    if (!b.has(key)) {
      rows.push({ key, a: value, b: undefined, status: 'only-a' })
      continue
    }
    const other = b.get(key)
    rows.push({ key, a: value, b: other, status: normalise(value) === normalise(other) ? 'same' : 'different' })
  }
  for (const [key, value] of b) {
    if (!a.has(key)) rows.push({ key, a: undefined, b: value, status: 'only-b' })
  }

  rows.sort((x, y) => STATUS_ORDER[x.status] - STATUS_ORDER[y.status] || x.key.localeCompare(y.key))

  const summary = { total: rows.length, same: 0, different: 0, onlyInA: 0, onlyInB: 0, countA: a.size, countB: b.size }
  for (const row of rows) {
    if (row.status === 'same') summary.same++
    else if (row.status === 'different') summary.different++
    else if (row.status === 'only-a') summary.onlyInA++
    else summary.onlyInB++
  }

  return { rows, summary }
}

/* ------------------------------------------------------------- formatting */

/** Rewrites the file: sorted or in order, deduplicated or not, comments kept or dropped. */
export function format(text, options = {}) {
  const {
    sort = 'file',
    separator = '=',
    dedupe = 'keep',
    keepComments = true,
    keepBlanks = true,
    align = false,
  } = options

  const { records, map } = parse(text)
  const blocks = []
  let pending = []
  const emitted = new Set()
  let entryCount = 0

  for (const record of records) {
    if (record.kind === 'comment') {
      if (keepComments) pending.push(record.text)
      continue
    }
    if (record.kind === 'blank') {
      // A comment followed by a blank line is a header for the section, not a
      // note on the next entry — so it is detached here and stays put when the
      // entries are sorted out from under it.
      if (pending.length) {
        blocks.push({ kind: 'standalone', comments: pending })
        pending = []
      }
      if (keepBlanks && blocks.length) blocks.push({ kind: 'blank' })
      continue
    }

    entryCount++

    // `last` is what a program loading the file would see; `first` is what the
    // file said before someone appended an override.
    if (dedupe !== 'keep') {
      if (emitted.has(record.key)) {
        pending = []
        continue
      }
      emitted.add(record.key)
    }

    blocks.push({
      kind: 'entry',
      key: record.key,
      value: dedupe === 'last' ? map.get(record.key) : record.value,
      comments: pending,
    })
    pending = []
  }

  const trailing = keepComments ? pending : []

  let ordered = blocks
  if (sort === 'asc' || sort === 'desc') {
    // Sorting has no use for the blank lines that separated the old order, but
    // the detached comment blocks are about the file and stay at the top.
    const entries = blocks.filter((b) => b.kind === 'entry')
    entries.sort((x, y) => (sort === 'asc' ? x.key.localeCompare(y.key) : y.key.localeCompare(x.key)))
    ordered = [...blocks.filter((b) => b.kind === 'standalone'), ...entries]
  }

  const width = align
    ? ordered.reduce((n, b) => (b.kind === 'entry' ? Math.max(n, escapeKey(b.key).length) : n), 0)
    : 0

  const lines = []
  const blank = () => {
    if (lines.length && lines[lines.length - 1] !== '') lines.push('')
  }

  for (const block of ordered) {
    if (block.kind === 'blank') {
      blank()
      continue
    }
    if (block.kind === 'standalone') {
      lines.push(...block.comments)
      blank()
      continue
    }
    for (const comment of block.comments) lines.push(comment)
    const key = escapeKey(block.key)
    lines.push(`${align ? key.padEnd(width) : key}${separator}${escapeValue(block.value)}`)
  }
  lines.push(...trailing)
  // Dropped duplicates can leave a blank line dangling off the end.
  while (lines.length && lines[lines.length - 1] === '') lines.pop()

  return {
    text: lines.length ? lines.join('\n') + '\n' : '',
    removed: entryCount - ordered.filter((b) => b.kind === 'entry').length,
  }
}

/** Builds a `.properties` file from key/value pairs. */
export function stringify(pairs, { separator = '=', sort = false } = {}) {
  const rows = [...pairs]
  if (sort) rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])))
  return rows.map(([key, value]) => `${escapeKey(String(key))}${separator}${escapeValue(String(value ?? ''))}`).join('\n') + (rows.length ? '\n' : '')
}

/* ------------------------------------------------------------ conversion */

/** `a.b[0].c` → the path to walk. Bracketed indices become array positions. */
export function splitPath(key) {
  const parts = []
  for (const segment of key.split('.')) {
    const match = segment.match(/^([^[\]]*)((?:\[\d+\])*)$/)
    if (!match) {
      parts.push({ name: segment })
      continue
    }
    if (match[1] !== '' || match[2] === '') parts.push({ name: match[1] })
    for (const index of match[2].match(/\d+/g) || []) parts.push({ index: Number(index) })
  }
  return parts
}

/** Properties are strings; YAML and JSON are not. This is the guess, and it is deliberately conservative. */
export function coerce(value) {
  if (value === '' || value !== value.trim()) return value
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null' || value === '~') return null
  if (/^-?(?:0|[1-9]\d*)$/.test(value)) {
    const n = Number(value)
    if (Number.isSafeInteger(n)) return n
  }
  if (/^-?(?:0|[1-9]\d*)\.\d+$/.test(value)) return Number(value)
  return value
}

function fillHoles(node) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (node[i] === undefined) node[i] = null
      else fillHoles(node[i])
    }
    return node
  }
  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) fillHoles(node[key])
  }
  return node
}

/**
 * Turns the file into a plain object.
 *
 * With `nested`, dotted keys become a tree — which is what YAML and JSON are
 * usually wanted for. A key that would have to be both a value and a branch
 * (`a=1` next to `a.b=2`) cannot be nested, so it is kept flat and reported in
 * `conflicts` rather than silently dropping one of the two.
 */
export function toObject(text, { nested = true, inferTypes = true } = {}) {
  const { map } = parse(text)
  const data = {}
  const conflicts = []

  for (const [key, raw] of map) {
    const value = inferTypes ? coerce(raw) : raw
    if (!nested) {
      data[key] = value
      continue
    }

    const parts = splitPath(key)
    if (!parts.length || parts[0].index !== undefined) {
      data[key] = value
      continue
    }

    let node = data
    let ok = true
    for (let i = 0; i < parts.length - 1; i++) {
      const slot = parts[i].index !== undefined ? parts[i].index : parts[i].name
      const want = parts[i + 1].index !== undefined ? [] : {}
      if (node[slot] === undefined) node[slot] = want
      else if (typeof node[slot] !== 'object' || node[slot] === null) {
        ok = false
        break
      }
      node = node[slot]
    }

    const last = parts[parts.length - 1]
    const slot = last.index !== undefined ? last.index : last.name
    if (!ok || (node[slot] !== undefined && typeof node[slot] === 'object' && node[slot] !== null)) {
      conflicts.push(key)
      data[key] = value
      continue
    }
    node[slot] = value
  }

  return { data: fillHoles(data), conflicts }
}

/** Properties → YAML. */
export function toYaml(text, { nested = true, inferTypes = true, indent = 2, sortKeys = false } = {}) {
  const { data, conflicts } = toObject(text, { nested, inferTypes })
  const out = yaml.dump(data, { indent, lineWidth: -1, noRefs: true, sortKeys, quotingType: "'" })
  return { text: out === '{}\n' ? '' : out, conflicts }
}

/** Properties → JSON. */
export function toJson(text, { nested = true, inferTypes = true, indent = 2 } = {}) {
  const { data, conflicts } = toObject(text, { nested, inferTypes })
  return { text: JSON.stringify(data, null, indent) + '\n', conflicts }
}

/** Flattens an object or array back to dotted keys, `[i]` for array positions. */
export function flattenObject(value, prefix = '', out = []) {
  if (Array.isArray(value)) {
    if (value.length === 0) out.push([prefix, ''])
    else value.forEach((item, i) => flattenObject(item, `${prefix}[${i}]`, out))
    return out
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 0) out.push([prefix, ''])
    else for (const key of keys) flattenObject(value[key], prefix ? `${prefix}.${key}` : key, out)
    return out
  }
  out.push([prefix, value === null || value === undefined ? '' : String(value)])
  return out
}

/** YAML → properties. Throws with the parser's line and column if the YAML is invalid. */
export function fromYaml(yamlText, { separator = '=', sort = false } = {}) {
  const data = yaml.load(yamlText)
  if (data === undefined || data === null) return ''
  return stringify(flattenObject(data), { separator, sort })
}

/** JSON → properties. */
export function fromJson(jsonText, { separator = '=', sort = false } = {}) {
  const data = JSON.parse(jsonText)
  if (data === null) return ''
  return stringify(flattenObject(data), { separator, sort })
}
