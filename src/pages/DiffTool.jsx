import { useMemo, useState } from 'react'
import { diffLines, diffWordsWithSpace } from 'diff'
import { GitCompare, ArrowLeftRight, Trash2 } from 'lucide-react'
import { Panel, Button, TextArea, PageHeader, Checkbox } from '../components/ui'

const SAMPLE_A = `function greet(name) {
  console.log("Hello " + name);
}`

const SAMPLE_B = `function greet(name, punctuation = "!") {
  console.log(\`Hello, \${name}\${punctuation}\`);
}`

export default function DiffTool() {
  const [original, setOriginal] = useState(SAMPLE_A)
  const [modified, setModified] = useState(SAMPLE_B)
  const [mode, setMode] = useState('line')
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)

  const parts = useMemo(() => {
    if (mode === 'line') {
      return diffLines(original, modified, { ignoreWhitespace })
    }
    return diffWordsWithSpace(original, modified)
  }, [original, modified, mode, ignoreWhitespace])

  const stats = useMemo(() => {
    let added = 0
    let removed = 0
    for (const p of parts) {
      const count = mode === 'line' ? p.value.split('\n').filter((l, i, arr) => !(i === arr.length - 1 && l === '')).length : 1
      if (p.added) added += count
      if (p.removed) removed += count
    }
    return { added, removed }
  }, [parts, mode])

  function swap() {
    setOriginal(modified)
    setModified(original)
  }

  function clearAll() {
    setOriginal('')
    setModified('')
  }

  function loadSample() {
    setOriginal(SAMPLE_A)
    setModified(SAMPLE_B)
  }

  return (
    <div>
      <PageHeader icon={GitCompare} title="Diff Checker" subtitle="Compare two blocks of text line-by-line or word-by-word." accent="amber" />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Original">
            <TextArea rows={10} value={original} onChange={(e) => setOriginal(e.target.value)} placeholder="Paste original text…" />
          </Panel>
          <Panel title="Modified">
            <TextArea rows={10} value={modified} onChange={(e) => setModified(e.target.value)} placeholder="Paste modified text…" />
          </Panel>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            {['line', 'word'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  mode === m ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border border-transparent t-muted hover:sunken'
                }`}
              >
                {m} diff
              </button>
            ))}
          </div>
          {mode === 'line' && <Checkbox checked={ignoreWhitespace} onChange={(e) => setIgnoreWhitespace(e.target.checked)} label="Ignore whitespace" />}
          <Button variant="subtle" onClick={swap} type="button"><ArrowLeftRight className="h-3.5 w-3.5" />Swap</Button>
          <Button variant="ghost" onClick={loadSample} type="button">Sample</Button>
          <Button variant="ghost" onClick={clearAll} type="button"><Trash2 className="h-3.5 w-3.5" />Clear</Button>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="text-emerald-400">+{stats.added}</span>
            <span className="text-rose-400">-{stats.removed}</span>
          </div>
        </div>

        <Panel title="Result">
          <pre className="mono max-h-[480px] overflow-auto rounded-lg border bd sunken p-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {parts.map((part, i) => {
              const cls = part.added
                ? 'bg-emerald-500/10 text-emerald-300'
                : part.removed
                ? 'bg-rose-500/10 text-rose-300 line-through decoration-rose-500/40'
                : 't-muted'
              if (mode === 'line') {
                const lines = part.value.split('\n')
                if (lines[lines.length - 1] === '') lines.pop()
                return lines.map((line, j) => (
                  <div key={`${i}-${j}`} className={`${cls} px-1`}>
                    <span className="mr-2 select-none t-faint">{part.added ? '+' : part.removed ? '-' : ' '}</span>
                    {line || ' '}
                  </div>
                ))
              }
              return (
                <span key={i} className={cls}>
                  {part.value}
                </span>
              )
            })}
          </pre>
        </Panel>
      </div>
    </div>
  )
}
