import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PenLine, KeyRound, Braces, Binary, Wand2, Loader2, AlertTriangle } from 'lucide-react'
import { signJwt, generateKeyPair, randomSecret, ALGORITHMS, algParams } from '../lib/jwt'
import { handOff } from '../lib/handoff'
import { hrefFor } from '../lib/nav'
import { useDebounced } from '../lib/useDebounced'
import { useToast } from '../lib/toast'
import CodeEditor from '../components/CodeEditor'
import { Panel, Button, CopyButton, TextArea, Input, PageHeader, Select, Checkbox } from '../components/ui'

const DEFAULT_PAYLOAD = `{
  "iss": "https://auth.example.com/",
  "sub": "user_8f3a21",
  "aud": "api.example.com",
  "scope": "read:orders",
  "iat": 1767225600,
  "exp": 1767229200
}`
const QUICK = [
  ['+15 min', 900],
  ['+1 hour', 3600],
  ['+1 day', 86400],
  ['+7 days', 604800],
]

function parseObject(text, name) {
  try {
    const v = JSON.parse(text)
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return { error: `The ${name} must be a JSON object` }
    return { value: v }
  } catch (e) {
    return { error: `The ${name} is not valid JSON: ${e.message}` }
  }
}

/**
 * Builds and signs a JWT locally. Secrets and private keys live only in this
 * component's state: not in the URL, not in storage, not on the network.
 */
