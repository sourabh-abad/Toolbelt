import { useMemo, useState } from 'react'
import { AlignLeft, Wand2, Eraser, Minimize2, Trash2, ArrowUp, AlertTriangle } from 'lucide-react'
import { useToast } from '../lib/toast'
import { useDebounced } from '../lib/useDebounced'
import { format, toFlow, stripComments, tidy, validate, stats, findIndentTabs } from '../lib/yamlops'
import SplitPane from '../components/SplitPane'
import { Panel, Button, CopyButton, TextArea, ErrorBanner, PageHeader, Select, Checkbox } from '../components/ui'
import CodeViewer from '../components/CodeViewer'

const SAMPLE = `# deployment for the shop API
# owner: platform team
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop-api          # keep in sync with the Service
  labels: &labels
    app: shop
    tier: backend
spec:
  replicas: 3   # bumped for the sale
  selector:
    matchLabels: *labels
  template:
    metadata:
      labels: *labels
    spec:
      containers:
        - name: api
          image: "ghcr.io/acme/shop:1.4"
          ports:
            - containerPort: 8080
          env:
            - name: NODE_ENV
              value: production
          # readiness gates the rolling update
          readinessProbe:
            httpGet: { path: /healthz, port: 8080 }
          command: |
            # this hash is part of the script, not a comment
            exec node server.js --port 8080
`

const LINE_WIDTHS = [
  { value: '80', label: '80 columns' },
  { value: '120', label: '120 columns' },
  { value: '-1', label: 'Never wrap' },
]

const QUOTE_STYLES = [
  { value: "'", label: "Single ' when needed" },
  { value: '"', label: 'Double " when needed' },
]

