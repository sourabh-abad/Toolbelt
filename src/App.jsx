import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Wrench, Search, Command, Sun, Moon, PanelLeftClose, PanelLeftOpen, History, Loader2 } from 'lucide-react'
import { navItems, NAV_GROUPS, ACCENTS, pushRecent, getRecent } from './lib/nav'
import { useTheme } from './lib/theme'
import CommandPalette from './components/CommandPalette'
import Home from './pages/Home'

// Route-level code splitting: heavy tools (sql-formatter, js-yaml, cronstrue)
// load on demand instead of inflating the initial bundle.
const JsonXmlTool = lazy(() => import('./pages/JsonXmlTool'))
const EncodeDecodeTool = lazy(() => import('./pages/EncodeDecodeTool'))
const DiffTool = lazy(() => import('./pages/DiffTool'))
const TimestampTool = lazy(() => import('./pages/TimestampTool'))
const JwtColorTool = lazy(() => import('./pages/JwtColorTool'))
const ConvertTool = lazy(() => import('./pages/ConvertTool'))
const CodeGenTool = lazy(() => import('./pages/CodeGenTool'))
const SqlTool = lazy(() => import('./pages/SqlTool'))
const CronTool = lazy(() => import('./pages/CronTool'))
const HttpRefTool = lazy(() => import('./pages/HttpRefTool'))
const MockDataTool = lazy(() => import('./pages/MockDataTool'))

function RouteFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="t-faint h-5 w-5 animate-spin" />
    </div>
  )
}

function NavRow({ item, collapsed }) {
  const { to, label, icon: Icon, end, accent } = item
  const a = ACCENTS[accent] || ACCENTS.emerald
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl border px-2.5 py-2 text-sm font-medium transition-all ${
          isActive ? `${a.bg} ${a.text} ${a.border}` : 't-muted hover-surface border-transparent hover:t-main'
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-white/15' : 'sunken'}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  )
}

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('toolbelt-collapsed') === '1'
    } catch {
      return false
    }
  })
  const [recent, setRecent] = useState([])
  const { theme, toggle } = useTheme()
  const location = useLocation()

  useEffect(() => {
    pushRecent(location.pathname)
    setRecent(getRecent().filter((r) => r.to !== location.pathname))
  }, [location.pathname])

  useEffect(() => {
    try {
      localStorage.setItem('toolbelt-collapsed', collapsed ? '1' : '0')
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
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app-bg relative flex h-screen overflow-hidden antialiased">
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-60">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <aside className={`sidebar-bg bd relative z-10 flex shrink-0 flex-col border-r transition-all duration-200 ${collapsed ? 'w-[68px]' : 'w-64'}`}>
        <div className={`bd flex items-center gap-2.5 border-b px-4 py-4 ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
            <Wrench className="h-4 w-4" />
          </div>
          {!collapsed && <span className="t-main text-lg font-bold tracking-tight">Toolbelt</span>}
        </div>

        <div className="px-3 pt-3">
          <button
            onClick={() => setPaletteOpen(true)}
            type="button"
            title="Search tools (⌘K)"
            className={`field hover-surface t-faint flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Quick jump…</span>
                <kbd className="bd flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px]">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </>
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          <NavRow item={navItems[0]} collapsed={collapsed} />

          {!collapsed && recent.length > 0 && (
            <div className="pt-3">
              <div className="t-faint mb-1 flex items-center gap-1.5 px-2.5 text-[10px] font-semibold tracking-wider uppercase">
                <History className="h-3 w-3" />
                Recent
              </div>
              {recent.map((item) => (
                <NavRow key={`recent-${item.to}`} item={item} collapsed={collapsed} />
              ))}
            </div>
          )}

          {NAV_GROUPS.map((group) => (
            <div key={group} className="pt-3">
              {!collapsed && (
                <div className="t-faint mb-1 px-2.5 text-[10px] font-semibold tracking-wider uppercase">{group}</div>
              )}
              {collapsed && <div className="bd my-2 border-t" />}
              <div className="space-y-1">
                {navItems.filter((n) => n.group === group).map((item) => (
                  <NavRow key={item.to} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={`bd flex items-center gap-2 border-t px-3 py-3 ${collapsed ? 'flex-col' : ''}`}>
          <button
            onClick={toggle}
            type="button"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="field hover-surface t-muted flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            type="button"
            title="Toggle sidebar (⌘\)"
            className="field hover-surface t-muted flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
          >
            {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
          </button>
          {!collapsed && (
            <span className="t-faint ml-auto text-[10px]">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />
              Local only
            </span>
          )}
        </div>
      </aside>

      <main className="relative z-10 flex-1 overflow-y-auto">
        <Suspense fallback={<RouteFallback />}>
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
        </Routes>
        </Suspense>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
