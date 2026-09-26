import { useEffect, useMemo, useRef, useState } from 'react'
import { Regex, AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { FLAGS, CHEATSHEET, compile, findMatches, replaceAll, highlightHtml, insertToken } from '../lib/regex'
import { plural } from '../lib/format'
import { useDebounced } from '../lib/useDebounced'
import { useToast } from '../lib/toast'
import CodeEditor from '../components/CodeEditor'
import CodeViewer from '../components/CodeViewer'
import { Panel, Button, CopyButton, Input, PageHeader, Tabs } from '../components/ui'

const SAMPLE_PATTERN = '(?<user>[\\w.+-]+)@(?<domain>[\\w-]+(?:\\.[\\w-]+)+)'
const SAMPLE_TEXT = `Support: help@devpocket.example
Ada <ada.lovelace@math.example.org>, grace+ops@navy.example
Not an address: @handle, user@, name@localhost`
const TIMEOUT_MS = 1000
// Past this the paint layer is dropped anyway (see CodeEditor), so skip marks.
const HIGHLIGHT_LIMIT = 100_000

/**
 * Runs each request in a Web Worker and gives it one second. A runaway
 * pattern is stopped by terminating the worker; the next request gets a
 * fresh one. Where workers are unavailable (very old browsers) it runs inline.
 */
function useRegexRunner(request) {
  const [state, setState] = useState(null)
  const worker = useRef(null)
  const seq = useRef(0)
  useEffect(() => () => worker.current?.terminate(), [])

  const key = request ? JSON.stringify(request) : ''
  useEffect(() => {
    if (!key) return
    const req = JSON.parse(key)
    const id = ++seq.current
    let pending = true
    if (typeof Worker === 'undefined') {
      const found = findMatches(req.pattern, req.flags, req.text)
      const replaced = req.replacement === null || found.error ? null : replaceAll(req.pattern, req.flags, req.text, req.replacement).text
      queueMicrotask(() => setState({ ...found, replaced, request: req }))
      return
    }
    if (!worker.current) worker.current = new Worker(new URL('../lib/regexWorker.js', import.meta.url), { type: 'module' })
    const w = worker.current
    const timer = setTimeout(() => {
      w.terminate()
      if (worker.current === w) worker.current = null
      pending = false
      if (id === seq.current) setState({ timeout: true, request: req })
    }, TIMEOUT_MS)
    const onMessage = (e) => {
      if (e.data.id !== id) return
      pending = false
      clearTimeout(timer)
      setState({ ...e.data, request: req })
    }
    w.addEventListener('message', onMessage)
    w.postMessage({ id, ...req })
    return () => {
      clearTimeout(timer)
      w.removeEventListener('message', onMessage)
      // Still busy with this request: it may be the runaway one, so start
      // the next request on a fresh worker rather than queue behind it.
      if (pending) {
        w.terminate()
        if (worker.current === w) worker.current = null
      }
    }
  }, [key])
  return state
}

export default function RegexTesterTool() {
  const [pattern, setPattern] = useState(SAMPLE_PATTERN)
  const [flags, setFlags] = useState('gi')
  const [text, setText] = useState(SAMPLE_TEXT)
  const [tab, setTab] = useState('match')
  const [replacement, setReplacement] = useState('$<user> at $<domain>')
  const patternRef = useRef(null)
  const toast = useToast()

  const syntax = useMemo(() => (pattern ? compile(pattern, flags).error : null), [pattern, flags])
  const req = useDebounced(
    useMemo(() => (pattern && !syntax ? { pattern, flags, text, replacement: tab === 'replace' ? replacement : null } : null), [pattern, flags, text, replacement, tab, syntax]),
    80
  )
  const result = useRegexRunner(req)
  const current = result && result.request && result.request.pattern === pattern && result.request.flags === flags && result.request.text === text
  const matches = current && !result.timeout && !result.error ? result.matches : null
  // While the next answer is on its way, keep the last count on screen.
  const lastMatches = result && !result.timeout && !result.error ? result.matches : null

  const paintHtml = useMemo(() => (matches && text.length <= HIGHLIGHT_LIMIT ? highlightHtml(text, matches) : null), [matches, text])

  const toggleFlag = (f) => setFlags((prev) => (prev.includes(f) ? prev.replace(f, '') : FLAGS.map(([x]) => x).filter((x) => x === f || prev.includes(x)).join('')))

  function insert(token) {
    const el = patternRef.current
    const start = el?.selectionStart ?? pattern.length
    const end = el?.selectionEnd ?? pattern.length
    const next = insertToken(pattern, start, end, token)
    setPattern(next.value)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(next.caret, next.caret)
    })
  }

  const groupRows = useMemo(() => {
    if (!matches) return []
    const rows = []
    for (const [i, m] of matches.slice(0, 200).entries()) {
      rows.push({ key: `${i}-0`, match: i + 1, group: '0 (whole match)', value: m.text, start: m.index, end: m.end })
      for (const g of m.groups) rows.push({ key: `${i}-${g.n}`, match: i + 1, group: g.name ? `${g.n} · ${g.name}` : String(g.n), value: g.value, start: g.start, end: g.end })
    }
    return rows
  }, [matches])

  return (
    <div>
      <PageHeader icon={Regex} title="Regex Tester" subtitle="Test JavaScript regular expressions with live highlighting, groups and replace." accent="rose" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel title="Pattern">
          <div className="field mono flex items-center rounded-xl border px-3 focus-within:border-emerald-500/60">
            <span className="t-faint select-none">/</span>
            <input
              ref={patternRef}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              spellCheck={false}
              aria-label="Regular expression"
              aria-invalid={syntax ? true : undefined}
              className="t-main min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm outline-none"
              placeholder="\d{3}-\d{4}"
            />
            <span className="t-faint select-none">/{flags}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Flags">
            {FLAGS.map(([f, name, help]) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFlag(f)}
                aria-pressed={flags.includes(f)}
                title={`${name}: ${help}`}
                className={`mono inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border px-2 text-xs font-semibold transition-colors ${
                  flags.includes(f) ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bd t-muted hover-surface'
                }`}
              >
                {f}
                <span className="hidden font-sans font-normal sm:inline">{name}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 min-h-5 text-sm" aria-live="polite">
            {syntax ? (
              <p className="mono text-rose-600 dark:text-rose-300">{syntax}</p>
            ) : result?.timeout && current ? (
              <p className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Stopped after 1 second: this pattern is backtracking catastrophically on this input. Look for nested quantifiers such as (a+)+ or (\w*)*, or alternatives that overlap, and make them unambiguous.
              </p>
            ) : lastMatches ? (
              <p className={`t-muted ${matches ? '' : 'opacity-60'}`}>
                {lastMatches.length === 0 ? 'No match' : plural(lastMatches.length, 'match', 'matches')}
                {result.truncated ? ` (stopped at ${lastMatches.length.toLocaleString()})` : ''}
                {lastMatches.length > 0 && result.groupCount > 0 ? ` · ${plural(result.groupCount, 'group')}` : ''}
              </p>
            ) : pattern ? (
              <p className="t-faint flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />Running…</p>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Test string"
          actions={
            <Button variant="ghost" type="button" onClick={() => setText('')}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Clear
            </Button>
          }
        >
          <CodeEditor rows={8} value={text} onChange={(e) => setText(e.target.value)} ariaLabel="Test string" paintHtml={paintHtml} placeholder="Paste the text to search…" />
          <div className="mt-4">
            <Tabs value={tab} onChange={setTab} options={[{ value: 'match', label: 'Matches & groups' }, { value: 'replace', label: 'Replace' }]} />
          </div>
          {tab === 'match' ? (
            groupRows.length > 0 && (
              <div className="bd mt-3 max-h-80 overflow-auto rounded-xl border">
                <table className="w-full text-left text-xs">
                  <thead className="surface t-muted sticky top-0">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">Match</th>
                      <th className="px-2.5 py-1.5 font-semibold">Group</th>
                      <th className="px-2.5 py-1.5 font-semibold">Value</th>
                      <th className="px-2.5 py-1.5 font-semibold whitespace-nowrap">Start–end</th>
                    </tr>
                  </thead>
                  <tbody className="mono">
                    {groupRows.map((r) => (
                      <tr key={r.key} className={`bd border-t ${r.group.startsWith('0') ? '' : 't-muted'}`}>
                        <td className="px-2.5 py-1.5">{r.match}</td>
                        <td className="px-2.5 py-1.5 whitespace-nowrap">{r.group}</td>
                        <td className="max-w-[20rem] truncate px-2.5 py-1.5">{r.value === null ? <span className="t-faint">not matched</span> : r.value === '' ? <span className="t-faint">(empty)</span> : r.value}</td>
                        <td className="px-2.5 py-1.5 whitespace-nowrap">{r.start === null ? '—' : `${r.start}–${r.end}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="mt-3 space-y-3">
              <Input className="mono" value={replacement} onChange={(e) => setReplacement(e.target.value)} aria-label="Replacement" placeholder="$1, $<name>, $& (whole match), $$ (a literal $)" />
              <div className="flex justify-end">
                <CopyButton text={current && result?.replaced != null ? result.replaced : ''} onCopied={() => toast('Copied')} />
              </div>
              <CodeViewer code={current && result?.replaced != null ? result.replaced : ''} maxHeight="320px" placeholder="The replaced text appears here." ariaLabel="Replaced text" />
              <p className="t-faint text-xs">Without the g flag only the first match is replaced — the same as String.prototype.replace.</p>
            </div>
          )}
        </Panel>

        <div className="grid gap-4 lg:grid-cols-[3fr_2fr] [&>*]:min-w-0">
          <Panel title="Cheat sheet" description="Click a token to insert it at the cursor. With text selected, groups wrap the selection.">
            <div className="grid gap-4 sm:grid-cols-2">
              {CHEATSHEET.map(([group, tokens]) => (
                <div key={group}>
                  <h3 className="t-faint mb-1.5 text-[11px] font-semibold tracking-wider uppercase">{group}</h3>
                  <ul className="space-y-1">
                    {tokens.map(([tok, desc]) => (
                      <li key={tok}>
                        <button type="button" onClick={() => insert(tok)} className="hover-surface flex w-full items-baseline gap-2 rounded-md px-1.5 py-1 text-left text-xs">
                          <code className="mono tok-key shrink-0">{tok.replace('…', '')}</code>
                          <span className="t-muted">{desc}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="JavaScript, not PCRE">
            <div className="t-muted space-y-2 text-sm leading-relaxed">
              <p>Patterns run in your browser’s own JavaScript (ECMAScript) engine, so what matches here matches in Node, Deno and front-end code.</p>
              <p>PCRE (PHP, grep -P, nginx), Python and Java differ. JavaScript has no possessive quantifiers (a++), atomic groups (?&gt;…), recursion or \A and \Z anchors, and names groups (?&lt;name&gt;…) where Python uses (?P&lt;name&gt;…).</p>
              <p>POSIX classes such as [[:alpha:]] are not supported; use {'\\p{L}'} with the u flag.</p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
