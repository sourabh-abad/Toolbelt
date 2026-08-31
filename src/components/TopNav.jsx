import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { ChevronDown, Search, Command, Sun, Moon, Menu, X, Heart } from 'lucide-react'
import { navItems, NAV_GROUPS, ACCENTS } from '../lib/nav'
import { useTheme } from '../lib/theme'
import Logo from './Logo'
import Avatar from './Avatar'
import { PROFILE } from '../lib/profile'

/**
 * Horizontal menu bar with one dropdown per group. Replaces the sidebar,
 * which could not hold 26 tools without becoming an endless scroll.
 */
export default function TopNav({ onOpenPalette, onPrefetch }) {
  const [openMenu, setOpenMenu] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const navRef = useRef(null)
  const closeTimer = useRef(null)

  useEffect(() => {
    setOpenMenu(null)
    setMobileOpen(false)
  }, [location.pathname])

  // Click-away and Escape both dismiss an open dropdown.
  useEffect(() => {
    const onDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenMenu(null)
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Hover opens after a beat; leaving closes after a grace period so the
  // pointer can cross the gap between the trigger and the panel.
  const openWithHover = (group) => {
    clearTimeout(closeTimer.current)
    setOpenMenu(group)
  }
  const scheduleClose = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenMenu(null), 160)
  }

  const groupHasActive = (group) =>
    navItems.some((n) => n.group === group && n.to === location.pathname)

  return (
    <header className="bd sidebar-bg sticky top-0 z-40 border-b" ref={navRef}>
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 sm:px-5">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="DevPocket home">
          <Logo className="h-7 w-7" />
          <span className="t-main hidden text-base font-bold tracking-tight sm:inline">DevPocket</span>
        </Link>

        {/* Desktop menu bar */}
        <nav aria-label="Tools" className="ml-3 hidden items-center gap-0.5 lg:flex">
          {NAV_GROUPS.map((group) => {
            const items = navItems.filter((n) => n.group === group)
            const isOpen = openMenu === group
            return (
              <div key={group} className="relative" onMouseEnter={() => openWithHover(group)} onMouseLeave={scheduleClose}>
                <button
                  type="button"
                  onClick={() => setOpenMenu(isOpen ? null : group)}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isOpen || groupHasActive(group) ? 'sunken t-main' : 't-muted hover:t-main'
                  }`}
                >
                  {group}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {isOpen && (
                  <div
                    className={`panel animate-fade-up absolute left-0 top-full z-50 mt-1 overflow-hidden rounded-xl border p-1.5 shadow-2xl ${
                      items.length === 1 ? 'w-[18rem]' : 'w-[22rem]'
                    }`}
                    role="menu"
                  >
                    {items.map(({ to, label, icon: Icon, description, accent }) => {
                      const a = ACCENTS[accent] || ACCENTS.emerald
                      return (
                        <NavLink
                          key={to}
                          to={to}
                          role="menuitem"
                          onMouseEnter={() => onPrefetch?.(to)}
                          className={({ isActive }) =>
                            `flex items-start gap-3 rounded-lg px-2.5 py-2 transition-colors ${
                              isActive ? `${a.bg} ${a.text}` : 'hover-surface'
                            }`
                          }
                        >
                          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${a.bg} ${a.text}`}>
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="t-main block text-sm font-medium">{label}</span>
                            <span className="t-muted block text-xs leading-snug">{description}</span>
                          </span>
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onOpenPalette}
            type="button"
            aria-label="Search tools (Command K)"
            className="field hover-surface t-muted flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition-colors"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Search tools…</span>
            <kbd className="bd hidden items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] sm:flex">
              <Command className="h-2.5 w-2.5" aria-hidden="true" />K
            </kbd>
          </button>

          <button
            onClick={toggle}
            type="button"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="field hover-surface t-muted flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" aria-hidden="true" /> : <Moon className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>

          <Link to="/about" className="hidden shrink-0 lg:block" aria-label="About">
            <Avatar size={28} rounded="rounded-full" decorative />
          </Link>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="field hover-surface t-muted flex h-8 w-8 items-center justify-center rounded-lg border lg:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile / tablet: full-width accordion under the bar */}
      {mobileOpen && (
        <div className="bd animate-fade-in max-h-[calc(100vh-3.5rem)] overflow-y-auto border-t px-3 pb-4 lg:hidden">
          {NAV_GROUPS.map((group) => (
            <div key={group} className="pt-4">
              <div className="t-muted mb-1.5 px-1 text-[10px] font-semibold tracking-wider uppercase">{group}</div>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {navItems.filter((n) => n.group === group).map(({ to, label, icon: Icon, accent }) => {
                  const a = ACCENTS[accent] || ACCENTS.emerald
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${isActive ? `${a.bg} ${a.text}` : 't-muted hover-surface'}`
                      }
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${a.bg} ${a.text}`}>
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      {label}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
          <Link to="/about" className="t-muted hover-surface mt-4 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm">
            <Heart className="h-4 w-4" aria-hidden="true" />
            About · by {PROFILE.name.split(' ')[0]}
          </Link>
        </div>
      )}
    </header>
  )
}
