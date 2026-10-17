import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ theme: 'dark', toggle: () => {} })

// Mirrors the inline script in index.html, which applies the saved or OS
// theme to <html> before the first paint. The two must agree.
function readInitial() {
  try {
    const saved = localStorage.getItem('devpocket-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // localStorage can throw in private mode — fall through to the default
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light'
  }
  return 'dark'
}

export function ThemeProvider({ children }) {
  // The build renders with 'dark' and so does the first client render, so the
  // static HTML hydrates cleanly; the real preference is read right after.
  // Nothing visible depends on this value before then: index.html has already
  // put the right class on <html>, and the toggle button shows its icon via
  // CSS from that class rather than from this state.
  const [theme, setTheme] = useState('dark')
  const [live, setLive] = useState(false)

  useEffect(() => {
    setTheme(readInitial())
    setLive(true)
  }, [])

  useEffect(() => {
    if (!live) return
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('devpocket-theme', theme)
    } catch {
      // ignore persistence failures
    }
  }, [theme, live])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
