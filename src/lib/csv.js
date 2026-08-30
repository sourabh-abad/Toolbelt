// Minimal RFC-4180-ish CSV parse/stringify (quotes, escaped quotes, newlines).

export function parseCsv(text, delimiter = ',') {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.length && !(r.length === 1 && r[0] === ''))
}

export function csvToObjects(text, delimiter = ',') {
  const rows = parseCsv(text, delimiter)
  if (!rows.length) return []
  const [header, ...body] = rows
  return body.map((r) => {
    const obj = {}
    header.forEach((key, i) => {
      obj[key] = coerce(r[i] ?? '')
    })
    return obj
  })
}

function coerce(v) {
  if (v === '') return null
  if (v === 'true') return true
  if (v === 'false') return false
  if (v === 'null') return null
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  return v
}

function escapeField(value, delimiter) {
  const s = value === null || value === undefined ? '' : String(value)
  if (s.includes('"') || s.includes(delimiter) || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function objectsToCsv(rows, delimiter = ',') {
  if (!Array.isArray(rows) || !rows.length) return ''
  const flat = rows.map((r) => (r && typeof r === 'object' && !Array.isArray(r) ? r : { value: r }))
  const headers = []
  for (const r of flat) {
    for (const k of Object.keys(r)) if (!headers.includes(k)) headers.push(k)
  }
  const lines = [headers.map((h) => escapeField(h, delimiter)).join(delimiter)]
  for (const r of flat) {
    lines.push(
      headers
        .map((h) => {
          const v = r[h]
          return escapeField(v !== null && typeof v === 'object' ? JSON.stringify(v) : v, delimiter)
        })
        .join(delimiter)
    )
  }
  return lines.join('\n')
}
