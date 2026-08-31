import { useEffect, useMemo, useState } from 'react'
import { Clock, RefreshCw, Copy, Globe2 } from 'lucide-react'
import { useToast } from '../lib/toast'
import { Panel, Button, CopyButton, Input, TextArea, ErrorBanner, PageHeader, StatRow } from '../components/ui'

const ZONES = [
  { id: 'local', label: 'Local', sub: Intl.DateTimeFormat().resolvedOptions().timeZone, accent: 'border-emerald-500/30 bg-emerald-500/5' },
  { id: 'Asia/Kolkata', label: 'India · IST', sub: 'Asia/Kolkata (UTC+5:30)', accent: 'border-orange-500/30 bg-orange-500/5' },
  { id: 'Africa/Johannesburg', label: 'South Africa · SAST', sub: 'Africa/Johannesburg (UTC+2)', accent: 'border-sky-500/30 bg-sky-500/5' },
  { id: 'UTC', label: 'UTC', sub: 'Coordinated Universal Time', accent: 'border-violet-500/30 bg-violet-500/5' },
]

function formatIn(date, zoneId) {
  const opts = { dateStyle: 'full', timeStyle: 'long' }
  if (zoneId !== 'local') opts.timeZone = zoneId
  try {
    return new Intl.DateTimeFormat('en-GB', opts).format(date)
  } catch {
    return '—'
  }
}

function shortIn(date, zoneId) {
  const opts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
  if (zoneId !== 'local') opts.timeZone = zoneId
  try {
    return new Intl.DateTimeFormat('en-GB', opts).format(date)
  } catch {
    return '—'
  }
}

function offsetLabel(date, zoneId) {
  if (zoneId === 'local') {
    const mins = -date.getTimezoneOffset()
    const sign = mins >= 0 ? '+' : '-'
    const abs = Math.abs(mins)
    return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
  }
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: zoneId, timeZoneName: 'shortOffset' }).formatToParts(date)
    return parts.find((p) => p.type === 'timeZoneName')?.value || zoneId
  } catch {
    return zoneId
  }
}

