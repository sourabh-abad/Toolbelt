/**
 * JSON ⇄ CSV and JSON ⇄ YAML conversion for the four converter pages.
 * Pure functions; the pages only add the editor, options and downloads.
 */
import yaml from 'js-yaml'
import { unflatten } from './jsonops.js'
import { parseJson, stringify } from './jsonparse.js'

export class ConvertError extends Error {
  constructor(message, line, col) {
    super(line ? `Line ${line}${col ? `, column ${col}` : ''}: ${message}` : message)
    this.line = line
    this.col = col
  }
}

/* --------------------------------------------------------------- JSON in */

export function readJson(text) {
  const r = parseJson(text)
  if (!r.ok) throw new ConvertError(r.error.reason + (r.error.tip ? ` — ${r.error.tip}` : ''), r.error.line, r.error.col)
  return r.value
}

/* ------------------------------------------------------------------ CSV */

const DELIMS = [',', ';', '\t', '|']

/**
 * The delimiter that splits the first records into the most consistent
 * columns. Quote-aware, so a quoted field with newlines or commas in it
 * does not throw the count off.
 */
export function detectDelimiter(text) {
  const counts = DELIMS.map(() => [])
  let cur = DELIMS.map(() => 0)
  let inQuotes = false
  let blank = true
  const sample = text.slice(0, 65536)
  for (let i = 0; i < sample.length && counts[0].length < 10; i++) {
    const ch = sample[i]
    if (ch === '"') {
      if (inQuotes && sample[i + 1] === '"') i++
      else inQuotes = !inQuotes
      blank = false
    } else if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (!blank) counts.forEach((c, k) => c.push(cur[k]))
      cur = DELIMS.map(() => 0)
      blank = true
    } else if (!inQuotes) {
      const k = DELIMS.indexOf(ch)
      if (k >= 0) cur[k]++
      if (!/\s/.test(ch)) blank = false
    }
  }
  if (!blank && counts[0].length < 10) counts.forEach((c, k) => c.push(cur[k]))
  let best = ','
  let bestScore = -1
  DELIMS.forEach((d, k) => {
    const c = counts[k]
    if (!c.length || c[0] < 1) return
    const score = c.filter((n) => n === c[0]).length * 100 + c[0]
    if (score > bestScore) {
      bestScore = score
      best = d
    }
  })
  return best
}

/** RFC 4180 parsing with the position of an unclosed quote reported. */
export function parseCsv(text, delimiter = ',') {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let quoteStart = null
  let line = 1
  let col = 0
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    col++
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
          col++
        } else inQuotes = false
      } else {
        if (ch === '\n') {
          line++
          col = 0
        }
        field += ch
      }
      continue
    }
    if (ch === '"' && field === '') {
      inQuotes = true
      quoteStart = { line, col }
    } else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      line++
      col = 0
    } else field += ch
  }
  if (inQuotes) throw new ConvertError('Unclosed quote — this field never ends', quoteStart.line, quoteStart.col)
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return { rows: rows.filter((r) => !(r.length === 1 && r[0] === '')) }
}

export function inferValue(v) {
  if (v === '') return null
  if (v === 'true') return true
  if (v === 'false') return false
  if (v === 'null') return null
  // Leading zeros (ZIP codes, IDs) stay strings; so do numbers too big to be exact.
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(v)) {
    const n = Number(v)
    if (Number.isFinite(n) && (!/^-?\d+$/.test(v) || Number.isSafeInteger(n))) return n
  }
  return v
}

