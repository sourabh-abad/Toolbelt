import { useEffect, useId, useMemo, useRef, useState } from 'react'
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
  Info,
  Loader2,
  LocateFixed,
} from 'lucide-react'
import { searchJsonValue } from '../lib/utils'
import { isLossless } from '../lib/jsonparse'
import { useJsonAnalysis } from '../lib/useJsonAnalysis'
import { plural } from '../lib/format'
import { useToast } from '../lib/toast'
import { useDebounced } from '../lib/useDebounced'
import SplitPane from '../components/SplitPane'
import CodeViewer from '../components/CodeViewer'
import CodeEditor from '../components/CodeEditor'
import { Panel, Button, CopyButton, Input, ErrorBanner, PageHeader, Checkbox, Tabs, Select, StatRow } from '../components/ui'

const SAMPLE = `{
  "id": 42,
  "name": "Ada Lovelace",
  "active": true,
  "roles": ["admin", "editor"],
  "address": { "city": "London", "zip": null },
  "signedUpAt": "2024-01-15T09:30:00Z"
}`

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : isLossless(v) ? 'number' : typeof v)
// Documents bigger than this open with only the top level expanded, so the
// tree is built for what is on screen rather than for every node up front.
const AUTO_COLLAPSE_NODES = 5000
// Past this size the input is shown in a virtualised read-only view instead of
// the textarea. A browser textarea lays out every line of its value, and for a
// couple of megabytes that alone blocks the page for a second or more.
const LARGE_VIEW = 300_000
const TYPE_TONE = { string: 'tok-str', number: 'tok-num', boolean: 'tok-bool', null: 'tok-null' }
const ROW_HEIGHT = 24
const OVERSCAN = 12

// Flattens the visible part of the tree into a linear row list, descending
// only into open branches — a collapsed subtree costs nothing to build.
function buildRows(value, isOpen) {
  const rows = []
  const walk = (name, val, depth, path) => {
    const type = typeOf(val)
    const branch = type === 'object' || type === 'array'
    const childCount = branch ? (type === 'array' ? val.length : Object.keys(val).length) : 0
    const open = branch && isOpen(path, depth)
    rows.push({ path, name, type, value: val, depth, branch, childCount, open })
    if (open) {
      if (type === 'array') val.forEach((v, i) => walk(String(i), v, depth + 1, `${path}.${i}`))
      else for (const k of Object.keys(val)) walk(k, val[k], depth + 1, `${path}.${k}`)
    }
  }
  walk('$', value, 0, '$')
  return rows
}

