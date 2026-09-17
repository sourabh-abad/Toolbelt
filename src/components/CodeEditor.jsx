import { useLayoutEffect, useMemo, useRef } from 'react'
import { lineHighlighter } from '../lib/highlight'

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
 */
const SHARED = 'mono px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words'

export default function CodeEditor({
  value,
  onChange,
  language = 'none',
  /** Minimum visible lines — the box scrolls past that. */
  rows = 20,
  placeholder,
  className = '',
  ariaLabel,
  ...rest
}) {
  const textRef = useRef(null)
  const paintRef = useRef(null)

  const highlight = useMemo(() => lineHighlighter(language), [language])
  const html = useMemo(
    // The trailing newline keeps a blank last line under the caret.
    () => (value || '').split('\n').map(highlight).join('\n') + '\n',
    [value, highlight]
  )

  const syncScroll = () => {
    const input = textRef.current
    const paint = paintRef.current
    if (!input || !paint) return
    paint.scrollTop = input.scrollTop
    paint.scrollLeft = input.scrollLeft
  }

  // Typing near the bottom scrolls the textarea; the paint layer has to follow
  // before the browser shows the frame, or the colours lag a line behind.
  useLayoutEffect(syncScroll, [value])

  return (
    <div
      className={`field relative overflow-hidden rounded-xl border transition-colors focus-within:border-emerald-500/60 ${className}`}
      style={{ minHeight: `${rows * 1.5}rem` }}
    >
      <pre
        ref={paintRef}
        aria-hidden="true"
        className={`t-main pointer-events-none absolute inset-0 overflow-hidden ${SHARED}`}
        style={{ scrollbarGutter: 'stable' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <textarea
        ref={textRef}
        value={value}
        onChange={onChange}
        onScroll={syncScroll}
        spellCheck={false}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent text-transparent caret-current outline-none placeholder:text-[color:var(--text-faint)] selection:bg-emerald-500/30 ${SHARED}`}
        // Tailwind's preflight turns font features off for <pre> but not for a
        // textarea, and the body enables cv11/ss01 — match the paint layer.
        style={{ caretColor: 'var(--text)', scrollbarGutter: 'stable', fontFeatureSettings: 'normal' }}
        {...rest}
      />
    </div>
  )
}
