import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Trash2, Upload, Download, Eye } from 'lucide-react'
import { useToast } from '../lib/toast'
import { useTheme } from '../lib/theme'
import { useDebounced } from '../lib/useDebounced'
import { renderMarkdown, documentStats, hasMermaid, standaloneHtml } from '../lib/markdown'
import SplitPane from '../components/SplitPane'
import { Button, CopyButton, Tabs, Checkbox, PageHeader } from '../components/ui'

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

// Both panes fill what is left of the viewport under the sticky page header.
// This page is the editor — everything else on it is deliberately one line.
// Full height once the panes sit side by side; below lg they stack, where two
// full-viewport panes would mean scrolling past one to reach the other.
const PANE =
  'panel bd flex h-[65vh] min-h-[20rem] flex-col overflow-hidden rounded-2xl border lg:h-[calc(100vh-11.5rem)]'
const PANE_HEAD = 'bd flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b px-3 py-1.5'

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

  useEffect(() => () => window.clearTimeout(scrollTimer.current), [])

  // Mermaid is roughly the size of the rest of the app, so it is fetched only
  // once a document actually contains a diagram — and never at all for the
  // majority of visits.
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
          const { svg } = await mermaid.render(
            `md-mermaid-${i}-${Math.random().toString(36).slice(2, 8)}`,
            block.dataset.src
          )
          if (!cancelled) block.innerHTML = svg
        } catch (err) {
          if (!cancelled) {
            block.classList.add('md-mermaid-failed')
            block
              .querySelector('.md-mermaid-src')
              ?.insertAdjacentHTML(
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
        subtitle="Live GitHub-flavoured Markdown — tables, task lists, code and Mermaid diagrams."
        accent="blue"
      />

      <div className="p-3 sm:p-4">
        <SplitPane
          storageKey="devpocket-split-markdown"
          left={
            <div className={PANE}>
              <div className={PANE_HEAD}>
                <span className="t-faint text-[11px] tracking-wide uppercase">
                  Markdown
                  <span className="ml-2 normal-case">
                    {stats.words.toLocaleString()} words · ~{stats.readingMinutes} min
                  </span>
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" type="button" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" />
                    Open
                  </Button>
                  <Button variant="ghost" type="button" onClick={() => setSource(SAMPLE)}>
                    Sample
                  </Button>
                  <Button variant="ghost" type="button" onClick={() => setSource('')} title="Clear the editor">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.mdx,text/markdown,text/plain"
                onChange={handleOpenFile}
                className="hidden"
              />
              <textarea
                ref={editorRef}
                spellCheck={false}
                value={source}
                onChange={(e) => setSource(e.target.value)}
                onScroll={() => linkScroll(editorRef.current, previewRef.current, 'editor')}
                placeholder="Type or paste Markdown here…"
                className="mono t-main min-h-0 flex-1 resize-none bg-transparent px-3.5 py-3 text-sm leading-relaxed outline-none"
              />
            </div>
          }
          right={
            <div className={PANE}>
              <div className={PANE_HEAD}>
                <Tabs options={VIEWS} value={view} onChange={setView} />
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={syncScroll}
                    onChange={(e) => setSyncScroll(e.target.checked)}
                    label="Sync scroll"
                  />
                  <CopyButton text={html} label="HTML" onCopied={() => toast('HTML copied')} />
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
                </div>
              </div>

              {view === 'preview' ? (
                source.trim() ? (
                  <div
                    ref={previewRef}
                    className="md-preview min-h-0 flex-1 overflow-auto px-4 py-3"
                    onScroll={() => linkScroll(previewRef.current, editorRef.current, 'preview')}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ) : (
                  <div className="t-faint flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-sm">
                    <Eye className="h-5 w-5" aria-hidden="true" />
                    Paste Markdown on the left to see it rendered here.
                  </div>
                )
              ) : (
                <pre className="mono t-muted min-h-0 flex-1 overflow-auto px-3.5 py-3 text-xs whitespace-pre-wrap">
                  {html}
                </pre>
              )}
            </div>
          }
        />
      </div>
    </div>
  )
}
