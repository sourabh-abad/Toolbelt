import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Keyboard } from 'lucide-react'
import { navItems, NAV_GROUPS, ACCENTS } from '../lib/nav'

export default function Home() {
  return (
    <div>
      <div className="bd border-b px-5 pt-10 pb-8 sm:px-8 sm:pt-14 sm:pb-10">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <Sparkles className="h-3 w-3" />
          Local-first · nothing leaves your browser
        </div>
        <h1 className="t-main animate-fade-up max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Your daily{' '}
          <span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">backend toolbox</span>
        </h1>
        <p className="t-muted mt-3 max-w-xl text-sm leading-relaxed">
          Eleven tools for the small things you do a dozen times a day — formatting payloads, decoding tokens,
          reading cron expressions, seeding test data and checking what a 409 actually means.
        </p>
        <div className="t-faint mt-4 hidden flex-wrap items-center gap-4 text-xs sm:flex">
          <span className="flex items-center gap-1.5">
            <Keyboard className="h-3.5 w-3.5" />
            <kbd className="bd rounded border px-1.5 py-0.5">⌘K</kbd> jump to a tool
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="bd rounded border px-1.5 py-0.5">⌘\</kbd> collapse the sidebar
          </span>
        </div>
      </div>

      <div className="space-y-8 p-5 sm:p-8">
        {NAV_GROUPS.map((group) => {
          const cards = navItems.filter((n) => n.group === group)
          return (
            <section key={group}>
              <h2 className="t-faint mb-3 text-[11px] font-semibold tracking-wider uppercase">{group}</h2>
              <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map(({ to, label, icon: Icon, description, accent }) => {
                  const a = ACCENTS[accent] || ACCENTS.emerald
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`panel group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl ${a.glow}`}
                    >
                      <div
                        className={`pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-gradient-to-br ${a.grad} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-25`}
                      />
                      <div className="relative">
                        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${a.grad} text-white shadow-md ${a.glow}`}>
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <h3 className="t-main text-sm font-semibold">{label}</h3>
                        <p className="t-muted mt-1.5 text-xs leading-relaxed">{description}</p>
                      </div>
                      <div className={`t-faint relative mt-5 flex items-center gap-1 text-xs font-medium transition-colors ${a.groupHoverText}`}>
                        Open tool
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
