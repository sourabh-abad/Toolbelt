// Unit checks for propsops.js — the parser above all, because .properties has
// three separators, two comment markers, escapes and line continuations, and a
// naive split on '=' gets every one of them wrong.
//
//   npm test
//
import test from 'node:test'
import { strict as assert } from 'node:assert'
import {
  unescape,
  escapeKey,
  escapeValue,
  splitEntry,
  readRecords,
  parse,
  listKeys,
  keyNames,
  stats,
  problems,
  compareKeys,
  compareValues,
  format,
  toObject,
  toYaml,
  toJson,
  fromYaml,
  fromJson,
  flattenObject,
  splitPath,
  coerce,
} from './propsops.js'

const t = (name, fn) => test(name, fn)

// --- separators -------------------------------------------------------------
t('= is a separator', () => {
  assert.deepEqual(splitEntry('a=1'), { rawKey: 'a', rawValue: '1', sep: '=' })
})
t(': is a separator', () => {
  assert.deepEqual(splitEntry('a:1'), { rawKey: 'a', rawValue: '1', sep: ':' })
})
t('whitespace is a separator when nothing else follows', () => {
  assert.deepEqual(splitEntry('a 1'), { rawKey: 'a', rawValue: '1', sep: ' ' })
})
t('spaces around = are not part of the key or value', () => {
  assert.deepEqual(splitEntry('  a  =   1  '), { rawKey: 'a', rawValue: '1  ', sep: '=' })
})
t('an escaped separator stays in the key', () => {
  const { rawKey, rawValue } = splitEntry('a\\=b=1')
  assert.equal(rawKey, 'a\\=b')
  assert.equal(rawValue, '1')
})
t('a colon inside a value is not a separator', () => {
  assert.equal(splitEntry('url=jdbc:mysql://host/db').rawValue, 'jdbc:mysql://host/db')
})
t('a key with no separator has an empty value', () => {
  assert.deepEqual(splitEntry('flag'), { rawKey: 'flag', rawValue: '', sep: '' })
})

// --- escapes ----------------------------------------------------------------
t('unescape resolves \\n, \\t and \\uXXXX', () => {
  assert.equal(unescape('a\\nb\\tc\\u00e9'), 'a\nb\tc\u00e9')
})
t('unescape drops the backslash of an unknown escape, as Java does', () => {
  assert.equal(unescape('a\\:b'), 'a:b')
})
t('a bad \\u sequence is left readable rather than throwing', () => {
  assert.equal(unescape('\\uZZZZ'), 'uZZZZ')
})
t('escapeKey protects spaces, separators and comment markers', () => {
  assert.equal(escapeKey('my key=x#y'), 'my\\ key\\=x\\#y')
})
t('escapeValue only escapes a LEADING space', () => {
  assert.equal(escapeValue(' two words '), '\\ two words ')
})
t('a key round-trips through escape and unescape', () => {
  const key = 'a b:c=d\\e'
  assert.equal(unescape(escapeKey(key)), key)
})

// --- comments, blanks and continuations -------------------------------------
t('# and ! both start a comment', () => {
  const kinds = readRecords('# one\n! two\na=1').map((r) => r.kind)
  assert.deepEqual(kinds, ['comment', 'comment', 'entry'])
})
t('a # after the start of a line is data, not a comment', () => {
  assert.equal(parse('colour=#ff0000').map.get('colour'), '#ff0000')
})
t('a trailing newline is not a blank line', () => {
  assert.equal(stats('a=1\n').blanks, 0)
})
t('an odd number of trailing backslashes continues the line', () => {
  const { map } = parse('list=a,\\\n  b,\\\n  c')
  assert.equal(map.get('list'), 'a,b,c')
})
t('an even number of trailing backslashes does not', () => {
  const records = readRecords('a=x\\\\\nb=2').filter((r) => r.kind === 'entry')
  assert.equal(records.length, 2)
  assert.equal(records[0].value, 'x\\')
})
t('a continued entry reports the line it started on', () => {
  const entry = readRecords('# c\na=1,\\\n2').find((r) => r.kind === 'entry')
  assert.equal(entry.line, 2)
  assert.equal(entry.endLine, 3)
})

