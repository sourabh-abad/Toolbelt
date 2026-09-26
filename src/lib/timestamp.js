/**
 * Unix timestamp parsing and formatting for the Timestamp Converter. Pure
 * functions; the page adds the clock, the zone picker and the tables.
 */

export const UNITS = {
  s: { label: 'seconds', perMs: 1 / 1000 },
  ms: { label: 'milliseconds', perMs: 1 },
  us: { label: 'microseconds', perMs: 1000 },
  ns: { label: 'nanoseconds', perMs: 1_000_000 },
}

// The largest signed 32-bit value: 03:14:07 UTC on 19 January 2038.
export const Y2038 = 2 ** 31 - 1

/**
 * Reads a timestamp and guesses its unit from the digit count: up to 10
 * digits is seconds, 11–13 milliseconds, 14–16 microseconds, 17–19
 * nanoseconds. A decimal point means fractional seconds. BigInt keeps µs and
 * ns exact; the Date gets millisecond precision.
 */
export function parseEpoch(raw, unit = 'auto') {
  const s = String(raw).trim().replace(/[_,\s]/g, '')
  if (!s) return null
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(s)
  if (!m) return { error: 'Not a number — enter digits, optionally with a minus sign or a decimal point' }
  const [, sign, int, frac] = m
  const digits = int.replace(/^0+(?=\d)/, '').length
  let u = unit
  if (u === 'auto') u = frac !== undefined || digits <= 10 ? 's' : digits <= 13 ? 'ms' : digits <= 16 ? 'us' : 'ns'
  if (digits > 19 && unit === 'auto') return { error: 'Too many digits for a timestamp (nanoseconds have 19)' }
  let ms
  let subMs = ''
  if (u === 's') ms = Number(`${sign}${int}.${frac || 0}`) * 1000
  else if (u === 'ms') ms = Number(`${sign}${int}${frac ? '.' + frac : ''}`)
  else {
    const div = u === 'us' ? 1000n : 1_000_000n
    const big = BigInt(sign + int)
    ms = Number(big / div)
    const rem = (big < 0n ? -big : big) % div
    subMs = rem ? rem.toString().padStart(u === 'us' ? 3 : 6, '0') : ''
  }
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return { error: 'Outside the range a date can represent (±273,790 years)' }
  const seconds = Math.floor(ms / 1000)
  return { date, unit: u, ms, seconds, subMs, beyond2038: seconds > Y2038 || seconds < -(2 ** 31) }
}

/**
 * Reads a date string. ISO 8601 with Z or an offset is exact; a date-time
 * without one is read in `zone` (local by default), which the result says.
 */
export function parseDateString(input) {
  const s = input.trim()
  if (!s) return null
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(s)
  if (iso) {
    const [, y, mo, d, h = '00', mi = '00', se = '00', frac = '', off] = iso
    const msPart = frac ? Number(frac.slice(0, 3).padEnd(3, '0')) : 0
    if (off || !iso[4]) {
      // Date-only strings are UTC in ECMAScript; keep that and say so.
      const offMin = !off || /z/i.test(off) ? 0 : (off[0] === '-' ? -1 : 1) * (Number(off.slice(1, 3)) * 60 + Number(off.slice(-2)))
      const t = Date.UTC(+y, +mo - 1, +d, +h, +mi, +se, msPart) - offMin * 60_000
      return valid(new Date(t), off ? 'offset' : 'utc-date', +mo, +d)
    }
    return valid(new Date(+y, +mo - 1, +d, +h, +mi, +se, msPart), 'local', +mo, +d)
  }
  const t = Date.parse(s)
  if (Number.isNaN(t)) return { error: 'Not a date this page can read — try ISO 8601 (2024-01-15T09:30:00Z) or RFC 2822 (Mon, 15 Jan 2024 09:30:00 +0000)' }
  return { date: new Date(t), assumed: /([+-]\d{4}|GMT|UTC|Z)\b/i.test(s) ? 'offset' : 'local' }
}

function valid(date, assumed, mo, d) {
  if (Number.isNaN(date.getTime()) || mo < 1 || mo > 12 || d < 1 || d > 31) return { error: 'That date does not exist' }
  return { date, assumed }
}

const pad = (n, w = 2) => String(Math.abs(n)).padStart(w, '0')

