import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Trash2, Upload, Download, Eye } from 'lucide-react'
import { useToast } from '../lib/toast'
import { useTheme } from '../lib/theme'
import { useDebounced } from '../lib/useDebounced'
import { renderMarkdown, documentStats, hasMermaid, standaloneHtml } from '../lib/markdown'
import SplitPane from '../components/SplitPane'
import { Panel, Button, CopyButton, TextArea, Tabs, Checkbox, PageHeader } from '../components/ui'

const SAMPLE = `# Release notes — v2.4.0

A **live preview** of GitHub-flavoured Markdown. Everything renders locally;
nothing you paste is uploaded.

## What changed

- [x] Idempotent prerender step
- [x] Per-route sitemap dates
- [ ] Incremental builds

> Deploys now take about 40 seconds, down from three minutes.

| Endpoint | Before | After |
| --- | ---: | ---: |
| \`GET /orders\` | 840 ms | 120 ms |
| \`POST /orders\` | 1.2 s | 310 ms |

### Migration

\`\`\`java
@Service
public class OrderService {
  private final OrderRepository repo;

  public Order find(long id) {
    return repo.findById(id).orElseThrow();
  }
}
\`\`\`

\`\`\`mermaid
flowchart LR
  Client -->|POST /orders| API
  API --> Queue[(Queue)]
  Queue --> Worker
  Worker --> DB[(Postgres)]
\`\`\`

See the [HTTP reference](/http) for the status codes involved.
`

const VIEWS = [
  { value: 'preview', label: 'Preview' },
  { value: 'html', label: 'HTML' },
]

