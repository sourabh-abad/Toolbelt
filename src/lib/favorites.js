// Local-only favorites, mirroring the recent-tools pattern in nav.js but
// reactive: multiple components (a tool page's star, a home-page card's star)
// can toggle the same path and stay in sync without a full page reload.
import { useSyncExternalStore, useCallback } from 'react'
import { currentPath } from './redirects.js'

const KEY = 'devpocket-favorites'

// Favorites saved under a URL that has since moved (/jwtvalidator → /jwt-decoder)
// are rewritten to the new one, once, so the star still opens the right tool.
function readSet() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]')
    const migrated = [...new Set(saved.map(currentPath))]
    if (migrated.join() !== saved.join()) localStorage.setItem(KEY, JSON.stringify(migrated))
    return new Set(migrated)
  } catch {
    return new Set()
  }
}

let favSet = readSet()
// useSyncExternalStore requires a stable snapshot reference between renders
// when nothing changed, so the array is only rebuilt inside commit().
let favArray = [...favSet]
const listeners = new Set()

function commit() {
  favArray = [...favSet]
  try {
    localStorage.setItem(KEY, JSON.stringify(favArray))
  } catch {
    // ignore persistence failures (private mode, storage quota)
  }
  listeners.forEach((fn) => fn())
}

export function isFavorite(path) {
  return favSet.has(path)
}

export function toggleFavorite(path) {
  if (favSet.has(path)) favSet.delete(path)
  else favSet.add(path)
  commit()
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return favArray
}

/** Reactive list of favorited tool paths, plus a toggle for the current tool. */
export function useFavorites() {
  const paths = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const toggle = useCallback((path) => toggleFavorite(path), [])
  return { favorites: paths, toggle, isFavorite }
}
