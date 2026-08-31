import { Layers } from 'lucide-react'
import JsonToolPage from '../components/JsonToolPage'
import { flatten } from '../lib/jsonops'
import { Input } from '../components/ui'

export default function JsonFlatten() {
  return (
    <JsonToolPage
      icon={Layers}
      title="JSON Flattener"
      subtitle="Collapse nested objects into a single level of dot-notation keys."
      accent="teal"
      defaultOptions={{ delimiter: '.' }}
      controls={(o, set) => (
        <>
          <label className="t-muted text-xs">Delimiter</label>
          <Input className="w-24" value={o.delimiter} onChange={(e) => set({ ...o, delimiter: e.target.value || '.' })} />
          <span className="t-faint text-xs">Array items keep [index] notation.</span>
        </>
      )}
      transform={(v, o) => JSON.stringify(flatten(v, o.delimiter), null, 2)}
    />
  )
}
