/**
 * URL parsing and query-string editing on top of the browser's own WHATWG URL
 * parser, so the result is what fetch() and the address bar would do with the
 * same text, not what a regex guesses.
 */

export function parseUrl(text) {
  const raw = String(text).trim()
  if (!raw) return null
  let url
  let assumedScheme = false
  // "localhost:3000/x" parses as a URL whose *scheme* is "localhost:". A bare
  // host:port is far more likely to mean https://localhost:3000/x.
  const hostPort = /^[\w.-]+:\d+(?:[/?#]|$)/.test(raw)
  try {
    if (hostPort) throw new Error('host:port')
    url = new URL(raw)
  } catch {
    // "example.com/path" is how people paste URLs; try it as https. Text that
    // already names a scheme is simply invalid.
    if (!hostPort && /^[a-z][a-z0-9+.-]*:/i.test(raw)) throw new Error('Not a valid URL')
    try {
      url = new URL(`https://${raw}`)
      assumedScheme = true
    } catch {
      throw new Error('Not a valid URL')
    }
  }

  const params = [...url.searchParams.entries()].map(([key, value], index) => ({ index, key, value }))
  const counts = params.reduce((m, p) => m.set(p.key, (m.get(p.key) || 0) + 1), new Map())

  return {
    href: url.href,
    assumedScheme,
    parts: [
      ['Protocol', url.protocol],
      ['Username', url.username],
      ['Password', url.password],
      ['Host', url.host],
      ['Hostname', url.hostname],
      ['Port', url.port],
      ['Origin', url.origin === 'null' ? '' : url.origin],
      ['Path', url.pathname],
      ['Query', url.search],
      ['Fragment', url.hash],
    ],
    pathSegments: url.pathname.split('/').filter(Boolean).map(safeDecode),
    params: params.map((p) => ({ ...p, repeated: counts.get(p.key) > 1 })),
    warnings: warningsFor(raw, url),
  }
}

function safeDecode(s) {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

function warningsFor(raw, url) {
  const w = []
  if (url.username || url.password) w.push('The URL carries credentials (user:password@). They end up in logs, history and Referer headers.')
  if (/%25[0-9a-f]{2}/i.test(raw)) w.push('It contains %25 followed by hex digits, which usually means something was percent-encoded twice.')
  if (/\+/.test(url.search)) w.push('The query contains "+". URLSearchParams and HTML forms read it as a space; a server that decodes with decodeURIComponent keeps it as "+".')
  const typedHost = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').split(/[/?#]/)[0]
  if (url.hostname.includes('xn--') && [...typedHost].some((c) => c.charCodeAt(0) > 127)) {
    w.push(`The host is internationalised; browsers send it as ${url.hostname} (punycode).`)
  }
  if (url.protocol === 'http:' && url.hostname !== 'localhost' && !/^127\./.test(url.hostname)) w.push('This is plain http:, not https:.')
  const defaultPort = { 'http:': '80', 'https:': '443' }[url.protocol]
  if (defaultPort && new RegExp(`:${defaultPort}(?:[/?#]|$)`).test(raw)) w.push(`Port ${defaultPort} is the default for ${url.protocol} and is dropped from the normalised URL.`)
  return w
}

/** Rebuilds a URL from its base and an edited list of { key, value } pairs. */
export function withParams(href, params) {
  const url = new URL(href)
  const sp = new URLSearchParams()
  for (const { key, value } of params) if (key !== '') sp.append(key, value)
  url.search = sp.toString()
  return url.href
}

/** The query string as a JSON object; repeated keys become arrays. */
export function paramsToJson(params) {
  const out = {}
  for (const { key, value } of params) {
    if (!(key in out)) out[key] = value
    else out[key] = [].concat(out[key], value)
  }
  return out
}
