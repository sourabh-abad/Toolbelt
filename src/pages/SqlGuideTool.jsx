import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, Search as SearchIcon, ArrowLeft, Link2, Check, X } from 'lucide-react'
import { ENTRIES, CATEGORIES, KINDS, SAMPLE_SCHEMA } from '../lib/sqlref'
import { Panel, Input, PageHeader, Button, CopyButton } from '../components/ui'
import CodeViewer from '../components/CodeViewer'
import { useToast } from '../lib/toast'

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))
const KIND_BY_ID = Object.fromEntries(KINDS.map((k) => [k.id, k]))
const BY_ID = Object.fromEntries(ENTRIES.map((e) => [e.id, e]))

const KIND_TONES = {
  sky: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

/**
 * Everything an entry can be matched on, flattened once at module load so that
 * typing in the search box is a substring test over a prebuilt string rather
 * than a walk of every nested field on every keystroke.
 */
const HAYSTACK = new Map(
  ENTRIES.map((e) => [
    e.id,
    [
      e.title,
      e.summary,
      e.explain,
      e.syntax,
      e.example,
      CATEGORY_LABEL[e.category],
      (e.tags || []).join(' '),
      (e.notes || []).join(' '),
      (e.dialects || []).map((d) => `${d.db} ${d.note}`).join(' '),
    ]
      .join(' | ')
      .toLowerCase(),
  ])
)

/** Title hits rank above summary hits, which rank above body hits. */
function score(entry, needle) {
  const title = entry.title.toLowerCase()
  if (title === needle) return 0
  if (title.startsWith(needle)) return 1
  if (title.includes(needle)) return 2
  if ((entry.tags || []).some((t) => t.toLowerCase() === needle)) return 3
  if (entry.summary.toLowerCase().includes(needle)) return 4
  return HAYSTACK.get(entry.id).includes(needle) ? 5 : -1
}

/** Wraps every occurrence of the search term so the list shows why a row matched. */
function Highlight({ text, needle }) {
  if (!needle) return text
  const i = text.toLowerCase().indexOf(needle)
  if (i === -1) return text
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-amber-400/30 text-inherit">{text.slice(i, i + needle.length)}</mark>
      <Highlight text={text.slice(i + needle.length)} needle={needle} />
    </>
  )
}

