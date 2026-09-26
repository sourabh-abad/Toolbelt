import { test } from 'node:test'
import assert from 'node:assert/strict'
import { csvToJson, jsonToCsv, detectDelimiter, parseCsv, jsonToYaml, yamlToJson, readJson, inferValue } from './convert.js'

test('JSON → CSV flattens nested objects and handles arrays', () => {
  const data = [{ id: 1, user: { name: 'Ada', tags: ['a', 'b'] }, note: 'x, "y"' }, { id: 2, user: { name: 'Bo', tags: [] }, extra: true }]
  const json = jsonToCsv(data)
  assert.equal(json.text, 'id,user.name,user.tags,note,extra\n1,Ada,"[""a"",""b""]","x, ""y""",\n2,Bo,[],,true\n')
  assert.equal(jsonToCsv(data, { arrays: 'join' }).text.split('\n')[1], '1,Ada,a; b,"x, ""y""",')
  assert.equal(jsonToCsv(data, { arrays: 'index' }).headers.join('|'), 'id|user.name|user.tags[0]|user.tags[1]|note|user.tags|extra')
  assert.equal(jsonToCsv([{ a: 1 }], { delimiter: ';', quoteAll: true, header: false }).text, '"1"\n')
})

test('CSV → JSON with detection, types and unflattening', () => {
  const csv = 'id;user.name;zip;active\n1;Ada;02134;true\n2;"Bo; Jr";;false\n'
  assert.equal(detectDelimiter(csv), ';')
  const { value, delimiter } = csvToJson(csv)
  assert.equal(delimiter, ';')
  assert.deepEqual(value, [
    { id: 1, user: { name: 'Ada' }, zip: '02134', active: true },
    { id: 2, user: { name: 'Bo; Jr' }, zip: null, active: false },
  ])
  assert.deepEqual(csvToJson(csv, { types: false, unflattenKeys: false }).value[0], { id: '1', 'user.name': 'Ada', zip: '02134', active: 'true' })
  assert.deepEqual(csvToJson('a,b\n1,2\n', { shape: 'arrays' }).value, [['a', 'b'], [1, 2]])
})

test('CSV round trip and errors', () => {
  const data = [{ a: 'line1\nline2', b: 'q"uote' }]
  assert.deepEqual(csvToJson(jsonToCsv(data).text).value, data)
  assert.throws(() => parseCsv('a,b\n1,"open\n2,3'), /Line 2, column 3: Unclosed quote/)
  assert.ok(csvToJson('a,b\n1\n').warnings[0].includes('Row 2 has 1 fields'))
  assert.equal(inferValue('12345678901234567890'), '12345678901234567890')
})

test('JSON → YAML options', () => {
  assert.equal(jsonToYaml({ b: 1, a: 'x' }, { sortKeys: true }), 'a: x\nb: 1\n')
  assert.equal(jsonToYaml({ a: 'x' }, { quote: 'double' }), 'a: "x"\n')
  assert.equal(jsonToYaml({ a: 'yes' }), "a: 'yes'\n")
})

test('YAML → JSON: multi-doc, anchors, 1.1 warnings', () => {
  const r = yamlToJson('base: &b\n  retries: 3\nsvc:\n  <<: *b\n  country: NO\n  zip: 01234\n---\nsecond: true\n')
  assert.equal(r.documents, 2)
  assert.deepEqual(r.value[0].svc, { retries: 3, country: 'NO', zip: 1234 })
  assert.ok(r.warnings.some((w) => w.line === 5 && /read it as a boolean/.test(w.text)))
  assert.ok(r.warnings.some((w) => w.line === 6 && /octal/.test(w.text)))
  assert.throws(() => yamlToJson('a: [1, 2\nb: 3'), /Line \d+, column \d+/)
})

test('JSON errors carry line and column', () => {
  assert.throws(() => readJson('{\n "a": 1,\n}'), /Line 3, column 1: Trailing comma in object/)
})
