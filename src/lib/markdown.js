import { Marked } from 'marked'
import { escapeHtml, syntaxHighlightJson } from './utils'
import { highlightCode, CODE_LANGUAGES } from './highlight'

/**
 * GitHub-flavoured Markdown to HTML, with three deliberate departures from
 * marked's defaults.
 *
 * 1. Raw HTML in the source is escaped and shown as text, never executed.
 *    The output is injected with dangerouslySetInnerHTML, so anything that
 *    survives this step runs in the reader's tab. Escaping removes the whole
 *    class of problem without pulling in a sanitiser whose correctness we
 *    would then be trusting. It also matches the site's promise that nothing
 *    you paste does anything except get rendered.
 * 2. Link and image URLs are checked against a scheme allowlist, because
 *    `[click](javascript:…)` is a working XSS vector in every parser that
 *    does not.
 * 3. Fenced code is highlighted with the tokeniser the rest of the site
 *    uses, and ```mermaid fences become placeholders the page fills in after
 *    lazily loading the diagram renderer.
 */

// Fence tags people actually type, mapped onto the tokeniser's languages.
const LANG_ALIASES = {
  js: 'typescript',
  jsx: 'typescript',
  ts: 'typescript',
  tsx: 'typescript',
  javascript: 'typescript',
  typescript: 'typescript',
  java: 'java',
  kotlin: 'java',
  go: 'go',
  golang: 'go',
  py: 'python',
  python: 'python',
  cs: 'csharp',
  csharp: 'csharp',
  'c#': 'csharp',
  sql: 'sql',
  postgres: 'sql',
  postgresql: 'sql',
  mysql: 'sql',
  yml: 'yaml',
  yaml: 'yaml',
}

const SAFE_SCHEME = /^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i
const SAFE_IMAGE = /^(https?:|data:image\/(png|jpe?g|gif|webp|svg\+xml);|#|\/|\.\/|\.\.\/)/i

// A URL with no scheme at all (example.com/x) is relative and safe. One that
// starts with a scheme we did not allow — javascript:, vbscript:, data:text —
// is dropped rather than rewritten, so a bad link renders as plain text.
function safeUrl(href, pattern) {
  const url = String(href || '').trim()
  if (!url) return null
  if (SAFE_SCHEME.test(url) || pattern.test(url)) return url
  return /^[a-z][a-z0-9+.-]*:/i.test(url) ? null : url
}

const slugCounts = new Map()
function slugify(text) {
  const base =
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'section'
  const seen = slugCounts.get(base) || 0
  slugCounts.set(base, seen + 1)
  return seen ? `${base}-${seen}` : base
}

function renderCode(text, lang) {
  const tag = (lang || '').trim().toLowerCase().split(/\s+/)[0]

  if (tag === 'mermaid') {
    // Rendered by the page once mermaid has loaded; the source rides along in
    // a data attribute so the placeholder survives a re-parse unchanged.
    return `<div class="md-mermaid" data-src="${escapeHtml(text)}"><pre class="md-mermaid-src">${escapeHtml(text)}</pre></div>`
  }

  if (tag === 'json' || tag === 'jsonc') {
    return `<pre class="md-code"><code class="mono">${syntaxHighlightJson(text)}</code></pre>`
  }

  const language = LANG_ALIASES[tag]
  const body = CODE_LANGUAGES.includes(language)
    ? text.split('\n').map((line) => highlightCode(line, language)).join('\n')
    : escapeHtml(text)

  const label = tag ? `<span class="md-code-lang">${escapeHtml(tag)}</span>` : ''
  return `<pre class="md-code">${label}<code class="mono">${body}</code></pre>`
}

const renderer = {
  // Raw HTML, block and inline, is shown rather than run.
  html({ text }) {
    return escapeHtml(text)
  },

  code({ text, lang }) {
    return renderCode(text, lang)
  },

  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens)
    const id = slugify(text.replace(/<[^>]*>/g, ''))
    return `<h${depth} id="${escapeHtml(id)}">${text}</h${depth}>`
  },

  link({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens)
    const url = safeUrl(href, SAFE_SCHEME)
    if (!url) return text
    const t = title ? ` title="${escapeHtml(title)}"` : ''
    const external = /^https?:/i.test(url)
    const rel = external ? ' target="_blank" rel="noopener noreferrer nofollow"' : ''
    return `<a href="${escapeHtml(url)}"${t}${rel}>${text}</a>`
  },

  image({ href, title, text }) {
    const url = safeUrl(href, SAFE_IMAGE)
    if (!url) return escapeHtml(text || '')
    const t = title ? ` title="${escapeHtml(title)}"` : ''
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text || '')}"${t} loading="lazy">`
  },
}

const marked = new Marked({ gfm: true, breaks: false, pedantic: false }, { renderer })

/** Markdown source -> HTML string, safe to inject. */
export function renderMarkdown(source) {
  slugCounts.clear()
  try {
    return marked.parse(source ?? '', { async: false })
  } catch (err) {
    return `<pre class="md-error">${escapeHtml(err?.message || 'Could not parse this Markdown.')}</pre>`
  }
}

/** Word count, character count and a reading-time estimate at 200 wpm. */
export function documentStats(source) {
  const text = String(source ?? '')
  const words = text.split(/\s+/).filter(Boolean).length
  return {
    words,
    characters: text.length,
    lines: text ? text.split('\n').length : 0,
    readingMinutes: Math.max(1, Math.round(words / 200)),
  }
}

/** True when the rendered HTML contains at least one mermaid fence. */
export const hasMermaid = (html) => html.includes('class="md-mermaid"')

/** A self-contained HTML file carrying the preview's own styling. */
export function standaloneHtml(bodyHtml, title = 'Document') {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
:root { color-scheme: light dark; --fg:#0f172a; --muted:#475569; --bd:#e2e8f0; --sunken:#f8fafc; --link:#0369a1; }
@media (prefers-color-scheme: dark) {
  :root { --fg:#e2e8f0; --muted:#94a3b8; --bd:#334155; --sunken:#1e293b; --link:#38bdf8; }
  body { background:#0f172a; }
}
body { margin:0 auto; max-width:46rem; padding:2.5rem 1.25rem 4rem; color:var(--fg);
  font:16px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
h1,h2,h3,h4 { line-height:1.25; margin:2rem 0 .75rem; }
h1,h2 { border-bottom:1px solid var(--bd); padding-bottom:.3em; }
a { color:var(--link); }
code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.875em;
  background:var(--sunken); border:1px solid var(--bd); border-radius:4px; padding:.1em .35em; }
pre { background:var(--sunken); border:1px solid var(--bd); border-radius:8px; padding:1rem; overflow-x:auto; }
pre code { background:none; border:0; padding:0; }
blockquote { margin:1rem 0; padding:.25rem 1rem; border-left:3px solid var(--bd); color:var(--muted); }
table { border-collapse:collapse; width:100%; margin:1rem 0; display:block; overflow-x:auto; }
th,td { border:1px solid var(--bd); padding:.5rem .75rem; text-align:left; }
th { background:var(--sunken); }
img { max-width:100%; }
hr { border:0; border-top:1px solid var(--bd); margin:2rem 0; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`
}
