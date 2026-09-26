import { useEffect, useMemo, useState } from 'react'
import { Clock, Plus, X, RotateCcw, AlertTriangle, Download, Timer } from 'lucide-react'
import {
  parseEpoch,
  parseDateString,
  isoIn,
  rfc2822In,
  relative,
  offsetOf,
  convertBatch,
  batchCsv,
  SNIPPETS,
  DEFAULT_ZONES,
  zoneLabel,
} from '../lib/timestamp'
import { downloadFile } from '../lib/files'
import { takeHandoff } from '../lib/handoff'
import { useToast } from '../lib/toast'
import { Panel, Button, CopyButton, Input, TextArea, PageHeader, Select } from '../components/ui'

const ZONES_KEY = 'devpocket-timestamp-zones'
const UNIT_NAMES = { s: 'seconds', ms: 'milliseconds', us: 'microseconds', ns: 'nanoseconds' }

function readZones() {
  try {
    const saved = JSON.parse(localStorage.getItem(ZONES_KEY) || 'null')
    if (Array.isArray(saved) && saved.every((z) => typeof z === 'string')) return saved
  } catch {
    // storage blocked or corrupt: defaults
  }
  return DEFAULT_ZONES
}
function saveZones(zones) {
  try {
    localStorage.setItem(ZONES_KEY, JSON.stringify(zones))
  } catch {
    // not persisted; still works for this visit
  }
}

function fmt(date, zone, options) {
  try {
    return new Intl.DateTimeFormat('en-GB', { ...options, ...(zone !== 'local' ? { timeZone: zone } : {}) }).format(date)
  } catch {
    return '—'
  }
}

function Row({ label, value, onCopied }) {
  return (
    <div className="bd sunken flex min-w-0 items-center justify-between gap-3 rounded-lg border px-3 py-2">
      <div className="min-w-0">
        <div className="t-faint text-[11px]">{label}</div>
        <div className="mono t-main truncate text-sm">{value}</div>
      </div>
      <CopyButton text={String(value)} label="" onCopied={onCopied} />
    </div>
  )
}

function ZonePicker({ zones, setZones }) {
  const [q, setQ] = useState('')
  const [all, setAll] = useState([])
  useEffect(() => {
    try {
      setAll(Intl.supportedValuesOf('timeZone'))
    } catch {
      setAll(['UTC', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney'])
    }
  }, [])
  const match = all.find((z) => z.toLowerCase() === q.trim().toLowerCase())
  const add = (z) => {
    if (!z || zones.includes(z)) return
    const next = [...zones, z]
    setZones(next)
    saveZones(next)
    setQ('')
  }
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        add(match || all.find((z) => z.toLowerCase().includes(q.trim().toLowerCase().replace(/\s+/g, '_'))))
      }}
    >
      <Input list="tz-options" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a time zone: Tokyo, Europe/Berlin…" className="min-w-0 flex-1" aria-label="Search time zones" />
      <datalist id="tz-options">
        {all.map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>
      <Button type="submit" variant="subtle" disabled={!q.trim()}><Plus className="h-3.5 w-3.5" aria-hidden="true" />Add</Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setZones(DEFAULT_ZONES)
          saveZones(DEFAULT_ZONES)
        }}
        title="Back to Local, IST, SAST and UTC"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Reset
      </Button>
    </form>
  )
}

