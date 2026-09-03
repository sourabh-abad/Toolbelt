import { Link, useLocation } from 'react-router-dom'
import { seoFor, normalizePath } from '../lib/seo'
import { navItems, NAV_GROUPS } from '../lib/nav'

/**
 * Real, visible copy describing the current tool, plus a link to every other
 * one. Search engines rank text and follow internal links — a page that is
 * only an interactive widget gives them nothing to work with, and a footer
 * that linked six tools left the other twenty-two reachable from the nav
 * dropdowns alone.
 *
 * scripts/prerender.mjs writes the same markup into the static HTML. If this
 * component changes shape, that mirror has to change with it — static HTML
 * that differs from the hydrated page is cloaking.
 */
export default function SeoFooter() {
  const { pathname } = useLocation()
  const seo = seoFor(pathname)
  // /cron/ and /cron are the same page; without this the current tool links to itself.
  const current = normalizePath(pathname)

  return (
    <footer className="bd mt-2 border-t px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h2 className="t-main text-sm font-semibold">{seo.heading}</h2>
        <p className="t-muted mt-2 max-w-3xl text-sm leading-relaxed">{seo.blurb}</p>

        <nav
          aria-label="All tools"
          className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4"
        >
          {NAV_GROUPS.map((group) => {
            const items = navItems.filter((n) => n.group === group)
            if (!items.length) return null
            return (
              <div key={group}>
                <h3 className="t-muted text-[11px] font-semibold tracking-wider uppercase">
                  {group}
                </h3>
                <ul className="mt-1">
                  {items.map((n) => (
                    <li key={n.to}>
                      {n.to === current ? (
                        <span
                          className="t-faint inline-flex min-h-[32px] items-center text-xs"
                          aria-current="page"
                        >
                          {n.label}
                        </span>
                      ) : (
                        <Link
                          to={n.to}
                          className="t-muted inline-flex min-h-[32px] items-center text-xs underline-offset-2 hover:text-emerald-500 hover:underline"
                        >
                          {n.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </nav>

        <p className="t-muted mt-6 text-xs">
          Free · no sign-up · nothing you paste leaves your browser ·{' '}
          <Link to="/" className="inline-flex min-h-[36px] items-center underline-offset-2 hover:underline">
            all tools
          </Link>{' '}
          ·{' '}
          <Link to="/privacy" className="inline-flex min-h-[36px] items-center underline-offset-2 hover:underline">
            privacy
          </Link>{' '}
          ·{' '}
          <Link to="/about" className="inline-flex min-h-[36px] items-center underline-offset-2 hover:underline">
            about this project
          </Link>
        </p>
      </div>
    </footer>
  )
}
