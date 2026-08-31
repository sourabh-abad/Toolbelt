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

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v)

const TYPE_TONE = {
  string: 'tok-str',
  number: 'tok-num',
  boolean: 'tok-bool',
  null: 'tok-null',
}

const ROW_HEIGHT = 24
const OVERSCAN = 12

/**
 * Flattens the visible part of the tree into a linear row list, honouring
 * which branches are collapsed. Rendering from a flat list is what makes
 * virtualisation possible — only the rows in view are ever mounted, so a
 * 50,000-node document scrolls as smoothly as a small one.
 */
function buildRows(value, collapsed) {
  const rows = []
  const walk = (name, val, depth, path) => {
    const type = typeOf(val)
    const branch = type === 'object' || type === 'array'
    const entries = branch ? (type === 'array' ? val.map((v, i) => [i, v]) : Object.entries(val)) : null

    rows.push({ path, name, type, value: val, depth, branch, childCount: entries?.length ?? 0 })

    if (branch && !collapsed.has(path)) {
      for (const [k, v] of entries) walk(String(k), v, depth + 1, `${path}.${k}`)
    }
  }
  walk('$', value, 0, '$')
  return rows
}

function Row({ row, collapsed, onToggle }) {
  const isOpen = !collapsed.has(row.path)
  const indent = row.depth * 16 + 6

  if (!row.branch) {
    return (
      <div className="code-row flex items-center gap-2" style={{ height: ROW_HEIGHT, paddingLeft: indent + 18 }}>
        <span className="tok-key mono text-sm">{row.name}</span>
        <span className="t-faint">:</span>
        <span className={`mono truncate text-sm ${TYPE_TONE[row.type] || ''}`}>
          {row.type === 'string' ? `"${row.value}"` : String(row.value)}
        </span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onToggle(row.path)}
      aria-expanded={isOpen}
      className="code-row flex w-full items-center gap-1.5 text-left"
      style={{ height: ROW_HEIGHT, paddingLeft: indent }}
    >
      <ChevronRight className={`t-faint h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
      <span className="tok-key mono text-sm">{row.name}</span>
      <span className="t-faint mono text-xs">
        {row.type === 'array' ? `[${row.childCount}]` : `{${row.childCount}}`}
      </span>
    </button>
  )
}

/** Windowed list: mounts only the rows intersecting the viewport. */
function VirtualTree({ rows, collapsed, onToggle, height = 440 }) {
  const [scrollTop, setScrollTop] = useState(0)
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const visibleCount = Math.ceil(height / ROW_HEIGHT) + OVERSCAN * 2
  const slice = rows.slice(first, first + visibleCount)

  return (
    <div
      className="bd sunken overflow-auto rounded-xl border"
      style={{ height }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      {/* Spacer gives the scrollbar the full height of the un-rendered list. */}
      <div style={{ height: rows.length * ROW_HEIGHT, position: 'relative' }}>
        <div style={{ position: 'absolute', top: first * ROW_HEIGHT, left: 0, right: 0 }}>
          {slice.map((row) => (
            <Row key={row.path} row={row} collapsed={collapsed} onToggle={onToggle} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function JsonTreeTool() {
  const [input, setInput] = useState(SAMPLE)
  const [collapsed, setCollapsed] = useState(() => new Set())

  const { parsed, error } = useMemo(() => {
    if (!input.trim()) return { parsed: null, error: '' }
    try {
      return { parsed: JSON.parse(input), error: '' }
    } catch (e) {
      return { parsed: null, error: `Invalid JSON — ${e.message}` }
    }
  }, [input])

  const rows = useMemo(() => (parsed === null ? [] : buildRows(parsed, collapsed)), [parsed, collapsed])

  const toggle = (path) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })

  const collapseAll = () => {
    if (parsed === null) return
    setCollapsed(new Set(buildRows(parsed, new Set()).filter((r) => r.branch && r.depth > 0).map((r) => r.path)))
  }

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

          <Panel
            title="Tree"
            description={rows.length ? `${rows.length} visible rows · only what fits on screen is rendered` : undefined}
            actions={
              rows.length ? (
                <>
                  <Button variant="ghost" type="button" onClick={() => setCollapsed(new Set())}>Expand all</Button>
                  <Button variant="ghost" type="button" onClick={collapseAll}>Collapse all</Button>
                </>
              ) : null
            }
          >
            {parsed !== null ? (
              <VirtualTree rows={rows} collapsed={collapsed} onToggle={toggle} />
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
