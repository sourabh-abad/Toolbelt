// Wires /bcrypt into the existing route tables and adds inbound related links.
// Every edit anchors on a line that must occur exactly once; otherwise it stops.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2]
const seoEntry = readFileSync(process.argv[3], 'utf8')

function patch(rel, edits) {
  const file = join(root, rel)
  let src = readFileSync(file, 'utf8')
  for (const [anchor, insert, where = 'after'] of edits) {
    const n = src.split(anchor).length - 1
    if (n !== 1) throw new Error(`${rel}: anchor found ${n} times:\n${anchor}`)
    src = src.replace(anchor, where === 'after' ? anchor + insert : insert + anchor)
  }
  writeFileSync(file, src)
  console.log('patched', rel)
}

patch('src/content/encoding.js', [
  [`      ['/jwt-encoder', 'Sign a JWT with HMAC-SHA256 in one step'],\n`, `      ['/bcrypt', 'Hash a password properly — slow and salted — instead of digesting it'],\n`],
])
// The file ends with the hash-generator entry and the closing brace.
{
  const file = join(root, 'src/content/encoding.js')
  const src = readFileSync(file, 'utf8')
  if (!src.endsWith('  },\n}\n')) throw new Error('encoding.js does not end as expected')
  if (src.includes("'/bcrypt': {")) throw new Error('encoding.js already has /bcrypt')
  writeFileSync(file, src.slice(0, -2) + seoEntry + '}\n')
  console.log('added /bcrypt entry to src/content/encoding.js')
}

patch('src/lib/seo.js', [
  [`      ['/base64', 'Encode random key bytes as Base64'],\n`, `      ['/bcrypt', 'Hash the generated password with bcrypt before storing it'],\n`],
  [`      ['/lorem', 'Longer placeholder text for description fields'],\n`, `      ['/bcrypt', 'Hash a password for the seeded user records'],\n`],
])

patch('src/content/jwt.js', [
  [`      ['/json-validator', 'Check a large claims object before signing it'],\n`, `      ['/bcrypt', 'Verify the login password with bcrypt before issuing the token'],\n`],
])

patch('src/lib/nav.js', [
  [`  ArrowLeftRight,\n} from 'lucide-react'`, `  LockKeyhole,\n`, 'before'],
  [
    `  { to: '/hash-generator', label: 'Hash Generator', icon: Fingerprint, group: 'Encoding', accent: 'violet', description: 'SHA-256, MD5, SHA-512 and HMAC of text or files' },\n`,
    `  { to: '/bcrypt', label: 'Bcrypt Generator', icon: LockKeyhole, group: 'Encoding', accent: 'rose', description: 'Hash passwords with bcrypt and verify them against a hash' },\n`,
  ],
  [
    `  '/hash-generator': ['sha', 'sha1', 'sha256', 'sha-256', 'sha384', 'sha512', 'md5', 'hash', 'checksum', 'digest', 'hmac', 'sha256sum', 'file hash'],\n`,
    `  '/bcrypt': ['bcrypt', 'bcrypt generator', 'bcrypt hash', 'bcrypt verify', 'bcrypt decrypt', 'bcrypt checker', 'bcrypt online', 'password hash', 'hash password', 'password hashing', 'cost factor', 'rounds', 'salt', '$2a$', '$2b$', '$2y$', 'htpasswd', 'spring security', 'password_hash', 'blowfish'],\n`,
  ],
])

patch('src/App.jsx', [
  [`  '/hash-generator': () => import('./pages/HashGeneratorTool'),\n`, `  '/bcrypt': () => import('./pages/BcryptTool'),\n`],
])

patch('README.md', [
  [
    `- **Hash Generator** — MD5, SHA-1/256/384/512 of text or files, hex/HEX/Base64, checksum match and HMAC.\n`,
    `- **Bcrypt Generator** — hash a password with bcrypt at a chosen cost (4–16) and prefix ($2a/$2b/$2y), verify a password against a hash, and see the version, cost and salt inside it. Runs in a Web Worker.\n`,
  ],
])
