import { useEffect, useState } from 'react'

/**
 * The current time in ms, ticking every `interval` ms — and null until the
 * component has mounted, so the prerendered HTML and the first client render
 * agree (the build has no "now" that would still be true when you read it).
 */
export function useNow(interval = 1000) {
  const [now, setNow] = useState(null)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, interval)
    return () => clearInterval(id)
  }, [interval])
  return now
}
