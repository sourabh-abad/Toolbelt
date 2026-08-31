import { useMemo, useState } from 'react'
import { KeyRound, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react'
import { base64UrlDecode } from '../lib/utils'
import { useToast } from '../lib/toast'
import { Panel, CopyButton, TextArea, ErrorBanner, OutputBlock, PageHeader, StatRow, Button } from '../components/ui'
import CodeViewer from '../components/CodeViewer'

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzk5OTk5OTk5fQ.dQw4w9WgXcQ-dummySignature'

const DATE_CLAIMS = { iat: 'Issued at', exp: 'Expires', nbf: 'Not before' }

/** Structural checks we can honestly make without the signing key. */
function validate(token) {
  const trimmed = token.trim()
  if (!trimmed) return { checks: [], error: '' }

  const parts = trimmed.split('.')
  if (parts.length !== 3) {
    return { error: `A JWT has 3 dot-separated parts (header.payload.signature) — this has ${parts.length}.` }
  }

  let header
  let payload
  try {
    header = JSON.parse(base64UrlDecode(parts[0]))
  } catch {
    return { error: 'The header is not valid base64url-encoded JSON.' }
  }
  try {
    payload = JSON.parse(base64UrlDecode(parts[1]))
  } catch {
    return { error: 'The payload is not valid base64url-encoded JSON.' }
  }

  const now = Math.floor(Date.now() / 1000)
  const checks = []

  checks.push({ label: 'Structure', ok: true, detail: 'Three valid base64url segments' })

  if (header.alg) {
    const insecure = String(header.alg).toLowerCase() === 'none'
    checks.push({
      label: 'Algorithm',
      ok: !insecure,
      warn: insecure,
      detail: insecure ? `alg is "none" — the token is unsigned` : header.alg,
    })
  } else {
    checks.push({ label: 'Algorithm', ok: false, detail: 'No "alg" claim in the header' })
  }

  if (payload.exp) {
    const expired = payload.exp < now
    const secs = Math.abs(payload.exp - now)
    const rel = secs > 86400 ? `${Math.round(secs / 86400)} days` : secs > 3600 ? `${Math.round(secs / 3600)} hours` : `${Math.round(secs / 60)} min`
    checks.push({
      label: 'Expiry',
      ok: !expired,
      detail: expired ? `Expired ${rel} ago` : `Valid for another ${rel}`,
    })
  } else {
    checks.push({ label: 'Expiry', ok: true, warn: true, detail: 'No "exp" claim — this token never expires' })
  }

  if (payload.nbf && payload.nbf > now) {
    checks.push({ label: 'Not before', ok: false, detail: 'Token is not valid yet (nbf is in the future)' })
  }

  checks.push({
    label: 'Signature',
    ok: null,
    detail: 'Present, but not verified — that needs the signing key',
  })

  return { header, payload, signature: parts[2], checks, error: '' }
}

function CheckRow({ label, ok, warn, detail }) {
  const Icon = ok === null ? Clock : warn ? AlertTriangle : ok ? CheckCircle2 : XCircle
  const tone =
    ok === null ? 't-faint' : warn ? 'text-amber-500' : ok ? 'text-emerald-500' : 'text-rose-500'
  return (
    <div className="bd sunken flex items-start gap-2.5 rounded-lg border px-3 py-2">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} aria-hidden="true" />
      <div className="min-w-0">
        <div className="t-main text-xs font-medium">{label}</div>
        <div className="t-muted mono text-xs">{detail}</div>
      </div>
    </div>
  )
}

export default function JwtValidatorTool() {
  const [token, setToken] = useState(SAMPLE_JWT)
  const toast = useToast()
  const result = useMemo(() => validate(token), [token])

  return (
    <div>
      <PageHeader
        icon={KeyRound}
        title="JWT Decoder & Validator"
        subtitle="Decode and check a JSON Web Token — entirely in your browser."
        accent="cyan"
      />

      <div className="space-y-4 p-4 sm:p-6">
        <Panel
          title="Token"
          description="Nothing is sent anywhere, so pasting a real token is safe."
          actions={
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" type="button" onClick={() => setToken(SAMPLE_JWT)}>
                Sample
              </Button>
              <Button variant="ghost" type="button" onClick={() => setToken('')}>
                Clear
              </Button>
            </div>
          }
        >
          <TextArea rows={4} value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste a JWT…" />
          {result.error && (
            <div className="mt-3">
              <ErrorBanner>{result.error}</ErrorBanner>
            </div>
          )}
          {!result.error && token.trim().split('.').length === 3 && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-rose-500 dark:text-rose-400">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Header
                </span>
                <span className="flex items-center gap-1.5 font-medium text-sky-500 dark:text-sky-400">
                  <span className="h-2 w-2 rounded-full bg-sky-500" /> Payload
                </span>
                <span className="flex items-center gap-1.5 font-medium text-emerald-500 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Signature
                </span>
              </div>
              <div className="bd sunken mono break-all rounded-lg border p-3 text-xs leading-relaxed">
                <span className="text-rose-500 dark:text-rose-400">{token.trim().split('.')[0]}</span>
                <span className="font-bold text-zinc-400 dark:text-zinc-500">.</span>
                <span className="text-sky-500 dark:text-sky-400">{token.trim().split('.')[1]}</span>
                <span className="font-bold text-zinc-400 dark:text-zinc-500">.</span>
                <span className="text-emerald-500 dark:text-emerald-400">{token.trim().split('.')[2]}</span>
              </div>
            </div>
          )}
        </Panel>

        {!result.error && result.checks?.length > 0 && (
          <Panel title="Checks" description="Structural and time-based claims. Signature verification needs the key and is deliberately not done here.">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {result.checks.map((c) => (
                <CheckRow key={c.label} {...c} />
              ))}
            </div>
          </Panel>
        )}

        {!result.error && result.header && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel
              title="Header"
              actions={<CopyButton text={JSON.stringify(result.header, null, 2)} onCopied={() => toast('Header copied')} />}
            >
              <CodeViewer code={JSON.stringify(result.header, null, 2)} language="json" maxHeight="260px" />
            </Panel>

            <Panel
              title="Payload"
              actions={<CopyButton text={JSON.stringify(result.payload, null, 2)} onCopied={() => toast('Payload copied')} />}
            >
              <CodeViewer code={JSON.stringify(result.payload, null, 2)} language="json" maxHeight="260px" />
              {Object.keys(DATE_CLAIMS).some((f) => result.payload?.[f]) && (
                <div className="mt-3 space-y-1.5">
                  {Object.entries(DATE_CLAIMS)
                    .filter(([f]) => result.payload?.[f])
                    .map(([f, label]) => (
                      <StatRow key={f} label={`${label} (${f})`} value={new Date(result.payload[f] * 1000).toLocaleString()} />
                    ))}
                </div>
              )}
            </Panel>
          </div>
        )}

        {!result.error && result.signature && (
          <Panel title="Signature" description="Shown for reference. Verifying it would require pasting your signing secret into a web page, which this tool will not ask you to do.">
            <OutputBlock text={result.signature} />
          </Panel>
        )}
      </div>
    </div>
  )
}