export default function JwtEncoderTool() {
  const [alg, setAlg] = useState('HS256')
  const [headerText, setHeaderText] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}')
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD)
  const [key, setKey] = useState('devpocket-demo-secret')
  const [b64, setB64] = useState(false)
  const [publicPem, setPublicPem] = useState('')
  const [generating, setGenerating] = useState(false)
  const [signed, setSigned] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()
  const hs = algParams(alg)?.family === 'HS'

  const header = useMemo(() => parseObject(headerText, 'header'), [headerText])
  const payload = useMemo(() => parseObject(payloadText, 'payload'), [payloadText])
  const req = useDebounced(JSON.stringify({ headerText, payloadText, key, b64 }), 200)

  useEffect(() => {
    const { headerText: h, payloadText: pl, key: k, b64: enc } = JSON.parse(req)
    const hd = parseObject(h, 'header')
    const pd = parseObject(pl, 'payload')
    if (hd.error || pd.error) return
    let live = true
    signJwt(hd.value, pd.value, k, { secretEncoding: enc ? 'base64' : 'utf8' })
      .then((token) => live && setSigned({ req, token }))
      .catch((e) => live && setSigned({ req, error: e.message }))
    return () => {
      live = false
    }
  }, [req])

  const current = signed && signed.req === req ? signed : null
  const inputError = header.error || payload.error

  function chooseAlg(a) {
    setAlg(a)
    setPublicPem('')
    if (!header.error) setHeaderText(JSON.stringify({ ...header.value, alg: a }, null, 2))
    const fam = algParams(a)?.family
    if (fam === 'HS' && !hs) setKey('devpocket-demo-secret')
    if (fam !== 'HS' && hs) setKey('')
  }

  function setTime(claim, offset) {
    if (payload.error) return
    const now = Math.floor(Date.now() / 1000)
    const next = { ...payload.value }
    if (claim === 'iat' || next.iat === undefined) next.iat = now
    if (claim === 'exp') next.exp = now + offset
    setPayloadText(JSON.stringify(next, null, 2))
  }

  async function generate() {
    setGenerating(true)
    try {
      if (hs) {
        setKey(randomSecret(alg))
        setB64(false)
        toast('Random secret generated in this tab')
      } else {
        const kp = await generateKeyPair(alg)
        setKey(kp.privatePem)
        setPublicPem(kp.publicPem)
        toast('Key pair generated in this tab')
      }
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  const open = (to, value) => {
    handOff(to, value)
    navigate(hrefFor(to))
  }
  const token = current?.token || ''

  return (
    <div>
      <PageHeader icon={PenLine} title="JWT Encoder" subtitle="Create and sign a JSON Web Token locally — HS, RS, PS, ES and EdDSA." accent="cyan" />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
          <Panel
            title="Header"
            actions={
              <Select value={alg} onChange={(e) => chooseAlg(e.target.value)} className="w-auto" aria-label="Algorithm">
                {ALGORITHMS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </Select>
            }
          >
            <CodeEditor language="json" rows={6} value={headerText} onChange={(e) => setHeaderText(e.target.value)} ariaLabel="Header JSON" />
            {header.error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{header.error}</p>}
            {!header.error && header.value.alg !== alg && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">The header says alg "{String(header.value.alg)}"; it is signed as {header.value.alg || alg} — pick it in the menu to switch keys.</p>}
          </Panel>

          <Panel title={hs ? 'Secret' : 'Private key'} description="Stays in this tab — never saved or sent.">
            {hs ? (
              <>
                <Input className="mono" value={key} onChange={(e) => setKey(e.target.value)} aria-label="Shared secret" autoComplete="off" spellCheck={false} />
                <div className="mt-2">
                  <Checkbox checked={b64} onChange={(e) => setB64(e.target.checked)} label="Secret is Base64-encoded" />
                </div>
              </>
            ) : (
              <TextArea rows={6} className="mono text-xs" value={key} onChange={(e) => setKey(e.target.value)} aria-label="Private key (PEM or JWK)" placeholder={'-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n\nor a private JWK'} spellCheck={false} />
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="subtle" type="button" onClick={generate} disabled={generating}>
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />}
                {hs ? 'Random secret' : 'Generate a test key pair'}
              </Button>
              {hs && <span className="t-faint text-xs">Use at least {Number(alg.slice(2)) / 8} random bytes for {alg}.</span>}
            </div>
            {publicPem && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="t-muted text-xs font-semibold">Public key (for verifying)</span>
                  <CopyButton text={publicPem} onCopied={() => toast('Public key copied')} />
                </div>
                <TextArea rows={4} className="mono text-xs" value={publicPem} readOnly aria-label="Generated public key" />
              </div>
            )}
          </Panel>
        </div>

        <Panel
          title="Payload"
          actions={
            <div className="flex flex-wrap items-center gap-1.5">
              <Button variant="ghost" type="button" onClick={() => setTime('iat')}>iat = now</Button>
              {QUICK.map(([label, sec]) => (
                <Button key={label} variant="ghost" type="button" onClick={() => setTime('exp', sec)} title={`exp = now ${label}`}>exp {label}</Button>
              ))}
            </div>
          }
        >
          <CodeEditor language="json" rows={10} value={payloadText} onChange={(e) => setPayloadText(e.target.value)} ariaLabel="Payload JSON" />
          {payload.error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{payload.error}</p>}
          <p className="t-faint mt-2 text-xs">The payload is only Base64URL-encoded, not encrypted: anyone with the token can read it.</p>
        </Panel>

        <Panel
          title="Signed token"
          actions={
            <>
              <CopyButton text={token} onCopied={() => toast('Token copied')} />
              <Button variant="subtle" type="button" disabled={!token} onClick={() => open('/jwt-decoder', token)}>
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />Open in JWT decoder
              </Button>
            </>
          }
        >
          <div aria-live="polite">
            {inputError ? (
              <p className="text-sm text-rose-600 dark:text-rose-300">{inputError}</p>
            ) : current?.error ? (
              <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{current.error}</p>
            ) : token ? (
              <div className="bd sunken mono rounded-lg border p-3 text-xs leading-relaxed break-all">
                <span className="text-rose-500 dark:text-rose-400">{token.split('.')[0]}</span>
                <span className="t-faint font-bold">.</span>
                <span className="text-sky-600 dark:text-sky-400">{token.split('.')[1]}</span>
                <span className="t-faint font-bold">.</span>
                <span className="text-emerald-600 dark:text-emerald-400">{token.split('.')[2]}</span>
              </div>
            ) : (
              <p className="t-faint flex items-center gap-1.5 text-sm"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />Signing…</p>
            )}
          </div>
          {token && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="ghost" type="button" onClick={() => open('/json-formatter', payloadText)}>
                <Braces className="h-3.5 w-3.5" aria-hidden="true" />Open payload in JSON formatter
              </Button>
              <Button variant="ghost" type="button" onClick={() => open('/base64', token.split('.')[1])}>
                <Binary className="h-3.5 w-3.5" aria-hidden="true" />Decode segment in Base64
              </Button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
