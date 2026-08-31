import { useEffect, useMemo, useRef, useState } from 'react'
import { escapeHtml, syntaxHighlightJson, syntaxHighlightXml } from '../lib/utils'
import { highlightCode, CODE_LANGUAGES } from '../lib/highlight'

// Lines beyond this still render instantly — a long payload should not take
// several seconds to finish animating in.
const MAX_STAGGERED_LINES = 30
const STAGGER_MS = 14

function highlighterFor(language) {
  if (language === 'json') return syntaxHighlightJson
  if (language === 'xml') return syntaxHighlightXml
  if (CODE_LANGUAGES.includes(language)) return (line) => highlightCode(line, language)
  return escapeHtml
}

/**
 * Read-only code pane: line-number gutter, indent guides, syntax highlighting
 * for JSON, XML and the common source languages, and a staggered reveal when
 * the content changes.
 */
export default function CodeViewer({
  code,
  language = 'none',
  indentSize = 2,
  lineNumbers = true,
  indentGuides = true,
  maxHeight = '440px',
  placeholder = 'Output will appear here…',
  animate = true,
  className = '',
}) {
  const [revealKey, setRevealKey] = useState(0)
  const previous = useRef(code)

  useEffect(() => {
    if (code && code !== previous.current) setRevealKey((k) => k + 1)
    previous.current = code
  }, [code])

  const lines = useMemo(() => {
    if (!code) return []
    const highlight = highlighterFor(language)
    return code.split('\n').map((line) => {
      const leading = line.match(/^[ \t]*/)[0].replace(/\t/g, ' '.repeat(indentSize)).length
      return {
        depth: indentGuides ? Math.floor(leading / indentSize) : 0,
        html: highlight(line.slice(line.length - line.trimStart().length)) || '&nbsp;',
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
      key={revealKey}
      className={`bd sunken mono overflow-auto rounded-xl border text-sm leading-6 ${animate ? 'result-flash' : ''} ${className}`}
      style={{ maxHeight }}
    >
      <div className="min-w-max py-2">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`code-row flex items-stretch ${animate && i < MAX_STAGGERED_LINES ? 'code-row-animated' : ''}`}
            style={animate && i < MAX_STAGGERED_LINES ? { '--line-delay': `${i * STAGGER_MS}ms` } : undefined}
          >
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
