import { useEffect, useMemo, useRef, useState } from 'react'
import { Fingerprint, Trash2, FileText, CheckCircle2, XCircle, Lock, Eye, EyeOff } from 'lucide-react'
import { ALGORITHMS, HMAC_ALGORITHMS, digestAll, hmac, formatDigest, matchChecksum } from '../lib/hashing'
import { decodeToBytes } from '../lib/base64'
import { readBytes, formatBytes } from '../lib/files'
import { useDebounced } from '../lib/useDebounced'
import { useToast } from '../lib/toast'
import { FileDrop, UploadButton } from '../components/FileDrop'
import { Panel, Button, CopyButton, TextArea, Input, PageHeader, Tabs, Checkbox, ErrorBanner } from '../components/ui'

const SAMPLE = 'The quick brown fox jumps over the lazy dog'
const enc = (s) => new TextEncoder().encode(s)

// Files above this are hashed in a worker so the page stays responsive.
const WORKER_ABOVE = 1024 * 1024

function hashInWorker(bytes) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../lib/hashWorker.js', import.meta.url), { type: 'module' })
    worker.onmessage = (e) => {
      worker.terminate()
      if (e.data.ok) resolve(e.data.digests)
      else reject(new Error(e.data.error))
    }
    worker.onerror = (e) => {
      worker.terminate()
      reject(new Error(e.message || 'Worker failed'))
    }
    const copy = bytes.slice().buffer
    worker.postMessage({ id: 1, buffer: copy }, [copy])
  })
}

function DigestRows({ digests, format, highlight, toast }) {
  return (
    <div className="space-y-1.5">
      {ALGORITHMS.filter((a) => digests[a]).map((alg) => {
        const value = formatDigest(digests[alg], format)
        return (
          <div
            key={alg}
            className={`bd sunken flex items-center gap-3 rounded-lg border py-1 pr-1 pl-3 ${highlight === alg ? 'border-emerald-500/60 bg-emerald-500/10' : ''}`}
          >
            <span className="t-muted w-20 shrink-0 text-xs font-medium">{alg}</span>
            <code className="t-main mono min-w-0 flex-1 text-xs break-all sm:text-sm">{value}</code>
            <CopyButton text={value} label="" onCopied={() => toast(`${alg} copied`)} />
          </div>
        )
      })}
    </div>
  )
}

