import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useToast } from '../lib/toast'
import SplitPane from '../components/SplitPane'
import CodeViewer from '../components/CodeViewer'
import { Panel, Button, CopyButton, TextArea, ErrorBanner, PageHeader } from '../components/ui'

const SAMPLE = `{
  "id": 1042,
  "name": "Ada Lovelace",
  "email": null,
  "tags": [],
  "address": { "city": "London", "zip": "" },
  "active": true,
  "score": 9.5
}`

/**
 * Shared shell for the single-purpose JSON tools. Each page supplies a
 * transform and its copy; everything else — live parsing, error reporting,
 * split panes, copy button — is handled here so the pages stay thin and
 * behave identically.
 */
export default function JsonToolPage({
  icon,
  title,
  subtitle,
  accent = 'sky',
  /** (parsedValue, options) => string  — the output text */
  transform,
  /** Optional controls rendered above the panes; receives (options, setOptions) */
  controls,
  defaultOptions = {},
  sample = SAMPLE,
  outputLanguage = 'json',
  inputLabel = 'JSON input',
  outputLabel = 'Result',
  outputPlaceholder = 'Paste JSON on the left — the result appears here automatically.',
}) {
  const [input, setInput] = useState(sample)
  const [options, setOptions] = useState(defaultOptions)
  const toast = useToast()

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    let parsed
    try {
      parsed = JSON.parse(input)
    } catch (e) {
      return { output: '', error: `Invalid JSON — ${e.message}` }
    }
    try {
      return { output: transform(parsed, options) ?? '', error: '' }
    } catch (e) {
      return { output: '', error: e.message }
    }
  }, [input, options, transform])

  return (
    <div>
      <PageHeader icon={icon} title={title} subtitle={subtitle} accent={accent} />

      <div className="space-y-4 p-4 sm:p-6">
        {controls && (
          <Panel>
            <div className="flex flex-wrap items-center gap-3">{controls(options, setOptions)}</div>
          </Panel>
        )}

        <SplitPane
          storageKey={`devpocket-split-${title.replace(/\s+/g, '-').toLowerCase()}`}
          left={
            <Panel
              title={inputLabel}
              actions={
                <>
                  <Button variant="ghost" type="button" onClick={() => setInput(sample)}>
                    Sample
                  </Button>
                  <Button variant="ghost" type="button" onClick={() => setInput('')}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                </>
              }
            >
              <TextArea rows={18} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste JSON here…" />
              <div className="mt-3">
                <ErrorBanner>{error}</ErrorBanner>
              </div>
            </Panel>
          }
          right={
            <Panel
              title={outputLabel}
              description={output ? `${output.split('\n').length} lines · updates as you type` : undefined}
              actions={<CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />}
            >
              <CodeViewer code={output} language={outputLanguage} placeholder={outputPlaceholder} />
            </Panel>
          }
        />
      </div>
    </div>
  )
}
