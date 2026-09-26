import {
  Home as HomeIcon,
  Braces,
  Binary,
  GitCompare,
  Clock,
  KeyRound,
  Database,
  CalendarClock,
  FileCode2,
  Boxes,
  Globe,
  Shuffle,
  Palette,
  ArrowUpDown,
  Layers,
  Code,
  Eraser,
  GitMerge,
  ListTree,
  BarChart3,
  Waypoints,
  FileJson,
  Fingerprint,
  Type,
  FileText,
  ShieldCheck,
  BookOpen,
  Container,
  AlignLeft,
  TableProperties,
  FileDiff,
  Link2,
  Ampersand,
  CaseSensitive,
  Hash,
} from 'lucide-react'

export const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true, group: null, accent: 'emerald', description: 'Overview of all tools' },

  // --- JWT
  { to: '/jwtvalidator', label: 'JWT Validator', icon: KeyRound, group: 'JWT', accent: 'cyan', description: 'Decode and check JSON Web Tokens' },

  // --- Formatters
  { to: '/json-xml', label: 'JSON / XML', icon: Braces, group: 'Formatters', accent: 'sky', description: 'Format, validate & search JSON or XML' },
  { to: '/yaml', label: 'YAML Formatter', icon: AlignLeft, group: 'Formatters', accent: 'violet', description: 'Format, tidy, strip comments & validate YAML' },
  { to: '/sql', label: 'SQL Formatter', icon: Database, group: 'Formatters', accent: 'orange', description: 'Pretty-print & minify SQL across dialects' },

  // --- Data & formats
  { to: '/convert', label: 'JSON ⇄ YAML ⇄ CSV', icon: Shuffle, group: 'Data', accent: 'teal', description: 'Convert between config & data formats' },
  { to: '/codegen', label: 'JSON → Code', icon: FileCode2, group: 'Data', accent: 'indigo', description: 'Generate typed models from a JSON payload' },
  { to: '/properties', label: 'Properties Viewer', icon: TableProperties, group: 'Data', accent: 'amber', description: 'Read, clean, list keys and convert .properties files' },
  { to: '/properties-compare', label: 'Properties Compare', icon: FileDiff, group: 'Data', accent: 'rose', description: 'Diff two .properties files by key and value' },

  // --- JSON toolkit: one route per task so each ranks for its own query
  { to: '/jsonvalidator', label: 'JSON Validator', icon: ShieldCheck, group: 'JSON Toolkit', accent: 'emerald', description: 'Validate, format & explore JSON in a live tree view' },
  { to: '/json-sort-keys', label: 'JSON Sort Keys', icon: ArrowUpDown, group: 'JSON Toolkit', accent: 'sky', description: 'Alphabetise keys at every level' },
  { to: '/json-flatten', label: 'JSON Flattener', icon: Layers, group: 'JSON Toolkit', accent: 'teal', description: 'Collapse nesting into dot-notation keys' },
  { to: '/json-unflatten', label: 'JSON Unflattener', icon: Boxes, group: 'JSON Toolkit', accent: 'teal', description: 'Rebuild nesting from dot-notation keys' },
  { to: '/json-escape', label: 'JSON Escape', icon: Code, group: 'JSON Toolkit', accent: 'violet', description: 'Escape or unescape a JSON string literal' },
  { to: '/json-remove-nulls', label: 'Remove Nulls', icon: Eraser, group: 'JSON Toolkit', accent: 'amber', description: 'Strip every null value' },
  { to: '/json-remove-empty', label: 'Remove Empty Values', icon: Eraser, group: 'JSON Toolkit', accent: 'rose', description: 'Strip nulls, "", [] and {}' },
  { to: '/json-merge', label: 'JSON Merge', icon: GitMerge, group: 'JSON Toolkit', accent: 'lime', description: 'Deep-merge two documents' },
  { to: '/json-tree', label: 'JSON Tree Viewer', icon: ListTree, group: 'JSON Toolkit', accent: 'cyan', description: 'Explore a payload as a collapsible tree' },
  { to: '/json-stats', label: 'JSON Statistics', icon: BarChart3, group: 'JSON Toolkit', accent: 'fuchsia', description: 'Node counts, depth and type breakdown' },
  { to: '/jsonpath', label: 'JSONPath Evaluator', icon: Waypoints, group: 'JSON Toolkit', accent: 'indigo', description: 'Query with $.path expressions' },
  { to: '/json-schema', label: 'JSON Schema Generator', icon: FileJson, group: 'JSON Toolkit', accent: 'orange', description: 'Infer a schema from a sample payload' },

  // --- Text & compare
  { to: '/diff', label: 'Diff Checker', icon: GitCompare, group: 'Text', accent: 'amber', description: 'Compare two blocks of text' },
  { to: '/encode-decode', label: 'Encode / Decode', icon: Binary, group: 'Text', accent: 'violet', description: 'Base64, URL & hashing' },
  { to: '/color', label: 'Colour & CSS Units', icon: Palette, group: 'Text', accent: 'pink', description: 'HEX, RGB, HSL and px / rem / em / pt' },
  { to: '/url-parser', label: 'URL Parser', icon: Link2, group: 'Text', accent: 'sky', description: 'Split a URL into parts and edit its query string' },
  { to: '/html-entities', label: 'HTML Entities', icon: Ampersand, group: 'Text', accent: 'orange', description: 'Encode and decode HTML entities like &amp; and &#233;' },
  { to: '/case-converter', label: 'Case Converter', icon: CaseSensitive, group: 'Text', accent: 'teal', description: 'camelCase, snake_case, kebab-case and more' },
  { to: '/number-base', label: 'Number Base Converter', icon: Hash, group: 'Text', accent: 'indigo', description: 'Binary, octal, decimal and hex with two’s complement' },
  { to: '/markdown', label: 'Markdown Preview', icon: FileText, group: 'Text', accent: 'blue', description: 'Live GitHub-flavoured Markdown with Mermaid diagrams' },

  // --- Time
  { to: '/timestamp', label: 'Time / UUID / Regex', icon: Clock, group: 'Time', accent: 'rose', description: 'Timestamps across zones, UUIDs, regex' },
  { to: '/cron', label: 'Cron Builder', icon: CalendarClock, group: 'Time', accent: 'lime', description: 'Decode cron expressions & preview next runs' },

  // --- Reference
  { to: '/sql-guide', label: 'SQL Query Guide', icon: BookOpen, group: 'Reference', accent: 'cyan', description: 'Searchable SQL syntax, recipes and gotchas' },
  { to: '/docker-guide', label: 'Docker & Swarm Guide', icon: Container, group: 'Reference', accent: 'sky', description: 'Searchable Docker and Swarm commands with examples' },
  { to: '/http', label: 'HTTP Reference', icon: Globe, group: 'Reference', accent: 'blue', description: 'Status codes, methods & headers' },

  // --- Generators
  { to: '/mock', label: 'Mock Data', icon: Boxes, group: 'Generators', accent: 'fuchsia', description: 'Generate fake records as JSON, CSV or SQL' },
  { to: '/uuid', label: 'UUID & Nano ID', icon: Fingerprint, group: 'Generators', accent: 'violet', description: 'Bulk UUID v4 and Nano ID generation' },
  { to: '/password', label: 'Password Generator', icon: KeyRound, group: 'Generators', accent: 'rose', description: 'Cryptographically random passwords' },
  { to: '/lorem', label: 'Lorem Ipsum', icon: Type, group: 'Generators', accent: 'amber', description: 'Placeholder copy by word, sentence or paragraph' },
]

