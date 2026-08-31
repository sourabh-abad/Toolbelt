// Deterministic-ish fake data generation for seeding dev databases.

const FIRST = ['Aarav', 'Diya', 'Kabir', 'Ananya', 'Vihaan', 'Isha', 'Rohan', 'Meera', 'Thabo', 'Naledi', 'Sipho', 'Zanele', 'Ada', 'Grace', 'Linus', 'Nina', 'Omar', 'Lena', 'Marco', 'Sofia']
const LAST = ['Sharma', 'Patel', 'Iyer', 'Nair', 'Reddy', 'Dlamini', 'Nkosi', 'Botha', 'Mokoena', 'Silva', 'Kim', 'Novak', 'Rossi', 'Haddad', 'Okafor', 'Muller']
const DOMAINS = ['example.com', 'test.dev', 'mail.co', 'acme.io', 'devpocket.in']
const COMPANIES = ['Acme Corp', 'Globex', 'Initech', 'Umbrella Ltd', 'Soylent', 'Hooli', 'Vehement', 'Stark Industries']
const CITIES = [
  { city: 'Mumbai', country: 'India' },
  { city: 'Bengaluru', country: 'India' },
  { city: 'Delhi', country: 'India' },
  { city: 'Cape Town', country: 'South Africa' },
  { city: 'Johannesburg', country: 'South Africa' },
  { city: 'Durban', country: 'South Africa' },
  { city: 'London', country: 'United Kingdom' },
  { city: 'Berlin', country: 'Germany' },
]
const STREETS = ['Main St', 'Oak Ave', 'MG Road', 'Long St', 'Park Lane', 'Hill Rd']
const STATUSES = ['active', 'pending', 'suspended', 'archived']

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const int = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

export const FIELDS = [
  { key: 'id', label: 'id (sequential)', gen: (i) => i + 1 },
  { key: 'uuid', label: 'uuid', gen: () => crypto.randomUUID() },
  { key: 'firstName', label: 'firstName', gen: () => pick(FIRST) },
  { key: 'lastName', label: 'lastName', gen: () => pick(LAST) },
  { key: 'fullName', label: 'fullName', gen: () => `${pick(FIRST)} ${pick(LAST)}` },
  { key: 'email', label: 'email', gen: () => `${pick(FIRST).toLowerCase()}.${pick(LAST).toLowerCase()}${int(1, 99)}@${pick(DOMAINS)}` },
  { key: 'username', label: 'username', gen: () => `${pick(FIRST).toLowerCase()}_${int(100, 999)}` },
  { key: 'phone', label: 'phone', gen: () => `+${pick(['91', '27', '1', '44'])}-${int(600, 999)}-${int(1000000, 9999999)}` },
  { key: 'company', label: 'company', gen: () => pick(COMPANIES) },
  { key: 'jobTitle', label: 'jobTitle', gen: () => pick(['Engineer', 'Analyst', 'Manager', 'Designer', 'Architect', 'SRE']) },
  { key: 'street', label: 'street', gen: () => `${int(1, 999)} ${pick(STREETS)}` },
  { key: 'city', label: 'city', gen: () => pick(CITIES).city },
  { key: 'country', label: 'country', gen: () => pick(CITIES).country },
  { key: 'zip', label: 'zip', gen: () => String(int(10000, 99999)) },
  { key: 'age', label: 'age', gen: () => int(18, 72) },
  { key: 'price', label: 'price', gen: () => Number((Math.random() * 900 + 10).toFixed(2)) },
  { key: 'quantity', label: 'quantity', gen: () => int(1, 100) },
  { key: 'isActive', label: 'isActive (bool)', gen: () => Math.random() > 0.3 },
  { key: 'status', label: 'status (enum)', gen: () => pick(STATUSES) },
  { key: 'createdAt', label: 'createdAt (ISO)', gen: () => new Date(Date.now() - int(0, 60 * 60 * 24 * 365) * 1000).toISOString() },
  { key: 'ipAddress', label: 'ipAddress', gen: () => `${int(10, 220)}.${int(0, 255)}.${int(0, 255)}.${int(1, 254)}` },
]

export function generateRows(selectedKeys, count) {
  const defs = FIELDS.filter((f) => selectedKeys.includes(f.key))
  return Array.from({ length: count }, (_, i) => {
    const row = {}
    for (const f of defs) row[f.key] = f.gen(i)
    return row
  })
}

function sqlValue(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  return `'${String(v).replace(/'/g, "''")}'`
}

export function toSqlInserts(rows, table = 'users') {
  if (!rows.length) return ''
  const cols = Object.keys(rows[0])
  return rows
    .map((r) => `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((c) => sqlValue(r[c])).join(', ')});`)
    .join('\n')
}
