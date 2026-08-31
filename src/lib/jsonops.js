// Pure JSON transformations shared by the single-purpose JSON tool pages.
// Each is deliberately small and side-effect free so it can be unit-reasoned
// about and reused across routes.

/** Recursively sorts object keys. Arrays keep their order — order is data. */
export function sortKeys(value, direction = 'asc') {
  if (Array.isArray(value)) return value.map((v) => sortKeys(v, direction))
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort((a, b) =>
      direction === 'desc' ? b.localeCompare(a) : a.localeCompare(b)
    )
    const out = {}
    for (const k of keys) out[k] = sortKeys(value[k], direction)
    return out
  }
  return value
}

/** { a: { b: [1] } } -> { 'a.b[0]': 1 } */
export function flatten(value, delimiter = '.') {
  const out = {}
  const walk = (val, path) => {
    if (Array.isArray(val)) {
      if (val.length === 0) {
        out[path] = []
        return
      }
      val.forEach((v, i) => walk(v, `${path}[${i}]`))
    } else if (val && typeof val === 'object') {
      const keys = Object.keys(val)
      if (keys.length === 0) {
        out[path] = {}
        return
      }
      keys.forEach((k) => walk(val[k], path ? `${path}${delimiter}${k}` : k))
    } else {
      out[path] = val
    }
  }
  walk(value, '')
  return out
}

/** Inverse of flatten: rebuilds nesting from 'a.b[0]' style paths. */
export function unflatten(flat, delimiter = '.') {
  const root = {}
  for (const [path, value] of Object.entries(flat)) {
    // Split on the delimiter, then peel array indexes out of each segment.
    const segments = []
    for (const part of path.split(delimiter)) {
      const name = part.replace(/\[\d+\]/g, '')
      if (name) segments.push({ key: name, isIndex: false })
      for (const m of part.matchAll(/\[(\d+)\]/g)) {
        segments.push({ key: Number(m[1]), isIndex: true })
      }
    }

    let node = root
    segments.forEach((seg, i) => {
      const last = i === segments.length - 1
      if (last) {
        node[seg.key] = value
        return
      }
      const nextIsIndex = segments[i + 1].isIndex
      if (node[seg.key] === undefined) node[seg.key] = nextIsIndex ? [] : {}
      node = node[seg.key]
    })
  }
  return root
}

/** Strips keys whose value is null (and array entries that are null). */
export function removeNulls(value) {
  if (Array.isArray(value)) return value.filter((v) => v !== null).map(removeNulls)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      if (v === null) continue
      out[k] = removeNulls(v)
    }
    return out
  }
  return value
}

const isEmpty = (v) =>
  v === null ||
  v === undefined ||
  v === '' ||
  (Array.isArray(v) && v.length === 0) ||
  (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)

/** Strips nulls, empty strings, empty arrays and empty objects, recursively. */
export function removeEmpty(value) {
  if (Array.isArray(value)) {
    return value.map(removeEmpty).filter((v) => !isEmpty(v))
  }
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      const cleaned = removeEmpty(v)
      if (!isEmpty(cleaned)) out[k] = cleaned
    }
    return out
  }
  return value
}

/** Deep merge. Later sources win; arrays are replaced, not concatenated. */
export function deepMerge(target, source) {
  if (Array.isArray(source)) return source
  if (source && typeof source === 'object') {
    const base = target && typeof target === 'object' && !Array.isArray(target) ? { ...target } : {}
    for (const [k, v] of Object.entries(source)) base[k] = deepMerge(base[k], v)
    return base
  }
  return source
}

/** Counts, depth and type distribution — the "JSON statistics" readout. */
export function analyse(value) {
  const stats = {
    objects: 0,
    arrays: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
    keys: new Set(),
    maxDepth: 0,
    totalNodes: 0,
  }

  const walk = (val, depth) => {
    stats.totalNodes++
    stats.maxDepth = Math.max(stats.maxDepth, depth)
    if (Array.isArray(val)) {
      stats.arrays++
      val.forEach((v) => walk(v, depth + 1))
    } else if (val === null) {
      stats.nulls++
    } else if (typeof val === 'object') {
      stats.objects++
      for (const [k, v] of Object.entries(val)) {
        stats.keys.add(k)
        walk(v, depth + 1)
      }
    } else if (typeof val === 'string') {
      stats.strings++
    } else if (typeof val === 'number') {
      stats.numbers++
    } else if (typeof val === 'boolean') {
      stats.booleans++
    }
  }

  walk(value, 1)
  return { ...stats, uniqueKeys: stats.keys.size, keys: [...stats.keys].sort() }
}

/**
 * A deliberately small JSONPath subset: $.a.b, $.a[0], $.a[*], $..key
 * Covers the common lookups without pulling in a parser dependency.
 */
export function jsonPath(value, expression) {
  const expr = expression.trim()
  if (!expr || expr === '$') return [value]
  if (!expr.startsWith('$')) throw new Error('A JSONPath expression must start with "$"')

  let nodes = [value]
  // '..' marks recursive descent. Swap it for a sentinel before splitting on
  // '.', otherwise the empty segment it produces gets dropped by the filter.
  const DESCEND = '\u0000'
  const tokens = expr
    .slice(1)
    .replace(/\[(\d+|\*)\]/g, '.[$1]')
    .replace(/\.\./g, `.${DESCEND}.`)
    .split('.')
    .filter(Boolean)

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token === DESCEND) {
      // '..key' — recursive descent for the next token
      const key = tokens[++i]
      const found = []
      const descend = (val) => {
        if (Array.isArray(val)) val.forEach(descend)
        else if (val && typeof val === 'object') {
          for (const [k, v] of Object.entries(val)) {
            if (k === key) found.push(v)
            descend(v)
          }
        }
      }
      nodes.forEach(descend)
      nodes = found
      continue
    }

    const next = []
    for (const node of nodes) {
      if (token === '[*]' || token === '*') {
        if (Array.isArray(node)) next.push(...node)
        else if (node && typeof node === 'object') next.push(...Object.values(node))
      } else if (/^\[\d+\]$/.test(token)) {
        const idx = Number(token.slice(1, -1))
        if (Array.isArray(node) && node[idx] !== undefined) next.push(node[idx])
      } else if (node && typeof node === 'object' && node[token] !== undefined) {
        next.push(node[token])
      }
    }
    nodes = next
  }

  return nodes
}

/** Infers a JSON Schema (draft 2020-12) from a sample value. */
export function inferSchema(value) {
  const build = (val) => {
    if (Array.isArray(val)) {
      return val.length
        ? { type: 'array', items: build(val[0]) }
        : { type: 'array', items: {} }
    }
    if (val === null) return { type: 'null' }
    if (typeof val === 'object') {
      const properties = {}
      for (const [k, v] of Object.entries(val)) properties[k] = build(v)
      return { type: 'object', properties, required: Object.keys(val) }
    }
    if (typeof val === 'number') return { type: Number.isInteger(val) ? 'integer' : 'number' }
    if (typeof val === 'boolean') return { type: 'boolean' }
    if (/^\d{4}-\d{2}-\d{2}T/.test(val)) return { type: 'string', format: 'date-time' }
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) return { type: 'string', format: 'email' }
    return { type: 'string' }
  }
  return { $schema: 'https://json-schema.org/draft/2020-12/schema', ...build(value) }
}
