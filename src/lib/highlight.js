import { escapeHtml } from './utils'

// Keyword sets per language. Types and class names are matched separately by
// capitalisation, so these lists only need the true keywords.
const KEYWORDS = {
  java: 'public|private|protected|class|interface|enum|record|extends|implements|static|final|void|return|new|this|super|package|import|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|abstract|synchronized|volatile|transient|native|instanceof|null|true|false|int|long|double|float|boolean|char|byte|short|var',
  go: 'package|import|func|type|struct|interface|map|chan|go|defer|return|if|else|for|range|switch|case|default|break|continue|var|const|nil|true|false|string|int|int8|int16|int32|int64|uint|float32|float64|bool|byte|rune|error',
  python: 'def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|import|from|as|with|try|except|finally|raise|pass|lambda|yield|global|nonlocal|assert|del|async|await|self',
  csharp: 'public|private|protected|internal|class|interface|struct|enum|record|namespace|using|static|readonly|const|void|return|new|this|base|if|else|for|foreach|while|do|switch|case|break|continue|try|catch|finally|throw|virtual|override|abstract|sealed|partial|get|set|var|null|true|false|int|long|double|float|bool|string|object|decimal',
  typescript: 'export|import|from|interface|type|class|extends|implements|const|let|var|function|return|new|this|if|else|for|while|switch|case|break|continue|try|catch|finally|throw|async|await|public|private|readonly|enum|namespace|declare|null|undefined|true|false|string|number|boolean|any|unknown|void|never',
  sql: 'SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|AS|AND|OR|NOT|IN|IS|NULL|LIKE|BETWEEN|EXISTS|CASE|WHEN|THEN|ELSE|END|UNION|ALL|DISTINCT|COUNT|SUM|AVG|MIN|MAX|WITH|ASC|DESC|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|CONSTRAINT|TRUE|FALSE',
  yaml: 'true|false|null|yes|no|on|off',
}

// Comment syntax differs per family.
const COMMENT = {
  java: '\\/\\/[^\\n]*',
  go: '\\/\\/[^\\n]*',
  csharp: '\\/\\/[^\\n]*',
  typescript: '\\/\\/[^\\n]*',
  python: '#[^\\n]*',
  yaml: '#[^\\n]*',
  sql: '--[^\\n]*',
}

const cache = new Map()

function patternFor(lang) {
  if (cache.has(lang)) return cache.get(lang)
  const comment = COMMENT[lang] || '(?!)'
  const keywords = KEYWORDS[lang] || '(?!)'
  const re = new RegExp(
    [
      `(${comment})`, // 1 comment
      `("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\`(?:\\\\.|[^\`\\\\])*\`)`, // 2 string
      `(@[A-Za-z_]\\w*)`, // 3 annotation / decorator
      `\\b(${keywords})\\b`, // 4 keyword
      `\\b([A-Z][A-Za-z0-9_]*)\\b`, // 5 type / class name
      `\\b(\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?[a-zA-Z]*)\\b`, // 6 number
      `([{}()\\[\\];,])`, // 7 punctuation
    ].join('|'),
    'g'
  )
  cache.set(lang, re)
  return re
}

const CLASS_FOR_GROUP = ['tok-comment', 'tok-str', 'tok-anno', 'tok-kw', 'tok-type', 'tok-num', 'tok-punc']

/**
 * Highlights one line of source. Tokenises the raw text and escapes each piece
 * as it is emitted — escaping first would hide quotes behind &quot; and no
 * string would ever match.
 */
export function highlightCode(line, lang) {
  const re = patternFor(lang)
  re.lastIndex = 0

  let out = ''
  let last = 0
  let m

  while ((m = re.exec(line)) !== null) {
    out += escapeHtml(line.slice(last, m.index))
    const groupIndex = m.slice(1).findIndex((g) => g !== undefined)
    const cls = CLASS_FOR_GROUP[groupIndex] || 'tok-punc'
    out += `<span class="${cls}">${escapeHtml(m[0])}</span>`
    last = m.index + m[0].length
  }

  return out + escapeHtml(line.slice(last))
}

export const CODE_LANGUAGES = Object.keys(KEYWORDS)
