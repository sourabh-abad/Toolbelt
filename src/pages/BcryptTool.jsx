import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LockKeyhole, Lock, Eye, EyeOff, RefreshCw, CheckCircle2, XCircle, Trash2, ShieldCheck } from 'lucide-react'
import {
  VERSIONS,
  DEFAULT_VERSION,
  DEFAULT_COST,
  SLOW_ABOVE,
  MAX_PASSWORD_BYTES,
  parseHash,
  utf8Length,
  scaleCost,
  formatDuration,
} from '../lib/bcrypt'
import { useDebounced } from '../lib/useDebounced'
import { useToast } from '../lib/toast'
import { Panel, Button, CopyButton, TextArea, Input, PageHeader, Tabs, Select, ErrorBanner, StatRow } from '../components/ui'

const SAMPLE = 'correct horse battery staple'

// Costs offered in the menu. The format allows up to 31, but 16 already takes
// tens of seconds in JavaScript and nothing above it is used in practice.
const COSTS = Array.from({ length: 13 }, (_, i) => i + 4)
const COST_NOTES = {
  4: 'minimum, tests only',
  5: 'htpasswd -B',
  10: 'Spring, Node, Go, PHP ≤ 8.3',
  12: 'Rails, PHP 8.4+',
  14: 'slow',
  16: 'very slow',
}

/**
 * Runs one bcrypt job at a time in a Web Worker. Starting a new job
 * terminates the worker of the previous one — a bcrypt run cannot be
 * interrupted any other way — and the old promise simply never settles, so
 * callers guard results with a run id rather than waiting for a rejection.
 */
function useBcryptJob() {
  const ref = useRef(null)
  const cancel = useCallback(() => {
    ref.current?.terminate()
    ref.current = null
  }, [])
  useEffect(() => cancel, [cancel])
  const run = useCallback(
    (msg) => {
      cancel()
      if (typeof Worker === 'undefined') {
        const started = performance.now()
        return import('../lib/bcryptHash.js')
          .then((m) => (msg.op === 'verify' ? m.verifyPassword(msg.password, msg.hash) : m.hashPassword(msg.password, { cost: msg.cost, version: msg.version })))
          .then((result) => ({ result, ms: performance.now() - started }))
      }
      return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../lib/bcryptWorker.js', import.meta.url), { type: 'module' })
        ref.current = worker
        const done = () => {
          if (ref.current === worker) ref.current = null
          worker.terminate()
        }
        worker.onmessage = (e) => {
          done()
          if (e.data.ok) resolve({ result: e.data.result, ms: e.data.ms })
          else reject(new Error(e.data.error))
        }
        worker.onerror = (e) => {
          done()
          reject(new Error(e.message || 'The bcrypt worker failed to start'))
        }
        worker.postMessage({ id: 1, ...msg })
      })
    },
    [cancel],
  )
  // Stable identity: the verify effect lists this in its deps.
  return useMemo(() => ({ run, cancel }), [run, cancel])
}

function PasswordField({ id, value, onChange, onEnter, show, onToggle, placeholder }) {
  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) {
            e.preventDefault()
            onEnter()
          }
        }}
        autoComplete="off"
        autoCapitalize="off"
        data-1p-ignore
        data-lpignore="true"
        placeholder={placeholder}
        aria-label="Password"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="hover-surface t-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
      >
        {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  )
}

function ByteCount({ password }) {
  const bytes = utf8Length(password)
  const over = bytes > MAX_PASSWORD_BYTES
  return (
    <p className={`mt-2 text-xs ${over ? 'text-amber-800 dark:text-amber-400' : 't-muted'}`}>
      {bytes.toLocaleString()} of {MAX_PASSWORD_BYTES} bytes (UTF-8)
      {over && <> — bcrypt only looks at the first {MAX_PASSWORD_BYTES}. Everything after them is silently ignored, so a longer password verifies against the same hash.</>}
    </p>
  )
}

function HashParts({ parsed }) {
  return (
    <div className="space-y-1.5">
      <StatRow label="Version" value={`$${parsed.version}$`} />
      <StatRow label="Cost" value={`${parsed.cost}  (2^${parsed.cost} = ${(2 ** parsed.cost).toLocaleString()} rounds)`} />
      <StatRow label="Salt (22 chars)" value={parsed.salt} />
      <StatRow label="Hash (31 chars)" value={parsed.hash} />
    </div>
  )
}

