import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, NavLink, useLocation, Link } from 'react-router-dom'
import {
  Search, Command, Sun, Moon, PanelLeftClose, PanelLeftOpen,
  History, Loader2, Menu, X, Heart,
} from 'lucide-react'
import { navItems, NAV_GROUPS, ACCENTS, pushRecent, getRecent } from './lib/nav'
import { PROFILE } from './lib/profile'
import { useTheme } from './lib/theme'
import { useSeo } from './lib/useSeo'
import SeoFooter from './components/SeoFooter'
import CommandPalette from './components/CommandPalette'
import Logo from './components/Logo'
import Avatar from './components/Avatar'
import Home from './pages/Home'

// Route-level code splitting: heavy tools (sql-formatter, js-yaml, cronstrue)
// load on demand instead of inflating the initial bundle.
// One loader per route: `lazy` uses it for rendering, and hovering a nav link
// calls the same function to warm the chunk before the click lands.
const LOADERS = {
  '/json-xml': () => import('./pages/JsonXmlTool'),
  '/convert': () => import('./pages/ConvertTool'),
  '/codegen': () => import('./pages/CodeGenTool'),
  '/sql': () => import('./pages/SqlTool'),
  '/diff': () => import('./pages/DiffTool'),
  '/encode-decode': () => import('./pages/EncodeDecodeTool'),
  '/jwt-color': () => import('./pages/JwtColorTool'),
  '/timestamp': () => import('./pages/TimestampTool'),
  '/cron': () => import('./pages/CronTool'),
  '/http': () => import('./pages/HttpRefTool'),
  '/mock': () => import('./pages/MockDataTool'),
  '/about': () => import('./pages/About'),
}

const prefetched = new Set()
const prefetch = (path) => {
  if (prefetched.has(path) || !LOADERS[path]) return
  prefetched.add(path)
  LOADERS[path]()
}

const JsonXmlTool = lazy(LOADERS['/json-xml'])
const EncodeDecodeTool = lazy(LOADERS['/encode-decode'])
const DiffTool = lazy(LOADERS['/diff'])
const TimestampTool = lazy(LOADERS['/timestamp'])
const JwtColorTool = lazy(LOADERS['/jwt-color'])
const ConvertTool = lazy(LOADERS['/convert'])
const CodeGenTool = lazy(LOADERS['/codegen'])
const SqlTool = lazy(LOADERS['/sql'])
const CronTool = lazy(LOADERS['/cron'])
const HttpRefTool = lazy(LOADERS['/http'])
const MockDataTool = lazy(LOADERS['/mock'])
const About = lazy(LOADERS['/about'])
const NotFound = lazy(() => import('./pages/NotFound'))

function RouteFallback() {
  return (
    <div className="flex h-full items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="t-faint h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading tool…</span>
    </div>
  )
}

