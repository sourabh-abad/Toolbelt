import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, ArrowLeft, Link2, Check, X } from 'lucide-react'
import { Panel, Input, PageHeader, Button, CopyButton } from './ui'
import CodeViewer from './CodeViewer'
import { useToast } from '../lib/toast'

/**
 * A searchable reference: categorised list on the left, one entry's full detail
 * on the right, everything addressable by URL. The SQL and Docker guides are the
 * same page over different catalogues — the knowledge lives in src/lib/*ref.js,
 * this file only knows how to search and lay it out.
 *
 * An entry is { id, title, category, kind, summary, syntax, example, explain,
 * notes[], variants[{ name, note, code?, lang? }], tags[], related[] }, and any
 * entry or variant may set `lang` to override the guide's default highlighting.
 */

const DEFAULT_LABELS = {
  syntax: 'Syntax',
  example: 'Example',
  explain: 'What it does',
  notes: 'Watch out for',
  variants: 'Variations',
  related: 'See also',
}

const KIND_TONES = {
  sky: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  violet: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
}

const CHIP_TONES = {
  cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  sky: 'border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  blue: 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
}

function Badge({ children, className = '' }) {
  return (
    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${className}`}>{children}</span>
  )
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

/** `kind` is the resolved entry from the guide's KINDS, or undefined. */
function KindBadge({ kind }) {
  if (!kind) return null
  return <Badge className={KIND_TONES[kind.tone] || KIND_TONES.sky}>{kind.label}</Badge>
}

function FilterChip({ active, tone, children, ...props }) {
  return (
    <button
      type="button"
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active ? CHIP_TONES[tone] || CHIP_TONES.cyan : 'bd t-muted hover-surface'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}

export default function GuidePage({
  icon,
  title,
  subtitle,
  accent = 'cyan',
  entries,
  categories,
  kinds,
  language = 'none',
  searchPlaceholder = 'Search…',
  searchLabel = 'Search this guide',
  emptyTitle = 'Pick an entry',
  emptyDescription = 'Or search above.',
  introText,
  introCode,
  introLang,
  labels: labelOverrides,
  variantsMono = false,
}) {
  const [params, setParams] = useSearchParams()
  const toast = useToast()
  const listRef = useRef(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const labels = { ...DEFAULT_LABELS, ...labelOverrides }

  // Derived from the catalogue rather than stored, so a guide only ships data.
  const { byId, categoryLabel, kindById, haystack } = useMemo(() => {
    const catLabel = Object.fromEntries(categories.map((c) => [c.id, c.label]))
    return {
      byId: Object.fromEntries(entries.map((e) => [e.id, e])),
      categoryLabel: catLabel,
      kindById: Object.fromEntries(kinds.map((k) => [k.id, k])),
      // Everything an entry can match on, flattened once, so typing is a
      // substring test rather than a walk of every nested field per keystroke.
      haystack: new Map(
        entries.map((e) => [
          e.id,
          [
            e.title,
            e.summary,
            e.explain,
            e.syntax,
            e.example,
            catLabel[e.category],
            (e.tags || []).join(' '),
            (e.notes || []).join(' '),
            (e.variants || []).map((v) => `${v.name} ${v.note}`).join(' '),
          ]
            .join(' | ')
            .toLowerCase(),
        ])
      ),
    }
  }, [entries, categories, kinds])

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

  /** Title hits rank above tag hits, which rank above summary and body hits. */
  const score = useCallback(
    (entry) => {
      const entryTitle = entry.title.toLowerCase()
      if (entryTitle === needle) return 0
      if (entryTitle.startsWith(needle)) return 1
      if (entryTitle.includes(needle)) return 2
      if ((entry.tags || []).some((t) => t.toLowerCase() === needle)) return 3
      if (entry.summary.toLowerCase().includes(needle)) return 4
      return haystack.get(entry.id).includes(needle) ? 5 : -1
    },
    [needle, haystack]
  )

  const results = useMemo(() => {
    const pool = category === 'all' ? entries : entries.filter((e) => e.category === category)
    if (!needle) return pool
    return pool
      .map((e) => ({ e, s: score(e) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => a.s - b.s)
      .map((r) => r.e)
  }, [needle, category, entries, score])

  // A selection the current filter hides would leave the detail pane showing
  // something you can no longer see in the list.
  const selected = byId[selectedId] && results.includes(byId[selectedId]) ? byId[selectedId] : null
  const cursor = selected ? results.indexOf(selected) : -1

  const select = useCallback((id) => setParam({ id }), [setParam])

  // Arrow keys walk the list from the search box, so an entry can be found
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

  // Keep the active row visible while arrowing through a long list. This scrolls
  // the list box itself rather than calling scrollIntoView, which would drag the
  // whole page down when a deep link opens an entry near the end of the catalogue.
  useEffect(() => {
    const box = listRef.current
    if (!selected || !box) return
    const row = box.querySelector(`[data-entry="${selected.id}"]`)
    if (!row) return
    const rowRect = row.getBoundingClientRect()
    const boxRect = box.getBoundingClientRect()
    const margin = 36 // clears the sticky category heading
    if (rowRect.top < boxRect.top + margin) box.scrollTop += rowRect.top - boxRect.top - margin
    else if (rowRect.bottom > boxRect.bottom) box.scrollTop += rowRect.bottom - boxRect.bottom + 8
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

  // One heading per category, in catalogue order, with its matches under it.
  const grouped = useMemo(() => {
    const buckets = new Map()
    for (const e of results) {
      if (!buckets.has(e.category)) buckets.set(e.category, [])
      buckets.get(e.category).push(e)
    }
    return categories.filter((c) => buckets.has(c.id)).map((c) => ({ ...c, items: buckets.get(c.id) }))
  }, [results, categories])

  return (
    <div>
      <PageHeader icon={icon} title={title} subtitle={subtitle} accent={accent} />

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
              placeholder={searchPlaceholder}
              aria-label={searchLabel}
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
            <FilterChip active={category === 'all'} tone={accent} onClick={() => setParam({ cat: '' })}>
              All ({entries.length})
            </FilterChip>
            {categories.map((c) => (
              <FilterChip
                key={c.id}
                active={category === c.id}
                tone={accent}
                onClick={() => setParam({ cat: c.id })}
                title={c.desc}
              >
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
                <p className="t-faint p-4 text-sm">Nothing matches “{q.trim()}”. Try a different keyword.</p>
              )}

              {grouped.map((group) => (
                <div key={group.id}>
                  <div className="bd sunken t-faint sticky top-0 z-10 border-b px-3 py-1.5 text-[10px] font-semibold tracking-wide uppercase">
                    {group.label}
                  </div>
                  <div className="p-1.5">
                    {group.items.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        data-entry={e.id}
                        onClick={() => select(e.id)}
                        className={`hover-surface block w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                          selected?.id === e.id ? 'sunken' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="t-main truncate text-sm font-medium">
                            <Highlight text={e.title} needle={needle} />
                          </span>
                          <KindBadge kind={kindById[e.kind]} />
                        </div>
                        <p className="t-muted mt-0.5 line-clamp-2 text-xs leading-relaxed">
                          <Highlight text={e.summary} needle={needle} />
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail */}
          <div className={selected ? '' : 'hidden lg:block'}>
            {selected ? (
              <div className="space-y-4">
                <Panel>
                  <div className="flex items-start gap-3">
                    <Button variant="ghost" onClick={() => setParam({ id: '' })} className="lg:hidden" type="button">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      List
                    </Button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="t-main mono text-base font-semibold">{selected.title}</h2>
                        <KindBadge kind={kindById[selected.kind]} />
                        <Badge className="bd t-muted">{categoryLabel[selected.category]}</Badge>
                      </div>
                      <p className="t-muted mt-1 text-sm leading-relaxed">{selected.summary}</p>
                    </div>
                    <Button variant="subtle" onClick={copyLink} type="button" title="Copy a link to this entry">
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link2 className="h-3.5 w-3.5" />}
                      {copiedLink ? 'Copied' : 'Link'}
                    </Button>
                  </div>
                </Panel>

                <Panel title={labels.syntax}>
                  <CodeViewer
                    code={selected.syntax}
                    language={selected.lang || language}
                    lineNumbers={false}
                    maxHeight="320px"
                  />
                </Panel>

                <Panel
                  title={labels.example}
                  actions={<CopyButton text={selected.example} onCopied={() => toast('Copied to clipboard')} />}
                >
                  <CodeViewer code={selected.example} language={selected.lang || language} maxHeight="440px" />
                </Panel>

                <Panel title={labels.explain}>
                  <p className="t-muted text-sm leading-relaxed">{selected.explain}</p>
                </Panel>

                {selected.notes?.length > 0 && (
                  <Panel title={labels.notes}>
                    <ul className="space-y-2">
                      {selected.notes.map((note, i) => (
                        <li key={i} className="flex gap-2 text-sm leading-relaxed">
                          <span className="t-faint shrink-0">•</span>
                          <span className="t-muted">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                )}

                {selected.variants?.length > 0 && (
                  <Panel title={labels.variants}>
                    <div className="space-y-2.5">
                      {selected.variants.map((v) => (
                        <div key={v.name} className="bd sunken rounded-lg border px-3 py-2.5">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className={`t-main text-xs font-semibold ${variantsMono ? 'mono' : ''}`}>{v.name}</span>
                            <span className="t-muted text-xs leading-relaxed">{v.note}</span>
                          </div>
                          {v.code && (
                            <div className="mt-2">
                              <CodeViewer
                                code={v.code}
                                language={v.lang || selected.lang || language}
                                lineNumbers={false}
                                animate={false}
                                maxHeight="220px"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}

                {selected.related?.length > 0 && (
                  <Panel title={labels.related}>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.related
                        .map((id) => byId[id])
                        .filter(Boolean)
                        .map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => select(r.id)}
                            className="bd hover-surface t-muted hover:t-main mono rounded-full border px-2.5 py-1 text-xs font-medium"
                          >
                            {r.title}
                          </button>
                        ))}
                    </div>
                  </Panel>
                )}
              </div>
            ) : (
              <Panel title={emptyTitle} description={emptyDescription}>
                {introText && <p className="t-muted text-sm leading-relaxed">{introText}</p>}
                {introCode && (
                  <div className="mt-3">
                    <CodeViewer
                      code={introCode}
                      language={introLang || language}
                      lineNumbers={false}
                      animate={false}
                      maxHeight="220px"
                    />
                  </div>
                )}
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
