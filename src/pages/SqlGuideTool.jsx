import { BookOpen } from 'lucide-react'
import { ENTRIES, CATEGORIES, KINDS, SAMPLE_SCHEMA } from '../lib/sqlref'
import GuidePage from '../components/GuidePage'

/**
 * The SQL catalogue rendered by the shared guide page. Everything this route
 * knows is in src/lib/sqlref.js — adding an entry there is the whole job.
 */
export default function SqlGuideTool() {
  return (
    <GuidePage
      icon={BookOpen}
      title="SQL Query Guide"
      subtitle={`${ENTRIES.length} searchable queries, patterns and gotchas — with runnable examples.`}
      accent="cyan"
      entries={ENTRIES}
      categories={CATEGORIES}
      kinds={KINDS}
      language="sql"
      searchPlaceholder="Search — join, duplicates, window, upsert, index, pagination…"
      searchLabel="Search the SQL guide"
      emptyTitle="Pick an entry"
      emptyDescription="Or search above — the list covers syntax, recipes and the traps."
      introText="Every example on this page runs against the same small schema, so they read as one database rather than a pile of unrelated snippets:"
      introCode={SAMPLE_SCHEMA}
      labels={{ variants: 'Dialect differences' }}
    />
  )
}
