/**
 * A small, strict XML parser: enough to check well-formedness with an exact
 * line and column, pretty-print, minify and build a tree — and it runs the
 * same in the browser and in the build-time prerender (no DOMParser needed).
 * It does not validate against a DTD or schema, and it does not expand
 * entities beyond the five predefined ones and numeric references.
 */

export class XmlError extends Error {
  constructor(reason, pos, text) {
    const { line, col } = lineCol(text, pos)
    super(`Line ${line}, column ${col}: ${reason}`)
    this.reason = reason
    this.line = line
    this.col = col
    this.pos = pos
  }
}

function lineCol(text, pos) {
  let line = 1
  let last = -1
  for (let i = 0; i < pos && i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      line++
      last = i
    }
  }
  return { line, col: pos - last }
}

const NAME_START = /[A-Za-z_:À-￿]/
const NAME_CHAR = /[A-Za-z0-9_:.\-·À-￿]/
const ENTITY = /^&(?:lt|gt|amp|apos|quot|#\d+|#x[0-9a-fA-F]+);/

export function parseXml(text) {
  let i = 0
  const len = text.length
  const fail = (reason, at = i) => {
    throw new XmlError(reason, at, text)
  }
  const root = { type: 'document', children: [] }
  const stack = [root]
  let sawRoot = false

  const readName = () => {
    const start = i
    if (!NAME_START.test(text[i] || '')) fail(`Expected a name, found ${text[i] === undefined ? 'end of input' : `"${text[i]}"`}`)
    while (i < len && NAME_CHAR.test(text[i])) i++
    return text.slice(start, i)
  }
  const skipWs = () => {
    while (i < len && /\s/.test(text[i])) i++
  }
  const checkText = (from, to) => {
    for (let k = from; k < to; k++) {
      if (text[k] === '&' && !ENTITY.test(text.slice(k, k + 12))) fail('Unescaped "&" — write &amp; (or use a CDATA section)', k)
    }
  }

  while (i < len) {
    if (text[i] !== '<') {
      const start = i
      while (i < len && text[i] !== '<') i++
      const chunk = text.slice(start, i)
      if (stack.length === 1) {
        if (chunk.trim()) fail(sawRoot ? 'Text after the root element' : 'Text before the root element', start + chunk.search(/\S/))
      } else {
        checkText(start, i)
        stack[stack.length - 1].children.push({ type: 'text', value: decode(chunk) })
      }
      continue
    }
    const at = i
    if (text.startsWith('<!--', i)) {
      const end = text.indexOf('-->', i + 4)
      if (end < 0) fail('Unclosed comment — missing -->', at)
      stack[stack.length - 1].children.push({ type: 'comment', value: text.slice(i + 4, end) })
      i = end + 3
      continue
    }
    if (text.startsWith('<![CDATA[', i)) {
      if (stack.length === 1) fail('CDATA outside the root element', at)
      const end = text.indexOf(']]>', i)
      if (end < 0) fail('Unclosed CDATA section — missing ]]>', at)
      stack[stack.length - 1].children.push({ type: 'cdata', value: text.slice(i + 9, end) })
      i = end + 3
      continue
    }
    if (text.startsWith('<?', i)) {
      const end = text.indexOf('?>', i)
      if (end < 0) fail('Unclosed processing instruction — missing ?>', at)
      const body = text.slice(i + 2, end)
      if (/^xml\b/i.test(body) && at !== 0 && text.slice(0, at).trim() === '') {
        // whitespace before the declaration
        fail('The <?xml …?> declaration must be the very first thing in the file', at)
      }
      stack[stack.length - 1].children.push({ type: 'pi', value: body })
      i = end + 2
      continue
    }
    if (text.startsWith('<!DOCTYPE', i) || text.startsWith('<!doctype', i)) {
      let depth = 0
      let k = i
      for (; k < len; k++) {
        if (text[k] === '[') depth++
        else if (text[k] === ']') depth--
        else if (text[k] === '>' && depth <= 0) break
      }
      if (k >= len) fail('Unclosed DOCTYPE', at)
      root.children.push({ type: 'doctype', value: text.slice(i + 2, k) })
      i = k + 1
      continue
    }
    if (text[i + 1] === '/') {
      i += 2
      const name = readName()
      skipWs()
      if (text[i] !== '>') fail(`Expected ">" to close </${name}`)
      const open = stack[stack.length - 1]
      if (stack.length === 1) fail(`Closing tag </${name}> has no matching opening tag`, at)
      if (open.name !== name) fail(`Mismatched tag: </${name}> closes <${open.name}> opened on line ${open.line}`, at)
      stack.pop()
      i++
      continue
    }
    // start tag
    i++
    if (stack.length === 1 && sawRoot) fail('A document can have only one root element', at)
    const name = readName()
    const el = { type: 'element', name, attrs: [], children: [], ...lineCol(text, at) }
    const seen = new Set()
    for (;;) {
      const before = i
      skipWs()
      if (text[i] === '>' || text.startsWith('/>', i)) break
      if (i >= len) fail(`Unclosed start tag <${name}`, at)
      if (i === before) fail(`Expected whitespace before the next attribute in <${name}>`)
      const aStart = i
      const attr = readName()
      skipWs()
      if (text[i] !== '=') fail(`Attribute "${attr}" needs a value: ${attr}="…"`)
      i++
      skipWs()
      const q = text[i]
      if (q !== '"' && q !== "'") fail(`Attribute values must be quoted: ${attr}="…"`)
      const end = text.indexOf(q, i + 1)
      if (end < 0) fail(`Unclosed attribute value for "${attr}"`, i)
      const raw = text.slice(i + 1, end)
      if (raw.includes('<')) fail(`"<" is not allowed in an attribute value — write &lt;`, i + 1 + raw.indexOf('<'))
      checkText(i + 1, end)
      if (seen.has(attr)) fail(`Duplicate attribute "${attr}"`, aStart)
      seen.add(attr)
      el.attrs.push({ name: attr, value: decode(raw) })
      i = end + 1
    }
    stack[stack.length - 1].children.push(el)
    if (stack.length === 1) sawRoot = true
    if (text.startsWith('/>', i)) {
      el.selfClosing = true
      i += 2
    } else {
      i++
      stack.push(el)
    }
  }
  if (stack.length > 1) {
    const open = stack[stack.length - 1]
    throw new XmlError(`<${open.name}> opened on line ${open.line} is never closed`, len, text)
  }
  if (!sawRoot) throw new XmlError('No root element', len, text)
  return root
}

function decode(s) {
  return s.replace(/&(lt|gt|amp|apos|quot|#\d+|#x[0-9a-fA-F]+);/g, (_m, e) =>
    e === 'lt' ? '<' : e === 'gt' ? '>' : e === 'amp' ? '&' : e === 'apos' ? "'" : e === 'quot' ? '"' : String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
  )
}
const escText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (s) => escText(s).replace(/"/g, '&quot;')

const openTag = (el) => `<${el.name}${el.attrs.map((a) => ` ${a.name}="${escAttr(a.value)}"`).join('')}`

/** Pretty-prints a parsed document. Elements with only text stay on one line. */
export function serialize(doc, { indent = '  ', minify = false } = {}) {
  const out = []
  const nl = minify ? '' : '\n'
  const walk = (node, depth) => {
    const pad = minify ? '' : indent.repeat(depth)
    switch (node.type) {
      case 'pi':
        out.push(`${pad}<?${node.value}?>`)
        break
      case 'doctype':
        out.push(`${pad}<!${node.value}>`)
        break
      case 'comment':
        if (!minify) out.push(`${pad}<!--${node.value}-->`)
        break
      case 'cdata':
        out.push(`${pad}<![CDATA[${node.value}]]>`)
        break
      case 'text': {
        const t = minify ? node.value.trim() : node.value.trim()
        if (t) out.push(pad + escText(t))
        break
      }
      case 'element': {
        const kids = node.children.filter((c) => !(c.type === 'text' && !c.value.trim()) && !(minify && c.type === 'comment'))
        if (!kids.length) {
          out.push(`${pad}${openTag(node)}/>`)
        } else if (kids.every((c) => c.type === 'text' || c.type === 'cdata')) {
          const inner = kids.map((c) => (c.type === 'cdata' ? `<![CDATA[${c.value}]]>` : escText(minify ? c.value.trim() : c.value.trim()))).join('')
          out.push(`${pad}${openTag(node)}>${inner}</${node.name}>`)
        } else {
          out.push(`${pad}${openTag(node)}>`)
          kids.forEach((c) => walk(c, depth + 1))
          out.push(`${pad}</${node.name}>`)
        }
        break
      }
      default:
        break
    }
  }
  doc.children.forEach((c) => walk(c, 0))
  return out.join(nl) + (minify ? '' : '\n')
}

export function stats(doc) {
  let elements = 0
  let attributes = 0
  let depth = 0
  const walk = (n, d) => {
    if (n.type !== 'element') return
    elements++
    attributes += n.attrs.length
    depth = Math.max(depth, d)
    n.children.forEach((c) => walk(c, d + 1))
  }
  doc.children.forEach((c) => walk(c, 1))
  return { elements, attributes, depth }
}

/** Every attribute whose name or value contains the term, with an element path. */
export function searchAttributes(doc, term, { matchCase = false } = {}) {
  const needle = matchCase ? term : term.toLowerCase()
  const has = (s) => (matchCase ? s : s.toLowerCase()).includes(needle)
  const out = []
  const walk = (n, path) => {
    if (n.type !== 'element') return
    const here = `${path}/${n.name}`
    for (const a of n.attrs) if (has(a.name) || has(a.value)) out.push({ path: here, name: a.name, value: a.value, line: n.line })
    n.children.forEach((c) => walk(c, here))
  }
  if (term) doc.children.forEach((c) => walk(c, ''))
  return out
}
