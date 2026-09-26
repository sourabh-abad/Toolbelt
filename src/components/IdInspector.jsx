import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle2, XCircle } from 'lucide-react'
import { inspectId } from '../lib/ids'
import { handOff } from '../lib/handoff'
import { hrefFor } from '../lib/nav'
import { Panel, Input } from './ui'

/** Validates a pasted UUID or ULID and shows its version, variant and embedded time. */
export default function IdInspector({ initial = '', title = 'Inspect an ID', description = 'Paste a UUID (any version, with or without hyphens, braces or urn:uuid:) or a ULID.' }) {
  const [value, setValue] = useState(initial)
  const info = useMemo(() => inspectId(value), [value])
  const navigate = useNavigate()
  return (
    <Panel title={title} description={description}>
      <Input className="mono" value={value} onChange={(e) => setValue(e.target.value)} placeholder="017f22e2-79b0-7cc3-98c4-dc0c0c07398f" aria-label="ID to inspect" spellCheck={false} />
      {info && (
        <div className="mt-3 space-y-1.5 text-sm" aria-live="polite">
          {info.valid ? (
            <>
              <p className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Valid {info.kind}{info.versionName ? ` — ${info.versionName}` : ''}</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                <dt className="t-muted">Canonical</dt>
                <dd className="mono t-main break-all">{info.canonical}</dd>
                {info.variant && (
                  <>
                    <dt className="t-muted">Variant</dt>
                    <dd className={info.standard === false ? 'text-amber-700 dark:text-amber-400' : 't-main'}>{info.variant}</dd>
                  </>
                )}
                {info.date && (
                  <>
                    <dt className="t-muted">Created</dt>
                    <dd className="t-main">
                      <span className="mono">{Number.isNaN(info.date.getTime()) ? 'out of range' : info.date.toISOString()}</span>
                      <button
                        type="button"
                        className="ml-2 inline-flex items-center gap-1 text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                        onClick={() => {
                          handOff('/timestamp', String(info.ms))
                          navigate(hrefFor('/timestamp'))
                        }}
                      >
                        <Clock className="h-3 w-3" aria-hidden="true" />Open in Timestamp Converter
                      </button>
                    </dd>
                  </>
                )}
                {!info.date && info.version === 4 && (
                  <>
                    <dt className="t-muted">Created</dt>
                    <dd className="t-faint">A v4 UUID is random — it carries no time</dd>
                  </>
                )}
              </dl>
            </>
          ) : (
            <p className="flex items-start gap-2 text-rose-600 dark:text-rose-300"><XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{info.error}</p>
          )}
        </div>
      )}
    </Panel>
  )
}