function Badge({ children, className = '' }) {
  return (
    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${className}`}>{children}</span>
  )
}

function KindBadge({ kind }) {
  const k = KIND_BY_ID[kind]
  if (!k) return null
  return <Badge className={KIND_TONES[k.tone]}>{k.label}</Badge>
}

export default function SqlGuideTool() {
  const [params, setParams] = useSearchParams()
  const toast = useToast()
  const listRef = useRef(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const q = params.get('q') || ''
  const category = params.get('cat') || 'all'
  const selectedId = params.get('id') || ''
  const needle = q.trim().toLowerCase()

  const setParam = useCallback(
    (patch) => {
      const next = new URLSearchParams(params)
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      setParams(next, { replace: true })
    },
    [params, setParams]
  )

  const results = useMemo(() => {
    const pool = category === 'all' ? ENTRIES : ENTRIES.filter((e) => e.category === category)
    if (!needle) return pool
    return pool
      .map((e) => ({ e, s: score(e, needle) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => a.s - b.s)
      .map((r) => r.e)
  }, [needle, category])

  // A selection that the current filter hides would leave the detail pane
  // showing something you can no longer see in the list.
  const selected = BY_ID[selectedId] && results.includes(BY_ID[selectedId]) ? BY_ID[selectedId] : null
  const cursor = selected ? results.indexOf(selected) : -1

  const select = useCallback((id) => setParam({ id }), [setParam])

  // Arrow keys walk the list from the search box, so you can find an entry
  // without ever touching the mouse.
  const onSearchKey = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return
    if (!results.length) return
    e.preventDefault()
    if (e.key === 'Enter' && cursor === -1) return select(results[0].id)
    const delta = e.key === 'ArrowUp' ? -1 : 1
    const next = Math.min(results.length - 1, Math.max(0, cursor === -1 ? 0 : cursor + delta))
    select(results[next].id)
  }

  // Keep the active row visible while arrowing through a long list.
  useEffect(() => {
    if (!selected || !listRef.current) return
    const row = listRef.current.querySelector(`[data-entry="${selected.id}"]`)
    row?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      toast('Link copied')
      setTimeout(() => setCopiedLink(false), 1400)
    } catch {
      // clipboard blocked — nothing useful to say
    }
  }

  // One heading per category, in catalog order, with its matches under it.
  const grouped = useMemo(() => {
    const buckets = new Map()
    for (const e of results) {
      if (!buckets.has(e.category)) buckets.set(e.category, [])
      buckets.get(e.category).push(e)
    }
    return CATEGORIES.filter((c) => buckets.has(c.id)).map((c) => ({ ...c, items: buckets.get(c.id) }))
  }, [results])

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="SQL Query Guide"
        subtitle={`${ENTRIES.length} searchable queries, patterns and gotchas — with runnable examples.`}
        accent="cyan"
      />

      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="relative">
            <SearchIcon className="t-faint pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              autoFocus
              className="pl-9"
              value={q}
              onChange={(e) => setParam({ q: e.target.value })}
              onKeyDown={onSearchKey}
              placeholder="Search — join, duplicates, window, upsert, index, pagination…"
              aria-label="Search the SQL guide"
            />
            {q && (
              <button
                type="button"
                onClick={() => setParam({ q: '' })}
                aria-label="Clear search"
                className="t-faint hover:t-main absolute top-1/2 right-3 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <FilterChip active={category === 'all'} onClick={() => setParam({ cat: '' })}>
              All ({ENTRIES.length})
            </FilterChip>
            {CATEGORIES.map((c) => (
              <FilterChip key={c.id} active={category === c.id} onClick={() => setParam({ cat: c.id })} title={c.desc}>
                {c.label}
              </FilterChip>
            ))}
          </div>

          <p className="t-faint mt-3 text-xs">
            {results.length} {results.length === 1 ? 'entry' : 'entries'}
            {needle ? ` matching “${q.trim()}”` : ''} · arrow keys to move, Enter to open
          </p>
        </Panel>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
          {/* List — hidden on phones once an entry is open, so the detail gets the screen. */}
          <div className={selected ? 'hidden lg:block' : ''}>
            <div
              ref={listRef}
              className="panel rounded-2xl border lg:sticky lg:top-24 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto"
            >
              {!results.length && (
                <p className="t-faint p-4 text-sm">
                  Nothing matches “{q.trim()}”. Try a keyword like <em>join</em>, <em>index</em> or <em>duplicate</em>.
                </p>
              )}

              {grouped.map((group) => (
                <div key={group.id}>
                  <div className="bd sunken t-faint sticky top-0 z-10 border-b px-3 py-1.5 text-[10px] font-semibold tracking-wide uppercase">
                    {group.label}
                  </div>
                  <div className="p-1.5">
                    {group.items.map((e) => {
                      const active = selected?.id === e.id
                      return (
                        <button
                          key={e.id}
                          type="button"
                          data-entry={e.id}
                          onClick={() => select(e.id)}
                          className={`hover-surface block w-full rounded-lg px-2.5 py-2 text-left transition-colors ${active ? 'sunken' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="t-main truncate text-sm font-medium">
                              <Highlight text={e.title} needle={needle} />
                            </span>
                            <KindBadge kind={e.kind} />
                          </div>
                          <p className="t-muted mt-0.5 line-clamp-2 text-xs leading-relaxed">
                            <Highlight text={e.summary} needle={needle} />
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail */}
          <div className={selected ? '' : 'hidden lg:block'}>
            {selected ? (
              <EntryDetail
                entry={selected}
                onBack={() => setParam({ id: '' })}
                onOpen={select}
                onCopyLink={copyLink}
                copiedLink={copiedLink}
                onCopied={() => toast('Copied to clipboard')}
              />
            ) : (
              <EmptyDetail />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterChip({ active, children, ...props }) {
  return (
    <button
      type="button"
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'bd t-muted hover-surface'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}

function EmptyDetail() {
  return (
    <Panel title="Pick an entry" description="Or search above — the list covers syntax, recipes and the traps.">
      <p className="t-muted text-sm leading-relaxed">
        Every example on this page runs against the same small schema, so they read as one database rather than a pile
        of unrelated snippets:
      </p>
      <div className="mt-3">
        <CodeViewer code={SAMPLE_SCHEMA} language="sql" lineNumbers={false} animate={false} maxHeight="200px" />
      </div>
    </Panel>
  )
}

function EntryDetail({ entry, onBack, onOpen, onCopyLink, copiedLink, onCopied }) {
  const related = (entry.related || []).map((id) => BY_ID[id]).filter(Boolean)

  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex items-start gap-3">
          <Button variant="ghost" onClick={onBack} className="lg:hidden" type="button">
            <ArrowLeft className="h-3.5 w-3.5" />
            List
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="t-main mono text-base font-semibold">{entry.title}</h2>
              <KindBadge kind={entry.kind} />
              <Badge className="bd t-muted">{CATEGORY_LABEL[entry.category]}</Badge>
            </div>
            <p className="t-muted mt-1 text-sm leading-relaxed">{entry.summary}</p>
          </div>
          <Button variant="subtle" onClick={onCopyLink} type="button" title="Copy a link to this entry">
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link2 className="h-3.5 w-3.5" />}
            {copiedLink ? 'Copied' : 'Link'}
          </Button>
        </div>
      </Panel>

      <Panel title="Syntax">
        <CodeViewer code={entry.syntax} language="sql" lineNumbers={false} maxHeight="320px" />
      </Panel>

      <Panel title="Example" actions={<CopyButton text={entry.example} onCopied={onCopied} />}>
        <CodeViewer code={entry.example} language="sql" maxHeight="440px" />
      </Panel>

      <Panel title="What it does">
        <p className="t-muted text-sm leading-relaxed">{entry.explain}</p>
      </Panel>

      {entry.notes?.length > 0 && (
        <Panel title="Watch out for">
          <ul className="space-y-2">
            {entry.notes.map((note, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span className="t-faint shrink-0">•</span>
                <span className="t-muted">{note}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {entry.dialects?.length > 0 && (
        <Panel title="Dialect differences">
          <div className="space-y-2.5">
            {entry.dialects.map((d) => (
              <div key={d.db} className="bd sunken rounded-lg border px-3 py-2.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="t-main text-xs font-semibold">{d.db}</span>
                  <span className="t-muted text-xs leading-relaxed">{d.note}</span>
                </div>
                {d.code && (
                  <div className="mt-2">
                    <CodeViewer code={d.code} language="sql" lineNumbers={false} animate={false} maxHeight="220px" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {related.length > 0 && (
        <Panel title="See also">
          <div className="flex flex-wrap gap-1.5">
            {related.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onOpen(r.id)}
                className="bd hover-surface t-muted hover:t-main rounded-full border px-2.5 py-1 text-xs font-medium"
              >
                {r.title}
              </button>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}
