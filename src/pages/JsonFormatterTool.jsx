import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Braces, Trash2, Download, ArrowUpDown, Loader2, CheckCircle2, ShieldCheck, Search as SearchIcon, Info } from 'lucide-react'
import { useJsonAnalysis } from '../lib/useJsonAnalysis'
import { stripJsonc } from '../lib/jsonlenient'
import { searchJsonValue } from '../lib/utils'
import { downloadFile, formatBytes } from '../lib/files'
import { handOff, takeHandoff } from '../lib/handoff'
import { hrefFor } from '../lib/nav'
import { plural } from '../lib/format'
import { useDebounced } from '../lib/useDebounced'
import { useToast } from '../lib/toast'
import SplitPane from '../components/SplitPane'
import CodeEditor from '../components/CodeEditor'
import CodeViewer from '../components/CodeViewer'
import { FileDrop, UploadButton } from '../components/FileDrop'
import { useJsonTree, JsonTreeView } from '../components/JsonTree'
import { Panel, Button, CopyButton, Input, PageHeader, Tabs, Select, Checkbox } from '../components/ui'

const SAMPLE = `{"id":1042,"customer":{"name":"Ada Lovelace","email":"ada@example.com"},"items":[{"sku":"KB-01","qty":1,"price":89.5},{"sku":"MS-07","qty":2,"price":24}],"paid":true,"coupon":null}`
const SAMPLE_JSONC = `{
  // tsconfig.json-style comments are fine in lenient mode
  "compilerOptions": {
    "target": "ES2022",
    "strict": true, /* trailing commas too */
  },
}`
const LARGE_VIEW = 300_000

/**
 * Output-first JSON formatter: paste or drop JSON and the formatted result is
 * the page's main pane — indent, minify, sort, tree and search act on it
 * directly. Lenient mode blanks comments and trailing commas before parsing.
 */
