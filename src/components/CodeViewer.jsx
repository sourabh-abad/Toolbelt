import { useEffect, useMemo, useRef, useState } from 'react'
import { escapeHtml, syntaxHighlightJson, syntaxHighlightXml } from '../lib/utils'
import { highlightCode, CODE_LANGUAGES } from '../lib/highlight'

// Lines beyond this still render instantly — a long payload should not take
// several seconds to finish animating in.
const MAX_STAGGERED_LINES = 30
const STAGGER_MS = 14
// Beyond this the pane windows its rows: mounting 10,000 lines of DOM makes
// scrolling stutter and delays the paint by seconds.
const VIRTUALISE_ABOVE = 400
const LINE_HEIGHT = 24
const OVERSCAN = 20

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
  const [scrollTop, setScrollTop] = useState(0)
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

  const virtual = lines.length > VIRTUALISE_ABOVE
  const paneHeight = parseInt(maxHeight, 10) || 440
  const firstVisible = virtual ? Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - OVERSCAN) : 0
  const windowCount = virtual ? Math.ceil(paneHeight / LINE_HEIGHT) + OVERSCAN * 2 : lines.length
  const visible = virtual ? lines.slice(firstVisible, firstVisible + windowCount) : lines
  // Long output is shown at once — a staggered reveal of thousands of rows
  // would be slower than the work that produced them.
  const shouldAnimate = animate && !virtual

  return (
    <div
      key={revealKey}
      className={`bd sunken mono overflow-auto rounded-xl border text-sm leading-6 ${shouldAnimate ? 'result-flash' : ''} ${className}`}
      style={{ maxHeight, height: virtual ? maxHeight : undefined }}
      onScroll={virtual ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined}
    >
      <div className="min-w-max py-2" style={virtual ? { height: lines.length * LINE_HEIGHT, position: 'relative' } : undefined}>
      <div style={virtual ? { position: 'absolute', top: firstVisible * LINE_HEIGHT, left: 0, right: 0 } : undefined}>
        {visible.map((line, idx) => {
          const i = firstVisible + idx
          return (
          <div
            key={i}
            className={`code-row flex items-stretch ${shouldAnimate && i < MAX_STAGGERED_LINES ? 'code-row-animated' : ''}`}
            style={{
              ...(shouldAnimate && i < MAX_STAGGERED_LINES ? { '--line-delay': `${i * STAGGER_MS}ms` } : {}),
              ...(virtual ? { height: LINE_HEIGHT } : {}),
            }}
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
          )
        })}
      </div>
      </div>
    </div>
  )
}