export default function MarkdownTool() {
  const [source, setSource] = useState(SAMPLE)
  const [view, setView] = useState('preview')
  const [syncScroll, setSyncScroll] = useState(true)
  const [fileName, setFileName] = useState('document')
  const toast = useToast()
  const { theme } = useTheme()

  const fileInputRef = useRef(null)
  const editorRef = useRef(null)
  const previewRef = useRef(null)
  // Guards the two scroll handlers against echoing each other into a loop.
  const scrollLock = useRef(null)
  const scrollTimer = useRef(0)

  // Typing stays instant; only the parse trails behind.
  const debouncedSource = useDebounced(source, 120)
  const html = useMemo(() => renderMarkdown(debouncedSource), [debouncedSource])
  const stats = useMemo(() => documentStats(source), [source])

  // Mermaid is roughly the size of the rest of the app put together, so it is
  // fetched only once a document actually contains a diagram — and never at
  // all for the majority of visits.
  useEffect(() => () => window.clearTimeout(scrollTimer.current), [])

  useEffect(() => {
    const host = previewRef.current
    if (!host || view !== 'preview' || !hasMermaid(html)) return

    let cancelled = false
    const run = async () => {
      const blocks = host.querySelectorAll('.md-mermaid[data-src]')
      if (!blocks.length) return
      let mermaid
      try {
        ;({ default: mermaid } = await import('mermaid'))
      } catch {
        return // offline on first use, or the chunk failed to load
      }
      if (cancelled) return
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: theme === 'dark' ? 'dark' : 'default',
        fontFamily: 'inherit',
      })
      for (let i = 0; i < blocks.length; i++) {
        if (cancelled) return
        const block = blocks[i]
        try {
          const { svg } = await mermaid.render(`md-mermaid-${i}-${Math.random().toString(36).slice(2, 8)}`, block.dataset.src)
          if (!cancelled) block.innerHTML = svg
        } catch (err) {
          if (!cancelled) {
            block.classList.add('md-mermaid-failed')
            block.querySelector('.md-mermaid-src')?.insertAdjacentHTML(
              'beforebegin',
              `<p class="md-mermaid-error">Diagram error: ${String(err?.message || err).slice(0, 200)}</p>`
            )
          }
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [html, theme, view])

  // Proportional rather than line-mapped: a heading and its rendered form sit
  // at different offsets, and chasing an exact mapping fights the user.
  const linkScroll = useCallback(
    (from, to, key) => {
      if (!syncScroll || !from || !to) return
      if (scrollLock.current && scrollLock.current !== key) return
      scrollLock.current = key
      const range = from.scrollHeight - from.clientHeight
      const ratio = range > 0 ? from.scrollTop / range : 0
      to.scrollTop = ratio * (to.scrollHeight - to.clientHeight)
      window.clearTimeout(scrollTimer.current)
      scrollTimer.current = window.setTimeout(() => {
        scrollLock.current = null
      }, 80)
    },
    [syncScroll]
  )

  function handleOpenFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setSource(String(reader.result ?? ''))
      setFileName(file.name.replace(/\.mdx?$/i, '') || 'document')
      toast(`Loaded ${file.name}`)
    }
    reader.onerror = () => toast('Could not read that file', 'error')
    reader.readAsText(file)
    e.target.value = ''
  }

  function download(content, name, type) {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
    toast(`Downloaded ${name}`)
  }

  return (
    <div>
      <PageHeader
        icon={FileText}
        title="Markdown Preview"
        subtitle="Live GitHub-flavoured Markdown, with tables, task lists, code and Mermaid diagrams."
        accent="blue"
      />

      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs options={VIEWS} value={view} onChange={setView} />
            <Checkbox checked={syncScroll} onChange={(e) => setSyncScroll(e.target.checked)} label="Sync scrolling" />
            <span className="t-faint text-xs">
              {stats.words.toLocaleString()} words · {stats.characters.toLocaleString()} characters · {stats.lines.toLocaleString()} lines · ~
              {stats.readingMinutes} min read
            </span>
          </div>
        </Panel>

        <SplitPane
          storageKey="devpocket-split-markdown"
          left={
            <Panel
              title="Markdown"
              actions={
                <>
                  <Button variant="ghost" type="button" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" />
                    Open .md
                  </Button>
                  <Button variant="ghost" type="button" onClick={() => setSource(SAMPLE)}>
                    Sample
                  </Button>
                  <Button variant="ghost" type="button" onClick={() => setSource('')}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                </>
              }
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.mdx,text/markdown,text/plain"
                onChange={handleOpenFile}
                className="hidden"
              />
              <TextArea
                ref={editorRef}
                rows={22}
                value={source}
                onChange={(e) => setSource(e.target.value)}
                onScroll={() => linkScroll(editorRef.current, previewRef.current, 'editor')}
                placeholder="Type or paste Markdown here…"
                className="h-[60vh] overflow-auto"
              />
            </Panel>
          }
          right={
            <Panel
              title={view === 'preview' ? 'Preview' : 'HTML output'}
              actions={
                <>
                  <CopyButton text={html} label="Copy HTML" onCopied={() => toast('HTML copied')} />
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => download(standaloneHtml(html, fileName), `${fileName}.html`, 'text/html')}
                    title="Download a self-contained HTML file"
                  >
                    <Download className="h-3.5 w-3.5" />
                    .html
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => download(source, `${fileName}.md`, 'text/markdown')}
                    title="Download the Markdown source"
                  >
                    <Download className="h-3.5 w-3.5" />
                    .md
                  </Button>
                </>
              }
            >
              {view === 'preview' ? (
                source.trim() ? (
                  <div
                    ref={previewRef}
                    className="md-preview h-[60vh] overflow-auto pr-1"
                    onScroll={() => linkScroll(previewRef.current, editorRef.current, 'preview')}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ) : (
                  <div className="bd sunken t-faint flex h-[60vh] flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm">
                    <Eye className="h-5 w-5" aria-hidden="true" />
                    Paste Markdown on the left to see it rendered here.
                  </div>
                )
              ) : (
                <pre className="sunken bd mono t-muted h-[60vh] overflow-auto rounded-xl border p-3 text-xs whitespace-pre-wrap">
                  {html}
                </pre>
              )}
            </Panel>
          }
        />
      </div>
    </div>
  )
}
