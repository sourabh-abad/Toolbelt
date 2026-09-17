import yaml from 'js-yaml'

/**
 * YAML operations for the formatter page.
 *
 * Two families, deliberately separate:
 *
 * - Text-level (stripComments, tidy): rewrite the document as text, so comments,
 *   blank lines, key order and quoting style survive untouched. These are the
 *   ones you can run on a file you do not own.
 * - Parse-level (format, toFlow): load with js-yaml and re-emit. This normalises
 *   everything — and drops comments, because the parser does not keep them.
 *   The page says so before you press it.
 */

/**
 * Splits a line into code and trailing comment.
 *
 * A `#` only starts a comment at the start of a line or after whitespace, and
 * never inside a quoted scalar — which is what keeps `url: http://x/#anchor`
 * and `msg: "50% # done"` intact.
 */
export function splitLineComment(line) {
  let inSingle = false
  let inDouble = false

  for (let i = 0; i < line.length; i++) {
    const c = line[i]

    if (inDouble) {
      if (c === '\\') i++ // escaped character, including \"
      else if (c === '"') inDouble = false
      continue
    }
    if (inSingle) {
      if (c === "'" && line[i + 1] === "'") i++ // '' is an escaped quote
      else if (c === "'") inSingle = false
      continue
    }
    if (c === '"') {
      inDouble = true
      continue
    }
    if (c === "'") {
      inSingle = true
      continue
    }
    if (c === '#' && (i === 0 || line[i - 1] === ' ' || line[i - 1] === '\t')) {
      return { code: line.slice(0, i), comment: line.slice(i) }
    }
  }
  return { code: line, comment: '' }
}

/** Opens a block scalar: `key: |`, `- >-`, `key: |2+`, with an optional comment after. */
function opensBlockScalar(code) {
  return /(^|[\s:-])[|>][+-]?\d*[+-]?\s*$/.test(code)
}

const indentOf = (line) => {
  const i = line.search(/\S/)
  return i === -1 ? -1 : i
}

/**
 * Walks the document, telling the caller which lines are literal block-scalar
 * content. Content there is data, not syntax, so nothing may be rewritten in it.
 */
function eachLine(text, visit) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  let blockParent = null // indentation of the line that opened the block

  return lines.map((line) => {
    const indent = indentOf(line)

    if (blockParent !== null) {
      // Blank lines and anything more indented still belong to the block.
      if (indent === -1 || indent > blockParent) return visit(line, true)
      blockParent = null
    }

    const result = visit(line, false)
    const { code } = splitLineComment(line)
    if (opensBlockScalar(code.trimEnd())) blockParent = indent
    return result
  })
}

/**
 * Removes `#` comments, leaving everything else byte for byte as it was.
 *
 * Lines that were nothing but a comment are dropped rather than left blank,
 * unless `keepBlankLines` is set.
 */
export function stripComments(text, { keepBlankLines = false } = {}) {
  const out = []
  let removed = 0

  eachLine(text, (line, inBlock) => {
    if (inBlock) {
      out.push(line)
      return line
    }
    const { code, comment } = splitLineComment(line)
    if (!comment) {
      out.push(line)
      return line
    }
    removed++
    // A whole-line comment leaves nothing behind; drop the line entirely.
    if (!code.trim() && !keepBlankLines) return line
    out.push(code.trimEnd())
    return line
  })

  return { text: collapseBlanks(out.join('\n')), removed }
}

/** At most one blank line in a row, and exactly one newline at the end. */
function collapseBlanks(text) {
  return text.replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') + '\n'
}

/**
 * Whitespace cleanup that a parser round-trip would also do, minus the part
 * where it throws your comments away: tabs out of the indentation (YAML forbids
 * them there, and the error message when you hit it is famously unhelpful),
 * trailing spaces gone, no runs of blank lines, one newline at the end.
 */
