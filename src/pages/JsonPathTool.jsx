import { useMemo, useState } from 'react'
import { Waypoints, Trash2 } from 'lucide-react'
import { jsonPath } from '../lib/jsonops'
import { useToast } from '../lib/toast'
import CodeViewer from '../components/CodeViewer'
import { Panel, Button, CopyButton, TextArea, Input, ErrorBanner, PageHeader } from '../components/ui'

const SAMPLE = `{
  "store": {
    "book": [
      { "title": "Sayings of the Century", "author": "Nigel Rees", "price": 8.95 },
      { "title": "Moby Dick", "author": "Herman Melville", "price": 8.99 },
      { "title": "The Lord of the Rings", "author": "J. R. R. Tolkien", "price": 22.99 }
    ],
    "bicycle": { "color": "red", "price": 19.95 }
  }
}`

const EXAMPLES = [
  { expr: '$.store.book[*].title', note: 'every book title' },
  { expr: '$.store.book[0]', note: 'the first book' },
  { expr: '$..price', note: 'every price, at any depth' },
  { expr: '$.store.bicycle.color', note: 'a single nested value' },
  { expr: '$.store.*', note: 'everything under store' },
]

export default function JsonPathTool() {
  const [input, setInput] = useState(SAMPLE)
  const [expr, setExpr] = useState('$..price')
  const toast = useToast()

  const { output, error, count } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '', count: 0 }
    let parsed
    try {
      parsed = JSON.parse(input)
    } catch (e) {
      return { output: '', error: `Invalid JSON — ${e.message}`, count: 0 }
    }
    try {
      const matches = jsonPath(parsed, expr)
      return { output: JSON.stringify(matches, null, 2), error: '', count: matches.length }
    } catch (e) {
      return { output: '', error: e.message, count: 0 }
    }
  }, [input, expr])

  return (
    <div>
      <PageHeader
        icon={Waypoints}
        title="JSONPath Evaluator"
        subtitle="Query a document with $.path syntax and see the matches instantly."
        accent="indigo"
      />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel title="Expression" description="Supports dot paths, [index], [*] wildcards and .. recursive descent.">
          <Input value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="$.store.book[*].title" className="text-base" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.expr}
                type="button"
                onClick={() => setExpr(ex.expr)}
                title={ex.note}
                className={`mono rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                  ex.expr === expr ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-500' : 'bd t-muted hover-surface'
                }`}
              >
                {ex.expr}
              </button>
            ))}
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel
            title="Document"
            actions={
              <>
                <Button variant="ghost" type="button" onClick={() => setInput(SAMPLE)}>Sample</Button>
                <Button variant="ghost" type="button" onClick={() => setInput('')}><Trash2 className="h-3.5 w-3.5" />Clear</Button>
              </>
            }
          >
            <TextArea rows={16} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste JSON here…" />
            <div className="mt-3"><ErrorBanner>{error}</ErrorBanner></div>
          </Panel>

          <Panel
            title="Matches"
            description={output ? `${count} match${count === 1 ? '' : 'es'}` : undefined}
            actions={<CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />}
          >
            <CodeViewer code={output} language="json" placeholder="Matches appear here as you edit the expression." />
          </Panel>
        </div>
      </div>
    </div>
  )
}
