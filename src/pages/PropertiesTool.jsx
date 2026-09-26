import { useMemo, useState } from 'react'
import { TableProperties, Trash2, ArrowUp, Search, AlertTriangle, Info } from 'lucide-react'
import { useToast } from '../lib/toast'
import { useDebounced } from '../lib/useDebounced'
import {
  format,
  listKeys,
  keyNames,
  stats,
  problems,
  toYaml,
  toJson,
  fromYaml,
  fromJson,
} from '../lib/propsops'
import SplitPane from '../components/SplitPane'
import { Panel, Button, CopyButton, ErrorBanner, PageHeader, Select, Checkbox, Input, Tabs } from '../components/ui'
import CodeViewer from '../components/CodeViewer'
import CodeEditor from '../components/CodeEditor'

const SAMPLE = `# shop-api — application.properties
# owner: platform team

spring.application.name=shop-api
server.port=8080
server.servlet.context-path=/api

# datasource
spring.datasource.url=jdbc\\:mysql://db:3306/shop?useSSL=false
spring.datasource.username=shop
spring.datasource.password=
spring.datasource.hikari.maximum-pool-size=20

# tuned during the sale, review before Q4
cache.ttl.seconds=300
cache.regions[0]=catalogue
cache.regions[1]=pricing

feature.checkout.v2=true
notify.from=no-reply@\${spring.application.name}.internal
notify.subject=Order \\u00a35 confirmed

# a key holds a space only when the space is escaped — the second line here
# defines "legacy.timeout", not "legacy.timeout 30"
report\\ title=Weekly sales
legacy.timeout 30

# someone appended this during an incident and never took it out
server.port=9090
`

const TABS = [
  { value: 'view', label: 'View & clean' },
  { value: 'keys', label: 'Keys' },
  { value: 'convert', label: 'Convert' },
]

const SEPARATORS = [
  { value: '=', label: 'key=value' },
  { value: ' = ', label: 'key = value' },
  { value: ':', label: 'key:value' },
  { value: ': ', label: 'key: value' },
]

const DIRECTIONS = [
  { value: 'to-yaml', label: 'Properties → YAML', source: 'properties', target: 'yaml' },
  { value: 'to-json', label: 'Properties → JSON', source: 'properties', target: 'json' },
  { value: 'from-yaml', label: 'YAML → Properties', source: 'yaml', target: 'properties' },
  { value: 'from-json', label: 'JSON → Properties', source: 'json', target: 'properties' },
]

const FILTERS = [
  { value: 'all', label: 'All keys' },
  { value: 'duplicate', label: 'Duplicated' },
  { value: 'empty', label: 'Empty value' },
  { value: 'placeholder', label: 'Has ${…}' },
  { value: 'padded', label: 'Padded value' },
]

/** Above this the table stops being something you read and starts being something that stutters. */
const MAX_ROWS = 400