/**
 * Words people type into ⌘K that are not in a tool's name or description —
 * the algorithm, the format, the thing they are trying to do. Matched by
 * src/lib/search.js. Kept out of the one-line nav entries above because
 * scripts/prerender.mjs parses those lines as text.
 */
const KEYWORDS = {
  '/jwtvalidator': ['jwt', 'jwt decode', 'jwt decoder', 'token', 'bearer', 'jws', 'claims', 'exp', 'oauth', 'id token', 'access token'],
  '/json-xml': ['json formatter', 'xml formatter', 'pretty print', 'format', 'xml validator', 'xpath', 'minify'],
  '/yaml': ['yml', 'yaml lint', 'yaml validator', 'format', 'pretty print', 'remove comments', 'kubernetes', 'k8s', 'helm', 'docker compose'],
  '/sql': ['sql beautifier', 'pretty print', 'format', 'minify', 'postgres', 'postgresql', 'mysql', 'sqlite', 'oracle', 'sql server', 'tsql', 'bigquery', 'snowflake'],
  '/convert': ['json to yaml', 'yaml to json', 'json to csv', 'csv to json', 'convert', 'converter', 'yml', 'csv', 'tsv'],
  '/codegen': ['json to typescript', 'typescript', 'java', 'pojo', 'go struct', 'golang', 'python', 'pydantic', 'dataclass', 'c#', 'csharp', 'kotlin', 'interface', 'types', 'model'],
  '/properties': ['.properties', 'spring', 'spring boot', 'java properties', 'application.properties', 'properties to yaml', 'config', 'keys'],
  '/properties-compare': ['diff', 'compare', 'properties diff', 'config diff', 'spring', 'missing keys'],
  '/jsonvalidator': ['prettify', 'beautify', 'lint', 'linter', 'json lint', 'json format', 'json formatter', 'format', 'validate', 'check', 'syntax error', 'pretty print', 'json viewer', 'minify'],
  '/json-sort-keys': ['sort', 'alphabetical', 'order', 'normalize', 'canonical'],
  '/json-flatten': ['flatten', 'dot notation', 'dotted keys', 'flat'],
  '/json-unflatten': ['unflatten', 'nest', 'dot notation', 'expand'],
  '/json-escape': ['escape', 'unescape', 'stringify', 'string literal', 'quotes', 'backslash'],
  '/json-remove-nulls': ['null', 'remove null', 'clean', 'strip'],
  '/json-remove-empty': ['empty', 'blank', 'clean', 'strip', 'compact'],
  '/json-merge': ['merge', 'combine', 'deep merge', 'patch', 'overlay'],
  '/json-tree': ['tree', 'viewer', 'explorer', 'collapsible', 'browse'],
  '/json-stats': ['statistics', 'count', 'depth', 'analyze', 'analyse', 'size'],
  '/jsonpath': ['json path', 'jsonpath', 'query', 'jq', 'select', 'filter', 'xpath'],
  '/json-schema': ['schema', 'json schema', 'infer', 'validate', 'draft 2020-12', 'openapi'],
  '/diff': ['diff', 'compare', 'difference', 'text compare', 'changes'],
  '/encode-decode': ['sha', 'sha1', 'sha256', 'sha-256', 'sha384', 'sha512', 'md5', 'hash', 'checksum', 'digest', 'base64', 'base64 encode', 'base64 decode', 'url encode', 'url decode', 'percent encoding', 'encodeuricomponent'],
  '/color': ['hex', 'rgb', 'hsl', 'color picker', 'colour', 'color', 'rem', 'px', 'em', 'css units', 'converter'],
  '/url-parser': ['url', 'url parser', 'query string', 'query params', 'querystring', 'parse url', 'url decode', 'search params', 'utm', 'uri'],
  '/html-entities': ['html entities', 'html escape', 'html unescape', 'html encode', 'html decode', 'entity', '&amp;', 'nbsp', 'xss', 'escape'],
  '/case-converter': ['case', 'camelcase', 'camel case', 'snake_case', 'snake case', 'kebab-case', 'kebab case', 'pascalcase', 'pascal case', 'constant case', 'title case', 'rename', 'naming convention'],
  '/number-base': ['binary', 'hex', 'hexadecimal', 'octal', 'decimal', 'base converter', 'radix', 'bin to hex', 'hex to decimal', 'two\'s complement', 'bits', 'bigint'],
  '/markdown': ['md', 'readme', 'preview', 'gfm', 'github markdown', 'mermaid', 'diagram'],
  '/timestamp': ['epoch', 'unix', 'unix time', 'timestamp', 'epoch converter', 'date', 'time zone', 'timezone', 'utc', 'iso 8601', 'milliseconds', 'regex', 'regular expression', 'uuid'],
  '/cron': ['cron', 'crontab', 'schedule', 'cron expression', 'quartz', 'next run', 'job'],
  '/sql-guide': ['sql', 'query', 'join', 'group by', 'window function', 'cte', 'cheat sheet', 'examples', 'postgres', 'mysql'],
  '/docker-guide': ['docker', 'swarm', 'compose', 'container', 'image', 'dockerfile', 'cheat sheet', 'commands'],
  '/http': ['status code', 'http status', '404', '500', 'headers', 'methods', 'rest', 'cors', 'cache-control'],
  '/mock': ['fake', 'faker', 'fake data', 'dummy', 'dummy data', 'seed', 'test data', 'sample data', 'random', 'generate'],
  '/uuid': ['uuid', 'guid', 'uuid v4', 'nanoid', 'nano id', 'unique id', 'random id', 'generate'],
  '/password': ['password', 'passphrase', 'random', 'secure', 'secret', 'strong password', 'generate'],
  '/lorem': ['lorem ipsum', 'placeholder', 'dummy text', 'filler', 'generate'],
}
for (const item of navItems) item.keywords = KEYWORDS[item.to] || []

