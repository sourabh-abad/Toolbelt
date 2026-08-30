import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Horizontal split with a draggable divider. Falls back to a stacked layout
 * below `lg` where dragging a divider makes little sense on narrow screens.
 */
export default function SplitPane({ left, right, storageKey = 'toolbelt-split', initial = 50 }) {
  const containerRef = useRef(null)
  const draggingRef = useRef(false)
  const [pct, setPct] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return Math.min(80, Math.max(20, Number(saved)))
    } catch {
      // ignore
    }
    return initial
  })

  const onMove = useCallback(
    (clientX) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const next = Math.min(80, Math.max(20, ((clientX - rect.left) / rect.width) * 100))
      setPct(next)
    },
    []
  )

  useEffect(() => {
    const handleMove = (e) => {
      if (!draggingRef.current) return
      e.preventDefault()
      onMove(e.touches ? e.touches[0].clientX : e.clientX)
    }
    const stop = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      try {
        localStorage.setItem(storageKey, String(pct))
      } catch {
        // ignore
      }
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchend', stop)
    }
  }, [onMove, pct, storageKey])

  const start = () => {
    draggingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-4 lg:flex-row lg:gap-0">
      <div className="min-w-0 lg:pr-2" style={{ flexBasis: `${pct}%` }}>
        {left}
      </div>
      <div
        onMouseDown={start}
        onTouchStart={start}
        onDoubleClick={() => setPct(50)}
        title="Drag to resize · double-click to reset"
        className="group hidden w-3 shrink-0 cursor-col-resize items-center justify-center lg:flex"
      >
        <div className="bd h-16 w-1 rounded-full border-l-2 border-r-2 transition-colors group-hover:border-emerald-500/60" />
      </div>
      <div className="min-w-0 flex-1 lg:pl-2">{right}</div>
    </div>
  )
}
