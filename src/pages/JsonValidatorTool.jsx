import { useMemo, useRef, useState } from 'react'
import {
  ShieldCheck,
  Wand2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Copy,
  Download,
  Upload,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Search as SearchIcon,
  ArrowUpDown,
} from 'lucide-react'
import { jsonParseErrorLocation, searchJsonValue } from '../lib/utils'
import { sortKeys, analyse, findDuplicateKeys } from '../lib/jsonops'
import { useToast } from '../lib/toast'
import { useDebounced } from '../lib/useDebounced'
import SplitPane from '../components/SplitPane'
import CodeViewer from '../components/CodeViewer'
import { Panel, Button, CopyButton, TextArea, Input, ErrorBanner, PageHeader, Checkbox, Tabs, Select, StatRow } from '../components/ui'

const SAMPLE = `{
  "id": 42,
  "name": "Ada Lovelace",
  "active": true,
  "roles": ["admin", "editor"],
  "address": { "city": "London", "zip": null },
  "signedUpAt": "2024-01-15T09:30:00Z"
}`

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v)
const TYPE_TONE = { string: 'tok-str', number: 'tok-num', boolean: 'tok-bool', null: 'tok-null' }
const ROW_HEIGHT = 24
const OVERSCAN = 12

// Flattens the visible part of the tree into a linear row list, honouring
// which branches are collapsed — the same windowing trick as the standalone
// tree viewer, kept local so this page has no cross-tool coupling.
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

function TreeRow({ row, collapsed, onToggle }) {
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
      <span className="t-faint mono text-xs">{row.type === 'array' ? `[${row.childCount}]` : `{${row.childCount}}`}</span>
    </button>
  )
}

