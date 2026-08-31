import { useEffect, useState } from 'react'

/**
 * Trails a fast-changing value (a search box) by `delay` ms.
 * Typing stays instant because the input keeps its own state; only the
 * expensive downstream work — walking a parsed document — waits.
 */
export function useDebounced(value, delay = 180) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
