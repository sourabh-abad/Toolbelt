// Unit checks for yamlops.js — the comment stripper especially, since a naive
// split on '#' quietly corrupts URLs, quoted strings and block scalars.
//
//   npm test
//
import test from 'node:test'
import { strict as assert } from 'node:assert'
import {
  splitLineComment,
  stripComments,
  tidy,
  findIndentTabs,
  format,
  toFlow,
  validate,
  stats,
} from './yamlops.js'

const t = (name, fn) => test(name, fn)

// --- splitLineComment -------------------------------------------------------
t('inline comment after a value', () => {
  assert.equal(splitLineComment('port: 8080 # the API').comment, '# the API')
})
t('# with no leading space is not a comment', () => {
  assert.equal(splitLineComment('url: http://host/path#frag').comment, '')
})
t('# inside double quotes is data', () => {
  assert.equal(splitLineComment('msg: "50% # done"').comment, '')
})
t('# inside single quotes is data', () => {
  assert.equal(splitLineComment("msg: 'it''s # fine'").comment, '')
})
t('comment after a quoted value is still a comment', () => {
  const r = splitLineComment('msg: "hello" # greeting')
  assert.equal(r.code, 'msg: "hello" ')
  assert.equal(r.comment, '# greeting')
})
t('escaped quote does not end the string', () => {
  assert.equal(splitLineComment('msg: "a \\" # b"').comment, '')
})
t('whole-line comment', () => {
  assert.equal(splitLineComment('  # just a note').code.trim(), '')
})

// --- stripComments ----------------------------------------------------------
t('removes inline and whole-line comments', () => {
  const src = ['# header note', 'service: api # inline', '', 'port: 8080'].join('\n')
  const { text, removed } = stripComments(src)
  assert.equal(text, 'service: api\n\nport: 8080\n')
  assert.equal(removed, 2)
})

t('leaves block scalar content alone', () => {
  const src = [
    'script: |',
    '  #!/bin/sh',
    '  echo "# not a comment"',
    '  curl http://x/#frag',
    'next: 1 # this one goes',
  ].join('\n')
  const { text } = stripComments(src)
  assert.ok(text.includes('#!/bin/sh'), 'shebang survived')
  assert.ok(text.includes('echo "# not a comment"'), 'literal # survived')
  assert.ok(text.includes('next: 1\n'), 'real comment removed')
})

t('folded block scalar with a chomping indicator', () => {
  const src = ['note: >-', '  # keep me', 'after: 2 # drop me'].join('\n')
  const { text } = stripComments(src)
  assert.ok(text.includes('# keep me'))
  assert.ok(!text.includes('# drop me'))
})

t('block scalar with a comment on the opening line', () => {
  const src = ['script: | # opener comment', '  # body stays', 'x: 1'].join('\n')
  const { text } = stripComments(src)
  assert.ok(!text.includes('opener comment'))
  assert.ok(text.includes('# body stays'))
})

t('sequence item block scalar', () => {
  const src = ['steps:', '  - |', '    # inside', '  - two # gone'].join('\n')
  const { text } = stripComments(src)
  assert.ok(text.includes('# inside'))
  assert.ok(!text.includes('# gone'))
})

t('keepBlankLines leaves the empty line behind', () => {
  const { text } = stripComments('# note\nx: 1', { keepBlankLines: true })
  assert.equal(text, '\nx: 1\n')
})

t('document markers and directives survive', () => {
  const src = '%YAML 1.2\n---\na: 1 # one\n---\nb: 2'
  const { text } = stripComments(src)
  assert.ok(text.startsWith('%YAML 1.2\n---\n'))
  assert.ok(text.includes('---\nb: 2'))
})

// --- tidy -------------------------------------------------------------------
t('tabs in indentation become spaces', () => {
  const { text, tabsFixed } = tidy('root:\n\tchild: 1\n')
  assert.equal(text, 'root:\n  child: 1\n')
  assert.equal(tabsFixed, 1)
})
t('trailing whitespace and blank runs go', () => {
  const { text, trailingFixed } = tidy('a: 1   \n\n\n\n\nb: 2\n\n\n')
  assert.equal(text, 'a: 1\n\nb: 2\n')
  assert.equal(trailingFixed, 1)
})
t('comments survive a tidy', () => {
  const { text } = tidy('# keep\na: 1\t\n')
  assert.ok(text.startsWith('# keep'))
})
t('block scalar trailing spaces are left alone', () => {
  const src = 'text: |\n  padded   \nx: 1\n'
  const { text } = tidy(src)
  assert.ok(text.includes('  padded   '), 'literal trailing spaces kept')
})
t('CRLF is normalised', () => {
  assert.equal(tidy('a: 1\r\nb: 2\r\n').text, 'a: 1\nb: 2\n')
})
t('findIndentTabs reports the line numbers', () => {
  assert.deepEqual(findIndentTabs('a:\n\tb: 1\nc:\n  \td: 2\n'), [2, 4])
})

// --- format / toFlow --------------------------------------------------------
t('format normalises indentation and quoting', () => {
  const out = format('a:\n      b:    1\n      c: "two"\n')
  assert.equal(out, 'a:\n  b: 1\n  c: two\n')
})
t('format sorts keys when asked', () => {
  assert.equal(format('b: 2\na: 1\n', { sortKeys: true }), 'a: 1\nb: 2\n')
})
t('format keeps insertion order otherwise', () => {
  assert.equal(format('b: 2\na: 1\n'), 'b: 2\na: 1\n')
})
t('multi-document round trip', () => {
  const out = format('a: 1\n---\nb: 2\n')
  assert.equal(out, 'a: 1\n---\nb: 2\n')
})
t('anchors are expanded with noRefs', () => {
  const src = 'base: &b\n  x: 1\nuse:\n  <<: *b\n'
  const out = format(src, { noRefs: true })
  assert.ok(!out.includes('&'), 'no anchors left')
  assert.ok(out.includes('x: 1'))
})
t('toFlow puts it on one line', () => {
  const out = toFlow('a:\n  b: 1\n  c: [1, 2]\n').trim()
  assert.equal(out, '{a: {b: 1, c: [1, 2]}}')
})
t('lineWidth -1 never folds a long string', () => {
  const long = 'x'.repeat(200)
  const out = format(`msg: ${long}\n`, { lineWidth: -1 })
  assert.equal(out.trim().split('\n').length, 1)
})

// --- validate / stats -------------------------------------------------------
t('validate accepts good YAML', () => {
  assert.equal(validate('a: 1\n').ok, true)
})
t('validate reports the line of a syntax error', () => {
  const r = validate('a: 1\n  b: 2\n')
  assert.equal(r.ok, false)
  assert.equal(typeof r.line, 'number')
})
t('validate catches a tab used for indentation', () => {
  assert.equal(validate('a:\n\tb: 1\n').ok, false)
})
t('stats counts documents, keys, depth and comments', () => {
  const s = stats('# c\na:\n  b:\n    c: 1\n---\nd: 2\n')
  assert.equal(s.documents, 2)
  assert.equal(s.keys, 4)
  assert.equal(s.depth, 3)
  assert.equal(s.comments, 1)
})
t('stats counts anchors and aliases', () => {
  const s = stats('base: &b\n  x: 1\nuse: *b\n')
  assert.equal(s.anchors, 1)
  assert.equal(s.aliases, 1)
})
t('stats returns null for invalid YAML', () => {
  assert.equal(stats('a: 1\n  b: 2\n'), null)
})
