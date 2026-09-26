import { useMemo, useState } from 'react'
import { ChevronRight, ChevronsDown, ChevronsUp } from 'lucide-react'
import { isLossless } from '../lib/jsonparse'
import { Button } from './ui'

/**
 * The virtualised, collapsible JSON tree shared by the JSON Validator and the
 * JSON Formatter. Only the rows in view are mounted, and a collapsed branch
 * costs nothing to build, so a document with 100,000 nodes still scrolls.
 */
export const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : isLossless(v) ? 'number' : typeof v)
// Documents bigger than this open with only the top level expanded.
export const AUTO_COLLAPSE_NODES = 5000
const TYPE_TONE = { string: 'tok-str', number: 'tok-num', boolean: 'tok-bool', null: 'tok-null' }
const ROW_HEIGHT = 24
const OVERSCAN = 12

// Flattens the visible part of the tree into a linear row list, descending
// only into open branches.
export function buildRows(value, isOpen) {
  const rows = []
  const walk = (name, val, depth, path) => {
    const type = typeOf(val)
    const branch = type === 'object' || type === 'array'
    const childCount = branch ? (type === 'array' ? val.length : Object.keys(val).length) : 0
    const open = branch && isOpen(path, depth)
    rows.push({ path, name, type, value: val, depth, branch, childCount, open })
    if (open) {
      if (type === 'array') val.forEach((v, i) => walk(String(i), v, depth + 1, `${path}.${i}`))
      else for (const k of Object.keys(val)) walk(k, val[k], depth + 1, `${path}.${k}`)
    }
  }
  walk('$', value, 0, '$')
  return rows
}

function TreeRow({ row, onToggle }) {
  const indent = row.depth * 16 + 6
  if (!row.branch) {
    return (
      <div className="code-row flex items-center gap-2" style={{ height: ROW_HEIGHT, paddingLeft: indent + 18 }}>
        <span className="tok-key mono text-sm">{row.name}</span>
        <span className="t-faint">:</span>
        <span className={`mono truncate text-sm ${TYPE_TONE[row.type] || ''}`}>
          {row.type === 'string' ? `"${row.value}"` : String(row.value)}
        </span>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onToggle(row.path)}
      aria-expanded={row.open}
      className="code-row flex w-full items-center gap-1.5 text-left"
      style={{ height: ROW_HEIGHT, paddingLeft: indent }}
    >
      <ChevronRight className={`t-faint h-3.5 w-3.5 shrink-0 transition-transform ${row.open ? 'rotate-90' : ''}`} aria-hidden="true" />
      <span className="tok-key mono text-sm">{row.name}</span>
      <span className="t-faint mono text-xs">{row.type === 'array' ? `[${row.childCount}]` : `{${row.childCount}}`}</span>
    </button>
  )
}

export function VirtualTree({ rows, onToggle, height = 380 }) {
  const [scrollTop, setScrollTop] = useState(0)
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const visibleCount = Math.ceil(height / ROW_HEIGHT) + OVERSCAN * 2
  const slice = rows.slice(first, first + visibleCount)
  return (
    <div className="bd sunken overflow-auto rounded-xl border" style={{ height }} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
      <div style={{ height: rows.length * ROW_HEIGHT, position: 'relative' }}>
        <div style={{ position: 'absolute', top: first * ROW_HEIGHT, left: 0, right: 0 }}>
          {slice.map((row) => (
            <TreeRow key={row.path} row={row} onToggle={onToggle} />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Open/closed state for a tree: a base mode ('auto', 'all', 'none') plus the
 * branches the user flipped from it. `enabled` skips the work while the tree
 * is not on screen.
 */
export function useJsonTree(value, { enabled, totalNodes = 0 }) {
  const [tree, setTree] = useState(() => ({ mode: 'auto', toggled: new Set() }))
  const autoDepth = totalNodes > AUTO_COLLAPSE_NODES ? 1 : Infinity
  const rows = useMemo(() => {
    if (!enabled) return []
    const isOpen = (path, depth) => {
      const base = tree.mode === 'all' ? true : tree.mode === 'none' ? depth === 0 : depth < autoDepth
      return base !== tree.toggled.has(path)
    }
    return buildRows(value, isOpen)
  }, [enabled, value, tree, autoDepth])
  const toggle = (path) =>
    setTree((prev) => {
      const toggled = new Set(prev.toggled)
      if (toggled.has(path)) toggled.delete(path)
      else toggled.add(path)
      return { ...prev, toggled }
    })
  return {
    rows,
    toggle,
    expandAll: () => setTree({ mode: 'all', toggled: new Set() }),
    collapseAll: () => setTree({ mode: 'none', toggled: new Set() }),
  }
}

/** The tree with its Expand all / Collapse all buttons. */
export function JsonTreeView({ tree, height, empty = 'Valid JSON will appear here as a tree.' }) {
  if (!tree.rows.length)
    return <div className="bd sunken t-faint mono rounded-xl border border-dashed px-3 py-2.5 text-sm">{empty}</div>
  return (
    <>
      <div className="mb-2 flex justify-end gap-2">
        <Button variant="ghost" type="button" onClick={tree.expandAll}><ChevronsDown className="h-3.5 w-3.5" />Expand all</Button>
        <Button variant="ghost" type="button" onClick={tree.collapseAll}><ChevronsUp className="h-3.5 w-3.5" />Collapse all</Button>
      </div>
      <VirtualTree rows={tree.rows} onToggle={tree.toggle} height={height} />
    </>
  )
}