function NavRow({ item, collapsed, onNavigate }) {
  const { to, label, icon: Icon, end, accent } = item
  const a = ACCENTS[accent] || ACCENTS.emerald
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      onMouseEnter={() => prefetch(to)}
      onFocus={() => prefetch(to)}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl border px-2.5 py-2 text-sm font-medium transition-all duration-150 ${
          isActive ? `${a.bg} ${a.text} ${a.border}` : 't-muted hover-surface border-transparent hover:t-main hover:translate-x-0.5'
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          <div
            aria-hidden="true"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-white/15' : 'sunken'}`}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          {!collapsed && <span className="truncate">{label}</span>}
          {collapsed && <span className="sr-only">{label}</span>}
        </>
      )}
    </NavLink>
  )
}

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('devpocket-collapsed') === '1'
    } catch {
      return false
    }
  })
  const [recent, setRecent] = useState([])
  const { theme, toggle } = useTheme()
  const location = useLocation()
  useSeo()

  // Without this the new page inherits the previous page's scroll offset,
  // which reads as a broken jump rather than a navigation.
  useEffect(() => {
    document.getElementById('main')?.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  useEffect(() => {
    pushRecent(location.pathname)
    setRecent(getRecent().filter((r) => r.to !== location.pathname))
    setMobileOpen(false) // close the drawer whenever the route changes
  }, [location.pathname])

  useEffect(() => {
    try {
      localStorage.setItem('devpocket-collapsed', collapsed ? '1' : '0')
    } catch {
      // ignore
    }
  }, [collapsed])

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        setCollapsed((c) => !c)
      }
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const sidebar = (
    <>
      <div className={`bd flex items-center gap-2.5 border-b px-4 py-4 ${collapsed ? 'lg:justify-center' : ''}`}>
        <Logo className="h-8 w-8 shrink-0 shadow-lg shadow-emerald-500/20" />
        {!collapsed && <span className="t-main text-lg font-bold tracking-tight">DevPocket</span>}
        <button
          onClick={() => setMobileOpen(false)}
          type="button"
          aria-label="Close navigation menu"
          className="t-muted hover-surface ml-auto rounded-lg p-1.5 lg:hidden"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="px-3 pt-3">
        <button
          onClick={() => setPaletteOpen(true)}
          type="button"
          aria-label="Search tools (Command K)"
          className={`field hover-surface t-faint flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors ${collapsed ? 'lg:justify-center' : ''}`}
        >
          <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Quick jump…</span>
              <kbd className="bd hidden items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] sm:flex">
                <Command className="h-2.5 w-2.5" aria-hidden="true" />K
              </kbd>
            </>
          )}
        </button>
      </div>

      <nav aria-label="Tools" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        <NavRow item={navItems[0]} collapsed={collapsed} />

        {!collapsed && recent.length > 0 && (
          <div className="pt-3">
            <div className="t-faint mb-1 flex items-center gap-1.5 px-2.5 text-[10px] font-semibold tracking-wider uppercase">
              <History className="h-3 w-3" aria-hidden="true" />
              Recent
            </div>
            {recent.map((item) => (
              <NavRow key={`recent-${item.to}`} item={item} collapsed={collapsed} />
            ))}
          </div>
        )}

        {NAV_GROUPS.map((group) => (
          <div key={group} className="pt-3">
            {!collapsed && <div className="t-faint mb-1 px-2.5 text-[10px] font-semibold tracking-wider uppercase">{group}</div>}
            {collapsed && <div className="bd my-2 border-t" aria-hidden="true" />}
            <div className="space-y-1">
              {navItems.filter((n) => n.group === group).map((item) => (
                <NavRow key={item.to} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}

        <div className="pt-3">
          {!collapsed && <div className="t-faint mb-1 px-2.5 text-[10px] font-semibold tracking-wider uppercase">Project</div>}
          <NavRow item={{ to: '/about', label: 'About', icon: Heart, accent: 'emerald' }} collapsed={collapsed} />
        </div>
      </nav>

      <div className={`bd flex items-center gap-2 border-t px-3 py-3 ${collapsed ? 'lg:flex-col' : ''}`}>
        <button
          onClick={toggle}
          type="button"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="field hover-surface t-muted flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" aria-hidden="true" /> : <Moon className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
        <button
          onClick={() => setCollapsed((c) => !c)}
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="field hover-surface t-muted hidden h-8 w-8 items-center justify-center rounded-lg border transition-colors lg:flex"
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" aria-hidden="true" /> : <PanelLeftClose className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
        {!collapsed && (
          <Link
            to="/about"
            className="t-faint hover:t-main ml-auto flex items-center gap-1.5 text-[10px] transition-colors"
          >
            <Avatar size={18} rounded="rounded-full" decorative />
            by {PROFILE.name.split(' ')[0]}
          </Link>
        )}
      </div>
    </>
  )

  return (
    <div className="app-bg relative flex h-screen overflow-hidden antialiased">
      <a href="#main" className="skip-link">Skip to content</a>

      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-60" aria-hidden="true">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`sidebar-bg bd relative z-10 hidden shrink-0 flex-col border-r transition-all duration-200 lg:flex ${collapsed ? 'w-[68px]' : 'w-64'}`}
      >
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="sidebar-bg bd animate-slide-in-left absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {sidebar}
          </aside>
        </div>
      )}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="bd sidebar-bg flex items-center gap-3 border-b px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            className="field hover-surface t-muted flex h-9 w-9 items-center justify-center rounded-lg border"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7 shrink-0" />
            <span className="t-main font-bold tracking-tight">DevPocket</span>
          </div>
          <button
            onClick={() => setPaletteOpen(true)}
            type="button"
            aria-label="Search tools"
            className="field hover-surface t-muted ml-auto flex h-9 w-9 items-center justify-center rounded-lg border"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <main id="main" className="flex-1 overflow-y-auto">
          <Suspense fallback={<RouteFallback />}>
            <div key={location.pathname} className="animate-fade-in">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/json-xml" element={<JsonXmlTool />} />
                <Route path="/convert" element={<ConvertTool />} />
                <Route path="/codegen" element={<CodeGenTool />} />
                <Route path="/sql" element={<SqlTool />} />
                <Route path="/diff" element={<DiffTool />} />
                <Route path="/encode-decode" element={<EncodeDecodeTool />} />
                <Route path="/jwt-color" element={<JwtColorTool />} />
                <Route path="/timestamp" element={<TimestampTool />} />
                <Route path="/cron" element={<CronTool />} />
                <Route path="/http" element={<HttpRefTool />} />
                <Route path="/mock" element={<MockDataTool />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <SeoFooter />
            </div>
          </Suspense>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
