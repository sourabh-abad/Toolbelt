import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock3, RefreshCw, Download } from 'lucide-react'
import { uuidv7, inspectId } from '../lib/ids'
import { downloadFile } from '../lib/files'
import { useToast } from '../lib/toast'
import IdInspector from '../components/IdInspector'
import { Panel, Button, CopyButton, Input, PageHeader, Checkbox } from '../components/ui'

// A fixed example so the prerendered diagram is stable (RFC 9562, appendix A.6).
const EXAMPLE = '017f22e2-79b0-7cc3-98c4-dc0c0c07398f'

const FIELDS = [
  { name: 'unix_ts_ms', bits: 48, tone: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-300', desc: 'Milliseconds since 1970-01-01 UTC, big-endian' },
  { name: 'ver', bits: 4, tone: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300', desc: 'Always 0111 — the "7"' },
  { name: 'rand_a', bits: 12, tone: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', desc: 'Random, or a counter for ordering within one millisecond' },
  { name: 'var', bits: 2, tone: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300', desc: 'Always 10 — the RFC 9562 variant' },
  { name: 'rand_b', bits: 62, tone: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', desc: 'Random' },
]

function Layout({ uuid }) {
  const h = uuid.replace(/-/g, '')
  const info = inspectId(uuid)
  // Hex digit 16 holds the 2 variant bits and the first 2 bits of rand_b.
  const pieces = [
    [h.slice(0, 8) + '-' + h.slice(8, 12), 0],
    ['-', null],
    [h[12], 1],
    [h.slice(13, 16), 2],
    ['-', null],
    [h[16], 3],
    [h.slice(17, 20) + '-' + h.slice(20), 4],
  ]
  return (
    <div>
      <div className="mono text-lg font-semibold tracking-wide break-all sm:text-xl">
        {pieces.map(([t, f], i) => (
          <span key={i} className={f === null ? 't-faint' : FIELDS[f].text}>{t}</span>
        ))}
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full" aria-hidden="true">
        {FIELDS.map((f) => (
          <div key={f.name} className={f.tone} style={{ width: `${(f.bits / 128) * 100}%` }} />
        ))}
      </div>
      <table className="mt-3 w-full text-left text-xs">
        <thead className="t-muted">
          <tr>
            <th className="py-1 pr-3 font-semibold">Field</th>
            <th className="py-1 pr-3 font-semibold">Bits</th>
            <th className="py-1 font-semibold">Meaning</th>
          </tr>
        </thead>
        <tbody>
          {FIELDS.map((f) => (
            <tr key={f.name} className="bd border-t">
              <td className="py-1.5 pr-3 whitespace-nowrap"><span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${f.tone}`} aria-hidden="true" /><code className="mono">{f.name}</code></td>
              <td className="mono py-1.5 pr-3">{f.bits}</td>
              <td className="t-muted py-1.5">
                {f.desc}
                {f.name === 'unix_ts_ms' && info?.date ? ` — here 0x${h.slice(0, 12)} = ${info.ms} = ${info.date.toISOString()}` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function UuidV7Tool() {
  const [count, setCount] = useState(5)
  const [upper, setUpper] = useState(false)
  const [ids, setIds] = useState([])
  const toast = useToast()

  const generate = useCallback(() => {
    const n = Math.min(1000, Math.max(1, Number(count) || 1))
    setIds(Array.from({ length: n }, () => uuidv7()))
  }, [count])
  useEffect(() => {
    generate()
  }, [generate])

  const list = useMemo(() => ids.map((id) => (upper ? id.toUpperCase() : id)), [ids, upper])

  return (
    <div>
      <PageHeader icon={Clock3} title="UUID v7 Generator" subtitle="Time-ordered UUIDs (RFC 9562) that sort by creation time." accent="violet" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel
          title="Generated"
          // The count arrives after mount; keeping it out of the heading keeps
          // the prerendered and hydrated headings identical.
          description={list.length ? `${list.length} UUID${list.length === 1 ? '' : 's'}` : undefined}
          actions={
            <>
              <CopyButton text={list.join('\n')} label="Copy all" onCopied={() => toast('Copied')} />
              <Button variant="ghost" type="button" disabled={!list.length} onClick={() => downloadFile(list.join('\n') + '\n', 'uuid-v7.txt', 'text/plain')}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />.txt
              </Button>
            </>
          }
        >
          <div className="mb-3 flex flex-wrap items-end gap-4">
            <div>
              <label className="t-muted mb-1 block text-xs" htmlFor="v7-count">How many (max 1000)</label>
              <Input id="v7-count" type="number" min="1" max="1000" value={count} onChange={(e) => setCount(e.target.value)} className="w-28" />
            </div>
            <Checkbox checked={upper} onChange={(e) => setUpper(e.target.checked)} label="Uppercase" />
            <Button type="button" onClick={generate}><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Regenerate</Button>
          </div>
          <div className="max-h-72 space-y-1.5 overflow-auto">
            {list.slice(0, 200).map((id, i) => (
              <div key={i} className="bd sunken mono flex items-center justify-between gap-3 rounded-lg border px-3 py-1.5 text-sm">
                <span className="t-main break-all">{id}</span>
                <CopyButton text={id} label="" />
              </div>
            ))}
          </div>
          <p className="t-faint mt-2 text-xs">IDs made in the same millisecond still sort in the order they were generated: rand_a works as a counter.</p>
        </Panel>

        <Panel title="Bit layout" description={ids[0] ? 'The first UUID above, field by field.' : 'The RFC 9562 example, field by field.'}>
          <Layout uuid={ids[0] || EXAMPLE} />
        </Panel>

        <Panel title="v4 or v7?">
          <div className="bd overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-xs">
              <thead className="surface t-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold" />
                  <th className="px-3 py-2 font-semibold">UUID v4</th>
                  <th className="px-3 py-2 font-semibold">UUID v7</th>
                </tr>
              </thead>
              <tbody className="t-muted">
                {[
                  ['Contents', '122 random bits', '48-bit ms timestamp + 74 random bits'],
                  ['Sort order', 'Random', 'Creation time'],
                  ['B-tree index inserts', 'Scattered across the index', 'Appended near the end'],
                  ['Reveals creation time', 'No', 'Yes, to the millisecond'],
                  ['Collision resistance', '2¹²² values', '2⁷⁴ per millisecond'],
                  ['Support', 'Everywhere', 'Newer libraries; PostgreSQL 18 uuidv7()'],
                ].map(([k, a, b]) => (
                  <tr key={k} className="bd border-t">
                    <td className="t-main px-3 py-2 font-medium">{k}</td>
                    <td className="px-3 py-2">{a}</td>
                    <td className="px-3 py-2">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <IdInspector initial={EXAMPLE} title="Extract the timestamp" description="Paste any UUID v7 (or v1, v6, ULID) to read the time it was created." />
      </div>
    </div>
  )
}
