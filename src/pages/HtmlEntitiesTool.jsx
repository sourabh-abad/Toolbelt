import { useMemo, useRef, useState } from 'react'
import { Ampersand, Trash2, Upload, Download } from 'lucide-react'
import { encodeEntities, decodeEntities, findReferences, MODES } from '../lib/entities'
import { useToast } from '../lib/toast'
import SplitPane from '../components/SplitPane'
import CodeViewer from '../components/CodeViewer'
import { Panel, Button, CopyButton, TextArea, PageHeader, Tabs } from '../components/ui'
import { plural } from '../lib/format'

const SAMPLES = {
  encode: `<p class="note">Tom & Jerry's "R&D" budget — €1,200 © 2024</p>`,
  decode: `&lt;a href=&quot;/search?q=caf&eacute;&amp;lang=fr&quot;&gt;Caf&#xE9; &mdash; menu&lt;/a&gt; &copy; 2024 &nbsp;&#128512;`,
}

export default function HtmlEntitiesTool() {
  const [mode, setMode] = useState('encode')
  const [strength, setStrength] = useState('minimal')
  const [input, setInput] = useState(SAMPLES.encode)
  const fileRef = useRef(null)
  const toast = useToast()

  const output = useMemo(
    () => (mode === 'encode' ? encodeEntities(input, strength) : decodeEntities(input)),
    [input, mode, strength]
  )
  const refs = useMemo(() => (mode === 'decode' ? findReferences(input).slice(0, 200) : []), [input, mode])
  const unterminated = refs.filter((r) => !r.terminated).length

  const switchMode = (m) => {
    setMode(m)
    setInput(SAMPLES[m])
  }

  function download() {
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = mode === 'encode' ? 'encoded.html' : 'decoded.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  function upload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then((t) => {
      setInput(t)
      toast(`Loaded ${file.name}`)
    })
    e.target.value = ''
  }

  return (
    <div>
      <PageHeader
        icon={Ampersand}
        title="HTML Entity Encoder"
        subtitle="Escape text for HTML, or turn &amp;entities; back into characters."
        accent="orange"
      />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={mode} onChange={switchMode} options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} />
            {mode === 'encode' && (
              <Tabs value={strength} onChange={setStrength} options={MODES.map((m) => ({ value: m.id, label: m.label }))} />
            )}
          </div>
          <p className="t-muted mt-2 text-xs">
            {mode === 'encode'
              ? MODES.find((m) => m.id === strength).hint
              : 'Named (&eacute;), decimal (&#233;) and hex (&#xE9;) references are all decoded.'}
          </p>
        </Panel>

        <SplitPane
          storageKey="devpocket-split-entities"
          left={
            <Panel
              title={mode === 'encode' ? 'Text' : 'HTML with entities'}
              actions={
                <>
                  <input ref={fileRef} type="file" accept=".html,.htm,.txt,.xml,text/*" onChange={upload} className="hidden" />
                  <Button variant="ghost" type="button" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" />Upload
                  </Button>
                  <Button variant="ghost" type="button" onClick={() => setInput(SAMPLES[mode])}>Sample</Button>
                  <Button variant="ghost" type="button" onClick={() => setInput('')}>
                    <Trash2 className="h-3.5 w-3.5" />Clear
                  </Button>
                </>
              }
            >
              <TextArea rows={14} value={input} onChange={(e) => setInput(e.target.value)} aria-label="Input" placeholder="Paste text or HTML…" />
            </Panel>
          }
          right={
            <Panel
              title={mode === 'encode' ? 'Encoded' : 'Decoded'}
              description={output ? plural([...output].length, 'character') : undefined}
              actions={
                <>
                  <CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />
                  <Button variant="subtle" type="button" onClick={download} disabled={!output}>
                    <Download className="h-3.5 w-3.5" />Download
                  </Button>
                </>
              }
            >
              <CodeViewer code={output} language="none" placeholder="The result appears here as you type." animate={false} />
              {mode === 'decode' && refs.length > 0 && (
                <div className="mt-4">
                  <h3 className="t-muted mb-1.5 text-xs font-semibold">
                    {plural(refs.length, 'reference')} found
                    {unterminated > 0 && <span className="text-amber-700 dark:text-amber-400"> · {unterminated} without a closing ;</span>}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {refs.map((r, i) => (
                      <span key={i} className={`bd sunken mono rounded-lg border px-2 py-1 text-xs ${r.terminated ? '' : 'border-amber-500/50'}`}>
                        <span className="t-muted">{r.ref}</span> <span className="t-main">{r.char === ' ' ? '[nbsp]' : r.char}</span>
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