/** Every configured zone side by side — the headline feature of this page. */
function WorldClock({ date }) {
  return (
    <Panel
      title="Across timezones"
      description="The same instant, everywhere your services and teams live."
      actions={<Globe2 className="t-faint h-4 w-4" />}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ZONES.map((z) => (
          <div key={z.id} className={`rounded-xl border p-3.5 ${z.accent}`}>
            <div className="t-main text-xs font-semibold">{z.label}</div>
            <div className="t-faint mono mt-0.5 text-[10px]">{z.sub}</div>
            <div className="mono t-main mt-2 text-2xl font-bold tabular-nums">{shortIn(date, z.id)}</div>
            <div className="t-muted mt-1 text-[11px]">
              {new Intl.DateTimeFormat('en-GB', {
                dateStyle: 'medium',
                ...(z.id !== 'local' ? { timeZone: z.id } : {}),
              }).format(date)}
            </div>
            <div className="t-faint mono mt-1 text-[10px]">{offsetLabel(date, z.id)}</div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function NowClock({ now }) {
  const toast = useToast()
  return (
    <Panel title="Current time">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['Unix (seconds)', Math.floor(now / 1000)],
          ['Unix (ms)', now],
          ['ISO 8601', new Date(now).toISOString()],
        ].map(([label, value]) => (
          <div key={label} className="bd sunken rounded-xl border px-3 py-2.5">
            <div className="t-muted text-xs">{label}</div>
            <div className="mono t-main mt-1 flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{value}</span>
              <CopyButton text={String(value)} label="" onCopied={() => toast('Copied')} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function TimestampConverter() {
  const [epoch, setEpoch] = useState(String(Math.floor(Date.now() / 1000)))
  const [dateStr, setDateStr] = useState('')

  const fromEpoch = useMemo(() => {
    const raw = epoch.trim()
    if (!raw || isNaN(Number(raw))) return null
    const n = Number(raw)
    const ms = raw.replace('-', '').length > 12 ? n : n * 1000
    const d = new Date(ms)
    return isNaN(d.getTime()) ? null : d
  }, [epoch])

  const fromDate = useMemo(() => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? null : d
  }, [dateStr])

  return (
    <Panel title="Timestamp Converter" description="Paste a Unix timestamp (seconds or ms) to see it in every zone, or pick a date to get the epoch.">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div>
          <label className="t-muted mb-1.5 block text-xs">Epoch → Date</label>
          <Input value={epoch} onChange={(e) => setEpoch(e.target.value)} placeholder="1735689600" />
          {fromEpoch ? (
            <div className="mt-3 space-y-1.5">
              {ZONES.map((z) => (
                <StatRow key={z.id} label={z.label} value={formatIn(fromEpoch, z.id)} />
              ))}
              <StatRow label="ISO" value={fromEpoch.toISOString()} />
            </div>
          ) : (
            <div className="mt-3">
              <ErrorBanner>{epoch ? 'Not a valid timestamp' : ''}</ErrorBanner>
            </div>
          )}
        </div>
        <div>
          <label className="t-muted mb-1.5 block text-xs">Date → Epoch</label>
          <Input type="datetime-local" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
          {fromDate ? (
            <div className="mt-3 space-y-1.5">
              <StatRow label="Unix (seconds)" value={Math.floor(fromDate.getTime() / 1000)} />
              <StatRow label="Unix (ms)" value={fromDate.getTime()} />
              <StatRow label="ISO" value={fromDate.toISOString()} />
              <StatRow label="India · IST" value={formatIn(fromDate, 'Asia/Kolkata')} />
              <StatRow label="South Africa · SAST" value={formatIn(fromDate, 'Africa/Johannesburg')} />
            </div>
          ) : (
            <div className="t-faint mt-3 text-xs">Pick a date &amp; time above.</div>
          )}
        </div>
      </div>
    </Panel>
  )
}

function UuidSection() {
  const [ids, setIds] = useState([crypto.randomUUID()])
  const [upper, setUpper] = useState(false)
  const toast = useToast()

  const generate = (count) => {
    setIds(Array.from({ length: count }, () => crypto.randomUUID()))
    toast(`Generated ${count} UUID${count === 1 ? '' : 's'}`)
  }
  const format = (id) => (upper ? id.toUpperCase() : id)

  return (
    <Panel
      title="UUID Generator"
      actions={
        <label className="t-muted flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} className="accent-emerald-500" />
          Uppercase
        </label>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Button onClick={() => generate(1)} type="button"><RefreshCw className="h-3.5 w-3.5" />Generate 1</Button>
        <Button variant="subtle" onClick={() => generate(5)} type="button">5</Button>
        <Button variant="subtle" onClick={() => generate(10)} type="button">10</Button>
        <Button
          variant="ghost"
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(ids.map(format).join('\n'))
            toast('All UUIDs copied')
          }}
        >
          <Copy className="h-3.5 w-3.5" />Copy all
        </Button>
      </div>
      <div className="max-h-64 space-y-1.5 overflow-auto">
        {ids.map((id, i) => (
          <div key={i} className="bd sunken mono t-main flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
            {format(id)}
            <CopyButton text={format(id)} label="" />
          </div>
        ))}
      </div>
    </Panel>
  )
}

function RegexTester() {
  const [pattern, setPattern] = useState('\\b\\w+@\\w+\\.\\w+\\b')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState('Contact: ada@example.com or grace@example.org')
  const availableFlags = ['g', 'i', 'm', 's', 'u', 'y']

  const { error, matches } = useMemo(() => {
    try {
      const found = []
      if (flags.includes('g')) {
        const re = new RegExp(pattern, flags)
        let m
        while ((m = re.exec(text)) !== null) {
          found.push(m)
          if (m[0] === '') re.lastIndex++
        }
      } else {
        const m = new RegExp(pattern, flags).exec(text)
        if (m) found.push(m)
      }
      return { error: '', matches: found }
    } catch (e) {
      return { error: e.message, matches: [] }
    }
  }, [pattern, flags, text])

  const toggleFlag = (f) => setFlags((prev) => (prev.includes(f) ? prev.replace(f, '') : prev + f))

  return (
    <Panel title="Regex Tester">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <Input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="Regular expression…" />
        <div className="flex items-center gap-1.5">
          {availableFlags.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggleFlag(f)}
              title={`Toggle /${f} flag`}
              className={`h-8 w-8 rounded-lg border text-xs font-semibold transition-colors ${
                flags.includes(f) ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' : 'bd t-faint hover-surface'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <TextArea className="mt-3" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Test string…" />
      <div className="mt-3">
        <ErrorBanner>{error}</ErrorBanner>
        {!error && (
          <div className="t-muted text-xs">
            {matches.length} match{matches.length === 1 ? '' : 'es'}
          </div>
        )}
      </div>
      {!error && matches.length > 0 && (
        <div className="mt-2 max-h-56 space-y-1.5 overflow-auto">
          {matches.map((m, i) => (
            <div key={i} className="bd sunken mono rounded-lg border px-3 py-2 text-xs">
              <div className="text-emerald-600 dark:text-emerald-300">
                [{m.index}] {m[0]}
              </div>
              {m.length > 1 && <div className="t-faint mt-1">groups: {JSON.stringify(m.slice(1))}</div>}
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

export default function TimestampTool() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <PageHeader icon={Clock} title="Time / UUID / Regex" subtitle="Multi-zone clocks (IST & SAST included), timestamp conversion, UUIDs and regex." accent="rose" />
      <div className="space-y-4 p-4 sm:p-6">
        <WorldClock date={new Date(now)} />
        <NowClock now={now} />
        <TimestampConverter />
        <UuidSection />
        <RegexTester />
      </div>
    </div>
  )
}
