import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

/** "A new version is ready — Reload", shown when a new service worker takes over. */
export default function UpdateBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = () => setVisible(true)
    window.addEventListener('devpocket:updated', show)
    return () => window.removeEventListener('devpocket:updated', show)
  }, [])

  if (!visible) return null
  return (
    <div role="status" className="panel fixed right-4 bottom-4 left-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl sm:left-auto">
      <p className="t-main min-w-0 flex-1 text-sm">A new version of DevPocket is ready.</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Reload
      </button>
      <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss" className="hover-surface t-muted flex h-11 w-11 items-center justify-center rounded-lg">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
