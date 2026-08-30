import { useMemo, useState } from 'react'
import cronstrue from 'cronstrue'
import { CalendarClock, Zap } from 'lucide-react'
import { nextRuns, CRON_PRESETS } from '../lib/cron'
import { useToast } from '../lib/toast'
import { Panel, Button, CopyButton, Input, ErrorBanner, PageHeader, Select } from '../components/ui'

const ZONES = [
  { value: 'local', label: 'Local time' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Africa/Johannesburg', label: 'South Africa (SAST)' },
]

const FIELD_HELP = [
  { name: 'Minute', range: '0-59' },
  { name: 'Hour', range: '0-23' },
  { name: 'Day of month', range: '1-31' },
  { name: 'Month', range: '1-12 or JAN-DEC' },
  { name: 'Day of week', range: '0-6 or SUN-SAT' },
]

export default function CronTool() {
  const [expr, setExpr] = useState('0 9 * * 1-5')
  const [zone, setZone] = useState('local')
  const toast = useToast()

  const result = useMemo(() => {
    try {
      const description = cronstrue.toString(expr, { throwExceptionOnParseError: true })
      const runs = nextRuns(expr, 8)
      return { description, runs, error: '' }
    } catch (e) {
      return { description: '', runs: [], error: typeof e === 'string' ? e : e.message }
    }
  }, [expr])

  const fmt = (d) =>
    new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      ...(zone !== 'local' ? { timeZone: zone } : {}),
    }).format(d)

  const fields = expr.trim().split(/\s+/)

  return (
    <div>
      <PageHeader icon={CalendarClock} title="Cron Builder" subtitle="Decode cron expressions in plain English and preview the next runs." accent="lime" />
      <div className="space-y-4 p-6">
        <Panel>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              placeholder="* * * * *"
              className="flex-1 text-lg tracking-wide"
            />
            <div className="flex items-center gap-2">
              <Select value={zone} onChange={(e) => setZone(e.target.value)}>
                {ZONES.map((z) => (
                  <option key={z.value} value={z.value}>{z.label}</option>
                ))}
              </Select>
              <CopyButton text={expr} onCopied={() => toast('Expression copied')} />
            </div>
          </div>

          <div className="mono t-faint mt-3 grid grid-cols-5 gap-2 text-center text-[11px]">
            {FIELD_HELP.map((f, i) => (
              <div key={f.name} className="bd sunken rounded-lg border px-1 py-1.5">
                <div className="t-main text-sm font-semibold">{fields[i] ?? '–'}</div>
                <div className="mt-0.5">{f.name}</div>
                <div className="opacity-70">{f.range}</div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            {result.error ? (
              <ErrorBanner>{result.error}</ErrorBanner>
            ) : (
              <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 px-3 py-2.5 text-sm text-lime-700 dark:text-lime-300">
                <Zap className="mr-1.5 inline h-3.5 w-3.5" />
                {result.description}
              </div>
            )}
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Next 8 runs" description={zone === 'local' ? 'Shown in your local timezone.' : `Shown in ${ZONES.find((z) => z.value === zone)?.label}.`}>
            {result.runs.length ? (
              <div className="space-y-1.5">
                {result.runs.map((d, i) => (
                  <div key={i} className="bd sunken flex items-center gap-3 rounded-lg border px-3 py-2">
                    <span className="t-faint w-5 shrink-0 text-xs">{i + 1}</span>
                    <span className="mono t-main text-sm">{fmt(d)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="t-faint text-sm">
                {result.error ? 'Fix the expression to preview runs.' : 'No upcoming runs found in the next 4 years.'}
              </div>
            )}
          </Panel>

          <Panel title="Presets">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {CRON_PRESETS.map((p) => (
                <button
                  key={p.expr}
                  type="button"
                  onClick={() => setExpr(p.expr)}
                  className={`bd hover-surface flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors ${
                    p.expr === expr.trim() ? 'border-lime-500/40 bg-lime-500/10' : ''
                  }`}
                >
                  <span className="t-main text-xs font-medium">{p.label}</span>
                  <span className="mono t-faint text-[11px]">{p.expr}</span>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
