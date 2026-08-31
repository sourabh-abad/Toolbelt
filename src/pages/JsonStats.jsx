import { useMemo, useState } from 'react'
import { BarChart3, Trash2 } from 'lucide-react'
import { analyse } from '../lib/jsonops'
import { Panel, Button, TextArea, ErrorBanner, PageHeader } from '../components/ui'

const SAMPLE = `{
  "orders": [
    { "id": 1, "total": 39.98, "paid": true, "note": null },
    { "id": 2, "total": 12.5, "paid": false, "note": "gift" }
  ],
  "customer": { "name": "Ada", "address": { "city": "London" } }
}`

const TILES = [
  { key: 'totalNodes', label: 'Total nodes', tone: 'text-emerald-500' },
  { key: 'maxDepth', label: 'Max depth', tone: 'text-sky-500' },
  { key: 'uniqueKeys', label: 'Unique keys', tone: 'text-violet-500' },
  { key: 'objects', label: 'Objects', tone: 'text-amber-500' },
  { key: 'arrays', label: 'Arrays', tone: 'text-rose-500' },
  { key: 'strings', label: 'Strings', tone: 'text-teal-500' },
  { key: 'numbers', label: 'Numbers', tone: 'text-orange-500' },
  { key: 'booleans', label: 'Booleans', tone: 'text-cyan-500' },
  { key: 'nulls', label: 'Nulls', tone: 'text-pink-500' },
]

export default function JsonStats() {
  const [input, setInput] = useState(SAMPLE)

  const { stats, error, bytes } = useMemo(() => {
    if (!input.trim()) return { stats: null, error: '', bytes: 0 }
    try {
      const parsed = JSON.parse(input)
      return {
        stats: analyse(parsed),
        error: '',
        bytes: new TextEncoder().encode(input).length,
      }
    } catch (e) {
      return { stats: null, error: `Invalid JSON — ${e.message}`, bytes: 0 }
    }
  }, [input])

  return (
    <div>
      <PageHeader icon={BarChart3} title="JSON Statistics" subtitle="Node counts, nesting depth and type distribution for any payload." accent="fuchsia" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel
          title="JSON input"
          actions={
            <>
              <Button variant="ghost" type="button" onClick={() => setInput(SAMPLE)}>Sample</Button>
              <Button variant="ghost" type="button" onClick={() => setInput('')}><Trash2 className="h-3.5 w-3.5" />Clear</Button>
            </>
          }
        >
          <TextArea rows={10} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste JSON here…" />
          <div className="mt-3"><ErrorBanner>{error}</ErrorBanner></div>
        </Panel>

        {stats && (
          <>
            <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {TILES.map(({ key, label, tone }) => (
                <div key={key} className="panel rounded-xl border p-4">
                  <div className={`mono text-2xl font-bold tabular-nums ${tone}`}>{stats[key]}</div>
                  <div className="t-muted mt-1 text-xs">{label}</div>
                </div>
              ))}
              <div className="panel rounded-xl border p-4">
                <div className="mono t-main text-2xl font-bold tabular-nums">
                  {bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}KB`}
                </div>
                <div className="t-muted mt-1 text-xs">Size</div>
              </div>
            </div>

            <Panel title={`Keys (${stats.uniqueKeys})`} description="Every distinct key name in the document, alphabetised.">
              <div className="flex flex-wrap gap-1.5">
                {stats.keys.map((k) => (
                  <span key={k} className="bd sunken mono t-muted rounded-lg border px-2 py-1 text-xs">{k}</span>
                ))}
              </div>
            </Panel>
          </>
        )}
      </div>
    </div>
  )
}
