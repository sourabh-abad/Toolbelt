import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CornerDownLeft } from 'lucide-react'
import { navItems, ACCENTS } from '../lib/nav'

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) {
      setQuery('')
      setCursor(0)
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return navItems
    return navItems.filter(
      (n) => n.label.toLowerCase().includes(q) || n.description.toLowerCase().includes(q) || (n.group || '').toLowerCase().includes(q)
    )
  }, [query])

  useEffect(() => setCursor(0), [query])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor((c) => Math.min(c + 1, results.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor((c) => Math.max(c - 1, 0))
      }
      if (e.key === 'Enter' && results[cursor]) {
        navigate(results[cursor].to)
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, cursor, navigate, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 px-4 pt-[14vh] backdrop-blur-sm" onClick={onClose}>
      <div
        className="panel animate-fade-up w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
      >
        <div className="bd flex items-center gap-2 border-b px-4 py-3">
          <Search className="t-faint h-4 w-4" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a tool…"
            className="t-main flex-1 bg-transparent text-sm outline-none placeholder:opacity-60"
          />
          <kbd className="bd t-faint rounded border px-1.5 py-0.5 text-[10px]">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && <div className="t-faint px-3 py-6 text-center text-sm">No tools match &ldquo;{query}&rdquo;.</div>}
          {results.map((item, i) => {
            const { to, label, icon: Icon, description, accent, group } = item
            const a = ACCENTS[accent] || ACCENTS.emerald
            const active = i === cursor
            return (
              <button
                key={to}
                onMouseEnter={() => setCursor(i)}
                onClick={() => {
                  navigate(to)
                  onClose()
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${active ? 'sunken' : ''}`}
                type="button"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${a.bg} ${a.text}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="t-main text-sm font-medium">
                    {label}
                    {group && <span className="t-faint ml-2 text-[10px] uppercase">{group}</span>}
                  </div>
                  <div className="t-muted truncate text-xs">{description}</div>
                </div>
                {active && <CornerDownLeft className="t-faint h-3.5 w-3.5 shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
