/**
 * Tool search for the ⌘K palette.
 *
 * Every word of the query has to match somewhere (name, keywords, description
 * or group), so "jwt decode" finds the JWT tool and not every decoder. Results
 * are ranked by where the query matched, strongest first:
 *
 *   exact name  >  name starts with it  >  a whole word of the name
 *   >  exact keyword  >  a name word starting with it  >  keyword prefix
 *   >  description  >  group  >  near-miss typo
 *
 * so the dedicated tool for a word comes before a tool that mentions it.
 */

// "SHA-256", "sha 256" and "sha256" should all meet in the middle.
const squash = (s) => s.toLowerCase().replace(/[^a-z0-9#.]+/g, '')
const words = (s) => s.toLowerCase().split(/[^a-z0-9#.]+/).filter(Boolean)

// One edit (insert, delete, substitute or swap of neighbours) apart.
function withinOneEdit(a, b) {
  if (a === b) return true
  const la = a.length
  const lb = b.length
  if (Math.abs(la - lb) > 1) return false
  let i = 0
  while (i < la && i < lb && a[i] === b[i]) i++
  if (la === lb) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)
  }
  return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1)
}

function prepare(item) {
  if (item._search) return item._search
  const keywords = (item.keywords || []).map((k) => k.toLowerCase())
  const prepared = {
    label: item.label.toLowerCase(),
    labelSquashed: squash(item.label),
    labelWords: words(item.label),
    keywords,
    keywordsSquashed: keywords.map(squash),
    keywordWords: [...new Set(keywords.flatMap(words))],
    description: item.description.toLowerCase(),
    descriptionWords: words(item.description),
    group: (item.group || '').toLowerCase(),
  }
  Object.defineProperty(item, '_search', { value: prepared, enumerable: false })
  return prepared
}

// Best score for one query word against one item, or 0 if it matches nowhere.
function tokenScore(tok, p) {
  const sq = squash(tok)
  if (!sq) return 0
  if (p.labelWords.includes(tok)) return 60
  if (p.labelWords.some((w) => w.startsWith(tok))) return 50
  if (p.keywordWords.includes(tok) || p.keywordsSquashed.includes(sq)) return 40
  if (p.keywordWords.some((w) => w.startsWith(tok)) || p.keywordsSquashed.some((k) => k.startsWith(sq))) return 30
  if (p.labelSquashed.includes(sq)) return 25
  if (p.descriptionWords.some((w) => w.startsWith(tok))) return 20
  if (p.description.includes(tok)) return 12
  if (p.group.includes(tok)) return 8
  if (tok.length >= 4) {
    const near = (w) => w.length >= 3 && withinOneEdit(tok, w)
    if (p.labelWords.some(near)) return 6
    if (p.keywordWords.some(near)) return 4
  }
  return 0
}

export function scoreTool(item, query) {
  const q = query.trim().toLowerCase()
  if (!q) return 1
  const p = prepare(item)
  const sq = squash(q)

  let score = 0
  let tokens = 0
  for (const tok of words(q)) {
    const s = tokenScore(tok, p)
    if (!s) return 0
    score += s
    tokens++
  }
  if (!tokens) return 0

  // Whole-query bonuses decide the tier; the per-word sum breaks ties.
  if (p.label === q || p.labelSquashed === sq) score += 1000
  else if (p.label.startsWith(q) || p.labelSquashed.startsWith(sq)) score += 800
  else if (p.labelWords.includes(q)) score += 700
  else if (p.keywords.includes(q) || p.keywordsSquashed.includes(sq)) score += 600
  else if (p.labelWords.some((w) => w.startsWith(q))) score += 550
  else if (p.keywords.some((k) => k.startsWith(q))) score += 500
  else if (p.label.includes(q)) score += 450
  else if (p.description.includes(q)) score += 200
  return score
}

/** Tools matching `query`, best first; ties keep their menu order. */
export function searchTools(items, query) {
  if (!query.trim()) return items
  return items
    .map((item, index) => ({ item, index, score: scoreTool(item, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((r) => r.item)
}
