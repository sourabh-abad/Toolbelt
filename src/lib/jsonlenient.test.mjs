import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stripJsonc } from './jsonlenient.js'

test('strips comments and trailing commas, keeping positions', () => {
  const src = '{\n  // compiler\n  "a": "http://x", /* inline */\n  "b": [1, 2,],\n}'
  const r = stripJsonc(src)
  assert.equal(r.text.length, src.length)
  assert.deepEqual(JSON.parse(r.text), { a: 'http://x', b: [1, 2] })
  assert.equal(r.comments, 2)
  assert.equal(r.trailingCommas, 2)
  assert.equal(r.text.split('\n').length, src.split('\n').length)
})

test('leaves strings that look like comments alone', () => {
  const r = stripJsonc('{"a": "/* no */", "b": "x,]"}')
  assert.deepEqual(JSON.parse(r.text), { a: '/* no */', b: 'x,]' })
  assert.equal(r.comments + r.trailingCommas, 0)
})
