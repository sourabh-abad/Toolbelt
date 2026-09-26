import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { pushRecent, hrefFor } from './lib/nav'
import { REDIRECTS } from './lib/redirects'
import { useSeo } from './lib/useSeo'
import { normalizePath } from './lib/seo'
import SeoFooter from './components/SeoFooter'
import ToolContentSections from './components/ToolContentSections'
import TopNav from './components/TopNav'
import Home from './pages/Home'
// Small, and needed by the prerendered 404.html: imported eagerly.
import NotFound from './pages/NotFound'
// Imported eagerly: it is small, and a lazy chunk meant the first click on the
// search button could land while the chunk was still downloading (or fail on a
// stale chunk after a deploy), so the button just took focus and nothing opened.
import CommandPalette from './components/CommandPalette'
import ErrorBoundary from './components/ErrorBoundary'
import UpdateBanner from './components/UpdateBanner'

// Route-level code splitting: heavy tools (sql-formatter, js-yaml, cronstrue)
// load on demand instead of inflating the initial bundle.
// One loader per route: `lazy` uses it for rendering, and hovering a nav link
// calls the same function to warm the chunk before the click lands.
export const LOADERS = {
  '/uuid-v7-generator': () => import('./pages/UuidV7Tool'),
  '/jwt-encoder': () => import('./pages/JwtEncoderTool'),
  '/properties-to-yaml': () => import('./pages/PropertiesToYamlTool'),
  '/yaml-to-properties': () => import('./pages/YamlToPropertiesTool'),
  '/regex-tester': () => import('./pages/RegexTesterTool'),
  '/json-formatter': () => import('./pages/JsonFormatterTool'),
  '/xml-formatter': () => import('./pages/XmlFormatterTool'),
  '/json-to-csv': () => import('./pages/JsonToCsvTool'),
  '/csv-to-json': () => import('./pages/CsvToJsonTool'),
  '/json-to-yaml': () => import('./pages/JsonToYamlTool'),
  '/yaml-to-json': () => import('./pages/YamlToJsonTool'),
  '/hash-generator': () => import('./pages/HashGeneratorTool'),
  '/url-encode': () => import('./pages/UrlEncodeTool'),
  '/base64': () => import('./pages/Base64Tool'),
  '/codegen': () => import('./pages/CodeGenTool'),
  '/sql': () => import('./pages/SqlTool'),
  '/yaml': () => import('./pages/YamlTool'),
  '/properties': () => import('./pages/PropertiesTool'),
  '/properties-compare': () => import('./pages/PropertiesCompareTool'),
  '/sql-guide': () => import('./pages/SqlGuideTool'),
  '/docker-guide': () => import('./pages/DockerGuideTool'),
  '/diff': () => import('./pages/DiffTool'),
  '/jwt-decoder': () => import('./pages/JwtValidatorTool'),
  '/color': () => import('./pages/ColorTool'),
  '/markdown': () => import('./pages/MarkdownTool'),
  '/url-parser': () => import('./pages/UrlParserTool'),
  '/html-entities': () => import('./pages/HtmlEntitiesTool'),
  '/case-converter': () => import('./pages/CaseConverterTool'),
  '/number-base': () => import('./pages/NumberBaseTool'),
  '/timestamp': () => import('./pages/TimestampTool'),
  '/cron': () => import('./pages/CronTool'),
  '/http': () => import('./pages/HttpRefTool'),
  '/mock': () => import('./pages/MockDataTool'),
  '/about': () => import('./pages/About'),
  '/privacy': () => import('./pages/Privacy'),
  '/json-sort-keys': () => import('./pages/JsonSortKeys'),
  '/json-flatten': () => import('./pages/JsonFlatten'),
  '/json-unflatten': () => import('./pages/JsonUnflatten'),
  '/json-escape': () => import('./pages/JsonEscape'),
  '/json-remove-nulls': () => import('./pages/JsonClean'),
  '/json-remove-empty': () => import('./pages/JsonClean'),
  '/json-merge': () => import('./pages/JsonMerge'),
  '/json-viewer': () => import('./pages/JsonTreeTool'),
  '/json-validator': () => import('./pages/JsonValidatorTool'),
  '/json-stats': () => import('./pages/JsonStats'),
  '/jsonpath': () => import('./pages/JsonPathTool'),
  '/json-schema-generator': () => import('./pages/JsonSchemaTool'),
  '/uuid': () => import('./pages/IdGeneratorTool'),
  '/password': () => import('./pages/PasswordTool'),
  '/lorem': () => import('./pages/LoremTool'),
}

