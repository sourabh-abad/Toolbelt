import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
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
  // The worker calls skipWaiting() and clients.claim(), so a new version takes
  // over this tab as soon as it installs. This tab is still running the old
  // bundle (and the old route table), so offer a reload. First installs (no
  // controller yet) are not updates and stay silent.
  const hadController = Boolean(navigator.serviceWorker.controller)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) window.dispatchEvent(new Event('devpocket:updated'))
  })
  window.addEventListener('load', () => {
    // updateViaCache: 'none' — always fetch sw.js itself from the network.
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {})
  })
}

// The static HTML already shows this route's finished page (see
// src/entry-server.jsx). Load its module first, so the first render is the
// same page rather than a loading state that replaces it for a moment.
//
// That page is then HYDRATED, not re-rendered: React attaches to the markup
// that is already on screen instead of discarding it and building the same
// tree again. Rebuilding repainted every element — including the largest one,
// which is what Lighthouse times as LCP — a couple of seconds after the first
// paint on a slow connection. For hydration to attach cleanly the first
// client render must match the server one exactly, so anything that depends
// on the browser (theme, ⌘ vs Ctrl, favourites, recently used, split-pane
// widths) renders its build-time value first and reads the real one in an
// effect. See useClientValue in src/lib/hydration.js.
//
// The dev server's index.html has an empty root, so there is nothing to
// hydrate there and the tree is rendered from scratch.
const container = document.getElementById('root')
const tree = (
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
  </StrictMode>
)
preloadRoute(window.location.pathname).then(() => {
  if (container.firstElementChild) {
    hydrateRoot(container, tree, {
      // A mismatch makes React re-render the nearest Suspense boundary on the
      // client — the page still works, it just loses the head start for that
      // part. React reports it as a recoverable error; it is not one a user
      // can act on, so it stays out of the production console.
      onRecoverableError(error) {
        if (import.meta.env.DEV || !/hydrat/i.test(String(error?.message || error))) console.error(error)
      },
    })
  } else {
    createRoot(container).render(tree)
  }
})
