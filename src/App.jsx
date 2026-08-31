import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, NavLink, useLocation, Link, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { pushRecent } from './lib/nav'
import { useSeo } from './lib/useSeo'
import SeoFooter from './components/SeoFooter'
import TopNav from './components/TopNav'
import Home from './pages/Home'

const CommandPalette = lazy(() => import('./components/CommandPalette'))

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
  '/jwtvalidator': () => import('./pages/JwtValidatorTool'),
  '/color': () => import('./pages/ColorTool'),
  '/timestamp': () => import('./pages/TimestampTool'),
  '/cron': () => import('./pages/CronTool'),
  '/http': () => import('./pages/HttpRefTool'),
  '/mock': () => import('./pages/MockDataTool'),
  '/about': () => import('./pages/About'),
  '/json-sort-keys': () => import('./pages/JsonSortKeys'),
  '/json-flatten': () => import('./pages/JsonFlatten'),
  '/json-unflatten': () => import('./pages/JsonUnflatten'),
  '/json-escape': () => import('./pages/JsonEscape'),
  '/json-remove-nulls': () => import('./pages/JsonClean'),
  '/json-remove-empty': () => import('./pages/JsonClean'),
  '/json-merge': () => import('./pages/JsonMerge'),
  '/json-tree': () => import('./pages/JsonTreeTool'),
  '/json-stats': () => import('./pages/JsonStats'),
  '/jsonpath': () => import('./pages/JsonPathTool'),
  '/json-schema': () => import('./pages/JsonSchemaTool'),
  '/uuid': () => import('./pages/IdGeneratorTool'),
  '/password': () => import('./pages/PasswordTool'),
  '/lorem': () => import('./pages/LoremTool'),
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
const JwtValidatorTool = lazy(LOADERS['/jwtvalidator'])
const ColorTool = lazy(LOADERS['/color'])
const ConvertTool = lazy(LOADERS['/convert'])
const CodeGenTool = lazy(LOADERS['/codegen'])
const SqlTool = lazy(LOADERS['/sql'])
const CronTool = lazy(LOADERS['/cron'])
const HttpRefTool = lazy(LOADERS['/http'])
const MockDataTool = lazy(LOADERS['/mock'])
const About = lazy(LOADERS['/about'])
const JsonSortKeys = lazy(LOADERS['/json-sort-keys'])
const JsonFlatten = lazy(LOADERS['/json-flatten'])
const JsonUnflatten = lazy(LOADERS['/json-unflatten'])
const JsonEscape = lazy(LOADERS['/json-escape'])
const JsonClean = lazy(LOADERS['/json-remove-nulls'])
const JsonMerge = lazy(LOADERS['/json-merge'])
const JsonTreeTool = lazy(LOADERS['/json-tree'])
const JsonStats = lazy(LOADERS['/json-stats'])
const JsonPathTool = lazy(LOADERS['/jsonpath'])
const JsonSchemaTool = lazy(LOADERS['/json-schema'])
const IdGeneratorTool = lazy(LOADERS['/uuid'])
const PasswordTool = lazy(LOADERS['/password'])
const LoremTool = lazy(LOADERS['/lorem'])
const NotFound = lazy(() => import('./pages/NotFound'))

function RouteFallback() {
  return (
    <div className="flex h-full items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="t-faint h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading tool…</span>
    </div>
  )
}

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false)

  const location = useLocation()
  useSeo()

  // Without this the new page inherits the previous page's scroll offset,
  // which reads as a broken jump rather than a navigation.
  useEffect(() => {
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [location.pathname])

  useEffect(() => {
    pushRecent(location.pathname)
  }, [location.pathname])


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
    <div className="app-bg flex min-h-screen flex-col antialiased">
      <a href="#main" className="skip-link">Skip to content</a>

      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-60" aria-hidden="true">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <TopNav onOpenPalette={() => setPaletteOpen(true)} onPrefetch={prefetch} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <main id="main" className="mx-auto w-full max-w-[1600px] flex-1">
          <Suspense fallback={<RouteFallback />}>
            <div key={location.pathname}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/json-xml" element={<JsonXmlTool />} />
                <Route path="/convert" element={<ConvertTool />} />
                <Route path="/codegen" element={<CodeGenTool />} />
                <Route path="/sql" element={<SqlTool />} />
                <Route path="/diff" element={<DiffTool />} />
                <Route path="/encode-decode" element={<EncodeDecodeTool />} />
                <Route path="/jwtvalidator" element={<JwtValidatorTool />} />
                <Route path="/color" element={<ColorTool />} />
                {/* The JWT tool used to live at /jwt-color; keep old links working. */}
                <Route path="/jwt-color" element={<Navigate to="/jwtvalidator" replace />} />
                <Route path="/timestamp" element={<TimestampTool />} />
                <Route path="/cron" element={<CronTool />} />
                <Route path="/http" element={<HttpRefTool />} />
                <Route path="/mock" element={<MockDataTool />} />
                <Route path="/about" element={<About />} />

                <Route path="/json-sort-keys" element={<JsonSortKeys />} />
                <Route path="/json-flatten" element={<JsonFlatten />} />
                <Route path="/json-unflatten" element={<JsonUnflatten />} />
                <Route path="/json-escape" element={<JsonEscape />} />
                <Route path="/json-remove-nulls" element={<JsonClean />} />
                <Route path="/json-remove-empty" element={<JsonClean />} />
                <Route path="/json-merge" element={<JsonMerge />} />
                <Route path="/json-tree" element={<JsonTreeTool />} />
                <Route path="/json-stats" element={<JsonStats />} />
                <Route path="/jsonpath" element={<JsonPathTool />} />
                <Route path="/json-schema" element={<JsonSchemaTool />} />
                <Route path="/uuid" element={<IdGeneratorTool />} />
                <Route path="/password" element={<PasswordTool />} />
                <Route path="/lorem" element={<LoremTool />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <SeoFooter />
            </div>
          </Suspense>
        </main>
      </div>

      {paletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}
