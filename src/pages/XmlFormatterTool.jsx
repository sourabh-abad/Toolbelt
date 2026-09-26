import { useMemo, useRef, useState } from 'react'
import { FileCode2, Trash2, Download, CheckCircle2, ChevronRight, ChevronsDown, ChevronsUp, Search as SearchIcon, Play } from 'lucide-react'
import { parseXml, serialize, stats as xmlStats, searchAttributes } from '../lib/xmlops'
import { downloadFile, formatBytes } from '../lib/files'
import { plural } from '../lib/format'
import { useDebounced } from '../lib/useDebounced'
import { useToast } from '../lib/toast'
import SplitPane from '../components/SplitPane'
import CodeEditor from '../components/CodeEditor'
import CodeViewer from '../components/CodeViewer'
import { FileDrop, UploadButton } from '../components/FileDrop'
import { Panel, Button, CopyButton, Input, PageHeader, Tabs, Select, Checkbox } from '../components/ui'

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<catalog xmlns:dc="http://purl.org/dc/elements/1.1/"><book id="bk101" lang="en"><dc:title>XML Developer's Guide</dc:title><author>Gambardella, Matthew</author><price currency="USD">44.95</price><tags><tag>xml</tag><tag>reference</tag></tags></book><book id="bk102" lang="de"><dc:title>Midnight Rain</dc:title><author>Ralls, Kim</author><price currency="EUR">5.95</price><!-- out of print --><tags/></book></catalog>`

const ROW = 24
const OVERSCAN = 12

// Visible rows of the element tree; closed elements are not descended into.
function treeRows(doc, isOpen) {
  const rows = []
  const walk = (node, depth, path) => {
    if (node.type !== 'element') return
    const kids = node.children.filter((c) => c.type === 'element')
    const text = node.children
      .filter((c) => c.type === 'text' || c.type === 'cdata')
      .map((c) => c.value.trim())
      .join(' ')
      .trim()
    const open = kids.length > 0 && isOpen(path, depth)
    rows.push({ path, depth, name: node.name, attrs: node.attrs, text, childCount: kids.length, open })
    if (open) kids.forEach((k, i) => walk(k, depth + 1, `${path}/${i}`))
  }
  doc.children.forEach((c, i) => walk(c, 0, String(i)))
  return rows
}

