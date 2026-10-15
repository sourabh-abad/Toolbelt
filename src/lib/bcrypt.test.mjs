import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from './bcryptHash.js'
import {
  parseHash,
  withVersion,
  truncates,
  utf8Length,
  scaleCost,
  formatDuration,
  VERSIONS,
  MAX_PASSWORD_BYTES,
} from './bcrypt.js'

// Published OpenBSD test vectors (password, hash).
const VECTORS = [
  ['U*U', '$2a$05$CCCCCCCCCCCCCCCCCCCCC.E5YPO9kmyuRGyh0XouQYb4YMJKvyOeW'],
  ['U*U*', '$2a$05$CCCCCCCCCCCCCCCCCCCCC.VGOzA784oUp/Z0DY336zx7pLYAy0lwK'],
  ['', '$2a$06$DCq7YPn5Rq63x1Lad4cll.TV4S6ytwfsfvkgY8jIucDrjc8deX1s.'],
]

test('parseHash splits a valid hash into its parts', () => {
  const p = parseHash('$2b$10$oWv0KBo0TjFErdsxHPZ6S.GGO7a2bG.12giquryTI7537Aa5JQdPq')
  assert.equal(p.valid, true)
  assert.equal(p.version, '2b')
  assert.equal(p.cost, 10)
  assert.equal(p.salt, 'oWv0KBo0TjFErdsxHPZ6S.')
  assert.equal(p.hash, 'GGO7a2bG.12giquryTI7537Aa5JQdPq')
  assert.equal(p.salt.length, 22)
  assert.equal(p.hash.length, 31)
})

test('parseHash accepts $2a$ and $2y$ and trims whitespace', () => {
  for (const v of VERSIONS) {
    const p = parseHash(`  $${v}$12$JWIStxGfUZokrlc9FCxdN.w2i8AMTUf3b/F0yBuVE5MJITzatWSG6\n`)
    assert.equal(p.valid, true, v)
    assert.equal(p.version, v)
    assert.equal(p.cost, 12)
  }
})

test('parseHash explains what is wrong', () => {
  assert.equal(parseHash('').reason, '')
  assert.match(parseHash('hello').reason, /should start with \$2a\$/)
  assert.match(parseHash('5f4dcc3b5aa765d61d8327deb882cf99').reason, /hex digest/)
  assert.match(parseHash('$6$rounds=5000$saltsalt$hashhash').reason, /different hash format/)
  assert.match(parseHash('$2b$10$oWv0KBo0TjFErdsxHPZ6S.GGO7a2bG.12giquryTI7537Aa5JQdP').reason, /59 characters/)
  assert.match(parseHash('$2b$10$oWv0KBo0TjFErdsxHPZ6S. GGO7a2bG.12giquryTI7537Aa5JQdPq').reason, /whitespace/)
  assert.match(parseHash('$2b$10$oWv0KBo0TjFErdsxHPZ6S.GGO7a2bG.12giquryTI7537Aa5JQdP+').reason, /alphabet/)
  assert.match(parseHash('$2b$03$oWv0KBo0TjFErdsxHPZ6S.GGO7a2bG.12giquryTI7537Aa5JQdPq').reason, /out of range/)
  assert.match(parseHash('$2x$10$oWv0KBo0TjFErdsxHPZ6S.GGO7a2bG.12giquryTI7537Aa5JQdPq').reason, /\$2x\$/)
  assert.match(parseHash('$2$10$oWv0KBo0TjFErdsxHPZ6S.GGO7a2bG.12giquryTI7537Aa5JQdPq').reason, /obsolete/)
  assert.match(parseHash('$2b$10$oWv0KBo0TjFErdsxHPZ6S.GGO7a2bG.12giquryTI7537Aa5JQdPq!').reason, /61 characters/)
})

