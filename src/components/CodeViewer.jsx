import { useMemo } from 'react'
import { escapeHtml, syntaxHighlightJson, syntaxHighlightXml } from '../lib/utils'

const HIGHLIGHTERS = {
  json: syntaxHighlightJson,
  xml: syntaxHighlightXml,
  none: escapeHtml,
}

/**
 * Read-only code pane with a line-number gutter and indent guides, styled
 * like an editor rather than a plain <pre>. Highlighting runs per line —
 * safe for JSON and XML, where no token spans a newline.
 */
export default function CodeViewer({
  code,
  language = 'none',
  indentSize = 2,
  lineNumbers = true,
  indentGuides = true,
  maxHeight = '440px',
  placeholder = 'Output will appear here…',
  className = '',
}) {
  const lines = useMemo(() => {
    if (!code) return []
    const highlight = HIGHLIGHTERS[language] || HIGHLIGHTERS.none
    return code.split('\n').map((line) => {
      const leading = line.match(/^ */)[0].length
      return {
        depth: indentGuides ? Math.floor(leading / indentSize) : 0,
        html: highlight(line.slice(leading)) || '&nbsp;',
      }
    })
  }, [code, language, indentSize, indentGuides])

  if (!code) {
    return (
      <div className={`bd sunken t-faint mono rounded-xl border border-dashed px-3 py-2.5 text-sm ${className}`}>
        {placeholder}
      </div>
    )
  }

  return (
    <div
      className={`bd sunken mono overflow-auto rounded-xl border text-sm leading-6 ${className}`}
      style={{ maxHeight }}
    >
      <div className="min-w-max py-2">
        {lines.map((line, i) => (
          <div key={i} className="code-row flex items-stretch px-0">
            {lineNumbers && (
              <span
                aria-hidden="true"
                className="t-faint sticky left-0 shrink-0 select-none pr-3 pl-3 text-right tabular-nums"
                style={{ minWidth: `${String(lines.length).length + 2}ch` }}
              >
                {i + 1}
              </span>
            )}
            <span className="flex shrink-0" aria-hidden="true">
              {Array.from({ length: line.depth }).map((_, d) => (
                <span key={d} className="indent-guide" style={{ width: `${indentSize}ch` }} />
              ))}
            </span>
            <code className="t-main whitespace-pre pr-4" dangerouslySetInnerHTML={{ __html: line.html }} />
          </div>
        ))}
      </div>
    </div>
  )
}
