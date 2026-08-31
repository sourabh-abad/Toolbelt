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
} from 'lucide-react'

export const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true, group: null, accent: 'emerald', description: 'Overview of all tools' },

  // --- Data & formats
  { to: '/json-xml', label: 'JSON / XML', icon: Braces, group: 'Data', accent: 'sky', description: 'Format, validate & search JSON or XML' },
  { to: '/convert', label: 'JSON ⇄ YAML ⇄ CSV', icon: Shuffle, group: 'Data', accent: 'teal', description: 'Convert between config & data formats' },
  { to: '/codegen', label: 'JSON → Code', icon: FileCode2, group: 'Data', accent: 'indigo', description: 'Generate typed models from a JSON payload' },
  { to: '/sql', label: 'SQL Formatter', icon: Database, group: 'Data', accent: 'orange', description: 'Pretty-print & minify SQL across dialects' },

  // --- Text & compare
  { to: '/diff', label: 'Diff Checker', icon: GitCompare, group: 'Text', accent: 'amber', description: 'Compare two blocks of text' },
  { to: '/encode-decode', label: 'Encode / Decode', icon: Binary, group: 'Text', accent: 'violet', description: 'Base64, URL & hashing' },
  { to: '/jwtvalidator', label: 'JWT Validator', icon: KeyRound, group: 'Text', accent: 'cyan', description: 'Decode and check JSON Web Tokens' },
  { to: '/color', label: 'Colour & CSS Units', icon: Palette, group: 'Text', accent: 'pink', description: 'HEX, RGB, HSL and px / rem / em / pt' },

  // --- Time
  { to: '/timestamp', label: 'Time / UUID / Regex', icon: Clock, group: 'Time', accent: 'rose', description: 'Timestamps across zones, UUIDs, regex' },
  { to: '/cron', label: 'Cron Builder', icon: CalendarClock, group: 'Time', accent: 'lime', description: 'Decode cron expressions & preview next runs' },

  // --- Reference
  { to: '/http', label: 'HTTP Reference', icon: Globe, group: 'Reference', accent: 'blue', description: 'Status codes, methods & headers' },
  { to: '/mock', label: 'Mock Data', icon: Boxes, group: 'Reference', accent: 'fuchsia', description: 'Generate fake records as JSON, CSV or SQL' },
]

export const NAV_GROUPS = ['Data', 'Text', 'Time', 'Reference']

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