/** "+05:30" for a zone at an instant; "local" uses the browser's zone. */
export function offsetOf(date, zone) {
  if (zone === 'local') {
    const mins = -date.getTimezoneOffset()
    return `${mins < 0 ? '-' : '+'}${pad(Math.floor(Math.abs(mins) / 60))}:${pad(Math.abs(mins) % 60)}`
  }
  const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')?.value
  const m = /GMT([+-]\d{2}):?(\d{2})?/.exec(part || '')
  return m ? `${m[1]}:${m[2] || '00'}` : '+00:00'
}

/** Wall-clock parts of an instant in a zone. */
function partsIn(date, zone) {
  const opts = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', weekday: 'short' }
  if (zone !== 'local') opts.timeZone = zone
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', opts).formatToParts(date).map((x) => [x.type, x.value]))
  return p
}

/** ISO 8601 in a zone, with its offset: 2024-01-15T15:00:00.000+05:30. */
export function isoIn(date, zone) {
  if (zone === 'UTC') return date.toISOString()
  const p = partsIn(date, zone)
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}.${pad(date.getUTCMilliseconds(), 3)}${offsetOf(date, zone)}`
}

/** RFC 2822 (email Date header) in a zone: Mon, 15 Jan 2024 15:00:00 +0530. */
export function rfc2822In(date, zone) {
  const p = partsIn(date, zone)
  const month = new Intl.DateTimeFormat('en-US', { month: 'short', ...(zone !== 'local' ? { timeZone: zone } : {}) }).format(date)
  return `${p.weekday}, ${p.day} ${month} ${p.year} ${p.hour}:${p.minute}:${p.second} ${offsetOf(date, zone).replace(':', '')}`
}

const REL_UNITS = [
  ['year', 365.25 * 864e5],
  ['month', 30.44 * 864e5],
  ['week', 7 * 864e5],
  ['day', 864e5],
  ['hour', 36e5],
  ['minute', 6e4],
  ['second', 1e3],
]

/** "in 3 days", "2 hours ago", via Intl.RelativeTimeFormat. */
export function relative(date, now, locale = 'en') {
  const diff = date.getTime() - now
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (Math.abs(diff) < 1000) return rtf.format(0, 'second')
  for (const [unit, ms] of REL_UNITS) {
    if (Math.abs(diff) >= ms || unit === 'second') return rtf.format(Math.round(diff / ms), unit)
  }
  return ''
}

/** One row per non-empty line: a timestamp or a date string. */
export function convertBatch(text, unit = 'auto') {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5000)
    .map((input) => {
      const r = /^-?[\d_,]+(?:\.\d+)?$/.test(input) ? parseEpoch(input, unit) : parseDateString(input)
      if (!r || r.error) return { input, error: r?.error || 'Not readable' }
      return { input, unit: r.unit || null, seconds: Math.floor(r.date.getTime() / 1000), ms: r.date.getTime(), iso: r.date.toISOString() }
    })
}

export function batchCsv(rows) {
  const q = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return ['input,unix_seconds,unix_ms,iso_8601_utc', ...rows.map((r) => (r.error ? [q(r.input), '', '', ''] : [q(r.input), r.seconds, r.ms, r.iso]).join(','))].join('\n') + '\n'
}

/** "Current timestamp" one-liners, seconds unless the language defaults to ms. */
export const SNIPPETS = [
  ['JavaScript', 'Math.floor(Date.now() / 1000)   // Date.now() is milliseconds'],
  ['Python', 'import time; int(time.time())'],
  ['Go', 'time.Now().Unix()   // .UnixMilli() for ms'],
  ['Java', 'Instant.now().getEpochSecond()   // System.currentTimeMillis() for ms'],
  ['PHP', 'time()'],
  ['PostgreSQL', 'SELECT extract(epoch FROM now())::bigint;'],
  ['MySQL', 'SELECT UNIX_TIMESTAMP();'],
  ['Bash', 'date +%s   # date +%s%3N for ms (GNU date)'],
]

export const DEFAULT_ZONES = ['local', 'Asia/Kolkata', 'Africa/Johannesburg', 'UTC']

export function zoneLabel(zone) {
  if (zone === 'local') return 'Local'
  if (zone === 'UTC') return 'UTC'
  if (zone === 'Asia/Kolkata') return 'India · IST'
  if (zone === 'Africa/Johannesburg') return 'South Africa · SAST'
  const city = zone.split('/').pop().replace(/_/g, ' ')
  return city
}
