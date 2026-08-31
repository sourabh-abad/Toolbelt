import { useMemo, useState } from 'react'
import { Braces, Wand2, Minimize2, CheckCircle2, Trash2, Search as SearchIcon } from 'lucide-react'
import {
  syntaxHighlightJson,
  syntaxHighlightXml,
  formatXml,
  parseXmlOrThrow,
  jsonParseErrorLocation,
  searchJsonValue,
  searchXmlDoc,
} from '../lib/utils'
import { useToast } from '../lib/toast'
import SplitPane from '../components/SplitPane'
import { Panel, Button, CopyButton, TextArea, Input, ErrorBanner, OutputBlock, PageHeader, Checkbox, Tabs } from '../components/ui'

const SAMPLE_JSON = `{
  "id": 42,
  "name": "Ada Lovelace",
  "active": true,
  "roles": ["admin", "editor"],
  "address": { "city": "London", "zip": null }
}`

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<user id="42">
  <name>Ada Lovelace</name>
  <active>true</active>
  <roles><role>admin</role><role>editor</role></roles>
  <address><city>London</city><zip/></address>
</user>`

export default function JsonXmlTool() {
  const [mode, setMode] = useState('json')
  const [input, setInput] = useState(SAMPLE_JSON)
  const [error, setError] = useState('')
  const [output, setOutput] = useState('')
  const [outputRaw, setOutputRaw] = useState('')
  const [search, setSearch] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [inKeys, setInKeys] = useState(true)
  const [inValues, setInValues] = useState(true)
  const toast = useToast()

  const parsedForSearch = useMemo(() => {
    setError('')
    try {
      if (mode === 'json') {
        return { ok: true, data: JSON.parse(input) }
      }
      return { ok: true, data: parseXmlOrThrow(input) }
    } catch (e) {
      return { ok: false, err: e.message }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, mode])

  const searchResults = useMemo(() => {
    if (!search || !parsedForSearch.ok) return []
    if (mode === 'json') {
      return searchJsonValue(parsedForSearch.data, search, { matchCase, inKeys, inValues })
    }
    return searchXmlDoc(parsedForSearch.data, search, {
      matchCase,
      inTags: inKeys,
      inAttrs: inKeys,
      inText: inValues,
    })
  }, [search, parsedForSearch, mode, matchCase, inKeys, inValues])

  function handleFormat() {
    try {
      if (mode === 'json') {
        const pretty = JSON.stringify(JSON.parse(input), null, 2)
        setOutputRaw(pretty)
        setOutput(syntaxHighlightJson(pretty))
      } else {
        parseXmlOrThrow(input)
        const pretty = formatXml(input.trim())
        setOutputRaw(pretty)
        setOutput(syntaxHighlightXml(pretty))
      }
      setError('')
      toast(`${mode.toUpperCase()} formatted`)
    } catch (e) {
      setOutput('')
      setOutputRaw('')
      if (mode === 'json') {
        const loc = jsonParseErrorLocation(input, e.message)
        setError(loc ? `${e.message} — line ${loc.line}, column ${loc.col}` : e.message)
      } else {
        setError(e.message)
      }
      toast('Invalid input', 'error')
    }
  }

  function handleMinify() {
    try {
      if (mode === 'json') {
        const min = JSON.stringify(JSON.parse(input))
        setOutputRaw(min)
        setOutput(syntaxHighlightJson(min))
      } else {
        parseXmlOrThrow(input)
        const min = input.replace(/>\s+</g, '><').trim()
        setOutputRaw(min)
        setOutput(syntaxHighlightXml(min))
      }
      setError('')
      toast(`${mode.toUpperCase()} minified`)
    } catch (e) {
      setOutput('')
      setOutputRaw('')
      setError(e.message)
      toast('Invalid input', 'error')
    }
  }

  function handleValidate() {
    try {
      if (mode === 'json') {
        JSON.parse(input)
      } else {
        parseXmlOrThrow(input)
      }
      setError('')
      setOutputRaw('')
      setOutput(`<span class="tok-str">✓ Valid ${mode.toUpperCase()}</span>`)
      toast(`Valid ${mode.toUpperCase()}`)
    } catch (e) {
      setOutput('')
      if (mode === 'json') {
        const loc = jsonParseErrorLocation(input, e.message)
        setError(loc ? `${e.message} — line ${loc.line}, column ${loc.col}` : e.message)
      } else {
        setError(e.message)
      }
      toast(`Invalid ${mode.toUpperCase()}`, 'error')
    }
  }

  function loadSample() {
    setInput(mode === 'json' ? SAMPLE_JSON : SAMPLE_XML)
    setOutput('')
    setOutputRaw('')
    setError('')
  }

  function clearAll() {
    setInput('')
    setOutput('')
    setOutputRaw('')
    setError('')
  }

  return (
    <div>
      <PageHeader icon={Braces} title="JSON / XML Formatter & Search" subtitle="Beautify, minify, validate and search through JSON or XML documents." accent="sky" />
      <div className="space-y-4 p-4 sm:p-6">
        <Tabs
          value={mode}
          onChange={(m) => {
            setMode(m)
            setOutput('')
            setOutputRaw('')
            setError('')
          }}
          options={[{ value: 'json', label: 'JSON' }, { value: 'xml', label: 'XML' }]}
        />

        <SplitPane
          storageKey="devpocket-split-jsonxml"
          left={
            <Panel
              title="Input"
            actions={
              <>
                <Button variant="ghost" onClick={loadSample} type="button">Sample</Button>
                <Button variant="ghost" onClick={clearAll} type="button"><Trash2 className="h-3.5 w-3.5" />Clear</Button>
              </>
            }
          >
            <TextArea rows={16} value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Paste ${mode.toUpperCase()} here…`} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={handleFormat} type="button"><Wand2 className="h-3.5 w-3.5" />Format</Button>
              <Button variant="subtle" onClick={handleMinify} type="button"><Minimize2 className="h-3.5 w-3.5" />Minify</Button>
              <Button variant="subtle" onClick={handleValidate} type="button"><CheckCircle2 className="h-3.5 w-3.5" />Validate</Button>
            </div>
              <div className="mt-3">
                <ErrorBanner>{error}</ErrorBanner>
              </div>
            </Panel>
          }

          right={
            <Panel title="Output" actions={<CopyButton text={outputRaw} onCopied={() => toast('Copied to clipboard')} />}>
              <OutputBlock html={output} />
            </Panel>
          }
        />

        <Panel
          title="Search"
          description={`Search across keys, attributes, text and values in the ${mode.toUpperCase()} above.`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="t-faint pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                className="pl-9"
                placeholder="Search term…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Checkbox checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} label="Match case" />
              <Checkbox checked={inKeys} onChange={(e) => setInKeys(e.target.checked)} label={mode === 'json' ? 'Keys' : 'Tags/attrs'} />
              <Checkbox checked={inValues} onChange={(e) => setInValues(e.target.checked)} label={mode === 'json' ? 'Values' : 'Text'} />
            </div>
          </div>

          {!parsedForSearch.ok && search && (
            <div className="mt-3">
              <ErrorBanner>Fix the {mode.toUpperCase()} above to enable search: {parsedForSearch.err}</ErrorBanner>
            </div>
          )}

          {search && parsedForSearch.ok && (
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
                        {mode === 'json' ? String(r.value) : r.snippet}
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
