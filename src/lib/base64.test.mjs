import { test } from 'node:test'
import assert from 'node:assert/strict'
import { encodeText, encodeBytes, decodeToBytes, bytesToText, looksLikeBase64, looksLikeBase64Url, sniff, splitDataUri } from './base64.js'

test('RFC 4648 §10 test vectors', () => {
  const vectors = [['', ''], ['f', 'Zg=='], ['fo', 'Zm8='], ['foo', 'Zm9v'], ['foob', 'Zm9vYg=='], ['fooba', 'Zm9vYmE='], ['foobar', 'Zm9vYmFy']]
  for (const [plain, b64] of vectors) {
    assert.equal(encodeText(plain), b64)
    assert.equal(bytesToText(decodeToBytes(b64)), plain)
  }
})

test('UTF-8 and emoji round-trip', () => {
  const s = 'héllo wörld — 😀 你好'
  assert.equal(encodeText(s), Buffer.from(s).toString('base64'))
  assert.equal(bytesToText(decodeToBytes(encodeText(s))), s)
})

test('Base64URL: alphabet and padding', () => {
  const bytes = new Uint8Array([0xfb, 0xff, 0xbf])
  assert.equal(encodeBytes(bytes), '+/+/')
  assert.equal(encodeBytes(bytes, { url: true }), '-_-_')
  assert.equal(encodeText('fo', { url: true }), 'Zm8')
  assert.deepEqual([...decodeToBytes('-_-_')], [0xfb, 0xff, 0xbf])
  assert.equal(bytesToText(decodeToBytes('Zm8')), 'fo')
})

test('errors name the character and position', () => {
  assert.throws(() => decodeToBytes('Zm9v!mFy'), /Invalid character "!" at position 5/)
  assert.throws(() => decodeToBytes('Zm9=vYg'), /padding can only appear at the end/)
  assert.throws(() => decodeToBytes('Zm9vY'), /Truncated input/)
  assert.throws(() => decodeToBytes('Zg==='), /Too much/)
})

test('ignores wrapped lines', () => {
  assert.equal(bytesToText(decodeToBytes('Zm9v\nYmFy\r\n')), 'foobar')
})

test('detects Base64 and the URL variant', () => {
  assert.equal(looksLikeBase64('SGVsbG8sIHdvcmxkIQ=='), true)
  assert.equal(looksLikeBase64('eyJhbGciOiJIUzI1NiJ9'), true)
  assert.equal(looksLikeBase64('password'), false)
  assert.equal(looksLikeBase64('Hello, world!'), false)
  assert.equal(looksLikeBase64Url('eyJhbGciOiJIUzI1NiJ9'), false)
  assert.equal(looksLikeBase64Url('eyJzdWIiOiIxMjM0In0'), true)
  assert.equal(looksLikeBase64Url('a-b_cdef'), true)
})

test('sniffs file types', () => {
  assert.equal(sniff(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])).mime, 'image/png')
  assert.equal(sniff(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).mime, 'image/svg+xml')
  assert.equal(sniff(new TextEncoder().encode('hello')), null)
  assert.deepEqual(splitDataUri('data:image/png;base64,AAAA'), { mime: 'image/png', data: 'AAAA' })
})
