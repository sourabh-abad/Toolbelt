import { useMemo, useRef, useState } from 'react'
import { CaseSensitive, Trash2, Upload, Download } from 'lucide-react'
import { CASES, convertAll, convertLines, detectCase } from '../lib/casing'
import { useToast } from '../lib/toast'
import { Panel, Button, CopyButton, TextArea, PageHeader, Select } from '../components/ui'
import CodeViewer from '../components/CodeViewer'

const SAMPLE = `XMLHttpRequest
user_id
first-name
getV2Items
SHIPPING_ADDRESS_LINE_1
Order created at`

export default function CaseConverterTool() {
  const [input, setInput] = useState(SAMPLE)
  const [target, setTarget] = useState('camel')
  const fileRef = useRef(null)
  const toast = useToast()

  const lines = input.split('\n').filter((l) => l.trim())
  const first = lines[0] || ''
  const all = useMemo(() => convertAll(first), [first])
  const bulk = useMemo(() => convertLines(input, target), [input, target])
  const detected = detectCase(first)

  function download() {
    const blob = new Blob([bulk], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${target}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function upload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then((t) => {
      setInput(t)
      toast(`Loaded ${file.name}`)
    })
    e.target.value = ''
  }

  return (
    <div>
      <PageHeader
        icon={CaseSensitive}
        title="Case Converter"
        subtitle="camelCase, snake_case, kebab-case and nine more — one name or a whole list."
        accent="teal"
      />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel
            title="Names"
            description="One identifier or phrase per line"
            actions={
              <>
                <input ref={fileRef} type="file" accept=".txt,.csv,text/*" onChange={upload} className="hidden" />
                <Button variant="ghost" type="button" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" />Upload
                </Button>
                <Button variant="ghost" type="button" onClick={() => setInput(SAMPLE)}>Sample</Button>
                <Button variant="ghost" type="button" onClick={() => setInput('')}>
                  <Trash2 className="h-3.5 w-3.5" />Clear
                </Button>
              </>
            }
          >
            <TextArea rows={10} value={input} onChange={(e) => setInput(e.target.value)} aria-label="Names to convert" placeholder="userId&#10;order_total&#10;Shipping address" />
          </Panel>

          <Panel
            title={first ? `“${first.trim().slice(0, 40)}” in every case` : 'Every case'}
            description={detected ? `Looks like ${CASES.find((c) => c.id === detected).label} already` : undefined}
          >
            {first ? (
              <div className="space-y-1.5">
                {all.map((c) => (
                  <div key={c.id} className="bd sunken flex items-center justify-between gap-3 rounded-lg border py-1 pr-1 pl-3">
                    <span className="t-muted w-40 shrink-0 text-xs">{c.label}</span>
                    <code className="t-main mono min-w-0 flex-1 truncate text-sm">{c.value}</code>
                    <CopyButton text={c.value} label="" onCopied={() => toast(`${c.label} copied`)} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="t-faint text-sm">Type a name on the left.</p>
            )}
          </Panel>
        </div>

        <Panel
          title="Convert the whole list"
          actions={
            <>
              <Select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Target case">
                {CASES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </Select>
              <CopyButton text={bulk} onCopied={() => toast('Copied to clipboard')} />
              <Button variant="subtle" type="button" onClick={download} disabled={!bulk.trim()}>
                <Download className="h-3.5 w-3.5" />Download
              </Button>
            </>
          }
        >
          <CodeViewer code={bulk.trim() ? bulk : ''} language="none" placeholder="Each line of the input, converted." animate={false} />
        </Panel>
      </div>
    </div>
  )
}