export function tidy(text, { indent = 2 } = {}) {
  let tabsFixed = 0
  let trailingFixed = 0

  const lines = eachLine(text, (line, inBlock) => {
    if (inBlock) return line // literal content: leave it exactly as written

    let next = line.replace(/^[\t ]+/, (lead) => {
      if (!lead.includes('\t')) return lead
      tabsFixed++
      return lead.replace(/\t/g, ' '.repeat(indent))
    })

    const trimmed = next.trimEnd()
    if (trimmed !== next) trailingFixed++
    next = trimmed
    return next
  })

  return { text: collapseBlanks(lines.join('\n')), tabsFixed, trailingFixed }
}

/** Tabs used for indentation are a syntax error waiting to happen. */
export function findIndentTabs(text) {
  const bad = []
  let n = 0
  eachLine(text, (line, inBlock) => {
    n++
    if (!inBlock && /^[ ]*\t/.test(line)) bad.push(n)
    return line
  })
  return bad
}

const DUMP_DEFAULTS = {
  indent: 2,
  lineWidth: 80,
  sortKeys: false,
  noRefs: false,
  noArrayIndent: false,
  quotingType: "'",
  forceQuotes: false,
  flowLevel: -1,
}

/**
 * Parse and re-emit: consistent indentation, quoting and key order. Comments do
 * not survive — js-yaml does not retain them — which is why the page keeps this
 * behind its own button rather than calling it "format" and hoping.
 */
export function format(text, options = {}) {
  const opts = { ...DUMP_DEFAULTS, ...options }
  const docs = yaml.loadAll(text)
  if (!docs.length) return ''

  const rendered = docs.map((doc) => (doc === undefined ? '' : yaml.dump(doc, opts)))
  return docs.length === 1 ? rendered[0] : rendered.join('---\n')
}

/** Everything on as few lines as possible, JSON-ish. Handy for a log line or a -f flag. */
export function toFlow(text, options = {}) {
  return format(text, { ...options, flowLevel: 0, lineWidth: -1 })
}

/** `{ ok: true }`, or the line and column js-yaml stopped at. */
export function validate(text) {
  if (!text.trim()) return { ok: true, empty: true }
  try {
    yaml.loadAll(text)
    return { ok: true }
  } catch (e) {
    const mark = e.mark || {}
    return {
      ok: false,
      message: e.reason || e.message,
      line: typeof mark.line === 'number' ? mark.line + 1 : null,
      column: typeof mark.column === 'number' ? mark.column + 1 : null,
      snippet: e.mark?.snippet || '',
    }
  }
}

function walk(node, depth, acc) {
  acc.depth = Math.max(acc.depth, depth)
  if (Array.isArray(node)) {
    acc.items += node.length
    for (const v of node) walk(v, depth + 1, acc)
    return
  }
  if (node && typeof node === 'object') {
    const keys = Object.keys(node)
    acc.keys += keys.length
    for (const k of keys) walk(node[k], depth + 1, acc)
  }
}

/** A quick read on the document: size, shape, and the YAML-specific bits. */
export function stats(text) {
  const acc = { keys: 0, items: 0, depth: 0 }
  let documents = 0
  try {
    const docs = yaml.loadAll(text)
    documents = docs.length
    for (const d of docs) walk(d, 0, acc)
  } catch {
    return null // the error banner already says what is wrong
  }

  let comments = 0
  let anchors = 0
  let aliases = 0
  eachLine(text, (line, inBlock) => {
    if (inBlock) return line
    const { code, comment } = splitLineComment(line)
    if (comment) comments++
    if (/(^|\s)&[\w-]+/.test(code)) anchors++
    if (/(^|[\s[{,])\*[\w-]+/.test(code)) aliases++
    return line
  })

  return {
    documents,
    keys: acc.keys,
    items: acc.items,
    depth: acc.depth,
    comments,
    anchors,
    aliases,
    lines: text.replace(/\n$/, '').split('\n').length,
    bytes: new TextEncoder().encode(text).length,
  }
}
