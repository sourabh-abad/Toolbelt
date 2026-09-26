import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { lineHighlighter } from '../lib/highlight'
import { escapeHtml } from '../lib/utils'

// Lines beyond this still render instantly — a long payload should not take
// several seconds to finish animating in.
const MAX_STAGGERED_LINES = 30
const STAGGER_MS = 14
// Beyond this the pane windows its rows: mounting 10,000 lines of DOM makes
// scrolling stutter and delays the paint by seconds.
const VIRTUALISE_ABOVE = 400
const LINE_HEIGHT = 24
const OVERSCAN = 20
// A minified payload is one enormous line. Rendering a megabyte-long line
// blocks the page on layout, so long lines are shown clipped; the full text
// is still what Copy and Download use.
const MAX_LINE_CHARS = 2000

const more = (n) => `<span class="t-faint"> … ${n.toLocaleString()} more characters</span>`

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
  /** 1-based line and column to mark as an error. */
  markLine = null,
  markCol = null,
  /** Receives { reveal(pos, line) } that scrolls a line into view. */
  handleRef,
  ariaLabel,
}) {
  const [revealKey, setRevealKey] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const previous = useRef(code)
  const paneRef = useRef(null)

  useImperativeHandle(
    handleRef,
    () => ({
      reveal(_pos, line) {
        const pane = paneRef.current
        if (!pane) return
        pane.scrollTop = Math.max(0, (line - 1) * LINE_HEIGHT - pane.clientHeight / 3)
        setScrollTop(pane.scrollTop)
      },
    }),
    []
  )

  useEffect(() => {
    if (code && code !== previous.current) setRevealKey((k) => k + 1)
    previous.current = code
  }, [code])

  // Splitting is cheap; highlighting is not. Lines are highlighted as they
  // scroll into view and cached, so a 50,000-line result costs a screenful.
  const highlighted = useMemo(() => ({ fn: lineHighlighter(language), cache: new Map(), code }), [language, code])
  const lines = useMemo(() => {
    if (!code) return []
    return code.split('\n').map((line) => {
      const trimmed = line.trimStart()
      const leading = indentGuides ? line.slice(0, line.length - trimmed.length).replace(/\t/g, ' '.repeat(indentSize)).length : 0
      return { depth: indentGuides ? Math.floor(leading / indentSize) : 0, text: trimmed, lead: line.length - trimmed.length }
    })
  }, [code, indentSize, indentGuides])
  const htmlFor = (i) => {
    const { text, lead } = lines[i]
    if (markLine === i + 1) {
      const c = Math.max(0, Math.min(text.length, (markCol || 1) - 1 - lead))
      const ch = text.slice(c, c + 1)
      const mark = ch ? `<span class="code-err-char">${escapeHtml(ch)}</span>` : '<span class="code-err-caret"></span>'
      // On a long line, show a window around the error rather than its start.
      const from = text.length > MAX_LINE_CHARS ? Math.max(0, c - MAX_LINE_CHARS / 2) : 0
      const to = text.length > MAX_LINE_CHARS ? Math.min(text.length, c + 1 + MAX_LINE_CHARS / 2) : text.length
      const before = from > 0 ? `<span class="t-faint">${from.toLocaleString()} characters … </span>` : ''
      const after = to < text.length ? more(text.length - to) : ''
      return `<mark class="code-err-line">${before}${highlighted.fn(text.slice(from, c))}${mark}${highlighted.fn(text.slice(c + 1, to))}${after}</mark>`
    }
    let html = highlighted.cache.get(i)
    if (html === undefined) {
      html =
        text.length > MAX_LINE_CHARS
          ? highlighted.fn(text.slice(0, MAX_LINE_CHARS)) + more(text.length - MAX_LINE_CHARS)
          : highlighted.fn(text) || '&nbsp;'
      highlighted.cache.set(i, html)
    }
    return html
  }

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
      ref={paneRef}
      role={ariaLabel ? 'region' : undefined}
      aria-label={ariaLabel}
      tabIndex={ariaLabel ? 0 : undefined}
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
            <code className="t-main whitespace-pre pr-4" dangerouslySetInnerHTML={{ __html: htmlFor(i) }} />
          </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}
