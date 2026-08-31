import { useState } from 'react'
import { format } from 'sql-formatter'
import { Database, Wand2, Minimize2, Trash2 } from 'lucide-react'
import { useToast } from '../lib/toast'
import SplitPane from '../components/SplitPane'
import { Panel, Button, CopyButton, TextArea, ErrorBanner, OutputBlock, PageHeader, Select } from '../components/ui'

const SAMPLE = `select u.id, u.email, count(o.id) as order_count, sum(o.total) as lifetime_value from users u left join orders o on o.user_id = u.id where u.created_at >= '2026-01-01' and u.status = 'active' group by u.id, u.email having count(o.id) > 3 order by lifetime_value desc limit 50;`

const DIALECTS = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'spark', label: 'Spark SQL' },
  { value: 'redshift', label: 'Redshift' },
  { value: 'tsql', label: 'SQL Server (T-SQL)' },
  { value: 'plsql', label: 'Oracle (PL/SQL)' },
]

export default function SqlTool() {
  const [input, setInput] = useState(SAMPLE)
  const [dialect, setDialect] = useState('postgresql')
  const [keywordCase, setKeywordCase] = useState('upper')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const toast = useToast()

  function prettify() {
    try {
      setOutput(format(input, { language: dialect, keywordCase, tabWidth: 2 }))
      setError('')
      toast('SQL formatted')
    } catch (e) {
      setOutput('')
      setError(e.message)
      toast('Could not format SQL', 'error')
    }
  }

  function minify() {
    try {
      // Collapse whitespace outside of quoted string literals.
      const collapsed = input
        .replace(/--[^\n]*/g, ' ')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .split(/('(?:[^']|'')*')/)
        .map((chunk, i) => (i % 2 === 1 ? chunk : chunk.replace(/\s+/g, ' ')))
        .join('')
        .trim()
      setOutput(collapsed)
      setError('')
      toast('SQL minified')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <PageHeader icon={Database} title="SQL Formatter" subtitle="Pretty-print or minify queries across 11 dialects." accent="orange" />
      <div className="space-y-4 p-4 sm:p-6">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="t-muted text-xs">Dialect</label>
              <Select value={dialect} onChange={(e) => setDialect(e.target.value)}>
                {DIALECTS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="t-muted text-xs">Keywords</label>
              <Select value={keywordCase} onChange={(e) => setKeywordCase(e.target.value)}>
                <option value="upper">UPPERCASE</option>
                <option value="lower">lowercase</option>
                <option value="preserve">Preserve</option>
              </Select>
            </div>
            <Button onClick={prettify} type="button"><Wand2 className="h-3.5 w-3.5" />Format</Button>
            <Button variant="subtle" onClick={minify} type="button"><Minimize2 className="h-3.5 w-3.5" />Minify</Button>
            <Button variant="ghost" onClick={() => { setInput(''); setOutput(''); setError('') }} type="button">
              <Trash2 className="h-3.5 w-3.5" />Clear
            </Button>
          </div>
        </Panel>

        <SplitPane
          storageKey="devpocket-split-sql"
          left={
            <Panel title="Query">
              <TextArea rows={18} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste SQL here…" />
              <div className="mt-3">
                <ErrorBanner>{error}</ErrorBanner>
              </div>
            </Panel>
          }
          right={
            <Panel title="Formatted" actions={<CopyButton text={output} onCopied={() => toast('Copied to clipboard')} />}>
              <OutputBlock text={output} placeholder="Formatted SQL will appear here…" />
            </Panel>
          }
        />
      </div>
    </div>
  )
}
