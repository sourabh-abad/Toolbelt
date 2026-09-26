import { useCallback, useEffect, useMemo, useState } from 'react'
import { Fingerprint, RefreshCw, Download } from 'lucide-react'
import { uuidv4, uuidv7, ulid, nanoId, NIL_UUID, MAX_UUID } from '../lib/ids'
import { downloadFile } from '../lib/files'
import { useToast } from '../lib/toast'
import IdInspector from '../components/IdInspector'
import { Panel, Button, CopyButton, Input, Checkbox, PageHeader, Tabs } from '../components/ui'

const KINDS = [
  { value: 'v4', label: 'UUID v4' },
  { value: 'v7', label: 'UUID v7' },
  { value: 'ulid', label: 'ULID' },
  { value: 'nano', label: 'Nano ID' },
  { value: 'nil', label: 'Nil / Max' },
]
const MAX_COUNT = 1000
const SHOWN = 200

function makeIds(kind, count, size) {
  if (kind === 'nil') return [NIL_UUID, MAX_UUID]
  const n = Math.min(MAX_COUNT, Math.max(1, Number(count) || 1))
  const gen = kind === 'v4' ? uuidv4 : kind === 'v7' ? () => uuidv7() : kind === 'ulid' ? () => ulid() : () => nanoId(Math.min(64, Math.max(4, Number(size) || 21)))
  return Array.from({ length: n }, gen)
}

export default function IdGeneratorTool() {
  const [kind, setKind] = useState('v4')
  const [count, setCount] = useState(10)
  const [size, setSize] = useState(21)
  const [upper, setUpper] = useState(false)
  const [hyphens, setHyphens] = useState(true)
  const [ids, setIds] = useState([])
  const toast = useToast()

  // Generated after mount: random IDs in the prerendered HTML would be
  // replaced on load anyway, and would differ from the first client render.
  const generate = useCallback(() => setIds(makeIds(kind, count, size)), [kind, count, size])
  useEffect(() => {
    generate()
  }, [generate])

  const isUuid = kind === 'v4' || kind === 'v7' || kind === 'nil'
  const fmt = useCallback(
    (id) => {
      if (!isUuid) return id
      const out = hyphens ? id : id.replace(/-/g, '')
      return upper ? out.toUpperCase() : out
    },
    [isUuid, hyphens, upper]
  )
  const list = useMemo(() => ids.map(fmt), [ids, fmt])
  const name = kind === 'nil' ? 'uuids' : KINDS.find((k) => k.value === kind).label.toLowerCase().replace(/\s+/g, '-')

  const download = (type) => {
    if (type === 'txt') downloadFile(list.join('\n') + '\n', `${name}.txt`, 'text/plain')
    if (type === 'csv') downloadFile('id\n' + list.join('\n') + '\n', `${name}.csv`, 'text/csv')
    if (type === 'json') downloadFile(JSON.stringify(list, null, 2) + '\n', `${name}.json`, 'application/json')
  }

  return (
    <div>
      <PageHeader icon={Fingerprint} title="UUID Generator" subtitle="Bulk UUID v4 and v7, ULID and Nano ID from the browser's crypto source." accent="violet" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-end gap-4">
            <Tabs value={kind} onChange={setKind} options={KINDS} />
            {kind !== 'nil' && (
              <div>
                <label className="t-muted mb-1 block text-xs" htmlFor="id-count">How many (max {MAX_COUNT})</label>
                <Input id="id-count" type="number" min="1" max={MAX_COUNT} value={count} onChange={(e) => setCount(e.target.value)} className="w-28" />
              </div>
            )}
            {kind === 'nano' && (
              <div>
                <label className="t-muted mb-1 block text-xs" htmlFor="id-size">Length</label>
                <Input id="id-size" type="number" min="4" max="64" value={size} onChange={(e) => setSize(e.target.value)} className="w-24" />
              </div>
            )}
            {isUuid && (
              <div className="flex gap-4">
                <Checkbox checked={upper} onChange={(e) => setUpper(e.target.checked)} label="Uppercase" />
                <Checkbox checked={hyphens} onChange={(e) => setHyphens(e.target.checked)} label="Hyphens" />
              </div>
            )}
            <Button onClick={generate} type="button"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Regenerate</Button>
          </div>
          <p className="t-faint mt-3 text-xs">
            {kind === 'v7'
              ? 'v7 starts with the current Unix time in milliseconds, so IDs sort by creation time — kind to database indexes.'
              : kind === 'ulid'
                ? 'ULID: 48-bit time plus 80 random bits in 26 Crockford base32 characters; sortable as text.'
                : kind === 'nano'
                  ? 'Nano ID: URL-safe random IDs; 21 characters has about the same collision resistance as a UUID v4.'
                  : kind === 'nil'
                    ? 'The nil UUID (all zeros) and max UUID (all ones) from RFC 9562, useful as sentinels.'
                    : 'v4: 122 random bits. The right default when IDs need not sort.'}
          </p>
        </Panel>

        <Panel
          title="Generated"
          // The count arrives after mount; keeping it out of the heading keeps
          // the prerendered and hydrated headings identical.
          description={list.length ? `${list.length.toLocaleString()} ${list.length === 1 ? 'ID' : 'IDs'}` : undefined}
          actions={
            <>
              <CopyButton text={list.join('\n')} label="Copy all" onCopied={() => toast(`${list.length} IDs copied`)} />
              {['txt', 'csv', 'json'].map((t) => (
                <Button key={t} variant="ghost" type="button" onClick={() => download(t)} disabled={!list.length}>
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />.{t}
                </Button>
              ))}
            </>
          }
        >
          <div className="max-h-[460px] space-y-1.5 overflow-auto">
            {list.slice(0, SHOWN).map((id, i) => (
              <div key={i} className="bd sunken mono flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
                <span className="t-main break-all">{id}</span>
                <CopyButton text={id} label="" />
              </div>
            ))}
            {list.length > SHOWN && <p className="t-faint px-1 py-2 text-xs">Showing {SHOWN} of {list.length.toLocaleString()} — Copy all or download to get every one.</p>}
          </div>
        </Panel>

        <IdInspector />
      </div>
    </div>
  )
}
