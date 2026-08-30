// Standard 5-field cron parsing plus a next-run calculator.
// Fields: minute hour day-of-month month day-of-week

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const RANGES = [
  { min: 0, max: 59, name: 'minute' },
  { min: 0, max: 23, name: 'hour' },
  { min: 1, max: 31, name: 'day of month' },
  { min: 1, max: 12, name: 'month' },
  { min: 0, max: 6, name: 'day of week' },
]

function normalizeNames(field, index) {
  let f = field.toLowerCase()
  if (index === 3) MONTHS.forEach((m, i) => (f = f.replace(new RegExp(m, 'g'), String(i + 1))))
  if (index === 4) {
    DAYS.forEach((d, i) => (f = f.replace(new RegExp(d, 'g'), String(i))))
    f = f.replace(/\b7\b/g, '0')
  }
  return f
}

function parseField(field, index) {
  const { min, max, name } = RANGES[index]
  const values = new Set()
  const normalized = normalizeNames(field, index)

  for (const part of normalized.split(',')) {
    const [rangePart, stepPart] = part.split('/')
    const step = stepPart ? Number(stepPart) : 1
    if (stepPart && (!Number.isInteger(step) || step < 1)) {
      throw new Error(`Invalid step "${stepPart}" in ${name} field`)
    }

    let start
    let end
    if (rangePart === '*') {
      start = min
      end = max
    } else if (rangePart.includes('-')) {
      const [a, b] = rangePart.split('-').map(Number)
      start = a
      end = b
    } else {
      start = Number(rangePart)
      end = Number(rangePart)
    }

    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      throw new Error(`Invalid ${name} value "${part}"`)
    }
    if (start < min || end > max || start > end) {
      throw new Error(`${name} value "${part}" is out of range (${min}-${max})`)
    }
    for (let v = start; v <= end; v += step) values.add(v)
  }
  return values
}

export function parseCron(expression) {
  const fields = expression.trim().split(/\s+/)
  if (fields.length !== 5) {
    throw new Error(`Expected 5 fields (minute hour day month weekday), got ${fields.length}`)
  }
  return fields.map((f, i) => parseField(f, i))
}

/** Next `count` run times after `from`, computed by minute-stepping. */
export function nextRuns(expression, count = 5, from = new Date()) {
  const [minutes, hours, doms, months, dows] = parseCron(expression)
  const results = []
  const cursor = new Date(from.getTime())
  cursor.setSeconds(0, 0)
  cursor.setMinutes(cursor.getMinutes() + 1)

  // Cap the search at ~4 years of minutes so an unsatisfiable expression
  // (e.g. 30 2 31 2 *) terminates instead of spinning forever.
  const LIMIT = 60 * 24 * 366 * 4
  for (let i = 0; i < LIMIT && results.length < count; i++) {
    const dom = cursor.getDate()
    const dow = cursor.getDay()
    const domRestricted = doms.size !== 31
    const dowRestricted = dows.size !== 7
    // Cron quirk: when both day-of-month and day-of-week are restricted the
    // match is an OR, not an AND.
    const dayMatch =
      domRestricted && dowRestricted
        ? doms.has(dom) || dows.has(dow)
        : (!domRestricted || doms.has(dom)) && (!dowRestricted || dows.has(dow))

    if (minutes.has(cursor.getMinutes()) && hours.has(cursor.getHours()) && months.has(cursor.getMonth() + 1) && dayMatch) {
      results.push(new Date(cursor.getTime()))
    }
    cursor.setMinutes(cursor.getMinutes() + 1)
  }
  return results
}

export const CRON_PRESETS = [
  { label: 'Every minute', expr: '* * * * *' },
  { label: 'Every 5 minutes', expr: '*/5 * * * *' },
  { label: 'Every 15 minutes', expr: '*/15 * * * *' },
  { label: 'Hourly (on the hour)', expr: '0 * * * *' },
  { label: 'Every 6 hours', expr: '0 */6 * * *' },
  { label: 'Daily at midnight', expr: '0 0 * * *' },
  { label: 'Daily at 9am', expr: '0 9 * * *' },
  { label: 'Weekdays at 9am', expr: '0 9 * * 1-5' },
  { label: 'Every Monday 8am', expr: '0 8 * * 1' },
  { label: 'First of month, midnight', expr: '0 0 1 * *' },
  { label: 'Every Sunday 3am', expr: '0 3 * * 0' },
]
