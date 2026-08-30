import { useState } from 'react'
import yaml from 'js-yaml'
import { Shuffle, ArrowRight, Trash2 } from 'lucide-react'
import { csvToObjects, objectsToCsv } from '../lib/csv'
import { syntaxHighlightJson } from '../lib/utils'
import { useToast } from '../lib/toast'
import SplitPane from '../components/SplitPane'
import { Panel, Button, CopyButton, TextArea, ErrorBanner, OutputBlock, PageHeader, Select } from '../components/ui'

const SAMPLE = `{
  "service": "payments-api",
  "replicas": 3,
  "env": "production",
  "ports": [8080, 9090],
  "resources": { "cpu": "500m", "memory": "512Mi" }
}`

const FORMATS = ['json', 'yaml', 'csv']

export default function ConvertTool() {
  const [from, setFrom] = useState('json')
  const [to, setTo] = useState('yaml')
  const [input, setInput] = useState(SAMPLE)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const toast = useToast()

  function parseInput() {
    if (!input.trim()) throw new Error('Nothing to convert — paste some input first.')
    if (from === 'json') return JSON.parse(input)
    if (from === 'yaml') return yaml.load(input)
    const rows = csvToObjects(input)
    if (!rows.length) throw new Error('No data rows found. CSV needs a header row plus at least one record.')
    return rows
  }

  function convert() {
    try {
      const data = parseInput()
      let result
      if (to === 'json') {
        result = JSON.stringify(data, null, 2)
      } else if (to === 'yaml') {
        result = yaml.dump(data, { indent: 2, lineWidth: 100, noRefs: true })
      } else {
        const rows = Array.isArray(data) ? data : [data]
        if (rows.some((r) => r === null || typeof r !== 'object' || Array.isArray(r))) {
          throw new Error('CSV output needs an array of flat objects (or a single object).')
        }
        result = objectsToCsv(rows)
      }
      setOutput(result)
      setError('')
      toast(`Converted ${from.toUpperCase()} → ${to.toUpperCase()}`)
    } catch (e) {
      setOutput('')
      setError(e.message)
      toast('Conversion failed', 'error')
    }
  }

  function swap() {
    setFrom(to)
    setTo(from)
    if (output) {
      setInput(output)
      setOutput('')
    }
  }

  return (
    <div>
      <PageHeader
        icon={Shuffle}
        title="JSON ⇄ YAML ⇄ CSV"
        subtitle="Convert between the config and data formats you touch every day."
        accent="teal"
      />
      <div className="space-y-4 p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="t-muted text-xs">From</label>
              <Select value={from} onChange={(e) => setFrom(e.target.value)}>
                {FORMATS.map((f) => (
                  <option key={f} value={f}>{f.toUpperCase()}</option>
                ))}
              </Select>
            </div>
            <Button variant="ghost" onClick={swap} type="button" title="Swap direction">
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-2">
              <label className="t-muted text-xs">To</label>
              <Select value={to} onChange={(e) => setTo(e.target.value)}>
                {FORMATS.map((f) => (
                  <option key={f} value={f}>{f.toUpperCase()}</option>
                ))}
              </Select>
            </div>
            <Button onClick={convert} type="button" disabled={from === to}>
              Convert
            </Button>
            <Button variant="ghost" onClick={() => { setInput(''); setOutput(''); setError('') }} type="button">
              <Trash2 className="h-3.5 w-3.5" />Clear
            </Button>
            {from === to && <span className="t-faint text-xs">Pick two different formats.</span>}
          </div>
        </Panel>

        <SplitPane
          storageKey="toolbelt-split-convert"
          left={
            <Panel title={`Input · ${from.toUpperCase()}`}>
              <TextArea rows={18} value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Paste ${from.toUpperCase()} here…`} />
              <div className="mt-3">
                <ErrorBanner>{error}</ErrorBanner>
              </div>
            </Panel>
          }
          right={
            <Panel title={`Output · ${to.toUpperCase()}`} actions={<CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />}>
              <OutputBlock html={to === 'json' && output ? syntaxHighlightJson(output) : null} text={to !== 'json' ? output : null} />
            </Panel>
          }
        />
      </div>
    </div>
  )
}
