import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseInBase, toBase, group, fixedWidths, convert } from './numbase.js'

test('parses each base and honours prefixes', () => {
  assert.equal(parseInBase('255').value, 255n)
  assert.equal(parseInBase('ff', 16).value, 255n)
  assert.equal(parseInBase('0xFF').value, 255n)
  assert.equal(parseInBase('0b1111_1111').value, 255n)
  assert.equal(parseInBase('0o377').value, 255n)
  assert.equal(parseInBase('1Fh', 16).value, 31n)
  assert.equal(parseInBase('-42').value, -42n)
  assert.equal(parseInBase('1,000,000').value, 1000000n)
})

test('rejects bad digits with a reason', () => {
  assert.throws(() => parseInBase('102', 2), /"2" is not a binary digit/)
  assert.throws(() => parseInBase('0x'), /digits after the prefix/)
  assert.throws(() => parseInBase(''), /Enter a number/)
})

test('is exact beyond 2^53', () => {
  const r = convert('18446744073709551615', 10)
  assert.equal(r.bases.find((b) => b.base === 16).digits, 'FFFFFFFFFFFFFFFF')
  assert.equal(r.bits, 64)
  assert.equal(toBase(parseInBase('0x1' + '0'.repeat(32)).value, 10), (2n ** 128n).toString())
})

test("two's complement views", () => {
  const [w8, w16] = fixedWidths(-1n)
  assert.equal(w8.hex, 'FF')
  assert.equal(w8.unsigned, 255n)
  assert.equal(w16.hex, 'FFFF')
  const [b8] = fixedWidths(200n)
  assert.equal(b8.signed, -56n)
  assert.equal(fixedWidths(300n)[0].fits, false)
})

test('groups digits from the right', () => {
  assert.equal(group('11110000', 4), '1111 0000')
  assert.equal(group('1234567', 3, ','), '1,234,567')
})
