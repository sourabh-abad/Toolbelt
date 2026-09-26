import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App, { preloadRoute } from './App.jsx'
import { ThemeProvider } from './lib/theme'
import { ToastProvider } from './lib/toast'
import { reloadOnce } from './lib/reload'
import ErrorBoundary from './components/ErrorBoundary'

// Old hash links (#/cron) predate real URLs — send them to the new path so
// anything already shared or bookmarked keeps working.
if (window.location.hash.startsWith('#/')) {
  const target = window.location.hash.slice(1)
  window.history.replaceState(null, '', target)
}

// After a deploy, a tab opened before it can ask for a chunk that no longer
// exists. Reload once to pick up the new build. If a reload already happened
// in the last minute, let the error through: ErrorBoundary then shows "A new
// version is available — Reload" instead of a blank page.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnce()) event.preventDefault()
})

// Offline support. The worker only caches this site's own files; see
// scripts/prerender.mjs, which generates it.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // updateViaCache: 'none' — always fetch sw.js itself from the network.
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {})
  })
}

// The static HTML already shows this route's finished page (see
// src/entry-server.jsx). Load its module first, so the first render is the
// same page rather than a loading state that replaces it for a moment.
const root = createRoot(document.getElementById('root'))
preloadRoute(window.location.pathname).then(() => root.render(
  <StrictMode>
    <ErrorBoundary>
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
))