// --- duplicates -------------------------------------------------------------
const DUPES = 'a=1\nb=2\na=3\nb=2\n'
t('the last occurrence wins, the way java.util.Properties loads it', () => {
  assert.equal(parse(DUPES).map.get('a'), '3')
})
t('a duplicate with a different value is flagged as conflicting', () => {
  const dup = parse(DUPES).duplicates.find((d) => d.key === 'a')
  assert.deepEqual(dup.lines, [1, 3])
  assert.equal(dup.conflicting, true)
})
t('a duplicate with the same value is not', () => {
  assert.equal(parse(DUPES).duplicates.find((d) => d.key === 'b').conflicting, false)
})
t('problems reports the conflicting duplicate as an error', () => {
  const found = problems(DUPES).filter((p) => p.level === 'error')
  assert.equal(found.length, 1)
  assert.equal(found[0].key, 'a')
})
t('problems warns about a value ending in whitespace', () => {
  assert.ok(problems('a=1  \n').some((p) => p.message.includes('whitespace')))
})
t('problems warns about an undefined ${placeholder} with no default', () => {
  assert.ok(problems('a=${missing}\n').some((p) => p.message.includes('${missing}')))
})
t('a ${placeholder} with a default is not warned about', () => {
  assert.equal(problems('a=${missing:8080}\n').length, 0)
})
t('a ${placeholder} this file defines is not warned about', () => {
  assert.equal(problems('port=8080\na=${port}\n').length, 0)
})

// --- keys -------------------------------------------------------------------
t('listKeys keeps file order and marks duplicates', () => {
  const rows = listKeys(DUPES)
  assert.deepEqual(rows.map((r) => r.key), ['a', 'b', 'a', 'b'])
  assert.equal(rows[0].duplicate, true)
  assert.equal(rows[0].winner, false)
  assert.equal(rows[2].winner, true)
})
t('unique keys collapse to the winning value', () => {
  const rows = listKeys(DUPES, { unique: true })
  assert.deepEqual(rows.map((r) => r.key), ['a', 'b'])
  assert.equal(rows[0].value, '3')
})
t('keyNames sorts when asked', () => {
  assert.deepEqual(keyNames('b=1\na=2\n', { sort: 'asc' }), ['a', 'b'])
})

// --- comparing --------------------------------------------------------------
const A = 'shared=same\nchanged=one\nonly.a=x\n'
const B = 'shared=same\nchanged=two\nonly.b=y\n'
t('compareKeys splits the two sides', () => {
  const r = compareKeys(A, B)
  assert.deepEqual(r.onlyInA, ['only.a'])
  assert.deepEqual(r.onlyInB, ['only.b'])
  assert.deepEqual(r.inBoth, ['changed', 'shared'])
})
t('compareValues marks each key and counts them', () => {
  const { rows, summary } = compareValues(A, B)
  assert.equal(rows[0].status, 'different')
  assert.deepEqual(summary, { total: 4, same: 1, different: 1, onlyInA: 1, onlyInB: 1, countA: 3, countB: 3 })
})
t('trim makes padding-only differences equal', () => {
  assert.equal(compareValues('a=1', 'a= 1 ').rows[0].status, 'different')
  assert.equal(compareValues('a=1', 'a= 1 ', { trim: true }).rows[0].status, 'same')
})
t('a duplicated key is compared on its winning value', () => {
  assert.equal(compareValues('a=1\na=2\n', 'a=2\n').rows[0].status, 'same')
})

// --- formatting -------------------------------------------------------------
const MESSY = '# header\n\nb = 2\na:1\n\n# note\nb=3\n'
t('format normalises the separator and keeps comments with their entry', () => {
  const { text } = format(MESSY)
  assert.equal(text, '# header\n\nb=2\na=1\n\n# note\nb=3\n')
})
t('sorting reorders the entries and carries their comments along', () => {
  const { text } = format(MESSY, { sort: 'asc' })
  assert.equal(text, '# header\n\na=1\nb=2\n# note\nb=3\n')
})
t('a comment followed by a blank line is a header and does not travel with an entry', () => {
  assert.equal(format('# top\n\nb=2\na=1\n', { sort: 'asc' }).text, '# top\n\na=1\nb=2\n')
})
t('dedupe last keeps one entry per key with the winning value', () => {
  const { text, removed } = format(MESSY, { dedupe: 'last' })
  assert.equal(text, '# header\n\nb=3\na=1\n')
  assert.equal(removed, 1)
})
t('dedupe first keeps the earlier value', () => {
  assert.equal(format('a=1\na=2\n', { dedupe: 'first' }).text, 'a=1\n')
})
t('comments can be dropped', () => {
  assert.equal(format('# gone\na=1\n', { keepComments: false }).text, 'a=1\n')
})
t('align pads the keys into a column', () => {
  assert.equal(format('a=1\nlonger=2\n', { align: true }).text, 'a     =1\nlonger=2\n')
})
t('formatting is stable — running it twice changes nothing', () => {
  const once = format(MESSY, { sort: 'asc', dedupe: 'last' }).text
  assert.equal(format(once, { sort: 'asc', dedupe: 'last' }).text, once)
})
t('an empty file formats to an empty string, not a stray newline', () => {
  assert.equal(format('').text, '')
})