export default function YamlTool() {
  const [input, setInput] = useState(SAMPLE)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [indent, setIndent] = useState('2')
  const [lineWidth, setLineWidth] = useState('80')
  const [quotingType, setQuotingType] = useState("'")
  const [sortKeys, setSortKeys] = useState(false)
  const [expandAnchors, setExpandAnchors] = useState(false)
  const [indentSequences, setIndentSequences] = useState(true)
  const toast = useToast()

  // Validation follows the typing rather than racing it.
  const debounced = useDebounced(input, 200)
  const check = useMemo(() => validate(debounced), [debounced])
  const summary = useMemo(() => (check.ok && !check.empty ? stats(debounced) : null), [check, debounced])
  const tabLines = useMemo(() => findIndentTabs(debounced), [debounced])

  const dumpOptions = () => ({
    indent: Number(indent),
    lineWidth: Number(lineWidth),
    quotingType,
    sortKeys,
    noRefs: expandAnchors,
    noArrayIndent: !indentSequences,
  })

  /** Every button ends the same way: set the output, or show why it could not run. */
  function run(label, fn) {
    if (!input.trim()) {
      setOutput('')
      setError('Nothing to work on — paste some YAML first.')
      return
    }
    try {
      const { text, message } = fn()
      setOutput(text)
      setError('')
      setNote(message || '')
      toast(label)
    } catch (e) {
      setOutput('')
      setNote('')
      const at = e.mark ? `Line ${e.mark.line + 1}, column ${e.mark.column + 1} — ` : ''
      setError(at + (e.reason || e.message))
      toast('That is not valid YAML', 'error')
    }
  }

  const doFormat = () =>
    run('Formatted', () => {
      const text = format(input, dumpOptions())
      const dropped = stats(input)?.comments ?? 0
      return {
        text,
        message: dropped
          ? `Reparsed and re-emitted — ${dropped} comment${dropped === 1 ? '' : 's'} dropped, because the parser does not keep them. Use Tidy to keep them.`
          : '',
      }
    })

  const doFlow = () => run('Collapsed to flow style', () => ({ text: toFlow(input, dumpOptions()) }))

  const doStrip = () =>
    run('Comments removed', () => {
      const { text, removed } = stripComments(input)
      return {
        text,
        message: removed
          ? `${removed} comment${removed === 1 ? '' : 's'} removed. Everything else is untouched, including block scalars.`
          : 'No comments found.',
      }
    })

  const doTidy = () =>
    run('Tidied', () => {
      const { text, tabsFixed, trailingFixed } = tidy(input, { indent: Number(indent) })
      const bits = []
      if (tabsFixed) bits.push(`${tabsFixed} tab-indented line${tabsFixed === 1 ? '' : 's'} fixed`)
      if (trailingFixed) bits.push(`${trailingFixed} line${trailingFixed === 1 ? '' : 's'} of trailing space trimmed`)
      return { text, message: bits.length ? `${bits.join(', ')}. Comments kept.` : 'Already tidy. Comments kept.' }
    })

  function useOutputAsInput() {
    if (!output) return
    setInput(output)
    setOutput('')
    setNote('')
    toast('Output moved to the input')
  }

  return (
    <div>
      <PageHeader
        icon={AlignLeft}
        title="YAML Formatter"
        subtitle="Format, tidy, strip comments and validate — with the line and column of any error."
        accent="violet"
      />

      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={doFormat} type="button" title="Reparse and re-emit with these options">
              <Wand2 className="h-3.5 w-3.5" />
              Format
            </Button>
            <Button variant="subtle" onClick={doTidy} type="button" title="Whitespace only — comments survive">
              <Eraser className="h-3.5 w-3.5" />
              Tidy (keep comments)
            </Button>
            <Button variant="subtle" onClick={doStrip} type="button" title="Strip every # comment, leave the rest alone">
              <Eraser className="h-3.5 w-3.5" />
              Remove comments
            </Button>
            <Button variant="subtle" onClick={doFlow} type="button" title="Collapse to inline flow style">
              <Minimize2 className="h-3.5 w-3.5" />
              One line
            </Button>
            <Button variant="ghost" onClick={() => setInput(SAMPLE)} type="button">
              Sample
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setInput('')
                setOutput('')
                setError('')
                setNote('')
              }}
              type="button"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>

          <div className="bd mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3">
            <div className="flex items-center gap-2">
              <label className="t-muted text-xs">Indent</label>
              <Select value={indent} onChange={(e) => setIndent(e.target.value)}>
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="t-muted text-xs">Wrap</label>
              <Select value={lineWidth} onChange={(e) => setLineWidth(e.target.value)}>
                {LINE_WIDTHS.map((w) => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="t-muted text-xs">Quotes</label>
              <Select value={quotingType} onChange={(e) => setQuotingType(e.target.value)}>
                {QUOTE_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>
            <Checkbox checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} label="Sort keys" />
            <Checkbox
              checked={indentSequences}
              onChange={(e) => setIndentSequences(e.target.checked)}
              label="Indent lists"
            />
            <Checkbox
              checked={expandAnchors}
              onChange={(e) => setExpandAnchors(e.target.checked)}
              label="Expand anchors"
            />
            <span className="t-faint text-xs">These apply to Format and One line.</span>
          </div>
        </Panel>

        <SplitPane
          storageKey="devpocket-split-yaml"
          left={
            <Panel title="YAML" description={check.empty ? undefined : statusLine(check, summary)}>
              <TextArea
                rows={20}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste YAML here…"
              />

              {tabLines.length > 0 && (
                <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    Tabs used for indentation on line{tabLines.length === 1 ? '' : 's'}{' '}
                    {tabLines.slice(0, 6).join(', ')}
                    {tabLines.length > 6 ? ` and ${tabLines.length - 6} more` : ''} — YAML does not allow that. Tidy
                    converts them.
                  </span>
                </p>
              )}

              {!check.ok && (
                <p className="mono mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-300">
                  {check.line ? `Line ${check.line}, column ${check.column} — ` : ''}
                  {check.message}
                </p>
              )}

              <div className="mt-3">
                <ErrorBanner>{error}</ErrorBanner>
              </div>
            </Panel>
          }
          right={
            <Panel
              title="Result"
              actions={
                <>
                  <Button variant="ghost" onClick={useOutputAsInput} type="button" disabled={!output} title="Move the result back into the editor">
                    <ArrowUp className="h-3.5 w-3.5" />
                    Use as input
                  </Button>
                  <CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />
                </>
              }
            >
              <CodeViewer code={output} language="yaml" placeholder="Pick an action above — the result appears here…" />
              {note && <p className="t-muted mt-3 text-xs leading-relaxed">{note}</p>}
            </Panel>
          }
        />
      </div>
    </div>
  )
}

/** The one-line read on the document, shown under the editor heading. */
function statusLine(check, summary) {
  if (!check.ok) return 'Invalid YAML'
  if (!summary) return 'Valid YAML'
  const bits = [
    summary.documents === 1 ? '1 document' : `${summary.documents} documents`,
    `${summary.keys} keys`,
    `depth ${summary.depth}`,
  ]
  if (summary.comments) bits.push(`${summary.comments} comment${summary.comments === 1 ? '' : 's'}`)
  if (summary.anchors) bits.push(`${summary.anchors} anchor${summary.anchors === 1 ? '' : 's'}`)
  if (summary.aliases) bits.push(`${summary.aliases} alias${summary.aliases === 1 ? '' : 'es'}`)
  return `Valid · ${bits.join(' · ')}`
}
