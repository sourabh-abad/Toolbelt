// Shared helpers used across the utility tool pages.

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Colorized JSON string -> HTML string (safe to inject).
//
// Tokenises the RAW text and escapes each piece as it is emitted. Escaping
// first would turn every " into &quot;, so the string/key patterns below
// would never match and only numbers would get coloured.
export function syntaxHighlightJson(jsonString) {
  const TOKEN =
    /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"\s*:?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g

  let out = ''
  let last = 0
  let m

  while ((m = TOKEN.exec(jsonString)) !== null) {
    out += escapeHtml(jsonString.slice(last, m.index))

    const token = m[0]
    let cls = 'tok-num'
    if (token.startsWith('"')) {
      cls = token.trimEnd().endsWith(':') ? 'tok-key' : 'tok-str'
    } else if (token === 'true' || token === 'false') {
      cls = 'tok-bool'
    } else if (token === 'null') {
      cls = 'tok-null'
    }

    out += `<span class="${cls}">${escapeHtml(token)}</span>`
    last = m.index + token.length
  }

  return out + escapeHtml(jsonString.slice(last))
}

// Very small XML syntax highlighter (tags/attrs/comments).
export function syntaxHighlightXml(xmlString) {
  const escaped = escapeHtml(xmlString)
  return escaped
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-comment">$1</span>')
    .replace(/(&lt;\/?)([a-zA-Z_][\w:.-]*)/g, '$1<span class="tok-key">$2</span>')
    .replace(/([a-zA-Z_][\w:.-]*)(=)(&quot;.*?&quot;)/g, '<span class="tok-attr">$1</span>$2<span class="tok-str">$3</span>')
}

export function formatXml(xml) {
  const PADDING = '  '
  const reg = /(>)(<)(\/*)/g
  const formatted = xml.replace(reg, '$1\n$2$3')
  let pad = 0
  return formatted
    .split('\n')
    .map((line) => {
      line = line.trim()
      if (!line) return null
      let indent = 0
      if (/^<\?/.test(line) || /^<!--/.test(line)) {
        indent = 0
      } else if (/^<\/\w/.test(line)) {
        pad = Math.max(pad - 1, 0)
      } else if (/^<\w[^>]*[^/?]>.*$/.test(line) && !/<\/\w[^>]*>\s*$/.test(line)) {
        indent = 1
      }
      const padding = PADDING.repeat(pad)
      pad += indent
      return padding + line
    })
    .filter((l) => l !== null)
    .join('\n')
}

export function parseXmlOrThrow(xml) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  const err = doc.querySelector('parsererror')
  if (err) {
    throw new Error(err.textContent.replace(/\s+/g, ' ').trim())
  }
  return doc
}

export function jsonParseErrorLocation(text, message) {
  const m = message.match(/position (\d+)/i)
  if (!m) return null
  const pos = parseInt(m[1], 10)
  const upto = text.slice(0, pos)
  const line = upto.split('\n').length
  const col = pos - upto.lastIndexOf('\n')
  return { line, col, pos }
}

// Search a parsed JSON value; returns [{ path, key, value }]
export function searchJsonValue(value, term, { matchCase = false, inKeys = true, inValues = true } = {}) {
  const results = []
  if (!term) return results
  const needle = matchCase ? term : term.toLowerCase()
  const test = (s) => {
    const hay = matchCase ? String(s) : String(s).toLowerCase()
    return hay.includes(needle)
  }
  const walk = (val, path) => {
    if (val !== null && typeof val === 'object') {
      const entries = Array.isArray(val) ? val.map((v, i) => [i, v]) : Object.entries(val)
      for (const [key, child] of entries) {
        const childPath = Array.isArray(val) ? `${path}[${key}]` : path ? `${path}.${key}` : String(key)
        if (inKeys && !Array.isArray(val) && test(key)) {
          results.push({ path: childPath, key, value: child, matchType: 'key' })
        }
        walk(child, childPath)
      }
    } else {
      if (inValues && test(val)) {
        results.push({ path, key: path.split(/[.[]/).pop().replace(']', ''), value: val, matchType: 'value' })
      }
    }
  }
  walk(value, '')
  return results
}

// Search an XML document; returns [{ path, matchType, snippet }]
export function searchXmlDoc(doc, term, { matchCase = false, inTags = true, inAttrs = true, inText = true } = {}) {
  const results = []
  if (!term) return results
  const needle = matchCase ? term : term.toLowerCase()
  const test = (s) => (matchCase ? String(s) : String(s).toLowerCase()).includes(needle)

  const pathOf = (el) => {
    const parts = []
    let node = el
    while (node && node.nodeType === 1) {
      const parent = node.parentElement
      let index = 1
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.tagName === node.tagName)
        if (siblings.length > 1) index = siblings.indexOf(node) + 1
      }
      parts.unshift(siblings_len_safe(node, index))
      node = parent
    }
    return '/' + parts.join('/')
  }
  const siblings_len_safe = (node, index) => {
    const parent = node.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === node.tagName)
      if (siblings.length > 1) return `${node.tagName}[${index}]`
    }
    return node.tagName
  }

  const walk = (el) => {
    if (el.nodeType !== 1) return
    if (inTags && test(el.tagName)) {
      results.push({ path: pathOf(el), matchType: 'tag', snippet: `<${el.tagName}>` })
    }
    if (inAttrs) {
      for (const attr of Array.from(el.attributes || [])) {
        if (test(attr.name) || test(attr.value)) {
          results.push({ path: pathOf(el), matchType: 'attribute', snippet: `${attr.name}="${attr.value}"` })
        }
      }
    }
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === 3 && inText) {
        const text = child.textContent.trim()
        if (text && test(text)) {
          results.push({ path: pathOf(el), matchType: 'text', snippet: text.slice(0, 80) })
        }
      } else if (child.nodeType === 1) {
        walk(child)
      }
    }
  }
  if (doc.documentElement) walk(doc.documentElement)
  return results
}

export function base64UrlDecode(input) {
  let str = input.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const binary = atob(str)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function bytesToBase64(bytes) {
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

export async function sha(algo, text) {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest(algo, enc)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/.{1,2}/g)
  if (!m || m.length < 3) return null
  const [r, g, b] = m.map((h) => parseInt(h, 16))
  return { r, g, b }
}

export function rgbToHex(r, g, b) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

export function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb(h, s, l) {
  h /= 360
  s /= 100
  l /= 100
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}
