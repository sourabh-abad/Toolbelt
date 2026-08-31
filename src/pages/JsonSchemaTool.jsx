import { FileJson } from 'lucide-react'
import JsonToolPage from '../components/JsonToolPage'
import { inferSchema } from '../lib/jsonops'

export default function JsonSchemaTool() {
  return (
    <JsonToolPage
      icon={FileJson}
      title="JSON Schema Generator"
      subtitle="Infer a draft 2020-12 JSON Schema from a sample payload."
      accent="orange"
      outputLabel="Generated schema"
      outputPlaceholder="Paste a sample payload — its schema appears here."
      transform={(v) => JSON.stringify(inferSchema(v), null, 2)}
    />
  )
}