/**
 * The href form of an internal route.
 *
 * Every page advertises itself with a trailing slash — `/uuid/` is what GitHub
 * Pages actually serves, and what the canonical tag and the sitemap both point
 * at. Route keys stay slash-free (`/uuid`) because they index navItems, LOADERS
 * and the SEO table, so the slash is added here, at the moment a link is
 * rendered. Skip it and every in-app link 301-redirects: the server-rendered
 * HTML is right, hydration replaces it with the slash-less form, and Googlebot
 * — which renders the JS — crawls the redirecting URL instead of the real one.
 *
 * scripts/prerender.mjs keeps its own copy of this, because it reads nav.js as
 * text rather than importing it. The two have to agree.
 */
export function hrefFor(to) {
  if (typeof to !== 'string' || !to.startsWith('/')) return to
  const cut = to.search(/[?#]/)
  const path = cut === -1 ? to : to.slice(0, cut)
  const rest = cut === -1 ? '' : to.slice(cut)
  return path === '/' || path.endsWith('/') ? to : `${path}/${rest}`
}

export const NAV_GROUPS = ['JWT', 'Formatters', 'Data', 'JSON Toolkit', 'Text', 'Time', 'Generators', 'Reference']

// Groups that start collapsed — the JSON toolkit is long and most visits are
// to one specific tool rather than a browse.
export const COLLAPSED_BY_DEFAULT = ['JSON Toolkit', 'Generators']

// Full literal class strings, one block per accent, so Tailwind's static
// scanner can see every class name (dynamic interpolation is not scanned).
export const ACCENTS = {
  emerald: { groupHoverText: 'group-hover:text-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30', grad: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/20' },
  sky: { groupHoverText: 'group-hover:text-sky-500', bg: 'bg-sky-500/10', text: 'text-sky-500', border: 'border-sky-500/30', grad: 'from-sky-500 to-blue-600', glow: 'shadow-sky-500/20' },
  violet: { groupHoverText: 'group-hover:text-violet-500', bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/30', grad: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/20' },
  amber: { groupHoverText: 'group-hover:text-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30', grad: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/20' },
  rose: { groupHoverText: 'group-hover:text-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/30', grad: 'from-rose-500 to-pink-600', glow: 'shadow-rose-500/20' },
  cyan: { groupHoverText: 'group-hover:text-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/30', grad: 'from-cyan-500 to-teal-600', glow: 'shadow-cyan-500/20' },
  teal: { groupHoverText: 'group-hover:text-teal-500', bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/30', grad: 'from-teal-500 to-emerald-600', glow: 'shadow-teal-500/20' },
  indigo: { groupHoverText: 'group-hover:text-indigo-500', bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/30', grad: 'from-indigo-500 to-violet-600', glow: 'shadow-indigo-500/20' },
  orange: { groupHoverText: 'group-hover:text-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30', grad: 'from-orange-500 to-red-600', glow: 'shadow-orange-500/20' },
  lime: { groupHoverText: 'group-hover:text-lime-500', bg: 'bg-lime-500/10', text: 'text-lime-500', border: 'border-lime-500/30', grad: 'from-lime-500 to-green-600', glow: 'shadow-lime-500/20' },
  blue: { groupHoverText: 'group-hover:text-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30', grad: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/20' },
  pink: { groupHoverText: 'group-hover:text-pink-500', bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/30', grad: 'from-pink-500 to-rose-600', glow: 'shadow-pink-500/20' },
  fuchsia: { groupHoverText: 'group-hover:text-fuchsia-500', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-500', border: 'border-fuchsia-500/30', grad: 'from-fuchsia-500 to-pink-600', glow: 'shadow-fuchsia-500/20' },
}

const RECENT_KEY = 'devpocket-recent'

export function pushRecent(path) {
  if (path === '/') return
  try {
    const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    const next = [path, ...prev.filter((p) => p !== path)].slice(0, 4)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // ignore persistence failures
  }
}

export function getRecent() {
  try {
    const paths = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    return paths.map((p) => navItems.find((n) => n.to === p)).filter(Boolean)
  } catch {
    return []
  }
}
