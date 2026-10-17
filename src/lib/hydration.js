import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * A value only the browser knows — navigator.platform, localStorage, a media
 * query — read in a way that keeps hydration intact.
 *
 * The static HTML was rendered at build time, where none of that exists, so
 * the first client render has to produce the same markup or React throws the
 * server DOM away and rebuilds it. useSyncExternalStore handles exactly this
 * split: while hydrating it renders `serverValue`, then re-renders once with
 * `getClient()`. On the dev server (nothing to hydrate) and after client-side
 * navigation it is `getClient()` from the first render, so there is no flash.
 *
 * `getClient` must return a primitive or a stable reference — a fresh array
 * on every call would re-render forever.
 */
export function useClientValue(getClient, serverValue) {
  return useSyncExternalStore(subscribe, getClient, () => serverValue)
}

/** False during server rendering and hydration, true once the page is live. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false)
}
