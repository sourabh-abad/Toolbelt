import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cleanToken, decodeJwt, verifyJwt, signJwt, timeChecks, duration, generateKeyPair } from './jwt.js'

const JWT_IO = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

test('cleanToken strips headers, quotes and whitespace', () => {
  const r = cleanToken(`Authorization: Bearer "${JWT_IO.slice(0, 20)}\n  ${JWT_IO.slice(20)}"`)
  assert.equal(r.token, JWT_IO)
  assert.deepEqual(r.notices, ['Removed the "Authorization:" header name', 'Removed the "Bearer " prefix', 'Removed surrounding quotes', 'Removed whitespace and line breaks inside the token'])
  assert.deepEqual(cleanToken(JWT_IO).notices, [])
})

test('decode and HS256 verify against the jwt.io example', async () => {
  const d = decodeJwt(JWT_IO)
  assert.equal(d.payload.name, 'John Doe')
  assert.equal((await verifyJwt(d, 'your-256-bit-secret')).ok, true)
  assert.equal((await verifyJwt(d, 'wrong')).ok, false)
  const b64 = Buffer.from('your-256-bit-secret').toString('base64')
  assert.equal((await verifyJwt(d, b64, { secretEncoding: 'base64' })).ok, true)
  assert.match(decodeJwt('a.b').error, /3 dot-separated parts/)
  assert.match(decodeJwt('a.b.c.d.e').error, /encrypted/)
  assert.match(decodeJwt('eyJ.e30.x').error, /header/)
})

test('RS256 with PKCS#8/SPKI, PKCS#1 and a certificate', async () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const pkcs8 = privateKey.export({ type: 'pkcs8', format: 'pem' })
  const pkcs1 = privateKey.export({ type: 'pkcs1', format: 'pem' })
  const spki = publicKey.export({ type: 'spki', format: 'pem' })
  const pub1 = publicKey.export({ type: 'pkcs1', format: 'pem' })
  for (const [signKey, verifyKey] of [[pkcs8, spki], [pkcs1, pub1]]) {
    const t = await signJwt({ alg: 'RS256', typ: 'JWT' }, { sub: 'ada' }, signKey)
    assert.equal((await verifyJwt(decodeJwt(t), verifyKey)).ok, true)
  }
  const dir = mkdtempSync(join(tmpdir(), 'jwt-'))
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(dir, 'k.pem'), '-out', join(dir, 'c.pem'), '-subj', '/CN=test', '-days', '1'], { stdio: 'ignore' })
  const t = await signJwt({ alg: 'RS256' }, { sub: 'x' }, readFileSync(join(dir, 'k.pem'), 'utf8'))
  const v = await verifyJwt(decodeJwt(t), readFileSync(join(dir, 'c.pem'), 'utf8'))
  assert.equal(v.ok, true)
  assert.equal(v.source, 'X.509 certificate')
  await assert.rejects(verifyJwt(decodeJwt(t), pkcs8), /private key/)
})

test('PS256, ES256, ES384, EdDSA and JWKS by kid', async () => {
  for (const alg of ['PS256', 'ES256', 'ES384', 'ES512', 'EdDSA']) {
    const kp = await generateKeyPair(alg)
    const t = await signJwt({ alg }, { n: 1 }, kp.privatePem)
    assert.equal((await verifyJwt(decodeJwt(t), kp.publicPem)).ok, true, alg)
  }
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
  const jwkPub = { ...publicKey.export({ format: 'jwk' }), kid: 'k2', use: 'sig', alg: 'ES256' }
  const jwkPriv = { ...privateKey.export({ format: 'jwk' }), kid: 'k2' }
  const t = await signJwt({ alg: 'ES256', kid: 'k2' }, { a: 1 }, JSON.stringify(jwkPriv))
  const jwks = JSON.stringify({ keys: [{ kty: 'RSA', kid: 'k1', n: 'AQAB', e: 'AQAB' }, jwkPub] })
  const v = await verifyJwt(decodeJwt(t), jwks)
  assert.equal(v.ok, true)
  assert.equal(v.source, 'JWKS key "k2"')
  // A private JWK pasted for verification is reduced to its public part.
  assert.equal((await verifyJwt(decodeJwt(t), JSON.stringify(jwkPriv))).ok, true)
  const noKid = await signJwt({ alg: 'ES256', kid: 'zzz' }, { a: 1 }, JSON.stringify(jwkPriv))
  await assert.rejects(verifyJwt(decodeJwt(noKid), jwks), /No key with kid "zzz"/)
  await assert.rejects(verifyJwt(decodeJwt(t), JSON.stringify({ ...jwkPub, alg: 'ES384' })), /marked for ES384/)
})

test('time checks', () => {
  const now = 1_700_000_000_000
  const c = timeChecks({ exp: 1_700_000_100, nbf: 1_700_000_030, iat: 1_700_000_000_000 }, now)
  assert.equal(c.exp.expired, false)
  assert.equal(c.nbf.notYet, true)
  assert.equal(c.nbf.skew, true)
  assert.equal(c.nbf.withinLeeway, true)
  assert.equal(c.iat.ms, true)
  assert.equal(timeChecks({ exp: 1 }, now).exp.expired, true)
  assert.equal(duration(3725), '1h 02m 05s')
  assert.equal(duration(90061), '1d 01h 01m')
})