export default function PropertiesTool() {
  const [input, setInput] = useState(SAMPLE)
  const [tab, setTab] = useState('view')

  // View options
  const [sort, setSort] = useState('file')
  const [separator, setSeparator] = useState('=')
  const [dedupe, setDedupe] = useState('keep')
  const [keepComments, setKeepComments] = useState(true)
  const [align, setAlign] = useState(false)

  // Key list options
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [unique, setUnique] = useState(true)
  const [keySort, setKeySort] = useState('file')

  // Convert options
  const [direction, setDirection] = useState('to-yaml')
  const [nested, setNested] = useState(true)
  const [inferTypes, setInferTypes] = useState(true)

  const toast = useToast()
  const debounced = useDebounced(input, 200)
  const active = DIRECTIONS.find((d) => d.value === direction)
  const reading = tab === 'convert' ? active.source : 'properties'

  const summary = useMemo(() => (reading === 'properties' ? stats(debounced) : null), [debounced, reading])
  const issues = useMemo(() => (reading === 'properties' ? problems(debounced) : []), [debounced, reading])

  const formatted = useMemo(() => {
    if (tab !== 'view' || !debounced.trim()) return { text: '', removed: 0 }
    return format(debounced, { sort, separator, dedupe, keepComments, keepBlanks: true, align })
  }, [tab, debounced, sort, separator, dedupe, keepComments, align])

  const rows = useMemo(() => {
    if (tab !== 'keys' || !debounced.trim()) return []
    let list = listKeys(debounced, { unique, sort: keySort })
    if (filter === 'duplicate') list = list.filter((r) => r.duplicate)
    else if (filter === 'empty') list = list.filter((r) => r.empty)
    else if (filter === 'placeholder') list = list.filter((r) => r.placeholders.length)
    else if (filter === 'padded') list = list.filter((r) => r.padded)
    const needle = query.trim().toLowerCase()
    if (needle) list = list.filter((r) => r.key.toLowerCase().includes(needle) || r.value.toLowerCase().includes(needle))
    return list
  }, [tab, debounced, unique, keySort, filter, query])

  const converted = useMemo(() => {
    if (tab !== 'convert' || !debounced.trim()) return { text: '', error: '', conflicts: [] }
    try {
      if (direction === 'to-yaml') return { ...toYaml(debounced, { nested, inferTypes }), error: '' }
      if (direction === 'to-json') return { ...toJson(debounced, { nested, inferTypes }), error: '' }
      const text = direction === 'from-yaml' ? fromYaml(debounced, { separator }) : fromJson(debounced, { separator })
      return { text, error: '', conflicts: [] }
    } catch (e) {
      const at = e.mark ? `Line ${e.mark.line + 1}, column ${e.mark.column + 1} — ` : ''
      return { text: '', conflicts: [], error: at + (e.reason || e.message) }
    }
  }, [tab, debounced, direction, nested, inferTypes, separator])

  const output = tab === 'view' ? formatted.text : tab === 'convert' ? converted.text : ''
  const outputLanguage = tab === 'convert' ? active.target : 'properties'

  function useOutputAsInput() {
    if (!output) return
    setInput(output)
    if (direction === 'from-yaml' || direction === 'from-json') setDirection('to-yaml')
    toast('Result moved to the input')
  }

  const editor = (
    <Panel
      title={reading === 'properties' ? '.properties' : reading.toUpperCase()}
      description={reading === 'properties' ? statusLine(summary) : 'Converted into properties on the right'}
      actions={
        <>
          <Button variant="ghost" type="button" onClick={() => setInput(SAMPLE)}>Sample</Button>
          <Button variant="ghost" type="button" onClick={() => setInput('')}>
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        </>
      }
    >
      <CodeEditor
        language={reading}
        rows={tab === 'keys' ? 14 : 24}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={reading === 'properties' ? 'Paste a .properties file here…' : `Paste ${reading.toUpperCase()} here…`}
        ariaLabel={`${reading} input`}
      />

      {issues.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {issues.slice(0, 8).map((issue, i) => (
            <li
              key={i}
              className={`flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                issue.level === 'error'
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300'
                  : issue.level === 'warn'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                    : 'bd sunken t-muted'
              }`}
            >
              {issue.level === 'info' ? (
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>
                <span className="mono">Line {issue.line}</span> · <span className="mono">{issue.key}</span> — {issue.message}
              </span>
            </li>
          ))}
          {issues.length > 8 && <li className="t-faint text-xs">and {issues.length - 8} more.</li>}
        </ul>
      )}
    </Panel>
  )

  const resultPanel = (
    <Panel
      title="Result"
      description={
        tab === 'view'
          ? formatted.removed
            ? `${formatted.removed} duplicate ${formatted.removed === 1 ? 'entry' : 'entries'} removed`
            : undefined
          : converted.conflicts?.length
            ? `${converted.conflicts.length} key${converted.conflicts.length === 1 ? '' : 's'} could not be nested`
            : undefined
      }
      actions={
        <>
          <Button variant="ghost" type="button" onClick={useOutputAsInput} disabled={!output} title="Move the result back into the editor">
            <ArrowUp className="h-3.5 w-3.5" />
            Use as input
          </Button>
          <CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />
        </>
      }
    >
      <CodeViewer code={output} language={outputLanguage} placeholder="The result appears here as you type…" />
      {converted.error && (
        <div className="mt-3">
          <ErrorBanner>{converted.error}</ErrorBanner>
        </div>
      )}
      {converted.conflicts?.length > 0 && (
        <p className="t-muted mt-3 text-xs leading-relaxed">
          <span className="mono">{converted.conflicts.slice(0, 4).join(', ')}</span>
          {converted.conflicts.length > 4 ? ` and ${converted.conflicts.length - 4} more` : ''} would have to be both a value
          and a branch — <span className="mono">a=1</span> next to <span className="mono">a.b=2</span> — so they are left as
          flat keys instead of dropping one of the two.
        </p>
      )}
    </Panel>
  )

  return (
    <div>
      <PageHeader
        icon={TableProperties}
        title="Properties Viewer"
        subtitle="Read, clean, list and convert a .properties file — duplicates and empty values called out."
        accent="amber"
      />

      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs options={TABS} value={tab} onChange={setTab} />

            {tab === 'view' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="t-muted text-xs">Order</label>
                  <Select value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="file">File order</option>
                    <option value="asc">Keys A → Z</option>
                    <option value="desc">Keys Z → A</option>
                  </Select>
                </div>
                <div className="flex min-w-0 max-w-full items-center gap-2">
                  <label className="t-muted text-xs">Duplicates</label>
                  <Select value={dedupe} onChange={(e) => setDedupe(e.target.value)} className="min-w-0 max-w-full">
                    <option value="keep">Keep all</option>
                    <option value="last">Keep the last (what loads)</option>
                    <option value="first">Keep the first</option>
                  </Select>
                </div>
                <Checkbox checked={keepComments} onChange={(e) => setKeepComments(e.target.checked)} label="Keep comments" />
                <Checkbox checked={align} onChange={(e) => setAlign(e.target.checked)} label="Align values" />
              </>
            )}

            {tab === 'keys' && (
              <>
                <div className="relative">
                  <Search className="t-faint pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" aria-hidden="true" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter by key or value…"
                    aria-label="Filter keys"
                    className="w-56 pl-9"
                  />
                </div>
                <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  {FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </Select>
                <Select value={keySort} onChange={(e) => setKeySort(e.target.value)}>
                  <option value="file">File order</option>
                  <option value="asc">A → Z</option>
                  <option value="desc">Z → A</option>
                </Select>
                <Checkbox checked={unique} onChange={(e) => setUnique(e.target.checked)} label="One row per key" />
                <CopyButton
                  label="Copy keys"
                  text={keyNames(debounced, { sort: keySort }).join('\n')}
                  onCopied={() => toast('Key names copied')}
                />
              </>
            )}

            {tab === 'convert' && (
              <>
                <Select value={direction} onChange={(e) => setDirection(e.target.value)}>
                  {DIRECTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </Select>
                {active.source === 'properties' ? (
                  <>
                    <Checkbox checked={nested} onChange={(e) => setNested(e.target.checked)} label="Nest dotted keys" />
                    <Checkbox
                      checked={inferTypes}
                      onChange={(e) => setInferTypes(e.target.checked)}
                      label="Numbers and booleans, not strings"
                    />
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <label className="t-muted text-xs">Separator</label>
                    <Select value={separator} onChange={(e) => setSeparator(e.target.value)}>
                      {SEPARATORS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </Select>
                  </div>
                )}
              </>
            )}

            {tab === 'view' && (
              <div className="flex items-center gap-2">
                <label className="t-muted text-xs">Separator</label>
                <Select value={separator} onChange={(e) => setSeparator(e.target.value)}>
                  {SEPARATORS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </Panel>

        {tab === 'keys' ? (
          <div className="space-y-4">
            {editor}
            <Panel
              title="Keys"
              description={
                rows.length
                  ? `${rows.length} row${rows.length === 1 ? '' : 's'}${rows.length > MAX_ROWS ? ` — showing the first ${MAX_ROWS}` : ''}`
                  : 'No keys match'
              }
            >
              <KeyTable rows={rows.slice(0, MAX_ROWS)} />
            </Panel>
          </div>
        ) : (
          <SplitPane storageKey="devpocket-split-properties" left={editor} right={resultPanel} />
        )}
      </div>
    </div>
  )
}

/** The one-line read on the file, shown under the editor heading. */
function statusLine(summary) {
  if (!summary || summary.entries === 0) return 'Nothing loaded yet'
  const bits = [`${summary.keys} key${summary.keys === 1 ? '' : 's'}`]
  if (summary.duplicates) bits.push(`${summary.duplicates} duplicated`)
  if (summary.empty) bits.push(`${summary.empty} empty`)
  if (summary.multiline) bits.push(`${summary.multiline} wrapped`)
  if (summary.placeholders) bits.push(`${summary.placeholders} \${…}`)
  if (summary.comments) bits.push(`${summary.comments} comment${summary.comments === 1 ? '' : 's'}`)
  if (summary.nonAscii) bits.push(`${summary.nonAscii} non-ASCII`)
  return bits.join(' · ')
}

const TAG = 'rounded px-1.5 py-0.5 text-[10px] font-medium'

function KeyTable({ rows }) {
  if (!rows.length) {
    return (
      <div className="bd sunken t-faint mono rounded-xl border border-dashed px-3 py-2.5 text-sm">
        Paste a file above — every key lands here with its value and line.
      </div>
    )
  }

  return (
    <div className="bd sunken overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="t-faint bd border-b text-[11px] tracking-wider uppercase">
          <tr>
            <th className="px-3 py-2 font-medium">Key</th>
            <th className="px-3 py-2 font-medium">Value</th>
            <th className="px-3 py-2 text-right font-medium">Line</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.key}-${row.line}-${i}`} className="bd border-t align-top">
              <td className="mono t-main px-3 py-1.5 break-all">
                {row.key}
                {row.duplicate && (
                  <span className={`${TAG} ml-2 bg-rose-500/10 text-rose-600 dark:text-rose-400`} title={`Defined ${row.occurrences} times`}>
                    ×{row.occurrences}
                  </span>
                )}
              </td>
              <td className="mono t-muted px-3 py-1.5 break-all">
                {row.empty ? (
                  <span className="t-faint italic">empty</span>
                ) : (
                  <>
                    {row.value}
                    {row.padded && (
                      <span className={`${TAG} ml-2 bg-amber-500/10 text-amber-600 dark:text-amber-400`} title="Leading or trailing whitespace is kept on load">
                        padded
                      </span>
                    )}
                    {row.placeholders.map((p) => (
                      <span
                        key={p.raw}
                        className={`${TAG} ml-2 ${
                          p.defined || p.fallback !== null
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                        title={p.defined ? 'Defined in this file' : p.fallback !== null ? 'Has a default' : 'Not defined in this file'}
                      >
                        {p.ref}
                      </span>
                    ))}
                  </>
                )}
              </td>
              <td className="mono t-faint px-3 py-1.5 text-right tabular-nums">{row.line}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
