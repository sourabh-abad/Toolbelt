import { useCallback, useEffect, useState } from 'react'
import { KeyRound, RefreshCw, ShieldCheck } from 'lucide-react'
import { useToast } from '../lib/toast'
import { Panel, Button, CopyButton, Input, Checkbox, PageHeader } from '../components/ui'

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?',
}
// Characters people misread when typing a password off a screen.
const AMBIGUOUS = /[Il1O0o]/g

/** Uniform random pick using crypto — Math.random() is not for secrets. */
function randomFrom(alphabet, length) {
  const out = []
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  // Rejection-free approach: modulo bias is negligible here, but we widen the
  // draw to 32 bits so it stays well under any practical threshold.
  for (let i = 0; i < length; i++) out.push(alphabet[bytes[i] % alphabet.length])
  return out.join('')
}

function strengthOf(pw, poolSize) {
  if (!pw) return { bits: 0, label: '—', tone: 't-faint', pct: 0 }
  const bits = Math.round(pw.length * Math.log2(poolSize || 1))
  if (bits < 50) return { bits, label: 'Weak', tone: 'text-rose-500', pct: 25 }
  if (bits < 75) return { bits, label: 'Fair', tone: 'text-amber-500', pct: 50 }
  if (bits < 110) return { bits, label: 'Strong', tone: 'text-emerald-500', pct: 75 }
  return { bits, label: 'Very strong', tone: 'text-emerald-500', pct: 100 }
}

export default function PasswordTool() {
  const [length, setLength] = useState(20)
  const [opts, setOpts] = useState({ lower: true, upper: true, digits: true, symbols: true, avoidAmbiguous: true })
  const [count, setCount] = useState(5)
  const [list, setList] = useState([])
  const toast = useToast()

  const generate = useCallback(() => {
    let alphabet = Object.entries(SETS)
      .filter(([k]) => opts[k])
      .map(([, v]) => v)
      .join('')
    if (opts.avoidAmbiguous) alphabet = alphabet.replace(AMBIGUOUS, '')
    if (!alphabet) {
      setList([])
      return 0
    }
    const n = Math.min(50, Math.max(1, Number(count) || 1))
    const len = Math.min(128, Math.max(4, Number(length) || 4))
    setList(Array.from({ length: n }, () => randomFrom(alphabet, len)))
    return alphabet.length
  }, [opts, count, length])

  const [poolSize, setPoolSize] = useState(0)
  useEffect(() => {
    setPoolSize(generate() || 0)
  }, [generate])

  const strength = strengthOf(list[0] || '', poolSize)

  return (
    <div>
      <PageHeader icon={KeyRound} title="Password Generator" subtitle="Cryptographically random passwords, generated in your browser and never transmitted." accent="rose" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel title="Options">
          <div className="flex flex-wrap items-end gap-5">
            <div>
              <label className="t-muted mb-1 block text-xs">Length</label>
              <Input type="number" min="4" max="128" value={length} onChange={(e) => setLength(e.target.value)} className="w-24" />
            </div>
            <div>
              <label className="t-muted mb-1 block text-xs">How many</label>
              <Input type="number" min="1" max="50" value={count} onChange={(e) => setCount(e.target.value)} className="w-24" />
            </div>
            <div className="flex flex-wrap gap-4">
              <Checkbox checked={opts.lower} onChange={(e) => setOpts({ ...opts, lower: e.target.checked })} label="a-z" />
              <Checkbox checked={opts.upper} onChange={(e) => setOpts({ ...opts, upper: e.target.checked })} label="A-Z" />
              <Checkbox checked={opts.digits} onChange={(e) => setOpts({ ...opts, digits: e.target.checked })} label="0-9" />
              <Checkbox checked={opts.symbols} onChange={(e) => setOpts({ ...opts, symbols: e.target.checked })} label="Symbols" />
              <Checkbox checked={opts.avoidAmbiguous} onChange={(e) => setOpts({ ...opts, avoidAmbiguous: e.target.checked })} label="No look-alikes (Il1O0)" />
            </div>
            <Button onClick={() => setPoolSize(generate() || 0)} type="button">
              <RefreshCw className="h-3.5 w-3.5" />Regenerate
            </Button>
          </div>

          {list.length > 0 && (
            <div className="bd mt-4 flex items-center gap-3 border-t pt-4">
              <ShieldCheck className={`h-4 w-4 ${strength.tone}`} aria-hidden="true" />
              <span className={`text-sm font-medium ${strength.tone}`}>{strength.label}</span>
              <span className="t-muted mono text-xs">≈{strength.bits} bits of entropy · {poolSize}-character pool</span>
              <div className="bd sunken ml-auto h-1.5 w-32 overflow-hidden rounded-full border">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300" style={{ width: `${strength.pct}%` }} />
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title={`Generated (${list.length})`}
          actions={<Button variant="ghost" type="button" onClick={() => { navigator.clipboard.writeText(list.join('\n')); toast('All passwords copied') }}>Copy all</Button>}
        >
          {list.length ? (
            <div className="stagger space-y-1.5">
              {list.map((pw, i) => (
                <div key={i} className="bd sunken mono flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
                  <span className="t-main break-all">{pw}</span>
                  <CopyButton text={pw} label="" />
                </div>
              ))}
            </div>
          ) : (
            <p className="t-faint text-sm">Select at least one character set.</p>
          )}
        </Panel>
      </div>
    </div>
  )
}
