import { test } from 'node:test'
import assert from 'node:assert/strict'
import { digestAll, hmac, formatDigest, matchChecksum } from './hashing.js'

const enc = (s) => new TextEncoder().encode(s)

test('known vectors for "abc" (NIST FIPS 180 / RFC 1321)', async () => {
  const d = await digestAll(enc('abc'))
  assert.equal(formatDigest(d['MD5']), '900150983cd24fb0d6963f7d28e17f72')
  assert.equal(formatDigest(d['SHA-1']), 'a9993e364706816aba3e25717850c26c9cd0d89d')
  assert.equal(formatDigest(d['SHA-256']), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  assert.equal(formatDigest(d['SHA-512']).slice(0, 32), 'ddaf35a193617abacc417349ae204131')
})

test('empty input and the trailing newline trap', async () => {
  const empty = await digestAll(enc(''))
  assert.equal(formatDigest(empty['SHA-256']), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  const withNewline = await digestAll(enc('abc\n'))
  assert.notEqual(formatDigest(withNewline['SHA-256']), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
})

test('HMAC-SHA256 (RFC 4231 test case 2)', async () => {
  const mac = await hmac('SHA-256', enc('Jefe'), enc('what do ya want for nothing?'))
  assert.equal(formatDigest(mac), '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843')
})

test('formats and checksum matching', async () => {
  const d = await digestAll(enc('abc'))
  assert.equal(formatDigest(d['MD5'], 'HEX'), '900150983CD24FB0D6963F7D28E17F72')
  assert.equal(formatDigest(d['SHA-256'], 'base64'), 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=')
  assert.equal(matchChecksum('BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD', d).match, 'SHA-256')
  assert.equal(matchChecksum('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad  abc.txt', d).match, 'SHA-256')
  assert.equal(matchChecksum('sha256:ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=', d).match, 'SHA-256')
  assert.equal(matchChecksum('00ff', d).match, null)
  assert.equal(matchChecksum('not a checksum!', d).valid, false)
})
