import { useMemo, useState } from 'react'
import { GitMerge, Trash2 } from 'lucide-react'
import { deepMerge } from '../lib/jsonops'
import { useToast } from '../lib/toast'
import CodeViewer from '../components/CodeViewer'
import { Panel, Button, CopyButton, TextArea, ErrorBanner, PageHeader, Checkbox } from '../components/ui'

const A = `{
  "name": "service-a",
  "replicas": 1,
  "env": { "LOG_LEVEL": "info", "REGION": "eu" },
  "ports": [8080]
}`

const B = `{
  "replicas": 3,
  "env": { "LOG_LEVEL": "debug" },
  "ports": [9090]
}`

export default function JsonMerge() {
  const [left, setLeft] = useState(A)
  const [right, setRight] = useState(B)
  const [shallow, setShallow] = useState(false)
  const toast = useToast()

  const { output, error } = useMemo(() => {
    if (!left.trim() || !right.trim()) return { output: '', error: '' }
    let a
    let b
    try {
      a = JSON.parse(left)
    } catch (e) {
      return { output: '', error: `Left document is invalid — ${e.message}` }
    }
    try {
      b = JSON.parse(right)
    } catch (e) {
      return { output: '', error: `Right document is invalid — ${e.message}` }
    }
    const merged = shallow ? { ...a, ...b } : deepMerge(a, b)
    return { output: JSON.stringify(merged, null, 2), error: '' }
  }, [left, right, shallow])

  return (
    <div>
      <PageHeader
        icon={GitMerge}
        title="JSON Merge"
        subtitle="Combine two JSON documents. The right-hand document wins on conflicts."
        accent="lime"
      />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-4">
            <Checkbox checked={shallow} onChange={(e) => setShallow(e.target.checked)} label="Shallow merge (top level only)" />
            <span className="t-faint text-xs">
              {shallow ? 'Nested objects are replaced wholesale.' : 'Nested objects merge recursively; arrays are replaced.'}
            </span>
            <Button variant="subtle" type="button" onClick={() => { setLeft(right); setRight(left) }}>
              Swap sides
            </Button>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Base document" actions={<Button variant="ghost" type="button" onClick={() => setLeft('')}><Trash2 className="h-3.5 w-3.5" />Clear</Button>}>
            <TextArea rows={12} value={left} onChange={(e) => setLeft(e.target.value)} placeholder="Paste the base JSON…" />
          </Panel>
          <Panel title="Overriding document" actions={<Button variant="ghost" type="button" onClick={() => setRight('')}><Trash2 className="h-3.5 w-3.5" />Clear</Button>}>
            <TextArea rows={12} value={right} onChange={(e) => setRight(e.target.value)} placeholder="Paste the JSON that should win…" />
          </Panel>
        </div>

        <ErrorBanner>{error}</ErrorBanner>

        <Panel
          title="Merged"
          description={output ? `${output.split('\n').length} lines` : undefined}
          actions={<CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />}
        >
          <CodeViewer code={output} language="json" placeholder="Paste two documents above to see the merged result." />
        </Panel>
      </div>
    </div>
  )
}
