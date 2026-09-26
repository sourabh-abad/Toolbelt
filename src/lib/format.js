/** "1 node", "3 nodes"; pass the plural form when it is not just +s. */
export function plural(n, one, many = `${one}s`) {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`
}

const pad = (n) => String(n).padStart(2, '0')

/** The viewer's zone as a short name ("IST", "GMT+5:30", "PDT"). */
function zoneName(date) {
  try {
    return (
      new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
        .formatToParts(date)
        .find((p) => p.type === 'timeZoneName')?.value || ''
    )
  } catch {
    return ''
  }
}

/**
 * An unambiguous timestamp: local time in ISO order with the zone, then the
 * same instant in UTC — "2020-09-13 17:56:40 IST (2020-09-13T12:26:40Z)".
 * toLocaleString() gives 13/09/2020 or 9/13/2020 depending on the browser,
 * and nobody can tell which one they are looking at.
 */
export function formatInstant(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 'Invalid date'
  const local = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  const zone = zoneName(date)
  const utc = date.toISOString().replace(/\.\d{3}Z$/, 'Z')
  return `${local}${zone ? ` ${zone}` : ''} (${utc})`
}