export default function HashGeneratorTool() {
  const [tab, setTab] = useState('hash')
  const [input, setInput] = useState(SAMPLE)
  const [file, setFile] = useState(null) // { name, size, bytes }
  const [format, setFormat] = useState('hex')
  const [expected, setExpected] = useState('')
  const [digests, setDigests] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const debounced = useDebounced(input, 120)
  const run = useRef(0)
  const toast = useToast()

  // HMAC state
  const [secret, setSecret] = useState('')
  const [secretIsB64, setSecretIsB64] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [macs, setMacs] = useState({})
  const [macError, setMacError] = useState('')

  useEffect(() => {
    const id = ++run.current
    const bytes = file ? file.bytes : enc(debounced)
    setError('')
    setBusy(Boolean(file))
    const job = file && bytes.length > WORKER_ABOVE && typeof Worker !== 'undefined' ? hashInWorker(bytes) : digestAll(bytes)
    job
      .then((d) => id === run.current && setDigests(d))
      .catch((e) => id === run.current && setError(e.message))
      .finally(() => id === run.current && setBusy(false))
  }, [debounced, file])

  useEffect(() => {
    if (tab !== 'hmac') return
    let cancelled = false
    ;(async () => {
      try {
        if (!secret) {
          setMacs({})
          setMacError('')
          return
        }
        const key = secretIsB64 ? decodeToBytes(secret) : enc(secret)
        const data = file ? file.bytes : enc(debounced)
        const out = {}
        for (const alg of HMAC_ALGORITHMS) out[`HMAC-${alg}`] = await hmac(alg, key, data)
        if (!cancelled) {
          setMacs(out)
          setMacError('')
        }
      } catch (e) {
        if (!cancelled) setMacError(e.message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tab, secret, secretIsB64, debounced, file])

  const check = useMemo(() => (expected.trim() ? matchChecksum(expected, tab === 'hmac' ? macs : digests) : null), [expected, digests, macs, tab])

  async function loadFile(f) {
    setFile({ name: f.name, size: f.size, bytes: await readBytes(f) })
    toast(`Hashing ${f.name} locally`)
  }

  const endsWithNewline = !file && /\n$/.test(input)

  return (
    <div>
      <PageHeader icon={Fingerprint} title="Hash Generator" subtitle="MD5, SHA-1, SHA-256, SHA-384 and SHA-512 of text or files, plus HMAC and checksum checks." accent="violet" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={tab} onChange={setTab} options={[{ value: 'hash', label: 'Hashes' }, { value: 'hmac', label: 'HMAC' }]} />
            <Tabs value={format} onChange={setFormat} options={[{ value: 'hex', label: 'hex' }, { value: 'HEX', label: 'HEX' }, { value: 'base64', label: 'Base64' }]} />
          </div>
          <p className="t-muted mt-2 flex items-center gap-1.5 text-xs">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Computed with your browser’s Web Crypto API. Text, files and HMAC secrets never leave this tab.
          </p>
        </Panel>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel
            title={file ? 'File' : 'Text'}
            description={file ? formatBytes(file.size) : `${enc(input).length.toLocaleString()} bytes (UTF-8)`}
            actions={
              <>
                <UploadButton onFile={loadFile} label="Hash a file" />
                <Button variant="ghost" type="button" onClick={() => { setFile(null); setInput(SAMPLE) }}>Sample</Button>
                <Button variant="ghost" type="button" onClick={() => { setFile(null); setInput('') }}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Clear
                </Button>
              </>
            }
          >
            <FileDrop onFile={loadFile}>
              {file ? (
                <div className="bd sunken flex items-center gap-3 rounded-xl border px-3 py-3 text-sm">
                  <FileText className="t-muted h-5 w-5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="t-main truncate font-medium">{file.name}</div>
                    <div className="t-muted text-xs">{busy ? 'Hashing…' : 'Hashed locally'}</div>
                  </div>
                  <Button variant="ghost" type="button" onClick={() => setFile(null)}>Remove</Button>
                </div>
              ) : (
                <TextArea rows={8} value={input} onChange={(e) => setInput(e.target.value)} aria-label="Text to hash" placeholder="Type text, or drop a file to hash it…" />
              )}
            </FileDrop>
            {endsWithNewline && (
              <p className="mt-2 text-xs text-amber-800 dark:text-amber-400">
                The text ends with a line break, and it is part of what gets hashed. That is what <code className="mono">echo "…" | sha256sum</code> hashes too; <code className="mono">echo -n</code> does not.
              </p>
            )}

            {tab === 'hmac' && (
              <div className="mt-4">
                <label htmlFor="hmac-secret" className="t-muted mb-1.5 block text-xs font-semibold">Secret key</label>
                <div className="flex items-center gap-2">
                  <Input
                    id="hmac-secret"
                    type={showSecret ? 'text' : 'password'}
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    autoComplete="off"
                    placeholder="HMAC secret — stays in this tab"
                  />
                  <button type="button" onClick={() => setShowSecret((v) => !v)} aria-label={showSecret ? 'Hide secret' : 'Show secret'} className="hover-surface t-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-lg">
                    {showSecret ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                <div className="mt-2">
                  <Checkbox checked={secretIsB64} onChange={(e) => setSecretIsB64(e.target.checked)} label="Secret is Base64-encoded" />
                </div>
              </div>
            )}

            <div className="mt-4">
              <label htmlFor="expected" className="t-muted mb-1.5 block text-xs font-semibold">Expected checksum (optional)</label>
              <Input id="expected" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="Paste a hex or Base64 digest, or a sha256sum line" aria-describedby="checksum-result" />
              <div id="checksum-result" aria-live="polite" className="mt-2">
                {check && !check.valid && <p className="t-muted text-xs">That is not a hex or Base64 digest.</p>}
                {check?.valid && check.match && (
                  <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />Match — {check.match}
                  </p>
                )}
                {check?.valid && !check.match && (
                  <p className="flex items-center gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-300">
                    <XCircle className="h-4 w-4" aria-hidden="true" />No match against any {tab === 'hmac' ? 'HMAC' : 'digest'} ({check.length * 8}-bit value)
                  </p>
                )}
              </div>
            </div>
          </Panel>

          <Panel title={tab === 'hmac' ? 'HMAC' : 'Digests'} description={busy ? 'Hashing…' : undefined}>
            <div aria-live="polite">{(error || macError) && <ErrorBanner>{error || macError}</ErrorBanner>}</div>
            {tab === 'hash' ? (
              <DigestRows digests={digests} format={format} highlight={check?.match} toast={toast} />
            ) : secret ? (
              <div className="space-y-1.5">
                {Object.entries(macs).map(([alg, bytes]) => {
                  const value = formatDigest(bytes, format)
                  return (
                    <div key={alg} className={`bd sunken flex items-center gap-3 rounded-lg border py-1 pr-1 pl-3 ${check?.match === alg ? 'border-emerald-500/60 bg-emerald-500/10' : ''}`}>
                      <span className="t-muted w-28 shrink-0 text-xs font-medium">{alg}</span>
                      <code className="t-main mono min-w-0 flex-1 text-xs break-all sm:text-sm">{value}</code>
                      <CopyButton text={value} label="" onCopied={() => toast(`${alg} copied`)} />
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="t-faint text-sm">Enter a secret to compute HMAC-SHA256, -SHA384 and -SHA512 of the text or file.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