export default function TimestampTool() {
  // null until mounted: the prerendered page has no "now", and the first
  // client render must match it.
  const [now, setNow] = useState(null)
  const [epoch, setEpoch] = useState('')
  const [live, setLive] = useState(true)
  const [unit, setUnit] = useState('auto')
  const [dateText, setDateText] = useState('2038-01-19T03:14:07Z')
  const [zones, setZones] = useState(DEFAULT_ZONES)
  const [localZone, setLocalZone] = useState('')
  const [batch, setBatch] = useState('1700000000\n1700000000123\n1700000000123456789\n2024-02-29T12:00:00Z\nMon, 15 Jan 2024 09:30:00 +0000')
  const toast = useToast()
  const copied = () => toast('Copied')

  useEffect(() => {
    // "Open in Timestamp Converter" from the UUID tools hands over ms.
    const handed = takeHandoff('/timestamp')
    if (typeof handed === 'string') {
      setLive(false)
      setEpoch(handed)
    }
    setZones(readZones())
    setLocalZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const epochInput = live ? (now === null ? '' : String(Math.floor(now / 1000))) : epoch
  const parsed = useMemo(() => parseEpoch(epochInput, unit), [epochInput, unit])
  const date = parsed && !parsed.error ? parsed.date : null
  const fromDate = useMemo(() => parseDateString(dateText), [dateText])
  const batchRows = useMemo(() => convertBatch(batch), [batch])

  const removeZone = (z) => {
    const next = zones.filter((x) => x !== z)
    setZones(next)
    saveZones(next)
  }

  const nowDate = now === null ? null : new Date(now)

  return (
    <div>
      <PageHeader icon={Clock} title="Unix Timestamp Converter" subtitle="Epoch to date and back, in any time zone — seconds, ms, µs or ns detected." accent="rose" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel title="Current Unix time">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Row label="Seconds" value={now === null ? '—' : Math.floor(now / 1000)} onCopied={copied} />
            <Row label="Milliseconds" value={now === null ? '—' : now} onCopied={copied} />
            <Row label="ISO 8601 (UTC)" value={nowDate ? nowDate.toISOString() : '—'} onCopied={copied} />
          </div>
        </Panel>

        <div className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
          <Panel title="Timestamp → date" description="Paste seconds, milliseconds, microseconds or nanoseconds; the unit is detected from the number of digits.">
            <div className="flex flex-wrap gap-2">
              <Input
                className="mono min-w-0 flex-1"
                value={epochInput}
                onChange={(e) => {
                  setLive(false)
                  setEpoch(e.target.value)
                }}
                placeholder="1700000000"
                aria-label="Unix timestamp"
                inputMode="numeric"
              />
              <Select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-auto" aria-label="Unit">
                <option value="auto">Auto-detect</option>
                <option value="s">Seconds</option>
                <option value="ms">Milliseconds</option>
                <option value="us">Microseconds</option>
                <option value="ns">Nanoseconds</option>
              </Select>
              <Button type="button" variant={live ? 'subtle' : 'default'} onClick={() => setLive(true)} title="Follow the current time">
                <Timer className="h-3.5 w-3.5" aria-hidden="true" />Now
              </Button>
            </div>
            <div className="mt-3 space-y-2" aria-live="polite">
              {parsed?.error && <p className="text-sm text-rose-600 dark:text-rose-300">{parsed.error}</p>}
              {date && (
                <>
                  <p className="t-muted text-sm">
                    Read as <strong className="t-main">{UNIT_NAMES[parsed.unit]}</strong>
                    {unit === 'auto' ? ' (detected)' : ''} · <span className="t-main">{now === null ? '' : relative(date, now)}</span>
                    {parsed.subMs && <span className="t-faint"> · sub-millisecond digits .{parsed.subMs} kept below</span>}
                  </p>
                  {parsed.beyond2038 && (
                    <p className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      Outside the signed 32-bit range (up to 2147483647, 2038-01-19 03:14:07 UTC). Systems that store time in a 32-bit integer cannot hold this value.
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-2">
                    <Row label="ISO 8601 (UTC)" value={parsed.subMs ? date.toISOString().replace('Z', `${parsed.subMs}Z`) : date.toISOString()} onCopied={copied} />
                    <Row label={`ISO 8601 (${localZone || 'local'})`} value={now === null ? '—' : isoIn(date, 'local')} onCopied={copied} />
                    <Row label="RFC 2822 (UTC)" value={rfc2822In(date, 'UTC')} onCopied={copied} />
                    <Row label="Unix seconds / milliseconds" value={`${parsed.seconds} / ${Math.floor(parsed.ms)}`} onCopied={copied} />
                  </div>
                </>
              )}
            </div>
          </Panel>

          <Panel title="Date → timestamp" description="Type an ISO 8601 or RFC 2822 date, or pick one. A time without Z or an offset is read in your local zone.">
            <div className="flex flex-wrap gap-2">
              <Input className="mono min-w-0 flex-1" value={dateText} onChange={(e) => setDateText(e.target.value)} placeholder="2024-01-15T09:30:00Z" aria-label="Date string" />
              <Input type="datetime-local" step="1" className="w-auto" onChange={(e) => e.target.value && setDateText(e.target.value)} aria-label="Pick a date and time (local)" />
            </div>
            <div className="mt-3 space-y-2" aria-live="polite">
              {fromDate?.error && <p className="text-sm text-rose-600 dark:text-rose-300">{fromDate.error}</p>}
              {fromDate?.date && (
                <>
                  <p className="t-muted text-xs">
                    {fromDate.assumed === 'local'
                      ? `No offset given — read as local time (${localZone || 'your zone'}).`
                      : fromDate.assumed === 'utc-date'
                        ? 'A date without a time is midnight UTC, as in JavaScript.'
                        : 'Offset given — the instant is exact.'}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <Row label="Unix seconds" value={Math.floor(fromDate.date.getTime() / 1000)} onCopied={copied} />
                    <Row label="Unix milliseconds" value={fromDate.date.getTime()} onCopied={copied} />
                    <Row label="ISO 8601 (UTC)" value={fromDate.date.toISOString()} onCopied={copied} />
                    <Row label="RFC 2822 (UTC)" value={rfc2822In(fromDate.date, 'UTC')} onCopied={copied} />
                  </div>
                </>
              )}
            </div>
          </Panel>
        </div>

        <Panel title="In other time zones" description={date ? `The timestamp above${live ? ' (live)' : ''}, in every zone you picked. Your list is saved in this browser.` : 'Enter a timestamp above.'}>
          <ZonePicker zones={zones} setZones={setZones} />
          {date && now !== null && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {zones.map((z) => (
                <div key={z} className="bd sunken relative rounded-xl border p-3.5">
                  <button type="button" onClick={() => removeZone(z)} className="t-faint hover-surface absolute top-2 right-2 rounded-md p-1" aria-label={`Remove ${zoneLabel(z)}`}>
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <div className="t-main text-xs font-semibold">{zoneLabel(z)}</div>
                  <div className="t-faint mono mt-0.5 text-[10px]">{z === 'local' ? localZone : z} · UTC{offsetOf(date, z)}</div>
                  <div className="mono t-main mt-2 text-xl font-bold tabular-nums">{fmt(date, z, { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })}</div>
                  <div className="t-muted mt-1 text-[11px]">{fmt(date, z, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="mt-2 flex items-center gap-1">
                    <code className="mono t-faint min-w-0 flex-1 truncate text-[10px]">{isoIn(date, z)}</code>
                    <CopyButton text={isoIn(date, z)} label="" onCopied={copied} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Batch convert"
          description="One timestamp or date per line — mixed units are fine."
          actions={
            <>
              <CopyButton text={batchCsv(batchRows)} label="Copy CSV" onCopied={() => toast('CSV copied')} />
              <Button variant="ghost" type="button" disabled={!batchRows.length} onClick={() => downloadFile(batchCsv(batchRows), 'timestamps.csv', 'text/csv')}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />.csv
              </Button>
            </>
          }
        >
          <TextArea rows={5} className="mono" value={batch} onChange={(e) => setBatch(e.target.value)} aria-label="Timestamps, one per line" />
          {batchRows.length > 0 && (
            <div className="bd mt-3 max-h-80 overflow-auto rounded-xl border">
              <table className="w-full text-left text-xs">
                <thead className="surface t-muted sticky top-0">
                  <tr>
                    <th className="px-2.5 py-1.5 font-semibold">Input</th>
                    <th className="px-2.5 py-1.5 font-semibold">Read as</th>
                    <th className="px-2.5 py-1.5 font-semibold">Unix seconds</th>
                    <th className="px-2.5 py-1.5 font-semibold">ISO 8601 (UTC)</th>
                  </tr>
                </thead>
                <tbody className="mono">
                  {batchRows.map((r, i) => (
                    <tr key={i} className="bd border-t">
                      <td className="max-w-[14rem] truncate px-2.5 py-1.5">{r.input}</td>
                      {r.error ? (
                        <td colSpan={3} className="px-2.5 py-1.5 font-sans text-rose-600 dark:text-rose-300">{r.error}</td>
                      ) : (
                        <>
                          <td className="t-muted px-2.5 py-1.5 font-sans">{r.unit ? UNIT_NAMES[r.unit] : 'date'}</td>
                          <td className="px-2.5 py-1.5">{r.seconds}</td>
                          <td className="px-2.5 py-1.5 whitespace-nowrap">{r.iso}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Current timestamp in code">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {SNIPPETS.map(([lang, code]) => (
              <div key={lang} className="bd sunken flex items-center gap-3 rounded-lg border px-3 py-2">
                <span className="t-muted w-20 shrink-0 text-xs font-semibold">{lang}</span>
                <code className="mono t-main min-w-0 flex-1 truncate text-xs" title={code}>{code}</code>
                <CopyButton text={code.split(/\s{2,}(?:\/\/|#)/)[0].trim()} label="" onCopied={copied} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
