import { useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react'
import { lineHighlighter } from '../lib/highlight'
import { escapeHtml } from '../lib/utils'

/**
 * An editable input that is syntax-highlighted as you type — keys, strings,
 * numbers and comments in their own colours, the way an API client shows a
 * request body.
 *
 * It is a plain <textarea> with a highlighted <pre> behind it: the textarea
 * keeps its own text transparent (only the caret and the selection show) and
 * the two layers scroll together. That means no editor dependency, and every
 * native behaviour — undo, spellcheck off, IME, mobile keyboards, select-all,
 * tab-to-next-field — still works.
 *
 * The two layers MUST share font, size, line height, padding and wrapping, or
 * the text drifts out of register. That is what SHARED below is for; change it
 * in one place only.
 *
 * Past PLAIN_ABOVE characters the paint layer is dropped and the textarea shows
 * its own text. Re-highlighting and re-laying-out megabytes of spans on every
 * keystroke is what used to freeze the page on a large paste.
 */
const SHARED = 'mono px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words'
const PLAIN = 'mono px-3 py-2.5 text-sm leading-relaxed whitespace-pre'
export const PLAIN_ABOVE = 100_000

export default function CodeEditor({
  value,
  onChange,
  language = 'none',
  /** Minimum visible lines — the box scrolls past that. */
  rows = 20,
  placeholder,
  className = '',
  ariaLabel,
  /** 1-based line and column to mark as an error, or null. */
  errorLine = null,
  errorCol = null,
  /** Receives { reveal(pos, line, { focus }) } for scrolling to a position. */
  handleRef,
  ...rest
}) {
  const textRef = useRef(null)
  const paintRef = useRef(null)
  const plain = (value || '').length > PLAIN_ABOVE

  const highlight = useMemo(() => lineHighlighter(language), [language])
  const html = useMemo(() => {
    if (plain) return ''
    const lines = (value || '').split('\n')
    const errIdx = errorLine ? errorLine - 1 : -1
    return (
      lines
        .map((line, idx) => {
          if (idx !== errIdx) return highlight(line)
          // Only colour, background and a zero-width caret: anything that
          // changes glyph width would knock the layers out of register.
          const c = Math.max(0, Math.min(line.length, (errorCol || 1) - 1))
          const ch = line.slice(c, c + 1)
          const mark = ch
            ? `<span class="code-err-char">${escapeHtml(ch)}</span>`
            : '<span class="code-err-caret"></span>'
          return `<mark class="code-err-line" data-err-line>${highlight(line.slice(0, c))}${mark}${highlight(line.slice(c + 1))}</mark>`
        })
        // The trailing newline keeps a blank last line under the caret.
        .join('\n') + '\n'
    )
  }, [value, highlight, plain, errorLine, errorCol])

  const syncScroll = () => {
    const input = textRef.current
    const paint = paintRef.current
    if (!input || !paint) return
    paint.scrollTop = input.scrollTop
    paint.scrollLeft = input.scrollLeft
  }

  useImperativeHandle(
    handleRef,
    () => ({
      reveal(pos, line, { focus = false } = {}) {
        const input = textRef.current
        if (!input) return
        if (focus) {
          input.focus({ preventScroll: true })
          input.setSelectionRange(pos, Math.min(pos + 1, input.value.length))
        }
        // The marked line in the paint layer knows its real offset, wrapping
        // included; without one (plain mode) estimate from the line height.
        const marked = paintRef.current?.querySelector('[data-err-line]')
        const lh = parseFloat(getComputedStyle(input).lineHeight) || 22
        const top = marked ? marked.offsetTop : (line - 1) * lh
        input.scrollTop = Math.max(0, top - input.clientHeight / 3)
        syncScroll()
      },
    }),
    []
  )

  // Typing near the bottom scrolls the textarea; the paint layer has to follow
  // before the browser shows the frame, or the colours lag a line behind.
  useLayoutEffect(syncScroll, [value, html])

  return (
    <div
      className={`code-editor field relative overflow-hidden rounded-xl border transition-colors focus-within:border-emerald-500/60 ${
        errorLine ? 'border-rose-500/50' : ''
      } ${className}`}
      style={{ '--editor-rows': `${rows * 1.5}rem` }}
    >
      {!plain && (
        <pre
          ref={paintRef}
          aria-hidden="true"
          className={`t-main pointer-events-none absolute inset-0 overflow-hidden ${SHARED}`}
          style={{ scrollbarGutter: 'stable' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      <textarea
        ref={textRef}
        value={value}
        onChange={onChange}
        onScroll={syncScroll}
        spellCheck={false}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent outline-none placeholder:text-[color:var(--text-faint)] selection:bg-emerald-500/30 ${
          plain ? `t-main ${PLAIN}` : `text-transparent caret-current ${SHARED}`
        }`}
        // Soft-wrapping megabytes of text is most of the layout cost.
        wrap={plain ? 'off' : undefined}
        // Tailwind's preflight turns font features off for <pre> but not for a
        // textarea, and the body enables cv11/ss01 — match the paint layer.
        style={{ caretColor: 'var(--text)', scrollbarGutter: 'stable', fontFeatureSettings: 'normal' }}
        {...rest}
      />
      {plain && (
        <span className="t-faint panel pointer-events-none absolute right-3 bottom-2 rounded-md border px-1.5 py-0.5 text-[11px]">
          Large input · highlighting off
        </span>
      )}
    </div>
  )
}
