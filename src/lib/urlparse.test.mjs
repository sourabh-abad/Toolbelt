import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseUrl, withParams, paramsToJson } from './urlparse.js'

test('splits a URL into its parts and decodes the query', () => {
  const r = parseUrl('https://user:pw@api.example.com:8443/v1/items%20list?q=caf%C3%A9&tag=a&tag=b#top')
  const parts = Object.fromEntries(r.parts)
  assert.equal(parts.Hostname, 'api.example.com')
  assert.equal(parts.Port, '8443')
  assert.equal(parts.Path, '/v1/items%20list')
  assert.equal(parts.Fragment, '#top')
  assert.deepEqual(r.pathSegments, ['v1', 'items list'])
  assert.deepEqual(r.params.map((p) => [p.key, p.value, p.repeated]), [['q', 'café', false], ['tag', 'a', true], ['tag', 'b', true]])
  assert.ok(r.warnings.some((w) => /credentials/.test(w)))
})

test('assumes https for a bare host', () => {
  const r = parseUrl('example.com/a?b=1')
  assert.equal(r.assumedScheme, true)
  assert.equal(r.href, 'https://example.com/a?b=1')
})

test('reads host:port as a host, not a scheme', () => {
  const r = parseUrl('localhost:3000/api?x=1')
  assert.equal(Object.fromEntries(r.parts).Port, '3000')
  assert.equal(r.assumedScheme, true)
})

test('flags double encoding, plus signs and default ports', () => {
  assert.ok(parseUrl('https://x.test/?q=a%2520b').warnings.some((w) => /twice/.test(w)))
  assert.ok(parseUrl('https://x.test/?q=a+b').warnings.some((w) => /space/.test(w)))
  assert.ok(parseUrl('https://x.test:443/').warnings.some((w) => /default/.test(w)))
})

test('rebuilds the query from edited params', () => {
  assert.equal(withParams('https://x.test/p?old=1#h', [{ key: 'a', value: '1 2' }, { key: 'b', value: 'é' }, { key: '', value: 'x' }]), 'https://x.test/p?a=1+2&b=%C3%A9#h')
})

test('converts params to JSON with arrays for repeated keys', () => {
  assert.deepEqual(paramsToJson([{ key: 'a', value: '1' }, { key: 'a', value: '2' }, { key: 'b', value: '' }]), { a: ['1', '2'], b: '' })
})

test('rejects text that is not a URL', () => {
  assert.throws(() => parseUrl('http://'), /Not a valid URL/)
})

test('notes the punycode form of an internationalised host', () => {
  const r = parseUrl('https://bücher.example/katalog')
  assert.ok(r.warnings.some((w) => w.includes('xn--bcher-kva.example')))
})
