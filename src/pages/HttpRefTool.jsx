import { useMemo, useState } from 'react'
import { Globe, Search as SearchIcon } from 'lucide-react'
import { STATUS_CODES, METHODS, HEADERS, CATEGORY_STYLES } from '../lib/httpref'
import { Panel, Input, PageHeader, Tabs } from '../components/ui'

export default function HttpRefTool() {
  const [tab, setTab] = useState('status')
  const [q, setQ] = useState('')

  const needle = q.trim().toLowerCase()
  const match = (...parts) => !needle || parts.some((p) => String(p).toLowerCase().includes(needle))

  const statuses = useMemo(() => STATUS_CODES.filter((s) => match(s.code, s.name, s.desc, s.category)), [needle])
  const methods = useMemo(() => METHODS.filter((m) => match(m.name, m.desc)), [needle])
  const headers = useMemo(() => HEADERS.filter((h) => match(h.name, h.desc, h.type)), [needle])

  return (
    <div>
      <PageHeader icon={Globe} title="HTTP Reference" subtitle="Status codes, methods and headers — searchable, no tab-switching to MDN." accent="blue" />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              { value: 'status', label: `Status codes (${statuses.length})` },
              { value: 'methods', label: `Methods (${methods.length})` },
              { value: 'headers', label: `Headers (${headers.length})` },
            ]}
          />
          <div className="relative min-w-52 flex-1">
            <SearchIcon className="t-faint pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search codes, methods, headers…" />
          </div>
        </div>

        {tab === 'status' && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {statuses.map((s) => (
              <div key={s.code} className="panel rounded-xl border p-3.5">
                <div className="flex items-center gap-2">
                  <span className={`mono rounded-md border px-2 py-0.5 text-sm font-bold ${CATEGORY_STYLES[s.category]}`}>{s.code}</span>
                  <span className="t-main text-sm font-semibold">{s.name}</span>
                </div>
                <p className="t-muted mt-1.5 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
            {!statuses.length && <p className="t-faint text-sm">No status codes match your search.</p>}
          </div>
        )}

        {tab === 'methods' && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {methods.map((m) => (
              <div key={m.name} className="panel rounded-xl border p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-sm font-bold text-blue-500">{m.name}</span>
                  {m.safe && <Badge tone="emerald">safe</Badge>}
                  {m.idempotent && <Badge tone="sky">idempotent</Badge>}
                  {m.body && <Badge tone="amber">has body</Badge>}
                </div>
                <p className="t-muted mt-1.5 text-xs leading-relaxed">{m.desc}</p>
              </div>
            ))}
            {!methods.length && <p className="t-faint text-sm">No methods match your search.</p>}
          </div>
        )}

        {tab === 'headers' && (
          <Panel>
            <div className="space-y-1.5">
              {headers.map((h) => (
                <div key={h.name} className="bd sunken flex flex-col gap-1 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                  <span className="mono t-main w-64 shrink-0 text-sm font-medium">{h.name}</span>
                  <Badge tone="violet">{h.type}</Badge>
                  <span className="t-muted text-xs">{h.desc}</span>
                </div>
              ))}
              {!headers.length && <p className="t-faint text-sm">No headers match your search.</p>}
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}

function Badge({ children, tone }) {
  const tones = {
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
    sky: 'border-sky-500/30 bg-sky-500/10 text-sky-500',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
    violet: 'border-violet-500/30 bg-violet-500/10 text-violet-500',
  }
  return <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${tones[tone]}`}>{children}</span>
}
