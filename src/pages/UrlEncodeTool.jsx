import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Percent, Trash2, AlertTriangle, Link2 } from 'lucide-react'
import { encode, decode, looksDoubleEncoded, encodedCharacters } from '../lib/urlencode'
import { handOff } from '../lib/handoff'
import { hrefFor } from '../lib/nav'
import { useDebounced } from '../lib/useDebounced'
import { useToast } from '../lib/toast'
import SplitPane from '../components/SplitPane'
import { Panel, Button, CopyButton, TextArea, ErrorBanner, PageHeader, Tabs } from '../components/ui'

const SAMPLES = {
  encode: 'https://example.com/search?q=café & crème&tag=a/b',
  decode: 'https%253A%252F%252Fapp.example.com%252Fcallback%253Fstate%253Dab%2520cd',
}

export default function UrlEncodeTool() {
  const [mode, setMode] = useState('encode')
  const [scope, setScope] = useState('component')
  const [space, setSpace] = useState('%20')
  const [input, setInput] = useState(SAMPLES.encode)
  const debounced = useDebounced(input, 120)
  const navigate = useNavigate()
  const toast = useToast()

  const { output, error } = useMemo(() => {
    if (!debounced) return { output: '', error: '' }
    try {
      const out =
        mode === 'encode'
          ? encode(debounced, { mode: scope, space })
          : decode(debounced, { mode: scope, plusAsSpace: space === '+' })
      return { output: out, error: '' }
    } catch (e) {
      return { output: '', error: e.message }
    }
  }, [debounced, mode, scope, space])

  // %25XX in the input means a % was itself encoded; if the result still has
  // escapes in it, one more decode is what the sender meant.
  const doubleEncoded = mode === 'decode' && looksDoubleEncoded(debounced) && /%[0-9A-Fa-f]{2}/.test(output)
  const changed = useMemo(() => (mode === 'encode' ? encodedCharacters(debounced).slice(0, 24) : []), [debounced, mode])
  const urlToInspect = mode === 'decode' ? output : debounced

  const switchMode = (m) => {
    setMode(m)
    setInput(output || SAMPLES[m])
  }

  return (
    <div>
      <PageHeader icon={Percent} title="URL Encoder" subtitle="Percent-encode or decode URLs and query values as you type." accent="sky" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={mode} onChange={switchMode} options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} />
            <Tabs
              value={scope}
              onChange={setScope}
              options={[
                { value: 'component', label: 'Component (encodeURIComponent)' },
                { value: 'uri', label: 'Full URI (encodeURI)' },
              ]}
            />
            <Tabs value={space} onChange={setSpace} options={[{ value: '%20', label: 'Space as %20' }, { value: '+', label: 'Space as +' }]} />
          </div>
          <p className="t-muted mt-2 text-xs">
            {scope === 'component'
              ? 'Component mode encodes everything that could end a value — & = ? / # — so use it for one query value or path segment.'
              : 'Full-URI mode keeps : / ? # & = intact so a whole URL stays navigable; it only encodes spaces, non-ASCII and a few unsafe characters.'}
          </p>
        </Panel>

        <SplitPane
          storageKey="devpocket-split-urlencode"
          left={
            <Panel
              title={mode === 'encode' ? 'Text' : 'Encoded'}
              actions={
                <>
                  <Button variant="ghost" type="button" onClick={() => setInput(SAMPLES[mode])}>Sample</Button>
                  <Button variant="ghost" type="button" onClick={() => setInput('')}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Clear
                  </Button>
                </>
              }
            >
              <TextArea rows={10} value={input} onChange={(e) => setInput(e.target.value)} aria-label={mode === 'encode' ? 'Text to encode' : 'Text to decode'} />
            </Panel>
          }
          right={
            <Panel
              title={mode === 'encode' ? 'Encoded' : 'Decoded'}
              actions={
                <>
                  <CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />
                  <Button
                    variant="subtle"
                    type="button"
                    disabled={!urlToInspect}
                    onClick={() => {
                      handOff('/url-parser', urlToInspect)
                      navigate(hrefFor('/url-parser'))
                    }}
                  >
                    <Link2 className="h-3.5 w-3.5" aria-hidden="true" />Inspect in URL parser
                  </Button>
                </>
              }
            >
              <div aria-live="polite">{error && <ErrorBanner>{error}</ErrorBanner>}</div>
              {output ? <TextArea rows={10} value={output} readOnly aria-label="Result" /> : !error && <p className="t-faint text-sm">The result appears here as you type.</p>}
              {doubleEncoded && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1">The input contained %25XX and the result still has escapes in it — it was encoded twice.</span>
                  <Button variant="subtle" type="button" onClick={() => setInput(output)}>Decode again</Button>
                </div>
              )}
              {changed.length > 0 && (
                <div className="mt-4">
                  <h3 className="t-muted mb-1.5 text-xs font-semibold">Characters that were encoded (component rules)</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {changed.map(([ch, enc]) => (
                      <span key={ch} className="bd sunken mono rounded-lg border px-2 py-1 text-xs">
                        <span className="t-main">{ch === ' ' ? '␠' : ch}</span> <span className="t-muted">{enc}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          }
        />
      </div>
    </div>
  )
}
