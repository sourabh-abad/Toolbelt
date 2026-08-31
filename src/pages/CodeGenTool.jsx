import { useState } from 'react'
import { FileCode2, Wand2 } from 'lucide-react'
import { generate, LANGUAGES } from '../lib/codegen'
import { useToast } from '../lib/toast'
import SplitPane from '../components/SplitPane'
import { Panel, Button, CopyButton, TextArea, Input, ErrorBanner, OutputBlock, PageHeader, Select } from '../components/ui'

const SAMPLE = `{
  "id": 1042,
  "orderRef": "ORD-2291",
  "customer": {
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "verified": true
  },
  "items": [
    { "sku": "SKU-1", "qty": 2, "price": 19.99 }
  ],
  "total": 39.98,
  "placedAt": "2026-08-30T10:15:00Z"
}`

export default function CodeGenTool() {
  const [input, setInput] = useState(SAMPLE)
  const [lang, setLang] = useState('typescript')
  const [rootName, setRootName] = useState('Order')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const toast = useToast()

  function run(nextLang = lang) {
    try {
      const parsed = JSON.parse(input)
      const target = Array.isArray(parsed) ? parsed[0] : parsed
      if (target === null || typeof target !== 'object') {
        throw new Error('Provide a JSON object, or an array whose first element is an object.')
      }
      setOutput(generate(target, rootName || 'Model', nextLang))
      setError('')
      toast(`Generated ${LANGUAGES.find((l) => l.value === nextLang)?.label} model`)
    } catch (e) {
      setOutput('')
      setError(e.message)
      toast('Could not generate model', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        icon={FileCode2}
        title="JSON → Code Models"
        subtitle="Turn an API payload into typed models for your service layer."
        accent="indigo"
      />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="t-muted text-xs">Language</label>
              <Select
                value={lang}
                onChange={(e) => {
                  setLang(e.target.value)
                  if (output) run(e.target.value)
                }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="t-muted text-xs">Root name</label>
              <Input value={rootName} onChange={(e) => setRootName(e.target.value)} className="w-40" placeholder="Model" />
            </div>
            <Button onClick={() => run()} type="button">
              <Wand2 className="h-3.5 w-3.5" />Generate
            </Button>
          </div>
        </Panel>

        <SplitPane
          storageKey="toolbelt-split-codegen"
          left={
            <Panel title="JSON payload">
              <TextArea rows={20} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste a JSON response…" />
              <div className="mt-3">
                <ErrorBanner>{error}</ErrorBanner>
              </div>
            </Panel>
          }
          right={
            <Panel
              title={LANGUAGES.find((l) => l.value === lang)?.label}
              actions={<CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />}
            >
              <OutputBlock text={output} placeholder="Generated models will appear here…" />
            </Panel>
          }
        />
      </div>
    </div>
  )
}
