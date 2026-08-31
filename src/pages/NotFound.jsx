import { Link } from 'react-router-dom'
import { Compass, ArrowRight } from 'lucide-react'
import { navItems, ACCENTS } from '../lib/nav'
import { PageHeader } from '../components/ui'

export default function NotFound() {
  const tools = navItems.filter((n) => n.to !== '/').slice(0, 6)

  return (
    <div>
      <PageHeader icon={Compass} title="Page not found" subtitle="That URL does not match any tool." accent="amber" />

      <div className="mx-auto max-w-3xl px-5 py-12 text-center sm:px-6">
        <p className="t-main text-5xl font-bold tracking-tight">404</p>
        <p className="t-muted mx-auto mt-3 max-w-md text-sm leading-relaxed">
          The page you were looking for either moved or never existed. Everything DevPocket can do is one
          click away below — or press <kbd className="bd rounded border px-1.5 py-0.5 text-[11px]">⌘K</kbd> to search.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-500 transition-colors hover:bg-emerald-500/20"
        >
          Back to all tools
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>

        <div className="stagger mt-10 grid grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
          {tools.map(({ to, label, icon: Icon, description, accent }) => {
            const a = ACCENTS[accent] || ACCENTS.emerald
            return (
              <Link
                key={to}
                to={to}
                className="panel group rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg ${a.bg} ${a.text}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="t-main text-sm font-semibold">{label}</div>
                <div className="t-muted mt-1 text-xs leading-relaxed">{description}</div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
