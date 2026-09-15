import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  FileText,
  Trash2,
  Upload,
  Download,
  Eye,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
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
// Full screen: the output pane leaves the split and covers the window, above the
// nav (z-40) but below toasts (z-60). Fixed rather than a layout change, so the
// pane is never unmounted and rendered Mermaid diagrams and scroll position survive.
const FULL_PANE = 'panel fixed inset-0 z-50 flex flex-col overflow-hidden'
const EDITOR_HIDDEN_KEY = 'devpocket-markdown-editor-hidden'

export default function MarkdownTool() {
  const [source, setSource] = useState(SAMPLE)
  const [view, setView] = useState('preview')
  const [syncScroll, setSyncScroll] = useState(true)
  const [fileName, setFileName] = useState('document')
  const [fullscreen, setFullscreen] = useState(false)
  // Preview-only: the editor is hidden and the rendered document takes the whole
  // page. Remembered, because someone who reads more than they write wants it
  // that way every time — the same reason the split position is remembered.
  const [editorHidden, setEditorHidden] = useState(() => {
    try {
      return localStorage.getItem(EDITOR_HIDDEN_KEY) === '1'
    } catch {
      return false
    }
  })
  const toast = useToast()
  const { theme } = useTheme()

  const fileInputRef = useRef(null)
  const editorRef = useRef(null)
  const previewRef = useRef(null)
  const outputRef = useRef(null)
  // How far down the document the reader was, kept across a full-screen toggle.
  const scrollRatio = useRef(0)
  // Guards the two scroll handlers against echoing each other into a loop.
  const scrollLock = useRef(null)
  const scrollTimer = useRef(0)

  // Typing stays instant; only the parse trails behind.
  const debouncedSource = useDebounced(source, 120)
  const html = useMemo(() => renderMarkdown(debouncedSource), [debouncedSource])
  const stats = useMemo(() => documentStats(source), [source])
  // React rewrites dangerouslySetInnerHTML whenever the prop OBJECT changes, not
  // just its string, so a fresh literal on every render wipes the SVGs Mermaid
  // drew into the preview — toggling any control used to blank the diagrams.
  // Memoising it means the markup is only written when the document changes.
  const previewHtml = useMemo(() => ({ __html: html }), [html])

  // Both modes leave the preview alone with the full width, which is too wide a
  // line to read comfortably and means there is no editor to sync scroll with.
  const previewOnly = fullscreen || editorHidden

  const toggleEditor = useCallback(() => {
    const next = !editorHidden
    setEditorHidden(next)
    try {
      localStorage.setItem(EDITOR_HIDDEN_KEY, next ? '1' : '0')
    } catch {
      // private mode, or storage disabled — the toggle still works this session
    }
  }, [editorHidden])

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

  // Hides the editor and gives the whole window to the rendered document. The
  // browser's own fullscreen is requested as well, so its chrome goes too; where
  // that is refused (iOS Safari, an iframe without the permission) the fixed
  // overlay still covers the viewport, so the button behaves the same either way.
  const toggleFullscreen = useCallback(() => {
    const pane = previewRef.current
    if (pane) {
      const range = pane.scrollHeight - pane.clientHeight
      scrollRatio.current = range > 0 ? pane.scrollTop / range : 0
    }
    if (fullscreen) {
      setFullscreen(false)
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    } else {
      setFullscreen(true)
      outputRef.current?.requestFullscreen?.().catch(() => {})
    }
  }, [fullscreen])

  // The pane changes height on the way in and out, and the browser clamps the
  // scroll offset to the new range — which drops the reader somewhere else in the
  // document. Restoring the ratio instead keeps them on the same paragraph.
  useLayoutEffect(() => {
    const pane = previewRef.current
    if (!pane) return
    const restore = () => {
      const range = pane.scrollHeight - pane.clientHeight
      if (range > 0) pane.scrollTop = scrollRatio.current * range
    }
    restore()
    // Again once the browser's own fullscreen transition has settled the size.
    const frame = requestAnimationFrame(restore)
    return () => cancelAnimationFrame(frame)
  }, [fullscreen])

  // Esc leaves, and so does leaving the browser's fullscreen by any other route
  // (Esc, F11, the OS), which fires fullscreenchange without touching the button.
  useEffect(() => {
    if (!fullscreen) return
    const leave = () => {
      setFullscreen(false)
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    }
    const onKey = (e) => e.key === 'Escape' && leave()
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.body.style.overflow = previousOverflow
    }
  }, [fullscreen])

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
          collapsed={previewOnly}
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
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={toggleEditor}
                    title="Hide the editor and show only the preview"
                  >
                    <PanelLeftClose className="h-3.5 w-3.5" />
                    Hide
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
            <div ref={outputRef} className={fullscreen ? FULL_PANE : PANE}>
              <div className={PANE_HEAD}>
                <Tabs options={VIEWS} value={view} onChange={setView} />
                <div className="flex items-center gap-2">
                  {!previewOnly && (
                    <Checkbox
                      checked={syncScroll}
                      onChange={(e) => setSyncScroll(e.target.checked)}
                      label="Sync scroll"
                    />
                  )}
                  {editorHidden && !fullscreen && (
                    <Button variant="ghost" type="button" onClick={toggleEditor} title="Bring the editor back">
                      <PanelLeftOpen className="h-3.5 w-3.5" />
                      Editor
                    </Button>
                  )}
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
                  <Button
                    variant={fullscreen ? 'default' : 'ghost'}
                    type="button"
                    onClick={toggleFullscreen}
                    aria-pressed={fullscreen}
                    title={fullscreen ? 'Exit full screen (Esc)' : 'Hide the editor and fill the screen'}
                  >
                    {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    {fullscreen ? 'Exit' : 'Full screen'}
                  </Button>
                </div>
              </div>

              {view === 'preview' ? (
                source.trim() ? (
                  <div
                    ref={previewRef}
                    className="min-h-0 flex-1 overflow-auto px-4 py-3"
                    onScroll={() => linkScroll(previewRef.current, editorRef.current, 'preview')}
                  >
                    {/* Full width would give a 1400px line length; cap the measure instead. */}
                    <div
                      className={`md-preview ${previewOnly ? 'mx-auto max-w-4xl' : ''}`}
                      dangerouslySetInnerHTML={previewHtml}
                    />
                  </div>
                ) : (
                  <div className="t-faint flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-sm">
                    <Eye className="h-5 w-5" aria-hidden="true" />
                    {previewOnly
                      ? 'Nothing to show yet — bring the editor back to write some Markdown.'
                      : 'Paste Markdown on the left to see it rendered here.'}
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
