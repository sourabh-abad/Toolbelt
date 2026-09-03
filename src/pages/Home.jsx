import { useEffect, useState } from 'react'
import { Keyboard, Lock, UserX, UploadCloud, Zap, Star, History } from 'lucide-react'
import { navItems, NAV_GROUPS, getRecent } from '../lib/nav'
import { useFavorites } from '../lib/favorites'
import ToolCard from '../components/ToolCard'

const BADGES = [
  { icon: Lock, label: '100% client-side' },
  { icon: UserX, label: 'No signup' },
  { icon: UploadCloud, label: 'No unnecessary uploads' },
  { icon: Zap, label: 'Fast & private' },
]

export default function Home() {
  const { favorites } = useFavorites()
  // Recent tools live in localStorage and don't change reactively while this
  // page is mounted, so a plain read on mount (and on focus, in case another
  // tab navigated) is enough — no need for the pub-sub favorites uses.
  const [recent, setRecent] = useState(() => getRecent())
  useEffect(() => {
    const refresh = () => setRecent(getRecent())
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])

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
          hit a dozen times a day. Paste, process, copy — {navItems.length - 1} tools, no signup, nothing uploaded.
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
          <Keyboard className="h-3.5 w-3.5" />
          <kbd className="bd rounded border px-1.5 py-0.5">⌘K</kbd> to jump straight to a tool
        </div>
      </div>

      <div className="space-y-8 p-5 sm:p-8">
        {favoriteItems.length > 0 && (
          <section>
            <h2 className="t-muted mb-3 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
              My tools
            </h2>
            <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {favoriteItems.map((item) => (
                <ToolCard key={item.to} item={item} />
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
                <ToolCard key={item.to} item={item} />
              ))}
            </div>
          </section>
        )}

        {NAV_GROUPS.map((group) => {
          const cards = navItems.filter((n) => n.group === group)
          return (
            <section key={group}>
              <h2 className="t-muted mb-3 text-[11px] font-semibold tracking-wider uppercase">{group}</h2>
              <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((item) => (
                  <ToolCard key={item.to} item={item} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