function VirtualTree({ rows, collapsed, onToggle, height = 380 }) {
  const [scrollTop, setScrollTop] = useState(0)
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const visibleCount = Math.ceil(height / ROW_HEIGHT) + OVERSCAN * 2
  const slice = rows.slice(first, first + visibleCount)

  return (
    <div className="bd sunken overflow-auto rounded-xl border" style={{ height }} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
      <div style={{ height: rows.length * ROW_HEIGHT, position: 'relative' }}>
        <div style={{ position: 'absolute', top: first * ROW_HEIGHT, left: 0, right: 0 }}>
          {slice.map((row) => (
            <TreeRow key={row.path} row={row} collapsed={collapsed} onToggle={onToggle} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function JsonValidatorTool() {
  const [input, setInput] = useState(SAMPLE)
  const [view, setView] = useState('code') // 'code' | 'tree'
  const [outputMode, setOutputMode] = useState('pretty') // 'pretty' | 'minified'
  const [indent, setIndent] = useState('2')
  const [sortOn, setSortOn] = useState(false)
  const [collapsed, setCollapsed] = useState(() => new Set())
  const [search, setSearch] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [inKeys, setInKeys] = useState(true)
  const [inValues, setInValues] = useState(true)
  const fileInputRef = useRef(null)
  const toast = useToast()
  const debouncedSearch = useDebounced(search, 180)

  // `ok` distinguishes "no input yet" from "parsed successfully to the value
  // `null`" — a top-level JSON document can legitimately just be `null`.
  const { ok, parsed, error, errLoc, duplicates } = useMemo(() => {
    if (!input.trim()) return { ok: false, parsed: undefined, error: '', errLoc: null, duplicates: [] }
    try {
      const value = JSON.parse(input)
      return { ok: true, parsed: value, error: '', errLoc: null, duplicates: findDuplicateKeys(input) }
    } catch (e) {
      return { ok: false, parsed: undefined, error: e.message, errLoc: jsonParseErrorLocation(input, e.message), duplicates: [] }
    }
  }, [input])

  const shaped = useMemo(() => (ok && sortOn ? sortKeys(parsed) : parsed), [ok, parsed, sortOn])

  const outputRaw = useMemo(() => {
    if (!ok) return ''
    if (outputMode === 'minified') return JSON.stringify(shaped)
    return JSON.stringify(shaped, null, indent === 'tab' ? '\t' : Number(indent))
  }, [ok, shaped, outputMode, indent])

  const stats = useMemo(() => (ok ? analyse(shaped) : null), [ok, shaped])
  const bytes = useMemo(() => (input.trim() ? new TextEncoder().encode(input).length : 0), [input])

  const rows = useMemo(() => (ok ? buildRows(shaped, collapsed) : []), [ok, shaped, collapsed])

  const searchResults = useMemo(() => {
    if (!debouncedSearch || !ok) return []
    return searchJsonValue(shaped, debouncedSearch, { matchCase, inKeys, inValues })
  }, [debouncedSearch, ok, shaped, matchCase, inKeys, inValues])

  const toggleRow = (path) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })

  const expandAll = () => setCollapsed(new Set())
  const collapseAll = () => {
    if (!ok) return
    setCollapsed(new Set(buildRows(shaped, new Set()).filter((r) => r.branch && r.depth > 0).map((r) => r.path)))
  }

  function loadSample() {
    setInput(SAMPLE)
  }

  function clearAll() {
    setInput('')
  }

  function handleFormat() {
    setOutputMode('pretty')
    setView('code')
    toast(error ? 'Invalid JSON' : 'Formatted', error ? 'error' : 'success')
  }

  function handleMinify() {
    setOutputMode('minified')
    setView('code')
    toast(error ? 'Invalid JSON' : 'Minified', error ? 'error' : 'success')
  }

  function handleCopy() {
    if (!outputRaw) return
    navigator.clipboard.writeText(outputRaw).then(() => toast('Copied to clipboard'))
  }

  function handleDownload() {
    if (!outputRaw) return
    const blob = new Blob([outputRaw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.json'
    a.click()
    URL.revokeObjectURL(url)
    toast('Downloaded data.json')
  }

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setInput(String(reader.result ?? ''))
      toast(`Loaded ${file.name}`)
    }
    reader.onerror = () => toast('Could not read file', 'error')
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div>
      <PageHeader
        icon={ShieldCheck}
        title="JSON Validator & Editor"
        subtitle="Validate, format and explore JSON with a live tree view, duplicate-key detection and search."
        accent="emerald"
      />
      <div className="space-y-4 p-4 sm:p-6">
        <SplitPane
          storageKey="devpocket-split-jsonvalidator"
          left={
            <Panel
              title="Input"
              description={input.trim() ? `${bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`} · ${input.split('\n').length} lines` : undefined}
              actions={
                <>
                  <input ref={fileInputRef} type="file" accept=".json,application/json,text/plain" onChange={handleFileChange} className="hidden" />
                  <Button variant="ghost" type="button" onClick={handleUploadClick} title="Upload a .json file">
                    <Upload className="h-3.5 w-3.5" />Upload
                  </Button>
                  <Button variant="ghost" type="button" onClick={loadSample}>Sample</Button>
                  <Button variant="ghost" type="button" onClick={clearAll}><Trash2 className="h-3.5 w-3.5" />Clear</Button>
                </>
              }
            >
              <TextArea rows={18} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste or type JSON here…" />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button onClick={handleFormat} type="button"><Wand2 className="h-3.5 w-3.5" />Format</Button>
                <Button variant="subtle" onClick={handleMinify} type="button"><Minimize2 className="h-3.5 w-3.5" />Minify</Button>
                <button
                  type="button"
                  onClick={() => setSortOn((v) => !v)}
                  aria-pressed={sortOn}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    sortOn ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'field hover-surface t-muted'
                  }`}
                  title="Sort object keys alphabetically in the output"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />Sort keys
                </button>
                <Select value={indent} onChange={(e) => setIndent(e.target.value)} className="w-auto" title="Indent size">
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                  <option value="tab">Tabs</option>
                </Select>
              </div>

              <div className="mt-3 space-y-2">
                {error ? (
                  <ErrorBanner>
                    Invalid JSON — {error}
                    {errLoc ? ` (line ${errLoc.line}, column ${errLoc.col})` : ''}
                  </ErrorBanner>
                ) : ok ? (
                  <div className="mono flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />Valid JSON
                  </div>
                ) : null}

                {duplicates.length > 0 && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {duplicates.length} duplicate key{duplicates.length === 1 ? '' : 's'} — the last value silently wins
                    </div>
                    <ul className="mono mt-1.5 space-y-0.5 text-xs opacity-90">
                      {duplicates.slice(0, 8).map((d, i) => (
                        <li key={i}>
                          <span className="tok-key">{d.path}</span> — line {d.line}, column {d.col}
                        </li>
                      ))}
                      {duplicates.length > 8 && <li className="t-faint">…and {duplicates.length - 8} more</li>}
                    </ul>
                  </div>
                )}
              </div>
            </Panel>
          }
          right={
            <Panel
              title="Output"
              description={
                stats
                  ? `${stats.totalNodes} nodes · depth ${stats.maxDepth} · ${stats.uniqueKeys} unique keys`
                  : undefined
              }
              actions={
                <>
                  <Button variant="subtle" onClick={handleCopy} type="button" title="Copy to clipboard">
                    <Copy className="h-3.5 w-3.5" />Copy
                  </Button>
                  <Button variant="subtle" onClick={handleDownload} type="button" title="Download as .json">
                    <Download className="h-3.5 w-3.5" />Download
                  </Button>
                </>
              }
            >
              <Tabs
                value={view}
                onChange={setView}
                options={[{ value: 'code', label: 'Code' }, { value: 'tree', label: 'Tree' }]}
              />

              <div className="mt-3">
                {view === 'code' ? (
                  <CodeViewer code={outputRaw} language="json" placeholder="Paste valid JSON on the left — it formats here automatically." />
                ) : rows.length ? (
                  <>
                    <div className="mb-2 flex justify-end gap-2">
                      <Button variant="ghost" type="button" onClick={expandAll}><ChevronsDown className="h-3.5 w-3.5" />Expand all</Button>
                      <Button variant="ghost" type="button" onClick={collapseAll}><ChevronsUp className="h-3.5 w-3.5" />Collapse all</Button>
                    </div>
                    <VirtualTree rows={rows} collapsed={collapsed} onToggle={toggleRow} />
                  </>
                ) : (
                  <div className="bd sunken t-faint mono rounded-xl border border-dashed px-3 py-2.5 text-sm">
                    Paste valid JSON on the left to explore it here.
                  </div>
                )}
              </div>

              {stats && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <StatRow label="Objects" value={stats.objects} />
                  <StatRow label="Arrays" value={stats.arrays} />
                  <StatRow label="Strings" value={stats.strings} />
                  <StatRow label="Numbers" value={stats.numbers} />
                  <StatRow label="Booleans" value={stats.booleans} />
                  <StatRow label="Nulls" value={stats.nulls} />
                </div>
              )}
            </Panel>
          }
        />

        <Panel title="Search" description="Search across keys and values in the parsed document above.">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="t-faint pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input className="pl-9" placeholder="Search term…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Checkbox checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} label="Match case" />
              <Checkbox checked={inKeys} onChange={(e) => setInKeys(e.target.checked)} label="Keys" />
              <Checkbox checked={inValues} onChange={(e) => setInValues(e.target.checked)} label="Values" />
            </div>
          </div>

          {search && !ok && (
            <div className="mt-3">
              <ErrorBanner>Fix the JSON above to enable search.</ErrorBanner>
            </div>
          )}

          {search && ok && (
            <div className="mt-3">
              <div className="t-muted mb-2 text-xs">
                {searchResults.length} match{searchResults.length === 1 ? '' : 'es'}
              </div>
              <div className="max-h-72 space-y-1 overflow-auto">
                {searchResults.map((r, i) => (
                  <div key={i} className="bd sunken mono flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="tok-key truncate">{r.path || '(root)'}</div>
                      <div className="t-muted truncate">
                        <span className="t-faint">{r.matchType}: </span>
                        {String(r.value)}
                      </div>
                    </div>
                    <CopyButton text={r.path} label="" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