export function csvToJson(text, { delimiter = 'auto', header = true, types = true, shape = 'objects', unflattenKeys = true } = {}) {
  const d = delimiter === 'auto' ? detectDelimiter(text) : delimiter
  const { rows } = parseCsv(text, d)
  if (!rows.length) return { value: [], delimiter: d, warnings: [] }
  const cell = (v) => (types ? inferValue(v) : v)
  const warnings = []
  if (shape === 'arrays' || !header) {
    const body = header && shape === 'arrays' ? rows : rows
    return { value: body.map((r) => r.map(cell)), delimiter: d, warnings }
  }
  const [head, ...body] = rows
  const seen = new Set()
  head.forEach((h) => {
    if (seen.has(h)) warnings.push(`Duplicate column "${h}" — the later column wins`)
    seen.add(h)
  })
  body.forEach((r, i) => {
    if (r.length !== head.length) warnings.push(`Row ${i + 2} has ${r.length} fields, the header has ${head.length}`)
  })
  let value = body.map((r) => Object.fromEntries(head.map((h, i) => [h, cell(r[i] ?? '')])))
  if (unflattenKeys && head.some((h) => /[.[]/.test(h))) value = value.map((o) => unflatten(o))
  return { value, delimiter: d, warnings: warnings.slice(0, 8) }
}

const needsQuote = (s, d) => s.includes(d) || s.includes('"') || s.includes('\n') || s.includes('\r') || /^\s|\s$/.test(s)
function csvField(v, d, quoteAll) {
  const s = v === null || v === undefined ? '' : String(v)
  return quoteAll || needsQuote(s, d) ? `"${s.replace(/"/g, '""')}"` : s
}

export function jsonToCsv(value, { delimiter = ',', flattenNested = true, arrays = 'json', header = true, quoteAll = false } = {}) {
  const rowsIn = Array.isArray(value) ? value : [value]
  const records = rowsIn.map((r) => {
    if (r === null || typeof r !== 'object') return { value: r }
    if (Array.isArray(r)) return Object.fromEntries(r.map((v, i) => [String(i), v]))
    return r
  })
  const flat = records.map((r) => {
    const out = {}
    const put = (key, v) => {
      if (v === null || typeof v !== 'object') out[key] = v
      else if (Array.isArray(v)) {
        if (arrays === 'join' && v.every((x) => x === null || typeof x !== 'object')) out[key] = v.join('; ')
        else if (arrays === 'index' && flattenNested && v.length) v.forEach((x, i) => put(`${key}[${i}]`, x))
        else out[key] = JSON.stringify(v)
      } else if (flattenNested && Object.keys(v).length) {
        for (const [k, x] of Object.entries(v)) put(`${key}.${k}`, x)
      } else out[key] = JSON.stringify(v)
    }
    for (const [k, v] of Object.entries(r)) put(k, v)
    return out
  })
  const headers = []
  for (const r of flat) for (const k of Object.keys(r)) if (!headers.includes(k)) headers.push(k)
  const lines = []
  if (header) lines.push(headers.map((h) => csvField(h, delimiter, quoteAll)).join(delimiter))
  for (const r of flat) lines.push(headers.map((h) => csvField(r[h], delimiter, quoteAll)).join(delimiter))
  return { text: lines.join('\n') + '\n', headers, rows: flat }
}

/* ----------------------------------------------------------------- YAML */

export function jsonToYaml(value, { indent = 2, quote = 'auto', sortKeys = false } = {}) {
  return yaml.dump(value, {
    indent,
    lineWidth: -1,
    noRefs: true,
    sortKeys,
    quotingType: quote === 'double' ? '"' : "'",
    forceQuotes: quote === 'double' || quote === 'single',
  })
}

// Scalars YAML 1.1 parsers (PyYAML, SnakeYAML, go-yaml v2, Ruby) read as
// booleans, and which this YAML 1.2 parser keeps as strings.
const YAML11_BOOL = /^(y|Y|yes|Yes|YES|n|N|no|No|NO|on|On|ON|off|Off|OFF)$/

export function yamlToJson(text, { multi = true } = {}) {
  let docs
  try {
    docs = yaml.loadAll(text)
  } catch (e) {
    const m = e.mark
    throw new ConvertError(e.reason || e.message, m ? m.line + 1 : undefined, m ? m.column + 1 : undefined)
  }
  const warnings = []
  // Plain (unquoted) scalars after "key:" or "- " on each line.
  text.split(/\r?\n/).forEach((line, i) => {
    const m = /^(\s*(?:-\s+)?(?:[^#:'"]+:\s+)?)([^'"#\s][^#]*?)\s*(?:#.*)?$/.exec(line)
    if (!m) return
    const scalar = m[2].replace(/^-\s+/, '')
    if (YAML11_BOOL.test(scalar)) warnings.push({ line: i + 1, text: `"${scalar}" is a string here, but YAML 1.1 parsers (PyYAML, SnakeYAML, go-yaml v2) may read it as a boolean. Quote it to be safe.` })
    else if (/^0\d+$/.test(scalar)) warnings.push({ line: i + 1, text: `${scalar} has a leading zero: YAML 1.1 reads it as octal (${parseInt(scalar, 8)}), YAML 1.2 as ${Number(scalar)}. Quote it if it is an ID or a ZIP code.` })
  })
  const value = docs.length === 1 || !multi ? docs[0] : docs
  return { value: value === undefined ? null : value, documents: docs.length, warnings: warnings.slice(0, 12) }
}

export const toJsonText = (value, indent = 2) => stringify(value, indent)
