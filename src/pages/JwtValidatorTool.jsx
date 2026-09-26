import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, CheckCircle2, XCircle, AlertTriangle, Info, ShieldCheck, ShieldX, Braces, Binary, Loader2, Trash2 } from 'lucide-react'
import { cleanToken, decodeJwt, verifyJwt, timeChecks, duration, CLAIMS, HEADER_FIELDS, TIME_CLAIMS, looksLikeMs } from '../lib/jwt'
import { handOff, takeHandoff } from '../lib/handoff'
import { hrefFor } from '../lib/nav'
import { useNow } from '../lib/useNow'
import { useDebounced } from '../lib/useDebounced'
import { useToast } from '../lib/toast'
import CodeViewer from '../components/CodeViewer'
import { Panel, Button, CopyButton, TextArea, Input, PageHeader, Checkbox } from '../components/ui'

// HS256, signed with the secret "devpocket-demo-secret" — press "Use the
// sample secret" to see verification succeed.
const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRlbW8tMjAyNiJ9.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20vIiwic3ViIjoidXNlcl84ZjNhMjEiLCJhdWQiOiJhcGkuZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRhIExvdmVsYWNlIiwic2NvcGUiOiJyZWFkOm9yZGVycyB3cml0ZTpvcmRlcnMiLCJpYXQiOjE3NjcyMjU2MDAsIm5iZiI6MTc2NzIyNTYwMCwiZXhwIjoyNTU2MDU3NjAwLCJqdGkiOiJiN2UxYzBkMi0zZjRhLTRjNWItOWU2Zi0xYTJiM2M0ZDVlNmYifQ.otbxfUvjHMFX5e0-t7Nfxc87fKQhYUDlTBVBn7oYD5E'
const SAMPLE_SECRET = 'devpocket-demo-secret'

const iso = (sec) => {
  const d = new Date(sec * 1000)
  return Number.isNaN(d.getTime()) ? 'invalid date' : d.toISOString().replace('.000Z', 'Z')
}
const show = (v) => (typeof v === 'string' ? v : JSON.stringify(v))

function Check({ tone, title, children }) {
  const Icon = tone === 'ok' ? CheckCircle2 : tone === 'bad' ? XCircle : tone === 'warn' ? AlertTriangle : Info
  const color = tone === 'ok' ? 'text-emerald-500' : tone === 'bad' ? 'text-rose-500' : tone === 'warn' ? 'text-amber-500' : 't-faint'
  return (
    <div className="bd sunken flex items-start gap-2.5 rounded-lg border px-3 py-2">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} aria-hidden="true" />
      <div className="min-w-0">
        <div className="t-main text-xs font-medium">{title}</div>
        <div className="t-muted text-xs">{children}</div>
      </div>
    </div>
  )
}

