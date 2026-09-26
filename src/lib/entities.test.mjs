import { test } from 'node:test'
import assert from 'node:assert/strict'
import { encodeEntities, decodeBasic, decodeEntities, findReferences } from './entities.js'

test('minimal encoding escapes the five HTML-significant characters', () => {
  assert.equal(encodeEntities(`<a href="x">Tom & Jerry's</a>`), '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;')
  assert.equal(encodeEntities('café'), 'café')
})

test('named and ASCII modes', () => {
  assert.equal(encodeEntities('© 2024 — ok', 'named'), '&copy; 2024 &mdash; ok')
  assert.equal(encodeEntities('café 😀', 'ascii'), 'caf&#xE9; &#x1F600;')
})

test('decodes numeric and named references', () => {
  assert.equal(decodeBasic('&lt;p&gt; &amp;amp; &#233; &#xE9; &copy; &unknown;'), '<p> &amp; é é © &unknown;')
  assert.equal(decodeBasic('&#0; &#xD800;'), '� �')
})

test('decodeEntities falls back without a DOM and round-trips', () => {
  const s = `<b>"R&D" — café</b>`
  assert.equal(decodeEntities(encodeEntities(s, 'ascii')), s)
  assert.equal(decodeEntities(encodeEntities(s, 'named')), s)
})

test('lists the references it finds', () => {
  assert.deepEqual(findReferences('a &amp b &#65;').map((r) => [r.ref, r.char, r.terminated]), [['&amp', '&', false], ['&#65;', 'A', true]])
})
