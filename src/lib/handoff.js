/**
 * Passing a value from one tool to another ("Inspect this URL in the URL
 * parser") without putting it in the address: sessionStorage stays in this tab
 * and is never sent anywhere, where a ?query would reach the server's logs.
 */
const KEY = 'devpocket-handoff'

export function handOff(to, value) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ to, value, at: Date.now() }))
  } catch {
    // storage blocked: the target tool just opens empty
  }
}

/** The value handed to `path` in the last minute, removed once read. */
export function takeHandoff(path) {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const { to, value, at } = JSON.parse(raw)
    if (to !== path || Date.now() - at > 60_000) return null
    sessionStorage.removeItem(KEY)
    return value
  } catch {
    return null
  }
}
