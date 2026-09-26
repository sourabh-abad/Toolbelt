import { useMemo, useState } from 'react'
import { FileDiff, ArrowLeftRight, Trash2, Search } from 'lucide-react'
import { useToast } from '../lib/toast'
import { useDebounced } from '../lib/useDebounced'
import { compareValues, stringify } from '../lib/propsops'
import { Panel, Button, CopyButton, PageHeader, Checkbox, Input, Tabs } from '../components/ui'
import CodeEditor from '../components/CodeEditor'

const SAMPLE_A = `# application.properties (dev)
server.port=8080
spring.datasource.url=jdbc\\:mysql://localhost:3306/shop
spring.datasource.username=root
spring.jpa.show-sql=true
logging.level.root=DEBUG
cache.ttl.seconds=60
feature.checkout.v2=true
dev.only.toggle=on
`

const SAMPLE_B = `# application-prod.properties
server.port=8080
spring.datasource.url=jdbc\\:mysql://db.internal:3306/shop
spring.datasource.username=shop_app
spring.jpa.show-sql=false
logging.level.root=WARN
cache.ttl.seconds=300
feature.checkout.v2=true
prod.only.replicas=4
`

const VIEWS = [
  { value: 'all', label: 'Everything' },
  { value: 'different', label: 'Different' },
  { value: 'only-a', label: 'Only in A' },
  { value: 'only-b', label: 'Only in B' },
  { value: 'same', label: 'Identical' },
]

