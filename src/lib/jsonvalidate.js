/**
 * Everything the JSON Validator page computes from its input, in one pure
 * function so it can run inline for small documents and in a worker for large
 * ones without the two paths drifting apart.
 */
import { parseJson, stringify, pathLabel } from './jsonparse.js'
import { sortKeys, analyse, findDuplicateKeys } from './jsonops.js'

const EMPTY = {
  ok: false,
  empty: true,
  error: null,
  bomRemoved: false,
  bigNumbers: [],
  duplicates: [],
  output: '',
  stats: null,
  value: undefined,
}

export function analyzeJson(input, { sort = false, mode = 'pretty', indent = '2' } = {}) {
  if (!input || !input.trim()) return EMPTY

  const parsed = parseJson(input)
  if (!parsed.ok) {
    return { ...EMPTY, empty: false, error: parsed.error, bomRemoved: parsed.bomRemoved }
  }

  const hasLossless = parsed.bigNumbers.length > 0
  const shaped = sort ? sortKeys(parsed.value) : parsed.value
  const space = mode === 'minified' ? undefined : indent === 'tab' ? '\t' : Number(indent)
  const output = stringify(shaped, space, hasLossless)
  const stats = analyse(shaped)

  return {
    ok: true,
    empty: false,
    error: null,
    bomRemoved: parsed.bomRemoved,
    bigNumbers: parsed.bigNumbers.map((b) => ({ ...b, label: pathLabel(b.path) })),
    duplicates: findDuplicateKeys(parsed.text),
    output,
    // `keys` can be tens of thousands of strings on a big document, and the
    // page only needs the count.
    stats: { ...stats, keys: undefined },
    value: shaped,
  }
}
