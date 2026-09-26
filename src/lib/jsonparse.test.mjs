import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseJson, parseStrict, stringify, isLossyNumber, LosslessNumber, reviveLossless, pathLabel } from './jsonparse.js'

const err = (text) => {
  const r = parseJson(text)
  assert.equal(r.ok, false, `expected ${JSON.stringify(text)} to fail`)
  return r.error
}

test('large integers round-trip with their original digits', () => {
  const r = parseJson('12345678901234567890')
  assert.equal(r.ok, true)
  assert.ok(r.value instanceof LosslessNumber)
  assert.equal(stringify(r.value, 2), '12345678901234567890')
  assert.equal(r.bigNumbers.length, 1)
})

test('big IDs inside documents are kept, safe numbers stay plain numbers', () => {
  const src = '{"id": 12345678901234567890, "n": 42, "list": [9007199254740993, 1.5]}'
  const r = parseJson(src)
  assert.equal(r.ok, true)
  assert.equal(r.value.n, 42)
  assert.equal(r.value.list[1], 1.5)
  assert.deepEqual(r.bigNumbers.map((b) => pathLabel(b.path)), ['$.id', '$.list[0]'])
  assert.equal(stringify(r.value), '{"id":12345678901234567890,"n":42,"list":[9007199254740993,1.5]}')
})

test('precision-losing decimals and overflow are preserved', () => {
  assert.equal(isLossyNumber('0.1000000000000000055511151231257827'), true)
  assert.equal(isLossyNumber('1e400'), true)
  assert.equal(isLossyNumber('1.5'), false)
  assert.equal(isLossyNumber('1.50'), false)
  assert.equal(isLossyNumber('9007199254740991'), false)
  assert.equal(isLossyNumber('9007199254740992'), true)
  assert.equal(isLossyNumber('123456789012345.6'), false)
  const r = parseJson('[1e400]')
  assert.equal(stringify(r.value), '[1e400]')
})

test('revive restores lossless numbers after a structured clone', () => {
  const r = parseJson('{"a":{"b":[0, 12345678901234567890]}}')
  const cloned = structuredClone(r.value)
  assert.equal(cloned.a.b[1] instanceof LosslessNumber, false)
  const revived = reviveLossless(cloned, r.bigNumbers)
  assert.equal(stringify(revived), '{"a":{"b":[0,12345678901234567890]}}')
})

test('trailing comma in array is reported with line and column', () => {
  const e = err('{"a":[1,2,],}')
  assert.equal(e.message, 'Line 1, column 11: Trailing comma in array')
  assert.equal(e.line, 1)
  assert.equal(e.col, 11)
})

test('location appears exactly once', () => {
  const text = '{\n  "a": 1,\n  "b": 2\n  "c": 3\n}'
  const e = err(text)
  assert.equal(e.message, 'Line 4, column 3: Missing comma between properties')
  assert.equal((e.message.match(/line/gi) || []).length, 1)
})

test('plain-language reasons', () => {
  assert.equal(err('{"a":1,}').reason, 'Trailing comma in object')
  assert.equal(err("{'a':1}").reason, 'Single quotes not allowed')
  assert.equal(err('{"a":\'x\'}').reason, 'Single quotes not allowed')
  assert.equal(err('{"a":1 // c\n}').reason, 'Comments not allowed')
  assert.equal(err('/* c */ {}').reason, 'Comments not allowed')
  assert.equal(err('{a:1}').reason, 'Keys must be in double quotes')
  assert.equal(err('{"a" 1}').reason, 'Missing colon after key')
  assert.equal(err('[1 2]').reason, 'Missing comma between items')
  assert.equal(err('{"a":NaN}').reason, 'NaN is not a JSON value')
  assert.equal(err('[Infinity]').reason, 'Infinity is not a JSON value')
  assert.equal(err('[undefined]').reason, 'undefined is not a JSON value')
  assert.equal(err('[True]').reason, 'Invalid literal True')
  assert.equal(err('[.5]').reason, 'Numbers need a digit before the decimal point')
  assert.equal(err('[01]').reason, 'Leading zeros are not allowed')
  assert.equal(err('[0x1F]').reason, 'Hex numbers are not allowed')
  assert.equal(err('[+1]').reason, 'A leading + is not allowed')
  assert.equal(err('[1.]').reason, 'Expected a digit after the decimal point')
  assert.equal(err('["a\nb"]').reason, 'Line break inside a string')
  assert.equal(err('["a\\x"]').reason, 'Invalid escape \\x in string')
  assert.equal(err('["abc').reason, 'Unterminated string')
  assert.equal(err('{"a":[1}').reason, 'Mismatched bracket: expected ] but found }')
  assert.equal(err('{"a":1]').reason, 'Mismatched bracket: expected } but found ]')
  assert.equal(err('{"a":1').reason, 'Unclosed object')
  assert.equal(err('[1,,2]').reason, 'Empty item in array')
  assert.equal(err('{} {}').reason, 'Unexpected content after the JSON value')
  assert.equal(err('   ').reason, 'No JSON value found')
})

test('a leading BOM is removed and reported', () => {
  const r = parseJson('﻿{"a":1}')
  assert.equal(r.ok, true)
  assert.equal(r.bomRemoved, true)
  assert.deepEqual(r.value, { a: 1 })
  assert.equal(parseJson('{"a":1}').bomRemoved, false)
})

test('__proto__ is an ordinary key', () => {
  const { value } = parseStrict('{"__proto__": {"x": 1}}')
  assert.deepEqual(Object.keys(value), ['__proto__'])
  assert.equal(Object.getPrototypeOf(value), Object.prototype)
})

test('duplicate keys are found with their location', () => {
  const { duplicates } = parseStrict('{\n "a": 1,\n "a": 2\n}')
  assert.equal(duplicates.length, 1)
  assert.equal(duplicates[0].line, 3)
})

test('strict parser agrees with JSON.parse on accept/reject (fuzz)', () => {
  const seeds = [
    '{"a":[1,2,{"b":null}],"c":"x\\u00e9\\n","d":-1.5e-3,"e":true,"f":false}',
    '[[],{},"",0,-0,1e5,"\\"\\\\\\/\\b\\f\\n\\r\\t"]',
    '{"k":{"nested":[1,[2,[3]]]}}',
  ]
  const alphabet = '{}[],:"\\ \n\t0123456789.-+eEatrufnl\'/*xX'
  let seed = 12345
  const rand = (n) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed % n
  }
  for (let round = 0; round < 4000; round++) {
    let s = seeds[rand(seeds.length)]
    const edits = 1 + rand(3)
    for (let k = 0; k < edits; k++) {
      const p = rand(s.length + 1)
      const op = rand(3)
      const ch = alphabet[rand(alphabet.length)]
      if (op === 0) s = s.slice(0, p) + ch + s.slice(p)
      else if (op === 1) s = s.slice(0, p) + s.slice(p + 1)
      else s = s.slice(0, p) + ch + s.slice(p + 1)
    }
    let nativeOk = true
    try {
      JSON.parse(s)
    } catch {
      nativeOk = false
    }
    let strictOk = true
    try {
      parseStrict(s)
    } catch {
      strictOk = false
    }
    assert.equal(strictOk, nativeOk, `disagreement on ${JSON.stringify(s)}`)
  }
})

test('strict parser produces the same value as JSON.parse', () => {
  const src = '{"a":[1,2,{"b":null}],"c":"x\\u00e9\\n","d":-1.5e-3,"e":true,"z":{"": 0}}'
  assert.deepEqual(parseStrict(src).value, JSON.parse(src))
})
