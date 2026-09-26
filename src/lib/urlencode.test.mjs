import { test } from 'node:test'
import assert from 'node:assert/strict'
import { encode, decode, looksDoubleEncoded, encodedCharacters } from './urlencode.js'

test('component vs full-URI mode', () => {
  const url = 'https://ex.com/a b?q=café&x=1/2'
  assert.equal(encode(url), 'https%3A%2F%2Fex.com%2Fa%20b%3Fq%3Dcaf%C3%A9%26x%3D1%2F2')
  assert.equal(encode(url, { mode: 'uri' }), 'https://ex.com/a%20b?q=caf%C3%A9&x=1/2')
})

test('space as %20 or +', () => {
  assert.equal(encode('a b+c', { space: '+' }), 'a+b%2Bc')
  assert.equal(decode('a+b%2Bc', { plusAsSpace: true }), 'a b+c')
  assert.equal(decode('a+b'), 'a+b')
})

test('errors point at the bad sequence', () => {
  assert.throws(() => decode('100%'), /position 4: "%"/)
  assert.throws(() => decode('a%zz'), /position 2: "%zz"/)
  assert.throws(() => decode('%E2%82'), /position 1: "%E2%82" is not valid UTF-8/)
})

test('double-encoding detection', () => {
  assert.equal(looksDoubleEncoded('a%2520b'), true)
  assert.equal(looksDoubleEncoded('a%20b'), false)
  assert.equal(decode(decode('a%2520b')), 'a b')
})

test('lists the characters that change', () => {
  assert.deepEqual(encodedCharacters('a b&é'), [[' ', '%20'], ['&', '%26'], ['é', '%C3%A9']])
})
