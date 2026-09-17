import { forwardRef } from 'react'
import { Link as RouterLink, NavLink as RouterNavLink } from 'react-router-dom'
import { hrefFor } from '../lib/nav'

/**
 * `Link` and `NavLink`, but the rendered href keeps the trailing slash.
 *
 * React Router writes `to` into the anchor verbatim, so `to="/uuid"` ships
 * `href="/uuid"` — a URL that 301-redirects to `/uuid/`, the one the canonical
 * tag and the sitemap name. The prerendered HTML got this right and hydration
 * undid it on every link, which costs a crawl-budget hop per link on a site
 * whose crawl budget is measured in tens of fetches a day.
 *
 * Import these instead of react-router-dom's anywhere an internal link is
 * rendered. Matching is unaffected: React Router ignores a trailing slash when
 * it matches a location against a route path, so `<Route path="/uuid">` still
 * answers `/uuid/`, and NavLink still resolves its own active state.
 */
export const Link = forwardRef(function Link({ to, ...rest }, ref) {
  return <RouterLink ref={ref} to={hrefFor(to)} {...rest} />
})

export const NavLink = forwardRef(function NavLink({ to, ...rest }, ref) {
  return <RouterNavLink ref={ref} to={hrefFor(to)} {...rest} />
})
