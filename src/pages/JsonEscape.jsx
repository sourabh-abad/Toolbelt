import { Code } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useToast } from '../lib/toast'
import SplitPane from '../components/SplitPane'
import CodeViewer from '../components/CodeViewer'
import { Panel, Button, CopyButton, TextArea, ErrorBanner, PageHeader, Tabs } from '../components/ui'

const SAMPLE = `{"name":"Ada","quote":"She said \\"hello\\"","path":"C:\\\\temp"}`

/**
 * Escape and unescape share a page because they are inverse operations on the
 * same input — flipping the direction is one click rather than a navigation.
 */
export default function JsonEscape() {
  const [mode, setMode] = useState('escape')
  const [input, setInput] = useState(SAMPLE)
  const toast = useToast()

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      if (mode === 'escape') {
        // JSON.stringify of a string produces the quoted, escaped form; strip
        // the surrounding quotes so the result can be pasted into one.
        return { output: JSON.stringify(input).slice(1, -1), error: '' }
      }
      return { output: JSON.parse(`"${input.replace(/^"|"$/g, '')}"`), error: '' }
    } catch (e) {
      return { output: '', error: `Could not unescape — ${e.message}` }
    }
  }, [input, mode])

  return (
    <div>
      <PageHeader
        icon={Code}
        title="JSON Escape / Unescape"
        subtitle="Turn text into an escaped JSON string literal, or read one back."
        accent="violet"
      />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <Tabs
            value={mode}
            onChange={setMode}
            options={[
              { value: 'escape', label: 'Escape' },
              { value: 'unescape', label: 'Unescape' },
            ]}
          />
        </Panel>

        <SplitPane
          storageKey="devpocket-split-jsonescape"
          left={
            <Panel
              title={mode === 'escape' ? 'Raw text' : 'Escaped string'}
              actions={
                <>
                  <Button variant="ghost" type="button" onClick={() => setInput(SAMPLE)}>Sample</Button>
                  <Button variant="ghost" type="button" onClick={() => setInput('')}>
                    <Trash2 className="h-3.5 w-3.5" />Clear
                  </Button>
                </>
              }
            >
              <TextArea rows={16} value={input} onChange={(e) => setInput(e.target.value)} />
              <div className="mt-3"><ErrorBanner>{error}</ErrorBanner></div>
            </Panel>
          }
          right={
            <Panel
              title={mode === 'escape' ? 'Escaped' : 'Unescaped'}
              actions={<CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />}
            >
              <CodeViewer code={output} language="none" placeholder="Result appears here as you type." />
            </Panel>
          }
        />
      </div>
    </div>
  )
}
