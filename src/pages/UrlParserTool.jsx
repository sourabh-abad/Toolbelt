import { useMemo, useState } from 'react'
import { Link2, Trash2, Plus, X, AlertTriangle } from 'lucide-react'
import { parseUrl, withParams, paramsToJson } from '../lib/urlparse'
import { useToast } from '../lib/toast'
import SplitPane from '../components/SplitPane'
import CodeViewer from '../components/CodeViewer'
import { Panel, Button, CopyButton, Input, ErrorBanner, PageHeader, StatRow } from '../components/ui'
import { plural } from '../lib/format'

const SAMPLE =
  'https://api.example.com:8443/v2/orders/%E2%82%AC-refunds?status=open&tag=vip&tag=eu&q=caf%C3%A9+latte&page=2#results'

/**
 * Parses with the browser's own URL implementation, then lets you edit the
 * query parameters as rows and rebuilds the URL from them.
 */
export default function UrlParserTool() {
  const [input, setInput] = useState(SAMPLE)
  // Edited rows, or null while they simply mirror the parsed URL.
  const [edited, setEdited] = useState(null)
  const toast = useToast()

  const { parsed, error } = useMemo(() => {
    try {
      return { parsed: parseUrl(input), error: '' }
    } catch (e) {
      return { parsed: null, error: e.message }
    }
  }, [input])

  const rows = useMemo(() => edited ?? parsed?.params ?? [], [edited, parsed])
  const rebuilt = useMemo(() => {
    if (!parsed) return ''
    try {
      return withParams(parsed.href, rows)
    } catch {
      return parsed.href
    }
  }, [parsed, rows])
  const json = useMemo(() => JSON.stringify(paramsToJson(rows), null, 2), [rows])

  const setInputAndReset = (v) => {
    setInput(v)
    setEdited(null)
  }
  const updateRow = (i, patch) => setEdited(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const removeRow = (i) => setEdited(rows.filter((_, j) => j !== i))
  const addRow = () => setEdited([...rows, { key: '', value: '' }])

  return (
    <div>
      <PageHeader
        icon={Link2}
        title="URL Parser"
        subtitle="Split a URL into its parts, decode the query string and edit parameters."
        accent="sky"
      />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel
          title="URL"
          actions={
            <>
              <Button variant="ghost" type="button" onClick={() => setInputAndReset(SAMPLE)}>Sample</Button>
              <Button variant="ghost" type="button" onClick={() => setInputAndReset('')}>
                <Trash2 className="h-3.5 w-3.5" />Clear
              </Button>
            </>
          }
        >
          <Input
            value={input}
            onChange={(e) => setInputAndReset(e.target.value)}
            placeholder="https://example.com/path?key=value#fragment"
            aria-label="URL to parse"
          />
          {error && input.trim() && <div className="mt-3"><ErrorBanner>{error}</ErrorBanner></div>}
          {parsed?.assumedScheme && (
            <p className="t-muted mt-2 text-xs">No scheme given, so it was read as https://.</p>
          )}
          {parsed?.warnings.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {parsed.warnings.map((w) => (
                <li key={w} className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {w}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <SplitPane
          storageKey="devpocket-split-urlparser"
          left={
            <Panel title="Parts" description={parsed ? parsed.href : undefined}>
              {parsed ? (
                <div className="space-y-1.5">
                  {parsed.parts.map(([label, value]) => (
                    <StatRow key={label} label={label} value={value || '—'} />
                  ))}
                  {parsed.pathSegments.length > 0 && (
                    <div className="pt-2">
                      <h3 className="t-muted mb-1.5 text-xs font-semibold">Path segments (decoded)</h3>
                      <ol className="mono space-y-1 text-sm">
                        {parsed.pathSegments.map((seg, i) => (
                          <li key={i} className="bd sunken rounded-lg border px-3 py-1.5">
                            <span className="t-faint mr-2">{i + 1}</span>
                            <span className="t-main break-all">{seg}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ) : (
                <p className="t-faint text-sm">Paste a URL above to see its parts.</p>
              )}
            </Panel>
          }
          right={
            <Panel
              title="Query parameters"
              description={parsed ? `${plural(rows.length, 'parameter')} · values shown decoded` : undefined}
              actions={
                <Button variant="ghost" type="button" onClick={addRow} disabled={!parsed}>
                  <Plus className="h-3.5 w-3.5" />Add
                </Button>
              }
            >
              {rows.length > 0 ? (
                <div className="space-y-2">
                  {rows.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={r.key}
                        onChange={(e) => updateRow(i, { key: e.target.value })}
                        aria-label={`Parameter ${i + 1} name`}
                        className={`w-2/5 ${r.repeated ? 'border-amber-500/50' : ''}`}
                        title={r.repeated ? 'This key appears more than once' : undefined}
                      />
                      <Input value={r.value} onChange={(e) => updateRow(i, { value: e.target.value })} aria-label={`Parameter ${i + 1} value`} />
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        aria-label={`Remove parameter ${r.key || i + 1}`}
                        className="hover-surface t-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="t-faint text-sm">{parsed ? 'This URL has no query string. Add a parameter to build one.' : 'No URL yet.'}</p>
              )}

              {parsed && (
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <h3 className="t-muted text-xs font-semibold">Rebuilt URL</h3>
                      <CopyButton text={rebuilt} onCopied={() => toast('URL copied')} />
                    </div>
                    <CodeViewer code={rebuilt} language="none" lineNumbers={false} indentGuides={false} maxHeight="160px" animate={false} />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <h3 className="t-muted text-xs font-semibold">Query as JSON</h3>
                      <CopyButton text={json} onCopied={() => toast('JSON copied')} />
                    </div>
                    <CodeViewer code={json} language="json" maxHeight="220px" animate={false} />
                  </div>
                </div>
              )}
            </Panel>
          }
        />
      </div>
    </div>
  )
}