export default function BcryptTool() {
  const [tab, setTab] = useState('hash')
  const [password, setPassword] = useState(SAMPLE)
  const [show, setShow] = useState(false)
  const [cost, setCost] = useState(DEFAULT_COST)
  const [version, setVersion] = useState(DEFAULT_VERSION)
  const toast = useToast()

  // --- Hash tab
  const hashJob = useBcryptJob()
  const hashRun = useRef(0)
  const [result, setResult] = useState(null) // { hash, ms, cost, version }
  const [hashing, setHashing] = useState(false)
  const [hashError, setHashError] = useState('')
  // One measured run — { cost, ms } — from which the menu estimates the others.
  const [calib, setCalib] = useState(null)

  const generate = useCallback(() => {
    const id = ++hashRun.current
    setHashing(true)
    setHashError('')
    hashJob
      .run({ op: 'hash', password, cost, version })
      .then(({ result: hash, ms }) => {
        if (id !== hashRun.current) return
        setResult({ hash, ms, cost, version })
        setCalib({ cost, ms })
        setHashing(false)
      })
      .catch((e) => {
        if (id !== hashRun.current) return
        setHashError(e.message)
        setHashing(false)
      })
  }, [hashJob, password, cost, version])

  // A quick cost-8 run on first visit, so the menu can show rough timings
  // before the first click. Replaced by the first real run's timing.
  useEffect(() => {
    const id = ++hashRun.current
    hashJob
      .run({ op: 'hash', password: 'calibrate', cost: 8, version: '2b' })
      .then(({ ms }) => id === hashRun.current && setCalib((c) => c || { cost: 8, ms }))
      .catch(() => {})
  }, [hashJob])

  const estimate = (c) => (calib ? scaleCost(calib.ms, calib.cost, c) : null)
  const chosenEstimate = estimate(cost)

  // --- Verify tab
  const verifyJob = useBcryptJob()
  const verifyRun = useRef(0)
  const [hashInput, setHashInput] = useState('')
  // Tagged with the inputs it answers, so a stale verdict is never shown for
  // new ones: { match, ms, hash, password } or { error, hash, password }.
  const [verdict, setVerdict] = useState(null)
  const debouncedPassword = useDebounced(password, 300)
  const debouncedHash = useDebounced(hashInput, 300)
  const parsed = useMemo(() => parseHash(debouncedHash), [debouncedHash])

  useEffect(() => {
    if (tab !== 'verify' || !parsed.valid) {
      verifyJob.cancel()
      return
    }
    const id = ++verifyRun.current
    const hash = parsed.full
    const pw = debouncedPassword
    verifyJob
      .run({ op: 'verify', password: pw, hash })
      .then(({ result: match, ms }) => id === verifyRun.current && setVerdict({ match, ms, hash, password: pw }))
      .catch((e) => id === verifyRun.current && setVerdict({ error: e.message, hash, password: pw }))
  }, [tab, parsed, debouncedPassword, verifyJob])

  const current = verdict && parsed.valid && verdict.hash === parsed.full && verdict.password === debouncedPassword ? verdict : null
  const hashIsStale = hashInput !== debouncedHash || password !== debouncedPassword
  const verifying = parsed.valid && (!current || hashIsStale)

  const verifyThis = () => {
    if (!result) return
    setHashInput(result.hash)
    setTab('verify')
  }

  const resultParsed = result ? parseHash(result.hash) : null

  return (
    <div>
      <PageHeader icon={LockKeyhole} title="Bcrypt Generator" subtitle="Hash a password with bcrypt at any cost factor, or check a password against an existing $2a$, $2b$ or $2y$ hash." accent="rose" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={tab} onChange={setTab} options={[{ value: 'hash', label: 'Hash' }, { value: 'verify', label: 'Verify' }]} />
          </div>
          <p className="t-muted mt-2 flex items-center gap-1.5 text-xs">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Computed by bcryptjs in a Web Worker in this tab. Passwords and hashes never leave your browser.
          </p>
        </Panel>

        {tab === 'hash' ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel
              title="Password"
              actions={
                <>
                  <Button variant="ghost" type="button" onClick={() => setPassword(SAMPLE)}>Sample</Button>
                  <Button variant="ghost" type="button" onClick={() => setPassword('')}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Clear
                  </Button>
                </>
              }
            >
              <PasswordField id="bcrypt-password" value={password} onChange={setPassword} onEnter={generate} show={show} onToggle={() => setShow((v) => !v)} placeholder="Password to hash — stays in this tab" />
              <ByteCount password={password} />

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="bcrypt-cost" className="t-muted mb-1.5 block text-xs font-semibold">Cost factor (rounds)</label>
                  <Select id="bcrypt-cost" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="w-full">
                    {COSTS.map((c) => {
                      const ms = estimate(c)
                      const bits = [c, COST_NOTES[c], ms != null ? `~${formatDuration(ms)}` : null].filter(Boolean)
                      return (
                        <option key={c} value={c}>
                          {bits.join(' · ')}
                        </option>
                      )
                    })}
                  </Select>
                </div>
                <div>
                  <span className="t-muted mb-1.5 block text-xs font-semibold">Prefix</span>
                  <Tabs value={version} onChange={setVersion} options={VERSIONS.map((v) => ({ value: v, label: `$${v}$` }))} />
                </div>
              </div>
              <p className="t-muted mt-2 text-xs">
                Cost {cost} means 2<sup>{cost}</sup> = {(2 ** cost).toLocaleString()} rounds of key setup
                {chosenEstimate != null && <>, about {formatDuration(chosenEstimate)} on this device</>}. Native bcrypt on a server is usually several times faster than JavaScript, so measure there before picking a production cost.
                {' '}The three prefixes are the same algorithm; pick the one your stack writes ($2y$ for PHP, $2a$ for Spring and Go, $2b$ for Node and OpenBSD).
              </p>
              {cost > SLOW_ABOVE && (
                <p className="mt-2 text-xs text-amber-800 dark:text-amber-400">
                  Cost {cost} is slow in a browser{chosenEstimate != null && <> — expect roughly {formatDuration(chosenEstimate)}</>}. The page stays responsive while it runs.
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button type="button" onClick={generate} disabled={hashing}>
                  <RefreshCw className={`h-3.5 w-3.5 ${hashing ? 'animate-spin' : ''}`} aria-hidden="true" />
                  {hashing ? 'Hashing…' : result ? 'Generate again' : 'Generate hash'}
                </Button>
                {hashing && (
                  <Button variant="ghost" type="button" onClick={() => { hashJob.cancel(); hashRun.current++; setHashing(false) }}>
                    Cancel
                  </Button>
                )}
              </div>
            </Panel>

            <Panel
              title="Bcrypt hash"
              description={result ? `${result.hash.length} characters · took ${formatDuration(result.ms)}` : undefined}
              actions={result && (
                <>
                  <CopyButton text={result.hash} onCopied={() => toast('Hash copied')} />
                  <Button variant="subtle" type="button" onClick={verifyThis}>
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Verify it
                  </Button>
                </>
              )}
            >
              <div aria-live="polite">
                {hashError && <ErrorBanner>{hashError}</ErrorBanner>}
                {!result && !hashError && (
                  <p className="t-faint text-sm">Click Generate (or press Enter in the password field). Each run uses a fresh random salt, so the same password gives a different hash every time — and every one of them verifies.</p>
                )}
                {result && resultParsed?.valid && (
                  <div className="space-y-3">
                    <code className="bd sunken t-main mono block rounded-xl border px-3 py-2.5 text-sm break-all">{result.hash}</code>
                    <HashParts parsed={resultParsed} />
                    <p className="t-muted text-xs">
                      Store the whole 60-character string. The cost and salt are inside it, which is how a verifier knows how to re-run the hash later.
                    </p>
                  </div>
                )}
              </div>
            </Panel>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel
              title="Password and hash"
              actions={
                <Button variant="ghost" type="button" onClick={() => { setPassword(''); setHashInput('') }}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Clear
                </Button>
              }
            >
              <label htmlFor="bcrypt-verify-password" className="t-muted mb-1.5 block text-xs font-semibold">Password</label>
              <PasswordField id="bcrypt-verify-password" value={password} onChange={setPassword} show={show} onToggle={() => setShow((v) => !v)} placeholder="Password to check" />
              <ByteCount password={password} />
              <label htmlFor="bcrypt-hash" className="t-muted mt-4 mb-1.5 block text-xs font-semibold">Bcrypt hash</label>
              <TextArea id="bcrypt-hash" rows={3} value={hashInput} onChange={(e) => setHashInput(e.target.value)} placeholder="$2b$10$…  (60 characters, from your users table, htpasswd file or config)" aria-describedby="bcrypt-verdict" />
            </Panel>

            <Panel title="Result" description={verifying ? 'Checking…' : undefined}>
              <div id="bcrypt-verdict" aria-live="polite" className="space-y-3">
                {!debouncedHash.trim() && <p className="t-faint text-sm">Paste a bcrypt hash. It is checked against the password as you type.</p>}
                {debouncedHash.trim() && !parsed.valid && <ErrorBanner>{parsed.reason}</ErrorBanner>}
                {parsed.valid && (
                  <>
                    {current?.error && !hashIsStale && <ErrorBanner>{current.error}</ErrorBanner>}
                    {current && !current.error && !hashIsStale && (
                      current.match ? (
                        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />Match — this password produces this hash{debouncedPassword === '' && ' (the empty password)'}
                        </p>
                      ) : (
                        <p className="flex items-center gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-300">
                          <XCircle className="h-4 w-4" aria-hidden="true" />No match{debouncedPassword === '' && ' — the password field is empty'}
                        </p>
                      )
                    )}
                    {verifying && <p className="t-muted text-sm">Checking…</p>}
                    <HashParts parsed={parsed} />
                    {current && !current.error && !hashIsStale && <p className="t-muted text-xs">Verified in {formatDuration(current.ms)} at cost {parsed.cost}.</p>}
                  </>
                )}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  )
}