const STATUS = {
  different: { label: 'differs', cell: 'bg-amber-500/5', tag: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  'only-a': { label: 'only in A', cell: 'bg-rose-500/5', tag: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  'only-b': { label: 'only in B', cell: 'bg-emerald-500/5', tag: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  same: { label: 'same', cell: '', tag: 'sunken t-faint' },
}

/** Above this the table stops being something you read and starts being something that stutters. */
const MAX_ROWS = 400

export default function PropertiesCompareTool() {
  const [left, setLeft] = useState(SAMPLE_A)
  const [right, setRight] = useState(SAMPLE_B)
  const [view, setView] = useState('all')
  const [query, setQuery] = useState('')
  const [trim, setTrim] = useState(false)
  const [ignoreCase, setIgnoreCase] = useState(false)

  const toast = useToast()
  const a = useDebounced(left, 200)
  const b = useDebounced(right, 200)

  const { rows, summary } = useMemo(() => compareValues(a, b, { trim, ignoreCase }), [a, b, trim, ignoreCase])

  const visible = useMemo(() => {
    let list = view === 'all' ? rows : rows.filter((r) => r.status === view)
    const needle = query.trim().toLowerCase()
    if (needle) {
      list = list.filter(
        (r) =>
          r.key.toLowerCase().includes(needle) ||
          (r.a ?? '').toLowerCase().includes(needle) ||
          (r.b ?? '').toLowerCase().includes(needle)
      )
    }
    return list
  }, [rows, view, query])

  // The three things you actually want to take away from a comparison: the
  // entries B is missing, the entries A is missing, and the values that moved.
  const exports = useMemo(
    () => ({
      missingInB: stringify(rows.filter((r) => r.status === 'only-a').map((r) => [r.key, r.a])),
      missingInA: stringify(rows.filter((r) => r.status === 'only-b').map((r) => [r.key, r.b])),
      differing: rows
        .filter((r) => r.status === 'different')
        .map((r) => `${r.key}\n  A: ${r.a}\n  B: ${r.b}`)
        .join('\n'),
    }),
    [rows]
  )

  function swap() {
    setLeft(right)
    setRight(left)
    toast('Swapped A and B')
  }

  function clearAll() {
    setLeft('')
    setRight('')
  }

  return (
    <div>
      <PageHeader
        icon={FileDiff}
        title="Properties Compare"
        subtitle="Diff two .properties files by key and by value — missing keys, changed values, everything else out of the way."
        accent="rose"
      />

      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="File A" description={`${summary.countA} key${summary.countA === 1 ? '' : 's'}`}>
            <CodeEditor
              language="properties"
              rows={14}
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              placeholder="Paste the first .properties file…"
              ariaLabel="First properties file"
            />
          </Panel>
          <Panel title="File B" description={`${summary.countB} key${summary.countB === 1 ? '' : 's'}`}>
            <CodeEditor
              language="properties"
              rows={14}
              value={right}
              onChange={(e) => setRight(e.target.value)}
              placeholder="Paste the second .properties file…"
              ariaLabel="Second properties file"
            />
          </Panel>
        </div>

        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs options={VIEWS} value={view} onChange={setView} />
            <div className="relative">
              <Search className="t-faint pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" aria-hidden="true" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by key or value…"
                aria-label="Filter the comparison"
                className="w-56 pl-9"
              />
            </div>
            <Checkbox checked={trim} onChange={(e) => setTrim(e.target.checked)} label="Ignore surrounding spaces" />
            <Checkbox checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} label="Ignore case" />
            <Button variant="subtle" type="button" onClick={swap}>
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Swap
            </Button>
            <Button variant="ghost" type="button" onClick={() => { setLeft(SAMPLE_A); setRight(SAMPLE_B) }}>
              Sample
            </Button>
            <Button variant="ghost" type="button" onClick={clearAll}>
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t bd pt-3 sm:grid-cols-4">
            <Tile label="Different" value={summary.different} tone="text-amber-500" />
            <Tile label="Only in A" value={summary.onlyInA} tone="text-rose-500" />
            <Tile label="Only in B" value={summary.onlyInB} tone="text-emerald-500" />
            <Tile label="Identical" value={summary.same} tone="t-faint" />
          </div>
        </Panel>

        <Panel
          title="Comparison"
          description={
            visible.length
              ? `${visible.length} row${visible.length === 1 ? '' : 's'}${visible.length > MAX_ROWS ? ` — showing the first ${MAX_ROWS}` : ''}`
              : 'Nothing matches this filter'
          }
          actions={
            <>
              <CopyButton label="Copy A → B gaps" text={exports.missingInB} onCopied={() => toast('Entries missing from B copied')} />
              <CopyButton label="Copy B → A gaps" text={exports.missingInA} onCopied={() => toast('Entries missing from A copied')} />
              <CopyButton label="Copy differences" text={exports.differing} onCopied={() => toast('Differing values copied')} />
            </>
          }
        >
          <ResultTable rows={visible.slice(0, MAX_ROWS)} />
        </Panel>
      </div>
    </div>
  )
}

function Tile({ label, value, tone }) {
  return (
    <div className="bd sunken rounded-xl border px-3 py-2">
      <div className={`mono text-lg font-semibold tabular-nums ${tone}`}>{value}</div>
      <div className="t-muted text-xs">{label}</div>
    </div>
  )
}

function ResultTable({ rows }) {
  if (!rows.length) {
    return (
      <div className="bd sunken t-faint mono rounded-xl border border-dashed px-3 py-2.5 text-sm">
        Paste a file into each side — every key lands here marked same, different or missing.
      </div>
    )
  }

  return (
    <div className="bd sunken overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="t-faint bd border-b text-[11px] tracking-wider uppercase">
          <tr>
            <th className="px-3 py-2 font-medium">Key</th>
            <th className="px-3 py-2 font-medium">A</th>
            <th className="px-3 py-2 font-medium">B</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = STATUS[row.status]
            return (
              <tr key={row.key} className={`bd border-t align-top ${status.cell}`}>
                <td className="mono t-main px-3 py-1.5 break-all">
                  {row.key}
                  <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${status.tag}`}>{status.label}</span>
                </td>
                <td className="mono t-muted px-3 py-1.5 break-all">{cell(row.a)}</td>
                <td className="mono t-muted px-3 py-1.5 break-all">{cell(row.b)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function cell(value) {
  if (value === undefined) return <span className="t-faint">—</span>
  if (value === '') return <span className="t-faint italic">empty</span>
  return value
}
