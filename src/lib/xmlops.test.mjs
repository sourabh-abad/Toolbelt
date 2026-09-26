import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseXml, serialize, stats, searchAttributes } from './xmlops.js'

const err = (s) => {
  try {
    parseXml(s)
  } catch (e) {
    return e.message
  }
  assert.fail(`expected ${s} to fail`)
}

test('pretty-prints and minifies', () => {
  const doc = parseXml('<?xml version="1.0"?><a x="1"><b>hi &amp; bye</b><c/><!-- note --><d><e>1</e></d></a>')
  assert.equal(serialize(doc), '<?xml version="1.0"?>\n<a x="1">\n  <b>hi &amp; bye</b>\n  <c/>\n  <!-- note -->\n  <d>\n    <e>1</e>\n  </d>\n</a>\n')
  assert.equal(serialize(doc, { minify: true }), '<?xml version="1.0"?><a x="1"><b>hi &amp; bye</b><c/><d><e>1</e></d></a>')
  assert.deepEqual(stats(doc), { elements: 5, attributes: 1, depth: 3 })
})

test('reports well-formedness errors with line and column', () => {
  assert.equal(err('<a>\n  <b></a>'), 'Line 2, column 6: Mismatched tag: </a> closes <b> opened on line 2')
  assert.equal(err('<a>x & y</a>'), 'Line 1, column 6: Unescaped "&" — write &amp; (or use a CDATA section)')
  assert.match(err('<a x=1/>'), /must be quoted/)
  assert.match(err('<a x="1" x="2"/>'), /Duplicate attribute "x"/)
  assert.match(err('<a/><b/>'), /only one root/)
  assert.match(err('<a>'), /never closed/)
  assert.match(err('</a>'), /no matching opening tag/)
  assert.match(err(' <?xml version="1.0"?><a/>'), /very first thing/)
})

test('keeps CDATA and decodes entities', () => {
  const doc = parseXml('<a><![CDATA[<b> & ]]></a>')
  assert.equal(serialize(doc, { minify: true }), '<a><![CDATA[<b> & ]]></a>')
  assert.equal(parseXml('<a t="&lt;&#65;"/>').children[0].attrs[0].value, '<A')
})

test('searches attributes', () => {
  const doc = parseXml('<cfg><db host="prod.example.com" port="5432"/><cache host="localhost"/></cfg>')
  assert.deepEqual(searchAttributes(doc, 'host').map((r) => `${r.path}@${r.name}`), ['/cfg/db@host', '/cfg/cache@host'])
})
