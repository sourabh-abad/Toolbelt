import { test } from 'node:test'
import assert from 'node:assert/strict'
import { navItems } from './nav.js'
import { searchTools } from './search.js'

const first = (q) => searchTools(navItems, q)[0]?.to
const order = (q) => searchTools(navItems, q).map((n) => n.to)

test('common words reach the right tool first', () => {
  assert.equal(first('sha256'), '/encode-decode')
  assert.equal(first('SHA-256'), '/encode-decode')
  assert.equal(first('md5'), '/encode-decode')
  assert.equal(first('base64'), '/encode-decode')
  assert.equal(first('url encode'), '/encode-decode')
  assert.equal(first('epoch'), '/timestamp')
  assert.equal(first('unix'), '/timestamp')
  assert.equal(first('prettify'), '/jsonvalidator')
  assert.equal(first('beautify'), '/jsonvalidator')
  assert.equal(first('json lint'), '/jsonvalidator')
  assert.equal(first('fake data'), '/mock')
  assert.equal(first('faker'), '/mock')
  assert.equal(first('jwt decode'), '/jwtvalidator')
  assert.equal(first('crontab'), '/cron')
  assert.equal(first('guid'), '/uuid')
  assert.equal(first('camelcase'), '/case-converter')
  assert.equal(first('snake_case'), '/case-converter')
  assert.equal(first('hex to decimal'), '/number-base')
  assert.equal(first('binary'), '/number-base')
  assert.equal(first('query string'), '/url-parser')
  assert.equal(first('html escape'), '/html-entities')
})

test('dedicated tools outrank tools that mention the word', () => {
  assert.equal(first('uuid'), '/uuid')
  assert.ok(order('uuid').indexOf('/uuid') < order('uuid').indexOf('/timestamp'))
  assert.equal(first('diff'), '/diff')
  assert.ok(order('diff').indexOf('/diff') < order('diff').indexOf('/properties-compare'))
  assert.equal(first('json validator'), '/jsonvalidator')
  assert.equal(first('sql'), '/sql')
  assert.equal(first('yaml'), '/yaml')
})

test('multi-word queries need every word', () => {
  assert.ok(!order('jwt decode').includes('/encode-decode'))
})

test('tolerates a one-letter typo', () => {
  assert.equal(first('timestmp'), '/timestamp')
  assert.equal(first('passwrod'), '/password')
})

test('empty query returns everything in menu order', () => {
  assert.deepEqual(searchTools(navItems, '  '), navItems)
})