export default function JsonFormatterTool() {
  const [input, setInput] = useState(SAMPLE)
  const [indent, setIndent] = useState('2')
  const [minify, setMinify] = useState(false)
  const [sort, setSort] = useState(false)
  const [lenient, setLenient] = useState(false)
  const [view, setView] = useState('code')
  const [search, setSearch] = useState('')
  const [editLarge, setEditLarge] = useState(false)
  const editorRef = useRef(null)
  const navigate = useNavigate()
  const toast = useToast()
  const debouncedSearch = useDebounced(search, 180)

  useEffect(() => {
    const v = takeHandoff('/json-formatter')
    if (typeof v === 'string') setInput(v)
  }, [])

  const cleaned = useMemo(() => (lenient ? stripJsonc(input) : { text: input, comments: 0, trailingCommas: 0 }), [input, lenient])
  const analysis = useJsonAnalysis(cleaned.text, { sort, mode: minify ? 'minified' : 'pretty', indent })
  const { ok, value, error, output, stats, busy, bomRemoved } = analysis
  const tree = useJsonTree(value, { enabled: ok && view === 'tree', totalNodes: stats?.totalNodes })

  const results = useMemo(
    () => (ok && debouncedSearch ? searchJsonValue(value, debouncedSearch, { inKeys: true, inValues: true }) : []),
    [ok, value, debouncedSearch]
  )

  // Comments or trailing commas in strict mode: offer lenient mode rather
  // than just reporting the first one.
  const looksJsonc = !lenient && error && /\/\/|\/\*|,\s*[}\]]/.test(input)
  const largeView = input.length > LARGE_VIEW && !editLarge

  function replaceInput(text) {
    setEditLarge(false)
    setInput(text)
  }
  async function loadFile(f) {
    replaceInput(await f.text())
    toast(`Loaded ${f.name}`)
  }
  function openInValidator() {
    handOff('/json-validator', input)
    navigate(hrefFor('/json-validator'))
  }

  const outBytes = output ? new TextEncoder().encode(output).length : 0

  return (
    <div>
      <PageHeader icon={Braces} title="JSON Formatter" subtitle="Beautify, minify and sort JSON as you paste — with a tree view and search." accent="emerald" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={minify ? 'min' : 'pretty'} onChange={(v) => setMinify(v === 'min')} options={[{ value: 'pretty', label: 'Beautify' }, { value: 'min', label: 'Minify' }]} />
            <Select value={indent} onChange={(e) => setIndent(e.target.value)} className="w-auto" aria-label="Indent" disabled={minify}>
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tabs</option>
            </Select>
            <button
              type="button"
              onClick={() => setSort((v) => !v)}
              aria-pressed={sort}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                sort ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'field hover-surface t-muted'
              }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />Sort keys
            </button>
            <Checkbox checked={lenient} onChange={(e) => setLenient(e.target.checked)} label="Lenient (JSONC/JSON5): allow comments and trailing commas" />
          </div>
        </Panel>

        <SplitPane
          storageKey="devpocket-split-jsonformatter"
          initial={42}
          left={
            <Panel
              title="Input"
              description={input.trim() ? formatBytes(new TextEncoder().encode(input.slice(0, 2_000_000)).length) : undefined}
              actions={
                <>
                  <UploadButton onFile={loadFile} accept=".json,.jsonc,.json5,application/json,text/plain" />
                  <Button variant="ghost" type="button" onClick={() => replaceInput(lenient ? SAMPLE_JSONC : SAMPLE)}>Sample</Button>
                  <Button variant="ghost" type="button" onClick={() => replaceInput('')}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Clear
                  </Button>
                </>
              }
            >
              <FileDrop onFile={loadFile}>
                {largeView ? (
                  <div>
                    <CodeViewer code={input} language="json" maxHeight="520px" animate={false} handleRef={editorRef} markLine={busy ? null : error?.line} markCol={busy ? null : error?.col} ariaLabel="JSON input (read-only preview of a large document)" />
                    <button type="button" onClick={() => setEditLarge(true)} className="t-muted mt-2 text-xs underline-offset-2 hover:underline">
                      Large document shown read-only — edit as text (may be slow)
                    </button>
                  </div>
                ) : (
                  <CodeEditor
                    language="json"
                    rows={20}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste JSON, or drop a .json file…"
                    ariaLabel="JSON input"
                    handleRef={editorRef}
                    errorLine={busy ? null : error?.line}
                    errorCol={busy ? null : error?.col}
                  />
                )}
              </FileDrop>
              <div className="mt-3 space-y-2" aria-live="polite">
                {busy ? (
                  <div className="bd sunken t-muted flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Formatting…
                  </div>
                ) : error ? (
                  <div className="mono rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
                    <div>Line {error.line}, column {error.col}: {error.reason || error.message}</div>
                    {error.tip && <p className="mt-1 text-xs opacity-80">{error.tip}</p>}
                    <div className="mt-1.5 flex flex-wrap gap-2 font-sans text-xs">
                      <button type="button" className="font-medium underline-offset-2 hover:underline" onClick={() => editorRef.current?.reveal(error.pos, error.line, { focus: true })}>
                        Go to line {error.line}
                      </button>
                      {looksJsonc && (
                        <button type="button" className="font-medium underline-offset-2 hover:underline" onClick={() => setLenient(true)}>
                          Turn on lenient mode (comments / trailing commas)
                        </button>
                      )}
                      <button type="button" className="font-medium underline-offset-2 hover:underline" onClick={openInValidator}>
                        Check it in the JSON Validator
                      </button>
                    </div>
                  </div>
                ) : ok ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Valid JSON{stats ? ` · ${plural(stats.totalNodes, 'node')}, depth ${stats.maxDepth}` : ''}
                  </div>
                ) : null}
                {lenient && (cleaned.comments > 0 || cleaned.trailingCommas > 0) && (
                  <div className="bd sunken t-muted flex items-center gap-2 rounded-xl border px-3 py-2 text-xs">
                    <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Removed {plural(cleaned.comments, 'comment')} and {plural(cleaned.trailingCommas, 'trailing comma')} — the output is strict JSON.
                  </div>
                )}
                {bomRemoved && !busy && <p className="t-faint text-xs">A byte-order mark (U+FEFF) at the start was ignored.</p>}
              </div>
            </Panel>
          }
          right={
            <Panel
              title="Formatted"
              description={output ? `${formatBytes(outBytes)} · ${minify ? 'minified' : indent === 'tab' ? 'tab indent' : `${indent}-space indent`}` : undefined}
              actions={
                <>
                  <CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />
                  <Button variant="subtle" type="button" disabled={!output} onClick={() => (downloadFile(output, minify ? 'data.min.json' : 'data.json', 'application/json'), toast('Downloaded'))}>
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />Download
                  </Button>
                </>
              }
            >
              <Tabs value={view} onChange={setView} options={[{ value: 'code', label: 'Code' }, { value: 'tree', label: 'Tree' }]} />
              <div className={`mt-3 transition-opacity ${busy ? 'opacity-60' : ''}`}>
                {view === 'code' ? (
                  <CodeViewer code={output} language="json" maxHeight="560px" placeholder="Formatted JSON appears here as soon as the input parses." ariaLabel="Formatted JSON" />
                ) : (
                  <JsonTreeView tree={tree} height={520} />
                )}
              </div>
              <div className="relative mt-4">
                <SearchIcon className="t-faint pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
                <Input className="pl-9" placeholder="Search keys and values…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search keys and values" />
              </div>
              {search && ok && (
                <div className="mt-2">
                  <div className="t-muted mb-1.5 text-xs">{plural(results.length, 'match', 'matches')}</div>
                  <div className="max-h-56 space-y-1 overflow-auto">
                    {results.slice(0, 200).map((r, i) => (
                      <div key={i} className="bd sunken mono flex items-center justify-between gap-3 rounded-lg border px-3 py-1.5 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="tok-key truncate">{r.path || '(root)'}</div>
                          <div className="t-muted truncate">{String(r.value)}</div>
                        </div>
                        <CopyButton text={r.path} label="" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="t-faint mt-4 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Need duplicate-key and big-number checks? The JSON Validator reports them.
              </p>
            </Panel>
          }
        />
      </div>
    </div>
  )
}
