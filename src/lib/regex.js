/**
 * The Regex Tester's engine: pure functions over the browser's own RegExp,
 * run inside src/lib/regexWorker.js so a catastrophic pattern can be stopped.
 */
import { escapeHtml } from './utils.js'

export const FLAGS = [
  ['g', 'global', 'Find every match, not just the first'],
  ['i', 'ignoreCase', 'Case-insensitive'],
  ['m', 'multiline', '^ and $ match at every line break'],
  ['s', 'dotAll', '. also matches line breaks'],
  ['u', 'unicode', 'Unicode mode: \\p{…}, code points, stricter syntax'],
  ['y', 'sticky', 'Match only at lastIndex (no scanning ahead)'],
  ['d', 'hasIndices', 'Report start and end of every capture group'],
]

export const MAX_MATCHES = 5000

/** Compile, reporting the engine's own message on a bad pattern. */
export function compile(pattern, flags) {
  try {
    return { re: new RegExp(pattern, flags) }
  } catch (e) {
    return { error: e.message.replace(/^Invalid regular expression: /, '').replace(/^\/[\s\S]*\/[a-z]*: /, '') }
  }
}

/**
 * Every match with its capture groups. The d flag is always added internally
 * so group positions are known; it does not change what matches.
 */
export function findMatches(pattern, flags, text) {
  const withD = flags.includes('d') ? flags : flags + 'd'
  const { re, error } = compile(pattern, withD)
  if (error) return { error }
  const global = flags.includes('g')
  const matches = []
  let truncated = false
  const names = []
  for (;;) {
    const m = re.exec(text)
    if (!m) break
    if (matches.length >= MAX_MATCHES) {
      truncated = true
      break
    }
    const groupNames = m.groups ? Object.keys(m.groups) : []
    const nameAt = {}
    // indices.groups maps names to the same positions as the numbered groups.
    if (m.indices?.groups) {
      for (const n of groupNames) {
        const pos = m.indices.groups[n]
        for (let k = 1; k < m.length; k++) if (pos && m.indices[k] && m.indices[k][0] === pos[0] && m.indices[k][1] === pos[1] && m[k] === m.groups[n] && !nameAt[k]) {
          nameAt[k] = n
          break
        }
      }
    }
    const groups = []
    for (let k = 1; k < m.length; k++) {
      const pos = m.indices?.[k]
      groups.push({ n: k, name: nameAt[k] || null, value: m[k] ?? null, start: pos ? pos[0] : null, end: pos ? pos[1] : null })
    }
    for (const n of groupNames) if (!names.includes(n)) names.push(n)
    matches.push({ index: m.index, end: m.index + m[0].length, text: m[0], groups })
    if (!global) break
    if (m[0] === '') {
      // Step over an empty match, by a whole code point in unicode mode.
      const cp = text.codePointAt(re.lastIndex)
      re.lastIndex += flags.includes('u') && cp > 0xffff ? 2 : 1
      if (re.lastIndex > text.length) break
    }
  }
  return { matches, truncated, groupCount: matches[0]?.groups.length ?? countGroups(re), names }
}

function countGroups(re) {
  // A regex that matches nothing still has its groups: count them the cheap way.
  try {
    return new RegExp(`${re.source}|`, re.flags.replace(/[gy]/g, '')).exec('').length - 1
  } catch {
    return 0
  }
}

export function replaceAll(pattern, flags, text, replacement) {
  const { re, error } = compile(pattern, flags)
  if (error) return { error }
  return { text: text.replace(re, replacement) }
}

/** Escaped text with <mark>s around the matches, for the editor's paint layer. */
export function highlightHtml(text, matches) {
  let out = ''
  let at = 0
  matches.forEach((m, i) => {
    if (m.index < at) return
    out += escapeHtml(text.slice(at, m.index))
    if (m.end === m.index) {
      out += '<span class="rx-empty"></span>'
    } else {
      out += `<mark class="${i % 2 ? 'rx-b' : 'rx-a'}">${escapeHtml(text.slice(m.index, m.end))}</mark>`
    }
    at = m.end
  })
  return out + escapeHtml(text.slice(at))
}

/** Clickable cheat-sheet tokens; "…" marks where the caret lands after insert. */
export const CHEATSHEET = [
  ['Characters', [
    ['.', 'Any character except a line break'],
    ['\\d', 'Digit 0–9'],
    ['\\w', 'Word character [A-Za-z0-9_]'],
    ['\\s', 'Whitespace'],
    ['\\D', 'Not a digit'],
    ['[abc]', 'One of a, b or c'],
    ['[^abc]', 'Anything but a, b or c'],
    ['[a-z]', 'Range'],
    ['\\p{L}', 'Any letter, any script (needs u)'],
  ]],
  ['Anchors', [
    ['^', 'Start of input (of line with m)'],
    ['$', 'End of input (of line with m)'],
    ['\\b', 'Word boundary'],
    ['\\B', 'Not a word boundary'],
  ]],
  ['Quantifiers', [
    ['*', '0 or more'],
    ['+', '1 or more'],
    ['?', '0 or 1'],
    ['{…}', 'Exactly n: {3}, range: {2,5}'],
    ['*?', 'Lazy: as few as possible'],
  ]],
  ['Groups', [
    ['(…)', 'Capture group'],
    ['(?<name>…)', 'Named group'],
    ['(?:…)', 'Group without capturing'],
    ['|', 'Alternation: a|b'],
    ['\\1', 'Back-reference to group 1'],
    ['\\k<name>', 'Back-reference by name'],
  ]],
  ['Lookaround', [
    ['(?=…)', 'Followed by'],
    ['(?!…)', 'Not followed by'],
    ['(?<=…)', 'Preceded by'],
    ['(?<!…)', 'Not preceded by'],
  ]],
]

/** Inserts a cheat-sheet token into `value` at the selection. */
export function insertToken(value, start, end, token) {
  const hole = token.indexOf('…')
  const clean = token.replace('…', '')
  const selected = value.slice(start, end)
  // Wrap the selection when the token has a hole, e.g. select "abc" → (abc).
  const inserted = hole >= 0 ? clean.slice(0, hole) + selected + clean.slice(hole) : clean
  const caret = hole >= 0 ? start + hole + selected.length : start + inserted.length
  return { value: value.slice(0, start) + inserted + value.slice(end), caret }
}