const prefetched = new Set()
const prefetch = (path) => {
  if (prefetched.has(path) || !LOADERS[path]) return
  prefetched.add(path)
  preloadRoute(path)
}

// One lazy component per page module (two routes share JsonClean).
const LAZY = new Map()
function lazyFor(path) {
  const loader = LOADERS[path]
  if (!LAZY.has(loader)) LAZY.set(loader, lazy(loader))
  return LAZY.get(loader)
}

// Page modules that have already loaded render directly, with no Suspense
// round. main.jsx fills this for the landing route before the first render,
// so the prerendered tool page is replaced by the identical live one without
// flashing a loading state; hovering a menu link fills it for the next page.
const READY = new Map()

/** Loads a route's page module ahead of rendering it. Never rejects. */
export function preloadRoute(pathname) {
  const path = normalizePath(pathname)
  if (!LOADERS[path] || READY.has(path)) return Promise.resolve()
  return LOADERS[path]()
    .then((m) => {
      READY.set(path, m.default)
    })
    .catch(() => {
      // Rendering will retry through lazy() and the error boundary.
    })
}

function Page({ path }) {
  // Chosen once per mount: switching from the lazy wrapper to the loaded
  // module mid-visit (after a hover prefetch, say) would remount the tool and
  // throw away what the user typed.
  const [Component] = useState(() => READY.get(path) || lazyFor(path))
  return <Component />
}


// Shown while a tool's chunk loads (the static HTML preloads it, so this is
// usually a single frame). It has the page header and two panels in the
// places the tool will draw them, so the page does not flash blank and then
// jump when the tool arrives.
function RouteFallback() {
  const bar = 'sunken rounded-md animate-pulse'
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading tool…</span>
      <div className="bd flex items-center gap-3 border-b px-4 py-4 sm:px-6 sm:py-5" aria-hidden="true">
        <div className={`h-10 w-10 shrink-0 rounded-xl ${bar}`} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className={`h-4 w-48 max-w-full ${bar}`} />
          <div className={`h-3 w-80 max-w-full ${bar}`} />
        </div>
      </div>
      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2" aria-hidden="true">
        {[0, 1].map((k) => (
          <div key={k} className="panel rounded-2xl border">
            <div className="bd border-b px-4 py-3.5">
              <div className={`h-4 w-24 ${bar}`} />
            </div>
            <div className="p-4">
              <div className={`h-72 w-full rounded-xl ${bar}`} />
            </div>
          </div>
        ))}
      </div>
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
    pushRecent(normalizePath(location.pathname))
  }, [location.pathname])


  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
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
          {/* Keyed by route, so moving to another page clears an error. */}
          <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<RouteFallback />}>
            <div>
              <Routes>
                <Route path="/" element={<Home />} />
                {Object.keys(LOADERS).map((path) => (
                  <Route key={path} path={path} element={<Page path={path} />} />
                ))}
                {/* Retired URLs (src/lib/redirects.js). A static stub answers
                    them on first load; this covers links inside the app. */}
                {Object.entries(REDIRECTS).map(([from, to]) => (
                  <Route key={from} path={from} element={<Navigate to={hrefFor(to)} replace />} />
                ))}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <ToolContentSections />
              <SeoFooter />
            </div>
          </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <UpdateBanner />

      {paletteOpen && (
        <ErrorBoundary compact>
          <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </ErrorBoundary>
      )}
    </div>
  )
}
