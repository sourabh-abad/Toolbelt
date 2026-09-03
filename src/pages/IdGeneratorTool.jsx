import { useCallback, useEffect, useState } from 'react'
import { Fingerprint, RefreshCw } from 'lucide-react'
import { useToast } from '../lib/toast'
import { Panel, Button, CopyButton, Input, Checkbox, PageHeader, Tabs } from '../components/ui'
import ToolContentSections from '../components/ToolContentSections'

const NANO_ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'

function nanoId(size) {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < size; i++) out += NANO_ALPHABET[bytes[i] % NANO_ALPHABET.length]
  return out
}

export default function IdGeneratorTool() {
  const [kind, setKind] = useState('uuid')
  const [count, setCount] = useState(10)
  const [size, setSize] = useState(21)
  const [upper, setUpper] = useState(false)
  const [hyphens, setHyphens] = useState(true)
  const [ids, setIds] = useState([])
  const toast = useToast()

  const generate = useCallback(() => {
    const n = Math.min(100, Math.max(1, Number(count) || 1))
    const list = Array.from({ length: n }, () =>
      kind === 'uuid' ? crypto.randomUUID() : nanoId(Math.min(64, Math.max(4, Number(size) || 21)))
    )
    setIds(list)
  }, [kind, count, size])

  useEffect(() => { generate() }, [generate])

  const format = (id) => {
    if (kind !== 'uuid') return id
    let out = hyphens ? id : id.replace(/-/g, '')
    return upper ? out.toUpperCase() : out
  }

  return (
    <div>
      <PageHeader icon={Fingerprint} title="UUID & Nano ID Generator" subtitle="Bulk-generate UUID v4 or Nano IDs using the browser's crypto source." accent="violet" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-end gap-5">
            <Tabs
              value={kind}
              onChange={setKind}
              options={[
                { value: 'uuid', label: 'UUID v4' },
                { value: 'nano', label: 'Nano ID' },
              ]}
            />
            <div>
              <label className="t-muted mb-1 block text-xs">How many</label>
              <Input type="number" min="1" max="100" value={count} onChange={(e) => setCount(e.target.value)} className="w-24" />
            </div>
            {kind === 'nano' && (
              <div>
                <label className="t-muted mb-1 block text-xs">Length</label>
                <Input type="number" min="4" max="64" value={size} onChange={(e) => setSize(e.target.value)} className="w-24" />
              </div>
            )}
            {kind === 'uuid' && (
              <div className="flex gap-4">
                <Checkbox checked={upper} onChange={(e) => setUpper(e.target.checked)} label="Uppercase" />
                <Checkbox checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} label="Hyphens" />
              </div>
            )}
            <Button onClick={generate} type="button"><RefreshCw className="h-3.5 w-3.5" />Regenerate</Button>
            <Button variant="ghost" type="button" onClick={() => { navigator.clipboard.writeText(ids.map(format).join('\n')); toast('All IDs copied') }}>
              Copy all
            </Button>
          </div>
        </Panel>

        <Panel title={`Generated (${ids.length})`}>
          <div className="max-h-[460px] space-y-1.5 overflow-auto">
            {ids.map((id, i) => (
              <div key={i} className="bd sunken mono flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
                <span className="t-main break-all">{format(id)}</span>
                <CopyButton text={format(id)} label="" />
              </div>
            ))}
          </div>
        </Panel>

        <ToolContentSections />
      </div>
    </div>
  )
}