test('withVersion relabels without touching salt or hash', () => {
  const h = '$2b$10$oWv0KBo0TjFErdsxHPZ6S.GGO7a2bG.12giquryTI7537Aa5JQdPq'
  assert.equal(withVersion(h, '2y'), '$2y$10$oWv0KBo0TjFErdsxHPZ6S.GGO7a2bG.12giquryTI7537Aa5JQdPq')
  assert.equal(withVersion(withVersion(h, '2a'), '2b'), h)
  assert.throws(() => withVersion(h, '2z'))
})

test('verifyPassword matches the published test vectors', async () => {
  for (const [password, hash] of VECTORS) {
    assert.equal(await verifyPassword(password, hash), true, hash)
    assert.equal(await verifyPassword(password + 'x', hash), false, hash)
  }
})

test('verifyPassword accepts every version label for the same hash', async () => {
  const [password, hash] = VECTORS[0]
  for (const v of VERSIONS) assert.equal(await verifyPassword(password, withVersion(hash, v)), true, v)
})

test('verifyPassword is false, not an error, for junk', async () => {
  assert.equal(await verifyPassword('x', 'not a hash'), false)
  assert.equal(await verifyPassword('x', ''), false)
  assert.equal(await verifyPassword('x', null), false)
})

test('hashPassword produces a fresh, verifiable hash with the requested cost and version', async () => {
  const a = await hashPassword('correct horse battery staple', { cost: 4, version: '2y' })
  const b = await hashPassword('correct horse battery staple', { cost: 4, version: '2y' })
  assert.notEqual(a, b, 'a new salt every time')
  for (const h of [a, b]) {
    const p = parseHash(h)
    assert.equal(p.valid, true)
    assert.equal(p.version, '2y')
    assert.equal(p.cost, 4)
    assert.equal(await verifyPassword('correct horse battery staple', h), true)
    assert.equal(await verifyPassword('correct horse battery stapler', h), false)
  }
})

test('hashPassword defaults to $2b$ and cost 10', async () => {
  const p = parseHash(await hashPassword('abc'))
  assert.equal(p.version, '2b')
  assert.equal(p.cost, 10)
})

test('hashPassword rejects a bad cost or version', async () => {
  await assert.rejects(hashPassword('x', { cost: 3 }))
  await assert.rejects(hashPassword('x', { cost: 10.5 }))
  await assert.rejects(hashPassword('x', { version: '2x' }))
})

test('unicode passwords round-trip', async () => {
  const pw = 'pässwörd ☕ 密码'
  const h = await hashPassword(pw, { cost: 4 })
  assert.equal(await verifyPassword(pw, h), true)
  assert.equal(await verifyPassword('password ☕ 密码', h), false)
})

test('bytes after the 72nd are ignored, and truncates() says so', async () => {
  const long = 'a'.repeat(MAX_PASSWORD_BYTES) + 'TAIL'
  assert.equal(truncates('a'.repeat(MAX_PASSWORD_BYTES)), false)
  assert.equal(truncates(long), true)
  assert.equal(utf8Length('é'.repeat(36)), MAX_PASSWORD_BYTES)
  assert.equal(truncates('é'.repeat(37)), true)
  const h = await hashPassword(long, { cost: 4 })
  assert.equal(await verifyPassword('a'.repeat(MAX_PASSWORD_BYTES), h), true, 'the tail never counted')
})

test('scaleCost doubles per step', () => {
  assert.equal(scaleCost(100, 10, 12), 400)
  assert.equal(scaleCost(100, 10, 8), 25)
  assert.equal(scaleCost(100, 10, 10), 100)
})

test('formatDuration picks a sensible unit', () => {
  assert.equal(formatDuration(0.4), '<1 ms')
  assert.equal(formatDuration(12.4), '12 ms')
  assert.equal(formatDuration(1300), '1.3 s')
  assert.equal(formatDuration(45_000), '45 s')
  assert.equal(formatDuration(150_000), '2.5 min')
  assert.equal(formatDuration(3 * 3_600_000), '3.0 h')
  assert.equal(formatDuration(10 * 86_400_000), '10 days')
  assert.equal(formatDuration(NaN), '—')
})
