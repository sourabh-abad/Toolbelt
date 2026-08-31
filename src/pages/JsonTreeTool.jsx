import { useMemo, useState } from 'react'
import { ListTree, ChevronRight, Trash2 } from 'lucide-react'
import { Panel, Button, TextArea, ErrorBanner, PageHeader } from '../components/ui'

const SAMPLE = `{
  "order": {
    "id": 1042,
    "customer": { "name": "Ada Lovelace", "verified": true },
    "items": [
      { "sku": "SKU-1", "qty": 2, "price": 19.99 }
    ],
    "total": 39.98,
    "note": null
  }
}`

const typeOf = (v) =>
  v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v

const TYPE_TONE = {
  string: 'tok-str',
  number: 'tok-num',
  boolean: 'tok-bool',
  null: 'tok-null',
}

function Node({ name, value, depth, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const type = typeOf(value)
  const branch = type === 'object' || type === 'array'

  if (!branch) {
    return (
      <div className="code-row flex items-center gap-2 py-0.5" style={{ paddingLeft: `${depth * 18 + 22}px` }}>
        <span className="tok-key mono text-sm">{name}</span>
        <span className="t-faint">:</span>
        <span className={`mono text-sm ${TYPE_TONE[type] || ''}`}>
          {type === 'string' ? `"${value}"` : String(value)}
        </span>
      </div>
    )
  }

  const entries = type === 'array' ? value.map((v, i) => [i, v]) : Object.entries(value)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="code-row flex w-full items-center gap-1.5 py-0.5 text-left"
        style={{ paddingLeft: `${depth * 18 + 4}px` }}
        aria-expanded={open}
      >
        <ChevronRight className={`t-faint h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
        <span className="tok-key mono text-sm">{name}</span>
        <span className="t-faint mono text-xs">
          {type === 'array' ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
      </button>
      {open && entries.map(([k, v]) => (
        <Node key={k} name={String(k)} value={v} depth={depth + 1} defaultOpen={depth < 1} />
      ))}
    </div>
  )
}

export default function JsonTreeTool() {
  const [input, setInput] = useState(SAMPLE)

  const { parsed, error } = useMemo(() => {
    if (!input.trim()) return { parsed: null, error: '' }
    try {
      return { parsed: JSON.parse(input), error: '' }
    } catch (e) {
      return { parsed: null, error: `Invalid JSON — ${e.message}` }
    }
  }, [input])

  return (
    <div>
      <PageHeader icon={ListTree} title="JSON Tree Viewer" subtitle="Explore a payload as a collapsible tree instead of scrolling raw text." accent="cyan" />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel
            title="JSON input"
            actions={
              <>
                <Button variant="ghost" type="button" onClick={() => setInput(SAMPLE)}>Sample</Button>
                <Button variant="ghost" type="button" onClick={() => setInput('')}><Trash2 className="h-3.5 w-3.5" />Clear</Button>
              </>
            }
          >
            <TextArea rows={18} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste JSON here…" />
            <div className="mt-3"><ErrorBanner>{error}</ErrorBanner></div>
          </Panel>

          <Panel title="Tree" description="Click a branch to collapse or expand it.">
            {parsed ? (
              <div className="bd sunken max-h-[440px] overflow-auto rounded-xl border py-2">
                <Node name="$" value={parsed} depth={0} defaultOpen />
              </div>
            ) : (
              <div className="bd sunken t-faint mono rounded-xl border border-dashed px-3 py-2.5 text-sm">
                Paste JSON on the left to explore it here.
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
