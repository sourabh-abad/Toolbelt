/**
 * Build-time renderer. scripts/prerender.mjs calls render() once per route to
 * write the real page — header, tool UI, guide and footer — into that route's
 * static HTML, so the first paint is the finished page rather than a spinner,
 * and crawlers read exactly what users see.
 *
 * The route's page module is loaded before rendering, so the output is the
 * complete page with no Suspense placeholders. The browser then renders the
 * same tree with createRoot (see main.jsx) once it has loaded the same module.
 */
import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import { StaticRouter } from 'react-router-dom'
import App, { preloadRoute } from './App.jsx'
import { ThemeProvider } from './lib/theme'
import { ToastProvider } from './lib/toast'

export async function render(url) {
  // Load the page module first, so it renders directly. Left to lazy(), React
  // would emit a pending Suspense boundary (the loading skeleton) plus a
  // script that swaps the page in — the static HTML must be the page itself.
  await preloadRoute(url)
  const errors = []
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <ThemeProvider>
        <ToastProvider>
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </ToastProvider>
      </ThemeProvider>
    </StrictMode>,
    {
      onError: (err) => errors.push(err),
      // React outlines a large, already-complete Suspense boundary into a
      // hidden block plus an inline swap script, so a streamed shell can flush
      // early. A static file gains nothing from that; keep the page inline.
      progressiveChunkSize: Number.MAX_SAFE_INTEGER,
    }
  )
  let html = ''
  for await (const chunk of prelude) html += chunk
  // A render error would otherwise ship as a half-empty page. Fail the build.
  if (errors.length) throw new Error(`prerender ${url}: ${errors.map((e) => e?.stack || e).join('\n')}`)
  return html
}
