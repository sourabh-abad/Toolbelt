import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './lib/theme'
import { ToastProvider } from './lib/toast'

// Old hash links (#/cron) predate real URLs — send them to the new path so
// anything already shared or bookmarked keeps working.
if (window.location.hash.startsWith('#/')) {
  const target = window.location.hash.slice(1)
  window.history.replaceState(null, '', target)
}

// After a deploy, a tab opened before it can ask for a chunk that no longer
// exists. Reload once to pick up the new build instead of showing a dead page.
window.addEventListener('vite:preloadError', (event) => {
  // Once per minute at most, so a chunk that is genuinely missing cannot
  // put the tab into a reload loop.
  try {
    const last = Number(sessionStorage.getItem('devpocket-reloaded') || 0)
    if (Date.now() - last < 60_000) return
    sessionStorage.setItem('devpocket-reloaded', String(Date.now()))
  } catch {
    // storage unavailable: reload anyway
  }
  event.preventDefault()
  window.location.reload()
})

// Offline support. The worker only caches this site's own files; see
// scripts/prerender.mjs, which generates it.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
