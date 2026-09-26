import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findMatches, replaceAll, highlightHtml, insertToken, compile } from './regex.js'

test('matches with numbered and named groups and indices', () => {
  const r = findMatches('(?<user>\\w+)@(\\w+)\\.com', 'g', 'ada@example.com, bo@test.com')
  assert.equal(r.matches.length, 2)
  assert.deepEqual(r.matches[0].groups, [
    { n: 1, name: 'user', value: 'ada', start: 0, end: 3 },
    { n: 2, name: null, value: 'example', start: 4, end: 11 },
  ])
  assert.equal(r.matches[1].index, 17)
  assert.deepEqual(r.names, ['user'])
})

test('non-global stops after one; empty matches advance', () => {
  assert.equal(findMatches('a', '', 'aaa').matches.length, 1)
  assert.equal(findMatches('x*', 'g', 'ab').matches.length, 3)
  assert.equal(findMatches('(?:)', 'gu', '😀').matches.length, 2)
})

test('optional groups report null', () => {
  const g = findMatches('(a)|(b)', 'g', 'b').matches[0].groups
  assert.deepEqual(g[0], { n: 1, name: null, value: null, start: null, end: null })
  assert.equal(g[1].value, 'b')
})

test('errors, replace, highlight and token insert', () => {
  assert.match(compile('(', 'g').error, /Unterminated group/)
  assert.equal(replaceAll('(\\d+)-(\\d+)', 'g', '1-2 3-4', '$2-$1').text, '2-1 4-3')
  assert.equal(highlightHtml('a<b a', findMatches('a', 'g', 'a<b a').matches), '<mark class="rx-a">a</mark>&lt;b <mark class="rx-b">a</mark>')
  assert.deepEqual(insertToken('abc', 0, 3, '(…)'), { value: '(abc)', caret: 4 })
  assert.deepEqual(insertToken('x', 1, 1, '\\d'), { value: 'x\\d', caret: 3 })
  assert.equal(findMatches('(a)(b)?', 'g', 'zzz').groupCount, 2)
})