function XmlTree({ rows, onToggle, height = 440 }) {
  const [top, setTop] = useState(0)
  const first = Math.max(0, Math.floor(top / ROW) - OVERSCAN)
  const slice = rows.slice(first, first + Math.ceil(height / ROW) + OVERSCAN * 2)
  return (
    <div className="bd sunken overflow-auto rounded-xl border" style={{ height }} onScroll={(e) => setTop(e.currentTarget.scrollTop)}>
      <div style={{ height: rows.length * ROW, position: 'relative' }}>
        <div style={{ position: 'absolute', top: first * ROW, left: 0, right: 0 }}>
          {slice.map((r) => {
            const label = (
              <>
                <span className="t-faint mono text-sm">&lt;<span className="tok-key">{r.name}</span></span>
                {r.attrs.slice(0, 4).map((a) => (
                  <span key={a.name} className="mono text-xs">
                    <span className="tok-attr"> {a.name}</span>=<span className="tok-str">"{a.value}"</span>
                  </span>
                ))}
                {r.attrs.length > 4 && <span className="t-faint mono text-xs"> +{r.attrs.length - 4}</span>}
                <span className="t-faint mono text-sm">&gt;</span>
                {r.text && <span className="t-muted mono ml-1 truncate text-sm">{r.text}</span>}
                {r.childCount > 0 && <span className="t-faint mono ml-1 text-xs">({r.childCount})</span>}
              </>
            )
            return r.childCount ? (
              <button
                key={r.path}
                type="button"
                onClick={() => onToggle(r.path)}
                aria-expanded={r.open}
                className="code-row flex w-full items-center gap-1 overflow-hidden text-left whitespace-nowrap"
                style={{ height: ROW, paddingLeft: r.depth * 16 + 6 }}
              >
                <ChevronRight className={`t-faint h-3.5 w-3.5 shrink-0 transition-transform ${r.open ? 'rotate-90' : ''}`} aria-hidden="true" />
                {label}
              </button>
            ) : (
              <div key={r.path} className="code-row flex items-center gap-1 overflow-hidden whitespace-nowrap" style={{ height: ROW, paddingLeft: r.depth * 16 + 24 }}>
                {label}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// XPath runs on the browser's own XML DOM. Prefixes declared anywhere in the
// document resolve, and a default namespace is reachable as "d:".
function runXPath(text, expr) {
  const dom = new DOMParser().parseFromString(text, 'application/xml')
  if (dom.getElementsByTagName('parsererror').length) throw new Error('The browser could not parse this XML for XPath')
  const ns = {}
  for (const el of dom.getElementsByTagName('*')) {
    for (const a of el.attributes) {
      if (a.name === 'xmlns') ns.d ??= a.value
      else if (a.name.startsWith('xmlns:')) ns[a.name.slice(6)] ??= a.value
    }
  }
  const res = dom.evaluate(expr, dom, (p) => ns[p] || null, XPathResult.ANY_TYPE, null)
  switch (res.resultType) {
    case XPathResult.NUMBER_TYPE:
      return { kind: 'Number', items: [String(res.numberValue)] }
    case XPathResult.STRING_TYPE:
      return { kind: 'String', items: [res.stringValue] }
    case XPathResult.BOOLEAN_TYPE:
      return { kind: 'Boolean', items: [String(res.booleanValue)] }
    default: {
      const items = []
      const ser = new XMLSerializer()
      for (let n = res.iterateNext(); n && items.length < 500; n = res.iterateNext()) {
        items.push(n.nodeType === 1 ? ser.serializeToString(n) : n.nodeType === 2 ? `${n.name}="${n.value}"` : n.nodeValue)
      }
      return { kind: 'Nodes', items }
    }
  }
}

export default function XmlFormatterTool() {
  const [input, setInput] = useState(SAMPLE)
  const [indent, setIndent] = useState('2')
  const [minify, setMinify] = useState(false)
  const [view, setView] = useState('code')
  const [treeState, setTreeState] = useState({ mode: 'auto', toggled: new Set() })
  const [attrTerm, setAttrTerm] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [xpath, setXpath] = useState('//book[price > 10]/@id')
  const [xpathResult, setXpathResult] = useState(null)
  const editorRef = useRef(null)
  const toast = useToast()
  const debounced = useDebounced(input, 150)
  const debouncedTerm = useDebounced(attrTerm, 150)

  const parsed = useMemo(() => {
    if (!debounced.trim()) return { empty: true }
    try {
      return { doc: parseXml(debounced) }
    } catch (e) {
      return { error: e }
    }
  }, [debounced])

  const output = useMemo(
    () => (parsed.doc ? serialize(parsed.doc, { indent: indent === 'tab' ? '\t' : ' '.repeat(Number(indent)), minify }) : ''),
    [parsed, indent, minify]
  )
  const info = useMemo(() => (parsed.doc ? xmlStats(parsed.doc) : null), [parsed])
  const rows = useMemo(() => {
    if (!parsed.doc || view !== 'tree') return []
    const auto = info && info.elements > 3000 ? 1 : Infinity
    return treeRows(parsed.doc, (path, depth) => {
      const base = treeState.mode === 'all' ? true : treeState.mode === 'none' ? depth === 0 : depth < auto
      return base !== treeState.toggled.has(path)
    })
  }, [parsed, view, treeState, info])
  const attrHits = useMemo(() => (parsed.doc && debouncedTerm ? searchAttributes(parsed.doc, debouncedTerm, { matchCase }) : []), [parsed, debouncedTerm, matchCase])

  const toggle = (path) =>
    setTreeState((s) => {
      const toggled = new Set(s.toggled)
      if (toggled.has(path)) toggled.delete(path)
      else toggled.add(path)
      return { ...s, toggled }
    })

  function evaluate(e) {
    e?.preventDefault()
    if (!xpath.trim() || !parsed.doc) return
    try {
      setXpathResult(runXPath(debounced, xpath))
    } catch (err) {
      setXpathResult({ error: err.message.replace(/^.*?:\s*/, '') || 'Invalid XPath expression' })
    }
  }

  async function loadFile(f) {
    setInput(await f.text())
    toast(`Loaded ${f.name}`)
  }

  const err = parsed.error

  return (
    <div>
      <PageHeader icon={FileCode2} title="XML Formatter" subtitle="Pretty-print, minify and check XML, with a collapsible tree and XPath." accent="orange" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={minify ? 'min' : 'pretty'} onChange={(v) => setMinify(v === 'min')} options={[{ value: 'pretty', label: 'Pretty-print' }, { value: 'min', label: 'Minify' }]} />
            <Select value={indent} onChange={(e) => setIndent(e.target.value)} className="w-auto" aria-label="Indent" disabled={minify}>
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tabs</option>
            </Select>
            <span className="t-muted text-xs">Minify also drops comments and whitespace between tags.</span>
          </div>
        </Panel>

        <SplitPane
          storageKey="devpocket-split-xmlformatter"
          left={
            <Panel
              title="XML"
              description={input.trim() ? formatBytes(new TextEncoder().encode(input).length) : undefined}
              actions={
                <>
                  <UploadButton onFile={loadFile} accept=".xml,.xsd,.xsl,.svg,.plist,.config,text/xml,application/xml" />
                  <Button variant="ghost" type="button" onClick={() => setInput(SAMPLE)}>Sample</Button>
                  <Button variant="ghost" type="button" onClick={() => setInput('')}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Clear
                  </Button>
                </>
              }
            >
              <FileDrop onFile={loadFile}>
                <CodeEditor
                  language="xml"
                  rows={18}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste XML, or drop a file…"
                  ariaLabel="XML input"
                  handleRef={editorRef}
                  errorLine={err?.line ?? null}
                  errorCol={err?.col ?? null}
                />
              </FileDrop>
              <div className="mt-3" aria-live="polite">
                {err ? (
                  <div className="mono rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
                    <div>{err.message}</div>
                    <button type="button" className="mt-1 font-sans text-xs font-medium underline-offset-2 hover:underline" onClick={() => editorRef.current?.reveal(err.pos, err.line, { focus: true })}>
                      Go to line {err.line}
                    </button>
                  </div>
                ) : info ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Well-formed · {plural(info.elements, 'element')}, {plural(info.attributes, 'attribute')}, depth {info.depth}
                  </div>
                ) : null}
              </div>
            </Panel>
          }
          right={
            <Panel
              title="Formatted"
              actions={
                <>
                  <CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />
                  <Button variant="subtle" type="button" disabled={!output} onClick={() => downloadFile(output, minify ? 'document.min.xml' : 'document.xml', 'application/xml')}>
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />Download
                  </Button>
                </>
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Tabs value={view} onChange={setView} options={[{ value: 'code', label: 'Code' }, { value: 'tree', label: 'Tree' }]} />
                {view === 'tree' && rows.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="ghost" type="button" onClick={() => setTreeState({ mode: 'all', toggled: new Set() })}><ChevronsDown className="h-3.5 w-3.5" />Expand all</Button>
                    <Button variant="ghost" type="button" onClick={() => setTreeState({ mode: 'none', toggled: new Set() })}><ChevronsUp className="h-3.5 w-3.5" />Collapse all</Button>
                  </div>
                )}
              </div>
              <div className="mt-3">
                {view === 'code' ? (
                  <CodeViewer code={output} language="xml" maxHeight="520px" placeholder="Formatted XML appears here once the input is well-formed." ariaLabel="Formatted XML" />
                ) : rows.length ? (
                  <XmlTree rows={rows} onToggle={toggle} />
                ) : (
                  <div className="bd sunken t-faint rounded-xl border border-dashed px-3 py-2.5 text-sm">Well-formed XML appears here as a tree.</div>
                )}
              </div>
            </Panel>
          }
        />

        <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
          <Panel title="XPath" description="Runs in your browser's XML engine (XPath 1.0). A default namespace is available as the prefix d:">
            <form onSubmit={evaluate} className="flex gap-2">
              <Input className="mono flex-1" value={xpath} onChange={(e) => setXpath(e.target.value)} placeholder="//book[@lang='en']/dc:title" aria-label="XPath expression" />
              <Button type="submit" disabled={!parsed.doc}><Play className="h-3.5 w-3.5" aria-hidden="true" />Run</Button>
            </form>
            {xpathResult && (
              <div className="mt-3" aria-live="polite">
                {xpathResult.error ? (
                  <p className="text-sm text-rose-600 dark:text-rose-300">{xpathResult.error}</p>
                ) : (
                  <>
                    <div className="t-muted mb-1.5 text-xs">{xpathResult.kind === 'Nodes' ? plural(xpathResult.items.length, 'node') : xpathResult.kind}</div>
                    <div className="max-h-64 space-y-1 overflow-auto">
                      {xpathResult.items.map((it, i) => (
                        <pre key={i} className="bd sunken mono overflow-x-auto rounded-lg border px-3 py-1.5 text-xs whitespace-pre-wrap">{it}</pre>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </Panel>

          <Panel title="Attribute search" description="Find attributes by name or value, with the element path to each.">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <SearchIcon className="t-faint pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
                <Input className="pl-9" value={attrTerm} onChange={(e) => setAttrTerm(e.target.value)} placeholder="id, currency, USD…" aria-label="Search attributes" />
              </div>
              <Checkbox checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} label="Match case" />
            </div>
            {debouncedTerm && parsed.doc && (
              <div className="mt-3">
                <div className="t-muted mb-1.5 text-xs">{plural(attrHits.length, 'match', 'matches')}</div>
                <div className="max-h-64 space-y-1 overflow-auto">
                  {attrHits.slice(0, 300).map((h, i) => (
                    <div key={i} className="bd sunken mono rounded-lg border px-3 py-1.5 text-xs">
                      <div className="t-muted truncate">{h.path} · line {h.line}</div>
                      <div><span className="tok-attr">{h.name}</span>=<span className="tok-str">"{h.value}"</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
