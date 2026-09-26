import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightLeft, Trash2, Download, AlertTriangle, Shuffle } from 'lucide-react'
import { CONVERTERS, defaultsFor } from '../lib/converters'
import { handOff, takeHandoff } from '../lib/handoff'
import { hrefFor } from '../lib/nav'
import { downloadFile } from '../lib/files'
import { useDebounced } from '../lib/useDebounced'
import { useToast } from '../lib/toast'
import SplitPane from './SplitPane'
import CodeEditor from './CodeEditor'
import CodeViewer from './CodeViewer'
import { FileDrop, UploadButton } from './FileDrop'
import { Panel, Button, CopyButton, PageHeader, Tabs, Select, Checkbox } from './ui'

const ACCEPT = { JSON: '.json,application/json,text/plain', CSV: '.csv,.tsv,.txt,text/csv', YAML: '.yaml,.yml,text/plain', Properties: '.properties,.txt,text/plain' }

function Table({ table }) {
  const rows = table.rows.slice(0, 100)
  return (
    <div className="bd sunken max-h-[520px] overflow-auto rounded-xl border">
      <table className="mono w-full text-left text-xs">
        <thead className="surface sticky top-0">
          <tr>
            {table.headers.map((h) => (
              <th key={h} className="bd t-main border-b px-2.5 py-1.5 font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="bd border-b last:border-0">
              {table.headers.map((h) => (
                <td key={h} className="t-muted max-w-[16rem] truncate px-2.5 py-1.5">{r[h] === undefined || r[h] === null ? '' : String(r[h])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.rows.length > rows.length && <p className="t-faint px-2.5 py-1.5 text-xs">First 100 of {table.rows.length} rows shown; the CSV has them all.</p>}
    </div>
  )
}

/**
 * One converter page (JSON→CSV, CSV→JSON, JSON→YAML, YAML→JSON) driven by its
 * entry in src/lib/converters.js. Converts as you type; "Swap direction"
 * opens the reverse page with the current output as its input.
 */
export default function ConverterTool({ path }) {
  const cfg = CONVERTERS[path]
  const [input, setInput] = useState(cfg.sample)
  const [opts, setOpts] = useState(() => defaultsFor(cfg))
  const [view, setView] = useState('text')
  const editorRef = useRef(null)
  const debounced = useDebounced(input, 150)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    const v = takeHandoff(path)
    if (typeof v === 'string') setInput(v)
  }, [path])

  const result = useMemo(() => {
    if (!debounced.trim()) return { empty: true }
    try {
      return cfg.convert(debounced, opts)
    } catch (e) {
      return { error: e }
    }
  }, [cfg, debounced, opts])

  const set = (key, value) => setOpts((o) => ({ ...o, [key]: value }))
  async function loadFile(f) {
    setInput(await f.text())
    toast(`Loaded ${f.name}`)
  }
  function swap() {
    handOff(cfg.swap, result.text || input)
    navigate(hrefFor(cfg.swap))
  }

  const err = result.error
  const hasTable = Boolean(result.table)

  return (
    <div>
      <PageHeader icon={Shuffle} title={`${cfg.from} to ${cfg.to}`} subtitle={cfg.subtitle} accent="teal" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            {cfg.options.map((o) =>
              o.type === 'select' ? (
                <label key={o.key} className="t-muted flex items-center gap-2 text-sm">
                  {o.label}
                  <Select value={opts[o.key]} onChange={(e) => set(o.key, e.target.value)} className="w-auto">
                    {o.options.map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </Select>
                </label>
              ) : (
                <Checkbox key={o.key} checked={opts[o.key]} onChange={(e) => set(o.key, e.target.checked)} label={o.label} />
              )
            )}
            <Button variant="subtle" type="button" onClick={swap} className="ml-auto" title={`Open ${cfg.to} to ${cfg.from} with this result`}>
              <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />Swap direction
            </Button>
          </div>
        </Panel>

        <SplitPane
          storageKey="devpocket-split-convert"
          left={
            <Panel
              title={cfg.from}
              actions={
                <>
                  <UploadButton onFile={loadFile} accept={ACCEPT[cfg.from]} />
                  <Button variant="ghost" type="button" onClick={() => setInput(cfg.sample)}>Sample</Button>
                  <Button variant="ghost" type="button" onClick={() => setInput('')}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Clear
                  </Button>
                </>
              }
            >
              <FileDrop onFile={loadFile}>
                <CodeEditor
                  language={cfg.inputLanguage}
                  rows={18}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Paste ${cfg.from}, or drop a file…`}
                  ariaLabel={`${cfg.from} input`}
                  handleRef={editorRef}
                  errorLine={err?.line ?? null}
                  errorCol={err?.col ?? null}
                />
              </FileDrop>
              <div className="mt-3" aria-live="polite">
                {err && (
                  <div className="mono rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
                    {err.message}
                  </div>
                )}
              </div>
            </Panel>
          }
          right={
            <Panel
              title={cfg.to}
              description={result.summary}
              actions={
                <>
                  <CopyButton text={result.text || ''} onCopied={() => toast('Copied to clipboard')} />
                  <Button
                    variant="subtle"
                    type="button"
                    disabled={!result.text}
                    onClick={() => downloadFile(result.download ?? result.text, `converted.${cfg.ext}`, cfg.mime)}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />.{cfg.ext}
                  </Button>
                </>
              }
            >
              {hasTable && (
                <div className="mb-3">
                  <Tabs value={view} onChange={setView} options={[{ value: 'text', label: 'CSV' }, { value: 'table', label: 'Table' }]} />
                </div>
              )}
              {hasTable && view === 'table' ? (
                <Table table={result.table} />
              ) : (
                <CodeViewer
                  code={result.text || ''}
                  language={cfg.outputLanguage}
                  maxHeight="520px"
                  placeholder={err ? `Fix the ${cfg.from} on the left to see the ${cfg.to}.` : `${cfg.to} appears here as you type.`}
                  ariaLabel={`${cfg.to} output`}
                />
              )}
              {result.warnings?.length > 0 && (
                <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-400">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />Check before you ship this
                  </div>
                  <ul className="mt-1 space-y-0.5 text-xs">
                    {result.warnings.map((w, i) => (
                      <li key={i}>
                        {w.line ? <span className="mono">Line {w.line}: </span> : null}
                        {w.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>
          }
        />
      </div>
    </div>
  )
}