function VerifyPanel({ decoded }) {
  const [material, setMaterial] = useState('')
  const [b64, setB64] = useState(false)
  const [state, setState] = useState(null)
  const alg = decoded.header.alg
  const hs = /^HS/.test(alg || '')
  const debounced = useDebounced(material, 250)
  const key = `${decoded.signingInput}.${decoded.signature}|${alg}|${b64}|${debounced}`

  useEffect(() => {
    if (!debounced.trim()) return
    let live = true
    verifyJwt(decoded, debounced, { secretEncoding: b64 ? 'base64' : 'utf8' })
      .then((r) => live && setState({ key, ...r }))
      .catch((e) => live && setState({ key, error: e.message }))
    return () => {
      live = false
    }
    // key captures everything the verification depends on
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const result = debounced.trim() && state?.key === key ? state : null
  const pending = material.trim() && !result

  return (
    <Panel
      title="Verify the signature"
      description={`Algorithm from the header: ${alg || '(none)'}${decoded.header.kid ? ` · kid "${decoded.header.kid}"` : ''}. Verified with Web Crypto in this tab; the key never leaves it.`}
    >
      {alg === 'none' ? (
        <p className="text-sm text-rose-600 dark:text-rose-300">alg is "none": the token is unsigned and anyone could have written it. Reject it unless your system explicitly expects unsigned tokens.</p>
      ) : (
        <>
          {hs ? (
            <div className="space-y-2">
              <Input className="mono" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Shared secret" aria-label="Shared secret" autoComplete="off" spellCheck={false} />
              <div className="flex flex-wrap items-center gap-3">
                <Checkbox checked={b64} onChange={(e) => setB64(e.target.checked)} label="Secret is Base64-encoded" />
                {decoded.signature === SAMPLE_JWT.split('.')[2] && (
                  <button type="button" className="text-xs font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400" onClick={() => setMaterial(SAMPLE_SECRET)}>
                    Use the sample secret
                  </button>
                )}
              </div>
            </div>
          ) : (
            <TextArea
              rows={6}
              className="mono text-xs"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              aria-label="Public key, certificate, JWK or JWKS"
              placeholder={'-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----\n\nor a certificate, a JWK, or a JWKS {"keys": […]} — the key is picked by kid'}
              spellCheck={false}
            />
          )}
          {!hs && (
            <p className="t-faint mt-2 text-xs">
              Paste the JWKS JSON yourself (for example from /.well-known/jwks.json). This page never downloads keys from a URL — not even one named in the token.
            </p>
          )}
          {(decoded.header.jku || decoded.header.x5u) && (
            <p className="mt-2 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              The header names a key URL ({decoded.header.jku ? 'jku' : 'x5u'}). A verifier must use keys it already trusts; fetching from a URL the token chose lets an attacker supply their own key.
            </p>
          )}
          <div className="mt-3" aria-live="polite">
            {pending ? (
              <p className="t-faint flex items-center gap-1.5 text-sm"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />Verifying…</p>
            ) : result?.error ? (
              <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{result.error}</p>
            ) : result?.ok ? (
              <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />Signature verified ({result.alg}, {result.source}).
              </p>
            ) : result ? (
              <p className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
                <ShieldX className="h-4 w-4 shrink-0" aria-hidden="true" />Invalid signature: this key did not sign this token, or the token was changed after signing.
              </p>
            ) : null}
          </div>
        </>
      )}
    </Panel>
  )
}

export default function JwtValidatorTool() {
  const [raw, setRaw] = useState(SAMPLE_JWT)
  const now = useNow(1000)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    const v = takeHandoff('/jwt-decoder')
    if (typeof v === 'string') setRaw(v)
  }, [])

  const { token, notices } = useMemo(() => cleanToken(raw), [raw])
  const decoded = useMemo(() => decodeJwt(token), [token])
  const ok = decoded && !decoded.error
  const times = useMemo(() => (ok && now !== null ? timeChecks(decoded.payload, now) : {}), [ok, decoded, now])
  const payloadObj = ok && decoded.payload && typeof decoded.payload === 'object' && !Array.isArray(decoded.payload) ? decoded.payload : null

  const open = (to, value) => {
    handOff(to, value)
    navigate(hrefFor(to))
  }

  const exp = times.exp
  const parts = token.split('.')

  return (
    <div>
      <PageHeader icon={KeyRound} title="JWT Decoder" subtitle="Decode a JSON Web Token, check its expiry and verify its signature — in your browser." accent="cyan" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel
          title="Token"
          description="Paste the token, a whole Authorization header or a quoted string — the extras are removed."
          actions={
            <>
              <Button variant="ghost" type="button" onClick={() => setRaw(SAMPLE_JWT)}>Sample</Button>
              <Button variant="ghost" type="button" onClick={() => setRaw('')}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Clear</Button>
            </>
          }
        >
          <TextArea rows={4} className="mono text-xs" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="eyJhbGciOi…" aria-label="JWT" spellCheck={false} />
          <div className="mt-2 space-y-2" aria-live="polite">
            {notices.length > 0 && (
              <p className="t-muted flex items-start gap-1.5 text-xs"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{notices.join(' · ')}.</p>
            )}
            {decoded?.error && <p className="text-sm text-rose-600 dark:text-rose-300">{decoded.error}</p>}
          </div>
          {ok && (
            <div className="bd sunken mono mt-2 rounded-lg border p-3 text-xs leading-relaxed break-all">
              <span className="text-rose-500 dark:text-rose-400">{parts[0]}</span>
              <span className="t-faint font-bold">.</span>
              <span className="text-sky-600 dark:text-sky-400">{parts[1]}</span>
              <span className="t-faint font-bold">.</span>
              <span className="text-emerald-600 dark:text-emerald-400">{parts[2]}</span>
            </div>
          )}
        </Panel>

        {ok && (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
              {now === null ? (
                <Check tone="info" title="Expiry">Checking against your clock…</Check>
              ) : exp?.bad ? (
                <Check tone="bad" title="Expiry">{exp.bad}</Check>
              ) : exp ? (
                <Check tone={exp.ms ? 'warn' : exp.expired ? 'bad' : 'ok'} title={exp.expired ? 'Expired' : 'Expires in'}>
                  <span className="mono t-main text-sm font-semibold tabular-nums">{exp.expired ? `${duration(exp.delta)} ago` : duration(exp.delta)}</span>
                  <br />
                  {exp.ms ? 'exp looks like milliseconds — JWT times are seconds, so it will be read as a date far in the future' : iso(exp.value)}
                </Check>
              ) : (
                <Check tone="warn" title="Expiry">No exp claim — this token never expires.</Check>
              )}
              {times.nbf && !times.nbf.bad && times.nbf.notYet ? (
                <Check tone={times.nbf.withinLeeway ? 'warn' : 'bad'} title="Not valid yet">
                  nbf is {duration(times.nbf.delta)} in the future.
                  {times.nbf.skew ? ' That small a gap is usually clock skew between the issuer and this device; most libraries allow 30–60 s of leeway.' : ''}
                </Check>
              ) : (
                <Check tone={times.nbf ? 'ok' : 'info'} title="Not before">{times.nbf ? `Valid since ${iso(times.nbf.value)}` : 'No nbf claim'}</Check>
              )}
              <Check tone={decoded.header.alg === 'none' ? 'bad' : decoded.header.alg ? 'ok' : 'bad'} title="Algorithm">
                {decoded.header.alg === 'none' ? '"none" — unsigned token' : decoded.header.alg || 'No alg in the header'}
              </Check>
              {Object.values(times).some((t) => t.ms) ? (
                <Check tone="warn" title="Milliseconds?">
                  {Object.entries(times).filter(([, t]) => t.ms).map(([c]) => c).join(', ')} has 13 digits. JWT NumericDate is seconds since 1970 — divide by 1000 in the issuer.
                </Check>
              ) : times.iat?.future ? (
                <Check tone="warn" title="Issued in the future">iat is {duration(times.iat.delta)} ahead of this device’s clock.</Check>
              ) : (
                <Check tone="info" title="Signature">Not verified yet — add the key below.</Check>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="Header" actions={<CopyButton text={JSON.stringify(decoded.header, null, 2)} onCopied={() => toast('Header copied')} />}>
                <CodeViewer code={JSON.stringify(decoded.header, null, 2)} language="json" maxHeight="260px" ariaLabel="Decoded header" />
              </Panel>
              <Panel
                title="Payload"
                actions={
                  <>
                    <CopyButton text={JSON.stringify(decoded.payload, null, 2)} onCopied={() => toast('Payload copied')} />
                    <Button variant="subtle" type="button" onClick={() => open('/json-formatter', JSON.stringify(decoded.payload, null, 2))} title="Open payload in JSON formatter">
                      <Braces className="h-3.5 w-3.5" aria-hidden="true" />Open payload in JSON formatter
                    </Button>
                  </>
                }
              >
                <CodeViewer code={JSON.stringify(decoded.payload, null, 2)} language="json" maxHeight="260px" ariaLabel="Decoded payload" />
                <button type="button" onClick={() => open('/base64', parts[1])} className="t-muted mt-2 inline-flex items-center gap-1.5 text-xs underline-offset-2 hover:underline">
                  <Binary className="h-3.5 w-3.5" aria-hidden="true" />Decode segment in Base64
                </button>
              </Panel>
            </div>

            {payloadObj && (
              <Panel title="Claims" description="What each field means. Times are shown in UTC; JWT times are seconds since 1970.">
                <div className="bd overflow-x-auto rounded-xl border">
                  <table className="w-full text-left text-xs">
                    <thead className="surface t-muted">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Claim</th>
                        <th className="px-3 py-2 font-semibold">Value</th>
                        <th className="px-3 py-2 font-semibold">Meaning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...Object.entries(decoded.header).map(([k, v]) => ['header', k, v]), ...Object.entries(payloadObj).map(([k, v]) => ['payload', k, v])].map(([where, k, v]) => {
                        const info = where === 'header' ? HEADER_FIELDS[k] : CLAIMS[k]
                        const time = where === 'payload' && TIME_CLAIMS.includes(k) && typeof v === 'number'
                        return (
                          <tr key={`${where}.${k}`} className="bd border-t align-top">
                            <td className="mono px-3 py-2 whitespace-nowrap">
                              <span className="tok-key">{k}</span>
                              {where === 'header' && <span className="t-faint"> · header</span>}
                            </td>
                            <td className="mono t-main max-w-[22rem] px-3 py-2 break-all">
                              {show(v)}
                              {time && (
                                <div className="t-muted">
                                  {iso(looksLikeMs(v) ? v / 1000 : v)}
                                  {looksLikeMs(v) ? ' (if it were ms)' : ''}
                                </div>
                              )}
                            </td>
                            <td className="t-muted px-3 py-2">{info ? <><span className="t-main font-medium">{info[0]}.</span> {info[1]}</> : <span className="t-faint">Custom claim</span>}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            <VerifyPanel key={token} decoded={decoded} />
          </>
        )}
      </div>
    </div>
  )
}
