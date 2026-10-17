import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Keyboard, Lock, UserX, UploadCloud, Zap, Star, History, MessageSquarePlus, Bug, Lightbulb, Search, X, SearchX } from 'lucide-react'
import { openFeedback } from '../lib/feedback'
import { navItems, NAV_GROUPS, getRecent, hrefFor } from '../lib/nav'
import { useFavorites } from '../lib/favorites'
import { searchTools } from '../lib/search'
import ToolCard from '../components/ToolCard'
import { shortcutLabel } from '../lib/platform'
import { useClientValue } from '../lib/hydration'

const BADGES = [
  { icon: Lock, label: '100% client-side' },
  { icon: UserX, label: 'No signup' },
  { icon: UploadCloud, label: 'No uploads' },
  { icon: Zap, label: 'Fast & private' },
]

const TOOLS = navItems.filter((n) => n.group)
const groupId = (group) => `group-${group.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

export default function Home() {
  const { favorites } = useFavorites()
  // Recent tools live in localStorage. Read after mount — the static HTML has
  // none, and the first client render has to match it — then on focus, in
  // case another tab navigated.
  const [recent, setRecent] = useState([])
  useEffect(() => {
    const refresh = () => setRecent(getRecent())
    refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])
  const shortcut = useClientValue(() => shortcutLabel('K'), 'Ctrl K')

  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const q = query.trim()
  // Same ranking as the ⌘K palette (src/lib/search.js): name, keywords
  // (sha256, epoch, k8s…), description — every word has to match.
  const matches = useMemo(() => (q ? searchTools(TOOLS, q) : TOOLS), [q])

  // "/" focuses the filter from anywhere on the page, the way GitHub and
  // most docs sites do; Escape clears it. Typing in another field is left alone.
  useEffect(() => {
    function onKey(e) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onInputKey = (e) => {
    if (e.key === 'Escape') {
      setQuery('')
      e.currentTarget.blur()
    } else if (e.key === 'Enter' && q && matches[0]) {
      navigate(hrefFor(matches[0].to))
    }
  }

  const favoriteItems = favorites.map((p) => navItems.find((n) => n.to === p)).filter(Boolean)
  const recentItems = recent.filter((r) => !favorites.includes(r.to))

  return (
    <div>
      <div className="bd border-b px-5 pt-10 pb-8 sm:px-8 sm:pt-14 sm:pb-10">
        <h1 className="t-main max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Developer tools that{' '}
          <span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">stay in your browser</span>.
        </h1>
        <p className="t-muted mt-3 max-w-xl text-sm leading-relaxed">
          Format JSON, decode JWTs, generate UUIDs, test regex, convert timestamps and solve the small things you
          hit a dozen times a day. Paste, process, copy — {TOOLS.length} tools, no signup, nothing uploaded.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {BADGES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="bd sunken inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium t-muted"
            >
              <Icon className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>

        <div className="t-muted mt-4 hidden items-center gap-1.5 text-xs sm:flex">
          <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
          <kbd className="bd rounded border px-1.5 py-0.5">{shortcut}</kbd> to jump straight to a tool from any page
        </div>
      </div>

      <ToolFinder
        inputRef={inputRef}
        query={query}
        onQuery={setQuery}
        onKeyDown={onInputKey}
        matchCount={q ? matches.length : null}
        total={TOOLS.length}
        filtering={Boolean(q)}
      />

      <div className="space-y-8 p-5 sm:p-8">
        {q ? (
          <section aria-live="polite" aria-labelledby="filter-heading">
            <h2 id="filter-heading" className="t-muted mb-3 text-[11px] font-semibold tracking-wider uppercase">
              {matches.length === 0
                ? 'No matches'
                : `${matches.length} ${matches.length === 1 ? 'tool matches' : 'tools match'} “${q}”`}
            </h2>
            {matches.length === 0 ? (
              <div className="panel flex flex-col items-start gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <SearchX className="t-faint mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="t-main text-sm font-semibold">Nothing here matches “{q}”.</p>
                    <p className="t-muted mt-1 text-sm">
                      Try the format (yaml, csv), the algorithm (sha256, bcrypt) or the job (flatten, diff, decode).
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" onClick={() => setQuery('')} className="field hover-surface t-main inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 text-sm font-medium">
                    Show all tools
                  </button>
                  <button type="button" onClick={() => openFeedback('suggestion')} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-sm font-medium text-white hover:bg-emerald-800">
                    <Lightbulb className="h-4 w-4" aria-hidden="true" />Suggest it
                  </button>
                </div>
              </div>
            ) : (
              <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {matches.map((item) => (
                  <ToolCard key={item.to} item={item} showGroup />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {favoriteItems.length > 0 && (
              <section>
                <h2 className="t-muted mb-3 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                  My tools
                </h2>
                <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {favoriteItems.map((item) => (
                    <ToolCard key={item.to} item={item} showGroup />
                  ))}
                </div>
              </section>
            )}

            {recentItems.length > 0 && (
              <section>
                <h2 className="t-muted mb-3 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
                  <History className="h-3 w-3" aria-hidden="true" />
                  Recently used
                </h2>
                <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {recentItems.map((item) => (
                    <ToolCard key={item.to} item={item} showGroup />
                  ))}
                </div>
              </section>
            )}

            {NAV_GROUPS.map((group) => {
              const cards = TOOLS.filter((n) => n.group === group)
              return (
                // scroll-mt clears the sticky header and the filter bar when a
                // category chip jumps here.
                <section key={group} id={groupId(group)} className="scroll-mt-32" data-group={group}>
                  <h2 className="t-muted mb-3 text-[11px] font-semibold tracking-wider uppercase">
                    {group}
                    <span className="ml-1.5 font-medium normal-case tracking-normal">{cards.length}</span>
                  </h2>
                  <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {cards.map((item) => (
                      <ToolCard key={item.to} item={item} />
                    ))}
                  </div>
                </section>
              )
            })}
          </>
        )}

        <section className="panel flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <h2 className="t-main flex items-center gap-2 text-base font-semibold">
              <MessageSquarePlus className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              Found a bug or missing a tool?
            </h2>
            <p className="t-muted mt-1 max-w-xl text-sm leading-relaxed">
              Tell us in a short form — no email app needed. It is the only thing on DevPocket that sends what you type, and only when you press Send.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={() => openFeedback('bug')} className="field hover-surface t-main inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 text-sm font-medium">
              <Bug className="h-4 w-4 text-rose-500" aria-hidden="true" />Report a bug
            </button>
            <button type="button" onClick={() => openFeedback('suggestion')} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-sm font-medium text-white hover:bg-emerald-800">
              <Lightbulb className="h-4 w-4" aria-hidden="true" />Suggest an idea
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

/**
 * The bar under the hero: a filter box and one chip per category. It sticks
 * under the top bar while the grid scrolls, so on a phone — where the ⌘K
 * palette has no shortcut and the grid is 49 cards long — there is always a
 * way to narrow the list or jump to a group without scrolling back up.
 *
 * Chips are plain in-page links, so they work in the static HTML before any
 * script has run; the highlight follows the section in view once it has.
 */
function ToolFinder({ inputRef, query, onQuery, onKeyDown, matchCount, total, filtering }) {
  const [active, setActive] = useState(null)
  const chipsRef = useRef(null)

  // Highlight the chip of the group currently under the bar.
  useEffect(() => {
    if (filtering || typeof IntersectionObserver === 'undefined') return
    const sections = NAV_GROUPS.map((g) => document.getElementById(groupId(g))).filter(Boolean)
    const visible = new Map()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.dataset.group, e.boundingClientRect.top)
          else visible.delete(e.target.dataset.group)
        }
        if (!visible.size) return
        // The topmost visible section wins.
        const [group] = [...visible.entries()].sort((a, b) => a[1] - b[1])[0]
        setActive(group)
      },
      // Top edge is the bottom of the sticky bars; the band is the top half
      // of the viewport, so a section counts once its header has gone past.
      { rootMargin: '-120px 0px -50% 0px' }
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [filtering])

  // Keep the active chip in view on narrow screens, where the row scrolls.
  useEffect(() => {
    if (!active) return
    chipsRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [active])

  const jump = useCallback(
    (e, group) => {
      const el = document.getElementById(groupId(group))
      if (!el) return
      e.preventDefault()
      if (filtering) onQuery('')
      // After clearing a filter the sections remount: scroll on the next frame.
      requestAnimationFrame(() => {
        document.getElementById(groupId(group))?.scrollIntoView({ block: 'start' })
        setActive(group)
      })
    },
    [filtering, onQuery]
  )

  return (
    <div
      className="bd sticky top-14 z-20 border-b backdrop-blur-md"
      style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 85%, transparent)' }}
    >
      <div className="flex flex-col gap-2 px-5 py-2.5 sm:px-8 sm:py-3 lg:flex-row lg:items-center lg:gap-4">
        <label className="field relative flex h-9 w-full items-center gap-2 rounded-xl border px-3 transition-colors focus-within:border-emerald-500/60 sm:h-10 lg:w-80 lg:shrink-0">
          <Search className="t-faint h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">Filter tools</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Filter ${total} tools… yaml, sha256, flatten`}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-label="Filter tools"
            className="finder-input t-main min-w-0 flex-1 bg-transparent text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                onQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Clear filter"
              className="hover-surface t-muted -mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : (
            <kbd className="bd t-faint hidden rounded border px-1.5 py-0.5 text-[10px] sm:inline-block" aria-hidden="true">
              /
            </kbd>
          )}
        </label>

        {filtering ? (
          <p className="t-muted text-xs" role="status">
            {matchCount === 0 ? 'No matches' : `${matchCount} of ${total}`} · Enter opens the first · Esc clears
          </p>
        ) : (
          <nav aria-label="Tool categories" className="-mx-5 min-w-0 flex-1 sm:-mx-8 lg:mx-0">
            <ul ref={chipsRef} className="no-scrollbar flex gap-1.5 overflow-x-auto px-5 sm:px-8 lg:px-0">
              {NAV_GROUPS.map((group) => {
                const on = active === group
                return (
                  <li key={group} className="shrink-0">
                    <a
                      href={`#${groupId(group)}`}
                      onClick={(e) => jump(e, group)}
                      aria-current={on ? 'true' : undefined}
                      className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors ${
                        on ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300' : 'bd field hover-surface t-muted hover:t-main'
                      }`}
                    >
                      {group}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  )
}
