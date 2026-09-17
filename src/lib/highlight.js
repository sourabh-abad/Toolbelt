import { escapeHtml, syntaxHighlightJson, syntaxHighlightXml } from './utils'

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
  bash: 'docker|compose|kubectl|sudo|if|then|else|elif|fi|for|while|until|do|done|case|esac|in|function|return|export|local|readonly|source|echo|cd|set|unset|trap|exit|true|false',
  dockerfile:
    'FROM|AS|RUN|CMD|LABEL|MAINTAINER|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL',
}

// Comment syntax differs per family.
const COMMENT = {
  java: '\\/\\/[^\\n]*',
  go: '\\/\\/[^\\n]*',
  csharp: '\\/\\/[^\\n]*',
  typescript: '\\/\\/[^\\n]*',
  python: '#[^\\n]*',
  // YAML and shell only start a comment at the beginning of a line or after
  // whitespace, so a URL fragment or a #tag in a value is not one.
  yaml: '(?<=^|\\s)#[^\\n]*',
  sql: '--[^\\n]*',
  bash: '(?<=^|\\s)#[^\\n]*',
  dockerfile: '(?<=^|\\s)#[^\\n]*',
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

/**
 * YAML gets its own highlighter rather than the generic one, because the thing
 * you actually want coloured — the key, distinct from its value — is positional
 * rather than lexical. Same token classes as everywhere else, so the editor and
 * the output panes agree.
 */
const YAML_VALUE = new RegExp(
  [
    `((?<=^|\\s)#[^\\n]*)`, // 1 comment
    `("(?:\\\\.|[^"\\\\])*"|'(?:''|[^'])*')`, // 2 quoted scalar
    `([&*!][\\w.\\-/]+)`, // 3 anchor, alias or tag
    `\\b(true|false|null|yes|no|on|off)\\b`, // 4 boolean-ish
    `(-?\\b\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)`, // 5 number
    `([{}\\[\\],])`, // 6 flow punctuation
  ].join('|'),
  'g'
)

const YAML_VALUE_CLASS = ['tok-comment', 'tok-str', 'tok-type', 'tok-bool', 'tok-num', 'tok-punc']

/** A key is whatever sits before the first `: ` on the line, quoted or not. */
const YAML_KEY = /^("(?:\\.|[^"\\])*"|'(?:''|[^'])*'|[^\s:#][^:]*?)(\s*:)(?=\s|$)/

function highlightYamlValue(text) {
  YAML_VALUE.lastIndex = 0
  let out = ''
  let last = 0
  let m
  while ((m = YAML_VALUE.exec(text)) !== null) {
    out += escapeHtml(text.slice(last, m.index))
    const group = m.slice(1).findIndex((g) => g !== undefined)
    out += `<span class="${YAML_VALUE_CLASS[group] || 'tok-punc'}">${escapeHtml(m[0])}</span>`
    last = m.index + m[0].length
  }
  return out + escapeHtml(text.slice(last))
}

export function highlightYaml(line) {
  const lead = line.match(/^(?:\s*(?:-\s+)*)/)[0]
  let out = escapeHtml(lead)
  let rest = line.slice(lead.length)

  const key = rest.match(YAML_KEY)
  if (key) {
    out += `<span class="tok-key">${escapeHtml(key[1])}</span>`
    out += `<span class="tok-punc">${escapeHtml(key[2])}</span>`
    rest = rest.slice(key[1].length + key[2].length)
  }

  return out + highlightYamlValue(rest)
}

export const CODE_LANGUAGES = Object.keys(KEYWORDS)

/**
 * The one place that maps a language name to a line highlighter, so the
 * read-only viewer and the editable input colour the same text the same way.
 * Returns a (line) => html function; unknown languages fall back to plain text.
 */
export function lineHighlighter(language) {
  if (language === 'json') return syntaxHighlightJson
  if (language === 'xml') return syntaxHighlightXml
  if (language === 'yaml') return highlightYaml
  if (CODE_LANGUAGES.includes(language)) return (line) => highlightCode(line, language)
  return escapeHtml
}
