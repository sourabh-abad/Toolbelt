import { Link, useLocation } from 'react-router-dom'
import { seoFor } from '../lib/seo'
import { navItems } from '../lib/nav'

/**
 * Real, visible copy describing the current tool, plus links to the others.
 * Search engines rank text and follow internal links — a page that is only
 * an interactive widget gives them nothing to work with.
 */
export default function SeoFooter() {
  const { pathname } = useLocation()
  const seo = seoFor(pathname)
  const others = navItems.filter((n) => n.to !== pathname && n.to !== '/').slice(0, 6)

  return (
    <footer className="bd mt-2 border-t px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h2 className="t-main text-sm font-semibold">{seo.heading}</h2>
        <p className="t-muted mt-2 max-w-3xl text-sm leading-relaxed">{seo.blurb}</p>

        <nav aria-label="Other tools" className="mt-5">
          <h3 className="t-muted text-[11px] font-semibold tracking-wider uppercase">More tools</h3>
          <ul className="mt-1 flex flex-wrap gap-x-5">
            {others.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  className="t-muted inline-flex min-h-[36px] items-center text-xs underline-offset-2 hover:text-emerald-500 hover:underline"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="t-muted mt-5 text-xs">
          Free · no sign-up · nothing you paste leaves your browser ·{' '}
          <Link to="/about" className="inline-flex min-h-[36px] items-center underline-offset-2 hover:underline">
            about this project
          </Link>
        </p>
      </div>
    </footer>
  )
}