// --- conversion -------------------------------------------------------------
t('splitPath turns brackets into array positions', () => {
  assert.deepEqual(splitPath('a.b[0].c'), [{ name: 'a' }, { name: 'b' }, { index: 0 }, { name: 'c' }])
})
t('coerce is conservative about what stops being a string', () => {
  assert.equal(coerce('true'), true)
  assert.equal(coerce('8080'), 8080)
  assert.equal(coerce('1.5'), 1.5)
  assert.equal(coerce('007'), '007')
  assert.equal(coerce('1.2.3'), '1.2.3')
  assert.equal(coerce('9007199254740993'), '9007199254740993')
  assert.equal(coerce(' 1 '), ' 1 ')
})
t('dotted keys become a tree and bracketed ones an array', () => {
  const { data } = toObject('server.port=8080\nserver.hosts[0]=a\nserver.hosts[1]=b\n')
  assert.deepEqual(data, { server: { port: 8080, hosts: ['a', 'b'] } })
})
t('a gap in the indices becomes null rather than a hole', () => {
  const { data } = toObject('a[2]=x\n')
  assert.deepEqual(data, { a: [null, null, 'x'] })
})
t('a key that is both a value and a branch stays flat and is reported', () => {
  const { data, conflicts } = toObject('a=1\na.b=2\n')
  assert.deepEqual(conflicts, ['a.b'])
  assert.equal(data.a, 1)
  assert.equal(data['a.b'], 2)
})
t('nesting can be turned off', () => {
  const { data } = toObject('a.b=1\n', { nested: false })
  assert.deepEqual(data, { 'a.b': 1 })
})
t('type inference can be turned off', () => {
  const { data } = toObject('a=8080\n', { inferTypes: false })
  assert.equal(data.a, '8080')
})
t('properties to YAML', () => {
  assert.equal(toYaml('a.b=1\na.c=x\n').text, 'a:\n  b: 1\n  c: x\n')
})
t('properties to JSON', () => {
  assert.equal(toJson('a.b=1\n').text, '{\n  "a": {\n    "b": 1\n  }\n}\n')
})
t('an empty document converts to an empty result, not "{}"', () => {
  assert.equal(toYaml('').text, '')
})
t('flattenObject writes array positions with brackets', () => {
  assert.deepEqual(flattenObject({ a: { b: [1, 2] } }), [['a.b[0]', '1'], ['a.b[1]', '2']])
})
t('an empty object or array flattens to an empty value', () => {
  assert.deepEqual(flattenObject({ a: {}, b: [] }), [['a', ''], ['b', '']])
})
t('YAML to properties', () => {
  assert.equal(fromYaml('server:\n  port: 8080\n  hosts: [a, b]\n'), 'server.port=8080\nserver.hosts[0]=a\nserver.hosts[1]=b\n')
})
t('JSON to properties', () => {
  assert.equal(fromJson('{"a":{"b":1},"c":null}'), 'a.b=1\nc=\n')
})
t('properties survive a round trip through YAML', () => {
  const source = 'server.port=8080\nserver.name=shop api\nflags[0]=x\n'
  assert.equal(fromYaml(toYaml(source).text), source)
})
t('a key needing escapes survives the round trip', () => {
  const source = 'a\\ b=1\n'
  assert.equal(fromYaml(toYaml(source, { nested: false }).text), source)
})
t('invalid YAML throws with a position rather than returning nonsense', () => {
  assert.throws(() => fromYaml('a:\n  - b\n c: d\n'), (e) => e.mark !== undefined || /YAML/i.test(String(e)))
})
