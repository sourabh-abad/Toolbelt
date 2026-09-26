/**
 * macOS (and iPadOS with a keyboard) uses ⌘ for shortcuts; everything else
 * uses Ctrl. userAgentData is the modern source, navigator.platform the
 * fallback Safari and Firefox still provide.
 */
export function isApplePlatform() {
  if (typeof navigator === 'undefined') return false
  const p = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || ''
  return /mac|iphone|ipad|ipod/i.test(p)
}

/** "⌘K" on Apple platforms, "Ctrl K" elsewhere. */
export function shortcutLabel(key) {
  return isApplePlatform() ? `⌘${key}` : `Ctrl ${key}`
}