function TreeRow({ row, onToggle }) {
  const isOpen = row.open
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

function VirtualTree({ rows, onToggle, height = 380 }) {
  const [scrollTop, setScrollTop] = useState(0)
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const visibleCount = Math.ceil(height / ROW_HEIGHT) + OVERSCAN * 2
  const slice = rows.slice(first, first + visibleCount)

  return (
    <div className="bd sunken overflow-auto rounded-xl border" style={{ height }} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
      <div style={{ height: rows.length * ROW_HEIGHT, position: 'relative' }}>
        <div style={{ position: 'absolute', top: first * ROW_HEIGHT, left: 0, right: 0 }}>
          {slice.map((row) => (
            <TreeRow key={row.path} row={row} onToggle={onToggle} />
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
  // Tree state: a base mode plus the branches the user flipped from it.
  const [tree, setTree] = useState(() => ({ mode: 'auto', toggled: new Set() }))
  const [search, setSearch] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [inKeys, setInKeys] = useState(true)
  const [inValues, setInValues] = useState(true)
  // Opt-in: put a large document in the textarea anyway, to edit it by hand.
  const [editLarge, setEditLarge] = useState(false)
  const fileInputRef = useRef(null)
  const editorRef = useRef(null)
  // How the input last changed. Pasting, uploading or loading jumps the editor
  // to the error; typing does not, because the error is usually at the caret.
  const changeKind = useRef('load')
  const pasted = useRef(false)
  const toast = useToast()
  const debouncedSearch = useDebounced(search, 180)
  const errorId = useId()

  const analysis = useJsonAnalysis(input, { sort: sortOn, mode: outputMode, indent })
  const { ok, value: shaped, error, bomRemoved, bigNumbers, duplicates, output: outputRaw, stats, busy } = analysis

  // The parser works on the text with any BOM removed; the editor still holds
  // it, so positions on line 1 are one character further along there.
  const shift = bomRemoved ? 1 : 0
  const editorErr = useMemo(
    () => (error ? { line: error.line, col: error.col + (error.line === 1 ? shift : 0), pos: error.pos + shift } : null),
    [error, shift]
  )

  const { bytes, lineCount } = useMemo(() => {
    if (!input.trim()) return { bytes: 0, lineCount: 0 }
    let lines = 1
    for (let k = input.indexOf('\n'); k !== -1; k = input.indexOf('\n', k + 1)) lines++
    return { bytes: new TextEncoder().encode(input).length, lineCount: lines }
  }, [input])

  const autoDepth = stats && stats.totalNodes > AUTO_COLLAPSE_NODES ? 1 : Infinity
  const rows = useMemo(() => {
    if (!ok || view !== 'tree') return []
    const isOpen = (path, depth) => {
      const base = tree.mode === 'all' ? true : tree.mode === 'none' ? depth === 0 : depth < autoDepth
      return base !== tree.toggled.has(path)
    }
    return buildRows(shaped, isOpen)
  }, [ok, view, shaped, tree, autoDepth])

  const searchResults = useMemo(() => {
    if (!debouncedSearch || !ok) return []
    return searchJsonValue(shaped, debouncedSearch, { matchCase, inKeys, inValues })
  }, [debouncedSearch, ok, shaped, matchCase, inKeys, inValues])

  // Jump to a new error after a paste, upload or sample load. Not while
  // typing: the error is then almost always right at the caret.
  useEffect(() => {
    if (!editorErr || changeKind.current === 'type') return
    editorRef.current?.reveal(editorErr.pos, editorErr.line)
  }, [editorErr])

  const toggleRow = (path) =>
    setTree((prev) => {
      const toggled = new Set(prev.toggled)
      if (toggled.has(path)) toggled.delete(path)
      else toggled.add(path)
      return { ...prev, toggled }
    })

  const expandAll = () => setTree({ mode: 'all', toggled: new Set() })
  const collapseAll = () => setTree({ mode: 'none', toggled: new Set() })

  function replaceInput(text) {
    changeKind.current = 'load'
    setEditLarge(false)
    setInput(text)
  }

  const largeView = input.length > LARGE_VIEW && !editLarge

  // Intercept a paste that would make the input large, so the browser never
  // lays the text out inside the textarea.
  function handlePaste(e) {
    const text = e.clipboardData?.getData('text')
    const ta = e.currentTarget
    if (text && input.length - (ta.selectionEnd - ta.selectionStart) + text.length > LARGE_VIEW) {
      e.preventDefault()
      replaceInput(input.slice(0, ta.selectionStart) + text + input.slice(ta.selectionEnd))
      return
    }
    pasted.current = true
  }

  function handleEditorChange(e) {
    changeKind.current = pasted.current ? 'paste' : 'type'
    pasted.current = false
    setInput(e.target.value)
  }

  function goToError() {
    if (editorErr) editorRef.current?.reveal(editorErr.pos, editorErr.line, { focus: true })
  }

  function loadSample() {
    replaceInput(SAMPLE)
  }

  function clearAll() {
    replaceInput('')
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
      replaceInput(String(reader.result ?? ''))
      toast(`Loaded ${file.name}`)
    }
    reader.onerror = () => toast('Could not read file', 'error')
    reader.readAsText(file)
    e.target.value = ''
  }

  const sizeLabel = bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`

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
              description={input.trim() ? `${sizeLabel} · ${plural(lineCount, 'line')}` : undefined}
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
              {largeView ? (
                <div>
                  <CodeViewer
                    code={input}
                    language="json"
                    maxHeight="560px"
                    animate={false}
                    handleRef={editorRef}
                    markLine={busy ? null : editorErr?.line}
                    markCol={busy ? null : editorErr?.col}
                    ariaLabel="JSON input (read-only preview of a large document)"
                  />
                  <div className="t-muted mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span>Large document — shown read-only so the page stays responsive.</span>
                    <button type="button" onClick={() => setEditLarge(true)} className="font-medium text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400">
                      Edit as text (may be slow)
                    </button>
                  </div>
                </div>
              ) : (
              <CodeEditor
                language="json"
                rows={24}
                value={input}
                onChange={handleEditorChange}
                onPaste={handlePaste}
                placeholder="Paste or type JSON here…"
                ariaLabel="JSON input"
                handleRef={editorRef}
                errorLine={busy ? null : editorErr?.line}
                errorCol={busy ? null : editorErr?.col}
                aria-invalid={error && !busy ? true : undefined}
                aria-describedby={error && !busy ? errorId : undefined}
                aria-errormessage={error && !busy ? errorId : undefined}
              />
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button onClick={handleFormat} type="button"><Wand2 className="h-3.5 w-3.5" />Format</Button>
                <Button variant="subtle" onClick={handleMinify} type="button"><Minimize2 className="h-3.5 w-3.5" />Minify</Button>
                <button
                  type="button"
                  onClick={() => setSortOn((v) => !v)}
                  aria-pressed={sortOn}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    sortOn ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'field hover-surface t-muted'
                  }`}
                  title="Sort object keys alphabetically in the output"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />Sort keys
                </button>
                <Select value={indent} onChange={(e) => setIndent(e.target.value)} className="w-auto" title="Indent size" aria-label="Indent size">
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                  <option value="tab">Tabs</option>
                </Select>
              </div>

              {/* Announced politely once parsing settles, not on every keystroke. */}
              <div className="mt-3 space-y-2" aria-live="polite">
                {busy ? (
                  <div className="bd sunken t-muted mono flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />Processing…
                  </div>
                ) : error ? (
                  <div id={errorId} className="mono rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="min-w-0">Invalid JSON — {error.message}</span>
                      <button
                        type="button"
                        onClick={goToError}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium underline-offset-2 hover:underline"
                      >
                        <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />Go to line {error.line}
                      </button>
                    </div>
                    {error.tip && <p className="mt-1 text-xs opacity-80">{error.tip}</p>}
                  </div>
                ) : ok ? (
                  <div className="mono flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />Valid JSON
                  </div>
                ) : null}

                {!busy && bomRemoved && (
                  <div className="bd sunken t-muted flex items-center gap-2 rounded-xl border px-3 py-2 text-xs">
                    <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    BOM removed — the input started with an invisible byte-order mark (U+FEFF), which is not valid JSON. It was ignored.
                  </div>
                )}

                {!busy && bigNumbers.length > 0 && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {plural(bigNumbers.length, 'number')} too large or precise for a JavaScript number
                    </div>
                    <p className="mt-1 text-xs opacity-90">
                      The original digits are kept in the output here, but JSON.parse and many other parsers will round {bigNumbers.length === 1 ? 'it' : 'them'} (IDs above 9007199254740991 are the usual culprit). Consider sending such IDs as strings.
                    </p>
                    <ul className="mono mt-1.5 space-y-0.5 text-xs opacity-90">
                      {bigNumbers.slice(0, 5).map((b, i) => (
                        <li key={i}>
                          <span className="tok-key">{b.label}</span> = {b.raw}
                        </li>
                      ))}
                      {bigNumbers.length > 5 && <li className="t-faint">…and {bigNumbers.length - 5} more</li>}
                    </ul>
                  </div>
                )}

                {!busy && duplicates.length > 0 && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {plural(duplicates.length, 'duplicate key')} — the last value silently wins
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
                busy
                  ? 'Processing…'
                  : stats
                    ? `${plural(stats.totalNodes, 'node')} · depth ${stats.maxDepth} · ${plural(stats.uniqueKeys, 'unique key')}`
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

              <div className={`mt-3 transition-opacity ${busy ? 'opacity-60' : ''}`} aria-busy={busy || undefined}>
                {view === 'code' ? (
                  <CodeViewer code={outputRaw} language="json" placeholder="Valid JSON will appear here, formatted." />
                ) : rows.length ? (
                  <>
                    <div className="mb-2 flex justify-end gap-2">
                      <Button variant="ghost" type="button" onClick={expandAll}><ChevronsDown className="h-3.5 w-3.5" />Expand all</Button>
                      <Button variant="ghost" type="button" onClick={collapseAll}><ChevronsUp className="h-3.5 w-3.5" />Collapse all</Button>
                    </div>
                    <VirtualTree rows={rows} onToggle={toggleRow} />
                  </>
                ) : (
                  <div className="bd sunken t-faint mono rounded-xl border border-dashed px-3 py-2.5 text-sm">
                    Valid JSON will appear here as a tree.
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

          {search && !ok && !busy && (
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
