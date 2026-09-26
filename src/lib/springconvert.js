/**
 * Spring-style .properties ⇄ YAML, for the two converter pages. Built on the
 * one .properties parser in propsops.js, and adds what Spring config needs:
 * multi-document files (#--- in .properties, --- in YAML) with
 * spring.config.activate.on-profile, comments carried across where they can
 * be, ${placeholders} left untouched, and \uXXXX escapes for non-ASCII.
 */
import yaml from 'js-yaml'
import { readRecords, toObject, flattenObject, escapeKey, escapeValue } from './propsops.js'
import { ConvertError } from './convert.js'

const isMap = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const DOC_SPLIT = /^[#!]---[ \t]*$/

/** Splits a .properties file on #--- lines (Spring Boot 2.4+ multi-document). */
export function splitPropertiesDocuments(text) {
  const docs = [[]]
  for (const line of text.split(/\r\n|\n|\r/)) {
    if (DOC_SPLIT.test(line)) docs.push([])
    else docs[docs.length - 1].push(line)
  }
  return docs.map((lines) => lines.join('\n'))
}

/** Comment lines keyed by the property that follows them. */
function commentsByKey(text) {
  const map = new Map()
  let pending = []
  for (const r of readRecords(text)) {
    if (r.kind === 'comment') pending.push(r.text.replace(/^[#!]\s?/, ''))
    else if (r.kind === 'entry' && pending.length) {
      map.set(r.key, [...(map.get(r.key) || []), ...pending])
      pending = []
    }
  }
  return { map, trailing: pending }
}

const scalar = (v) => {
  if (v === null || v === undefined) return "''"
  if (isMap(v)) return '{}'
  if (Array.isArray(v)) return '[]'
  return yaml.dump(v, { lineWidth: -1 }).trimEnd()
}
const yamlKey = (k) => scalar(String(k))

function emitYaml(node, comments, unit) {
  const out = []
  const used = new Set()
  const note = (path, pad) => {
    const c = comments.get(path)
    if (c && !used.has(path)) {
      used.add(path)
      for (const line of c) out.push(`${pad}#${line ? ' ' + line : ''}`)
    }
  }
  // Comments were attached to the full property key, so a nested value
  // takes the comments of the first leaf under it that has any.
  const firstLeaf = (v, path) => {
    if (isMap(v) && Object.keys(v).length) {
      const [k, x] = Object.entries(v)[0]
      return firstLeaf(x, `${path}.${k}`)
    }
    if (Array.isArray(v) && v.length) return firstLeaf(v[0], `${path}[0]`)
    return path
  }
  // Pads are strings, not depths: keys inside a "- " list item line up two
  // columns in, whatever the indent unit.
  const map = (obj, pad, path, firstLead = null) => {
    Object.entries(obj).forEach(([k, v], i) => {
      const p = path ? `${path}.${k}` : k
      const lead = i === 0 && firstLead !== null ? firstLead : pad
      if (i > 0 || firstLead === null) note(firstLeaf(v, p), pad)
      if (isMap(v) && Object.keys(v).length) {
        out.push(`${lead}${yamlKey(k)}:`)
        map(v, pad + unit, p)
      } else if (Array.isArray(v) && v.length) {
        out.push(`${lead}${yamlKey(k)}:`)
        seq(v, pad + unit, p)
      } else out.push(`${lead}${yamlKey(k)}: ${scalar(v)}`)
    })
  }
  const seq = (arr, pad, path) => {
    arr.forEach((v, i) => {
      const p = `${path}[${i}]`
      note(firstLeaf(v, p), pad)
      if (isMap(v) && Object.keys(v).length) map(v, pad + '  ', p, `${pad}- `)
      else if (Array.isArray(v) && v.length) {
        out.push(`${pad}-`)
        seq(v, pad + unit, p)
      } else out.push(`${pad}- ${scalar(v)}`)
    })
  }
  map(node, '', '')
  return out
}

/**
 * .properties → YAML. Each #--- document becomes a YAML document. Returns
 * the text and warnings for what could not be carried over exactly.
 */
export function propertiesToYaml(text, { indent = 2, inferTypes = true, keepComments = true } = {}) {
  const unit = ' '.repeat(indent)
  const docs = splitPropertiesDocuments(text)
  const warnings = []
  const parts = docs.map((doc, d) => {
    const { data, conflicts } = toObject(doc, { nested: true, inferTypes })
    const label = docs.length > 1 ? `Document ${d + 1}: ` : ''
    for (const c of conflicts) warnings.push(`${label}"${c}" needs a parent that is already a plain value (or the reverse), which YAML cannot express — it stays a flat key; check the result`)
    if (Object.prototype.hasOwnProperty.call(data, 'spring') && isMap(data.spring) && 'profiles' in data.spring && !isMap(data.spring.profiles))
      warnings.push(`${label}spring.profiles is the pre-2.4 way to activate a document; Spring Boot 2.4+ uses spring.config.activate.on-profile`)
    const { map: comments, trailing } = keepComments ? commentsByKey(doc) : { map: new Map(), trailing: [] }
    const lines = Object.keys(data).length ? emitYaml(data, comments, unit) : ['{}']
    if (trailing.length) lines.push(...trailing.map((c) => `#${c ? ' ' + c : ''}`))
    return lines.join('\n') + '\n'
  })
  return { text: parts.join('---\n'), documents: docs.length, warnings }
}

/* --------------------------------------------------------- YAML → props */

const KEY_LINE = /^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^\s#'"\-?:][^:#]*?|-[^\s][^:#]*?)\s*:(?:\s|$)/

function unquoteKey(k) {
  if (k.startsWith('"')) {
    try {
      return JSON.parse(k)
    } catch {
      return k.slice(1, -1)
    }
  }
  if (k.startsWith("'")) return k.slice(1, -1).replace(/''/g, "'")
  return k.trim()
}

/** Full-line YAML comments, keyed by the dotted path of the key after them. */
export function yamlComments(text) {
  const map = new Map()
  let pending = []
  let stack = []
  const counters = new Map()
  let blockIndent = -1
  const attach = (path) => {
    if (!pending.length) return
    map.set(path, [...(map.get(path) || []), ...pending])
    pending = []
  }
  for (const line of text.split(/\r\n|\n|\r/)) {
    const indent = line.length - line.trimStart().length
    const body = line.trim()
    if (blockIndent >= 0) {
      if (!body || indent > blockIndent) continue
      blockIndent = -1
    }
    if (!body) continue
    if (body.startsWith('#')) {
      pending.push(body.replace(/^#\s?/, ''))
      continue
    }
    if (body === '---' || body.startsWith('--- ') || body === '...') {
      stack = []
      counters.clear()
      continue
    }
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop()
    const parent = stack.length ? stack[stack.length - 1].path : ''
    let rest = body
    let at = indent
    let base = parent
    const item = /^-(\s+|$)/.exec(rest)
    if (item) {
      const ck = `${parent}@${indent}`
      const idx = (counters.get(ck) ?? -1) + 1
      counters.set(ck, idx)
      base = `${parent}[${idx}]`
      stack.push({ indent, path: base })
      rest = rest.slice(item[0].length)
      at = indent + item[0].length
      if (!rest) {
        attach(base)
        continue
      }
    }
    const m = KEY_LINE.exec(rest)
    if (!m) {
      if (item) attach(base)
      continue
    }
    const key = unquoteKey(m[1])
    const path = base ? `${base}.${key}` : key
    attach(path)
    stack.push({ indent: at, path })
    if (/:\s*[|>][-+0-9]*\s*(#.*)?$/.test(rest)) blockIndent = at
  }
  return { map, trailing: pending }
}

const escapeNonAscii = (s) => s.replace(/[^\x20-\x7e]/g, (c) => (c === '\t' || c === '\n' ? c : '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')))

/**
 * YAML → .properties. Several YAML documents become #--- separated
 * documents. Non-ASCII is written as \uXXXX by default, because Spring Boot
 * and java.util.Properties read .properties files as ISO-8859-1.
 */
export function yamlToProperties(text, { separator = '=', escapeUnicode = true, keepComments = true } = {}) {
  let docs
  try {
    docs = yaml.loadAll(text)
  } catch (e) {
    const m = e.mark
    throw new ConvertError(e.reason || e.message, m ? m.line + 1 : undefined, m ? m.column + 1 : undefined)
  }
  const segments = text.split(/^---(?:[ \t].*)?$/m)
  // A leading --- produces an empty first segment with no document.
  if (segments.length > docs.length && !segments[0].trim()) segments.shift()
  const warnings = []
  const out = docs.map((doc, d) => {
    if (doc === null || doc === undefined) return ''
    if (!isMap(doc)) throw new ConvertError(`Document ${d + 1} is ${Array.isArray(doc) ? 'a list' : 'a single value'}; .properties needs a mapping of keys at the top`)
    const { map: comments, trailing } = keepComments ? yamlComments(segments[d] || '') : { map: new Map(), trailing: [] }
    const pending = [...comments.entries()]
    const lines = []
    for (const [key, value] of flattenObject(doc)) {
      for (let i = 0; i < pending.length; i++) {
        const [path, c] = pending[i]
        if (key === path || key.startsWith(path + '.') || key.startsWith(path + '[')) {
          lines.push(...c.map((x) => `#${x ? ' ' + x : ''}`))
          pending.splice(i--, 1)
        }
      }
      if (/\./.test(key.split('.').pop() || '') || key.includes('..')) warnings.push(`"${key}" has an empty segment or a dot inside a key; Spring map keys with dots need [brackets]`)
      let k = escapeKey(key)
      let v = escapeValue(value)
      if (escapeUnicode) {
        k = escapeNonAscii(k)
        v = escapeNonAscii(v)
      }
      lines.push(`${k}${separator}${v}`)
    }
    for (const [, c] of pending) lines.push(...c.map((x) => `#${x ? ' ' + x : ''}`))
    lines.push(...trailing.map((x) => `#${x ? ' ' + x : ''}`))
    return lines.join('\n') + (lines.length ? '\n' : '')
  })
  return { text: out.join('#---\n'), documents: docs.length, warnings }
}
