import { test } from 'node:test'
import assert from 'node:assert/strict'
import { navItems } from './nav.js'
import { searchTools } from './search.js'
import { REDIRECTS } from './redirects.js'

const first = (q) => searchTools(navItems, q)[0]?.to
const order = (q) => searchTools(navItems, q).map((n) => n.to)

test('common words reach the right tool first', () => {
  assert.equal(first('sha256'), '/hash-generator')
  assert.equal(first('SHA-256'), '/hash-generator')
  assert.equal(first('md5'), '/hash-generator')
  assert.equal(first('base64'), '/base64')
  assert.equal(first('url encode'), '/url-encode')
  assert.equal(first('regex'), '/regex-tester')
  assert.equal(first('json to csv'), '/json-to-csv')
  assert.equal(first('csv to json'), '/csv-to-json')
  assert.equal(first('yaml to json'), '/yaml-to-json')
  assert.equal(first('xpath'), '/xml-formatter')
  assert.equal(first('uuid v7'), '/uuid-v7-generator')
  assert.equal(first('sign jwt'), '/jwt-encoder')
  assert.equal(first('properties to yaml'), '/properties-to-yaml')
  assert.equal(first('epoch'), '/timestamp')
  assert.equal(first('unix'), '/timestamp')
  assert.equal(first('prettify'), '/json-formatter')
  assert.equal(first('beautify'), '/json-formatter')
  assert.equal(first('json lint'), '/json-validator')
  assert.equal(first('fake data'), '/mock')
  assert.equal(first('faker'), '/mock')
  assert.equal(first('jwt decode'), '/jwt-decoder')
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
  assert.ok(order('uuid').indexOf('/uuid') < order('uuid').indexOf('/uuid-v7-generator'))
  assert.equal(first('diff'), '/diff')
  assert.ok(order('diff').indexOf('/diff') < order('diff').indexOf('/properties-compare'))
  assert.equal(first('json validator'), '/json-validator')
  assert.equal(first('sql'), '/sql')
  assert.equal(first('yaml'), '/yaml')
})

test('multi-word queries need every word', () => {
  assert.ok(!order('jwt decode').includes('/base64'))
})

test('tolerates a one-letter typo', () => {
  assert.equal(first('timestmp'), '/timestamp')
  assert.equal(first('passwrod'), '/password')
})

test('retired URLs are not in the menu or search', () => {
  assert.ok(!navItems.some((n) => REDIRECTS[n.to]))
  assert.ok(!searchTools(navItems, 'encode decode').some((n) => REDIRECTS[n.to]))
})

test('empty query returns everything in menu order', () => {
  assert.deepEqual(searchTools(navItems, '  '), navItems)
})
