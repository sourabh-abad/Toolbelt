import { useState } from 'react'
import { Boxes, RefreshCw } from 'lucide-react'
import { FIELDS, generateRows, toSqlInserts } from '../lib/mock'
import { objectsToCsv } from '../lib/csv'
import { syntaxHighlightJson } from '../lib/utils'
import { useToast } from '../lib/toast'
import { Panel, Button, CopyButton, Input, OutputBlock, PageHeader, Tabs } from '../components/ui'

const DEFAULT_KEYS = ['id', 'fullName', 'email', 'city', 'isActive', 'createdAt']

export default function MockDataTool() {
  const [selected, setSelected] = useState(DEFAULT_KEYS)
  const [count, setCount] = useState(10)
  const [format, setFormat] = useState('json')
  const [table, setTable] = useState('users')
  const [rows, setRows] = useState([])
  const toast = useToast()

  const toggle = (key) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  function generate() {
    if (!selected.length) {
      toast('Pick at least one field', 'error')
      return
    }
    const n = Math.min(500, Math.max(1, Number(count) || 1))
    // Keep the column order stable and predictable rather than click order.
    const ordered = FIELDS.filter((f) => selected.includes(f.key)).map((f) => f.key)
    setRows(generateRows(ordered, n))
    toast(`Generated ${n} record${n === 1 ? '' : 's'}`)
  }

  const output = !rows.length
    ? ''
    : format === 'json'
    ? JSON.stringify(rows, null, 2)
    : format === 'csv'
    ? objectsToCsv(rows)
    : toSqlInserts(rows, table || 'users')

  return (
    <div>
      <PageHeader icon={Boxes} title="Mock Data Generator" subtitle="Seed a dev database or stub an API response in seconds." accent="fuchsia" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel title="Fields" description="Pick the columns you need — output keeps this order.">
          <div className="flex flex-wrap gap-1.5">
            {FIELDS.map((f) => {
              const on = selected.includes(f.key)
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggle(f.key)}
                  className={`mono rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                    on ? 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-500' : 'bd t-muted hover-surface'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          <div className="bd mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <label className="t-muted text-xs">Rows</label>
              <Input type="number" min="1" max="500" value={count} onChange={(e) => setCount(e.target.value)} className="w-24" />
            </div>
            <Tabs
              value={format}
              onChange={setFormat}
              options={[
                { value: 'json', label: 'JSON' },
                { value: 'csv', label: 'CSV' },
                { value: 'sql', label: 'SQL' },
              ]}
            />
            {format === 'sql' && (
              <div className="flex items-center gap-2">
                <label className="t-muted text-xs">Table</label>
                <Input value={table} onChange={(e) => setTable(e.target.value)} className="w-40" placeholder="users" />
              </div>
            )}
            <Button onClick={generate} type="button">
              <RefreshCw className="h-3.5 w-3.5" />Generate
            </Button>
            <span className="t-faint text-xs">{selected.length} field{selected.length === 1 ? '' : 's'} selected</span>
          </div>
        </Panel>

        <Panel
          title={`Output · ${format.toUpperCase()}`}
          actions={<CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />}
        >
          <OutputBlock
            html={format === 'json' && output ? syntaxHighlightJson(output) : null}
            text={format !== 'json' ? output : null}
            placeholder="Pick your fields and hit Generate…"
          />
        </Panel>
      </div>
    </div>
  )
}
